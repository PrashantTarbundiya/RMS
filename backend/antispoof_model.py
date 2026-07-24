"""
antispoof_model.py — Lightweight binary anti-spoofing CNN classifier.

Architecture: MobileNetV2 backbone (frozen) with a binary classification head.
Input: 224x224 face ROI
Output: (is_real: bool, confidence: float)

This model is an ADDITIONAL vote alongside the classical heuristic checks
in liveness.py — not a replacement. The ensemble of learned + heuristic
checks is significantly harder to fool than either alone.

Model Lifecycle:
  1. Train on a public anti-spoofing dataset (CelebA-Spoof or CASIA-SURF)
  2. Save weights to: backend/models/antispoof/antispoof_mobilenet.pth
  3. On server startup, load if weights file exists (optional component)
  4. During inference, run alongside classical checks as an independent vote

Security posture: If the model file doesn't exist or fails to load,
the system falls back to classical-only checks (graceful degradation,
not a security bypass — the classical checks are already hardened).
"""

import os
import logging
import numpy as np

logger = logging.getLogger('rms-antispoof')

# Global state — loaded once, reused across requests
_antispoof_model = None
_antispoof_transform = None
_antispoof_device = None
_antispoof_loaded = False

# Path to the trained anti-spoof model weights
ANTISPOOF_WEIGHTS_PATH = os.path.join(
    os.path.dirname(__file__), 'models', 'antispoof', 'antispoof_mobilenet.pth'
)

# Confidence threshold for the CNN vote
# Below this → the CNN vote is "spoof"
ANTISPOOF_CNN_THRESHOLD = 0.5


def load_antispoof_model():
    """
    Load the anti-spoof MobileNetV2 binary classifier.
    Returns True if successfully loaded, False otherwise.
    
    Safe to call multiple times — only loads once.
    """
    global _antispoof_model, _antispoof_transform, _antispoof_device, _antispoof_loaded
    
    if _antispoof_loaded:
        return True
    
    if not os.path.exists(ANTISPOOF_WEIGHTS_PATH):
        logger.info(f"[ANTISPOOF] No trained model found at {ANTISPOOF_WEIGHTS_PATH} — "
                     "anti-spoof CNN vote disabled. Classical checks remain active.")
        return False
    
    try:
        import torch
        import torchvision.transforms as transforms
        from torchvision import models
        
        # Determine device
        _antispoof_device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Build model: MobileNetV2 with binary output head
        model = models.mobilenet_v2(weights=None)
        # Replace classifier head: 1280 features → 2 classes (real, spoof)
        model.classifier = torch.nn.Sequential(
            torch.nn.Dropout(p=0.2),
            torch.nn.Linear(model.last_channel, 2)
        )
        
        # Load trained weights
        state_dict = torch.load(ANTISPOOF_WEIGHTS_PATH, map_location=_antispoof_device)
        model.load_state_dict(state_dict)
        model.to(_antispoof_device)
        model.eval()
        
        _antispoof_model = model
        
        # Standard ImageNet normalization (same as training)
        _antispoof_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                 std=[0.229, 0.224, 0.225]),
        ])
        
        _antispoof_loaded = True
        logger.info("[ANTISPOOF] Anti-spoof CNN model loaded successfully.")
        return True
        
    except Exception as e:
        logger.error(f"[ANTISPOOF] Failed to load anti-spoof model: {e}")
        _antispoof_loaded = False
        return False


def predict_antispoof(face_roi_bgr):
    """
    Run the anti-spoof CNN on a face ROI.
    
    Args:
        face_roi_bgr: BGR numpy array of the cropped face region.
    
    Returns:
        (is_real: bool, confidence: float, available: bool)
        - is_real: True if the CNN thinks this is a real face
        - confidence: CNN's confidence that the face is real (0.0–1.0)
        - available: True if the CNN model was loaded and ran successfully
        
    If the model is not loaded or fails, returns (True, 0.0, False)
    to indicate the CNN vote is unavailable (not a bypass — classical
    checks are enforced independently).
    """
    global _antispoof_model, _antispoof_transform, _antispoof_device, _antispoof_loaded
    
    if not _antispoof_loaded or _antispoof_model is None:
        return True, 0.0, False
    
    try:
        import torch
        from PIL import Image
        
        # Convert BGR → RGB → PIL
        rgb = face_roi_bgr[:, :, ::-1]  # BGR to RGB
        pil_img = Image.fromarray(rgb)
        
        # Transform and predict
        input_tensor = _antispoof_transform(pil_img).unsqueeze(0).to(_antispoof_device)
        
        with torch.no_grad():
            outputs = _antispoof_model(input_tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1)
            # Class 0 = real, Class 1 = spoof
            real_confidence = float(probs[0, 0].item())
        
        is_real = real_confidence >= ANTISPOOF_CNN_THRESHOLD
        
        return is_real, real_confidence, True
        
    except Exception as e:
        logger.error(f"[ANTISPOOF] Prediction failed: {e}")
        return True, 0.0, False


def is_antispoof_model_available():
    """Check if the anti-spoof CNN model is loaded and ready."""
    return _antispoof_loaded
