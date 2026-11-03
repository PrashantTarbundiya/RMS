---
name: machine-learning-engineering
description: >-
  Architect, train, evaluate, optimize, and package machine learning pipelines and deep neural network models for face verification and feature extraction.
---

# Machine Learning Engineering Protocol

## Purpose & Scope
Governs ML model selection, quantization, export, and inference lifecycle in AuraPass Enterprise.

## Technical Standards
1. **Model Serialization**:
   - Primary: ONNX format for cross-platform portability.
   - Secondary: PyTorch state dicts (`.pth`) with explicit architecture definitions.
   - Vector Indices: Scikit-learn NearestNeighbors or FAISS L2/Cosine index.
2. **Quantization & Acceleration**:
   - Quantize fp32 models to dynamic int8 for CPU edge inference (reducing memory by ~70%).
   - DirectML / CUDA execution providers enabled conditionally based on hardware acceleration.
3. **Inference Latency Targets**:
   - Face Detection: $\le 25\text{ms}$ on CPU.
   - Landmark Alignment: $\le 10\text{ms}$.
   - Feature Embedding: $\le 65\text{ms}$ (Facenet512 / GhostFaceNet).
   - Total Pipeline per Frame: $\le 120\text{ms}$.

## Verification Checklist
- [ ] Exported ONNX graph passes validation with `onnx.checker.check_model()`.
- [ ] Model weights do not exceed edge deployment budget ($\le 50\text{MB}$).
- [ ] Precision / Recall evaluated against standard benchmarks prior to production deployment.


---

## Skill Metadata
- **Category**: AI and Computer Vision
- **Authoritative Reference**: Deep Learning (Goodfellow, Bengio, Courville); ONNX Runtime Standards
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/machine-learning-engineering`)
