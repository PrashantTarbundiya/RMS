---
name: face-detection
description: >-
  Configure, tune, and benchmark multi-scale face detection models including RetinaFace, MediaPipe BlazeFace, MTCNN, and OpenCV YuNet.
---

# Face Detection Engineering Standard

## Purpose & Scope
Configures robust single-shot and multi-scale face localization models across varying lighting and camera angles.

## Detector Hierarchy in AuraPass
1. **Primary Detector**: MediaPipe BlazeFace / SideFaceDetector.
   - Ultra-fast CPU inference ($\sim 15\text{ms}$).
   - Extracts 6 primary 2D landmarks (eyes, nose, mouth corners, ears).
2. **High-Accuracy Fallback**: RetinaFace (ResNet50 / MobileNet0.25).
   - High recall on profile angles and partially occluded faces.
3. **Lightweight Edge Detector**: OpenCV YuNet (ONNX format).

## Operational Rules
- Minimum face detection bounding box: $60 \times 60$ pixels. Smaller faces rejected as low-quality.
- Non-Maximum Suppression (NMS) IoU threshold: $0.40$.
- Confidence cutoff: $\ge 0.50$.

## Verification Checklist
- [ ] Bounding boxes do not clip forehead or chin regions.
- [ ] Profile faces up to $\pm 60^\circ$ yaw reliably detected without false positives on background patterns.


---

## Skill Metadata
- **Category**: AI and Computer Vision
- **Authoritative Reference**: Deng et al., RetinaFace: Single-shot Multi-level Face Localisation in the Wild (CVPR 2020)
- **License**: MIT
- **Scope**: Workspace Agent Skill (`.agents/skills/face-detection`)
