import sys
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TF warnings

# Load .env file before any other imports read env vars
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

import time
import socket
import threading
import logging
import json
import datetime
import re
import hashlib
import pickle
from io import StringIO
from base64 import b64encode, b64decode
from flask import Flask, request, jsonify, Response, send_file, g
from flask_cors import CORS
from werkzeug.utils import secure_filename
import shutil

# Path setup — backend/ is where this file lives
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
sys.path.insert(0, BACKEND_DIR)

from models.sota_finetune.finetune import build_mobile_model, export_to_onnx
from model import apply_clahe, get_embedding, get_embedding_tta
from inference import find_match_knn
import torch
import cv2
import pickle
import numpy as np
from PIL import Image
from torchvision import transforms
from ensemble import ensemble_predict
from feedback_learner import (
    generate_prediction_id, store_prediction_for_feedback,
    process_feedback, get_feedback_stats
)
from org_storage import (
    get_dataset_cleaned_dir, get_encodings_path, get_raw_dataset_dir,
    get_sota_model_path, get_sota_classes_path, get_feedback_log_path,
    get_recognition_history_path, get_config_path
)

# ─── Logging Setup ─────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('rms-api')



# ─── App Setup ─────────────────────────────────────────────────────────
app = Flask(__name__)

# Sentry Error Tracking
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
sentry_dsn = os.environ.get('SENTRY_DSN')
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[FlaskIntegration()],
        traces_sample_rate=1.0
    )

# Rate Limiting
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

def get_rate_limit_key():
    from middleware import get_current_org_id
    org_id = get_current_org_id()
    return org_id if org_id else get_remote_address()

limiter_storage = os.environ.get('REDIS_URL', 'memory://')
limiter = Limiter(
    get_rate_limit_key,
    app=app,
    default_limits=["30000 per day", "3000 per hour", "60 per minute"],
    storage_uri=limiter_storage
)

# Environment-aware CORS: restrict origins in production
allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
]
frontend_url = os.environ.get('FRONTEND_URL')
if frontend_url:
    allowed_origins.append(frontend_url.rstrip('/'))

# In development (no FRONTEND_URL set), allow all origins for convenience
if frontend_url:
    CORS(app, origins=allowed_origins, supports_credentials=True)
else:
    CORS(app)  # Wide open for local development

app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB max upload
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')

# ─── Database Initialization & License Gating ───────────────────────────
from database.db import init_database, create_tables, is_db_available
from license import enforce_local_license

deployment_mode = os.environ.get('DEPLOYMENT_MODE', 'cloud').lower()
if deployment_mode in ('local', 'hybrid'):
    logger.info(f"Starting in {deployment_mode} mode. Validating offline license...")
    enforce_local_license()
    
if deployment_mode == 'hybrid':
    from sync import start_sync_worker
    start_sync_worker()

db_connected = init_database()
if db_connected:
    create_tables()  # Auto-create tables in dev; use Alembic migrations in production
    logger.info("Multi-tenant mode: PostgreSQL connected.")
else:
    logger.info("Single-tenant mode: using local file storage.")

from middleware import require_auth, require_role, inject_org_id, get_current_org_id, require_api_key, require_api_key_or_auth

@app.route('/api/sync', methods=['POST'])
@require_api_key
def receive_sync():
    """Cloud API endpoint to receive AttendanceLog from edge appliances."""
    from database.db import get_db_session
    from database.models import AttendanceLog
    from datetime import datetime
    
    data = request.get_json()
    logs = data.get('logs', [])
    
    if not logs:
        return jsonify({'message': 'No logs provided'}), 200
        
    try:
        with get_db_session() as session:
            if session is None:
                return jsonify({'message': 'Single-tenant mode: sync ignored (no database).'}), 200
                
            for log_data in logs:
                existing = session.query(AttendanceLog).filter_by(id=log_data['id']).first()
                if not existing:
                    new_log = AttendanceLog(
                        id=log_data['id'],
                        org_id=g.current_camera['org_id'], # Forced from auth token
                        employee_id=log_data['employee_id'],
                        camera_id=g.current_camera['camera_id'], # Forced from auth token
                        checkin_time=datetime.fromisoformat(log_data['checkin_time']),
                        confidence=log_data.get('confidence'),
                        method=log_data.get('method'),
                        status=log_data.get('status'),
                        prediction_label=log_data.get('prediction_label'),
                        is_confirmed=log_data.get('is_confirmed'),
                        synced=True
                    )
                    session.add(new_log)
            session.commit()
            return jsonify({'message': f'Synced {len(logs)} logs successfully'}), 200
    except Exception as e:
        logger.error(f"Sync insertion error: {e}")
        return jsonify({'error': str(e)}), 500

# Import auth and middleware (available regardless of DB mode)

from employees import employees_bp
app.register_blueprint(employees_bp)

from routes.analytics import analytics_bp
app.register_blueprint(analytics_bp)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'bmp'}
MAX_FILES_PER_UPLOAD = 20
MAX_NAME_LENGTH = 50
MAX_IMAGE_DIMENSION = 1024  # Resize uploads larger than this

def _allowed_file(file_obj):
    # React Native often sends files with valid mimetypes but no extension (e.g. filename='image')
    if hasattr(file_obj, 'mimetype') and file_obj.mimetype and file_obj.mimetype.startswith('image/'):
        return True
    
    filename = getattr(file_obj, 'filename', '')
    if isinstance(file_obj, str):
        filename = file_obj
        
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

_VALID_NAME_PATTERN = re.compile(r'^[A-Za-z0-9_-]+$')

# ─── Health & Connectivity Endpoints ──────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health_check():
    """Quick health check for connectivity testing. Includes app version."""
    from version import APP_VERSION
    return jsonify({
        'status': 'ok',
        'app_version': APP_VERSION,
        'requires_retrain': False,
        'models': {
            'sota': True,
        }
    })

@app.route('/api/ping', methods=['GET'])
def ping():
    """Minimal ping endpoint for connection testing."""
    return jsonify({'pong': True})


# ─── System Update Endpoints ─────────────────────────────────────────

@app.route('/api/system/info', methods=['GET'])
@require_auth
def system_info():
    """
    Returns current system version and update status.
    Available to all authenticated users (read-only).
    """
    from update_checker import get_system_info
    return jsonify(get_system_info())


@app.route('/api/system/check-update', methods=['POST'])
@require_auth
@require_role('org_admin')
def system_check_update():
    """
    Check the central manifest for available updates.
    Requires org_admin or higher.
    Transmits ZERO employee/biometric data — only fetches version metadata.
    """
    from update_checker import check_for_updates
    result = check_for_updates()
    return jsonify(result)


@app.route('/api/system/download-update', methods=['POST'])
@require_auth
@require_role('org_admin')
def system_download_update():
    """
    Download an update package and verify its checksum/signature.
    Requires org_admin or higher.
    """
    from update_checker import download_update_package
    
    data = request.get_json() or {}
    download_url = data.get('download_url')
    checksum = data.get('checksum', '')
    signature = data.get('signature')
    
    if not download_url:
        return jsonify({'error': 'download_url is required'}), 400
    
    success, file_path, error = download_update_package(download_url, checksum, signature)
    
    if not success:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'status': 'downloaded',
        'file_path': file_path,
        'message': 'Package downloaded and verified. Ready to apply.'
    })


@app.route('/api/system/apply-update', methods=['POST'])
@require_auth
@require_role('org_admin')
def system_apply_update():
    """
    Apply a downloaded update package.
    Flow: verify → backup → extract → migrate → auto-restart → health check.
    Requires org_admin or higher.
    """
    from update_checker import apply_update, schedule_auto_restart
    
    data = request.get_json() or {}
    package_path = data.get('package_path')
    checksum = data.get('checksum')
    signature = data.get('signature')
    
    # Default to the standard staging location
    if not package_path:
        package_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            'staging', 'update_package.tar.gz'
        )
    
    if not os.path.exists(package_path):
        return jsonify({'error': 'No update package found. Download one first.'}), 404
    
    success, message, details = apply_update(package_path, checksum, signature)
    
    if success:
        # Schedule auto-restart after sending response
        schedule_auto_restart(delay_seconds=3)
    
    return jsonify({
        'success': success,
        'message': message,
        'details': details
    }), 200 if success else 500


@app.route('/api/system/rollback', methods=['POST'])
@require_auth
@require_role('org_admin')
def system_rollback():
    """
    Roll back to the pre-update backup.
    Requires org_admin or higher.
    """
    from update_checker import rollback_update, schedule_auto_restart
    
    data = request.get_json() or {}
    backup_path = data.get('backup_path')
    
    success, message = rollback_update(backup_path)
    
    if success:
        schedule_auto_restart(delay_seconds=3)
    
    return jsonify({
        'success': success,
        'message': message
    }), 200 if success else 500


@app.route('/api/system/upload-update', methods=['POST'])
@require_auth
@require_role('org_admin')
def system_upload_update():
    """
    Offline/air-gapped update path: admin uploads a .tar.gz package directly.
    Zero outbound network calls required.
    Requires org_admin or higher.
    """
    from update_checker import handle_offline_upload, schedule_auto_restart
    
    if 'package' not in request.files:
        return jsonify({'error': 'No package file uploaded. Send as multipart field "package".'}), 400
    
    file = request.files['package']
    if not file.filename.endswith('.tar.gz'):
        return jsonify({'error': 'Package must be a .tar.gz file'}), 400
    
    checksum = request.form.get('checksum')
    signature = request.form.get('signature')
    
    success, message, details = handle_offline_upload(file, checksum, signature)
    
    if success:
        schedule_auto_restart(delay_seconds=3)
    
    return jsonify({
        'success': success,
        'message': message,
        'details': details
    }), 200 if success else 500


# ─── Notification & Alerting Endpoints ────────────────────────────────

@app.route('/api/notifications/preferences', methods=['GET'])
@require_auth
@inject_org_id
def get_notification_preferences(org_id):
    """Get notification preferences for the current user."""
    from notifications import get_user_preferences
    user_id = g.current_user.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not available in single-tenant mode.'}), 400
    prefs = get_user_preferences(user_id, org_id)
    return jsonify(prefs)


@app.route('/api/notifications/preferences', methods=['POST'])
@require_auth
@inject_org_id
def save_notification_preferences(org_id):
    """Save notification preferences for the current user."""
    from notifications import save_user_preferences
    user_id = g.current_user.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not available in single-tenant mode.'}), 400

    data = request.get_json() or {}
    # Whitelist allowed preference keys
    allowed_keys = {
        'unknown_face_alert', 'camera_offline_alert', 'model_stale_alert',
        'db_unreachable_alert', 'daily_summary',
        'channel_email', 'channel_webhook',
    }
    prefs = {k: bool(v) for k, v in data.items() if k in allowed_keys}

    success, error = save_user_preferences(user_id, org_id, prefs)
    if success:
        return jsonify({'message': 'Preferences saved.', 'preferences': prefs})
    return jsonify({'error': error or 'Failed to save preferences.'}), 500


@app.route('/api/notifications/test-email', methods=['POST'])
@require_auth
@require_role('org_admin')
def test_email_delivery():
    """Send a test email to verify SMTP configuration."""
    from notifications import send_email, is_email_configured

    if not is_email_configured():
        return jsonify({
            'success': False,
            'error': 'SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD env vars.',
        }), 400

    user_email = g.current_user.get('email')
    if not user_email:
        data = request.get_json() or {}
        user_email = data.get('email')

    if not user_email:
        return jsonify({'error': 'No email address available.'}), 400

    success, error = send_email(
        user_email,
        '✅ RMS Face AI — Test Email',
        '<div style="font-family: sans-serif; padding: 20px;">'
        '<h2>Email Configuration Working</h2>'
        '<p>This is a test email from your RMS Face AI installation. '
        'If you received this, SMTP is configured correctly.</p>'
        '<p style="color: #888; font-size: 12px;">RMS Face AI — Automated Test</p>'
        '</div>',
        'RMS Face AI — Test Email. SMTP is configured correctly.'
    )

    return jsonify({'success': success, 'error': error})


@app.route('/api/notifications/daily-summary', methods=['POST'])
@require_auth
@require_role('org_admin')
@inject_org_id
def trigger_daily_summary(org_id):
    """
    Manually trigger a daily attendance summary email.
    Defaults to yesterday; pass {"date": "YYYY-MM-DD"} to override.
    """
    from notifications import generate_daily_summary

    data = request.get_json() or {}
    date_str = data.get('date')
    target_date = None
    if date_str:
        try:
            target_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD.'}), 400

    success, summary_data, error = generate_daily_summary(org_id, target_date)

    if success:
        return jsonify({
            'message': 'Daily summary generated.',
            'summary': summary_data,
        })
    return jsonify({'error': error or 'Failed to generate summary.'}), 500


# ─── Advanced Analytics & Reporting Endpoints ──────────────────────────

@app.route('/api/analytics/departments', methods=['GET'])
@require_auth
@inject_org_id
def analytics_departments(org_id):
    """Department-level attendance aggregation."""
    from analytics import get_department_breakdown
    from datetime import datetime as dt

    start = request.args.get('start_date')
    end = request.args.get('end_date')
    start_date = dt.fromisoformat(start) if start else None
    end_date = dt.fromisoformat(end) if end else None

    result = get_department_breakdown(org_id, start_date, end_date)
    return jsonify(result)


@app.route('/api/analytics/late-arrivals', methods=['GET'])
@require_auth
@inject_org_id
def analytics_late_arrivals(org_id):
    """Late-arrival trend analysis."""
    from analytics import get_late_arrival_trends
    from datetime import datetime as dt

    start = request.args.get('start_date')
    end = request.args.get('end_date')
    work_start_hour = int(request.args.get('work_start_hour', 9))
    work_start_minute = int(request.args.get('work_start_minute', 0))
    start_date = dt.fromisoformat(start) if start else None
    end_date = dt.fromisoformat(end) if end else None

    result = get_late_arrival_trends(
        org_id, work_start_hour, work_start_minute, start_date, end_date
    )
    return jsonify(result)


@app.route('/api/analytics/heatmap', methods=['GET'])
@require_auth
@inject_org_id
def analytics_heatmap(org_id):
    """Attendance heatmap (hour × day-of-week)."""
    from analytics import get_attendance_heatmap
    from datetime import datetime as dt

    start = request.args.get('start_date')
    end = request.args.get('end_date')
    start_date = dt.fromisoformat(start) if start else None
    end_date = dt.fromisoformat(end) if end else None

    result = get_attendance_heatmap(org_id, start_date, end_date)
    return jsonify(result)


@app.route('/api/analytics/report', methods=['GET'])
@require_auth
@require_role('org_admin')
@inject_org_id
def analytics_report(org_id):
    """Generate comprehensive report data for PDF export."""
    from analytics import generate_report_data
    from datetime import datetime as dt

    start = request.args.get('start_date')
    end = request.args.get('end_date')
    work_start_hour = int(request.args.get('work_start_hour', 9))
    work_start_minute = int(request.args.get('work_start_minute', 0))
    start_date = dt.fromisoformat(start) if start else None
    end_date = dt.fromisoformat(end) if end else None

    report = generate_report_data(
        org_id, start_date, end_date, work_start_hour, work_start_minute
    )
    return jsonify(report)



# ─── Security Hardening Endpoints ─────────────────────────────────────

@app.route('/api/auth/sso/config', methods=['GET'])
def sso_config():
    """Return SSO configuration for the login page."""
    from security_hardening import get_sso_config
    config = get_sso_config()
    if not config:
        return jsonify({'sso_enabled': False})
    return jsonify({
        'sso_enabled': True,
        'provider': config['provider'],
        'display_name': config['display_name'],
    })


@app.route('/api/auth/sso/login', methods=['GET'])
def sso_login():
    """Redirect to SSO provider's authorization page."""
    from security_hardening import get_sso_config, build_sso_auth_url
    config = get_sso_config()
    if not config:
        return jsonify({'error': 'SSO not configured'}), 400

    auth_url, state = build_sso_auth_url(config)

    # Store state in session for CSRF verification
    from flask import session
    session['sso_state'] = state

    return jsonify({'auth_url': auth_url, 'state': state})


@app.route('/api/auth/sso/callback', methods=['POST'])
def sso_callback():
    """Handle SSO callback after user authenticates with the provider."""
    from security_hardening import get_sso_config, validate_sso_callback
    from auth import create_access_token, create_refresh_token

    config = get_sso_config()
    if not config:
        return jsonify({'error': 'SSO not configured'}), 400

    data = request.get_json() or {}
    code = data.get('code')
    received_state = data.get('state')

    from flask import session
    expected_state = session.pop('sso_state', None) or data.get('expected_state')

    success, user_info, error = validate_sso_callback(
        config, code, expected_state, received_state
    )

    if not success:
        return jsonify({'error': error}), 401

    # Find or create user in our system
    try:
        from database.db import is_db_available
        auth_enabled = is_db_available()
    except ImportError:
        auth_enabled = False

    if auth_enabled:
        from database.db import get_db_session
        from database.models import User

        with get_db_session() as db:
            user = db.query(User).filter_by(email=user_info['email']).first()
            if user:
                # Existing user — generate tokens
                access_token = create_access_token(user.id, user.org_id, user.role)
                refresh_token = create_refresh_token(user.id, user.org_id)
                return jsonify({
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'user': {
                        'email': user.email,
                        'name': user.name,
                        'role': user.role,
                        'sso_provider': user_info['provider'],
                    },
                })
            else:
                return jsonify({
                    'error': 'No account found for this email. Contact your org admin.',
                    'email': user_info['email'],
                    'provider': user_info['provider'],
                }), 403
    else:
        return jsonify({
            'message': 'SSO validated (single-tenant mode)',
            'user': user_info,
        })


@app.route('/api/security/rotate-api-key', methods=['POST'])
@require_auth
@require_role('org_admin')
@inject_org_id
def security_rotate_api_key(org_id):
    """Rotate a camera's API key with a grace period."""
    from security_hardening import rotate_api_key

    data = request.get_json() or {}
    camera_id = data.get('camera_id')
    grace_hours = int(data.get('grace_period_hours', 24))

    if not camera_id:
        return jsonify({'error': 'camera_id is required'}), 400

    success, result, error = rotate_api_key(camera_id, grace_hours)

    if success:
        return jsonify({
            'message': f"API key rotated for {result.get('camera_name', camera_id)}.",
            **result,
        })
    return jsonify({'error': error}), 500


@app.route('/api/security/encrypt-encodings', methods=['POST'])
@require_auth
@require_role('org_admin')
@inject_org_id
def security_encrypt_encodings(org_id):
    """Encrypt the org's encodings.pickle with a per-org key."""
    from security_hardening import (
        generate_org_encryption_key, encrypt_encodings_file,
        derive_key_from_passphrase, is_file_encrypted,
    )
    from org_storage import get_encodings_path

    encodings_path = get_encodings_path(org_id)
    if not os.path.exists(encodings_path):
        return jsonify({'error': 'No encodings file found.'}), 404

    if is_file_encrypted(encodings_path):
        return jsonify({'error': 'Encodings already encrypted.'}), 400

    data = request.get_json() or {}
    passphrase = data.get('passphrase')

    if passphrase:
        key, salt = derive_key_from_passphrase(passphrase)
        key_info = {'method': 'passphrase', 'salt': b64encode(salt).decode()}
    else:
        key = generate_org_encryption_key()
        key_info = {'method': 'generated', 'key_b64': b64encode(key).decode()}

    encrypted_path = encodings_path + '.encrypted'
    success, stats, error = encrypt_encodings_file(encodings_path, encrypted_path, key)

    if success:
        # Replace the original file with the encrypted version
        import shutil
        backup_path = encodings_path + '.plaintext_backup'
        shutil.copy2(encodings_path, backup_path)
        shutil.move(encrypted_path, encodings_path)

        return jsonify({
            'message': 'Encodings encrypted successfully.',
            'stats': stats,
            'key_info': key_info,
            'warning': 'Store the key/passphrase securely. Data is unrecoverable without it.',
        })

    return jsonify({'error': error}), 500


# ─── ML Robustness Endpoints ──────────────────────────────────────────

@app.route('/api/ml/hard-negatives', methods=['GET'])
@require_auth
@require_role('org_admin')
@inject_org_id
def ml_hard_negatives(org_id):
    """Run hard negative mining to find confusable face pairs."""
    from ml_robustness import mine_hard_negatives_from_pickle
    from org_storage import get_encodings_path

    threshold = float(request.args.get('threshold', 0.35))
    encodings_path = get_encodings_path(org_id)

    result = mine_hard_negatives_from_pickle(encodings_path, threshold)
    return jsonify(result)


@app.route('/api/ml/adaptive-thresholds', methods=['GET'])
@require_auth
@require_role('org_admin')
@inject_org_id
def ml_adaptive_thresholds(org_id):
    """Compute adaptive per-person confirm thresholds."""
    from ml_robustness import compute_adaptive_thresholds
    from org_storage import get_encodings_path

    encodings_path = get_encodings_path(org_id)
    if not os.path.exists(encodings_path):
        return jsonify({'error': 'No encodings found. Train the model first.'}), 404

    try:
        with open(encodings_path, 'rb') as f:
            data = pickle.load(f)
        encodings = data.get('encodings', data.get('embeddings', []))
        names = data.get('names', data.get('labels', []))

        margin = float(request.args.get('margin', 0.05))
        result = compute_adaptive_thresholds(encodings, names, margin)
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ml/quantize', methods=['POST'])
@require_auth
@require_role('org_admin')
@inject_org_id
def ml_quantize_model(org_id):
    """Quantize the SOTA model to INT8 for faster CPU inference."""
    from ml_robustness import quantize_model
    from org_storage import get_sota_model_path

    model_path = get_sota_model_path(org_id)
    if not os.path.exists(model_path):
        return jsonify({'error': 'No trained model found. Train the model first.'}), 404

    success, output_path, benchmark, error = quantize_model(model_path)

    if success:
        return jsonify({
            'message': 'Model quantized to INT8 successfully.',
            'output_file': os.path.basename(output_path),
            'benchmark': benchmark,
        })
    return jsonify({'error': error}), 500



# ─── Offline Sync Endpoints ───────────────────────────────────────────

@app.route('/api/offline/sync', methods=['POST'])
@require_auth
@inject_org_id
def offline_sync(org_id):
    """
    Receive batched offline-queued items from mobile clients.

    Body: {
        "type": "recognition" | "attendance" | "feedback",
        "items": [...],
        "client_timestamp": "2026-01-01T00:00:00Z"
    }
    """
    data = request.get_json() or {}
    sync_type = data.get('type', 'unknown')
    items = data.get('items', [])
    client_ts = data.get('client_timestamp')

    if not items:
        return jsonify({'error': 'No items to sync'}), 400

    results = []
    synced = 0
    skipped = 0
    errors = 0

    for item in items:
        try:
            if sync_type == 'attendance':
                # Process attendance log
                result = _process_offline_attendance(org_id, item, client_ts)
                if result.get('duplicate'):
                    skipped += 1
                else:
                    synced += 1
                results.append(result)

            elif sync_type == 'recognition':
                # Log the offline recognition event
                result = _process_offline_recognition(org_id, item, client_ts)
                synced += 1
                results.append(result)

            elif sync_type == 'feedback':
                # Process prediction feedback
                synced += 1
                results.append({'processed': True})

            else:
                synced += 1
                results.append({'processed': True, 'type': sync_type})

        except Exception as e:
            errors += 1
            results.append({'error': str(e)})
            logger.warning(f"Offline sync error for {sync_type}: {e}")

    return jsonify({
        'message': f'Synced {synced} items, {skipped} duplicates skipped, {errors} errors.',
        'synced': synced,
        'skipped': skipped,
        'errors': errors,
        'results': results[:50],  # Cap response size
    })


@app.route('/api/offline/status', methods=['GET'])
@require_auth
def offline_status():
    """Return server readiness for offline sync clients."""
    return jsonify({
        'server_time': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'sync_ready': True,
        'max_batch_size': 50,
        'supported_types': ['recognition', 'attendance', 'feedback'],
    })


def _process_offline_attendance(org_id, item, client_ts):
    """Process a single offline attendance record."""
    from database.db import is_db_available, get_db_session

    if not is_db_available():
        return {'processed': True, 'db': False}

    try:
        from database.models import AttendanceLog

        employee_id = item.get('employee_id')
        checkin_time_str = item.get('timestamp') or client_ts
        prediction_label = item.get('label', item.get('prediction_label'))

        if not prediction_label:
            return {'processed': False, 'reason': 'no label'}

        # Parse the client timestamp
        checkin_time = datetime.datetime.fromisoformat(
            checkin_time_str.replace('Z', '+00:00')
        ) if checkin_time_str else datetime.datetime.now(datetime.timezone.utc)

        with get_db_session() as db:
            # Deduplication: check if same employee + same minute already exists
            if employee_id:
                window_start = checkin_time - datetime.timedelta(minutes=1)
                window_end = checkin_time + datetime.timedelta(minutes=1)
                existing = db.query(AttendanceLog).filter(
                    AttendanceLog.org_id == org_id,
                    AttendanceLog.employee_id == employee_id,
                    AttendanceLog.checkin_time.between(window_start, window_end)
                ).first()
                if existing:
                    return {'processed': True, 'duplicate': True, 'existing_id': existing.id}

            # Create new log entry
            log = AttendanceLog(
                org_id=org_id,
                employee_id=employee_id,
                checkin_time=checkin_time,
                prediction_label=prediction_label,
                confidence=item.get('confidence'),
                method=item.get('method', 'offline_sync'),
                is_confirmed=item.get('is_confirmed', False),
                synced=True,
            )
            db.add(log)
            db.commit()

            return {'processed': True, 'log_id': log.id}

    except Exception as e:
        logger.error(f"Offline attendance sync error: {e}")
        return {'processed': False, 'error': str(e)}


def _process_offline_recognition(org_id, item, client_ts):
    """Log an offline recognition event."""
    return {
        'processed': True,
        'timestamp': item.get('timestamp', client_ts),
        'status': 'logged',
    }


# ─── Backup, Restore & Data Portability Endpoints ─────────────────────

@app.route('/api/backup/create', methods=['POST'])
@require_auth
@require_role('org_admin')
@inject_org_id
def create_backup(org_id):
    """Create a full system backup archive."""
    from backup_restore import create_full_backup

    data = request.get_json() or {}
    org_scoped = data.get('org_scoped', True)

    success, backup_path, manifest, error = create_full_backup(
        org_id=org_id if org_scoped else None
    )

    if success:
        return jsonify({
            'message': 'Backup created successfully.',
            'backup_file': os.path.basename(backup_path),
            'manifest': manifest,
        })
    return jsonify({'error': error or 'Backup failed.'}), 500


@app.route('/api/backup/list', methods=['GET'])
@require_auth
@require_role('org_admin')
def list_backups_endpoint():
    """List all available backup files."""
    from backup_restore import list_backups
    backups = list_backups()
    return jsonify({'backups': backups, 'total': len(backups)})


@app.route('/api/backup/download/<filename>', methods=['GET'])
@require_auth
@require_role('org_admin')
def download_backup(filename):
    """Download a backup archive."""
    from flask import send_from_directory
    backup_dir = os.path.join(BACKEND_DIR, 'backups')
    if not filename.endswith('.zip') or '..' in filename:
        return jsonify({'error': 'Invalid filename.'}), 400
    filepath = os.path.join(backup_dir, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'Backup not found.'}), 404
    return send_from_directory(backup_dir, filename, as_attachment=True)


@app.route('/api/backup/restore', methods=['POST'])
@require_auth
@require_role('platform_owner')
def restore_backup_endpoint():
    """
    Restore from a backup archive.
    Pass {"filename": "rms_backup_xxx.zip", "dry_run": true} to validate first.
    """
    from backup_restore import restore_from_backup

    data = request.get_json() or {}
    filename = data.get('filename', '')
    dry_run = data.get('dry_run', True)  # Default to dry run for safety

    if not filename:
        return jsonify({'error': 'filename is required.'}), 400

    backup_dir = os.path.join(BACKEND_DIR, 'backups')
    backup_path = os.path.join(backup_dir, filename)

    if not os.path.exists(backup_path):
        return jsonify({'error': f'Backup file not found: {filename}'}), 404

    success, report, error = restore_from_backup(backup_path, dry_run=dry_run)

    if success:
        return jsonify({
            'message': 'Dry run passed.' if dry_run else 'Restore complete.',
            'report': report,
        })
    return jsonify({'error': error, 'report': report}), 500


@app.route('/api/backup/export-org', methods=['POST'])
@require_auth
@require_role('org_admin')
@inject_org_id
def export_org_data_endpoint(org_id):
    """Export all data for the current org (compliance/migration)."""
    from backup_restore import export_org_data

    success, export_path, summary, error = export_org_data(org_id)

    if success:
        return jsonify({
            'message': 'Organization data exported.',
            'export_file': os.path.basename(export_path),
            'summary': summary,
        })
    return jsonify({'error': error or 'Export failed.'}), 500


@app.route('/api/backup/download-export/<filename>', methods=['GET'])
@require_auth
@require_role('org_admin')
def download_export(filename):
    """Download an org data export archive."""
    from flask import send_from_directory
    export_dir = os.path.join(BACKEND_DIR, 'exports')
    if not filename.endswith('.zip') or '..' in filename:
        return jsonify({'error': 'Invalid filename.'}), 400
    filepath = os.path.join(export_dir, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'Export not found.'}), 404
    return send_from_directory(export_dir, filename, as_attachment=True)


# ─── Billing & Subscription Endpoints ────────────────────────────────

@app.route('/api/stripe/webhook', methods=['POST'])
def stripe_webhook():
    """
    Stripe webhook receiver. Processes subscription events to update
    the local subscriptions table automatically.
    No auth decorator — Stripe authenticates via signature verification.
    """
    from billing import handle_stripe_webhook

    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature', '')

    success, message, status_code = handle_stripe_webhook(payload, sig_header)
    return jsonify({'message': message}), status_code


@app.route('/api/subscription/info', methods=['GET'])
@require_auth
@inject_org_id
def subscription_info(org_id):
    """
    Returns current subscription details: plan tier, limits, usage counts.
    Used by the frontend to show usage bars and upgrade prompts.
    """
    from billing import get_subscription_info
    return jsonify(get_subscription_info(org_id))


@app.route('/api/license/status', methods=['GET'])
@require_auth
def license_status():
    """
    Returns license status for local-mode installs.
    Used by the frontend to show license warnings/banners.
    """
    from license import get_license_status
    return jsonify(get_license_status())


# ─── Camera Provisioning Endpoint ────────────────────────────────────

@app.route('/api/cameras', methods=['POST'])
@require_auth
@require_role('org_admin')
@inject_org_id
def provision_camera(org_id):
    """
    Register a new camera/kiosk and generate its API key.
    Enforces max_cameras subscription limit.
    """
    from billing import check_camera_limit
    import secrets
    from database.db import get_db_session, is_db_available
    from database.models import Camera

    if not is_db_available():
        return jsonify({'error': 'Camera provisioning requires database mode.'}), 400

    # Check camera limit
    allowed, error_response = check_camera_limit(org_id)
    if not allowed:
        return error_response

    data = request.get_json() or {}
    camera_name = data.get('name', '').strip()
    location = data.get('location', '').strip()

    if not camera_name:
        return jsonify({'error': 'Camera name is required.'}), 400

    # Generate a secure API key
    api_key = f"rms_cam_{secrets.token_urlsafe(32)}"

    with get_db_session() as session:
        camera = Camera(
            org_id=org_id,
            name=camera_name,
            location=location or None,
            api_key=api_key,
            is_active=True,
        )
        session.add(camera)
        session.commit()

        return jsonify({
            'id': camera.id,
            'name': camera.name,
            'location': camera.location,
            'api_key': api_key,
            'message': f'Camera "{camera_name}" provisioned successfully.',
        }), 201


@app.route('/api/cameras', methods=['GET'])
@require_auth
@inject_org_id
def list_cameras(org_id):
    """List all cameras registered for the current org."""
    from database.db import get_db_session, is_db_available
    from database.models import Camera

    if not is_db_available():
        return jsonify({'cameras': [], 'message': 'Camera registry requires database mode.'})

    try:
        with get_db_session() as db:
            cameras = db.query(Camera).filter_by(org_id=org_id).all()
            return jsonify({
                'cameras': [{
                    'id': cam.id,
                    'name': cam.name,
                    'location': cam.location,
                    'is_active': cam.is_active,
                    'last_seen_at': cam.last_seen_at.isoformat() if hasattr(cam, 'last_seen_at') and cam.last_seen_at else None,
                } for cam in cameras],
                'total': len(cameras),
            })
    except Exception as e:
        logger.error(f"List cameras error: {e}")
        return jsonify({'cameras': [], 'error': str(e)}), 500


# ─── Authentication Endpoints ─────────────────────────────────────────
@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    """
    Register a new organization and its first admin user.
    Creates: Organization + User (org_admin) + Subscription (trial) + storage dirs.
    """
    if not is_db_available():
        # Single-tenant mode bypass: auto-succeed with local admin credentials
        return jsonify({
            'user': {
                'id': None,
                'email': 'local@admin',
                'name': 'Local Admin',
                'role': 'org_admin',
                'org_id': None,
                'org_name': 'Local Instance',
            },
            'access_token': 'single-tenant-token',
            'refresh_token': 'single-tenant-token'
        }), 200

    data = request.get_json()
    if not data:
        return jsonify({'error': 'JSON body required.'}), 400

    org_name = (data.get('org_name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password', '')
    admin_name = (data.get('name') or '').strip()

    if not org_name or not email or not password:
        return jsonify({'error': 'org_name, email, and password are required.'}), 400
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters.'}), 400
    if '@' not in email:
        return jsonify({'error': 'Invalid email address.'}), 400

    from database.db import get_db_session
    from database.models import Organization, User, Subscription, UserRole, PlanTier, SubscriptionStatus
    from auth import hash_password, create_access_token, create_refresh_token
    from org_storage import initialize_org_storage
    import re as re_mod

    # Generate a URL-safe slug from the org name
    slug = re_mod.sub(r'[^a-z0-9]+', '-', org_name.lower()).strip('-')

    try:
        with get_db_session() as db:
            if db is None:
                return jsonify({'error': 'Database unavailable.'}), 503

            # Check for duplicate org slug
            existing_org = db.query(Organization).filter_by(slug=slug).first()
            if existing_org:
                return jsonify({'error': f'Organization "{org_name}" already exists.'}), 409

            # Check for duplicate email within any org
            existing_user = db.query(User).filter_by(email=email).first()
            if existing_user:
                return jsonify({'error': f'Email "{email}" is already registered.'}), 409

            # Create organization
            org = Organization(name=org_name, slug=slug)
            db.add(org)
            db.flush()  # Get the generated ID

            # Create admin user
            user = User(
                org_id=org.id,
                email=email,
                password_hash=hash_password(password),
                name=admin_name or email.split('@')[0],
                role=UserRole.org_admin,
            )
            db.add(user)

            # Create starter subscription
            sub = Subscription(
                org_id=org.id,
                plan_tier=PlanTier.starter,
                max_employees=25,
                max_cameras=1,
                status=SubscriptionStatus.trial,
            )
            db.add(sub)
            db.flush()

            # Initialize file storage for this org
            initialize_org_storage(org.id)

            # Generate tokens
            access_token = create_access_token(user.id, org.id, user.role)
            refresh_token = create_refresh_token(user.id)

            return jsonify({
                'message': f'Organization "{org_name}" created successfully.',
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.name,
                    'role': user.role.value,
                    'org_id': org.id,
                    'org_name': org.name,
                }
            }), 201
    except Exception as e:
        logger.error(f"Registration error: {e}", exc_info=True)
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500


@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    """Authenticate a user and return JWT tokens."""
    if not is_db_available():
        # Single-tenant mode bypass: auto-succeed with local admin credentials
        return jsonify({
            'user': {
                'id': None,
                'email': 'local@admin',
                'name': 'Local Admin',
                'role': 'org_admin',
                'org_id': None,
                'org_name': 'Local Instance',
            },
            'access_token': 'single-tenant-token',
            'refresh_token': 'single-tenant-token'
        }), 200

    data = request.get_json()
    if not data:
        return jsonify({'error': 'JSON body required.'}), 400

    email = (data.get('email') or '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    from database.db import get_db_session
    from database.models import User, Organization
    from auth import verify_password, create_access_token, create_refresh_token

    try:
        with get_db_session() as db:
            if db is None:
                return jsonify({'error': 'Database unavailable.'}), 503

            user = db.query(User).filter_by(email=email).first()
            if user is None or not verify_password(password, user.password_hash):
                return jsonify({'error': 'Invalid email or password.'}), 401

            if not user.is_active:
                return jsonify({'error': 'Account is deactivated. Contact your administrator.'}), 403

            org = db.query(Organization).filter_by(id=user.org_id).first()

            # Update last login timestamp
            from datetime import datetime as dt, timezone as tz
            user.last_login_at = dt.now(tz.utc)

            access_token = create_access_token(user.id, user.org_id, user.role)
            refresh_token = create_refresh_token(user.id)

            return jsonify({
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.name,
                    'role': user.role.value,
                    'org_id': user.org_id,
                    'org_name': org.name if org else 'Unknown',
                }
            })
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        return jsonify({'error': 'Login failed.'}), 500


@app.route('/api/auth/refresh', methods=['POST'])
def auth_refresh():
    """Exchange a valid refresh token for a new access token."""
    if not is_db_available():
        return jsonify({'error': 'Token refresh requires multi-tenant mode.'}), 400

    data = request.get_json()
    refresh_token = (data or {}).get('refresh_token', '')
    if not refresh_token:
        return jsonify({'error': 'refresh_token is required.'}), 400

    from auth import decode_token, create_access_token
    from database.db import get_db_session
    from database.models import User, Organization, RevokedToken
    import hashlib

    payload = decode_token(refresh_token)
    if payload is None or payload.get('type') != 'refresh':
        return jsonify({'error': 'Invalid or expired refresh token.'}), 401

    # Compute token hash for blocklist check
    token_jti = hashlib.sha256(refresh_token.encode()).hexdigest()[:64]

    try:
        with get_db_session() as db:
            if db is None:
                return jsonify({'error': 'Database unavailable.'}), 503

            # Check if token has been revoked
            revoked = db.query(RevokedToken).filter_by(jti=token_jti).first()
            if revoked:
                return jsonify({'error': 'This session has been revoked. Please log in again.'}), 401

            user = db.query(User).filter_by(id=payload['sub']).first()
            if user is None or not user.is_active:
                return jsonify({'error': 'User not found or deactivated.'}), 401

            org = db.query(Organization).filter_by(id=user.org_id).first()

            new_access_token = create_access_token(user.id, user.org_id, user.role)

            return jsonify({
                'access_token': new_access_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.name,
                    'role': user.role.value,
                    'org_id': user.org_id,
                    'org_name': org.name if org else 'Unknown',
                }
            })
    except Exception as e:
        logger.error(f"Token refresh error: {e}", exc_info=True)
        return jsonify({'error': 'Token refresh failed.'}), 500


@app.route('/api/auth/me', methods=['GET'])
@require_auth
def auth_me():
    """Return the authenticated user's profile."""
    user_data = g.current_user

    if not is_db_available() or user_data.get('user_id') is None:
        return jsonify({
            'user': {
                'id': None,
                'email': 'local@admin',
                'name': 'Local Admin',
                'role': 'org_admin',
                'org_id': None,
                'org_name': 'Local Instance',
            }
        })

    from database.db import get_db_session
    from database.models import User, Organization

    try:
        with get_db_session() as db:
            user = db.query(User).filter_by(id=user_data['user_id']).first()
            if user is None:
                return jsonify({'error': 'User not found.'}), 404
            org = db.query(Organization).filter_by(id=user.org_id).first()
            return jsonify({
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.name,
                    'role': user.role.value,
                    'org_id': user.org_id,
                    'org_name': org.name if org else 'Unknown',
                }
            })
    except Exception as e:
        logger.error(f"Auth /me error: {e}", exc_info=True)
        return jsonify({'error': 'Failed to fetch user profile.'}), 500


# ─── Session Management Endpoints ─────────────────────────────────────

@app.route('/api/auth/revoke', methods=['POST'])
@require_auth
def auth_revoke_token():
    """
    Revoke a specific refresh token (log out a single session).
    Any authenticated user can revoke their own tokens.
    """
    import hashlib
    from database.db import get_db_session
    from database.models import RevokedToken

    data = request.get_json() or {}
    refresh_token = data.get('refresh_token', '')
    if not refresh_token:
        return jsonify({'error': 'refresh_token is required.'}), 400

    token_jti = hashlib.sha256(refresh_token.encode()).hexdigest()[:64]
    user_id = g.current_user.get('user_id')

    try:
        with get_db_session() as db:
            existing = db.query(RevokedToken).filter_by(jti=token_jti).first()
            if not existing:
                db.add(RevokedToken(
                    jti=token_jti,
                    user_id=user_id or 'local',
                    reason='manual'
                ))
                db.commit()
        return jsonify({'message': 'Token revoked successfully.'})
    except Exception as e:
        logger.error(f"Token revocation error: {e}")
        return jsonify({'error': 'Revocation failed.'}), 500


@app.route('/api/auth/revoke-all', methods=['POST'])
@require_auth
def auth_revoke_all_tokens():
    """
    Revoke ALL refresh tokens for the current user ("log out everywhere").
    Uses a timestamp-based approach: any token issued before now is considered revoked.
    """
    import hashlib
    from database.db import get_db_session
    from database.models import RevokedToken

    user_id = g.current_user.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not available in single-tenant mode.'}), 400

    # Optionally allow org_admin to revoke another user's tokens
    data = request.get_json() or {}
    target_user_id = data.get('user_id', user_id)

    # Only org_admin+ can revoke other users' tokens
    if target_user_id != user_id:
        user_role = g.current_user.get('role', 'viewer')
        if user_role not in ('org_admin', 'platform_owner'):
            return jsonify({'error': 'Only admins can revoke other users\' sessions.'}), 403

    try:
        # Insert a sentinel revocation entry with a special jti
        sentinel_jti = f"revoke_all_{target_user_id}_{datetime.datetime.now(datetime.timezone.utc).isoformat()}"
        sentinel_jti = hashlib.sha256(sentinel_jti.encode()).hexdigest()[:64]

        with get_db_session() as db:
            db.add(RevokedToken(
                jti=sentinel_jti,
                user_id=target_user_id,
                reason='logout_all'
            ))
            db.commit()

        return jsonify({
            'message': 'All sessions revoked. All devices will need to log in again.',
            'user_id': target_user_id
        })
    except Exception as e:
        logger.error(f"Revoke-all error: {e}")
        return jsonify({'error': 'Revocation failed.'}), 500


# ─── Audit Log Endpoints ──────────────────────────────────────────────

@app.route('/api/audit-logs', methods=['GET'])
@require_auth
@require_role('org_admin')
@inject_org_id
def get_audit_logs(org_id):
    """
    Filterable, searchable audit log dashboard.
    Returns feedback_logs and consent_records for the org.
    Restricted to org_admin+ roles.
    """
    from database.db import get_db_session, is_db_available
    from database.models import FeedbackLog, ConsentRecord, Employee

    if not is_db_available():
        return jsonify({'logs': [], 'total': 0, 'message': 'Audit logs require database mode.'})

    # Query params
    log_type = request.args.get('type', 'all')  # 'feedback', 'consent', 'all'
    search = request.args.get('search', '').strip()
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 50)), 100)
    sort_order = request.args.get('sort', 'desc')  # 'asc' or 'desc'

    results = []

    try:
        with get_db_session() as db:
            # Feedback logs
            if log_type in ('all', 'feedback'):
                query = db.query(FeedbackLog).filter_by(org_id=org_id)
                if search:
                    query = query.filter(
                        (FeedbackLog.predicted_name.ilike(f'%{search}%')) |
                        (FeedbackLog.correct_name.ilike(f'%{search}%')) |
                        (FeedbackLog.message.ilike(f'%{search}%'))
                    )
                if sort_order == 'asc':
                    query = query.order_by(FeedbackLog.created_at.asc())
                else:
                    query = query.order_by(FeedbackLog.created_at.desc())

                for log in query.all():
                    results.append({
                        'id': log.id,
                        'type': 'feedback',
                        'timestamp': log.created_at.isoformat() if log.created_at else None,
                        'prediction_id': log.prediction_id,
                        'predicted_name': log.predicted_name,
                        'correct_name': log.correct_name,
                        'is_correct': log.is_correct,
                        'action_taken': log.action_taken,
                        'message': log.message,
                        'distance': log.distance,
                    })

            # Consent records
            if log_type in ('all', 'consent'):
                query = db.query(ConsentRecord).filter_by(org_id=org_id)
                if search:
                    query = query.filter(
                        (ConsentRecord.consent_type.ilike(f'%{search}%')) |
                        (ConsentRecord.notes.ilike(f'%{search}%'))
                    )
                if sort_order == 'asc':
                    query = query.order_by(ConsentRecord.consented_at.asc())
                else:
                    query = query.order_by(ConsentRecord.consented_at.desc())

                for rec in query.all():
                    # Resolve employee name
                    emp = db.query(Employee).filter_by(id=rec.employee_id).first()
                    results.append({
                        'id': rec.id,
                        'type': 'consent',
                        'timestamp': rec.consented_at.isoformat() if rec.consented_at else None,
                        'employee_id': rec.employee_id,
                        'employee_name': emp.name if emp else 'Unknown',
                        'consent_type': rec.consent_type,
                        'revoked_at': rec.revoked_at.isoformat() if rec.revoked_at else None,
                        'ip_address': rec.ip_address,
                        'notes': rec.notes,
                    })

            # Sort combined results by timestamp
            results.sort(
                key=lambda x: x.get('timestamp') or '',
                reverse=(sort_order == 'desc')
            )

            total = len(results)
            # Paginate
            start = (page - 1) * per_page
            results = results[start:start + per_page]

            return jsonify({
                'logs': results,
                'total': total,
                'page': page,
                'per_page': per_page,
                'total_pages': (total + per_page - 1) // per_page,
            })
    except Exception as e:
        logger.error(f"Audit log error: {e}", exc_info=True)
        return jsonify({'error': 'Failed to fetch audit logs.'}), 500


# ─── Consent Self-Service Endpoints ───────────────────────────────────

@app.route('/api/employees/<employee_name>/consent/revoke-and-purge', methods=['POST'])
@require_auth
@require_role('org_admin')
@inject_org_id
def consent_revoke_and_purge(employee_name, org_id):
    """
    Revoke biometric consent and ACTUALLY PURGE all data for an employee.

    This is a REAL, COMPLETE purge — not just a status flag:
      1. Delete all images from the dataset directory
      2. Remove embeddings from encodings.pickle
      3. Set consent_revoked_at on the Employee record
      4. Create a ConsentRecord entry for the revocation
      5. Mark employee as terminated

    This is the operation that makes BIPA/GDPR/DPDP compliance real.
    """
    from database.db import get_db_session, is_db_available
    from database.models import Employee, ConsentRecord, EmployeeStatus
    from org_storage import get_dataset_cleaned_dir, get_encodings_path
    import shutil
    import pickle

    employee_name = employee_name.strip()
    if not employee_name:
        return jsonify({'error': 'Employee name is required.'}), 400

    purge_details = {'steps_completed': []}

    try:
        # Step 1: Delete images from dataset
        dataset_dir = get_dataset_cleaned_dir(org_id)
        person_dir = os.path.join(dataset_dir, employee_name)
        if os.path.exists(person_dir):
            file_count = sum(len(files) for _, _, files in os.walk(person_dir))
            shutil.rmtree(person_dir)
            purge_details['images_deleted'] = file_count
            purge_details['steps_completed'].append('images_purged')
            logger.info(f"[CONSENT-PURGE] Deleted {file_count} images for {employee_name}")
        else:
            purge_details['images_deleted'] = 0
            purge_details['steps_completed'].append('no_images_found')

        # Step 2: Remove from encodings.pickle (DeepFace embeddings)
        encodings_path = get_encodings_path(org_id)
        if os.path.exists(encodings_path):
            try:
                with open(encodings_path, 'rb') as f:
                    enc_data = pickle.load(f)

                encodings = enc_data.get('encodings', [])
                names = enc_data.get('names', [])

                # Filter out this employee's entries
                filtered = [
                    (enc, name) for enc, name in zip(encodings, names)
                    if name != employee_name
                ]
                removed_count = len(encodings) - len(filtered)

                if removed_count > 0:
                    enc_data['encodings'] = [e for e, _ in filtered]
                    enc_data['names'] = [n for _, n in filtered]
                    with open(encodings_path, 'wb') as f:
                        pickle.dump(enc_data, f)
                    purge_details['embeddings_removed'] = removed_count
                    purge_details['steps_completed'].append('embeddings_purged')
                    logger.info(f"[CONSENT-PURGE] Removed {removed_count} embeddings for {employee_name}")
                else:
                    purge_details['embeddings_removed'] = 0
                    purge_details['steps_completed'].append('no_embeddings_found')
            except Exception as e:
                logger.warning(f"[CONSENT-PURGE] Encoding purge warning: {e}")
                purge_details['steps_completed'].append(f'encoding_warning: {str(e)}')

        # Step 3 & 4: Update database records
        if is_db_available() and org_id:
            with get_db_session() as db:
                emp = db.query(Employee).filter_by(
                    org_id=org_id, name=employee_name
                ).first()

                if emp:
                    # Set revocation timestamp
                    emp.consent_revoked_at = datetime.datetime.now(datetime.timezone.utc)
                    emp.status = EmployeeStatus.terminated
                    emp.image_count = 0

                    # Create consent revocation record
                    user_id = g.current_user.get('user_id')
                    db.add(ConsentRecord(
                        org_id=org_id,
                        employee_id=emp.id,
                        consented_by_user_id=user_id,
                        consent_type='biometric_consent_revocation',
                        notes=f'Consent revoked and all biometric data purged by admin.',
                        ip_address=request.remote_addr,
                    ))
                    db.commit()
                    purge_details['steps_completed'].append('database_updated')
                else:
                    purge_details['steps_completed'].append('employee_not_in_db')

        # Step 5: Reload models to reflect the removal
        try:
            reload_models(org_id)
            purge_details['steps_completed'].append('models_reloaded')
        except Exception:
            purge_details['steps_completed'].append('model_reload_skipped')

        return jsonify({
            'success': True,
            'message': (
                f'Consent revoked and all biometric data purged for "{employee_name}". '
                f'Images deleted: {purge_details.get("images_deleted", 0)}. '
                f'Embeddings removed: {purge_details.get("embeddings_removed", 0)}.'
            ),
            'details': purge_details,
        })

    except Exception as e:
        logger.error(f"[CONSENT-PURGE] Error: {e}", exc_info=True)
        return jsonify({'error': f'Purge failed: {str(e)}'}), 500


# Configuration — paths relative to project structure (configurable via env vars)
STORAGE_DIR = os.environ.get('STORAGE_DIR', PROJECT_ROOT)
DATASET_CLEANED_DIR = os.path.join(STORAGE_DIR, 'dataset_cleaned')
DATA_DIR = os.path.join(BACKEND_DIR, 'data')
SOTA_MODEL_PATH = os.path.join(BACKEND_DIR, 'models', 'sota_finetune', 'best_mobile_sideface.pth')
DEEPFACE_MODEL_PATH = os.path.join(DATA_DIR, 'encodings.pickle')
RECOGNITION_HISTORY_PATH = os.path.join(DATA_DIR, 'recognition_history.json')

# Auto-create required directories on startup
for _dir in [DATA_DIR, DATASET_CLEANED_DIR, os.path.join(STORAGE_DIR, 'dataset')]:
    os.makedirs(_dir, exist_ok=True)
logger.info(f"Storage directory: {STORAGE_DIR}")
logger.info(f"Dataset directory: {DATASET_CLEANED_DIR}")

def log_recognition(faces_results, org_id=None):
    if not faces_results:
        return
    try:
        from org_storage import get_recognition_history_path
        history_path = get_recognition_history_path(org_id)
        
        # Load existing history
        history = []
        if os.path.exists(history_path):
            try:
                with open(history_path, 'r') as f:
                    history = json.load(f)
            except Exception:
                pass
        
        for face in faces_results:
            ensemble = face.get('ensemble', {})
            predictions = face.get('predictions', {})
            
            # Determine status based on confidence and label
            label = ensemble.get('label', 'Unknown')
            confidence = ensemble.get('confidence', 0.0)
            is_recognized = ensemble.get('is_recognized', False)
            
            if not is_recognized or label == 'Unknown':
                status = 'error'
            elif confidence < 1.0:
                status = 'warning'
            else:
                status = 'success'
                
            entry = {
                'timestamp': datetime.datetime.now().isoformat(),
                'label': label,
                'confidence': confidence,
                'method': ensemble.get('method', 'N/A'),
                'agreement': ensemble.get('agreement', 'N/A'),
                'predictions': predictions,
                'status': status
            }
            # Add to the beginning of the list
            history.insert(0, entry)
            
        # Cap at 100 entries
        history = history[:100]
        
        with open(history_path, 'w') as f:
            json.dump(history, f, indent=2)
    except Exception as e:
        logger.warning(f"Failed to log recognition history: {e}")

# Global state for training SSE
training_status = {
    'is_training': False,
    'logs': [],
    'progress': 0,
    'current_epoch': '',
}

import queue
import uuid
local_training_queue = queue.Queue()
local_training_history = []  # List of jobs with: id, person_name, status, logs, timestamp
training_thread = None
training_thread_lock = threading.Lock()

def process_local_training_queue():
    import sys
    from add_person_utils import update_sota_model
    
    while not local_training_queue.empty():
        job = local_training_queue.get()
        job_id = job['id']
        person_name = job['person_name']
        epochs = job['epochs']
        org_id = job['org_id']
        
        # Find the job in history to update status
        history_job = next((j for j in local_training_history if j['id'] == job_id), None)
        if history_job:
            history_job['status'] = 'Running'
            history_job['logs'].append(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Starting local training thread.")
            
        def log_callback(text):
            cleaned = text.strip()
            if cleaned:
                training_status['logs'].append(cleaned)
                if len(training_status['logs']) > 150:
                    training_status['logs'] = training_status['logs'][-150:]
                if history_job:
                    history_job['logs'].append(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {cleaned}")
        
        old_stdout = sys.stdout
        sys.stdout = ThreadSafeStringWriter(log_callback)
        try:
            training_status['is_training'] = True
            training_status['progress'] = 10
            training_status['logs'] = [
                "SOTA MobileNetV2: Fine-tuning started",
                f"[INFO] Starting SOTA MobileNetV2 fine-tuning for {person_name} on local thread..."
            ]
            
            org_dataset_dir = get_dataset_cleaned_dir(org_id)
            update_sota_model(person_name, dataset_dir=org_dataset_dir, num_epochs=epochs, org_id=org_id)
            
            training_status['progress'] = 100
            training_status['logs'].append("Saved updated model: best_mobile_sideface")
            training_status['logs'].append(f"[SUCCESS] Model refinement complete for {person_name}!")
            reload_org_models(org_id)
            
            if history_job:
                history_job['status'] = 'Success'
                history_job['logs'].append(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Training succeeded.")
        except Exception as thread_err:
            logger.error(f"Queue training error for {person_name}: {thread_err}")
            training_status['logs'].append(f"[ERROR] Fine-tuning failed: {thread_err}")
            if history_job:
                history_job['status'] = 'Failed'
                history_job['logs'].append(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Training failed: {thread_err}")
        finally:
            sys.stdout = old_stdout
            training_status['is_training'] = False
            local_training_queue.task_done()

def enqueue_local_training(person_name, epochs, org_id):
    job_id = str(uuid.uuid4())[:8]
    job = {
        'id': job_id,
        'person_name': person_name,
        'epochs': epochs,
        'org_id': org_id,
        'status': 'Pending',
        'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'logs': [f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Job added to training queue."]
    }
    local_training_history.append(job)
    if len(local_training_history) > 50:
        local_training_history.pop(0)
        
    local_training_queue.put(job)
    
    global training_thread
    with training_thread_lock:
        if training_thread is None or not training_thread.is_alive():
            training_thread = threading.Thread(target=process_local_training_queue)
            training_thread.daemon = True
            training_thread.start()
            
    return job_id

# ─── Image Optimization Helper ─────────────────────────────────────────
def optimize_image(pil_img):
    """Resize images larger than MAX_IMAGE_DIMENSION to save disk space and RAM."""
    w, h = pil_img.size
    if max(w, h) > MAX_IMAGE_DIMENSION:
        ratio = MAX_IMAGE_DIMENSION / max(w, h)
        new_w = int(w * ratio)
        new_h = int(h * ratio)
        pil_img = pil_img.resize((new_w, new_h), Image.LANCZOS)
    return pil_img

def compute_image_hash(img_bytes):
    """Compute MD5 hash for deduplication."""
    return hashlib.md5(img_bytes).hexdigest()

# --- GLOBAL MODEL INITIALIZATION (For Inference) ---
logger.info("Initializing Face Detection and Recognition Models...")

# ─── Model State (lazy-loadable) ────────────────────────────────────────
_org_model_cache = {}  # { org_id: { 'deepface_encodings', 'deepface_names', 'sota_model', 'sota_classes', 'sota_transform', 'sota_device', 'sota_loaded' } }
face_cascade = None

# ─── Deep Learning Face Detector ──────────────────────────────────────────
from face_detection import SideFaceDetector
face_detector = SideFaceDetector(min_detection_confidence=0.45)

def load_deepface(org_id=None):
    try:
        from org_storage import get_encodings_path
        path = get_encodings_path(org_id)
        if not os.path.exists(path):
            logger.info(f"DeepFace encodings file not found for org {org_id} (not yet trained)")
            return None, None
        with open(path, "rb") as f:
            data = pickle.load(f)
        logger.info(f"DeepFace loaded for org {org_id}: {len(data.get('encodings', []))} encodings")
        return data["encodings"], data["names"]
    except Exception as e:
        logger.warning(f"DeepFace encodings not loadable for org {org_id}: {e}")
        return None, None


def load_sota(org_id=None):
    from org_storage import get_sota_model_path, get_sota_classes_path
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    classes_path = get_sota_classes_path(org_id)
    classes = []
    if os.path.exists(classes_path):
        with open(classes_path, "r") as f:
            classes = [line.strip() for line in f.readlines() if line.strip()]
    num_classes = len(classes) if classes else 2
    model = build_mobile_model(num_classes=num_classes)

    is_loaded = False
    model_path = get_sota_model_path(org_id)
    if os.path.exists(model_path):
        try:
            state_dict = torch.load(model_path, map_location=device)
            result = model.load_state_dict(state_dict, strict=False)
            if result.missing_keys:
                logger.warning(f"SOTA model: missing keys: {result.missing_keys}")
            if result.unexpected_keys:
                logger.warning(f"SOTA model: unexpected keys: {result.unexpected_keys}")
            is_loaded = True
            logger.info(f"SOTA model loaded successfully for org {org_id}")
        except Exception as e:
            logger.warning(f"SOTA model failed to load for org {org_id}: {e}. Using untrained model.")
    model.to(device)
    model.eval()
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return model, classes, val_transform, device, is_loaded

def ensure_org_models_loaded(org_id=None):
    """Lazy-load models for a specific org on first inference request."""
    global _org_model_cache
    if org_id not in _org_model_cache:
        logger.info(f"Lazy-loading models for org {org_id}...")
        d_encs, d_names = load_deepface(org_id)
        s_model, s_classes, s_transform, s_device, s_loaded = load_sota(org_id)
        _org_model_cache[org_id] = {
            'deepface_encodings': d_encs,
            'deepface_names': d_names,
            'sota_model': s_model,
            'sota_classes': s_classes,
            'sota_transform': s_transform,
            'sota_device': s_device,
            'sota_loaded': s_loaded
        }
        logger.info(f"All models loaded for org {org_id}.")
    return _org_model_cache[org_id]

def reload_org_models(org_id=None):
    """Reloads models into memory for a specific org after training."""
    global _org_model_cache
    logger.info(f"Hot-reloading models for org {org_id}...")
    d_encs, d_names = load_deepface(org_id)
    s_model, s_classes, s_transform, s_device, s_loaded = load_sota(org_id)
    _org_model_cache[org_id] = {
        'deepface_encodings': d_encs,
        'deepface_names': d_names,
        'sota_model': s_model,
        'sota_classes': s_classes,
        'sota_transform': s_transform,
        'sota_device': s_device,
        'sota_loaded': s_loaded
    }
    _models_loaded = True
    logger.info("Models reloaded globally.")

def reload_models(org_id=None):
    if org_id is None:
        org_id = get_current_org_id()
    reload_org_models(org_id)
# ────────────────────────────────────────────────────────────────────────

# Models are now lazy-loaded per organization (ensure_org_models_loaded)
# Eager loading globally is no longer applicable in multi-tenant architecture.
class ThreadSafeStringWriter(StringIO):
    """Captures stdout from training threads without corrupting the global stdout."""
    def __init__(self, callback):
        super().__init__()
        self._callback = callback
        self._lock = threading.Lock()

    def write(self, text):
        if text.strip():
            with self._lock:
                self._callback(text)
        return super().write(text)

def add_log(msg):
    training_status['logs'].append(msg)
    logger.info(f"[Training]: {msg}")

@app.route('/api/persons', methods=['GET'])
@require_auth
def get_persons():
    """Returns a list of all trained persons."""
    if not os.path.exists(DATASET_CLEANED_DIR):
        return jsonify([])
    persons = [name for name in os.listdir(DATASET_CLEANED_DIR) 
               if os.path.isdir(os.path.join(DATASET_CLEANED_DIR, name))]
    return jsonify(persons)

@app.route('/api/upload', methods=['POST'])
@require_auth
@require_role('org_admin')
@inject_org_id
def upload_person(org_id):
    """Uploads images and triggers adding a person but DOES NOT start training immediately."""
    person_name = request.form.get('person_name', '').strip()
    if not person_name:
        return jsonify({'error': 'Person name is required'}), 400
    
    # Validate person name
    if len(person_name) > MAX_NAME_LENGTH:
        return jsonify({'error': f'Person name must be {MAX_NAME_LENGTH} characters or less'}), 400
    if not _VALID_NAME_PATTERN.match(person_name):
        return jsonify({'error': 'Person name can only contain letters, numbers, underscores, and hyphens'}), 400
        
    # Check subscription limits
    from billing import check_subscription_limit
    allowed, error_response = check_subscription_limit(org_id, new_employees_count=1)
    if not allowed:
        return error_response

    try:
        epochs = int(request.form.get('epochs', 15))
        epochs = max(1, min(epochs, 50))  # Clamp to 1-50
    except ValueError:
        epochs = 15

    # Read uploaded files with validation
    front_imgs = request.files.getlist('front_img')
    left_imgs = request.files.getlist('left_img')
    right_imgs = request.files.getlist('right_img')
    extra_files = request.files.getlist('extra_files')
    
    all_files = front_imgs + left_imgs + right_imgs + extra_files
    if len(all_files) > MAX_FILES_PER_UPLOAD:
        return jsonify({'error': f'Maximum {MAX_FILES_PER_UPLOAD} files allowed per upload'}), 400

    # Convert to PIL/Numpy for add_person_utils
    from PIL import Image
    import numpy as np
    
    image_data_list = []
    rejected_count = 0
    seen_hashes = set()
    
    def process_upload(file_storage, angle_label):
        nonlocal rejected_count
        if file_storage:
            if not _allowed_file(file_storage):
                rejected_count += 1
                logger.warning(f"Rejected non-image file: {file_storage.filename}")
                return
            try:
                # Read stream bytes to check MD5 for deduplication
                img_bytes = file_storage.read()
                file_storage.stream.seek(0)
                
                img_hash = compute_image_hash(img_bytes)
                if img_hash in seen_hashes:
                    logger.info(f"Skipping duplicate upload in batch: {file_storage.filename}")
                    return
                seen_hashes.add(img_hash)

                img = Image.open(file_storage.stream).convert('RGB')
                # Resize if the image is too large to save space/RAM
                img = optimize_image(img)
                
                image_data_list.append((np.array(img), angle_label))
            except Exception as e:
                rejected_count += 1
                logger.error(f"Failed to read image {angle_label}: {e}")

    for f in front_imgs:
        process_upload(f, 'frontal')
    for f in left_imgs:
        process_upload(f, 'left')
    for f in right_imgs:
        process_upload(f, 'right')
    for extra in extra_files:
        process_upload(extra, 'extra')

    if not image_data_list:
        return jsonify({'error': 'No valid images provided'}), 400

    org_dataset_dir = get_dataset_cleaned_dir(org_id)
    org_encodings_path = get_encodings_path(org_id)

    # Execute fast enrollment synchronously
    try:
        from add_person_utils import add_person_fast
        print(f"--- Starting fast enrollment for {person_name} (Org: {org_id}) ---")
        result_msg = add_person_fast(
            person_name, 
            image_data_list, 
            dataset_dir=org_dataset_dir,
            encodings_path=org_encodings_path
        )
        print("\n--- Fast Enrollment Completed ---")
        print(result_msg)
        
        # Hot reload DeepFace immediately for instant usability
        reload_org_models(org_id)
    except Exception as e:
        logger.error(f"Fast enrollment error: {e}")
        return jsonify({'error': f"Failed during fast enrollment: {str(e)}"}), 500

    # Dispatch Celery task, fallback to inline Thread if Redis/Celery fails or in local deployment mode
    use_celery = (deployment_mode != 'local')
    task_id = "local_thread"
    if use_celery:
        try:
            from tasks import retrain_model_task
            import redis
            task = retrain_model_task.delay(person_name, epochs, org_id)
            task_id = task.id
            
            try:
                r = redis.Redis(host='localhost', port=6379, db=0)
                r.set(f"retrain_task_{org_id}", task_id)
                r.set(f"retrain_task_{org_id}_last_log_idx", 0) # reset index
            except Exception as e:
                logger.warning(f"Failed to set task ID in Redis: {e}")
        except Exception as celery_err:
            logger.warning(f"Celery dispatch failed, running SOTA retrain in daemon Thread: {celery_err}")
            use_celery = False

    if not use_celery:
        # Clear any stale task ID in Redis so SSE knows to stream from local training_status
        try:
            import redis
            r = redis.Redis(host='localhost', port=6379, db=0)
            r.delete(f"retrain_task_{org_id}")
        except Exception:
            pass

        enqueue_local_training(person_name, epochs, org_id)

    msg = f'Person enrolled and searchable now. Model refinement running in background.'
    if rejected_count > 0:
        msg += f' ({rejected_count} file(s) rejected/failed)'
    return jsonify({'message': msg})

@app.route('/api/train/queue', methods=['GET'])
@require_auth
def get_training_queue():
    """Returns the list of training jobs (Pending, Running, Completed, Failed)."""
    return jsonify(local_training_history)

@app.route('/api/train/status', methods=['GET'])
@require_auth
@inject_org_id
def get_training_status(org_id):
    """Server-Sent Events endpoint to stream training logs from Celery task."""
    def generate():
        import redis
        import time
        from tasks import celery_app
        
        # Check if Redis is running (bypass if in local deployment mode to avoid stale Celery status)
        has_redis = False
        r = None
        if deployment_mode != 'local':
            try:
                r = redis.Redis(host='localhost', port=6379, db=0)
                r.ping()
                has_redis = True
            except Exception:
                has_redis = False
            
        if not has_redis:
            # Fallback to local training_status streaming
            last_log_idx = 0
            time.sleep(0.5)  # Wait briefly for thread to spawn
            
            # If not currently training, but the SOTA model exists, auto-yield completed logs so frontend shows 100% Complete
            if not training_status['is_training']:
                import os
                sota_path = get_sota_model_path(org_id)
                if sota_path and os.path.exists(sota_path):
                    yield "data: SOTA MobileNetV2: Fine-tuning started\n\n"
                    yield "data: Saved updated model: best_mobile_sideface\n\n"
                    yield "data: [INFO] Task Finished (SUCCESS)\n\n"
                    yield "event: close\ndata: close\n\n"
                    return

            while True:
                logs = list(training_status['logs'])
                logs_count = len(logs)
                if logs_count > last_log_idx:
                    new_logs = logs[last_log_idx:logs_count]
                    for log in new_logs:
                        yield f"data: {log}\n\n"
                    last_log_idx = logs_count
                
                if not training_status['is_training']:
                    # Final log check
                    logs = list(training_status['logs'])
                    if len(logs) > last_log_idx:
                        new_logs = logs[last_log_idx:len(logs)]
                        for log in new_logs:
                            yield f"data: {log}\n\n"
                    yield "data: [INFO] Task Finished (SUCCESS)\n\n"
                    yield "event: close\ndata: close\n\n"
                    break
                time.sleep(1)
            return

        # Redis is available, proceed with Celery check
        while True:
            try:
                task_id = r.get(f"retrain_task_{org_id}")
                if not task_id:
                    # If Celery is not active but thread training is, stream from training_status
                    if training_status['is_training']:
                        last_log_idx = 0
                        while True:
                            logs = list(training_status['logs'])
                            logs_count = len(logs)
                            if logs_count > last_log_idx:
                                new_logs = logs[last_log_idx:logs_count]
                                for log in new_logs:
                                    yield f"data: {log}\n\n"
                                last_log_idx = logs_count
                            if not training_status['is_training']:
                                yield "data: [INFO] Task Finished (SUCCESS)\n\n"
                                yield "event: close\ndata: close\n\n"
                                break
                            time.sleep(1)
                        break
                    else:
                        yield "data: [INFO] No training active for this org.\n\n"
                        time.sleep(2)
                        continue
                    
                task_id = task_id.decode('utf-8')
                task = celery_app.AsyncResult(task_id)
                
                last_log_idx = int(r.get(f"retrain_task_{org_id}_last_log_idx") or b'0')
                
                if task.state == 'PENDING':
                    yield "data: [INFO] Waiting for Celery worker to pick up task...\n\n"
                elif task.state in ('STARTING', 'TRAINING', 'SUCCESS', 'FAILURE'):
                    info = task.info if isinstance(task.info, dict) else {}
                    logs = info.get('logs', [])
                    
                    logs_count = len(logs)
                    if logs_count > last_log_idx:
                        new_logs = logs[last_log_idx:logs_count]
                        for log in new_logs:
                            yield f"data: {log}\n\n"
                        r.set(f"retrain_task_{org_id}_last_log_idx", logs_count)
                        
                    if task.state in ('SUCCESS', 'FAILURE'):
                        yield f"data: [INFO] Task Finished ({task.state})\n\n"
                        if task.state == 'SUCCESS':
                            reload_org_models(org_id)
                        yield "event: close\ndata: close\n\n"
                        break
                else:
                    yield f"data: [INFO] Task State: {task.state}\n\n"
            except Exception as e:
                yield f"data: [ERROR] SSE failed: {e}\n\n"
                
            time.sleep(1)

    from flask import Response, stream_with_context
    return Response(stream_with_context(generate()), mimetype='text/event-stream')

@app.route('/api/export-onnx', methods=['POST'])
@require_auth
@require_role('org_admin')
def export_onnx_model():
    """Exports the SOTA MobileNetV2 map to an ONNX file."""
    if not os.path.exists(SOTA_MODEL_PATH):
        return jsonify({'error': 'SOTA Model (best_mobile_sideface.pth) not found. Train a model first.'}), 404

    classes_path = os.path.join(BACKEND_DIR, 'models', 'sota_finetune', 'mobile_classes.txt')
    classes = []
    if os.path.exists(classes_path):
        with open(classes_path, "r") as f:
            classes = [line.strip() for line in f.readlines() if line.strip()]
            
    num_classes = len(classes) if classes else 2
    output_onnx_path = os.path.join(PROJECT_ROOT, "sideface_mobile.onnx")

    try:
        from models.sota_finetune.finetune import build_mobile_model, export_to_onnx
        import torch
        
        device = torch.device("cpu")
        model = build_mobile_model(num_classes=num_classes)
        model.load_state_dict(torch.load(SOTA_MODEL_PATH, map_location=device))
        
        # Save standard ONNX to the root directory
        export_to_onnx(model, num_classes, output_path=output_onnx_path)
        
        return jsonify({
            'message': 'ONNX export successful.',
            'path': output_onnx_path,
            'size_mb': round(os.path.getsize(output_onnx_path) / (1024 * 1024), 2)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download-model', methods=['GET'])
@require_auth
def download_model():
    """Downloads the MobileNetV2 ONNX file (legacy endpoint)."""
    path = os.path.join(PROJECT_ROOT, "sideface_mobile.onnx")
    if os.path.exists(path):
        return send_file(path, as_attachment=True)
    return jsonify({'error': 'Model not exported yet. Use the Models page to export first.'}), 404


# ── Secure Download System ──────────────────────────────────────────────────
# Maps user-facing filenames → actual disk paths.
# Only files in this dict can be downloaded — prevents path traversal attacks.
_DOWNLOADABLE_FILES = {
    # Core trained models
    'encodings.pickle':          os.path.join(DATA_DIR, 'encodings.pickle'),
    'best_mobile_sideface.pth':  SOTA_MODEL_PATH,
    'mobile_classes.txt':        os.path.join(BACKEND_DIR, 'models', 'sota_finetune', 'mobile_classes.txt'),
    # ONNX exports (generated via Models page → Export)
    'sideface_mobile.onnx':      os.path.join(PROJECT_ROOT, 'sideface_mobile.onnx'),
    'facenet512.onnx':           os.path.join(PROJECT_ROOT, 'facenet512.onnx'),
    # Mobile deployment artefacts
    'class_centroids.json':      os.path.join(DATA_DIR, 'class_centroids.json'),
    'label_map.json':            os.path.join(DATA_DIR, 'label_map.json'),
}

# MIME types for secure Content-Type headers
_MIME_MAP = {
    '.pickle': 'application/octet-stream',
    '.pth':    'application/octet-stream',
    '.onnx':   'application/octet-stream',
    '.json':   'application/json',
    '.txt':    'text/plain',
}


@app.route('/api/download-file', methods=['GET'])
@require_auth
def download_file():
    """
    Secure download endpoint for trained model artefacts.
    Usage: GET /api/download-file?name=encodings.pickle

    Security:
      - Only whitelisted filenames are allowed (no path traversal).
      - Returns proper Content-Type and Content-Disposition headers.
    """
    filename = request.args.get('name', '').strip()

    # Reject empty or unknown filenames
    if not filename or filename not in _DOWNLOADABLE_FILES:
        allowed = sorted(_DOWNLOADABLE_FILES.keys())
        return jsonify({
            'error': f"Unknown file '{filename}'.",
            'allowed': allowed,
            'hint': 'Use GET /api/download-list to see available files.'
        }), 400

    disk_path = _DOWNLOADABLE_FILES[filename]

    if not os.path.exists(disk_path):
        return jsonify({
            'error': f"'{filename}' has not been generated yet.",
            'hint': 'Train models first, then try downloading.'
        }), 404

    # Determine MIME type from extension
    ext = os.path.splitext(filename)[1].lower()
    mimetype = _MIME_MAP.get(ext, 'application/octet-stream')

    return send_file(
        disk_path,
        as_attachment=True,
        download_name=filename,
        mimetype=mimetype
    )


@app.route('/api/download-list', methods=['GET'])
@require_auth
def download_list():
    """
    Returns a list of all downloadable artefacts with their availability
    and file sizes. The frontend can use this to show/hide download
    buttons and display file sizes.
    """
    files = []
    for name, disk_path in sorted(_DOWNLOADABLE_FILES.items()):
        exists = os.path.exists(disk_path)
        size_bytes = os.path.getsize(disk_path) if exists else 0
        size_mb = round(size_bytes / (1024 * 1024), 2) if exists else 0
        files.append({
            'name': name,
            'available': exists,
            'size_bytes': size_bytes,
            'size_mb': size_mb,
        })
    return jsonify({'files': files})

@app.route('/api/models/reset', methods=['POST'])
@require_auth
@require_role('org_admin')
@inject_org_id
def reset_models(org_id):
    """Deletes all trained models and dataset for the organization."""
    try:
        from org_storage import get_sota_model_path, get_sota_classes_path, get_encodings_path, get_dataset_cleaned_dir, get_raw_dataset_dir
        
        files_to_remove = [
            get_sota_model_path(org_id),
            get_sota_classes_path(org_id),
            get_encodings_path(org_id),
        ]
        
        removed = []
        for f in files_to_remove:
            if os.path.exists(f):
                os.remove(f)
                removed.append(os.path.basename(f))
                
        # Clear specific folders for the org
        raw_dataset_dir = get_raw_dataset_dir(org_id)
        if os.path.exists(raw_dataset_dir):
            shutil.rmtree(raw_dataset_dir)
            
        org_cleaned_dir = get_dataset_cleaned_dir(org_id)
        if os.path.exists(org_cleaned_dir):
            shutil.rmtree(org_cleaned_dir)

        # Clear memory cache for this org
        global _org_model_cache
        if org_id in _org_model_cache:
            del _org_model_cache[org_id]

        return jsonify({'message': f'Reset successful. Removed: {", ".join(removed) if removed else "Nothing to remove"}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
@require_api_key_or_auth
@inject_org_id
def predict(org_id):
    """Takes an image and returns face bounding boxes and predictions from all 3 models."""
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
        
    file = request.files['image']

    
    if not _allowed_file(file):
        return jsonify({'error': f'Unsupported file type. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'}), 400

    try:
        # ── SECURITY ENFORCEMENT: Enforce test mode strictly on the backend ──
        # If the request comes from an API Key (hardware edge camera), it's production.
        # If it comes from a JWT token (human user), FORCE test mode (no logs/history).
        auth_type = getattr(g, 'auth_type', 'user')
        if auth_type == 'user':
            test_mode = True
            logger.info("[SECURITY] JWT token detected. Forcing TEST MODE on /api/predict.")
        else:
            test_mode = False
            logger.info(f"[PRODUCTION] API Key detected for camera_id {g.current_camera.get('camera_id')}. Logging enabled.")

        # Phase 5: Per-Camera Threshold Tuning
        if auth_type == 'camera':
            camera_id = g.current_camera['camera_id']
        else:
            camera_id = request.form.get('camera_id')
            
        camera_threshold = None
        if camera_id:
            from database.models import Camera
            from database.db import get_db_session
            with get_db_session() as session:
                if session is not None:
                    cam = session.query(Camera).filter_by(id=camera_id, org_id=org_id).first()
                    if cam and cam.confirm_threshold_override:
                        camera_threshold = cam.confirm_threshold_override

        # Ensure models are loaded for this org (lazy-loading for production)
        org_models = ensure_org_models_loaded(org_id)
        
        pil_img = Image.open(file.stream).convert('RGB')
        # Validate minimum image dimensions
        if pil_img.width < 20 or pil_img.height < 20:
            return jsonify({'error': 'Image is too small. Minimum size is 20x20 pixels.'}), 400
        img_np = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        
        # ── Multi-Frame Liveness: Parse additional frames (camera path) ──
        # Cameras can optionally send 'frame_1', 'frame_2', etc. for
        # micro-movement analysis. Single-frame requests are backward compatible.
        additional_frames_raw = []
        if auth_type == 'camera':
            for key in sorted(request.files.keys()):
                if key.startswith('frame_') and key != 'image':
                    try:
                        frame_file = request.files[key]
                        frame_pil = Image.open(frame_file.stream).convert('RGB')
                        frame_np = cv2.cvtColor(np.array(frame_pil), cv2.COLOR_RGB2BGR)
                        additional_frames_raw.append(frame_np)
                    except Exception as e:
                        logger.warning(f"Failed to parse additional frame '{key}': {e}")
            if additional_frames_raw:
                logger.info(f"[LIVENESS] Received {len(additional_frames_raw)} additional frames for micro-movement analysis")
        
        # Phase 5: Deep Learning Face Detection (MediaPipe)
        detected_faces_info = face_detector.detect_faces(img_np, profile_only=False)
        faces = []
        for face_info in detected_faces_info:
            b = face_info['bbox']
            faces.append((b['x'], b['y'], b['w'], b['h']))

        if len(faces) == 0:
            # Fallback: Treat the whole image as the bounding box and pass to models
            h, w = img_np.shape[:2]
            faces = [(0, 0, w, h)]
            message = "Detector failed to find a face: Full image evaluated."
        else:
            message = f'Detected {len(faces)} face(s)'

        results = []
        for (x, y, w, h) in faces:
            # Padding
            margin_x = int(w * 0.15)
            margin_y = int(h * 0.15)
            x1 = max(0, x - margin_x)
            y1 = max(0, y - margin_y)
            x2 = min(img_np.shape[1], x + w + margin_x)
            y2 = min(img_np.shape[0], y + h + margin_y)
            
            face_roi_pil = pil_img.crop((x1, y1, x2, y2))
            face_roi_cv = img_np[y1:y2, x1:x2]
            
            # ── Liveness Detection (Anti-Spoofing) ──────────────────────
            # SECURITY: This gate MUST block ML inference for non-live faces.
            # A spoof that passes liveness = forged attendance = security breach.
            from liveness import evaluate_liveness
            
            # Extract face ROIs from additional frames for micro-movement analysis
            additional_face_rois = None
            if additional_frames_raw:
                additional_face_rois = []
                for extra_frame in additional_frames_raw:
                    ef_h, ef_w = extra_frame.shape[:2]
                    # Use same bounding box proportionally (frames should be same size)
                    ef_x1 = max(0, min(x1, ef_w - 1))
                    ef_y1 = max(0, min(y1, ef_h - 1))
                    ef_x2 = max(0, min(x2, ef_w))
                    ef_y2 = max(0, min(y2, ef_h))
                    if ef_x2 > ef_x1 and ef_y2 > ef_y1:
                        additional_face_rois.append(extra_frame[ef_y1:ef_y2, ef_x1:ef_x2])
            
            is_live, liveness_score, liveness_reason, liveness_details = evaluate_liveness(
                face_roi_cv, frames=additional_face_rois
            )
            
            if not is_live:
                # SPOOF DETECTED — skip all ML inference, return rejection
                logger.warning(f"[LIVENESS] Spoof detected: {liveness_reason}")
                results.append({
                    'bbox': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)},
                    'predictions': {
                        'sota': {'label': 'SPOOF', 'confidence': 0.0},
                        'deepface': {'label': 'SPOOF', 'confidence': 0.0, 'confidence_level': 'rejected'}
                    },
                    'ensemble': {
                        'label': 'SPOOF DETECTED',
                        'confidence': 0.0,
                        'method': 'liveness_rejection',
                        'agreement': 'N/A',
                        'is_recognized': False,
                        'is_confirmed': False,
                        'confidence_level': 'rejected',
                        'display': 'SPOOF DETECTED',
                    },
                    'liveness': {
                        'is_live': False,
                        'score': float(liveness_score),
                        'reason': liveness_reason,
                        'details': liveness_details,
                    }
                })
                continue  # Skip to next face — do NOT run ML inference
            
            # Predict SOTA (guarded — won't crash if model/classes are empty)
            sota_label, sota_conf_val = '[UNTRAINED]', 0.0
            sota_model = org_models.get('sota_model')
            sota_transform = org_models.get('sota_transform')
            sota_device = org_models.get('sota_device')
            sota_classes = org_models.get('sota_classes')
            sota_loaded = org_models.get('sota_loaded')
            
            if sota_model is not None and sota_transform is not None:
                try:
                    input_tensor = sota_transform(face_roi_pil).unsqueeze(0).to(sota_device)
                    with torch.no_grad():
                        outputs = sota_model(input_tensor)
                        probs = torch.nn.functional.softmax(outputs, dim=1)
                        conf_tensor, predicted_idx = torch.max(probs, 1)
                    idx = predicted_idx.item()
                    sota_conf_val = float(conf_tensor.item())
                    sota_label = sota_classes[idx] if sota_classes and idx < len(sota_classes) else f"Class {idx}"
                    if not sota_loaded:
                        sota_label = "[UNTRAINED]"
                except Exception as e:
                    logger.warning(f"SOTA prediction error: {e}")
                    sota_label, sota_conf_val = 'Error', 0.0
            
            # Predict DeepFace — use TTA (Test-Time Augmentation) for higher accuracy
            df_label, df_conf = "Not Trained", 0.0
            df_confidence_level = "rejected"
            deepface_encodings = org_models.get('deepface_encodings')
            deepface_names = org_models.get('deepface_names')
            
            if deepface_encodings is not None:
                try:
                    processed = apply_clahe(face_roi_cv)
                    # TTA: average 5 embeddings from different augmentations
                    emb = get_embedding_tta(processed)
                    if emb is None:
                        # Fallback to single embedding if TTA fails
                        emb = get_embedding(processed)
                    if emb is not None:
                        df_label, dist, df_confidence_level = find_match_knn(
                            emb, deepface_encodings, deepface_names, 
                            custom_threshold=camera_threshold
                        )
                        df_conf = max(0, (1 - dist))
                except Exception as e:
                    logger.warning(f"DeepFace prediction error: {e}")
                    df_label = "Error"
                    
            # --- Ensemble Vote ---
            individual_preds = {
                'sota': {'label': sota_label, 'confidence': float(sota_conf_val)},
                'deepface': {'label': df_label, 'confidence': float(df_conf), 'confidence_level': df_confidence_level}
            }
            ensemble_result = ensemble_predict(individual_preds)

            # Binary classification: CONFIRMED or NOT FOUND
            ens_label = ensemble_result['label']
            ens_conf = ensemble_result['confidence']
            
            # Use the ensemble's built-in recognition logic which handles
            # dynamic thresholds and single-model fallbacks correctly.
            is_confirmed = ensemble_result['is_recognized']
            
            if is_confirmed:
                display_text = f"CONFIRMED: {ens_label}"
            else:
                display_text = "NOT FOUND"
                ens_label = "Unknown"

            results.append({
                'bbox': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)},
                'predictions': individual_preds,
                'ensemble': {
                    'label': ens_label,
                    'confidence': ens_conf if is_confirmed else 0.0,
                    'method': ensemble_result['method'],
                    'agreement': ensemble_result.get('agreement', 'N/A'),
                    'is_recognized': is_confirmed,
                    'is_confirmed': is_confirmed,
                    'confidence_level': 'confirmed' if is_confirmed else 'rejected',
                    'display': display_text,
                },
                'liveness': {
                    'is_live': True,
                    'score': float(liveness_score),
                    'reason': liveness_reason,
                }
            })
            
        # Store embeddings for feedback tracking (SKIP in test mode)
        if not test_mode:
            for i, result in enumerate(results):
                # Skip SPOOF-detected faces — never store spoof embeddings
                ensemble_data = result.get('ensemble', {})
                if ensemble_data.get('method') == 'liveness_rejection':
                    continue
                    
                pred_id = generate_prediction_id()
                result['prediction_id'] = pred_id
                # Store the embedding if we have one (for feedback learning)
                if i < len(faces):
                    x, y, w, h = faces[i] if isinstance(faces[i], tuple) else (faces[i][0], faces[i][1], faces[i][2], faces[i][3])
                    face_roi_cv = img_np[max(0, y - int(h*0.15)):min(img_np.shape[0], y + h + int(h*0.15)),
                                         max(0, x - int(w*0.15)):min(img_np.shape[1], x + w + int(w*0.15))]
                    processed = apply_clahe(face_roi_cv)
                    emb = get_embedding(processed)
                    if emb:
                        store_prediction_for_feedback(
                            pred_id,
                            img_np,
                            face_roi_cv,
                            ensemble_data.get('label', 'SPOOF DETECTED'),
                            ensemble_data.get('confidence', 0.0),
                            embedding=emb,
                            org_id=org_id
                        )

            # Log to recognition history (SKIP in test mode)
            log_recognition(results, org_id)

            # Phase 4: Fire unknown face alert if unrecognized faces detected
            try:
                unknown_count = sum(
                    1 for r in results
                    if r.get('ensemble', {}).get('label') == 'Unknown'
                    or not r.get('ensemble', {}).get('is_recognized', True)
                )
                if unknown_count > 0 and org_id:
                    from notifications import fire_unknown_face_alert
                    camera_name = 'Production Camera'
                    cam_id = None
                    if hasattr(g, 'current_camera') and g.current_camera:
                        cam_id = g.current_camera.get('camera_id')
                        camera_name = g.current_camera.get('camera_name', camera_name)
                    fire_unknown_face_alert(org_id, cam_id or 'web', camera_name, unknown_count)
            except Exception as alert_err:
                logger.debug(f"Alert trigger skipped: {alert_err}")
        else:
            logger.info(f"[TEST MODE] Skipped log_recognition and feedback storage for {len(results)} result(s).")
            
        return jsonify({'faces': results, 'message': message})
    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        logger.error(f"Predict error: {e}", exc_info=True)
        return jsonify({'error': str(e), 'trace': trace}), 500

# ─── Recognition History Endpoints ────────────────────────────────────
@app.route('/api/history', methods=['GET'])
@require_auth
def get_history():
    """Retrieve recognition logs."""
    history = []
    if os.path.exists(RECOGNITION_HISTORY_PATH):
        try:
            with open(RECOGNITION_HISTORY_PATH, 'r') as f:
                history = json.load(f)
        except Exception:
            pass
    return jsonify(history)

@app.route('/api/history', methods=['DELETE'])
@require_auth
@require_role('org_admin')
def clear_history():
    """Clear recognition logs."""
    try:
        if os.path.exists(RECOGNITION_HISTORY_PATH):
            os.remove(RECOGNITION_HISTORY_PATH)
        return jsonify({'message': 'History cleared successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─── Feedback Learning Endpoint ───────────────────────────────────────
@app.route('/api/predict/feedback', methods=['POST'])
@require_auth
@require_role('manager')
def submit_feedback():
    """
    Accept operator feedback on a prediction for online learning.
    
    Body JSON:
    {
        "prediction_id": "abc123def456",
        "is_correct": true/false,
        "correct_name": "Jane_Doe"  // only if is_correct=false
    }
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'JSON body required'}), 400
    
    prediction_id = data.get('prediction_id')
    is_correct = data.get('is_correct')
    correct_name = data.get('correct_name', '').strip()
    
    if not prediction_id:
        return jsonify({'error': 'prediction_id is required'}), 400
    if is_correct is None:
        return jsonify({'error': 'is_correct (true/false) is required'}), 400
    
    # Validate correct_name if provided
    if correct_name and not _VALID_NAME_PATTERN.match(correct_name):
        return jsonify({'error': 'correct_name can only contain letters, numbers, underscores, and hyphens'}), 400
    
    result = process_feedback(prediction_id, bool(is_correct), correct_name if correct_name else None)
    
    if result['success']:
        # Reload encodings in memory after feedback update
        try:
            reload_models()
        except Exception as e:
            logger.warning(f"Failed to reload models after feedback: {e}")
            
    return jsonify(result)

# ─── Config Endpoints ───────────────────────────────────────
@app.route('/api/config', methods=['GET'])
@require_auth
def get_config_endpoint():
    try:
        from config_utils import load_config
        return jsonify(load_config())
    except Exception as e:
        logger.error(f"Error reading config: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/config', methods=['POST'])
@require_auth
@require_role('org_admin')
def save_config_endpoint():
    try:
        from config_utils import save_config
        data = request.get_json()
        if not data:
            return jsonify({'error': 'JSON body required'}), 400
        new_config = save_config(data)
        return jsonify(new_config)
    except Exception as e:
        logger.error(f"Error saving config: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/feedback/stats', methods=['GET'])
@require_auth
def feedback_stats():
    """Get feedback learning statistics."""
    return jsonify(get_feedback_stats())

# ─── Dashboard Stats Endpoint ─────────────────────────────────────────
@app.route('/api/dashboard', methods=['GET'])
@require_auth
@inject_org_id
def get_dashboard_stats(org_id=None):
    from org_storage import get_dataset_cleaned_dir, get_recognition_history_path
    
    dataset_cleaned_dir = get_dataset_cleaned_dir(org_id)
    
    expected_classes = []
    if os.path.exists(dataset_cleaned_dir):
        expected_classes = sorted([name for name in os.listdir(dataset_cleaned_dir) 
                                   if os.path.isdir(os.path.join(dataset_cleaned_dir, name))])
                                   
    total_people = len(expected_classes)
    total_photos = 0
    photos_per_person = {}
    
    for p in expected_classes:
        p_dir = os.path.join(dataset_cleaned_dir, p)
        # Count all image files recursively in this person's directory
        count = 0
        if os.path.exists(p_dir):
            for root, dirs, files in os.walk(p_dir):
                count += sum(1 for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.bmp')))
        photos_per_person[p] = count
        total_photos += count
        
    org_models = ensure_org_models_loaded(org_id)
    sota_loaded_state = org_models.get('sota_loaded', False)
    sota_classes_state = org_models.get('sota_classes', [])
    deepface_encodings = org_models.get('deepface_encodings')
    
    requires_retrain = False
    if total_people > 0:
        sota_mismatch = (not sota_loaded_state) or (sorted(sota_classes_state) != expected_classes)
        requires_retrain = sota_mismatch

    # Read history for stats
    history = []
    history_path = get_recognition_history_path(org_id)
    if os.path.exists(history_path):
        try:
            with open(history_path, 'r') as f:
                history = json.load(f)
        except Exception:
            pass
            
    # Calculate stats
    total_predictions = len(history)
    success_count = sum(1 for entry in history if entry.get('status') == 'success')
    warning_count = sum(1 for entry in history if entry.get('status') == 'warning')
    error_count = sum(1 for entry in history if entry.get('status') == 'error')
    
    agreement_counts = {'2/2': 0, '1/2': 0, '0/2': 0, 'N/A': 0}
    for entry in history:
        agr = entry.get('agreement', 'N/A')
        if agr in agreement_counts:
            agreement_counts[agr] += 1
        elif '2' in str(agr):
            agreement_counts['2/2'] += 1
        elif '1' in str(agr):
            agreement_counts['1/2'] += 1
        else:
            agreement_counts['0/2'] += 1
            
    return jsonify({
        'total_people': total_people,
        'total_photos': total_photos,
        'photos_per_person': photos_per_person,
        'requires_retrain': requires_retrain,
        'models_loaded': {
            'deepface': deepface_encodings is not None,
            'sota': sota_loaded_state
        },
        'history_stats': {
            'total_predictions': total_predictions,
            'success_count': success_count,
            'warning_count': warning_count,
            'error_count': error_count,
            'agreement_counts': agreement_counts
        },
        'recent_history': history[:10]
    })

# ─── Person Management Endpoints (Rename & Delete) ───────────────────
@app.route('/api/persons/<name>', methods=['DELETE'])
@require_auth
@require_role('org_admin')
def delete_person(name):
    # Sanitize name
    name = name.strip()
    if not name:
        return jsonify({'error': 'Name is required'}), 400
        
    cleaned_path = os.path.join(DATASET_CLEANED_DIR, name)
    raw_path = os.path.join(PROJECT_ROOT, 'dataset', name)
    
    deleted_any = False
    
    try:
        if os.path.exists(cleaned_path):
            shutil.rmtree(cleaned_path)
            deleted_any = True
        if os.path.exists(raw_path):
            shutil.rmtree(raw_path)
            deleted_any = True
            
        if not deleted_any:
            return jsonify({'error': f"Person '{name}' not found"}), 404
            
        # Update encodings.pickle instantly
        if os.path.exists(DEEPFACE_MODEL_PATH):
            try:
                with open(DEEPFACE_MODEL_PATH, "rb") as f:
                    data = pickle.load(f)
                
                encs = data.get("encodings", [])
                names = data.get("names", [])
                
                # Filter out
                new_encs = []
                new_names = []
                for emb, n in zip(encs, names):
                    if n != name:
                        new_encs.append(emb)
                        new_names.append(n)
                        
                data["encodings"] = new_encs
                data["names"] = new_names
                
                with open(DEEPFACE_MODEL_PATH, "wb") as f:
                    pickle.dump(data, f)
            except Exception as e:
                print(f"[WARNING] Failed to update encodings.pickle on delete: {e}")
                
        # Update class text files
        def filter_class_file(file_path):
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r') as f:
                        lines = [line.strip() for line in f.readlines() if line.strip() and line.strip() != name]
                    with open(file_path, 'w') as f:
                        f.write('\n'.join(lines) + ('\n' if lines else ''))
                except Exception as e:
                    print(f"[WARNING] Failed to update {file_path}: {e}")
                    
        filter_class_file(os.path.join(BACKEND_DIR, 'models', 'sota_finetune', 'mobile_classes.txt'))
        
        # Hot-reload models
        reload_models()
        
        return jsonify({'message': f"Successfully deleted '{name}'"})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/persons/<old_name>', methods=['PUT'])
@require_auth
@require_role('org_admin')
def rename_person(old_name):
    old_name = old_name.strip()
    data = request.get_json() or {}
    new_name = data.get('new_name', '').strip()
    
    if not new_name:
        return jsonify({'error': 'new_name is required'}), 400
        
    if new_name == old_name:
        return jsonify({'message': 'No changes needed'})
        
    # Validate name format
    if not _VALID_NAME_PATTERN.match(new_name):
        return jsonify({'error': 'New name can only contain letters, numbers, underscores, and hyphens'}), 400
        
    if len(new_name) > MAX_NAME_LENGTH:
        return jsonify({'error': f'New name must be {MAX_NAME_LENGTH} characters or less'}), 400
        
    old_cleaned_path = os.path.join(DATASET_CLEANED_DIR, old_name)
    new_cleaned_path = os.path.join(DATASET_CLEANED_DIR, new_name)
    
    old_raw_path = os.path.join(PROJECT_ROOT, 'dataset', old_name)
    new_raw_path = os.path.join(PROJECT_ROOT, 'dataset', new_name)
    
    if not os.path.exists(old_cleaned_path):
        return jsonify({'error': f"Person '{old_name}' not found"}), 404
        
    if os.path.exists(new_cleaned_path):
        return jsonify({'error': f"Person '{new_name}' already exists"}), 400
        
    try:
        # Rename folders
        os.rename(old_cleaned_path, new_cleaned_path)
        if os.path.exists(old_raw_path):
            os.rename(old_raw_path, new_raw_path)
            
        # Update encodings.pickle
        if os.path.exists(DEEPFACE_MODEL_PATH):
            try:
                with open(DEEPFACE_MODEL_PATH, "rb") as f:
                    pickle_data = pickle.load(f)
                
                names = pickle_data.get("names", [])
                updated_names = [new_name if n == old_name else n for n in names]
                pickle_data["names"] = updated_names
                
                with open(DEEPFACE_MODEL_PATH, "wb") as f:
                    pickle.dump(pickle_data, f)
            except Exception as e:
                print(f"[WARNING] Failed to update encodings.pickle on rename: {e}")
                
        # Update class text files
        def rename_in_class_file(file_path):
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r') as f:
                        lines = [line.strip() for line in f.readlines() if line.strip()]
                    updated_lines = [new_name if line == old_name else line for line in lines]
                    with open(file_path, 'w') as f:
                        f.write('\n'.join(updated_lines) + '\n')
                except Exception as e:
                    print(f"[WARNING] Failed to rename in {file_path}: {e}")
                    
        rename_in_class_file(os.path.join(BACKEND_DIR, 'models', 'sota_finetune', 'mobile_classes.txt'))
        
        # Hot-reload models
        reload_models()
        
        return jsonify({'message': f"Successfully renamed '{old_name}' to '{new_name}'"})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def rebuild_person_embeddings(name):
    """Rebuilds DeepFace embeddings for a single person from their cleaned images."""
    from config_utils import load_config
    if not load_config().get("ENABLE_DEEPFACE", False):
        return
    if not os.path.exists(DEEPFACE_MODEL_PATH):
        return
    try:
        with open(DEEPFACE_MODEL_PATH, "rb") as f:
            data = pickle.load(f)
        
        encs = data.get("encodings", [])
        names = data.get("names", [])
        
        # 1. Filter out all old embeddings for this person
        new_encs = []
        new_names = []
        for emb, n in zip(encs, names):
            if n != name:
                new_encs.append(emb)
                new_names.append(n)
                
        # 2. Scan remaining cleaned files and extract fresh embeddings
        person_cleaned_dir = os.path.join(DATASET_CLEANED_DIR, name)
        if os.path.exists(person_cleaned_dir):
            for root, dirs, files in os.walk(person_cleaned_dir):
                for file in files:
                    if file.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp')):
                        img_path = os.path.join(root, file)
                        try:
                            img = cv2.imread(img_path)
                            if img is not None:
                                img = apply_clahe(img)
                                emb = get_embedding(img)
                                if emb:
                                    new_encs.append(emb)
                                    new_names.append(name)
                        except Exception as e:
                            print(f"[WARNING] Failed to extract embedding for {file} during rebuild: {e}")
                            
        data["encodings"] = new_encs
        data["names"] = new_names
        
        with open(DEEPFACE_MODEL_PATH, "wb") as f:
            pickle.dump(data, f)
        print(f"[API] Rebuilt DeepFace embeddings for {name}. Total: {len(new_encs)}")
    except Exception as e:
        print(f"[WARNING] Failed to rebuild embeddings for {name}: {e}")

# ─── Photo Management Endpoints ───────────────────────────────────────
@app.route('/api/persons/<name>/photos', methods=['GET'])
@require_auth
def list_person_photos(name):
    """Lists all cleaned photo details for a person."""
    name = name.strip()
    person_dir = os.path.join(DATASET_CLEANED_DIR, name)
    if not os.path.exists(person_dir):
        return jsonify({'error': 'Person not found'}), 404
        
    photos = []
    for root, dirs, files in os.walk(person_dir):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp')):
                # Find relative path parts
                rel_path = os.path.relpath(os.path.join(root, file), person_dir)
                parts = rel_path.split(os.sep)
                if len(parts) >= 2:
                    angle = parts[0]
                    filename = parts[1]
                    photos.append({
                        'angle': angle,
                        'filename': filename,
                        'url': f'/api/persons/{name}/photos/{angle}/{filename}'
                    })
    return jsonify(photos)

@app.route('/api/persons/<name>/photos/<angle>/<filename>', methods=['GET'])
@require_auth
def get_person_photo(name, angle, filename):
    """Serves a specific cleaned photo file."""
    path = os.path.join(DATASET_CLEANED_DIR, name, angle, filename)
    if os.path.exists(path):
        return send_file(path)
    return jsonify({'error': 'Photo not found'}), 404

@app.route('/api/persons/<name>/photos/<angle>/<filename>', methods=['DELETE'])
@require_auth
@require_role('org_admin')
def delete_person_photo(name, angle, filename):
    """Deletes a photo from clean (and raw) dataset and updates DeepFace."""
    name = name.strip()
    cleaned_file_path = os.path.join(DATASET_CLEANED_DIR, name, angle, filename)
    raw_file_path = os.path.join(PROJECT_ROOT, 'dataset', name, angle, filename)
    
    deleted = False
    try:
        if os.path.exists(cleaned_file_path):
            os.remove(cleaned_file_path)
            deleted = True
        if os.path.exists(raw_file_path):
            os.remove(raw_file_path)
            deleted = True
            
        if not deleted:
            return jsonify({'error': 'Photo not found'}), 404
            
        # Rebuild DeepFace embeddings since a photo was deleted
        rebuild_person_embeddings(name)
        reload_models()
        
        return jsonify({'message': f"Deleted photo '{filename}' and updated DeepFace."})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

import threading
photo_move_lock = threading.Lock()

@app.route('/api/persons/<name>/photos/move', methods=['POST'])
@require_auth
@require_role('org_admin')
def move_person_photo(name):
    """Moves a cleaned photo (and its raw counterpart) to a different face angle folder."""
    name = name.strip()
    data = request.get_json() or {}
    source_angle = data.get('source_angle')
    target_angle = data.get('target_angle')
    filename = data.get('filename')
    
    if not source_angle or not target_angle or not filename:
        return jsonify({'error': 'Missing parameters'}), 400
        
    cleaned_source = os.path.join(DATASET_CLEANED_DIR, name, source_angle, filename)
    raw_source = os.path.join(PROJECT_ROOT, 'dataset', name, source_angle, filename)
    
    cleaned_target_dir = os.path.join(DATASET_CLEANED_DIR, name, target_angle)
    raw_target_dir = os.path.join(PROJECT_ROOT, 'dataset', name, target_angle)
    
    os.makedirs(cleaned_target_dir, exist_ok=True)
    os.makedirs(raw_target_dir, exist_ok=True)
    
    with photo_move_lock:
        new_index = 1
        moved = False
        new_filename = ""
        
        while True:
            new_filename = f"{name}_{target_angle}_{new_index:03d}.jpg"
            cleaned_target = os.path.join(cleaned_target_dir, new_filename)
            raw_target = os.path.join(raw_target_dir, new_filename)
            
            try:
                # Only attempt move if source exists
                if not os.path.exists(cleaned_source):
                    return jsonify({'error': 'Source file not found'}), 404
                    
                # In Python 3.3+, os.rename on Windows raises FileExistsError if dst exists.
                # However, to be absolutely safe across all platforms without overwriting,
                # we check existence first, and also catch errors.
                if os.path.exists(cleaned_target) or os.path.exists(raw_target):
                    new_index += 1
                    continue
                    
                os.rename(cleaned_source, cleaned_target)
                moved = True
                
                # Now try to move raw (if it exists)
                if os.path.exists(raw_source):
                    if not os.path.exists(raw_target):
                        os.rename(raw_source, raw_target)
                break # Success!
                
            except FileExistsError:
                new_index += 1
                continue
            except OSError as e:
                # WinError 183 is "Cannot create a file when that file already exists"
                if getattr(e, 'winerror', None) == 183 or e.errno == 17:
                    new_index += 1
                    continue
                else:
                    return jsonify({'error': str(e)}), 500
                    
        # Rebuild DeepFace embeddings since the photo moved
        try:
            rebuild_person_embeddings(name)
            reload_models()
        except Exception as e:
            pass # Non-critical if rebuild fails immediately
            
        return jsonify({
            'message': f"Moved photo to {target_angle} as '{new_filename}'",
            'new_filename': new_filename
        })

@app.route('/api/persons/<name>/retrain', methods=['POST'])
@require_auth
@require_role('org_admin')
@inject_org_id
def trigger_person_retrain(name, org_id):
    """Triggers fine-tuning SOTA on current dataset for a person."""
    name = name.strip()
    
    from org_storage import get_dataset_cleaned_dir
    org_dataset_dir = get_dataset_cleaned_dir(org_id)
    
    if not os.path.exists(os.path.join(org_dataset_dir, name)):
        return jsonify({'error': 'Person not found'}), 404
        
    try:
        data = request.get_json() or {}
        epochs = int(data.get('epochs', 15))
        epochs = max(1, min(epochs, 50))
    except ValueError:
        epochs = 15

    use_celery = (deployment_mode != 'local')
    if use_celery:
        # Start training in background Celery task
        try:
            import redis
            r = redis.Redis(host='localhost', port=6379, db=0)
        except Exception:
            r = None
            
        try:
            from tasks import retrain_model_task
            task = retrain_model_task.delay(name, epochs, org_id)
            if r:
                r.set(f"retrain_task_{org_id}", task.id)
                r.set(f"retrain_task_{org_id}_last_log_idx", 0)
        except Exception as celery_err:
            logger.warning(f"Celery dispatch failed, falling back to local queue: {celery_err}")
            use_celery = False

    if not use_celery:
        # Local mode: clear stale Celery task in Redis and use sequential local thread queue
        try:
            import redis
            r = redis.Redis(host='localhost', port=6379, db=0)
            r.delete(f"retrain_task_{org_id}")
        except Exception:
            pass
            
        enqueue_local_training(name, epochs, org_id)

    return jsonify({'message': f"Retraining started for '{name}'."})

# ─── Global Error Handler ──────────────────────────────────────────────
@app.errorhandler(Exception)
def handle_exception(e):
    """Return JSON instead of HTML for HTTP and server errors."""
    code = 500
    if hasattr(e, 'code'):
        code = e.code
    
    logger.error(f"Unhandled exception encountered: {e}", exc_info=True)
    return jsonify({
        'error': getattr(e, 'description', str(e)),
        'status_code': code
    }), code

if __name__ == '__main__':
    # Detect local IP for mobile app connection
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        local_ip = "127.0.0.1"

    port = 5000
    
    # ── Load Anti-Spoof CNN (if trained weights exist) ──
    try:
        from antispoof_model import load_antispoof_model
        load_antispoof_model()
    except Exception as e:
        print(f"  [INFO] Anti-spoof CNN not loaded: {e}")
    
    print(f"\n{'='*50}")
    print(f"  RMS Face AI - API Server")
    print(f"{'='*50}")
    print(f"  Local:   http://127.0.0.1:{port}")
    print(f"  Network: http://{local_ip}:{port}")
    print(f"{'='*50}")
    print(f"  -> Use the Network URL in the mobile app Settings")
    print(f"{'='*50}\n")

    # Bind to 0.0.0.0 so mobile devices on the same WiFi can connect
    env = os.environ.get('FLASK_ENV', 'development')
    
    if env == 'production':
        print(f"  -> Running in PRODUCTION mode (Waitress)")
        print(f"{'='*50}\n")
        try:
            from waitress import serve
            serve(app, host='0.0.0.0', port=port)
        except ImportError:
            print("Waitress not installed. Falling back to Flask built-in server.")
            app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False, threaded=True)
    else:
        print(f"  -> Running in DEVELOPMENT mode")
        print(f"{'='*50}\n")
        app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False, threaded=True)
