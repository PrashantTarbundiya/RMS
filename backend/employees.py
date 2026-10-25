import os
import re
import cv2
import zipfile
import tempfile
import shutil
import logging
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from middleware import require_auth, require_role, inject_org_id
from add_person_utils import add_person_fast, detect_face_angle
from org_storage import get_dataset_cleaned_dir, get_encodings_path

logger = logging.getLogger('employees_bulk')
employees_bp = Blueprint('employees', __name__)

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'bmp'}

def _allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def _extract_person_and_angle(rel_path):
    """
    Parses person name and angle hint from relative path within an archive.
    
    Examples:
      - 'John_Doe/front.jpg' -> ('John_Doe', 'auto')
      - 'Employees/John_Doe/left/01.jpg' -> ('John_Doe', 'left')
      - 'Jane_Doe_01.jpg' -> ('Jane_Doe', 'auto')
    """
    parts = [p for p in rel_path.replace('\\', '/').split('/') if p and not p.startswith('__') and not p.startswith('.')]
    if not parts:
        return None, None
        
    filename = parts[-1]
    if not _allowed_file(filename):
        return None, None
        
    # Check if folder structure has person name
    if len(parts) >= 2:
        # Check if last folder is an angle name (front/left/right/extra)
        possible_angle = parts[-2].lower()
        if possible_angle in ('frontal', 'front', 'left', 'right', 'extra') and len(parts) >= 3:
            angle_map = {'front': 'frontal', 'frontal': 'frontal', 'left': 'left', 'right': 'right', 'extra': 'extra'}
            person_name = parts[-3]
            return person_name, angle_map.get(possible_angle, 'auto')
        else:
            person_name = parts[-2]
            return person_name, 'auto'
            
    # Flat files inside ZIP: e.g. "Vatsal_Vadgama_01.jpg"
    base_name = os.path.splitext(filename)[0]
    # Remove trailing digits or suffixes like _01, -01, _front
    cleaned_name = re.sub(r'[_\-\s]+(frontal|front|left|right|extra|\d+)$', '', base_name, flags=re.IGNORECASE)
    cleaned_name = re.sub(r'[_\-\s]+\d+$', '', cleaned_name)
    if cleaned_name.strip():
        return cleaned_name.strip(), 'auto'
        
    return None, None


@employees_bp.route('/api/employees/bulk', methods=['POST'])
@employees_bp.route('/api/upload/bulk-zip', methods=['POST'])
@require_auth
@require_role('org_admin')
@inject_org_id
def bulk_upload(org_id):
    """
    Accepts a .zip file containing photos of multiple personnel.
    Features:
      - Flexible folder structure (subfolders per person or flat with prefixes)
      - Automatic 3D head-pose angle estimation (Front, Left, Right)
      - Creates/updates Supabase Employee database records
      - Instant DeepFace/InsightFace embedding index update + reload
      - Background fine-tuning queue
    """
    file = request.files.get('file') or request.files.get('zip_file') or request.files.get('archive')
    if not file or file.filename == '':
        return jsonify({'error': 'No zip file provided'}), 400
        
    if not file.filename.lower().endswith('.zip'):
        return jsonify({'error': 'Only .zip files are supported for bulk upload'}), 400

    try:
        epochs = int(request.form.get('epochs', 15))
        epochs = max(1, min(epochs, 50))
    except ValueError:
        epochs = 15

    org_dataset_dir = get_dataset_cleaned_dir(org_id)
    org_encodings_path = get_encodings_path(org_id)
    
    temp_dir = tempfile.mkdtemp(prefix=f"rms_bulk_{org_id}_")
    try:
        zip_path = os.path.join(temp_dir, secure_filename(file.filename))
        file.save(zip_path)
        
        extract_dir = os.path.join(temp_dir, 'extracted')
        os.makedirs(extract_dir, exist_ok=True)
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)

        from PIL import Image
        import numpy as np

        # Group images by person name
        person_images = {}
        for root, _, files in os.walk(extract_dir):
            for f in files:
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, extract_dir)
                
                person_name, angle_hint = _extract_person_and_angle(rel_path)
                if not person_name:
                    continue
                    
                # Clean person name
                person_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', person_name).strip('_')
                if not person_name:
                    continue
                    
                if person_name not in person_images:
                    person_images[person_name] = []
                    
                person_images[person_name].append((full_path, angle_hint))

        if not person_images:
            return jsonify({'error': 'No valid images found in ZIP archive. Ensure file extensions are .jpg, .png, etc.'}), 400

        # Check subscription limits for total new persons
        from billing import check_subscription_limit
        allowed, error_response = check_subscription_limit(org_id, new_employees_count=len(person_images))
        if not allowed:
            return error_response

        from database.db import is_db_available, get_db_session
        from database.models import Employee, EmployeeStatus

        successes = []
        failures = []

        for person_name, file_entries in person_images.items():
            image_data_list = []
            for img_path, angle_hint in file_entries:
                try:
                    img = Image.open(img_path).convert('RGB')
                    # Max 1024 to save memory during batch loading
                    if max(img.size) > 1024:
                        img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
                        
                    np_img = np.array(img)
                    
                    if angle_hint == 'auto' or not angle_hint:
                        img_bgr = cv2.cvtColor(np_img, cv2.COLOR_RGB2BGR)
                        angle_label = detect_face_angle(img_bgr)
                    else:
                        angle_label = angle_hint
                        
                    image_data_list.append((np_img, angle_label))
                except Exception as read_err:
                    logger.warning(f"Failed to read image {img_path}: {read_err}")

            if not image_data_list:
                failures.append({'name': person_name, 'error': 'No readable images'})
                continue

            try:
                # Add person fast (generates raw/cleaned face crops and updates embeddings)
                add_person_fast(
                    person_name,
                    image_data_list,
                    dataset_dir=org_dataset_dir,
                    encodings_path=org_encodings_path,
                    org_id=org_id
                )

                # Sync into database Employee table
                if is_db_available():
                    try:
                        with get_db_session() as db:
                            emp = db.query(Employee).filter_by(org_id=org_id, name=person_name).first()
                            if not emp:
                                import uuid
                                req_dept = request.form.get('department', 'General').strip() or 'General'
                                emp = Employee(
                                    id=f"emp-{org_id[:8]}-{uuid.uuid4().hex[:6]}",
                                    org_id=org_id,
                                    name=person_name,
                                    employee_code=f"RMS-{person_name[:3].upper()}-{uuid.uuid4().hex[:4].upper()}",
                                    department=req_dept,
                                    status=EmployeeStatus.active,
                                    image_count=len(image_data_list)
                                )
                                db.add(emp)
                            else:
                                emp.image_count = (emp.image_count or 0) + len(image_data_list)
                                emp.status = EmployeeStatus.active
                                req_dept = request.form.get('department')
                                if req_dept and req_dept.strip():
                                    emp.department = req_dept.strip()
                            db.commit()
                    except Exception as db_sync_err:
                        logger.warning(f"Could not sync Employee DB record for {person_name}: {db_sync_err}")

                successes.append({
                    'name': person_name,
                    'photos_count': len(image_data_list)
                })
            except Exception as enroll_err:
                logger.error(f"Failed enrolling {person_name}: {enroll_err}")
                failures.append({'name': person_name, 'error': str(enroll_err)})

        # Reload live models in memory
        if successes:
            try:
                from server import reload_org_models, enqueue_local_training
                reload_org_models(org_id)
                # Queue SOTA fine-tuning for the first or representative subject
                enqueue_local_training(successes[0]['name'], epochs, org_id)
            except Exception as reload_err:
                logger.warning(f"Post-bulk reload error: {reload_err}")

        return jsonify({
            'message': f"Bulk upload completed: {len(successes)} enrolled, {len(failures)} failed.",
            'success_count': len(successes),
            'failure_count': len(failures),
            'successes': successes,
            'failures': failures
        }), 200

    except Exception as e:
        logger.error(f"Bulk upload ZIP error: {e}", exc_info=True)
        return jsonify({'error': f"Failed to process ZIP: {str(e)}"}), 500
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
