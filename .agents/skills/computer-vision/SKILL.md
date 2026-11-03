---
name: computer-vision
description: >-
  Apply digital image processing, illumination normalization, color space transformations, CLAHE, and geometric corrections to facial images.
---

# Computer Vision Pipeline Standard

## Purpose & Scope
Standardizes low-level image processing, lighting compensation, and geometric normalization across camera input streams.

## Operational Procedures
1. **Preprocessing Pipeline**:
   - BGR to RGB conversion.
   - Bilateral filtering or Gaussian blur to suppress camera sensor noise without eroding edges.
   - Contrast Limited Adaptive Histogram Equalization (CLAHE) on the L-channel in LAB color space:
     ```python
     lab = cv2.cvtColor(crop, cv2.COLOR_RGB2LAB)
     l, a, b = cv2.split(lab)
     clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
     cl = clahe.apply(l)
     normalized = cv2.cvtColor(cv2.merge((cl, a, b)), cv2.COLOR_LAB2RGB)
     ```
2. **Aspect Ratio Preservation**:
   - Pad letterboxing to $112 \times 112$ or $160 \times 160$ without non-uniform stretching or distortion.

## Verification Checklist
- [ ] Color channel ordering is consistently RGB before passing to neural networks.
- [ ] Illumination normalization preserves facial feature landmarks.
- [ ] Cropped bounding boxes include appropriate contextual padding ($15-20\%$).


---

## Skill Metadata
- **Category**: AI and Computer Vision
- **Authoritative Reference**: Digital Image Processing (Gonzalez & Woods); OpenCV 4.x Vision Pipeline
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/computer-vision`)
