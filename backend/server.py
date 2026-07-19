import sys
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TF warnings
import time
import socket
import threading
import logging
import json
import datetime
import re
import hashlib
from io import StringIO
from flask import Flask, request, jsonify, Response, send_file
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

# ─── Logging Setup ─────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('rms-api')

# ─── App Setup ─────────────────────────────────────────────────────────
app = Flask(__name__)

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
    """Quick health check for connectivity testing."""
    expected_classes = []
    if os.path.exists(DATASET_CLEANED_DIR):
        expected_classes = sorted([name for name in os.listdir(DATASET_CLEANED_DIR) 
                                   if os.path.isdir(os.path.join(DATASET_CLEANED_DIR, name))])
    
    total_people = len(expected_classes)
    sota_loaded_state = sota_loaded
    sota_classes_state = sota_classes
    
    requires_retrain = False
    if total_people > 0:
        sota_mismatch = (not sota_loaded_state) or (sorted(sota_classes_state) != expected_classes)
        requires_retrain = sota_mismatch

    return jsonify({
        'status': 'ok',
        'requires_retrain': requires_retrain,
        'models': {
            'deepface': deepface_encodings is not None,
            'sota': sota_loaded_state,
        }
    })

@app.route('/api/ping', methods=['GET'])
def ping():
    """Minimal ping endpoint for connection testing."""
    return jsonify({'pong': True})

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

def log_recognition(faces_results):
    if not faces_results:
        return
    try:
        # Load existing history
        history = []
        if os.path.exists(RECOGNITION_HISTORY_PATH):
            try:
                with open(RECOGNITION_HISTORY_PATH, 'r') as f:
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
        
        with open(RECOGNITION_HISTORY_PATH, 'w') as f:
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
_models_loaded = False
face_cascade = None
deepface_encodings = None
deepface_names = None
sota_model = None
sota_classes = []
sota_transform = None
sota_device = None
sota_loaded = False

def get_face_cascade():
    global face_cascade
    if face_cascade is not None:
        try:
            if not face_cascade.empty():
                return face_cascade
        except Exception:
            pass
    base_dir = os.path.dirname(os.path.abspath(__file__))
    paths_to_try = [
        os.path.join(base_dir, 'haarcascade_frontalface_default.xml'),
        os.path.join(base_dir, '..', 'haarcascade_frontalface_default.xml'),
        'haarcascade_frontalface_default.xml'
    ]
    for p in paths_to_try:
        abs_p = os.path.abspath(p)
        if os.path.exists(abs_p):
            try:
                clf = cv2.CascadeClassifier(abs_p)
                if not clf.empty():
                    face_cascade = clf
                    logger.info(f"Face cascade loaded from: {abs_p}")
                    return face_cascade
            except Exception as e:
                logger.warning(f"Failed to load cascade from {abs_p}: {e}")
    logger.warning("Could not load face cascade from any path!")
    return None

def load_deepface():
    try:
        if not os.path.exists(DEEPFACE_MODEL_PATH):
            logger.info("DeepFace encodings file not found (not yet trained)")
            return None, None
        with open(DEEPFACE_MODEL_PATH, "rb") as f:
            data = pickle.load(f)
        logger.info(f"DeepFace loaded: {len(data.get('encodings', []))} encodings")
        return data["encodings"], data["names"]
    except Exception as e:
        logger.warning(f"DeepFace encodings not loadable: {e}")
        return None, None


def load_sota():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    classes_path = os.path.join(BACKEND_DIR, 'models', 'sota_finetune', 'mobile_classes.txt')
    classes = []
    if os.path.exists(classes_path):
        with open(classes_path, "r") as f:
            classes = [line.strip() for line in f.readlines() if line.strip()]
    num_classes = len(classes) if classes else 2
    model = build_mobile_model(num_classes=num_classes)

    is_loaded = False
    if os.path.exists(SOTA_MODEL_PATH):
        try:
            state_dict = torch.load(SOTA_MODEL_PATH, map_location=device)
            result = model.load_state_dict(state_dict, strict=False)
            if result.missing_keys:
                logger.warning(f"SOTA model: missing keys: {result.missing_keys}")
            if result.unexpected_keys:
                logger.warning(f"SOTA model: unexpected keys: {result.unexpected_keys}")
            is_loaded = True
            logger.info("SOTA model loaded successfully")
        except Exception as e:
            logger.warning(f"SOTA model failed to load: {e}. Using untrained model.")
    model.to(device)
    model.eval()
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return model, classes, val_transform, device, is_loaded

def ensure_models_loaded():
    """Lazy-load all models on first inference request."""
    global _models_loaded, deepface_encodings, deepface_names
    global sota_model, sota_classes, sota_transform, sota_device, sota_loaded
    if _models_loaded:
        return
    logger.info("Lazy-loading models for first inference...")
    get_face_cascade()
    deepface_encodings, deepface_names = load_deepface()
    sota_model, sota_classes, sota_transform, sota_device, sota_loaded = load_sota()
    _models_loaded = True
    logger.info("All models loaded.")

def reload_models():
    """Reloads models into memory after training."""
    global _models_loaded, deepface_encodings, deepface_names
    global sota_model, sota_classes, sota_transform, sota_device, sota_loaded
    logger.info("Hot-reloading models...")
    new_encs, new_names = load_deepface()
    if new_encs is not None:
        deepface_encodings = new_encs
        deepface_names = new_names
    sota_model, sota_classes, sota_transform, sota_device, sota_loaded = load_sota()
    _models_loaded = True
    logger.info("Models reloaded globally.")
# ────────────────────────────────────────────────────────────────────────

# Load models eagerly during local dev, lazy on production (Render)
if not os.environ.get('LAZY_LOAD_MODELS'):
    ensure_models_loaded()
else:
    logger.info("LAZY_LOAD_MODELS set — models will load on first inference request.")

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
def get_persons():
    """Returns a list of all trained persons."""
    if not os.path.exists(DATASET_CLEANED_DIR):
        return jsonify([])
    persons = [name for name in os.listdir(DATASET_CLEANED_DIR) 
               if os.path.isdir(os.path.join(DATASET_CLEANED_DIR, name))]
    return jsonify(persons)

@app.route('/api/upload', methods=['POST'])
def upload_person():
    """Uploads images and triggers adding a person but DOES NOT start training immediately."""
    person_name = request.form.get('person_name', '').strip()
    if not person_name:
        return jsonify({'error': 'Person name is required'}), 400
    
    # Validate person name
    if len(person_name) > MAX_NAME_LENGTH:
        return jsonify({'error': f'Person name must be {MAX_NAME_LENGTH} characters or less'}), 400
    if not _VALID_NAME_PATTERN.match(person_name):
        return jsonify({'error': 'Person name can only contain letters, numbers, underscores, and hyphens'}), 400
        
    try:
        epochs = int(request.form.get('epochs', 5))
        epochs = max(1, min(epochs, 50))  # Clamp to 1-50
    except ValueError:
        epochs = 5

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

    if training_status['is_training']:
        return jsonify({'error': 'A model refinement is currently running in the background. Please wait for it to finish.'}), 409

    # Execute fast enrollment synchronously
    try:
        from add_person_utils import add_person_fast
        print(f"--- Starting fast enrollment for {person_name} ---")
        result_msg = add_person_fast(person_name, image_data_list, dataset_dir=DATASET_CLEANED_DIR)
        print("\n--- Fast Enrollment Completed ---")
        print(result_msg)
        
        # Hot reload DeepFace immediately for instant usability
        reload_models()
    except Exception as e:
        logger.error(f"Fast enrollment error: {e}")
        return jsonify({'error': f"Failed during fast enrollment: {str(e)}"}), 500

    # Start MobileNetV2 fine-tuning in background thread
    thread = threading.Thread(target=run_sota_finetune_pipeline, args=(person_name, epochs))
    thread.start()

    msg = f'Person enrolled and searchable now. Model refinement running in background.'
    if rejected_count > 0:
        msg += f' ({rejected_count} file(s) rejected/failed)'
    return jsonify({'message': msg})

def run_sota_finetune_pipeline(person_name, epochs=5):
    """Executes the SOTA MobileNetV2 fine-tuning in the background and captures stdout for SSE."""
    training_status['is_training'] = True
    training_status['logs'] = []
    training_status['progress'] = 0

    def output_callback(text):
        for line in text.splitlines():
            if line.strip():
                training_status['logs'].append(line)
        
    old_stdout = sys.stdout
    sys.stdout = ThreadSafeStringWriter(output_callback)
    
    try:
        from add_person_utils import update_sota_model
        print(f"--- Starting background model refinement for {person_name} (Epochs: {epochs}) ---")
        update_sota_model(person_name, dataset_dir=DATASET_CLEANED_DIR, num_epochs=epochs)
        print("\n--- Pipeline Completed ---")
        training_status['progress'] = 100
        
        # Trigger hot-reload of models for inference now that background training is done
        reload_models()
    except Exception as e:
        print(f"\n--- Pipeline Error ---")
        print(str(e))
    finally:
        sys.stdout = old_stdout
        training_status['is_training'] = False

@app.route('/api/train/status', methods=['GET'])
def get_training_status():
    """Server-Sent Events endpoint to stream training logs."""
    def generate():
        last_log_idx = 0
        while True:
            # Send new logs
            logs_count = len(training_status['logs'])
            if logs_count > last_log_idx:
                new_logs = training_status['logs'][last_log_idx:logs_count]
                for log in new_logs:
                    yield f"data: {log}\n\n"
                last_log_idx = logs_count
            
            # Send status update ping
            if not training_status['is_training'] and last_log_idx >= len(training_status['logs']):
                yield "data: [DONE]\n\n"
                break
                
            time.sleep(0.5)

    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/export-onnx', methods=['POST'])
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
def reset_models():
    """Deletes all trained models and optionally dataset."""
    try:
        files_to_remove = [
            SOTA_MODEL_PATH,
            DEEPFACE_MODEL_PATH,
            os.path.join(BACKEND_DIR, 'models', 'sota_finetune', 'mobile_classes.txt'),
            os.path.join(PROJECT_ROOT, 'sideface_mobile.onnx'),
            os.path.join(PROJECT_ROOT, 'facenet512.onnx'),
            os.path.join(BACKEND_DIR, 'data', 'class_centroids.json'),
            os.path.join(BACKEND_DIR, 'data', 'label_map.json'),
        ]
        
        removed = []
        for f in files_to_remove:
            if os.path.exists(f):
                os.remove(f)
                removed.append(os.path.basename(f))
                
        # Clear specific folders without deleting the whole directory
        raw_dataset_dir = os.path.join(PROJECT_ROOT, 'dataset')
        if os.path.exists(raw_dataset_dir):
            shutil.rmtree(raw_dataset_dir)
            
        if os.path.exists(DATASET_CLEANED_DIR):
            shutil.rmtree(DATASET_CLEANED_DIR)

        return jsonify({'message': f'Reset successful. Removed: {", ".join(removed) if removed else "Nothing to remove"}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    """Takes an image and returns face bounding boxes and predictions from all 3 models."""
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
        
    file = request.files['image']

    
    if not _allowed_file(file):
        return jsonify({'error': f'Unsupported file type. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'}), 400

    try:
        # Ensure models are loaded (lazy-loading for production)
        ensure_models_loaded()
        
        pil_img = Image.open(file.stream).convert('RGB')
        # Validate minimum image dimensions
        if pil_img.width < 20 or pil_img.height < 20:
            return jsonify({'error': 'Image is too small. Minimum size is 20x20 pixels.'}), 400
        img_np = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
        
        cascade = get_face_cascade()
        faces = []
        if cascade is not None:
            try:
                if not cascade.empty():
                    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=8, minSize=(60, 60))
            except Exception as e:
                logger.warning(f"OpenCV detectMultiScale failed: {e}")

        if len(faces) == 0:
            # Fallback: Treat the whole image as the bounding box and pass to models
            h, w = img_np.shape[:2]
            faces = [(0, 0, w, h)]
            message = "Cascade failed to find a face: Full image evaluated."
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
            
            
            # Predict SOTA (guarded — won't crash if model/classes are empty)
            sota_label, sota_conf_val = '[UNTRAINED]', 0.0
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
            if deepface_encodings is not None:
                try:
                    processed = apply_clahe(face_roi_cv)
                    # TTA: average 5 embeddings from different augmentations
                    emb = get_embedding_tta(processed)
                    if emb is None:
                        # Fallback to single embedding if TTA fails
                        emb = get_embedding(processed)
                    if emb is not None:
                        df_label, dist, df_confidence_level = find_match_knn(emb, deepface_encodings, deepface_names)
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
            
            # A person is CONFIRMED only if DeepFace says 'confirmed' 
            # (passed all 4 gates including binary threshold)
            is_confirmed = (df_confidence_level == "confirmed" and ens_label != "Unknown")
            
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
                }
            })
            
        # Store embeddings for feedback tracking
        for i, result in enumerate(results):
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
                        pred_id, emb,
                        result['ensemble']['label'],
                        result['ensemble']['confidence'],
                        face_img=face_roi_cv
                    )

        # Log to recognition history
        log_recognition(results)
            
        return jsonify({'faces': results, 'message': message})
    except Exception as e:
        logger.error(f"Predict error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

# ─── Recognition History Endpoints ────────────────────────────────────
@app.route('/api/history', methods=['GET'])
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
def get_config_endpoint():
    try:
        from config_utils import load_config
        return jsonify(load_config())
    except Exception as e:
        logger.error(f"Error reading config: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/config', methods=['POST'])
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
def feedback_stats():
    """Get feedback learning statistics."""
    return jsonify(get_feedback_stats())

# ─── Dashboard Stats Endpoint ─────────────────────────────────────────
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_stats():
    expected_classes = []
    if os.path.exists(DATASET_CLEANED_DIR):
        expected_classes = sorted([name for name in os.listdir(DATASET_CLEANED_DIR) 
                                   if os.path.isdir(os.path.join(DATASET_CLEANED_DIR, name))])
                                   
    total_people = len(expected_classes)
    total_photos = 0
    photos_per_person = {}
    
    for p in expected_classes:
        p_dir = os.path.join(DATASET_CLEANED_DIR, p)
        # Count all image files recursively in this person's directory
        count = 0
        if os.path.exists(p_dir):
            for root, dirs, files in os.walk(p_dir):
                count += sum(1 for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.bmp')))
        photos_per_person[p] = count
        total_photos += count
        
    sota_loaded_state = sota_loaded
    sota_classes_state = sota_classes
    
    requires_retrain = False
    if total_people > 0:
        sota_mismatch = (not sota_loaded_state) or (sorted(sota_classes_state) != expected_classes)
        requires_retrain = sota_mismatch

    # Read history for stats
    history = []
    if os.path.exists(RECOGNITION_HISTORY_PATH):
        try:
            with open(RECOGNITION_HISTORY_PATH, 'r') as f:
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
def get_person_photo(name, angle, filename):
    """Serves a specific cleaned photo file."""
    path = os.path.join(DATASET_CLEANED_DIR, name, angle, filename)
    if os.path.exists(path):
        return send_file(path)
    return jsonify({'error': 'Photo not found'}), 404

@app.route('/api/persons/<name>/photos/<angle>/<filename>', methods=['DELETE'])
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

@app.route('/api/persons/<name>/photos/move', methods=['POST'])
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
    
    # Generate clean name with sequential index in the target folder
    existing = [f for f in os.listdir(cleaned_target_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp'))]
    new_index = len(existing) + 1
    new_filename = f"{name}_{target_angle}_{new_index:03d}.jpg"
    
    cleaned_target = os.path.join(cleaned_target_dir, new_filename)
    raw_target = os.path.join(raw_target_dir, new_filename)
    
    moved = False
    try:
        if os.path.exists(cleaned_source):
            os.rename(cleaned_source, cleaned_target)
            moved = True
        if os.path.exists(raw_source):
            os.rename(raw_source, raw_target)
            
        if not moved:
            return jsonify({'error': 'Source file not found'}), 404
            
        # Rebuild DeepFace embeddings since the photo moved
        rebuild_person_embeddings(name)
        reload_models()
        
        return jsonify({
            'message': f"Moved photo to {target_angle} as '{new_filename}'",
            'new_filename': new_filename
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/persons/<name>/retrain', methods=['POST'])
def trigger_person_retrain(name):
    """Triggers fine-tuning SOTA on current dataset for a person."""
    name = name.strip()
    if not os.path.exists(os.path.join(DATASET_CLEANED_DIR, name)):
        return jsonify({'error': 'Person not found'}), 404
        
    try:
        data = request.get_json() or {}
        epochs = int(data.get('epochs', 5))
        epochs = max(1, min(epochs, 50))
    except ValueError:
        epochs = 5

    if training_status['is_training']:
        return jsonify({'error': 'A model refinement is currently running in the background. Please wait for it to finish.'}), 409

    # Start training in background thread
    thread = threading.Thread(target=run_sota_finetune_pipeline, args=(name, epochs))
    thread.start()

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
    print(f"\n{'='*50}")
    print(f"  RMS Face AI - API Server")
    print(f"{'='*50}")
    print(f"  Local:   http://127.0.0.1:{port}")
    print(f"  Network: http://{local_ip}:{port}")
    print(f"{'='*50}")
    print(f"  -> Use the Network URL in the mobile app Settings")
    print(f"{'='*50}\n")

    # Bind to 0.0.0.0 so mobile devices on the same WiFi can connect
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False, threaded=True)
