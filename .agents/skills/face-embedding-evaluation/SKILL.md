---
name: face-embedding-evaluation
description: >-
  Evaluate face embedding vector spaces, calculate distance metrics (Cosine vs Euclidean L2), compute ROC curves, and calibrate decision thresholds.
---

# Face Embedding Metric Evaluation & Threshold Calibration

## Purpose & Scope
Mathematical procedures for tuning acceptance thresholds, minimizing False Acceptance Rate (FAR) and False Rejection Rate (FRR).

## Distance Metric Calibration
1. **Cosine Distance**:
   $$D_{\text{cosine}}(u, v) = 1 - \frac{u \cdot v}{\|u\|_2 \|v\|_2}$$
   - Range: $[0, 2]$. Identical faces: $\to 0$.
2. **Euclidean Distance on Normalized Vectors**:
   $$D_{\text{euclidean}}(u, v) = \sqrt{2 \cdot D_{\text{cosine}}(u, v)}$$
3. **Threshold Calibration Strategy**:
   - **Strict Mode** (High Security / Access Control): Cosine distance $\le 0.30$ (Confidence $\ge 85\%$).
   - **Balanced Mode** (Daily Enterprise Attendance): Cosine distance $\le 0.38$ (Confidence $\ge 81\%$).
   - **Open-Set Negative Rejection**: If distance to nearest neighbor $> 0.40$, classified as `Unknown`.

## Verification Checklist
- [ ] Threshold evaluated against negative open-set controls (faces not enrolled in system).
- [ ] Confidence percentage correctly maps non-linearly: $\text{Confidence} = \max(0, (1 - D / 0.40)) \times 100\%$.


---

## Skill Metadata
- **Category**: AI and Computer Vision
- **Authoritative Reference**: NIST Face Recognition Vendor Test (FRVT); ISO/IEC 19795 Biometric Performance Testing
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/face-embedding-evaluation`)
