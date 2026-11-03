---
name: release-validation
description: >-
  Execute production deployment readiness verification, smoke tests, database migration dry-runs, and rollback plans.
---

# Release Validation & Production Readiness Gate

## Purpose & Scope
Final gatekeeper checklist before approving any software release for customer deployment.

## Production Readiness Checklist
1. **Build Integrity**:
   - `npm run build` passes with zero errors and minified assets.
   - Python bytecode compiles cleanly without syntax warnings (`python -m compileall backend/`).
2. **Database Migrations**:
   - Alembic migrations tested in forward and rollback directions.
3. **Security Audit**:
   - Zero hardcoded credentials or uncommitted secrets in build artifacts.
   - SSL certificates and CORS headers verified.
4. **Smoke Test Run**:
   - User sign-in, camera stream activation, face scan, attendance log display, and PDF report export.

## Verification Checklist
- [ ] All 4 gatekeeper criteria explicitly signed off before release tag dispatch.
- [ ] Rollback binary or previous container tag tested and immediately deployable.


---

## Skill Metadata
- **Category**: Quality Assurance
- **Authoritative Reference**: Release It! Design and Deploy Production-Ready Software (Michael T. Nygard)
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/release-validation`)
