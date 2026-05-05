import os
import cv2
import pickle
import gradio as gr
from PIL import Image
import numpy as np
import torch
from torchvision import transforms

# --- Model 1: DeepFace (from model.py/inference.py) ---
from deepface import DeepFace
from scipy.spatial.distance import cosine
from model import apply_clahe, get_embedding
from inference import find_match_knn

# --- Model 2: Custom CNN (from custom_cnn/inference.py) ---
from custom_cnn.inference import FaceRecognizer as CustomFaceRecognizer

# --- Model 3: SOTA Finetune MobileNetV2 (from sota_finetune/finetune.py) ---
from sota_finetune.finetune import build_mobile_model

# --- Add Person Utility ---
from add_person_utils import add_person_to_all_models

# Helper: Load DeepFace Encodings
def load_deepface_encodings(encodings_path='encodings.pickle'):
    try:
        data = pickle.loads(open(encodings_path, "rb").read())
        version = data.get("version", "1.0")
        print(f"📦 DeepFace Encodings version: {version}")
        return data["encodings"], data["names"]
    except Exception as e:
        print(f"⚠️ DeepFace encodings not found: {e}")
        return None, None

deepface_encodings, deepface_names = load_deepface_encodings()

def predict_deepface(face_crop):
    if deepface_encodings is None:
        return "DeepFace: Not Trained", 0.0
    try:
        # Apply CLAHE (must match training pipeline)
        processed_crop = apply_clahe(face_crop)
        
        # Single-model embedding (Facenet512)
        embedding = get_embedding(processed_crop)
        
        if embedding is not None:
            name, dist = find_match_knn(embedding, deepface_encodings, deepface_names)
            conf = max(0, (1 - dist)) * 100
            return f"DeepFace: {name}", conf
    except Exception as e:
        print(f"DeepFace Prediction Error: {e}")
    return "DeepFace: Error", 0.0

# --- Init Custom CNN ---
custom_cnn_recognizer = CustomFaceRecognizer(
    model_path="custom_cnn/best_face_model.pth", 
    classes_path="custom_cnn/class_names.txt"
)

# --- Init SOTA MobileNetV2 Model ---
def load_sota_model(model_path="sota_finetune/best_mobile_sideface.pth", classes_path="sota_finetune/mobile_classes.txt"):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    classes = []
    if os.path.exists(classes_path):
        with open(classes_path, "r") as f:
            classes = [line.strip() for line in f.readlines() if line.strip()]
    num_classes = len(classes) if classes else 2
    
    model = build_mobile_model(num_classes=num_classes)
    
    is_loaded = False
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location=device))
        is_loaded = True
        print(f"Successfully loaded SOTA weights from: {model_path}")
    else:
        print(f"Warning: SOTA model weights '{model_path}' not found! Using standard untrained model.")
        
    model.to(device)
    model.eval()
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    return model, classes, val_transform, device, is_loaded

sota_model, sota_classes, sota_transform, sota_device, sota_loaded = load_sota_model()

def predict_sota(image_pil):
    if image_pil.mode != 'RGB':
        image_pil = image_pil.convert('RGB')
        
    input_tensor = sota_transform(image_pil).unsqueeze(0).to(sota_device)
    with torch.no_grad():
        outputs = sota_model(input_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        confidence, predicted_idx = torch.max(probabilities, 1)
        
    idx = predicted_idx.item()
    conf = confidence.item()
    
    if sota_classes and idx < len(sota_classes):
        label = sota_classes[idx]
    else:
        label = f"Class Index: {idx}"
        
    if not sota_loaded:
        label = "[UNTRAINED] " + label
        
    return f"SOTA: {label}", conf

# --- Gradio Inference Wrapper ---
def process_group_image(input_image):
    if input_image is None:
        return None, "⚠️ Please upload an image or turn on the webcam feed first."
        
    import cv2
    import numpy as np
    
    try:
        pil_img = Image.fromarray(input_image)
    except Exception as e:
        return None, f"⚠️ Error parsing image: {str(e)}"
        
    # Convert for OpenCV face detection
    img_np = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
    
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)
    
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    
    results_gallery = []
    
    for (x, y, w, h) in faces:
        margin_x = int(w * 0.15)
        margin_y = int(h * 0.15)
        x1 = max(0, x - margin_x)
        y1 = max(0, y - margin_y)
        x2 = min(img_np.shape[1], x + w + margin_x)
        y2 = min(img_np.shape[0], y + h + margin_y)
        
        # PIL Crop
        face_roi_pil = pil_img.crop((x1, y1, x2, y2))
        # OpenCV Crop for DeepFace (BGR numpy)
        face_roi_cv = img_np[y1:y2, x1:x2]
        
        # 1. Custom CNN Prediction
        label_cnn, conf_cnn = custom_cnn_recognizer.predict(face_roi_pil)
        res_cnn = f"Custom CNN: {label_cnn} ({(conf_cnn*100):.1f}%)"
        
        # 2. SOTA Prediction
        label_sota, conf_sota = predict_sota(face_roi_pil)
        res_sota = f"{label_sota} ({(conf_sota*100):.1f}%)"
        
        # 3. DeepFace Prediction (v2.0 Ensemble)
        label_df, conf_df = predict_deepface(face_roi_cv)
        res_df = f"{label_df} ({conf_df:.1f}%)"
        
        display_label = f"{res_cnn}\n{res_sota}\n{res_df}"
        results_gallery.append((face_roi_pil, display_label))
        
    if not results_gallery:
        return [(pil_img, "No faces detected")], "⚠️ No faces found in the image."
        
    return results_gallery, f"**Detected {len(faces)} face(s). Showing outputs from 3 internal models.**"


# ============================================================================
# ADD PERSON HANDLER — Saves images & updates all 3 models
# ============================================================================

def handle_add_person(person_name, front_img, left_img, right_img, extra_files):
    """
    Gradio callback for the Add Person button.
    Accepts separate front/left/right face images + extra bulk uploads.
    Updates all models, then reloads them in memory.
    """
    global deepface_encodings, deepface_names
    global custom_cnn_recognizer
    global sota_model, sota_classes, sota_transform, sota_device, sota_loaded

    if not person_name or not person_name.strip():
        return "❌ Please enter a person name."

    # Collect webcam/upload angle images as (image, angle_label) tuples
    image_data = []
    angle_inputs = [
        (front_img, "frontal"),
        (left_img, "left"),
        (right_img, "right"),
    ]
    for img, angle in angle_inputs:
        if img is not None:
            image_data.append((img, angle))
            print(f"   📸 Received: {angle}")

    # Collect extra uploaded files (labeled as 'extra')
    if extra_files is not None:
        for file_path in extra_files:
            try:
                img = Image.open(file_path).convert('RGB')
                image_data.append((np.array(img), "extra"))
                print(f"   📸 Received extra upload: {os.path.basename(str(file_path))}")
            except Exception as e:
                print(f"   ⚠️ Could not read file: {e}")

    if not image_data:
        return "❌ Please provide at least one face photo."

    # Run the master add function (saves to angle subfolders + cleans + updates all models)
    result_msg = add_person_to_all_models(person_name, image_data)

    # --- Hot-reload all models into memory ---
    # 1. Reload DeepFace encodings
    new_encs, new_names = load_deepface_encodings()
    if new_encs is not None:
        deepface_encodings = new_encs
        deepface_names = new_names

    # 2. Reload Custom CNN
    custom_cnn_recognizer = CustomFaceRecognizer(
        model_path="custom_cnn/best_face_model.pth",
        classes_path="custom_cnn/class_names.txt"
    )

    # 3. Reload SOTA MobileNetV2
    sota_model, sota_classes, sota_transform, sota_device, sota_loaded = load_sota_model()

    return result_msg + "\n\n🔄 **All models reloaded in memory. Ready for recognition!**"


# --- Gradio UI Blocks ---
with gr.Blocks(title="Unified Face Models Demo") as demo:
    gr.Markdown(
        """
        # 🤖 Multi-Model Face Recognition Hub
        Upload a group photo or use the webcam. This app extracts faces and runs them through:
        1. **DeepFace Model (Facenet512)**
        2. **Custom CNN Model**
        3. **SOTA MobileNetV2 Finetuned Model**
        """
    )

    with gr.Tabs():
        # ==================== TAB 1: RECOGNITION ====================
        with gr.TabItem("🔍 Face Recognition"):
            with gr.Row():
                with gr.Column():
                    input_image = gr.Image(sources=["upload", "webcam"], label="Input Face Image (Upload or Live Feed)")
                    submit_btn = gr.Button("🔍 Run Recognition on All Models", variant="primary")
                    
                with gr.Column():
                    output_gallery = gr.Gallery(label="Detected Faces & Model Predictions", columns=2, height="auto")
                    output_text = gr.Markdown(label="Recognition State", value="*Awaiting inference...*")

            submit_btn.click(
                fn=process_group_image,
                inputs=[input_image],
                outputs=[output_gallery, output_text]
            )

        # ==================== TAB 2: ADD NEW PERSON ====================
        with gr.TabItem("➕ Add New Person"):
            gr.Markdown(
                """
                ## Register a New Person
                Provide the person's name and face photos from **different angles**.  
                Use the **webcam** to capture front/left/right views, or **upload multiple photos** below.

                The system will:
                1. Save images to the dataset
                2. Generate DeepFace embeddings (instant)
                3. Fine-tune Custom CNN (~5 epochs)
                4. Fine-tune SOTA MobileNetV2 (~5 epochs)
                """
            )

            person_name_input = gr.Textbox(
                label="👤 Person Name",
                placeholder="e.g. John_Doe",
                info="Use underscores instead of spaces. This becomes the folder name."
            )

            gr.Markdown("### 📸 Capture via Webcam (one per angle)")

            with gr.Row():
                front_image_input = gr.Image(
                    sources=["upload", "webcam"],
                    label="🟢 Front Face",
                    type="numpy"
                )
                left_image_input = gr.Image(
                    sources=["upload", "webcam"],
                    label="🔵 Left Profile",
                    type="numpy"
                )
                right_image_input = gr.Image(
                    sources=["upload", "webcam"],
                    label="🟣 Right Profile",
                    type="numpy"
                )

            gr.Markdown("### 📁 Or Upload Multiple Photos at Once")

            extra_files_input = gr.File(
                label="Upload Additional Face Photos (any angle, multiple files)",
                file_count="multiple",
                file_types=["image"]
            )

            add_person_btn = gr.Button(
                "➕ Add Person to All Models",
                variant="primary",
                size="lg"
            )

            add_person_status = gr.Markdown(
                value="*Capture photos via webcam and/or upload files, then click the button above...*"
            )

            add_person_btn.click(
                fn=handle_add_person,
                inputs=[person_name_input, front_image_input, left_image_input, right_image_input, extra_files_input],
                outputs=[add_person_status]
            )

if __name__ == "__main__":
    print("Deploying Multi-Model Live Demo interface...")
    demo.launch(server_name="127.0.0.1", server_port=7860, share=False)

