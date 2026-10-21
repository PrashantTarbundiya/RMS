import os
import zipfile
import tempfile
import shutil
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from middleware import require_auth, require_role, inject_org_id
from add_person_utils import add_person_fast
from org_storage import get_dataset_cleaned_dir, get_encodings_path
# Removed circular import: from server import reload_org_models

employees_bp = Blueprint('employees', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'zip'}

def _allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@employees_bp.route('/api/employees/bulk', methods=['POST'])
@require_auth
@require_role('org_admin')
@inject_org_id
def bulk_upload(org_id):
    """
    Accepts a .zip file containing folders for each employee.
    Folder name = employee name.
    Images inside the folder will be processed as 'frontal' angles by default.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
        
    if not file.filename.lower().endswith('.zip'):
        return jsonify({'error': 'Only .zip files are supported for bulk upload'}), 400
        
    org_dataset_dir = get_dataset_cleaned_dir(org_id)
    org_encodings_path = get_encodings_path(org_id)
    
    # Process the ZIP in a temporary directory
    temp_dir = tempfile.mkdtemp(prefix=f"rms_bulk_{org_id}_")
    try:
        zip_path = os.path.join(temp_dir, secure_filename(file.filename))
        file.save(zip_path)
        
        extract_dir = os.path.join(temp_dir, 'extracted')
        os.makedirs(extract_dir, exist_ok=True)
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
            
        # Count top-level directories to estimate new employees
        new_employee_count = 0
        for item in os.listdir(extract_dir):
            if os.path.isdir(os.path.join(extract_dir, item)) and not item.startswith('__') and not item.startswith('.'):
                new_employee_count += 1
                
        # Check subscription limits
        from billing import check_subscription_limit
        allowed, error_response = check_subscription_limit(org_id, new_employees_count=new_employee_count)
        if not allowed:
            return error_response
            
        successes = []
        failures = []
        
        # Traverse the extracted structure
        # Expected: extracted/John_Doe/img1.jpg, extracted/Jane_Smith/img2.jpg
        for root, dirs, files in os.walk(extract_dir):
            for d in dirs:
                # Discard macOS __MACOSX folders and hidden folders
                if d.startswith('__') or d.startswith('.'):
                    continue
                    
                person_name = d
                person_dir = os.path.join(root, d)
                
                # Gather images
                image_data_list = []
                import cv2
                from PIL import Image
                import numpy as np
                
                for f in os.listdir(person_dir):
                    if not _allowed_file(f):
                        continue
                    img_path = os.path.join(person_dir, f)
                    try:
                        img = Image.open(img_path).convert('RGB')
                        # Assume all bulk uploads are frontal unless specified otherwise
                        image_data_list.append((np.array(img), 'frontal'))
                    except Exception as e:
                        failures.append({'name': person_name, 'file': f, 'error': str(e)})
                        
                if image_data_list:
                    try:
                        add_person_fast(
                            person_name,
                            image_data_list,
                            dataset_dir=org_dataset_dir,
                            encodings_path=org_encodings_path,
                            org_id=org_id
                        )
                        successes.append(person_name)
                    except Exception as e:
                        failures.append({'name': person_name, 'error': str(e)})
                else:
                    failures.append({'name': person_name, 'error': 'No valid images found'})

        if successes:
            from server import reload_org_models
            reload_org_models(org_id)
            
        return jsonify({
            'message': 'Bulk upload completed',
            'success_count': len(successes),
            'failure_count': len(failures),
            'successes': successes,
            'failures': failures
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to process ZIP: {str(e)}'}), 500
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
