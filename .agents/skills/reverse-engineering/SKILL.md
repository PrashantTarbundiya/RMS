---
name: reverse-engineering
description: >-
  Analyze compiled binary artifacts, legacy serialization formats (.pickle, .onnx, .pth), undocumented internal APIs, and network protocols.
---

# Reverse Engineering & Artifact Inspection

## Purpose & Scope
Inspects and validates opaque binary artifacts, neural network weights, vector indices, and serialized state to prevent regressions and unauthorized changes.

## Operational Procedures
1. **Serialized Pickle Inspection**:
   - Inspect dictionary keys and array dimensions safely without executing arbitrary bytecode:
     ```python
     import pickle, io
     # Inspect metadata and vector shapes
     ```
2. **ONNX Model Graph Analysis**:
   - Verify input and output tensors, data types, and node operations using `onnx.load`:
     ```python
     import onnx
     model = onnx.load("backend/models/edge/ghostnet.onnx")
     onnx.checker.check_model(model)
     print([input.name for input in model.graph.input])
     ```
3. **PyTorch Weights Inspection**:
   - Inspect state dictionaries without loading untrusted classes using `torch.load(..., weights_only=True)`.

## Verification Checklist
- [ ] No unvetted pickle files loaded from untrusted network sources.
- [ ] ONNX model tensor dimensions match expected facial input shape (e.g., `(1, 3, 112, 112)`).
- [ ] API routes match actual registered blueprint handlers in `server.py`.


---

## Skill Metadata
- **Category**: Core Engineering
- **Authoritative Reference**: Reverse Engineering for Beginners (Dennis Yurichev); ONNX Runtime Model Inspector
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/reverse-engineering`)
