---
name: secrets-management
description: >-
  Detect, isolate, rotate, and manage sensitive credentials, API keys, database passwords, and JWT signing secrets.
---

# Secrets Management & Credential Protection

## Purpose & Scope
Eliminates hardcoded credentials and governs secure environment variable handling.

## Secret Handling Protocol
1. **Zero Secret Tracking in Git**:
   - `.env`, `.env.local`, and credential files must be explicitly listed in `.gitignore`.
   - Never commit API keys, database passwords, or JWT secrets to repository history.
2. **Template Standards**:
   - Provide `.env.example` with dummy placeholders (e.g., `SECRET_KEY=generate_with_python_secrets`).
3. **Emergency Rotation Runbook**:
   - If a secret is exposed: immediately invalidate the old key, rotate in production environment, and record rotation in security incident log.

## Verification Checklist
- [ ] Gitleaks / secret scanner detects zero active credentials in working tree.
- [ ] Production secrets generated using cryptographically secure random generators (`secrets.token_hex(32)`).


---

## Skill Metadata
- **Category**: Security and Privacy
- **Authoritative Reference**: OWASP Secrets Management Cheat Sheet; Gitleaks Secret Detection Framework
- **License**: MIT
- **Scope**: Workspace Agent Skill (`.agents/skills/secrets-management`)
