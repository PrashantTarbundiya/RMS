---
name: model-benchmarking
description: >-
  Benchmark face recognition models on standard academic datasets (LFW, CFP-FP, AgeDB) and measure throughput (FPS), latency, and memory footprint.
---

# Model Benchmarking & Throughput Profiling

## Purpose & Scope
Establishes empirical baselines for model accuracy, hardware resource consumption, and inference latency.

## Standard Evaluation Protocols
1. **Accuracy Benchmarks**:
   - LFW (Unconstrained 1:1 verification accuracy).
   - CFP-FP (Celebrities in Frontal-Profile — assesses pose invariance).
   - AgeDB-30 (Evaluates temporal aging robustness).
2. **Hardware Profiling**:
   - Peak RAM / VRAM allocation during batch inference.
   - Per-frame throughput (Frames Per Second) on standard 4-core CPU appliances.

## Verification Checklist
- [ ] Baseline accuracy on LFW verified $\ge 99.2\%$.
- [ ] Inference time measured over 1,000 warm-up runs with standard deviation reported.
- [ ] No memory leaks detected over 24-hour continuous streaming stress tests.


---

## Skill Metadata
- **Category**: AI and Computer Vision
- **Authoritative Reference**: LFW (Labeled Faces in the Wild); NIST FRVT 1:1 Verification Benchmarks
- **License**: Public Domain
- **Scope**: Workspace Agent Skill (`.agents/skills/model-benchmarking`)
