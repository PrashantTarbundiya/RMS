# Side Face Recognition System

This project implements a robust Side Face Recognition system capable of identifying individuals from profile views (90°).

## 📄 Research References
This implementation draws inspiration from recent academic research in non-frontal face recognition:
1.  **Geometric/Soft Biometrics**: Inspired by *Alsubhi et al., 2025*, our `SideFaceDetector` now explicitly calculates **anthropometric soft biometrics** (Nose-Eye Offset, Eye Compression, etc.) and visualizes them in real-time. This can be seen in the "SOFT BIOMETRICS" overlay in `inference.py`.
2.  **Multi-View Embeddings**: While some approaches use GANs to "correct" faces as discussed in *Lin et al. ("Non-frontal face recognition method...")*, we employ a more robust **Multi-View Enrollment** strategy. By capturing actual profile data (Frontal, Left, Right), we avoid the artifacts introduced by GAN synthesis and achieve higher accuracy in real-world conditions without complex training.

## 🚀 Setup & Usage

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Prepare Dataset
You have two options:

**Option A: Automated (Celebrity Data)**
Downloads and filters the LFW dataset for profile views.
```bash
python download_dataset.py
```

**Option B: Manual (Your Own Face)** (Recommended for best results)
Captures your face from 3 angles using your webcam.
```bash
python dataset_setup.py "YourName"
```

### 3. Train Model
Generates embeddings from the dataset.
```bash
python model.py
```

### 4. Run Recognition
Starts real-time recognition.
```bash
python inference.py
```

## 🛠️ Components
- **`face_detection.py`**: Core MediaPipe-based detector with geometric pose analysis.
- **`dataset_setup.py`**: Tool to capture structured multi-view data.
- **`download_dataset.py`**: Tool to fetch and filter external datasets.
- **`model.py`**: Generates face embeddings (robust to pose).
- **`inference.py`**: Real-time recognition engine.
