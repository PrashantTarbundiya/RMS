---
name: multi-tenant-architecture
description: >-
  Enforce strict tenant data isolation, tenant-specific model storage, vector indices, and cross-organization leak prevention.
---

# Multi-Tenant Architecture & Data Isolation

## Purpose & Scope
Guarantees absolute cryptographic, filesystem, and database isolation between independent tenant organizations.

## Isolation Boundaries
1. **Database Tier**:
   - Every multi-tenant table (`employees`, `attendance_logs`, `audit_logs`, `cameras`) includes an indexed `org_id` foreign key.
   - Queries must enforce `WHERE org_id = :current_org_id`.
2. **Storage Tier**:
   - Model weights and datasets isolated in `backend/data/orgs/<org_id>/` and `dataset_cleaned/orgs/<org_id>/`.
   - Organizations never inherit or auto-copy another tenant's vector embeddings.

## Verification Checklist
- [ ] Multi-tenant isolation verified with automated cross-tenant leak tests (`test_security_hardening.py`).
- [ ] Switching tenant JWT tokens cleanly swaps active model cache in memory.


---

## Skill Metadata
- **Category**: Backend and Infrastructure
- **Authoritative Reference**: AWS SaaS Architecture Fundamentals; Multi-Tenant Database Patterns
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/multi-tenant-architecture`)
