---
name: authentication-and-authorization
description: >-
  Implement enterprise security authentication, JWT token lifecycles, bcrypt password hashing, and role-based access control (RBAC).
---

# Authentication & Authorization (RBAC) Protocol

## Purpose & Scope
Secures user authentication, session integrity, and permission enforcement across all endpoints.

## Cryptographic Standards
1. **Password Hashing**:
   - Passwords hashed using `bcrypt` with work factor $\ge 12$.
   - Never store or log plaintext passwords.
2. **JWT Lifecycle**:
   - Access Token: Short-lived (30 minutes), signed with HMAC-SHA256 (`HS256`).
   - Refresh Token: Long-lived (7 days), stored securely in HttpOnly cookies or protected storage.
3. **Role Hierarchy**:
   - `platform_owner` > `org_admin` > `manager` > `viewer` > `kiosk`.
   - Access enforcement via `@require_auth` and `@inject_org_id` decorators.

## Verification Checklist
- [ ] Unauthenticated requests to protected endpoints return 401 Unauthorized.
- [ ] Cross-tenant access attempts return 403 Forbidden.
- [ ] Tokens invalidated on logout or password change.


---

## Skill Metadata
- **Category**: Backend and Infrastructure
- **Authoritative Reference**: NIST SP 800-63B Digital Identity Guidelines; OWASP Authentication Cheat Sheet
- **License**: CC-BY-4.0
- **Scope**: Workspace Agent Skill (`.agents/skills/authentication-and-authorization`)
