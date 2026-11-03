---
name: face-alignment
description: >-
  Perform 2D/3D facial landmark extraction, affine transformation, and canonical pose alignment to normalize face crops before feature extraction.
---

# Face Alignment & Canonical Pose Normalization

## Purpose & Scope
Aligns detected faces to canonical coordinates, eliminating roll and tilt distortion to optimize feature extraction.

## Operational Procedures
1. **5-Point Landmark Extraction**:
   - Left eye $(x_l, y_l)$, Right eye $(x_r, y_r)$, Nose tip $(x_n, y_n)$, Left mouth corner, Right mouth corner.
2. **Canonical Transformation Matrix**:
   - Calculate eye center midpoint: $C = \frac{E_l + E_r}{2}$.
   - Compute roll angle: $\theta = \arctan\left(\frac{y_r - y_l}{x_r - x_l}\right)$.
   - Scale factor: $s = \frac{D_{\text{target}}}{D_{\text{measured}}}$.
   - Apply affine transformation via `cv2.getRotationMatrix2D` and `cv2.warpAffine` to produce standard $112 \times 112$ crop.

## Verification Checklist
- [ ] Eye centers align horizontally at fixed vertical coordinate ($y \approx 38\%$ of image height).
- [ ] Canonical crop contains zero boundary black padding artifacts.


---

## Skill Metadata
- **Category**: AI and Computer Vision
- **Authoritative Reference**: Kazemi & Sullivan, One Millisecond Face Alignment with an Ensemble of Trees (CVPR 2014)
- **License**: BSD-3-Clause
- **Scope**: Workspace Agent Skill (`.agents/skills/face-alignment`)
