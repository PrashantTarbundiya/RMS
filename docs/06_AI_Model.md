# 06 AI Model Architecture

## Overview
RMS Face AI utilizes an **Ensemble Model Strategy** to overcome the standard latency vs. accuracy trade-off found in enterprise facial recognition systems. It combines the rapid indexing capabilities of K-Nearest Neighbors (KNN) via FaceNet embeddings with the deep categorical accuracy of a locally fine-tuned MobileNetV2 architecture.

## Face Detection (Preprocessing)
Before any deep learning occurs, the image must be cropped strictly to the facial boundary to remove background noise (walls, shirts, environment).
- **Algorithm:** OpenCV Haar Cascade (`haarcascade_frontalface_default.xml`).
- **Configuration:** `scaleFactor=1.1, minNeighbors=8, minSize=(60,60)`.
- **Reasoning:** Haar Cascades are computationally cheap and run in milliseconds on CPUs. By setting a high `minNeighbors` threshold, the system drastically reduces false positives (e.g., mistaking a clock or a shadow for a face), which is critical for unattended kiosks.

## The Ensemble ML Pipeline

### 1. Structural Embeddings (DeepFace / FaceNet512)
**Goal:** High-speed vector similarity.
- **Mechanism:** DeepFace passes the cropped image through the FaceNet512 architecture, outputting a 512-dimensional floating-point vector (embedding). 
- **Storage:** These embeddings are stored in RAM via `encodings.pickle` alongside the person's string identifier (Name).
- **Inference:** The system uses `scikit-learn`'s `KNeighborsClassifier`. It calculates the Euclidean distance between the incoming face vector and all known vectors. 
- **Advantage:** *Zero-shot enrollment*. When a new employee is added, we simply compute their embeddings and append them to the Pickle dictionary. No backpropagation or neural network training is required, making them instantly recognizable.

### 2. Deep Classifier (MobileNetV2)
**Goal:** High-accuracy categorical confirmation.
- **Mechanism:** A lightweight Convolutional Neural Network (CNN) built via PyTorch. 
- **Architecture:** The base layers of MobileNetV2 are loaded with pre-trained ImageNet weights (transfer learning) and frozen. The final classification head is replaced with a custom Linear layer matching the exact number of enrolled employees.
- **Advantage:** Learns robust features (lighting variance, side profiles, partial occlusions) that raw Euclidean distance sometimes struggles with.
- **Disadvantage:** Slow to train. Adding a new employee requires running backpropagation over the entire dataset (`dataset_cleaned`), which takes minutes/hours depending on hardware.

## Prediction Flow (`ensemble.py`)
Because the MobileNetV2 model takes time to retrain, the ensemble engine employs intelligent failovers:
1. **Model Synchronization Check:** The engine checks if the number of classes in the SOTA (MobileNetV2) model perfectly matches the classes in the DeepFace Pickle file.
2. **Synchronized State:** If they match, the engine queries *both* models. The DeepFace confidence score and the MobileNetV2 Softmax probability are mathematically averaged.
3. **Asynchronous State (Immediate Enrollment):** If a new person was just enrolled, the SOTA model is currently outdated. The engine detects this and relies **100% on the DeepFace KNN index** to make the prediction, ensuring the new employee is instantly allowed through the gate while the CNN trains in the background.

## Feature Extraction & Normalization
To maximize accuracy across varying hardware (cheap webcams vs. 4K cameras):
- Images are resized to 160x160 for DeepFace and 224x224 for MobileNetV2.
- **CLAHE (Contrast Limited Adaptive Histogram Equalization)** is applied to normalize shadows and harsh overhead lighting found in corporate lobbies.

## Performance Metrics & Limitations
- **Speed:** The entire pipeline (Detection -> Crop -> KNN -> SOTA) executes in ~300-800ms on a standard Intel i5/i7 CPU.
- **GPU Scaling:** PyTorch automatically utilizes CUDA if an NVIDIA GPU is present, bringing inference time down to <50ms.
- **Limitation:** The Haar Cascade struggles with extreme side profiles (yaw > 45 degrees). 
- **Future Improvement:** Replacing Haar Cascades with a lightweight RetinaFace or MediaPipe mesh, though this introduces a higher base CPU footprint.

## Training Loop
Handled by `retrain_all.py` and `sota_finetune/finetune.py`.
- **Optimizer:** Adam.
- **Loss Function:** CrossEntropyLoss.
- **Epochs:** Configurable (default 25).
- **Data Augmentation:** RandomHorizontalFlip, RandomRotation, and ColorJitter are applied during the PyTorch `DataLoader` phase to artificially expand the 15-image enrollment dataset into robust training data.
