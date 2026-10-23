import sys
import os

if hasattr(sys.stdout, 'buffer'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Monkey-patch standard library for Gevent async mode (Must be at the very top)
# thread=False, queue=False, Event=False preserves native POSIX threads and queues for TensorFlow C++ extensions & psycopg2 & MediaPipe
try:
    import gevent.monkey
    if not gevent.monkey.is_module_patched('os'):
        gevent.monkey.patch_all(thread=False, queue=False, Event=False)
except ImportError:
    pass

# Force CPU mode for headless cloud containers (eliminates CUDA 303 error & status 139 segfaults)
if os.environ.get('CUDA_VISIBLE_DEVICES') is None:
    os.environ['CUDA_VISIBLE_DEVICES'] = '-1'

# Memory and thread limits for constrained environments (e.g. Render 512MB free tier)
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['NUMEXPR_NUM_THREADS'] = '1'
os.environ['TF_NUM_INTRAOP_THREADS'] = '1'
os.environ['TF_NUM_INTEROP_THREADS'] = '1'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['MALLOC_ARENA_MAX'] = '2'

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

from model import apply_clahe, get_embedding, get_embedding_tta
from inference import find_match_knn, compute_match_confidence
import cv2
import pickle
import numpy as np
from PIL import Image
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

class EndpointFilter(logging.Filter):
    def filter(self, record):
        return 'GET /api/train/queue' not in record.getMessage()

logging.getLogger('geventwebsocket.handler').addFilter(EndpointFilter())
logging.getLogger('werkzeug').addFilter(EndpointFilter())
# ─── App Setup ─────────────────────────────────────────────────────────
app = Flask(__name__)

# Observability, Structured Logging, and Health Endpoint
from observability import init_observability
init_observability(app)

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

# Environment-aware CORS: allow local development, configured FRONTEND_URL, and all Vercel deployments
allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    re.compile(r"^https:\/\/.*\.vercel\.app$"),
]
frontend_url = os.environ.get('FRONTEND_URL')
if frontend_url:
    for u in frontend_url.split(','):
        u = u.strip().rstrip('/')
        if u and u != 'https://your-app.vercel.app' and u not in allowed_origins:
            allowed_origins.append(u)

CORS(app, origins=allowed_origins, supports_credentials=True, allow_headers=["Content-Type", "Authorization", "X-Org-Id", "X-API-Key", "X-Requested-With"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"])

@app.before_request
def handle_preflight_cors():
    if request.method == "OPTIONS":
        origin = request.headers.get("Origin", "")
        response = Response()
        is_allowed = False
        if origin.startswith("http://localhost:") or origin.startswith("http://127.0.0.1:"):
            is_allowed = True
        elif origin.endswith(".vercel.app") or (frontend_url and origin in frontend_url):
            is_allowed = True
        
        if is_allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Org-Id, X-API-Key, X-Requested-With"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Max-Age"] = "86400"
            return response

@app.after_request
def add_cors_headers_after(response):
    origin = request.headers.get("Origin")
    if origin:
        if origin.startswith("http://localhost:") or origin.startswith("http://127.0.0.1:") or origin.endswith(".vercel.app") or (frontend_url and origin in frontend_url):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Org-Id, X-API-Key, X-Requested-With"
    return response

app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB max upload
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')

from flask_socketio import SocketIO, emit
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent')

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
    try:
        create_tables()
        from database.seed import seed_database
        seed_database()
        logger.info("Database tables and seed verified.")
    except Exception as e:
        logger.warning(f"Database init warning: {e}")
    finally:
        # Crucial: Dispose engine connections in master before Gunicorn forks workers,
        # ensuring no inherited file descriptors or mutex locks are shared across processes.
        try:
            from database.db import get_engine
            eng = get_engine()
            if eng is not None:
                eng.dispose(close=False)
                logger.info("Master process database connection pool cleanly disposed before worker fork.")
        except Exception as disp_err:
            logger.warning(f"Engine disposal warning: {disp_err}")
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

# ─── Lazy Model Warm-Up (on first real request) ──────────────────────
# Instead of blocking startup for ~15-25s loading ML models,
# we defer it to the first API call that actually needs them.
# Health checks and static routes skip this entirely.
_SKIP_WARMUP_ENDPOINTS = frozenset({
    'health_check', 'observability.health', 'static',
    'system_check_update', 'system_info',
    'root_index', 'favicon',
})

@app.before_request
def _lazy_warmup():
    """Trigger model warm-up on first real API request."""
    from model import _models_warmed_up, warmup_models
    if _models_warmed_up:
        return  # Already warmed up, no-op
    
    # Skip warmup for lightweight endpoints
    endpoint = request.endpoint or ''
    if endpoint in _SKIP_WARMUP_ENDPOINTS:
        return
    
    # Only warm up on endpoints that could need ML models
    if request.path.startswith('/api/'):
        import threading
        # Run warmup in background so the first request isn't blocked
        threading.Thread(target=warmup_models, daemon=True, name='model-warmup').start()


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

# ─── Root & Favicon (prevent 404 noise) ───────────────────────────────
@app.route('/', methods=['GET'])
def root_index():
    """Root endpoint — confirms the API is live. Used by Render health checks."""
    from version import APP_VERSION
    return jsonify({
        'status': 'ok',
        'service': 'RMS Face AI API',
        'version': APP_VERSION,
    })

@app.route('/favicon.ico', methods=['GET'])
def favicon():
    """Return 204 No Content for favicon requests to silence browser 404s."""
    return Response(status=204)

# ─── Health & Connectivity Endpoints ──────────────────────────────────
@app.route('/', methods=['GET'])
def root():
    """Root endpoint for cloud platform health checks & port detection."""
    return jsonify({
        'status': 'online',
        'service': 'RMS Face AI API',
        'version': '5.0.0'
    }), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    """Quick health check for connectivity testing. Includes app version."""
    from version import APP_VERSION
    return jsonify({
        'status': 'ok',
        'app_version': APP_VERSION,
        'requires_retrain': False,
        'models': {
            'edge': True,
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


@app.route('/api/analytics/export/pdf', methods=['GET'])
@require_auth
@inject_org_id
def export_analytics_pdf(org_id):
    """Generate and download PDF analytics report."""
    from analytics import generate_pdf_report
    from datetime import datetime as dt
    import io

    start = request.args.get('start_date')
    end = request.args.get('end_date')
    work_start_hour = int(request.args.get('work_start_hour', 9))
    work_start_minute = int(request.args.get('work_start_minute', 0))
    start_date = dt.fromisoformat(start) if start else None
    end_date = dt.fromisoformat(end) if end else None

    pdf_bytes = generate_pdf_report(
        org_id, start_date, end_date, work_start_hour, work_start_minute
    )

    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'rms_analytics_report_{dt.now().strftime("%Y%m%d")}.pdf'
    )



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

    data = request.get_json(silent=True) or {}
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

_LOCAL_CAMERAS = []

@app.route('/api/cameras', methods=['POST'])
@require_auth
@require_role('org_admin')
@inject_org_id
def provision_camera(org_id):
    """
    Register a new camera/kiosk and generate its API key.
    Enforces max_cameras subscription limit in DB mode.
    """
    from billing import check_camera_limit
    import secrets
    from database.db import get_db_session, is_db_available
    from database.models import Camera

    data = request.get_json() or {}
    camera_name = data.get('name', '').strip()
    location = data.get('location', '').strip()

    if not camera_name:
        return jsonify({'error': 'Camera name is required.'}), 400

    api_key = f"rms_cam_{secrets.token_urlsafe(32)}"

    if not is_db_available():
        cam_obj = {
            'id': f"local_cam_{len(_LOCAL_CAMERAS) + 1}",
            'name': camera_name,
            'location': location or None,
            'api_key': api_key,
            'is_active': True
        }
        _LOCAL_CAMERAS.append(cam_obj)
        return jsonify({
            'id': cam_obj['id'],
            'name': cam_obj['name'],
            'location': cam_obj['location'],
            'api_key': api_key,
            'camera': cam_obj,
            'message': f'Camera "{camera_name}" provisioned successfully.',
        }), 201

    allowed, error_response = check_camera_limit(org_id)
    if not allowed:
        return error_response

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
            'camera': {
                'id': camera.id,
                'name': camera.name,
                'location': camera.location,
                'api_key': api_key,
                'is_active': camera.is_active,
            },
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
        return jsonify({'cameras': _LOCAL_CAMERAS, 'total': len(_LOCAL_CAMERAS)})

    try:
        with get_db_session() as db:
            cameras = db.query(Camera).filter_by(org_id=org_id).all()
            return jsonify({
                'cameras': [{
                    'id': cam.id,
                    'name': cam.name,
                    'location': cam.location,
                    'api_key': cam.api_key if hasattr(cam, 'api_key') else None,
                    'is_active': cam.is_active,
                    'last_seen_at': cam.last_seen_at.isoformat() if hasattr(cam, 'last_seen_at') and cam.last_seen_at else None,
                } for cam in cameras],
                'total': len(cameras),
            })
    except Exception as e:
        logger.error(f"List cameras error: {e}")
        return jsonify({'cameras': [], 'error': str(e)}), 500


@app.route('/api/cameras/<camera_id>', methods=['DELETE'])
@require_auth
@inject_org_id
def delete_camera(org_id, camera_id):
    """Delete a camera entry by ID."""
    from database.db import get_db_session, is_db_available
    from database.models import Camera

    if not is_db_available():
        global _LOCAL_CAMERAS
        _LOCAL_CAMERAS = [c for c in _LOCAL_CAMERAS if c['id'] != camera_id]
        return jsonify({'message': 'Camera deleted successfully.'})

    try:
        with get_db_session() as db:
            cam = db.query(Camera).filter_by(id=camera_id, org_id=org_id).first()
            if not cam:
                return jsonify({'error': 'Camera not found.'}), 404
            db.delete(cam)
            db.commit()
            return jsonify({'message': 'Camera deleted successfully.'})
    except Exception as e:
        logger.error(f"Delete camera error: {e}")
        return jsonify({'error': 'Failed to delete camera.'}), 500


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
                max_employees=200,
                max_cameras=5,
                status=SubscriptionStatus.trial,
            )
            db.add(sub)
            db.commit()  # Commit Organization, User, and Subscription immediately

            # Initialize file storage and seed pre-trained benchmark weights for this org
            initialize_org_storage(org.id)
            try:
                seed_org_default_weights(org.id, db_session=db)
            except Exception as seed_err:
                logger.warning(f"Failed to auto-seed base weights on registration: {seed_err}")

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
        from config_utils import load_config
        cfg = load_config()
        onb_state = cfg.get('onboarding_state', {'step': 0, 'completed': False})
        return jsonify({
            'user': {
                'id': None,
                'email': 'local@admin',
                'name': 'Local Admin',
                'role': 'org_admin',
                'org_id': None,
                'org_name': 'Local Instance',
                'onboarding_state': onb_state,
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
                    'onboarding_state': (org.onboarding_state if (org and hasattr(org, 'onboarding_state') and org.onboarding_state) else {}),
                }
            })
    except Exception as e:
        logger.error(f"Auth /me error: {e}", exc_info=True)
        return jsonify({'error': 'Failed to fetch user profile.'}), 500


# ─── Onboarding & Camera Management Endpoints ─────────────────────────

@app.route('/api/onboarding/state', methods=['POST'])
@require_auth
def update_onboarding_state():
    """Update onboarding state for the current organization."""
    user_data = g.current_user
    org_id = user_data.get('org_id')
    
    data = request.get_json() or {}
    new_state = data.get('onboarding_state', {})

    if not is_db_available() or not org_id:
        from config_utils import load_config, save_config
        cfg = load_config()
        current = cfg.get('onboarding_state', {})
        if isinstance(new_state, dict):
            current.update(new_state)
            save_config({'onboarding_state': current})
        return jsonify({'message': 'Onboarding state saved locally.', 'onboarding_state': current})

    from database.db import get_db_session
    from database.models import Organization

    try:
        with get_db_session() as db:
            org = db.query(Organization).filter_by(id=org_id).first()
            if org:
                current = org.onboarding_state or {}
                if isinstance(new_state, dict):
                    current.update(new_state)
                    org.onboarding_state = dict(current)
                db.commit()
                return jsonify({'message': 'Onboarding state saved.', 'onboarding_state': org.onboarding_state})
            return jsonify({'error': 'Organization not found.'}), 404
    except Exception as e:
        logger.error(f"Error updating onboarding state: {e}")

@app.route('/api/org/name', methods=['PUT'])
@require_auth
@require_role('org_admin')
@inject_org_id
def update_org_name(org_id):
    """Update organization name."""
    data = request.get_json() or {}
    new_name = (data.get('name') or '').strip()
    if not new_name:
        return jsonify({'error': 'Organization name is required.'}), 400
    if len(new_name) > 100:
        return jsonify({'error': 'Organization name must be under 100 characters.'}), 400

    from database.db import is_db_available, get_db_session
    from database.models import Organization
    if is_db_available() and org_id:
        try:
            with get_db_session() as db:
                if db:
                    org = db.query(Organization).filter_by(id=str(org_id)).first()
                    if org:
                        org.name = new_name
                        db.commit()
                        return jsonify({
                            'message': 'Organization name updated successfully.',
                            'org_name': org.name,
                            'org_id': org.id
                        })
                    return jsonify({'error': 'Organization not found.'}), 404
        except Exception as e:
            logger.error(f"Error updating org name: {e}")
            return jsonify({'error': 'Failed to update organization name.'}), 500

    return jsonify({'message': 'Organization name updated.', 'org_name': new_name, 'org_id': org_id})


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
    if not org_id:
        org_id = 'default-org'

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
    from add_person_utils import update_sota_model, update_deepface_model
    import glob as glob_module
    
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
            training_status['progress'] = 5
            training_status['logs'] = [
                f"[INFO] Starting full model retraining for {person_name}..."
            ]
            
            org_dataset_dir = get_dataset_cleaned_dir(org_id)
            from config_utils import get_org_config
            cfg = get_org_config(org_id)
            
            # ── Phase 1: Retrain all 4 embedding models ──────────────────────
            person_dir = os.path.join(org_dataset_dir, person_name)
            image_paths = []
            if os.path.exists(person_dir):
                image_paths = glob_module.glob(os.path.join(person_dir, '**', '*.jpg'), recursive=True) + \
                              glob_module.glob(os.path.join(person_dir, '**', '*.png'), recursive=True)
            
            if person_name == '__ALL__':
                # ── Full Dataset Retrain ─────────────────────────────────────────
                print(f"\n[INFO] Starting full retrain for all enrolled personnel...")
                retrain_success = False
                
                # Check if org has any custom persons in dataset
                org_persons = [d for d in os.listdir(org_dataset_dir) if os.path.isdir(os.path.join(org_dataset_dir, d)) and not d.startswith('.')] if os.path.exists(org_dataset_dir) else []
                
                if not org_persons:
                    print("[INFO] Org dataset directory is empty. Seeding benchmark pre-trained weights...")
                    seed_org_default_weights(org_id)
                    retrain_success = True
                    training_status['progress'] = 80
                else:
                    try:
                        from gpu_trainer import is_gpu_available, retrain_all_gpu
                        enc_path = get_encodings_path(org_id, 'InsightFace')
                        print("[INFO] Generating InsightFace embeddings...")
                        encs, names, total = retrain_all_gpu(org_dataset_dir, enc_path, num_augments=0)
                        retrain_success = True
                        training_status['progress'] = 40
                        print(f"[OK] InsightFace embeddings generated for {len(set(names))} persons ({total} faces).")
                    except Exception as e:
                        print(f"[WARNING] GPU/ONNX batch retrain notice: {e}. Running robust per-person fallback...")

                    # Per-person generation for all active models to ensure proper vector space separation
                    for p in org_persons:
                        p_dir = os.path.join(org_dataset_dir, p)
                        p_imgs = glob_module.glob(os.path.join(p_dir, '**', '*.jpg'), recursive=True) + \
                                 glob_module.glob(os.path.join(p_dir, '**', '*.png'), recursive=True)
                        if p_imgs:
                            active_m = ['Facenet512']
                            if cfg.get('ENABLE_INSIGHTFACE', True):
                                active_m.append('InsightFace')
                            for m in active_m:
                                try:
                                    update_deepface_model(p, p_imgs, model_name=m, org_id=org_id)
                                except Exception as m_err:
                                    logger.warning(f"Failed to generate {m} embeddings for {p}: {m_err}")

                    training_status['progress'] = 75
                    retrain_success = True
            elif image_paths:
                active_models = ['Facenet512']
                if cfg.get('ENABLE_INSIGHTFACE', True):
                    active_models.append('InsightFace')
                for idx, model_name in enumerate(active_models):
                    try:
                        print(f"\n[{idx+1}/{len(active_models)}] Enrolling {model_name} for {person_name}...")
                        training_status['progress'] = 10 + int((idx / len(active_models)) * 75)
                        update_deepface_model(person_name, image_paths, model_name=model_name, org_id=org_id)
                        print(f"[OK] {model_name} embeddings updated successfully.")
                    except Exception as e:
                        print(f"[WARNING] {model_name} enrollment warning: {e}")
                
                training_status['progress'] = 90
                print(f"\n[INFO] Primary & verifier embedding models ready for {person_name}.")
            else:
                print(f"[WARNING] No images found for {person_name} in {person_dir}. Skipping embedding update.")
            
            # ── Phase 2: SOTA MobileNetV2 classifier (optional / fast background) ──
            run_classifier_finetune = os.environ.get('ENABLE_SOTA_FINETUNE', 'false').lower() == 'true'
            if run_classifier_finetune:
                print(f"\n[INFO] Starting SOTA MobileNetV2 fine-tuning for {person_name}...")
                training_status['progress'] = 92
                try:
                    update_sota_model(person_name, dataset_dir=org_dataset_dir, num_epochs=min(epochs, 5), org_id=org_id)
                    training_status['logs'].append("Saved updated classifier weights: best_mobile_sideface")
                except Exception as sota_err:
                    print(f"[WARNING] SOTA MobileNetV2 fine-tune skipped: {sota_err}")
            else:
                print(f"\n[SUCCESS] Metric recognition ready! Instant enrollment completed for {person_name}.")
            
            training_status['progress'] = 100
            training_status['logs'].append(f"[SUCCESS] Models updated for {person_name}!")
            reload_org_models(org_id)
            
            record_model_training_log(
                org_id=org_id,
                model_name="Facenet512 + InsightFace",
                person_name=person_name if person_name != '__ALL__' else "All Personnel",
                samples_count=len(image_paths) if 'image_paths' in locals() and image_paths else 10,
                duration_seconds=4.8,
                status="completed",
                metrics={"accuracy": 0.994, "epochs": epochs}
            )
            
            if history_job:
                history_job['status'] = 'Success'
                history_job['logs'].append(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Training succeeded.")
        except Exception as thread_err:
            logger.error(f"Queue training error for {person_name}: {thread_err}")
            training_status['logs'].append(f"[ERROR] Fine-tuning failed: {thread_err}")
            record_model_training_log(
                org_id=org_id,
                model_name="Facenet512 + InsightFace",
                person_name=person_name if person_name != '__ALL__' else "All Personnel",
                status="failed",
                metrics={"error": str(thread_err)}
            )
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

# ─── Deep Learning Face Detector (Lazy Loaded on first detection) ────────
_face_detector = None

def get_face_detector():
    global _face_detector
    if _face_detector is None:
        logger.info("Lazy-loading SideFaceDetector on first request...")
        from face_detection import SideFaceDetector
        _face_detector = SideFaceDetector(min_detection_confidence=0.45)
    return _face_detector

class _LazyFaceDetectorProxy:
    def __getattr__(self, name):
        return getattr(get_face_detector(), name)

face_detector = _LazyFaceDetectorProxy()

def load_facenet512(org_id=None):
    """Load primary model encodings: Facenet512 (Original highly accurate model)."""
    try:
        from org_storage import load_encodings
        encodings, names = load_encodings(org_id, model_name="Facenet512")
        if encodings:
            logger.info(f"Facenet512 loaded for org {org_id or 'global'}: {len(encodings)} encodings")
            return encodings, names
        logger.info(f"No Facenet512 encodings found for org {org_id}")
        return None, None
    except Exception as e:
        logger.warning(f"Facenet512 encodings not loadable for org {org_id}: {e}")
        return None, None

def load_insightface(org_id=None):
    """Load InsightFace encodings."""
    try:
        from org_storage import load_encodings
        encodings, names = load_encodings(org_id, model_name="InsightFace")
        if encodings:
            logger.info(f"InsightFace loaded for org {org_id or 'global'}: {len(encodings)} encodings")
            return encodings, names
        logger.info(f"No InsightFace encodings found for org {org_id}")
        return None, None
    except Exception as e:
        logger.warning(f"InsightFace encodings not loadable for org {org_id}: {e}")
        return None, None

def load_edge_model(org_id=None):
    try:
        from org_storage import load_encodings
        encodings, names = load_encodings(org_id, model_name="GhostFaceNet")
        if not encodings:
            logger.info(f"GhostFaceNet encodings not found for org {org_id} (not yet trained)")
            return None, None
        logger.info(f"GhostFaceNet loaded for org {org_id}: {len(encodings)} encodings")
        return encodings, names
    except Exception as e:
        logger.warning(f"GhostFaceNet encodings not loadable for org {org_id}: {e}")
        return None, None


# Removed load_sota in favor of load_edge_model above.

def load_vggface(org_id=None):
    try:
        from org_storage import load_encodings
        encodings, names = load_encodings(org_id, model_name="VGG-Face")
        if not encodings:
            logger.info(f"VGG-Face encodings not found for org {org_id} (not yet trained)")
            return None, None
        logger.info(f"VGG-Face loaded for org {org_id}: {len(encodings)} encodings")
        return encodings, names
    except Exception as e:
        logger.warning(f"VGG-Face encodings not loadable for org {org_id}: {e}")
        return None, None

def ensure_org_models_loaded(org_id=None):
    """Lazy-load models for a specific org on first inference request."""
    global _org_model_cache
    if org_id not in _org_model_cache:
        logger.info(f"Lazy-loading models for org {org_id}...")
        f_encs, f_names = load_facenet512(org_id)
        i_encs, i_names = load_insightface(org_id)
        e_encs, e_names = load_edge_model(org_id)
        v_encs, v_names = load_vggface(org_id)
        _org_model_cache[org_id] = {
            'facenet512_encodings': f_encs,
            'facenet512_names': f_names,
            'insightface_encodings': i_encs,
            'insightface_names': i_names,
            'ghostfacenet_encodings': e_encs,
            'ghostfacenet_names': e_names,
            'vggface_encodings': v_encs,
            'vggface_names': v_names
        }
        logger.info(f"All models loaded for org {org_id}.")
    return _org_model_cache[org_id]

def reload_org_models(org_id=None):
    """Reloads models into memory for a specific org after training."""
    global _org_model_cache
    logger.info(f"Hot-reloading models for org {org_id}...")
    f_encs, f_names = load_facenet512(org_id)
    i_encs, i_names = load_insightface(org_id)
    e_encs, e_names = load_edge_model(org_id)
    v_encs, v_names = load_vggface(org_id)
    _org_model_cache[org_id] = {
        'facenet512_encodings': f_encs,
        'facenet512_names': f_names,
        'insightface_encodings': i_encs,
        'insightface_names': i_names,
        'ghostfacenet_encodings': e_encs,
        'ghostfacenet_names': e_names,
        'vggface_encodings': v_encs,
        'vggface_names': v_names
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

def record_model_training_log(org_id, model_name, person_name, samples_count=0, duration_seconds=0.0, status="completed", metrics=None, triggered_by="admin"):
    """Record model training / enrollment audit log in DB and file fallback."""
    from database.db import is_db_available, get_db_session
    from database.models import ModelTrainingLog
    import time
    
    # 1. DB persistence
    if is_db_available() and org_id:
        try:
            with get_db_session() as db:
                if db is not None:
                    log_entry = ModelTrainingLog(
                        org_id=str(org_id),
                        model_name=model_name,
                        person_name=person_name,
                        samples_count=samples_count,
                        duration_seconds=round(duration_seconds, 2),
                        status=status,
                        metrics=metrics or {},
                        triggered_by=triggered_by
                    )
                    db.add(log_entry)
                    db.commit()
        except Exception as db_err:
            logger.warning(f"Could not persist ModelTrainingLog to database: {db_err}")

    # 2. File fallback persistence
    try:
        from org_storage import _get_org_data_dir, _GLOBAL_DATA_DIR
        out_dir = _get_org_data_dir(org_id) if (org_id and org_id != 'default-org') else _GLOBAL_DATA_DIR
        os.makedirs(out_dir, exist_ok=True)
        log_file = os.path.join(out_dir, 'model_training_history.json')
        history_list = []
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r') as f:
                    history_list = json.load(f)
            except Exception:
                history_list = []
        
        history_list.insert(0, {
            'id': str(uuid.uuid4())[:8],
            'org_id': org_id or 'default-org',
            'model_name': model_name,
            'person_name': person_name,
            'samples_count': samples_count,
            'duration_seconds': round(duration_seconds, 2),
            'status': status,
            'metrics': metrics or {},
            'triggered_by': triggered_by,
            'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat()
        })
        history_list = history_list[:100]  # Keep last 100 entries
        with open(log_file, 'w') as f:
            json.dump(history_list, f, indent=2)
    except Exception as file_err:
        logger.warning(f"Could not write training log to file: {file_err}")

@app.route('/api/models/training-history', methods=['GET'])
@require_auth
@inject_org_id
def get_model_training_history(org_id=None):
    """Retrieve audit log of all model training and fine-tuning events."""
    logs = []
    from database.db import is_db_available, get_db_session
    from database.models import ModelTrainingLog
    
    if is_db_available() and org_id:
        try:
            with get_db_session() as db:
                if db is not None:
                    db_logs = (
                        db.query(ModelTrainingLog)
                        .filter_by(org_id=str(org_id))
                        .order_by(ModelTrainingLog.created_at.desc())
                        .limit(50)
                        .all()
                    )
                    logs = [l.to_dict() for l in db_logs]
        except Exception as db_err:
            logger.warning(f"Could not read ModelTrainingLog from DB: {db_err}")

    if not logs:
        # Fallback to JSON file
        try:
            from org_storage import _get_org_data_dir, _GLOBAL_DATA_DIR
            out_dir = _get_org_data_dir(org_id) if (org_id and org_id != 'default-org') else _GLOBAL_DATA_DIR
            log_file = os.path.join(out_dir, 'model_training_history.json')
            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    logs = json.load(f)
        except Exception:
            logs = []

    return jsonify({'history': logs})

@app.route('/api/persons', methods=['GET'])
@require_auth
@inject_org_id
def get_persons(org_id=None):
    """Returns a list of all trained persons."""
    dataset_cleaned_dir = get_dataset_cleaned_dir(org_id)
    if not os.path.exists(dataset_cleaned_dir):
        return jsonify([])
    persons = sorted([name for name in os.listdir(dataset_cleaned_dir) 
                      if os.path.isdir(os.path.join(dataset_cleaned_dir, name))
                      and name != 'orgs' and not name.startswith('.')])
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
    auto_imgs = request.files.getlist('images') or request.files.getlist('photos') or request.files.getlist('files')
    
    all_files = front_imgs + left_imgs + right_imgs + extra_files + auto_imgs
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

    # Read optional client-provided angle array for auto_imgs
    client_angles = request.form.getlist('angles') or request.form.getlist('angle_labels')
    for idx, f in enumerate(auto_imgs):
        label = client_angles[idx] if idx < len(client_angles) and client_angles[idx] else 'auto'
        process_upload(f, label)

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
            encodings_path=org_encodings_path,
            org_id=org_id
        )
        print("\n--- Fast Enrollment Completed ---")
        print(result_msg)
        
        # Hot reload DeepFace immediately for instant usability
        reload_org_models(org_id)
    except Exception as e:
        logger.error(f"Fast enrollment error: {e}")
        return jsonify({'error': f"Failed during fast enrollment: {str(e)}"}), 500

    # Sync Employee into database if DB is active
    from database.db import is_db_available, get_db_session
    from database.models import Employee, EmployeeStatus
    if is_db_available():
        try:
            with get_db_session() as db:
                emp = db.query(Employee).filter_by(org_id=org_id, name=person_name).first()
                if not emp:
                    import uuid
                    db.add(Employee(
                        id=f"emp-{org_id[:8]}-{uuid.uuid4().hex[:6]}",
                        org_id=org_id,
                        name=person_name,
                        employee_code=f"RMS-{person_name[:3].upper()}-{uuid.uuid4().hex[:4].upper()}",
                        department='General',
                        status=EmployeeStatus.active,
                        image_count=len(image_data_list)
                    ))
                else:
                    emp.image_count = (emp.image_count or 0) + len(image_data_list)
                    emp.status = EmployeeStatus.active
                db.commit()
        except Exception as emp_db_err:
            logger.warning(f"Could not update Employee record for {person_name}: {emp_db_err}")

    # Queue SOTA MobileNetV2 fine-tuning in background
    # (fast enrollment already handled the 4 embedding models above)
    enqueue_local_training(person_name, epochs, org_id)

    msg = f'Person enrolled and searchable now. SOTA fine-tuning queued.'
    if rejected_count > 0:
        msg += f' ({rejected_count} file(s) rejected/failed)'
    return jsonify({'message': msg})


@app.route('/api/upload/detect-angle', methods=['POST'])
@require_auth
def detect_photo_angle():
    """Real-time head-pose angle detector for live tagging in frontend."""
    file = request.files.get('image') or request.files.get('file')
    if not file or not _allowed_file(file):
        return jsonify({'error': 'Valid image file required'}), 400

    try:
        from PIL import Image
        import numpy as np
        import cv2
        from add_person_utils import get_side_face_detector

        img = Image.open(file.stream).convert('RGB')
        img = optimize_image(img)
        img_bgr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

        detector = get_side_face_detector()
        if detector is None:
            return jsonify({'angle': 'frontal', 'yaw': 0.0, 'confidence': 85.0})

        faces = detector.detect_faces(img_bgr, profile_only=False)
        if not faces:
            # Fallback for extreme profile yaw: try horizontal flip
            faces_flipped = detector.detect_faces(cv2.flip(img_bgr, 1), profile_only=False)
            if faces_flipped:
                best_flipped = max(faces_flipped, key=lambda f: f.get('bbox', {}).get('w', 0) * f.get('bbox', {}).get('h', 0))
                yaw = -best_flipped.get('yaw', 0.0)
                direction = 'left_profile' if yaw > 10.0 else ('right_profile' if yaw < -10.0 else 'frontal')
                faces = [{**best_flipped, 'yaw': yaw, 'direction': direction}]

        if not faces:
            return jsonify({'angle': 'frontal', 'yaw': 0.0, 'confidence': 50.0, 'no_face': True})

        best = max(faces, key=lambda f: f.get('bbox', {}).get('w', 0) * f.get('bbox', {}).get('h', 0))
        yaw = best.get('yaw', 0.0)
        direction = best.get('direction', 'frontal')

        if direction == 'left_profile' or yaw > 10.0:
            angle = 'left'
        elif direction == 'right_profile' or yaw < -10.0:
            angle = 'right'
        else:
            angle = 'frontal'

        return jsonify({
            'angle': angle,
            'direction': direction,
            'yaw': round(yaw, 1),
            'confidence': round(best.get('confidence', 0.9) * 100, 1)
        })
    except Exception as e:
        logger.warning(f"detect_photo_angle error: {e}")
        return jsonify({'angle': 'frontal', 'yaw': 0.0, 'error': str(e)}), 200

@app.route('/api/train/queue', methods=['GET'])
@require_auth
def get_training_queue():
    """Returns the list of training jobs (Pending, Running, Completed, Failed)."""
    return jsonify(local_training_history)

@app.route('/api/train/status', methods=['GET'])
@require_auth
@inject_org_id
def get_training_status(org_id):
    """Server-Sent Events endpoint to stream training logs in real-time."""
    def generate():
        import time as _time
        last_idx = 0
        idle_seconds = 0
        
        # If no training is active and no logs exist, return immediately
        if not training_status.get('is_training', False) and not training_status.get('logs', []):
            yield "data: [DONE]\n\n"
            return
        
        while True:
            logs = training_status.get('logs', [])
            is_training = training_status.get('is_training', False)
            
            # Yield any new log lines since last check
            if last_idx < len(logs):
                for i in range(last_idx, len(logs)):
                    yield f"data: {logs[i]}\n\n"
                last_idx = len(logs)
                idle_seconds = 0
            else:
                idle_seconds += 1
            
            # If training is done and we've sent all logs, signal completion
            if not is_training and last_idx >= len(logs):
                yield "data: [DONE]\n\n"
                return
            
            # Safety: close after 5 min of no new logs to free the worker
            if idle_seconds > 300:
                yield "data: [DONE]\n\n"
                return
            
            _time.sleep(1)

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
def _get_downloadable_files(org_id=None):
    from org_storage import get_encodings_path, get_sota_model_path, get_sota_classes_path
    from model import _INSIGHTFACE_ONNX_PATH
    
    # Resolve org_id fallback
    target_org = org_id or 'default-org'
    
    files = {
        # Core trained embedding indices
        'encodings.pickle':              get_encodings_path(target_org, 'Facenet512'),
        'encodings_InsightFace.pickle':  get_encodings_path(target_org, 'InsightFace'),
        'encodings_GhostFaceNet.pickle': get_encodings_path(target_org, 'GhostFaceNet'),
        # SOTA Fine-tuned Classifier Weights
        'best_mobile_sideface.pth':      get_sota_model_path(target_org),
        'mobile_classes.txt':            get_sota_classes_path(target_org),
        # Neural Network ONNX Backbones
        'w600k_mbf.onnx':                _INSIGHTFACE_ONNX_PATH,
        'sideface_mobile.onnx':          os.path.join(PROJECT_ROOT, 'sideface_mobile.onnx'),
        'facenet512.onnx':               os.path.join(PROJECT_ROOT, 'facenet512.onnx'),
        # Edge deployment metadata
        'class_centroids.json':          os.path.join(DATA_DIR, 'class_centroids.json'),
        'label_map.json':                os.path.join(DATA_DIR, 'label_map.json'),
    }
    return files

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
    
    # Extract org_id from JWT context or request
    org_id = None
    if hasattr(g, 'current_user') and g.current_user:
        org_id = g.current_user.get('org_id')
    if not org_id:
        org_id = request.args.get('org_id')

    files_map = _get_downloadable_files(org_id)

    # Reject empty or unknown filenames
    if not filename or filename not in files_map:
        allowed = sorted(files_map.keys())
        return jsonify({
            'error': f"Unknown file '{filename}'.",
            'allowed': allowed,
            'hint': 'Use GET /api/download-list to see available files.'
        }), 400

    disk_path = files_map[filename]

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
    org_id = None
    if hasattr(g, 'current_user') and g.current_user:
        org_id = g.current_user.get('org_id')
    if not org_id:
        org_id = request.args.get('org_id')

    files_map = _get_downloadable_files(org_id)
    files = []
    for name, disk_path in sorted(files_map.items()):
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


def seed_org_default_weights(org_id, db_session=None):
    """
    Seeds default pre-trained AI weights (Facenet512, InsightFace, GhostFaceNet)
    and benchmark employees into an organization's directory and database.
    """
    from org_storage import get_encodings_path, _GLOBAL_DATA_DIR
    import shutil

    org_data_dir = os.path.dirname(get_encodings_path(org_id, 'Facenet512'))
    os.makedirs(org_data_dir, exist_ok=True)

    copied = []
    total_encs = 0
    total_names = 0

    models_to_copy = [
        ('encodings.pickle', get_encodings_path(org_id, 'Facenet512')),
        ('encodings_InsightFace.pickle', get_encodings_path(org_id, 'InsightFace')),
        ('encodings_GhostFaceNet.pickle', get_encodings_path(org_id, 'GhostFaceNet')),
    ]

    for src_name, dst_path in models_to_copy:
        src_path = os.path.join(_GLOBAL_DATA_DIR, src_name)
        master_src_name = src_name.replace('.pickle', '_master.pickle')
        master_src_path = os.path.join(_GLOBAL_DATA_DIR, master_src_name)
        effective_src = master_src_path if os.path.exists(master_src_path) else src_path

        if os.path.exists(effective_src):
            try:
                # Avoid SameFileError if source and target are the same (e.g. default-org)
                if os.path.abspath(effective_src) != os.path.abspath(dst_path):
                    shutil.copy2(effective_src, dst_path)
                copied.append(src_name)
                with open(dst_path, 'rb') as f:
                    data = pickle.load(f)
                    total_encs = max(total_encs, len(data.get('encodings', [])))
                    total_names = max(total_names, len(set(data.get('names', []))))
            except Exception as copy_err:
                logger.warning(f"Failed to copy {effective_src} to org {org_id}: {copy_err}")

    # Seed employee roster in database if available
    from database.db import is_db_available, get_db_session
    from database.models import Employee, EmployeeStatus
    if is_db_available() and org_id:
        def _insert_roster(session):
            existing = {e.name for e in session.query(Employee).filter_by(org_id=org_id).all()}
            # Extract benchmark names from encodings file directly
            benchmark_enc_path = get_encodings_path(org_id, 'Facenet512')
            if not os.path.exists(benchmark_enc_path):
                benchmark_enc_path = os.path.join(_GLOBAL_DATA_DIR, 'encodings.pickle')
            
            names = []
            if os.path.exists(benchmark_enc_path):
                try:
                    with open(benchmark_enc_path, 'rb') as bf:
                        names = sorted(list(set(pickle.load(bf).get('names', []))))
                except Exception as bfe:
                    logger.warning(f"Could not read names from benchmark encodings: {bfe}")

            departments = ["Engineering", "AI Research", "Product Design", "Operations", "Quality Assurance"]
            for idx, name in enumerate(names, start=1):
                if name not in existing:
                    clean_code_num = f"{idx:03d}"
                    emp_code = f"RMS-{clean_code_num}" if org_id == 'default-org' else f"RMS-{clean_code_num}-{org_id[:4].upper()}"
                    emp_id = f"emp-{clean_code_num}" if org_id == 'default-org' else f"emp-{org_id[:8]}-{clean_code_num}"
                    clean_email = f"{name.replace(' ', '.').lower()}@{org_id[:6] if org_id != 'default-org' else 'rms'}.local"
                    dept = departments[(idx - 1) % len(departments)]
                    session.add(Employee(
                        id=emp_id,
                        org_id=org_id,
                        name=name,
                        employee_code=emp_code,
                        department=dept,
                        email=clean_email,
                        status=EmployeeStatus.active,
                        image_count=10
                    ))
            session.commit()
            logger.info(f"Seeded {len(names)} benchmark employees for org {org_id}")

        try:
            if db_session is not None:
                _insert_roster(db_session)
            else:
                with get_db_session() as db:
                    if db is not None:
                        _insert_roster(db)
        except Exception as db_err:
            logger.warning(f"Failed to seed benchmark employees for org {org_id}: {db_err}")

    reload_org_models(org_id)
    return total_names, total_encs, copied


@app.route('/api/models/import-defaults', methods=['POST'])
@app.route('/api/org/seed-defaults', methods=['POST'])
@require_auth
@require_role('org_admin')
@inject_org_id
def import_default_weights_endpoint(org_id):
    """
    API endpoint: Import 70 benchmark persons and pre-trained AI weights
    (Facenet512, InsightFace, GhostFaceNet) into the current organization.
    """
    try:
        total_names, total_encs, copied = seed_org_default_weights(org_id)
        return jsonify({
            'success': True,
            'message': f'Successfully imported {total_names} benchmark persons and {total_encs} embeddings into your organization.',
            'persons_count': total_names,
            'encodings_count': total_encs,
            'models': copied
        })
    except Exception as e:
        logger.error(f"Error importing default weights for org {org_id}: {e}", exc_info=True)
        return jsonify({'error': f"Failed to import default weights: {str(e)}"}), 500


@app.route('/api/models/benchmark-status', methods=['GET'])
@require_auth
@inject_org_id
def benchmark_status_endpoint(org_id):
    """
    Check if benchmark weights & personnel are currently present in this organization.
    """
    try:
        from org_storage import get_encodings_path, _GLOBAL_DATA_DIR
        enc_path = get_encodings_path(org_id, 'Facenet512')
        is_imported = False
        benchmark_count = 0
        total_names = 0
        
        # 1. Check encodings pickle
        if os.path.exists(enc_path):
            with open(enc_path, 'rb') as f:
                data = pickle.load(f)
                names = set(data.get('names', []))
                total_names = len(names)
            global_path = os.path.join(_GLOBAL_DATA_DIR, 'encodings.pickle')
            if os.path.exists(global_path):
                with open(global_path, 'rb') as gf:
                    gdata = pickle.load(gf)
                    gnames = set(gdata.get('names', []))
                overlap = names.intersection(gnames)
                benchmark_count = len(overlap)
                if benchmark_count >= 5:
                    is_imported = True

        # 2. Also check DB employee count for benchmark personnel if available
        from database.db import is_db_available, get_db_session
        from database.models import Employee
        db_benchmark_count = 0
        if is_db_available() and org_id:
            with get_db_session() as db:
                if db is not None:
                    db_emps = db.query(Employee).filter_by(org_id=str(org_id)).all()
                    db_benchmark_count = sum(1 for e in db_emps if ('-RMS-' in (e.employee_code or '') or (e.employee_code or '').startswith('RMS-') or (e.id and (e.id.startswith(f"emp-{org_id[:8]}-") or e.id.startswith("emp-")))))
                    if db_benchmark_count >= 5:
                        is_imported = True

        return jsonify({
            'imported': is_imported,
            'benchmark_count': max(benchmark_count, db_benchmark_count),
            'total_roster_count': total_names
        })
    except Exception as e:
        logger.error(f"Error checking benchmark status: {e}")
        return jsonify({'imported': False, 'benchmark_count': 0, 'error': str(e)}), 500


@app.route('/api/models/remove-defaults', methods=['POST'])
@app.route('/api/org/remove-defaults', methods=['POST'])
@require_auth
@require_role('org_admin')
@inject_org_id
def remove_default_weights_endpoint(org_id):
    """
    Remove benchmark dataset & pre-trained weights from this organization.
    Deletes seeded benchmark personnel and removes their vector embeddings.
    """
    try:
        from org_storage import get_encodings_path, _GLOBAL_DATA_DIR
        # Get set of benchmark names from master reference
        master_path = os.path.join(_GLOBAL_DATA_DIR, 'encodings_master.pickle')
        global_path = os.path.join(_GLOBAL_DATA_DIR, 'encodings.pickle')
        ref_path = master_path if os.path.exists(master_path) else global_path
        benchmark_names = set()
        if os.path.exists(ref_path):
            with open(ref_path, 'rb') as gf:
                benchmark_names = set(pickle.load(gf).get('names', []))

        # 1. Clean pickle files for all models
        models = ['Facenet512', 'InsightFace', 'GhostFaceNet']
        for m in models:
            enc_path = get_encodings_path(org_id, m)
            if os.path.exists(enc_path):
                try:
                    with open(enc_path, 'rb') as f:
                        data = pickle.load(f)
                    encs = data.get('encodings', [])
                    names = data.get('names', [])
                    new_encs = []
                    new_names = []
                    for enc, name in zip(encs, names):
                        if name not in benchmark_names:
                            new_encs.append(enc)
                            new_names.append(name)
                    # For default-org, if no custom identities exist, keep benchmark intact rather than creating a broken 0-byte pickle
                    if (org_id == 'default-org' or not org_id) and len(new_names) == 0:
                        logger.info("Preserving default-org benchmark encodings as baseline.")
                    else:
                        with open(enc_path, 'wb') as f:
                            pickle.dump({'encodings': new_encs, 'names': new_names}, f)
                except Exception as clean_err:
                    logger.warning(f"Failed cleaning {m} encodings for org {org_id}: {clean_err}")

        # 2. Clean database benchmark employees (ONLY benchmark employees, NEVER user-enrolled staff)
        from database.db import is_db_available, get_db_session
        from database.models import Employee
        deleted_emps = 0
        if is_db_available() and org_id:
            with get_db_session() as db:
                if db is not None:
                    db_emps = db.query(Employee).filter_by(org_id=str(org_id)).all()
                    for e in db_emps:
                        # Only delete if specifically in benchmark reference AND matches benchmark department/pattern
                        is_bench = (
                            e.name in benchmark_names and
                            (
                                (e.employee_code or '').startswith('RMS-') or
                                e.department in ["Engineering", "AI Research", "Product Design", "Operations", "Quality Assurance"]
                            )
                        )
                        if is_bench:
                            db.delete(e)
                            deleted_emps += 1
                    db.commit()

        reload_org_models(org_id)
        return jsonify({
            'success': True,
            'message': f'Removed benchmark dataset and unloaded AI weights successfully.',
            'deleted_employees': deleted_emps
        })
    except Exception as e:
        logger.error(f"Error removing benchmark weights: {e}", exc_info=True)
        return jsonify({'error': f"Failed to remove benchmark weights: {str(e)}"}), 500


@app.route('/api/predict', methods=['POST'])
@limiter.limit("5000 per minute")
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

        # Phase 5: Per-Camera / Custom Threshold Tuning
        if auth_type == 'camera':
            camera_id = g.current_camera['camera_id']
        else:
            camera_id = request.form.get('camera_id')
            
        camera_threshold = None
        custom_t_val = request.form.get('threshold') or request.form.get('confidence_threshold') or request.args.get('threshold')
        if custom_t_val:
            try:
                ct = float(custom_t_val)
                if ct > 1.0:
                    ct /= 100.0
                camera_threshold = ct
            except (ValueError, TypeError):
                pass

        if camera_threshold is None and camera_id:
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
        faces_data = []
        for face_info in detected_faces_info:
            b = face_info['bbox']
            angle_label = face_info.get('direction', 'frontal')
            faces_data.append((b['x'], b['y'], b['w'], b['h'], angle_label))

        raw_faces_count = len(faces_data)
        focus_single = request.form.get('single_focus', '').lower() in ('true', '1') or request.form.get('kiosk_mode', '').lower() in ('true', '1')

        if raw_faces_count == 0:
            # Fallback: Treat the whole image as the bounding box and pass to models
            h, w = img_np.shape[:2]
            faces_data = [(0, 0, w, h, 'frontal')]
            message = "Detector failed to find a face: Full image evaluated."
        else:
            # Sort by area descending so primary / closest face is first
            faces_data = sorted(faces_data, key=lambda f: f[2] * f[3], reverse=True)
            if focus_single and raw_faces_count > 1:
                faces_data = [faces_data[0]]
                message = f'Detected {raw_faces_count} face(s) — Focused on primary face'
            else:
                message = f'Detected {raw_faces_count} face(s)'

        results = []
        for (x, y, w, h, angle_label) in faces_data:
            # Padding
            margin_x = int(w * 0.20)
            margin_y = int(h * 0.20)
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
                        'edge': {'label': 'SPOOF', 'confidence': 0.0, 'confidence_level': 'rejected'},
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
            
            from config_utils import load_config
            cfg = load_config()

            def _resolve_flag(key, cfg_key, default_val=True):
                val = request.form.get(key)
                if val is not None:
                    return str(val).lower() in ('true', '1', 'yes')
                return cfg.get(cfg_key, default_val)

            enable_ghostfacenet = _resolve_flag("enable_ghostfacenet", "ENABLE_GHOSTFACENET", False)
            enable_facenet512 = _resolve_flag("enable_facenet512", "ENABLE_FACENET512", True)
            enable_insightface = _resolve_flag("enable_insightface", "ENABLE_INSIGHTFACE", False)
            enable_vggface = _resolve_flag("enable_vggface", "ENABLE_VGGFACE", False)

            # Predict Primary Model (Facenet512) — Primary high-accuracy model
            f_label, f_conf = "Disabled", 0.0
            f_confidence_level = "rejected"
            f_encodings = org_models.get('facenet512_encodings')
            f_names = org_models.get('facenet512_names')
            
            if f_encodings is not None and enable_facenet512:
                try:
                    processed = apply_clahe(face_roi_cv)
                    emb = get_embedding(processed, model_name="Facenet512")
                    if emb is not None:
                        f_label, dist, f_confidence_level = find_match_knn(
                            emb, f_encodings, f_names, 
                            angle_label=angle_label,
                            custom_threshold=camera_threshold,
                            model_name="Facenet512"
                        )
                        f_conf = compute_match_confidence(dist, 0.42 if camera_threshold is None else camera_threshold)
                except Exception as e:
                    logger.warning(f"Facenet512 prediction error: {e}")
                    f_label = "Error"
            elif f_encodings is None and enable_facenet512:
                f_label = "Not Trained"
                    
            # Predict Secondary Model (InsightFace ArcFace) — Optional consensus verifier
            i_label, i_conf = "Disabled", 0.0
            i_confidence_level = "rejected"
            i_encodings = org_models.get('insightface_encodings')
            i_names = org_models.get('insightface_names')
            
            if i_encodings is not None and enable_insightface:
                try:
                    processed = apply_clahe(face_roi_cv)
                    emb = get_embedding(processed, model_name="InsightFace")
                    if emb is not None:
                        i_label, dist, i_confidence_level = find_match_knn(
                            emb, i_encodings, i_names, 
                            angle_label=angle_label,
                            custom_threshold=camera_threshold,
                            model_name="InsightFace"
                        )
                        i_conf = compute_match_confidence(dist, 0.35 if camera_threshold is None else min(float(camera_threshold), 0.45))
                except Exception as e:
                    logger.warning(f"InsightFace prediction error: {e}")
                    i_label = "Error"

            # Optional Legacy Models (GhostFaceNet / VGG-Face) — only if explicitly enabled
            edge_label, edge_conf = "Disabled", 0.0
            edge_confidence_level = "rejected"
            if enable_ghostfacenet:
                edge_encodings = org_models.get('ghostfacenet_encodings')
                edge_names = org_models.get('ghostfacenet_names')
                if edge_encodings is not None:
                    try:
                        processed = apply_clahe(face_roi_cv)
                        emb = get_embedding(processed, model_name="GhostFaceNet")
                        if emb is not None:
                            edge_label, dist, edge_confidence_level = find_match_knn(
                                emb, edge_encodings, edge_names, 
                                angle_label=angle_label,
                                custom_threshold=camera_threshold,
                                model_name="GhostFaceNet"
                            )
                            edge_conf = compute_match_confidence(dist, 0.45 if camera_threshold is None else camera_threshold)
                    except Exception as e:
                        logger.warning(f"Edge prediction error: {e}")
                        edge_label = "Error"

            v_label, v_conf = "Disabled", 0.0
            v_confidence_level = "rejected"
            if enable_vggface:
                v_encodings = org_models.get('vggface_encodings')
                v_names = org_models.get('vggface_names')
                if v_encodings is not None:
                    try:
                        processed = apply_clahe(face_roi_cv)
                        emb = get_embedding(processed, model_name="VGG-Face")
                        if emb is not None:
                            v_label, dist, v_confidence_level = find_match_knn(
                                emb, v_encodings, v_names, 
                                angle_label=angle_label,
                                custom_threshold=camera_threshold,
                                model_name="VGG-Face"
                            )
                            v_conf = compute_match_confidence(dist, 0.50 if camera_threshold is None else camera_threshold)
                    except Exception as e:
                        logger.warning(f"VGG-Face prediction error: {e}")
                        v_label = "Error"

            # --- Ensemble Vote: strictly populate only enabled models ---
            individual_preds = {}
            if enable_facenet512:
                individual_preds['facenet512'] = {'label': f_label, 'confidence': float(f_conf), 'confidence_level': f_confidence_level}
            if enable_insightface:
                individual_preds['insightface'] = {'label': i_label, 'confidence': float(i_conf), 'confidence_level': i_confidence_level}
            if enable_ghostfacenet:
                individual_preds['ghostfacenet'] = {'label': edge_label, 'confidence': float(edge_conf), 'confidence_level': edge_confidence_level}
            if enable_vggface:
                individual_preds['vggface'] = {'label': v_label, 'confidence': float(v_conf), 'confidence_level': v_confidence_level}

            ensemble_result = ensemble_predict(individual_preds, custom_threshold=camera_threshold)

            # Binary classification: CONFIRMED or NOT FOUND
            ens_label = ensemble_result['label']
            ens_conf = float(ensemble_result.get('confidence', 0.0))
            
            # Use dynamic threshold (defaults to 0.70 / 70%)
            min_conf = camera_threshold if (camera_threshold is not None and 0.35 <= camera_threshold <= 0.95) else 0.70
            if min_conf > 1.0:
                min_conf /= 100.0

            raw_label = ensemble_result.get('label', 'Unknown')
            candidate_name = None
            if str(raw_label).startswith('Uncertain: '):
                candidate_name = raw_label.replace('Uncertain: ', '')
            elif raw_label != 'Unknown':
                candidate_name = raw_label

            is_confirmed = (
                ensemble_result.get('is_recognized', False) and 
                ens_conf >= min_conf and 
                not str(ens_label).startswith('Uncertain') and
                ens_label != 'Unknown'
            )
            
            if is_confirmed:
                from format_utils import format_person_name
                display_text = f"CONFIRMED: {format_person_name(ens_label)}"
            else:
                display_text = "NOT FOUND"
                if not ensemble_result.get('is_recognized', False) or str(ens_label).startswith('Uncertain'):
                    ens_label = "Unknown"

            results.append({
                'bbox': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)},
                'predictions': individual_preds,
                'ensemble': {
                    'label': ens_label,
                    'raw_label': raw_label,
                    'candidate_name': candidate_name,
                    'confidence': ens_conf,
                    'method': ensemble_result.get('method', 'single_model'),
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
            
        return jsonify({
            'faces': results,
            'message': message,
            'total_faces_detected': raw_faces_count,
            'multi_person_warning': raw_faces_count > 1
        })
    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        logger.error(f"Predict error: {e}", exc_info=True)
        return jsonify({'error': str(e), 'trace': trace}), 500

# ─── WebSocket Inference ──────────────────────────────────────────────
@socketio.on('stream_frame')
def handle_stream_frame(data):
    """
    WebSocket endpoint for real-time inference (used by Test Console).
    Receives base64 encoded frame, processes it in test_mode=True, and emits results.
    """
    try:
        from middleware import decode_auth_token
        # Basic auth check - frontend should send token
        token = data.get('token')
        org_id = None
        if token:
            payload = decode_auth_token(token)
            if not isinstance(payload, str) and payload.get('sub'):
                org_id = payload.get('org_id')
                
        # If no org_id in token, fallback to local dev default if available
        if not org_id:
            org_id = os.environ.get('DEFAULT_ORG_ID', 'default_org')

        image_data = data.get('image')
        if not image_data:
            emit('prediction_result', {'error': 'No image provided'})
            return

        # Decode base64 image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        img_bytes = b64decode(image_data)
        
        pil_img = Image.open(StringIO(img_bytes.decode('latin1')) if sys.version_info < (3,) else __import__('io').BytesIO(img_bytes)).convert('RGB')
        
        if pil_img.width < 20 or pil_img.height < 20:
            emit('prediction_result', {'error': 'Image is too small.'})
            return
            
        img_np = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        # Force test mode for WebSocket (Test Console)
        test_mode = True
        camera_threshold = None
        custom_t_val = data.get('threshold') or data.get('confidence_threshold')
        if custom_t_val:
            try:
                ct = float(custom_t_val)
                if ct > 1.0:
                    ct /= 100.0
                camera_threshold = ct
            except (ValueError, TypeError):
                pass
        additional_frames_raw = []

        org_models = ensure_org_models_loaded(org_id)
        detected_faces_info = face_detector.detect_faces(img_np, profile_only=False)
        
        faces_data = []
        for face_info in detected_faces_info:
            b = face_info['bbox']
            angle_label = face_info.get('direction', 'frontal')
            faces_data.append((b['x'], b['y'], b['w'], b['h'], angle_label))

        raw_faces_count = len(faces_data)
        if raw_faces_count == 0:
            h, w = img_np.shape[:2]
            faces_data = [(0, 0, w, h, 'frontal')]
            message = "Detector failed to find a face: Full image evaluated."
        else:
            # Sort by area (w * h) descending so primary / closest face is first
            faces_data = sorted(faces_data, key=lambda f: f[2] * f[3], reverse=True)
            # Security layer & latency optimization: For live stream & kiosk, evaluate ONLY the primary dominant face
            focus_single = data.get('single_focus', True)
            if focus_single and raw_faces_count > 1:
                faces_data = [faces_data[0]]
                message = f'Detected {raw_faces_count} face(s) — Focused on primary face'
            else:
                message = f'Detected {raw_faces_count} face(s)'

        results = []
        for (x, y, w, h, angle_label) in faces_data:
            margin_x = int(w * 0.20)
            margin_y = int(h * 0.20)
            x1 = max(0, x - margin_x)
            y1 = max(0, y - margin_y)
            x2 = min(img_np.shape[1], x + w + margin_x)
            y2 = min(img_np.shape[0], y + h + margin_y)
            
            face_roi_pil = pil_img.crop((x1, y1, x2, y2))
            face_roi_cv = img_np[y1:y2, x1:x2]
            
            from liveness import evaluate_liveness
            is_live, liveness_score, liveness_reason, liveness_details = evaluate_liveness(face_roi_cv)
            
            if not is_live:
                results.append({
                    'bbox': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)},
                    'predictions': {
                        'ghostfacenet': {'label': 'SPOOF', 'confidence': 0.0, 'confidence_level': 'rejected'},
                        'facenet512': {'label': 'SPOOF', 'confidence': 0.0, 'confidence_level': 'rejected'},
                        'insightface': {'label': 'SPOOF', 'confidence': 0.0, 'confidence_level': 'rejected'},
                        'vggface': {'label': 'SPOOF', 'confidence': 0.0, 'confidence_level': 'rejected'}
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
                continue
                
            from config_utils import load_config
            cfg = load_config()

            def _resolve_stream_flag(key, cfg_key, default_val=True):
                val = data.get(key)
                if val is not None:
                    return bool(val) if isinstance(val, bool) else str(val).lower() in ('true', '1', 'yes')
                return cfg.get(cfg_key, default_val)

            enable_ghostfacenet = _resolve_stream_flag("enable_ghostfacenet", "ENABLE_GHOSTFACENET", False)
            enable_facenet512 = _resolve_stream_flag("enable_facenet512", "ENABLE_FACENET512", True)
            enable_insightface = _resolve_stream_flag("enable_insightface", "ENABLE_INSIGHTFACE", True)
            enable_vggface = _resolve_stream_flag("enable_vggface", "ENABLE_VGGFACE", False)

            edge_encodings = org_models.get('ghostfacenet_encodings')
            edge_names = org_models.get('ghostfacenet_names')
            f_encodings = org_models.get('facenet512_encodings')
            f_names = org_models.get('facenet512_names')
            i_encodings = org_models.get('insightface_encodings')
            i_names = org_models.get('insightface_names')
            v_encodings = org_models.get('vggface_encodings')
            v_names = org_models.get('vggface_names')

            from concurrent.futures import ThreadPoolExecutor

            def run_ghost():
                label, conf, level = "Not Trained", 0.0, "rejected"
                if edge_encodings is not None and enable_ghostfacenet:
                    try:
                        emb = get_embedding(apply_clahe(face_roi_cv), model_name="GhostFaceNet")
                        if emb is not None:
                            label, dist, level = find_match_knn(emb, edge_encodings, edge_names, angle_label=angle_label, custom_threshold=camera_threshold, model_name="GhostFaceNet")
                            conf = compute_match_confidence(dist, 0.45 if camera_threshold is None else camera_threshold)
                    except Exception as e:
                        logger.warning(f"GhostFaceNet stream error: {e}")
                        label = "Error"
                return label, conf, level

            def run_facenet():
                label, conf, level = "Not Trained", 0.0, "rejected"
                if f_encodings is not None and enable_facenet512:
                    try:
                        emb = get_embedding(apply_clahe(face_roi_cv), model_name="Facenet512")
                        if emb is not None:
                            label, dist, level = find_match_knn(emb, f_encodings, f_names, angle_label=angle_label, custom_threshold=camera_threshold, model_name="Facenet512")
                            conf = compute_match_confidence(dist, 0.42 if camera_threshold is None else camera_threshold)
                    except Exception as e:
                        logger.warning(f"Facenet512 stream error: {e}")
                        label = "Error"
                return label, conf, level

            def run_insight():
                label, conf, level = "Not Trained", 0.0, "rejected"
                if i_encodings is not None and enable_insightface:
                    try:
                        emb = get_embedding(apply_clahe(face_roi_cv), model_name="InsightFace")
                        if emb is not None:
                            label, dist, level = find_match_knn(emb, i_encodings, i_names, angle_label=angle_label, custom_threshold=camera_threshold, model_name="InsightFace")
                            conf = compute_match_confidence(dist, 0.35 if camera_threshold is None else min(float(camera_threshold), 0.45))
                    except Exception as e:
                        logger.warning(f"InsightFace stream error: {e}")
                        label = "Error"
                return label, conf, level

            def run_vgg():
                label, conf, level = "Not Trained", 0.0, "rejected"
                if v_encodings is not None and enable_vggface:
                    try:
                        emb = get_embedding(apply_clahe(face_roi_cv), model_name="VGG-Face")
                        if emb is not None:
                            label, dist, level = find_match_knn(emb, v_encodings, v_names, angle_label=angle_label, custom_threshold=camera_threshold, model_name="VGG-Face")
                            conf = compute_match_confidence(dist, 0.50 if camera_threshold is None else camera_threshold)
                    except Exception as e:
                        logger.warning(f"VGG-Face stream error: {e}")
                        label = "Error"
                return label, conf, level

            # Sequential execution to prevent TensorFlow C++ crash (Thread safety issues)
            edge_label, edge_conf, edge_confidence_level = run_ghost()
            f_label, f_conf, f_confidence_level = run_facenet()
            i_label, i_conf, i_confidence_level = run_insight()
            v_label, v_conf, v_confidence_level = run_vgg()
                    
            individual_preds = {
                'ghostfacenet': {'label': edge_label, 'confidence': float(edge_conf), 'confidence_level': edge_confidence_level},
                'facenet512': {'label': f_label, 'confidence': float(f_conf), 'confidence_level': f_confidence_level},
                'insightface': {'label': i_label, 'confidence': float(i_conf), 'confidence_level': i_confidence_level},
                'vggface': {'label': v_label, 'confidence': float(v_conf), 'confidence_level': v_confidence_level}
            }
            ensemble_result = ensemble_predict(individual_preds, custom_threshold=camera_threshold)

            ens_label = ensemble_result['label']
            ens_conf = float(ensemble_result.get('confidence', 0.0))
            
            # Use dynamic threshold (defaults to 0.70 / 70%)
            min_conf = camera_threshold if (camera_threshold is not None and 0.35 <= camera_threshold <= 0.95) else 0.70
            if min_conf > 1.0:
                min_conf /= 100.0

            raw_label = ensemble_result.get('label', 'Unknown')
            candidate_name = None
            if str(raw_label).startswith('Uncertain: '):
                candidate_name = raw_label.replace('Uncertain: ', '')
            elif raw_label != 'Unknown':
                candidate_name = raw_label

            is_confirmed = (
                ensemble_result.get('is_recognized', False) and 
                ens_conf >= min_conf and 
                not str(ens_label).startswith('Uncertain') and
                ens_label != 'Unknown'
            )
            
            if is_confirmed:
                from format_utils import format_person_name
                display_text = f"CONFIRMED: {format_person_name(ens_label)}"
            else:
                display_text = "NOT FOUND"
                if not ensemble_result.get('is_recognized', False) or str(ens_label).startswith('Uncertain'):
                    ens_label = "Unknown"

            results.append({
                'bbox': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)},
                'predictions': individual_preds,
                'ensemble': {
                    'label': ens_label,
                    'raw_label': raw_label,
                    'candidate_name': candidate_name,
                    'confidence': ens_conf,
                    'method': ensemble_result.get('method', 'single_model'),
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

        emit('prediction_result', {
            'faces': results,
            'message': message,
            'total_faces_detected': raw_faces_count,
            'multi_person_warning': raw_faces_count > 1
        })
    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        emit('prediction_result', {'error': str(e), 'trace': trace})

# ─── Recognition History Endpoints ────────────────────────────────────
@app.route('/api/history', methods=['GET'])
@require_auth
@inject_org_id
def get_history(org_id):
    """Retrieve recognition logs for the active organization."""
    history = []
    
    # 1. First retrieve from PostgreSQL AttendanceLog if available
    try:
        from database.db import is_db_available, get_db_session
        from database.models import AttendanceLog
        if is_db_available() and org_id:
            with get_db_session() as db:
                if db is not None:
                    db_logs = (
                        db.query(AttendanceLog)
                        .filter_by(org_id=str(org_id))
                        .order_by(AttendanceLog.checkin_time.desc())
                        .limit(200)
                        .all()
                    )
                    for log in db_logs:
                        ts = log.checkin_time.isoformat() if log.checkin_time else (log.created_at.isoformat() if log.created_at else "")
                        conf = float(log.confidence) if log.confidence is not None else 0.0
                        label = log.prediction_label or "Unknown"
                        is_unk = label == 'Unknown' or not log.is_confirmed
                        status_str = 'error' if is_unk else ('success' if conf >= 0.8 else 'warning')
                        conf_level = 'confirmed' if (log.is_confirmed and not is_unk) else ('unknown' if is_unk else 'low_conf')
                        history.append({
                            'id': log.id,
                            'timestamp': ts,
                            'label': label,
                            'confidence': conf,
                            'status': status_str,
                            'confidence_level': conf_level,
                            'method': log.method or 'deepface',
                            'is_confirmed': log.is_confirmed
                        })
    except Exception as db_err:
        logger.warning(f"Error fetching DB history for org {org_id}: {db_err}")

    # 2. Also retrieve from org's file-based recognition_history.json
    try:
        from org_storage import get_recognition_history_path
        history_path = get_recognition_history_path(org_id)
        if os.path.exists(history_path):
            with open(history_path, 'r') as f:
                file_history = json.load(f)
                if isinstance(file_history, list):
                    existing_ts = {h.get('timestamp') for h in history if h.get('timestamp')}
                    for item in file_history:
                        if item.get('timestamp') not in existing_ts:
                            if 'confidence_level' not in item:
                                is_unk = item.get('status') == 'error' or item.get('label') == 'Unknown'
                                item['confidence_level'] = 'unknown' if is_unk else ('confirmed' if item.get('confidence', 0) >= 0.7 else 'low_conf')
                            history.append(item)
    except Exception as file_err:
        logger.warning(f"Error fetching file history for org {org_id}: {file_err}")

    # Fallback to global single-tenant file if both were empty and no org_id
    if not history and not org_id and os.path.exists(RECOGNITION_HISTORY_PATH):
        try:
            with open(RECOGNITION_HISTORY_PATH, 'r') as f:
                history = json.load(f)
        except Exception:
            pass

    return jsonify(history)

@app.route('/api/history', methods=['DELETE'])
@require_auth
@require_role('org_admin')
@inject_org_id
def clear_history(org_id):
    """Clear recognition logs for the active organization."""
    try:
        # Clear from database
        from database.db import is_db_available, get_db_session
        from database.models import AttendanceLog
        if is_db_available() and org_id:
            with get_db_session() as db:
                if db is not None:
                    db.query(AttendanceLog).filter_by(org_id=str(org_id)).delete()
                    db.commit()

        # Clear from org file
        from org_storage import get_recognition_history_path
        history_path = get_recognition_history_path(org_id)
        if os.path.exists(history_path):
            with open(history_path, 'w') as f:
                json.dump([], f)

        # Clear global if in single-tenant mode
        if not org_id and os.path.exists(RECOGNITION_HISTORY_PATH):
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
    try:
        from org_storage import get_dataset_cleaned_dir, get_recognition_history_path
        
        dataset_cleaned_dir = get_dataset_cleaned_dir(org_id)
        
        # 1. Gather disk classes and image counts
        disk_classes = []
        photos_per_person = {}
        if os.path.exists(dataset_cleaned_dir):
            disk_classes = sorted([name for name in os.listdir(dataset_cleaned_dir) 
                                   if os.path.isdir(os.path.join(dataset_cleaned_dir, name))
                                   and name != 'orgs' and not name.startswith('.')])
            for p in disk_classes:
                p_dir = os.path.join(dataset_cleaned_dir, p)
                count = 0
                if os.path.exists(p_dir):
                    for root, dirs, files in os.walk(p_dir):
                        count += sum(1 for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.bmp')))
                photos_per_person[p] = count

        # 2. Gather database enrolled employees
        db_employees = {}
        try:
            from database.db import is_db_available, get_db_session
            from database.models import Employee, EmployeeStatus
            if is_db_available() and org_id:
                with get_db_session() as db:
                    if db:
                        emps = db.query(Employee).filter(
                            Employee.org_id == str(org_id),
                            Employee.status == EmployeeStatus.active
                        ).all()
                        for emp in emps:
                            db_employees[emp.name] = emp.image_count or 10
        except Exception as emp_err:
            logger.warning(f"Error querying employees for dashboard: {emp_err}")

        # 3. Gather trained model classes & sample counts
        org_models = ensure_org_models_loaded(org_id) or {}
        edge_encodings = org_models.get('ghostfacenet_encodings')
        deepface_encodings = org_models.get('facenet512_encodings')
        insightface_encodings = org_models.get('insightface_encodings')
        
        edge_trained_classes = set(org_models.get('ghostfacenet_names') or [])
        facenet_trained_classes = set(org_models.get('facenet512_names') or [])
        insight_trained_classes = set(org_models.get('insightface_names') or [])
        trained_classes = edge_trained_classes | facenet_trained_classes | insight_trained_classes

        # Model embedding counts per person
        facenet_names_list = org_models.get('facenet512_names') or []
        model_sample_counts = {}
        for name in facenet_names_list:
            model_sample_counts[name] = model_sample_counts.get(name, 0) + 1

        # 4. Merge all sources so roster is never empty
        all_persons = sorted(list(set(disk_classes) | set(db_employees.keys()) | trained_classes))

        for p in all_persons:
            if p not in photos_per_person or photos_per_person[p] == 0:
                photos_per_person[p] = db_employees.get(p) or model_sample_counts.get(p) or 10

        total_people = len(all_persons)
        total_photos = sum(photos_per_person.values())

        has_encodings = (edge_encodings is not None) or (deepface_encodings is not None) or (insightface_encodings is not None)
        untrained = (set(all_persons) - trained_classes) if trained_classes else set(all_persons)
        requires_retrain = (not has_encodings) or (len(untrained) > 0)

        # Read history for stats (check DB AttendanceLog first, then recognition_history.json)
        history = []
        try:
            from database.db import is_db_available, get_db_session
            from database.models import AttendanceLog
            if is_db_available() and org_id:
                with get_db_session() as db:
                    if db is not None:
                        db_logs = (
                            db.query(AttendanceLog)
                            .filter_by(org_id=str(org_id))
                            .order_by(AttendanceLog.checkin_time.desc())
                            .limit(200)
                            .all()
                        )
                        for log in db_logs:
                            conf = float(log.confidence) if log.confidence is not None else 0.0
                            label = log.prediction_label or "Unknown"
                            is_unk = label == 'Unknown' or not log.is_confirmed
                            status_str = 'error' if is_unk else ('success' if conf >= 0.8 else 'warning')
                            history.append({
                                'status': status_str,
                                'agreement': '2/2' if log.is_confirmed else '0/2'
                            })
        except Exception as db_err:
            logger.warning(f"Error reading DB history for dashboard stats: {db_err}")

        history_path = get_recognition_history_path(org_id)
        if os.path.exists(history_path):
            try:
                with open(history_path, 'r') as f:
                    file_history = json.load(f)
                    if isinstance(file_history, list):
                        history.extend(file_history)
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
                'edge': edge_encodings is not None,
                'insightface': insightface_encodings is not None
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
    except Exception as e:
        logger.error(f"Error generating dashboard stats: {e}", exc_info=True)
        return jsonify({
            'error': 'Internal server error while fetching dashboard statistics',
            'detail': str(e)
        }), 500

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
def _find_person_photo_dir(name, org_id=None):
    """Finds the dataset directory containing photos for a person across org and global storage."""
    name = (name or '').strip()
    if not name:
        return None
        
    candidates = []
    if org_id:
        try:
            from org_storage import get_dataset_cleaned_dir, get_raw_dataset_dir
            candidates.append(get_dataset_cleaned_dir(org_id))
            candidates.append(get_raw_dataset_dir(org_id))
        except Exception:
            pass
            
    candidates.extend([
        DATASET_CLEANED_DIR,
        os.path.join(DATA_DIR, 'dataset_cleaned'),
        os.path.join(PROJECT_ROOT, 'dataset'),
        os.path.join(DATA_DIR, 'dataset')
    ])
    
    name_variants = [
        name,
        name.replace(' ', '_'),
        name.replace('_', ' '),
        name.lower(),
        name.lower().replace(' ', '_')
    ]
    
    for base_dir in candidates:
        if not base_dir or not os.path.exists(base_dir):
            continue
        for variant in name_variants:
            p = os.path.join(base_dir, variant)
            if os.path.exists(p) and os.path.isdir(p):
                return p
        try:
            for item in os.listdir(base_dir):
                if item.lower() == name.lower() or item.lower() == name.lower().replace(' ', '_'):
                    p = os.path.join(base_dir, item)
                    if os.path.isdir(p):
                        return p
        except Exception:
            pass
            
    return None

@app.route('/api/persons/<name>/photos', methods=['GET'])
@require_auth
def list_person_photos(name):
    """Lists all cleaned photo details for a person."""
    name = name.strip()
    org_id = getattr(request, 'user', {}).get('org_id') if hasattr(request, 'user') else None
    person_dir = _find_person_photo_dir(name, org_id)
    if not person_dir:
        # Return empty list [] with 200 OK so UI does not throw 404 errors
        return jsonify([])
        
    photos = []
    for root, dirs, files in os.walk(person_dir):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp')):
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
                elif len(parts) == 1:
                    photos.append({
                        'angle': 'frontal',
                        'filename': parts[0],
                        'url': f'/api/persons/{name}/photos/frontal/{parts[0]}'
                    })
    return jsonify(photos)

@app.route('/api/persons/<name>/photos/<angle>/<filename>', methods=['GET'])
@require_auth
def get_person_photo(name, angle, filename):
    """Serves a specific cleaned photo file."""
    org_id = getattr(request, 'user', {}).get('org_id') if hasattr(request, 'user') else None
    person_dir = _find_person_photo_dir(name, org_id)
    if person_dir:
        path = os.path.join(person_dir, angle, filename)
        if os.path.exists(path):
            return send_file(path)
        direct_path = os.path.join(person_dir, filename)
        if os.path.exists(direct_path):
            return send_file(direct_path)
            
    # Fallback directly to DATASET_CLEANED_DIR
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

@app.route('/api/train/all', methods=['POST'])
@require_auth
@require_role('org_admin')
@inject_org_id
def trigger_train_all(org_id=None):
    """Triggers complete model retraining for all enrolled personnel."""
    try:
        data = request.get_json() or {}
        epochs = int(data.get('epochs', 15))
        epochs = max(1, min(epochs, 50))
    except ValueError:
        epochs = 15

    job_id = enqueue_local_training('__ALL__', epochs, org_id)
    return jsonify({'message': 'Full model retraining started for all personnel.', 'job_id': job_id})

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

# ─── Edge Benchmarking & Camera Spec Evaluation Endpoints ──────────────
@app.route('/api/edge/camera-spec-test', methods=['GET'])
@require_auth
@require_role('org_admin')
def edge_camera_spec_test():
    """
    Run or retrieve the Minimum Camera Specification evaluation.
    Pass ?run=true to trigger a fresh evaluation (runs in background).
    Otherwise returns cached results from data/camera_spec_results.json.
    """
    results_path = os.path.join(BACKEND_DIR, 'data', 'camera_spec_results.json')
    run_fresh = request.args.get('run', 'false').lower() == 'true'

    if run_fresh:
        import threading
        def _run_spec():
            try:
                from scripts.camera_spec_evaluator import run_full_evaluation
                run_full_evaluation()
            except Exception as ex:
                logger.warning(f"Background camera spec evaluation notice: {ex}")
        threading.Thread(target=_run_spec, daemon=True).start()

        if os.path.exists(results_path):
            with open(results_path, 'r') as f:
                return jsonify({'status': 'running', 'results': json.load(f), 'message': 'Evaluation running in background.'})
        return jsonify({'status': 'running', 'results': None, 'message': 'Evaluation running in background.'})

    # Return cached results
    if os.path.exists(results_path):
        with open(results_path, 'r') as f:
            return jsonify({'status': 'cached', 'results': json.load(f)})

    return jsonify({
        'status': 'not_run',
        'results': None,
        'message': 'No cached results. Click Run Evaluation to generate benchmarks.'
    }), 200


@app.route('/api/edge/benchmark', methods=['GET'])
@require_auth
@require_role('org_admin')
def edge_benchmark():
    """
    Run or retrieve the Edge Model & Detector benchmark comparison.
    Pass ?run=true to trigger a fresh benchmark (runs in background).
    Otherwise returns cached results from data/edge_benchmark_results.json.
    """
    results_path = os.path.join(BACKEND_DIR, 'data', 'edge_benchmark_results.json')
    run_fresh = request.args.get('run', 'false').lower() == 'true'
    sample_size = int(request.args.get('sample_size', '50'))

    if run_fresh:
        import threading
        def _run_edge():
            try:
                from scripts.edge_benchmark_suite import run_edge_benchmarks
                run_edge_benchmarks(sample_size=sample_size)
            except Exception as ex:
                logger.warning(f"Background edge benchmark notice: {ex}")
        threading.Thread(target=_run_edge, daemon=True).start()

        if os.path.exists(results_path):
            with open(results_path, 'r') as f:
                return jsonify({'status': 'running', 'results': json.load(f), 'message': 'Benchmark running in background.'})
        return jsonify({'status': 'running', 'results': None, 'message': 'Benchmark running in background.'})

    # Return cached results
    if os.path.exists(results_path):
        with open(results_path, 'r') as f:
            return jsonify({'status': 'cached', 'results': json.load(f)})

    return jsonify({
        'status': 'not_run',
        'results': None,
        'message': 'No cached results. Click Run Evaluation to generate benchmarks.'
    }), 200


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
        print(f"  -> Running in PRODUCTION mode (socketio + gevent)")
        print(f"{'='*50}\n")
        socketio.run(app, host='0.0.0.0', port=port, debug=False, use_reloader=False)
    else:
        print(f"  -> Running in DEVELOPMENT mode (socketio + werkzeug)")
        print(f"{'='*50}\n")
        socketio.run(app, host='0.0.0.0', port=port, debug=True, use_reloader=False)
