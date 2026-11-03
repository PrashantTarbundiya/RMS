---
name: privacy-engineering
description: >-
  Implement privacy-by-design, GDPR / CCPA biometric privacy compliance, consent mechanisms, and automated data retention policies.
---

# Privacy Engineering & Biometric Compliance

## Purpose & Scope
Ensures full legal compliance with international biometric data privacy laws (GDPR Art. 9, BIPA, CCPA).

## Core Privacy Controls
1. **Explicit Consent & Purpose Limitation**:
   - Biometric facial templates collected strictly for enterprise attendance and access verification.
2. **Right to Erasure (Article 17)**:
   - Deleting an employee permanently purges their raw photo samples, facial crops, and computed vector embeddings across all models.
3. **Data Retention & Expiration**:
   - Automated cleanup job archives attendance logs older than retention window (default 365 days).

## Verification Checklist
- [ ] Employee deletion endpoint scrubs all corresponding embeddings from vector indexes.
- [ ] Export personal data endpoint provides complete machine-readable audit report.


---

## Skill Metadata
- **Category**: Security and Privacy
- **Authoritative Reference**: GDPR Article 9 (Special Category Biometric Data); CCPA / CPRA Biometric Guidelines
- **License**: EU Legal Standard
- **Scope**: Workspace Agent Skill (`.agents/skills/privacy-engineering`)
