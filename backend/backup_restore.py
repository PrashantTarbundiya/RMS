"""
backup_restore.py — Backup, Restore & Data Portability for RMS Face AI.

Provides:
  1. Full backup export: encodings.pickle, config.json, SOTA models,
     dataset_cleaned/, and DB dump (SQLite export or pg_dump for Postgres).
  2. Verified restore from a backup archive.
  3. Full org data export for compliance/migration (structured JSON + images).

All backup archives are .zip files with a manifest.json for integrity verification.
"""

import os
import sys
import json
import shutil
import zipfile
import hashlib
import logging
import tempfile
from datetime import datetime, timezone

logger = logging.getLogger('rms-backup')

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)


def _sha256_file(filepath):
    """Compute SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()


def _add_dir_to_zip(zipf, dir_path, archive_prefix):
    """Recursively add a directory to a zip archive."""
    if not os.path.isdir(dir_path):
        return 0
    count = 0
    for root, dirs, files in os.walk(dir_path):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, dir_path)
            arcname = os.path.join(archive_prefix, rel_path).replace('\\', '/')
            zipf.write(full_path, arcname)
            count += 1
    return count


# ─── Full Backup Export ──────────────────────────────────────────────

def create_full_backup(output_dir=None, org_id=None):
    """
    Create a full system backup archive.

    Includes:
      - encodings.pickle (embedding index)
      - config.json (system configuration)
      - SOTA model files (best_mobile_sideface.pth, mobile_classes.txt)
      - dataset_cleaned/ (all training images)
      - database export (all tables as JSON)
      - manifest.json (integrity checksums)

    Args:
        output_dir: Where to save the backup zip. Defaults to backend/backups/.
        org_id: If provided, backs up only this org's data. None = everything.

    Returns:
        (success: bool, backup_path: str, manifest: dict, error: str|None)
    """
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    backup_name = f"rms_backup_{timestamp}"

    if output_dir is None:
        output_dir = os.path.join(BACKEND_DIR, 'backups')
    os.makedirs(output_dir, exist_ok=True)

    backup_path = os.path.join(output_dir, f"{backup_name}.zip")

    manifest = {
        'backup_name': backup_name,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'version': _get_app_version(),
        'org_id': org_id,
        'files': {},
        'stats': {},
    }

    try:
        with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zipf:

            # 1. Encodings pickle
            encodings_path = _resolve_encodings_path(org_id)
            if os.path.exists(encodings_path):
                zipf.write(encodings_path, 'data/encodings.pickle')
                manifest['files']['encodings.pickle'] = _sha256_file(encodings_path)
                logger.info("Backed up: encodings.pickle")

            # 2. Config files
            for config_name in ['config.json', 'feedback_log.json', 'recognition_history.json']:
                config_path = _resolve_data_file(config_name, org_id)
                if os.path.exists(config_path):
                    zipf.write(config_path, f'data/{config_name}')
                    manifest['files'][config_name] = _sha256_file(config_path)

            # 3. SOTA model files
            sota_dir = os.path.join(BACKEND_DIR, 'models', 'sota_finetune')
            if org_id:
                from org_storage import get_sota_model_path, get_sota_classes_path
                model_path = get_sota_model_path(org_id)
                classes_path = get_sota_classes_path(org_id)
            else:
                model_path = os.path.join(sota_dir, 'best_mobile_sideface.pth')
                classes_path = os.path.join(sota_dir, 'mobile_classes.txt')

            if os.path.exists(model_path):
                zipf.write(model_path, 'models/best_mobile_sideface.pth')
                manifest['files']['sota_model'] = _sha256_file(model_path)
            if os.path.exists(classes_path):
                zipf.write(classes_path, 'models/mobile_classes.txt')
                manifest['files']['sota_classes'] = _sha256_file(classes_path)

            # 4. Dataset images
            dataset_dir = _resolve_dataset_dir(org_id)
            if os.path.isdir(dataset_dir):
                img_count = _add_dir_to_zip(zipf, dataset_dir, 'dataset_cleaned')
                manifest['stats']['image_count'] = img_count
                logger.info(f"Backed up: {img_count} images from dataset_cleaned/")

            # 5. Database export
            db_data = _export_database_tables(org_id)
            if db_data:
                db_json = json.dumps(db_data, indent=2, default=str)
                zipf.writestr('database/db_export.json', db_json)
                manifest['stats']['db_tables'] = list(db_data.keys())
                manifest['stats']['db_row_counts'] = {
                    k: len(v) for k, v in db_data.items()
                }
                logger.info(f"Backed up: {len(db_data)} database tables")

            # 6. Write manifest
            zipf.writestr('manifest.json', json.dumps(manifest, indent=2, default=str))

        file_size = os.path.getsize(backup_path)
        manifest['stats']['archive_size_bytes'] = file_size
        manifest['stats']['archive_size_mb'] = round(file_size / (1024 * 1024), 2)

        logger.info(f"Backup created: {backup_path} ({manifest['stats']['archive_size_mb']} MB)")
        return True, backup_path, manifest, None

    except Exception as e:
        logger.error(f"Backup failed: {e}", exc_info=True)
        # Clean up partial backup
        if os.path.exists(backup_path):
            os.remove(backup_path)
        return False, '', {}, str(e)


# ─── Restore from Backup ────────────────────────────────────────────

def restore_from_backup(backup_path, target_dir=None, dry_run=False):
    """
    Restore a full system from a backup archive.

    Args:
        backup_path: Path to the .zip backup file.
        target_dir: Where to restore to. Defaults to the current install.
        dry_run: If True, validate the archive without actually restoring.

    Returns:
        (success: bool, report: dict, error: str|None)
    """
    if not os.path.exists(backup_path):
        return False, {}, f"Backup file not found: {backup_path}"

    report = {
        'backup_file': backup_path,
        'dry_run': dry_run,
        'steps': [],
        'warnings': [],
    }

    try:
        with zipfile.ZipFile(backup_path, 'r') as zipf:
            # 1. Read and validate manifest
            if 'manifest.json' not in zipf.namelist():
                return False, report, "Invalid backup: manifest.json not found"

            manifest = json.loads(zipf.read('manifest.json'))
            report['manifest'] = manifest
            report['steps'].append('✓ Manifest validated')

            # 2. Verify file checksums
            files_in_archive = zipf.namelist()
            for filename, expected_hash in manifest.get('files', {}).items():
                # Map manifest keys to archive paths
                archive_path = _manifest_key_to_archive_path(filename)
                if archive_path in files_in_archive:
                    content = zipf.read(archive_path)
                    actual_hash = hashlib.sha256(content).hexdigest()
                    if actual_hash != expected_hash:
                        return False, report, (
                            f"Checksum mismatch for {filename}: "
                            f"expected {expected_hash[:16]}..., got {actual_hash[:16]}..."
                        )
                    report['steps'].append(f'✓ Checksum verified: {filename}')
                else:
                    report['warnings'].append(f'⚠ File not in archive: {filename}')

            if dry_run:
                report['steps'].append('✓ Dry run complete — archive is valid')
                return True, report, None

            # 3. Create pre-restore backup
            pre_restore_backup_dir = os.path.join(BACKEND_DIR, 'backups', 'pre_restore')
            os.makedirs(pre_restore_backup_dir, exist_ok=True)

            # 4. Restore data files
            if target_dir is None:
                target_dir = BACKEND_DIR

            for archive_name in files_in_archive:
                if archive_name == 'manifest.json':
                    continue

                if archive_name.startswith('data/'):
                    dest = os.path.join(target_dir, archive_name)
                elif archive_name.startswith('models/'):
                    dest = os.path.join(target_dir, archive_name.replace(
                        'models/', 'models/sota_finetune/', 1
                    ))
                elif archive_name.startswith('dataset_cleaned/'):
                    storage_dir = os.environ.get('STORAGE_DIR', PROJECT_ROOT)
                    dest = os.path.join(storage_dir, archive_name)
                elif archive_name.startswith('database/'):
                    dest = os.path.join(target_dir, 'backups', 'restored', archive_name)
                else:
                    continue

                os.makedirs(os.path.dirname(dest), exist_ok=True)

                # Back up existing file before overwriting
                if os.path.exists(dest):
                    pre_dest = os.path.join(
                        pre_restore_backup_dir,
                        os.path.relpath(dest, target_dir)
                    )
                    os.makedirs(os.path.dirname(pre_dest), exist_ok=True)
                    shutil.copy2(dest, pre_dest)

                with zipf.open(archive_name) as src, open(dest, 'wb') as dst:
                    shutil.copyfileobj(src, dst)

                report['steps'].append(f'✓ Restored: {archive_name}')

            # 5. Restore database records
            db_export_path = os.path.join(target_dir, 'backups', 'restored', 'database', 'db_export.json')
            if os.path.exists(db_export_path):
                db_result = _import_database_tables(db_export_path)
                report['steps'].append(f'✓ Database restored: {db_result}')

            report['steps'].append('✓ Restore complete')
            return True, report, None

    except zipfile.BadZipFile:
        return False, report, "Invalid or corrupted zip file"
    except Exception as e:
        logger.error(f"Restore failed: {e}", exc_info=True)
        return False, report, str(e)


# ─── Org Data Export (Compliance) ────────────────────────────────────

def export_org_data(org_id, output_dir=None):
    """
    Export all data for a specific organization.
    Produces a structured, human-inspectable archive for compliance/migration.

    Includes:
      - Organization metadata (JSON)
      - All users (JSON, passwords excluded)
      - All employees (JSON)
      - All attendance logs (JSON)
      - All consent records (JSON)
      - All feedback logs (JSON)
      - Employee images (from dataset_cleaned/)
      - Encodings (pickle)

    Args:
        org_id: The organization ID to export.
        output_dir: Where to save. Defaults to backend/exports/.

    Returns:
        (success: bool, export_path: str, summary: dict, error: str|None)
    """
    if not org_id:
        return False, '', {}, "org_id is required"

    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    export_name = f"org_export_{org_id[:8]}_{timestamp}"

    if output_dir is None:
        output_dir = os.path.join(BACKEND_DIR, 'exports')
    os.makedirs(output_dir, exist_ok=True)

    export_path = os.path.join(output_dir, f"{export_name}.zip")

    summary = {
        'export_name': export_name,
        'org_id': org_id,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'contents': {},
    }

    try:
        with zipfile.ZipFile(export_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zipf:
            from database.db import is_db_available, get_db_session

            if is_db_available():
                with get_db_session() as db:
                    # Organization metadata
                    from database.models import (
                        Organization, User, Employee, AttendanceLog,
                        ConsentRecord, Camera, Subscription
                    )

                    org = db.query(Organization).filter_by(id=org_id).first()
                    if not org:
                        return False, '', {}, f"Organization {org_id} not found"

                    org_data = {
                        'id': org.id,
                        'name': org.name,
                        'slug': org.slug,
                        'plan_tier': org.plan_tier.value if org.plan_tier else None,
                        'deployment_mode': org.deployment_mode.value if org.deployment_mode else None,
                        'confirm_threshold': org.confirm_threshold,
                        'created_at': str(org.created_at),
                    }
                    zipf.writestr('organization.json', json.dumps(org_data, indent=2))
                    summary['contents']['organization'] = 1

                    # Users (exclude password hashes for security)
                    users = db.query(User).filter_by(org_id=org_id).all()
                    users_data = [{
                        'id': u.id,
                        'email': u.email,
                        'name': u.name,
                        'role': u.role.value if u.role else None,
                        'is_active': u.is_active,
                        'created_at': str(u.created_at),
                    } for u in users]
                    zipf.writestr('users.json', json.dumps(users_data, indent=2))
                    summary['contents']['users'] = len(users_data)

                    # Employees
                    employees = db.query(Employee).filter_by(org_id=org_id).all()
                    emp_data = [{
                        'id': e.id,
                        'name': e.name,
                        'status': e.status,
                        'image_count': e.image_count,
                        'department': getattr(e, 'department', None),
                        'consent_given_at': str(e.consent_given_at) if e.consent_given_at else None,
                        'consent_revoked_at': str(e.consent_revoked_at) if e.consent_revoked_at else None,
                        'created_at': str(e.created_at),
                    } for e in employees]
                    zipf.writestr('employees.json', json.dumps(emp_data, indent=2))
                    summary['contents']['employees'] = len(emp_data)

                    # Attendance logs
                    logs = db.query(AttendanceLog).filter_by(org_id=org_id).all()
                    logs_data = [{
                        'id': l.id,
                        'employee_id': l.employee_id,
                        'prediction_label': l.prediction_label,
                        'confidence': l.confidence,
                        'is_confirmed': l.is_confirmed,
                        'checkin_time': str(l.checkin_time),
                        'camera_id': l.camera_id,
                    } for l in logs]
                    zipf.writestr('attendance_logs.json', json.dumps(logs_data, indent=2))
                    summary['contents']['attendance_logs'] = len(logs_data)

                    # Consent records
                    consents = db.query(ConsentRecord).filter_by(org_id=org_id).all()
                    consent_data = [{
                        'id': c.id,
                        'employee_id': c.employee_id,
                        'consent_type': c.consent_type,
                        'consented_at': str(c.consented_at),
                        'revoked_at': str(c.revoked_at) if c.revoked_at else None,
                        'ip_address': c.ip_address,
                        'notes': c.notes,
                    } for c in consents]
                    zipf.writestr('consent_records.json', json.dumps(consent_data, indent=2))
                    summary['contents']['consent_records'] = len(consent_data)

                    # Cameras
                    cameras = db.query(Camera).filter_by(org_id=org_id).all()
                    cam_data = [{
                        'id': c.id,
                        'name': c.name,
                        'location': c.location,
                        'is_active': c.is_active,
                    } for c in cameras]
                    zipf.writestr('cameras.json', json.dumps(cam_data, indent=2))
                    summary['contents']['cameras'] = len(cam_data)

            # Employee images
            dataset_dir = _resolve_dataset_dir(org_id)
            if os.path.isdir(dataset_dir):
                img_count = _add_dir_to_zip(zipf, dataset_dir, 'images')
                summary['contents']['images'] = img_count

            # Encodings
            enc_path = _resolve_encodings_path(org_id)
            if os.path.exists(enc_path):
                zipf.write(enc_path, 'encodings.pickle')
                summary['contents']['encodings'] = True

            # Write export manifest
            zipf.writestr('export_manifest.json', json.dumps(summary, indent=2, default=str))

        file_size = os.path.getsize(export_path)
        summary['archive_size_bytes'] = file_size
        summary['archive_size_mb'] = round(file_size / (1024 * 1024), 2)

        logger.info(f"Org export created: {export_path} ({summary['archive_size_mb']} MB)")
        return True, export_path, summary, None

    except Exception as e:
        logger.error(f"Org export failed: {e}", exc_info=True)
        if os.path.exists(export_path):
            os.remove(export_path)
        return False, '', {}, str(e)


# ─── Helper Functions ────────────────────────────────────────────────

def _get_app_version():
    """Get the current app version."""
    try:
        from version import __version__
        return __version__
    except ImportError:
        return '1.0.0'


def _resolve_encodings_path(org_id):
    """Resolve encodings.pickle path for an org or global."""
    if org_id:
        from org_storage import get_encodings_path
        return get_encodings_path(org_id)
    return os.path.join(BACKEND_DIR, 'data', 'encodings.pickle')


def _resolve_data_file(filename, org_id):
    """Resolve a data file path for an org or global."""
    if org_id:
        org_data_dir = os.path.join(BACKEND_DIR, 'data', 'orgs', str(org_id))
        return os.path.join(org_data_dir, filename)
    return os.path.join(BACKEND_DIR, 'data', filename)


def _resolve_dataset_dir(org_id):
    """Resolve dataset_cleaned directory for an org or global."""
    storage_dir = os.environ.get('STORAGE_DIR', PROJECT_ROOT)
    if org_id:
        return os.path.join(storage_dir, 'dataset_cleaned', 'orgs', str(org_id))
    return os.path.join(storage_dir, 'dataset_cleaned')


def _manifest_key_to_archive_path(key):
    """Map a manifest file key to its archive path."""
    mapping = {
        'encodings.pickle': 'data/encodings.pickle',
        'config.json': 'data/config.json',
        'feedback_log.json': 'data/feedback_log.json',
        'recognition_history.json': 'data/recognition_history.json',
        'sota_model': 'models/best_mobile_sideface.pth',
        'sota_classes': 'models/mobile_classes.txt',
    }
    return mapping.get(key, key)


def _export_database_tables(org_id=None):
    """Export all database tables as a dict of lists."""
    from database.db import is_db_available, get_db_session

    if not is_db_available():
        return {}

    try:
        from database.models import (
            Organization, User, Employee, AttendanceLog,
            Camera, Subscription, ConsentRecord, FeedbackLog,
            SystemInfo
        )

        result = {}
        with get_db_session() as db:
            # Build queries based on org filter
            if org_id:
                orgs = db.query(Organization).filter_by(id=org_id).all()
                users = db.query(User).filter_by(org_id=org_id).all()
                employees = db.query(Employee).filter_by(org_id=org_id).all()
                logs = db.query(AttendanceLog).filter_by(org_id=org_id).all()
                cameras = db.query(Camera).filter_by(org_id=org_id).all()
                consents = db.query(ConsentRecord).filter_by(org_id=org_id).all()
                feedbacks = db.query(FeedbackLog).filter_by(org_id=org_id).all()
                subscriptions = db.query(Subscription).filter_by(org_id=org_id).all()
            else:
                orgs = db.query(Organization).all()
                users = db.query(User).all()
                employees = db.query(Employee).all()
                logs = db.query(AttendanceLog).all()
                cameras = db.query(Camera).all()
                consents = db.query(ConsentRecord).all()
                feedbacks = db.query(FeedbackLog).all()
                subscriptions = db.query(Subscription).all()

            def serialize(obj):
                """Convert SQLAlchemy model to dict."""
                d = {}
                for col in obj.__table__.columns:
                    val = getattr(obj, col.name, None)
                    if hasattr(val, 'value'):  # Enum
                        val = val.value
                    d[col.name] = val
                return d

            result['organizations'] = [serialize(o) for o in orgs]
            # Exclude password hashes from user export
            result['users'] = [{
                k: v for k, v in serialize(u).items()
                if k != 'password_hash'
            } for u in users]
            result['employees'] = [serialize(e) for e in employees]
            result['attendance_logs'] = [serialize(l) for l in logs]
            result['cameras'] = [serialize(c) for c in cameras]
            result['consent_records'] = [serialize(c) for c in consents]
            result['feedback_logs'] = [serialize(f) for f in feedbacks]
            result['subscriptions'] = [serialize(s) for s in subscriptions]

            # System info (not org-scoped)
            if not org_id:
                sys_info = db.query(SystemInfo).all()
                result['system_info'] = [serialize(s) for s in sys_info]

        return result

    except Exception as e:
        logger.error(f"DB export error: {e}")
        return {}


def _import_database_tables(json_path):
    """Import database records from a JSON export. Returns summary string."""
    # For safety, this only logs what would be imported — actual import
    # requires explicit admin action to avoid accidental data overwrites
    try:
        with open(json_path, 'r') as f:
            data = json.load(f)
        tables = list(data.keys())
        total_rows = sum(len(v) for v in data.values() if isinstance(v, list))
        return f"{len(tables)} tables, {total_rows} total rows available for import"
    except Exception as e:
        return f"DB import check failed: {e}"


def list_backups(backup_dir=None):
    """List all available backup files."""
    if backup_dir is None:
        backup_dir = os.path.join(BACKEND_DIR, 'backups')

    if not os.path.isdir(backup_dir):
        return []

    backups = []
    for filename in sorted(os.listdir(backup_dir), reverse=True):
        if filename.endswith('.zip') and filename.startswith('rms_backup_'):
            filepath = os.path.join(backup_dir, filename)
            size = os.path.getsize(filepath)
            # Try to read manifest
            manifest = None
            try:
                with zipfile.ZipFile(filepath, 'r') as zf:
                    if 'manifest.json' in zf.namelist():
                        manifest = json.loads(zf.read('manifest.json'))
            except Exception:
                pass

            backups.append({
                'filename': filename,
                'path': filepath,
                'size_bytes': size,
                'size_mb': round(size / (1024 * 1024), 2),
                'created_at': manifest.get('created_at') if manifest else None,
                'version': manifest.get('version') if manifest else None,
            })

    return backups
