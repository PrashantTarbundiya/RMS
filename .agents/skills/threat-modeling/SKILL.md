---
name: threat-modeling
description: >-
  Conduct structured threat modeling using STRIDE and attack tree analysis for biometric presence and physical access control.
---

# STRIDE Threat Modeling for Biometric Access Control

## Purpose & Scope
Identifies threat actors, attack vectors, and defensive mitigations across the biometric authentication lifecycle.

## STRIDE Analysis Matrix
1. **Spoofing**: Presentation attacks using photos/screens -> *Mitigation*: Multi-cue anti-spoofing + liveness detection.
2. **Tampering**: Alteration of embedding vectors in transit -> *Mitigation*: TLS 1.3 + cryptographic signature on model files.
3. **Repudiation**: Disputing attendance logs -> *Mitigation*: Tamper-evident audit log with timestamps and confidence scores.
4. **Information Disclosure**: Interception of raw camera frames -> *Mitigation*: In-memory frame processing without disk persistence.
5. **Denial of Service**: Overwhelming kiosk with bogus frames -> *Mitigation*: Client-side motion detection + server-side rate limits.
6. **Elevation of Privilege**: Bypassing role checks to promote user to org_admin -> *Mitigation*: Strict RBAC role hierarchy validation.

## Verification Checklist
- [ ] Threat model document updated whenever new external integrations or hardware interfaces are added.
- [ ] High-risk attack paths mitigated with automated test assertions.


---

## Skill Metadata
- **Category**: Security and Privacy
- **Authoritative Reference**: Microsoft STRIDE Threat Model; Threat Modeling: Designing for Security (Adam Shostack)
- **License**: Public Domain
- **Scope**: Workspace Agent Skill (`.agents/skills/threat-modeling`)
