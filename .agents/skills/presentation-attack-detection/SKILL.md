---
name: presentation-attack-detection
description: >-
  Audit, test, and harden facial recognition systems against ISO/IEC 30107-3 Presentation Attack Detection (PAD) levels A, B, and C.
---

# Presentation Attack Detection (PAD) Framework

## Purpose & Scope
Compliance and verification procedures aligned with ISO/IEC 30107-3 international standards.

## Threat Levels Covered
- **Level A (Novice)**: Paper printouts, flat screen displays, still photos.
- **Level B (Intermediate)**: Curved video displays, paper masks with eye cutouts, latex masks.
- **Level C (Expert)**: 3D silicone human masks, deepfake real-time video injection.

## Test & Reporting Metrics
- **APCER** (Attack Presentation Classification Error Rate): Proportion of spoof attacks misclassified as bona fide.
- **BPCER** (Bona Fide Presentation Classification Error Rate): Proportion of genuine presentations misclassified as attacks.

## Verification Checklist
- [ ] Target APCER $\le 1.0\%$ at BPCER $\le 0.5\%$.
- [ ] Audit logs record presentation attack classification telemetry with bounding box snapshots.


---

## Skill Metadata
- **Category**: AI and Computer Vision
- **Authoritative Reference**: ISO/IEC 30107-3 Biometric Presentation Attack Detection — Testing and Reporting
- **License**: ISO Standard
- **Scope**: Workspace Agent Skill (`.agents/skills/presentation-attack-detection`)
