---
name: application-security
description: >-
  Audit, prevent, and remediate web application security vulnerabilities adhering to OWASP Top 10 and OWASP ASVS v4.0.3 standards.
---

# Application Security & OWASP ASVS Standard

## Purpose & Scope
Enforces comprehensive application security controls across authentication, session management, access control, and data validation.

## Key Controls (ASVS Level 2 Baseline)
1. **Injection Defense (V5)**:
   - All SQL operations must use parameterized queries or SQLAlchemy ORM abstractions.
   - Command execution (`subprocess`, `os.system`) must avoid shell invocation with untrusted input.
2. **Access Control (V4)**:
   - Server-side enforcement of authorization on every API request using `@inject_org_id` and `@require_auth`.
   - Never trust client-provided tenant identifiers.
3. **Cross-Origin Resource Sharing (CORS)**:
   - Restrict allowed origins to explicit frontend domain (`FRONTEND_URL`); disallow wildcard `*` with credentials.

## Verification Checklist
- [ ] Automated Semgrep security rules pass with zero critical or high findings.
- [ ] Input validation rejects path traversal (`../`) and shell metacharacters.


---

## Skill Metadata
- **Category**: Security and Privacy
- **Authoritative Reference**: OWASP Top 10 (2021); OWASP Application Security Verification Standard (ASVS v4.0.3)
- **License**: Creative Commons Attribution-ShareAlike 4.0
- **Scope**: Workspace Agent Skill (`.agents/skills/application-security`)
