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

# Add parent directory to sys.path so we can import from the existing pipeline
PARENT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(PARENT_DIR)

from add_person_utils import add_person_to_all_models
from sota_finetune.finetune import build_mobile_model, export_to_onnx
from custom_cnn.inference import FaceRecognizer as CustomFaceRecognizer
from model import apply_clahe, get_embedding
from inference import find_match_knn
import torch
import cv2
import pickle
import numpy as np
from PIL import Image
from torchvision import transforms

app = Flask(__name__)
CORS(app)  # Allow all origins for development

# Configuration
DATASET_CLEANED_DIR = os.path.join(PARENT_DIR, 'dataset_cleaned')
CUSTOM_CNN_MODEL_PATH = os.path.join(PARENT_DIR, 'custom_cnn', 'best_face_model.pth')
SOTA_MODEL_PATH = os.path.join(PARENT_DIR, 'sota_finetune', 'best_mobile_sideface.pth')
DEEPFACE_MODEL_PATH = os.path.join(PARENT_DIR, 'encodings.pickle')

# Global state for training SSE
training_status = {
    'is_training': False,
    'logs': [],
    'progress': 0,
    'current_epoch': '',
}

# --- GLOBAL MODEL INITIALIZATION (For Inference) ---
print("[API] Initializing Face Detection and Recognition Models...")

cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
face_cascade = cv2.CascadeClassifier(cascade_path)

def load_deepface():
    try:
        data = pickle.loads(open(DEEPFACE_MODEL_PATH, "rb").read())
        return data["encodings"], data["names"]
    except Exception as e:
        print(f"⚠️ DeepFace encodings not loadable: {e}")
        return None, None
deepface_encodings, deepface_names = load_deepface()

custom_cnn_recognizer = CustomFaceRecognizer(
    model_path=CUSTOM_CNN_MODEL_PATH, 
    classes_path=os.path.join(PARENT_DIR, 'custom_cnn', 'class_names.txt')
)

def load_sota():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    classes_path = os.path.join(PARENT_DIR, 'sota_finetune', 'mobile_classes.txt')
    classes = []
    if os.path.exists(classes_path):
        with open(classes_path, "r") as f:
            classes = [line.strip() for line in f.readlines() if line.strip()]
    num_classes = len(classes) if classes else 2
    model = build_mobile_model(num_classes=num_classes)
    
    is_loaded = False
    if os.path.exists(SOTA_MODEL_PATH):
        model.load_state_dict(torch.load(SOTA_MODEL_PATH, map_location=device))
        is_loaded = True
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
    custom_cnn_recognizer = CustomFaceRecognizer(
        model_path=CUSTOM_CNN_MODEL_PATH,
        classes_path=os.path.join(PARENT_DIR, 'custom_cnn', 'class_names.txt')
    )
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
        
    try:
        epochs = int(request.form.get('epochs', 5))
    except ValueError:
        epochs = 5

    # Read uploaded files
    front_img = request.files.get('front_img')
    left_img = request.files.get('left_img')
    right_img = request.files.get('right_img')
    extra_files = request.files.getlist('extra_files')

    # Convert to PIL/Numpy for add_person_utils
    from PIL import Image
    import numpy as np
    
    image_data_list = []
    
    def process_upload(file_storage, angle_label):
        if file_storage and file_storage.filename != '':
            try:
                img = Image.open(file_storage.stream).convert('RGB')
                image_data_list.append((np.array(img), angle_label))
            except Exception as e:
                print(f"Failed to read image {angle_label}: {e}")

    process_upload(front_img, 'frontal')
    process_upload(left_img, 'left')
    process_upload(right_img, 'right')

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

    classes_path = os.path.join(PARENT_DIR, 'sota_finetune', 'mobile_classes.txt')
    classes = []
    if os.path.exists(classes_path):
        with open(classes_path, "r") as f:
            classes = [line.strip() for line in f.readlines() if line.strip()]
            
    num_classes = len(classes) if classes else 2
    output_onnx_path = os.path.join(PARENT_DIR, "sideface_mobile.onnx")

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
    path = os.path.join(PARENT_DIR, "sideface_mobile.onnx")
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
    path = os.path.join(PARENT_DIR, filename)
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
            os.path.join(PARENT_DIR, 'sota_finetune', 'mobile_classes.txt'),
            os.path.join(PARENT_DIR, 'custom_cnn', 'class_names.txt'),
            os.path.join(PARENT_DIR, 'sideface_mobile.onnx'),
            os.path.join(PARENT_DIR, 'facenet512.onnx'),
            os.path.join(PARENT_DIR, 'class_centroids.json'),
            os.path.join(PARENT_DIR, 'label_map.json'),
        ]
        
        removed = []
        for f in files_to_remove:
            if os.path.exists(f):
                os.remove(f)
                removed.append(os.path.basename(f))
                
        # Clear specific folders without deleting the whole directory
        raw_dataset_dir = os.path.join(PARENT_DIR, 'dataset')
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

    try:
        pil_img = Image.open(file.stream).convert('RGB')
        img_np = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
        
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        message = f'Detected {len(faces)} face(s)'
        if len(faces) == 0:
            # Fallback: Treat the whole image as the bounding box and pass to models
            h, w = img_np.shape[:2]
            faces = [(0, 0, w, h)]
            message = "Cascade failed to find a face: Full image evaluated."

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
            cnn_label, cnn_conf = custom_cnn_recognizer.predict(face_roi_pil)
            
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
                    
            results.append({
                'bbox': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)},
                'predictions': {
                    'cnn': {'label': cnn_label, 'confidence': float(cnn_conf)},
                    'sota': {'label': sota_label, 'confidence': float(sota_conf.item())},
                    'deepface': {'label': df_label, 'confidence': float(df_conf)}
                }
            })
            
        return jsonify({'faces': results, 'message': message})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Use a free port, typically 5000
    app.run(host='127.0.0.1', port=5000, debug=True, use_reloader=False, threaded=True)
