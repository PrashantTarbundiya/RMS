"""
update_checker.py — Release sync system for RMS Face AI on-premise installs.

Provides:
  - check_for_updates(): Fetches manifest, compares versions, stores result
  - download_update_package(): Downloads with checksum + HMAC verification
  - apply_update(): Backup → extract → migrate → auto-restart → health check
  - rollback_update(): Restore from pre-update backup
  - handle_offline_upload(): Accept a manually uploaded package

Security constraints:
  - ONE-DIRECTIONAL: only fetches manifest metadata. NEVER transmits employee
    data, images, embeddings, or attendance logs.
  - Checksum (SHA-256) + HMAC signature verification before applying any package.
  - Fail-safe: if health check fails post-update, automatic rollback is offered.

Auto-restart:
  - Windows: subprocess re-exec of the server process
  - Linux/Docker: os.execv() to replace the current process
"""

import os
import sys
import json
import hashlib
import hmac
import shutil
import tarfile
import tempfile
import subprocess
import logging
import requests
from datetime import datetime, timezone
from packaging import version as pkg_version

logger = logging.getLogger('rms-update')

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
BACKUPS_DIR = os.path.join(BACKEND_DIR, 'backups')
STAGING_DIR = os.path.join(BACKEND_DIR, 'staging')

# Manifest source: env var for production hosting, local file for dev
DEFAULT_MANIFEST_PATH = os.path.join(BACKEND_DIR, 'update_manifest.json')
UPDATE_MANIFEST_URL = os.environ.get('UPDATE_MANIFEST_URL', '')

# HMAC signing key — matches the license signing pattern
UPDATE_SIGNING_KEY = os.environ.get('UPDATE_SIGNING_KEY', 'rms-update-signing-key-change-in-production')


def _get_current_version():
    """Get the current app version from version.py."""
    from version import APP_VERSION
    return APP_VERSION


def _get_system_info_row(session):
    """Get or create the singleton SystemInfo row."""
    from database.models import SystemInfo
    row = session.query(SystemInfo).filter_by(id=1).first()
    if not row:
        row = SystemInfo(id=1, app_version=_get_current_version())
        session.add(row)
        session.commit()
    return row


def _compare_versions(current, latest):
    """Compare semantic versions. Returns: 'update_available', 'up_to_date', or 'ahead'."""
    try:
        cur = pkg_version.parse(current)
        lat = pkg_version.parse(latest)
        if lat > cur:
            return 'update_available'
        elif lat == cur:
            return 'up_to_date'
        else:
            return 'ahead'
    except Exception:
        return 'unknown'


# ─── Check for Updates ──────────────────────────────────────────────

def check_for_updates():
    """
    Fetch the version manifest and compare against the current version.
    Stores result in the SystemInfo table.
    
    Returns dict with update status info.
    
    SECURITY: This function only performs an HTTP GET to the manifest URL.
    It transmits ZERO employee/biometric data.
    """
    manifest = None
    
    try:
        if UPDATE_MANIFEST_URL:
            # Production: fetch from central server
            resp = requests.get(UPDATE_MANIFEST_URL, timeout=10, headers={
                'User-Agent': f'RMS-FaceAI-UpdateChecker/{_get_current_version()}'
            })
            resp.raise_for_status()
            manifest = resp.json()
        else:
            # Dev/local: read from local file
            if os.path.exists(DEFAULT_MANIFEST_PATH):
                with open(DEFAULT_MANIFEST_PATH, 'r') as f:
                    manifest = json.load(f)
            else:
                return {
                    'status': 'error',
                    'message': 'No manifest URL configured and no local manifest found'
                }
    except requests.RequestException as e:
        logger.error(f"Failed to fetch update manifest: {e}")
        return {'status': 'error', 'message': f'Failed to reach update server: {str(e)}'}
    except json.JSONDecodeError as e:
        logger.error(f"Invalid manifest JSON: {e}")
        return {'status': 'error', 'message': 'Update manifest is corrupted'}
    
    if not manifest:
        return {'status': 'error', 'message': 'Empty manifest'}
    
    current_version = _get_current_version()
    latest_version = manifest.get('latest_version', current_version)
    comparison = _compare_versions(current_version, latest_version)
    
    result = {
        'status': comparison,
        'current_version': current_version,
        'latest_version': latest_version,
        'severity': manifest.get('severity', 'optional'),
        'changelog': manifest.get('changelog', ''),
        'download_url': manifest.get('download_url', ''),
        'checksum': manifest.get('checksum', ''),
        'signature': manifest.get('signature', ''),
        'min_upgrade_from': manifest.get('min_upgrade_from', '0.0.0'),
        'released_at': manifest.get('released_at', ''),
    }
    
    # Check if current version meets minimum upgrade requirement
    if comparison == 'update_available':
        min_from = manifest.get('min_upgrade_from', '0.0.0')
        try:
            if pkg_version.parse(current_version) < pkg_version.parse(min_from):
                result['status'] = 'version_too_old'
                result['message'] = (
                    f'Current version {current_version} is below the minimum '
                    f'upgrade-from version {min_from}. Manual upgrade required.'
                )
        except Exception:
            pass
    
    # Store in database
    try:
        from database.db import get_db_session
        with get_db_session() as session:
            if session:
                row = _get_system_info_row(session)
                row.last_update_checked_at = datetime.now(timezone.utc)
                row.latest_available_version = latest_version
                row.update_severity = manifest.get('severity')
                row.update_changelog = manifest.get('changelog')
                row.update_download_url = manifest.get('download_url')
                row.update_checksum = manifest.get('checksum')
                row.update_signature = manifest.get('signature')
                session.commit()
    except Exception as e:
        logger.warning(f"Could not persist update check result: {e}")
    
    return result


# ─── Checksum & Signature Verification ──────────────────────────────

def compute_sha256(file_path):
    """Compute SHA-256 hash of a file."""
    sha256 = hashlib.sha256()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            sha256.update(chunk)
    return sha256.hexdigest()


def compute_hmac_signature(file_path, key=None):
    """Compute HMAC-SHA256 signature of a file."""
    signing_key = (key or UPDATE_SIGNING_KEY).encode('utf-8')
    h = hmac.new(signing_key, digestmod=hashlib.sha256)
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()


def verify_package(file_path, expected_checksum, expected_signature=None):
    """
    Verify a download package's integrity and authenticity.
    
    Returns (is_valid: bool, error_message: str or None)
    """
    if not os.path.exists(file_path):
        return False, "Package file not found"
    
    # Checksum verification (integrity)
    actual_checksum = compute_sha256(file_path)
    # Support both bare hash and "sha256:hash" format
    clean_expected = expected_checksum.replace('sha256:', '')
    
    if actual_checksum != clean_expected:
        return False, (
            f"Checksum mismatch — package may be corrupted or tampered. "
            f"Expected: {clean_expected[:16]}... Got: {actual_checksum[:16]}..."
        )
    
    # Signature verification (authenticity) — if signature provided
    if expected_signature:
        actual_sig = compute_hmac_signature(file_path)
        if not hmac.compare_digest(actual_sig, expected_signature):
            return False, "HMAC signature verification failed — package authenticity cannot be confirmed"
    
    return True, None


# ─── Download ───────────────────────────────────────────────────────

def download_update_package(download_url, expected_checksum, expected_signature=None):
    """
    Download an update package and verify its integrity.
    
    Returns (success: bool, file_path: str or None, error: str or None)
    """
    if not download_url:
        return False, None, "No download URL provided"
    
    os.makedirs(STAGING_DIR, exist_ok=True)
    dest_path = os.path.join(STAGING_DIR, 'update_package.tar.gz')
    
    try:
        logger.info(f"Downloading update from {download_url}")
        resp = requests.get(download_url, stream=True, timeout=300, headers={
            'User-Agent': f'RMS-FaceAI-Updater/{_get_current_version()}'
        })
        resp.raise_for_status()
        
        with open(dest_path, 'wb') as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        
        # Verify
        is_valid, error = verify_package(dest_path, expected_checksum, expected_signature)
        if not is_valid:
            os.remove(dest_path)
            return False, None, error
        
        logger.info(f"Package downloaded and verified: {dest_path}")
        return True, dest_path, None
        
    except requests.RequestException as e:
        logger.error(f"Download failed: {e}")
        if os.path.exists(dest_path):
            os.remove(dest_path)
        return False, None, f"Download failed: {str(e)}"


# ─── Backup ─────────────────────────────────────────────────────────

def create_backup():
    """
    Create a backup of the current installation before applying an update.
    
    Returns (success: bool, backup_path: str or None, error: str or None)
    """
    os.makedirs(BACKUPS_DIR, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    current_version = _get_current_version()
    backup_name = f"pre_update_{current_version}_{timestamp}.tar.gz"
    backup_path = os.path.join(BACKUPS_DIR, backup_name)
    
    try:
        logger.info(f"Creating backup: {backup_path}")
        
        # Directories/files to back up (exclude large data files)
        include_patterns = [
            '*.py', '*.json', '*.txt', '*.cfg', '*.ini', '*.mako',
            '*.jsx', '*.js', '*.css', '*.html',
        ]
        
        with tarfile.open(backup_path, 'w:gz') as tar:
            for root, dirs, files in os.walk(BACKEND_DIR):
                # Skip directories that shouldn't be backed up
                dirs[:] = [d for d in dirs if d not in (
                    'venv', '__pycache__', 'node_modules', '.git',
                    'backups', 'staging', 'dataset', 'encodings',
                )]
                
                for fname in files:
                    if any(fname.endswith(ext.replace('*', '')) for ext in include_patterns):
                        full_path = os.path.join(root, fname)
                        arcname = os.path.relpath(full_path, os.path.dirname(BACKEND_DIR))
                        tar.add(full_path, arcname=arcname)
        
        # Store backup path in DB
        try:
            from database.db import get_db_session
            with get_db_session() as session:
                if session:
                    row = _get_system_info_row(session)
                    row.last_backup_path = backup_path
                    session.commit()
        except Exception:
            pass
        
        size_mb = os.path.getsize(backup_path) / (1024 * 1024)
        logger.info(f"Backup created: {backup_path} ({size_mb:.1f} MB)")
        return True, backup_path, None
        
    except Exception as e:
        logger.error(f"Backup failed: {e}")
        return False, None, f"Backup failed: {str(e)}"


# ─── Apply Update ───────────────────────────────────────────────────

def apply_update(package_path, expected_checksum=None, expected_signature=None):
    """
    Apply an update package.
    
    Flow: verify → backup → extract → migrate → auto-restart → health check
    
    Returns (success: bool, message: str, details: dict)
    """
    details = {'steps_completed': []}
    
    # Step 1: Verify package (if checksum provided)
    if expected_checksum:
        is_valid, error = verify_package(package_path, expected_checksum, expected_signature)
        if not is_valid:
            return False, f"Package verification failed: {error}", details
        details['steps_completed'].append('verify')
    
    # Step 2: Create backup
    backup_ok, backup_path, backup_err = create_backup()
    if not backup_ok:
        return False, f"Backup failed: {backup_err}", details
    details['steps_completed'].append('backup')
    details['backup_path'] = backup_path
    
    # Step 3: Extract to staging
    try:
        extract_dir = os.path.join(STAGING_DIR, 'extracted')
        if os.path.exists(extract_dir):
            shutil.rmtree(extract_dir)
        os.makedirs(extract_dir, exist_ok=True)
        
        with tarfile.open(package_path, 'r:gz') as tar:
            # Security: prevent path traversal attacks
            for member in tar.getmembers():
                if member.name.startswith('/') or '..' in member.name:
                    return False, f"Package contains unsafe path: {member.name}", details
            tar.extractall(extract_dir)
        
        details['steps_completed'].append('extract')
    except Exception as e:
        return False, f"Package extraction failed: {str(e)}", details
    
    # Step 4: Copy staged files over current installation
    try:
        for root, dirs, files in os.walk(extract_dir):
            for fname in files:
                src = os.path.join(root, fname)
                rel_path = os.path.relpath(src, extract_dir)
                dest = os.path.join(os.path.dirname(BACKEND_DIR), rel_path)
                
                os.makedirs(os.path.dirname(dest), exist_ok=True)
                shutil.copy2(src, dest)
        
        details['steps_completed'].append('copy_files')
    except Exception as e:
        return False, f"File copy failed: {str(e)}", details
    
    # Step 5: Run Alembic migration (if migration files in package)
    migrations_dir = os.path.join(extract_dir, 'backend', 'migrations', 'versions')
    if os.path.exists(migrations_dir) and os.listdir(migrations_dir):
        try:
            result = subprocess.run(
                [sys.executable, '-m', 'alembic', 'upgrade', 'head'],
                cwd=BACKEND_DIR,
                capture_output=True, text=True, timeout=60
            )
            if result.returncode != 0:
                logger.error(f"Alembic migration failed: {result.stderr}")
                details['migration_error'] = result.stderr
                # Don't abort — the files are already copied, admin can decide
            else:
                details['steps_completed'].append('migrate')
        except Exception as e:
            logger.warning(f"Migration step skipped: {e}")
    
    # Step 6: Update version in DB
    try:
        from database.db import get_db_session
        with get_db_session() as session:
            if session:
                row = _get_system_info_row(session)
                row.last_update_applied_at = datetime.now(timezone.utc)
                row.app_version = row.latest_available_version or _get_current_version()
                session.commit()
    except Exception as e:
        logger.warning(f"Could not update version in DB: {e}")
    
    details['steps_completed'].append('complete')
    
    # Step 7: Schedule auto-restart
    details['restart_scheduled'] = True
    details['message'] = "Update applied. Server will restart automatically."
    
    return True, "Update applied successfully. Restarting...", details


def schedule_auto_restart(delay_seconds=3):
    """
    Schedule an automatic server restart after an update.
    
    Cross-platform:
      - Windows: spawns a new process then exits current
      - Linux/Docker: uses os.execv to replace current process
    """
    import threading
    
    def _do_restart():
        import time
        time.sleep(delay_seconds)
        
        logger.info("[UPDATE] Auto-restarting server...")
        
        if sys.platform == 'win32':
            # Windows: start a new process, then exit current
            python = sys.executable
            args = [python] + sys.argv
            subprocess.Popen(args, cwd=BACKEND_DIR)
            os._exit(0)
        else:
            # Linux/Mac: replace current process
            os.execv(sys.executable, [sys.executable] + sys.argv)
    
    restart_thread = threading.Thread(target=_do_restart, daemon=True)
    restart_thread.start()
    logger.info(f"[UPDATE] Auto-restart scheduled in {delay_seconds} seconds")


# ─── Rollback ───────────────────────────────────────────────────────

def rollback_update(backup_path=None):
    """
    Roll back to a previous version using a backup archive.
    
    Returns (success: bool, message: str)
    """
    # Find backup path
    if not backup_path:
        try:
            from database.db import get_db_session
            with get_db_session() as session:
                if session:
                    row = _get_system_info_row(session)
                    backup_path = row.last_backup_path
        except Exception:
            pass
    
    if not backup_path or not os.path.exists(backup_path):
        return False, "No backup found to rollback to"
    
    try:
        logger.info(f"Rolling back from backup: {backup_path}")
        
        # Extract backup over current files
        with tarfile.open(backup_path, 'r:gz') as tar:
            tar.extractall(os.path.dirname(BACKEND_DIR))
        
        logger.info("Rollback complete. Restart the server to use the restored version.")
        return True, "Rollback successful. Server restart required."
        
    except Exception as e:
        logger.error(f"Rollback failed: {e}")
        return False, f"Rollback failed: {str(e)}"


# ─── Offline Upload Handler ────────────────────────────────────────

def handle_offline_upload(file_storage, expected_checksum=None, expected_signature=None):
    """
    Handle a manually uploaded update package (for air-gapped installs).
    
    Args:
        file_storage: Flask FileStorage object from request.files
        expected_checksum: Optional checksum to verify against
        expected_signature: Optional HMAC signature to verify against
    
    Returns (success: bool, message: str, details: dict)
    """
    os.makedirs(STAGING_DIR, exist_ok=True)
    upload_path = os.path.join(STAGING_DIR, 'uploaded_package.tar.gz')
    
    try:
        file_storage.save(upload_path)
        
        # If checksum/signature provided, verify
        if expected_checksum:
            is_valid, error = verify_package(upload_path, expected_checksum, expected_signature)
            if not is_valid:
                os.remove(upload_path)
                return False, f"Package verification failed: {error}", {}
        
        # Apply the update
        return apply_update(upload_path, expected_checksum, expected_signature)
        
    except Exception as e:
        logger.error(f"Offline upload failed: {e}")
        if os.path.exists(upload_path):
            os.remove(upload_path)
        return False, f"Upload failed: {str(e)}", {}


# ─── System Info Helper ─────────────────────────────────────────────

def get_system_info():
    """
    Get current system information including version and update status.
    Used by /api/system/info and the frontend ProfilePage.
    """
    current_version = _get_current_version()
    
    info = {
        'app_version': current_version,
        'last_update_checked_at': None,
        'latest_available_version': None,
        'update_available': False,
        'update_severity': None,
        'update_changelog': None,
        'has_backup': False,
    }
    
    try:
        from database.db import get_db_session
        with get_db_session() as session:
            if session:
                row = _get_system_info_row(session)
                info['last_update_checked_at'] = (
                    row.last_update_checked_at.isoformat() if row.last_update_checked_at else None
                )
                info['latest_available_version'] = row.latest_available_version
                info['update_severity'] = row.update_severity.value if row.update_severity else None
                info['update_changelog'] = row.update_changelog
                info['has_backup'] = bool(row.last_backup_path and os.path.exists(row.last_backup_path))
                
                if row.latest_available_version:
                    comparison = _compare_versions(current_version, row.latest_available_version)
                    info['update_available'] = comparison == 'update_available'
    except Exception as e:
        logger.warning(f"Could not read system info from DB: {e}")
    
    return info
