---
name: biometric-data-protection
description: >-
  Architect cryptographic protections, non-invertible transforms, and secure air-gapped enclaves for facial biometric templates.
---

# Biometric Data Protection & Cryptographic Sovereignty

## Purpose & Scope
Guarantees irreversible protection of stored biometric feature vectors and absolute data sovereignty.

## Cryptographic Protections
1. **Non-Invertibility**:
   - Facial feature vectors (512-d embeddings) are one-way dimensional reductions from which original faces cannot be reconstructed.
2. **Encryption at Rest**:
   - Vector embeddings stored on disk encrypted using AES-256-GCM.
3. **Air-Gapped Sovereign Deployment**:
   - Full support for complete offline deployment with zero telemetry or outbound connections to third-party cloud services.

## Verification Checklist
- [ ] System operates 100% autonomously without external internet connectivity.
- [ ] Raw video frames discarded from RAM immediately after feature extraction.


---

## Skill Metadata
- **Category**: Security and Privacy
- **Authoritative Reference**: ISO/IEC 24745 Biometric Information Protection; FIDO Biometric Architecture
- **License**: ISO Standard
- **Scope**: Workspace Agent Skill (`.agents/skills/biometric-data-protection`)
