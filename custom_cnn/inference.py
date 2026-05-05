import torch
from torchvision import transforms
from PIL import Image
import os
try:
    from custom_cnn.model import CustomFaceCNN
except ImportError:
    from model import CustomFaceCNN

class FaceRecognizer:
    def __init__(self, model_path="best_face_model.pth", classes_path="class_names.txt"):
        """
        Initializes the model architecture and loads pre-trained weights if available.
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Inference Device: {self.device}")
        
        # 1. Load Classes
        self.classes = []
        if os.path.exists(classes_path):
            with open(classes_path, "r") as f:
                self.classes = [line.strip() for line in f.readlines() if line.strip()]
        else:
            print("Notice: class_names.txt not found. Outputting raw indices instead of string labels.")
            
        num_classes = len(self.classes) if self.classes else 2
        
        # 2. Init Model
        self.model = CustomFaceCNN(num_classes=num_classes)
        
        # 3. Load Weights
        if os.path.exists(model_path):
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
            self.model.to(self.device)
            self.model.eval()
            self.is_loaded = True
            print(f"Successfully loaded model weights from: {model_path}")
        else:
            print(f"Warning: Model weights '{model_path}' not found! Using standard untrained model (random outputs).")
            self.model.to(self.device)
            self.model.eval()
            self.is_loaded = False
            
        # 4. Standard Preprocessing transformations (Must match training transforms)
        self.transform = transforms.Compose([
            transforms.Resize((128, 128)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def predict(self, image: Image.Image):
        """
        Predicts the class of a given PIL Image object.
        """
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(input_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted_idx = torch.max(probabilities, 1)
            
        idx = predicted_idx.item()
        conf = confidence.item()
        
        # Translate idx back to actual string format
        if self.classes and idx < len(self.classes):
            label = self.classes[idx]
        else:
            label = f"Class Index: {idx}"
            
        # Notice if using random weights
        if not self.is_loaded:
            label = "[UNTRAINED] " + label
            
        return label, conf

    def predict_group(self, image: Image.Image):
        """
        Detects multiple faces, crops them, runs inference individually,
        and returns a list of tuples: (cropped_face_pil, label_string).
        """
        import cv2
        import numpy as np

        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        img_np = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
        
        # Load OpenCV's built-in Haar Cascade for simple and fast face detection
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        results = []
        for (x, y, w, h) in faces:
            # Crop with a slight margin so we see the full face
            margin_x = int(w * 0.15)
            margin_y = int(h * 0.15)
            
            x1 = max(0, x - margin_x)
            y1 = max(0, y - margin_y)
            x2 = min(img_np.shape[1], x + w + margin_x)
            y2 = min(img_np.shape[0], y + h + margin_y)
            
            face_roi = image.crop((x1, y1, x2, y2))
            
            # Predict the cropped face
            label, conf = self.predict(face_roi)
            
            display_label = f"{label} ({(conf*100):.1f}%)"
            results.append((face_roi, display_label))
            
        if len(results) == 0:
            return [(image, "No faces detected")]
            
        return results

if __name__ == "__main__":
    print("This script is abstract and usually gets imported by app.py.")
