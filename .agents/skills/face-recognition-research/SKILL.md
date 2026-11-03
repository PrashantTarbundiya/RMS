---
name: face-recognition-research
description: >-
  Research, benchmark, and implement state-of-the-art deep face recognition architectures including ArcFace, CosFace, MagFace, and GhostFaceNet.
---

# Face Recognition Research & Loss Architectures

## Purpose & Scope
Guides mathematical formulation and architectural evaluation of deep feature embedding extractors.

## Deep Embedding Formulations
1. **ArcFace Loss (Additive Angular Margin)**:
   $$\mathcal{L} = -\log \frac{e^{s(\cos(\theta_{y_i} + m))}}{e^{s(\cos(\theta_{y_i} + m))} + \sum_{j \neq y_i} e^{s \cos \theta_j}}$$
   - Enhances intra-class compactness and inter-class discrepancy on a hypersphere.
   - Recommended hypersphere scale: $s = 64.0$, margin: $m = 0.50$.
2. **Backbone Implementations**:
   - Primary Authoritative Model: Facenet512 (Inception-ResNet-v1, 512-d).
   - Secondary Multi-Angle Verifier: InsightFace ResNet-50 / ArcFace (512-d).
   - Lightweight Edge Model: GhostFaceNet-V2 (512-d, $\sim 15\text{MB}$).

## Verification Checklist
- [ ] Embedding vector $L_2$ norm equals $1.0$ ($\|e\|_2 = 1.0$) for cosine similarity comparability.
- [ ] Multi-model agreement requires cosine distance consensus below threshold before confirming match.


---

## Skill Metadata
- **Category**: AI and Computer Vision
- **Authoritative Reference**: Deng et al., ArcFace: Additive Angular Margin Loss for Deep Face Recognition (CVPR 2019)
- **License**: MIT
- **Scope**: Workspace Agent Skill (`.agents/skills/face-recognition-research`)
