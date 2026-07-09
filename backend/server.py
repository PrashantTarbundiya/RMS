import sys
import os
import time
import socket
import threading
from io import StringIO
from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import shutil

# Path setup — backend/ is where this file lives
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
sys.path.insert(0, BACKEND_DIR)

from add_person_utils import add_person_to_all_models
from models.sota_finetune.finetune import build_mobile_model, export_to_onnx
from models.custom_cnn.inference import FaceRecognizer as CustomFaceRecognizer
from model import apply_clahe, get_embedding
from inference import find_match_knn
import torch
import cv2
import pickle
import numpy as np
from PIL import Image
from torchvision import transforms
from ensemble import ensemble_predict

app = Flask(__name__)
CORS(app)  # Allow all origins for development
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB max upload

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'bmp'}
MAX_FILES_PER_UPLOAD = 20
MAX_NAME_LENGTH = 50

def _allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

import re
_VALID_NAME_PATTERN = re.compile(r'^[A-Za-z0-9_-]+$')

import json
import datetime

# ─── Health & Connectivity Endpoints ──────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health_check():
    """Quick health check for connectivity testing."""
    expected_classes = []
    if os.path.exists(DATASET_CLEANED_DIR):
        expected_classes = sorted([name for name in os.listdir(DATASET_CLEANED_DIR) 
                                   if os.path.isdir(os.path.join(DATASET_CLEANED_DIR, name))])
    
    total_people = len(expected_classes)
    
    cnn_loaded_state = False
    cnn_classes = []
    if custom_cnn_recognizer is not None:
        cnn_loaded_state = custom_cnn_recognizer.is_loaded
        cnn_classes = custom_cnn_recognizer.classes
        
    sota_loaded_state = sota_loaded
    sota_classes_state = sota_classes
    
    requires_retrain = False
    if total_people > 0:
        cnn_mismatch = (not cnn_loaded_state) or (sorted(cnn_classes) != expected_classes)
        sota_mismatch = (not sota_loaded_state) or (sorted(sota_classes_state) != expected_classes)
        requires_retrain = cnn_mismatch or sota_mismatch

    return jsonify({
        'status': 'ok',
        'requires_retrain': requires_retrain,
        'models': {
            'deepface': deepface_encodings is not None,
            'custom_cnn': cnn_loaded_state,
            'sota': sota_loaded_state,
        }
    })

@app.route('/api/ping', methods=['GET'])
def ping():
    """Minimal ping endpoint for connection testing."""
    return jsonify({'pong': True})

# Configuration — paths relative to project structure
DATASET_CLEANED_DIR = os.path.join(PROJECT_ROOT, 'dataset_cleaned')
CUSTOM_CNN_MODEL_PATH = os.path.join(BACKEND_DIR, 'models', 'custom_cnn', 'best_face_model.pth')
SOTA_MODEL_PATH = os.path.join(BACKEND_DIR, 'models', 'sota_finetune', 'best_mobile_sideface.pth')
DEEPFACE_MODEL_PATH = os.path.join(BACKEND_DIR, 'data', 'encodings.pickle')
RECOGNITION_HISTORY_PATH = os.path.join(BACKEND_DIR, 'data', 'recognition_history.json')

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
            
            if label == 'Unknown':
                status = 'error'
            elif confidence < 0.60:
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
        print(f"[WARNING] Failed to log recognition history: {e}")

# Global state for training SSE
training_status = {
    'is_training': False,
    'logs': [],
    'progress': 0,
    'current_epoch': '',
}

# --- GLOBAL MODEL INITIALIZATION (For Inference) ---
print("[API] Initializing Face Detection and Recognition Models...")

face_cascade = None

def get_face_cascade():
    global face_cascade
    if face_cascade is None or face_cascade.empty():
        base_dir = os.path.dirname(os.path.abspath(__file__))
        paths_to_try = [
            os.path.join(base_dir, 'haarcascade_frontalface_default.xml'),
            os.path.join(base_dir, '..', 'haarcascade_frontalface_default.xml'),
            'haarcascade_frontalface_default.xml'
        ]
        for p in paths_to_try:
            if os.path.exists(p):
                clf = cv2.CascadeClassifier(p)
                if not clf.empty():
                    face_cascade = clf
                    print(f"[API] Face cascade successfully loaded from: {p}")
                    return face_cascade
        print("[WARNING] Could not load face cascade from any path!")
        return None
    return face_cascade

# Initial try
get_face_cascade()

def load_deepface():
    try:
        data = pickle.loads(open(DEEPFACE_MODEL_PATH, "rb").read())
        return data["encodings"], data["names"]
    except Exception as e:
        print(f"[WARNING] DeepFace encodings not loadable: {e}")
        return None, None
deepface_encodings, deepface_names = load_deepface()

# Graceful custom CNN loading — won't crash if model file is missing
try:
    custom_cnn_recognizer = CustomFaceRecognizer(
        model_path=CUSTOM_CNN_MODEL_PATH, 
        classes_path=os.path.join(BACKEND_DIR, 'models', 'custom_cnn', 'class_names.txt')
    )
except Exception as e:
    print(f"[WARNING] Custom CNN model not loadable: {e}")
    custom_cnn_recognizer = None

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
            # Use strict=False to handle architecture changes (e.g., classifier head upgrade)
            result = model.load_state_dict(state_dict, strict=False)
            if result.missing_keys:
                print(f"[WARNING] SOTA model: missing keys (new architecture): {result.missing_keys}")
            if result.unexpected_keys:
                print(f"[WARNING] SOTA model: unexpected keys (old architecture): {result.unexpected_keys}")
            is_loaded = True
            print("[API] SOTA model loaded (with possible partial weight match)")
        except Exception as e:
            print(f"[WARNING] SOTA model failed to load: {e}. Using untrained model.")
    model.to(device)
    model.eval()
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return model, classes, val_transform, device, is_loaded

sota_model, sota_classes, sota_transform, sota_device, sota_loaded = load_sota()

def reload_models():
    """Reloads models into memory after training."""
    global deepface_encodings, deepface_names, custom_cnn_recognizer
    global sota_model, sota_classes, sota_transform, sota_device, sota_loaded
    print("[API] Hot-reloading models...")
    new_encs, new_names = load_deepface()
    if new_encs is not None:
        deepface_encodings = new_encs
        deepface_names = new_names
    try:
        custom_cnn_recognizer = CustomFaceRecognizer(
            model_path=CUSTOM_CNN_MODEL_PATH,
            classes_path=os.path.join(BACKEND_DIR, 'models', 'custom_cnn', 'class_names.txt')
        )
    except Exception as e:
        print(f"[WARNING] Custom CNN reload failed: {e}")
        custom_cnn_recognizer = None
    sota_model, sota_classes, sota_transform, sota_device, sota_loaded = load_sota()
    print("[API] Models reloaded globally.")
# ----------------------------------------------------

class ThreadSafeStringWriter(StringIO):
    def __init__(self, callback):
        super().__init__()
        self.callback = callback

    def write(self, text):
        if text.strip():
            self.callback(text)
        return super().write(text)

def add_log(msg):
    training_status['logs'].append(msg)
    print(f"[API Log]: {msg}")

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
    
    def process_upload(file_storage, angle_label):
        nonlocal rejected_count
        if file_storage and file_storage.filename != '':
            if not _allowed_file(file_storage.filename):
                rejected_count += 1
                print(f"Rejected non-image file: {file_storage.filename}")
                return
            try:
                img = Image.open(file_storage.stream).convert('RGB')
                image_data_list.append((np.array(img), angle_label))
            except Exception as e:
                rejected_count += 1
                print(f"Failed to read image {angle_label}: {e}")

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
        return jsonify({'error': 'Training is currently running. Please wait.'}), 409

    # Start training in background thread
    thread = threading.Thread(target=run_training_pipeline, args=(person_name, image_data_list, epochs))
    thread.start()

    return jsonify({'message': f'Upload successful. Training started for {person_name}.'})

def run_training_pipeline(person_name, image_data_list, epochs=5):
    """Executes the master function and captures its standard output for SSE."""
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
        print(f"--- Starting pipeline for {person_name} (Epochs: {epochs}) ---")
        result_msg = add_person_to_all_models(person_name, image_data_list, dataset_dir=DATASET_CLEANED_DIR, num_epochs=epochs)
        print("\n--- Pipeline Completed ---")
        print(result_msg)
        training_status['progress'] = 100
        
        # Trigger hot-reload of models for inference now that training is done
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
        from sota_finetune.finetune import build_mobile_model, export_to_onnx
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
    """Downloads the MobileNetV3 ONNX file."""
    path = os.path.join(PROJECT_ROOT, "sideface_mobile.onnx")
    if os.path.exists(path):
        return send_file(path, as_attachment=True)
    return jsonify({'error': 'Model not exported yet. Please export first.'}), 404

# Allowed artefact basenames that can be downloaded via this endpoint
_DOWNLOADABLE = {
    'sideface_mobile.onnx',
    'facenet512.onnx',
    'class_centroids.json',
    'label_map.json',
}

@app.route('/api/download-file', methods=['GET'])
def download_file():
    """
    Generic download endpoint for any of the generated artefacts.
    Usage: GET /api/download-file?name=facenet512.onnx
    Allowed names: sideface_mobile.onnx, facenet512.onnx,
                   class_centroids.json, label_map.json
    """
    filename = request.args.get('name', '')
    if filename not in _DOWNLOADABLE:
        return jsonify({'error': f"Unknown file '{filename}'. Allowed: {sorted(_DOWNLOADABLE)}"}), 400
    path = os.path.join(PROJECT_ROOT, filename)
    if not os.path.exists(path):
        return jsonify({'error': f"'{filename}' not found. Run training first."}), 404
    return send_file(path, as_attachment=True, download_name=filename)

@app.route('/api/models/reset', methods=['POST'])
def reset_models():
    """Deletes all trained models and optionally dataset."""
    try:
        files_to_remove = [
            CUSTOM_CNN_MODEL_PATH,
            SOTA_MODEL_PATH,
            DEEPFACE_MODEL_PATH,
            os.path.join(BACKEND_DIR, 'models', 'sota_finetune', 'mobile_classes.txt'),
            os.path.join(BACKEND_DIR, 'models', 'custom_cnn', 'class_names.txt'),
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
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    
    if not _allowed_file(file.filename):
        return jsonify({'error': f'Unsupported file type. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'}), 400

    try:
        pil_img = Image.open(file.stream).convert('RGB')
        # Validate minimum image dimensions
        if pil_img.width < 20 or pil_img.height < 20:
            return jsonify({'error': 'Image is too small. Minimum size is 20x20 pixels.'}), 400
        img_np = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
        
        cascade = get_face_cascade()
        faces = []
        if cascade is not None and not cascade.empty():
            try:
                faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
            except Exception as e:
                print(f"[WARNING] OpenCV detectMultiScale failed: {e}")

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
            
            # Predict Custom CNN
            cnn_label, cnn_conf = 'Not Loaded', 0.0
            if custom_cnn_recognizer is not None:
                try:
                    cnn_label, cnn_conf = custom_cnn_recognizer.predict(face_roi_pil)
                except Exception as e:
                    cnn_label, cnn_conf = 'Error', 0.0
            
            # Predict SOTA
            input_tensor = sota_transform(face_roi_pil).unsqueeze(0).to(sota_device)
            with torch.no_grad():
                outputs = sota_model(input_tensor)
                probs = torch.nn.functional.softmax(outputs, dim=1)
                sota_conf, predicted_idx = torch.max(probs, 1)
            idx = predicted_idx.item()
            sota_label = sota_classes[idx] if sota_classes and idx < len(sota_classes) else f"Class {idx}"
            if not sota_loaded: sota_label = "[UNTRAINED]"
            
            # Predict DeepFace
            df_label, df_conf = "Not Trained", 0.0
            if deepface_encodings is not None:
                try:
                    processed = apply_clahe(face_roi_cv)
                    emb = get_embedding(processed)
                    if emb is not None:
                        df_label, dist = find_match_knn(emb, deepface_encodings, deepface_names)
                        df_conf = max(0, (1 - dist))
                except Exception:
                    df_label = "Error"
                    
            # --- Ensemble Vote ---
            individual_preds = {
                'cnn': {'label': cnn_label, 'confidence': float(cnn_conf)},
                'sota': {'label': sota_label, 'confidence': float(sota_conf.item())},
                'deepface': {'label': df_label, 'confidence': float(df_conf)}
            }
            ensemble_result = ensemble_predict(individual_preds)

            results.append({
                'bbox': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)},
                'predictions': individual_preds,
                'ensemble': {
                    'label': ensemble_result['label'],
                    'confidence': ensemble_result['confidence'],
                    'method': ensemble_result['method'],
                    'agreement': ensemble_result.get('agreement', 'N/A'),
                }
            })
            
        # Log to recognition history
        log_recognition(results)
            
        return jsonify({'faces': results, 'message': message})
    except Exception as e:
        import traceback
        traceback.print_exc()
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
        
    # Check if models need retraining
    cnn_loaded_state = False
    cnn_classes = []
    if custom_cnn_recognizer is not None:
        cnn_loaded_state = custom_cnn_recognizer.is_loaded
        cnn_classes = custom_cnn_recognizer.classes
        
    sota_loaded_state = sota_loaded
    sota_classes_state = sota_classes
    
    requires_retrain = False
    if total_people > 0:
        cnn_mismatch = (not cnn_loaded_state) or (sorted(cnn_classes) != expected_classes)
        sota_mismatch = (not sota_loaded_state) or (sorted(sota_classes_state) != expected_classes)
        requires_retrain = cnn_mismatch or sota_mismatch

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
    
    agreement_counts = {'3/3': 0, '2/3': 0, '1/3': 0, '0/3': 0, 'N/A': 0}
    for entry in history:
        agr = entry.get('agreement', 'N/A')
        if agr in agreement_counts:
            agreement_counts[agr] += 1
        elif '3' in str(agr):
            agreement_counts['3/3'] += 1
        elif '2' in str(agr):
            agreement_counts['2/3'] += 1
        elif '1' in str(agr):
            agreement_counts['1/3'] += 1
        else:
            agreement_counts['0/3'] += 1
            
    return jsonify({
        'total_people': total_people,
        'total_photos': total_photos,
        'photos_per_person': photos_per_person,
        'requires_retrain': requires_retrain,
        'models_loaded': {
            'deepface': deepface_encodings is not None,
            'custom_cnn': cnn_loaded_state,
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
                    
        filter_class_file(os.path.join(BACKEND_DIR, 'models', 'custom_cnn', 'class_names.txt'))
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
                    
        rename_in_class_file(os.path.join(BACKEND_DIR, 'models', 'custom_cnn', 'class_names.txt'))
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
    """Triggers fine-tuning SOTA and CNN on current dataset for a person."""
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
        return jsonify({'error': 'Training is currently running. Please wait.'}), 409

    # Start training in background thread
    thread = threading.Thread(target=run_training_pipeline, args=(name, [], epochs))
    thread.start()

    return jsonify({'message': f"Retraining started for '{name}'."})

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
