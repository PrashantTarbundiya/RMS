---
name: face-quality-assessment
description: >-
  Assess image quality metrics including blur/sharpness, illumination, pose angles (yaw, pitch, roll), and facial occlusion.
---

# Face Quality Assessment (FQA) Standard

## Purpose & Scope
Ensures only high-quality, uncorrupted facial samples are processed for enrollment and verification.

## Quality Metrics & Thresholds
1. **Sharpness (Blur Detection)**:
   - Evaluated via variance of the Laplacian:
     $$\text{Var}(\nabla^2 I) \ge 100.0$$
   - Samples below $100.0$ are flagged as motion-blurred.
2. **Illumination Uniformity**:
   - Mean brightness on facial mask: $80 \le \mu_L \le 200$.
   - Shadow contrast ratio between left and right facial hemispheres $\le 2.5$.
3. **Head Pose Boundaries**:
   - Yaw: $\pm 35^\circ$
   - Pitch: $\pm 25^\circ$
   - Roll: $\pm 20^\circ$

## Verification Checklist
- [ ] Low-quality frames rejected early in pipeline with actionable user UI prompts ("Hold still", "Increase lighting").
- [ ] High-confidence false rejections tracked and inspected against FQA logs.


---

## Skill Metadata
- **Category**: AI and Computer Vision
- **Authoritative Reference**: ISO/IEC 29794-5 Biometric Sample Quality — Face Image Data; SER-FIQ Quality Standard
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/face-quality-assessment`)
