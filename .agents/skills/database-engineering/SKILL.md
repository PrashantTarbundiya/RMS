---
name: database-engineering
description: >-
  Architect, optimize, and manage relational database schemas, SQLAlchemy 2.0 ORM models, migrations with Alembic, and connection pools.
---

# Database Engineering & SQLAlchemy 2.0 Standard

## Purpose & Scope
Maintains schema integrity, query performance, and dual-mode compatibility across local SQLite and cloud PostgreSQL.

## Dual-Mode Architecture
- **Local Sovereign Mode**: SQLite (`sqlite:///backend/data/rms.db`) with `check_same_thread=False` and WAL mode enabled.
- **Enterprise Cloud Mode**: PostgreSQL 15+ (Supabase / RDS) with session pooling, pre-ping connection validation, and SSL encryption.

## ORM Conventions
1. **Explicit Session Scoping**:
   ```python
   with get_db_session() as session:
       results = session.query(Employee).filter(Employee.org_id == org_id).all()
   ```
2. **Indexing Strategy**:
   - B-tree indices on `(org_id, checkin_time)` for fast attendance log filtering.
   - Unique constraints on `(org_id, employee_code)`.

## Verification Checklist
- [ ] Migrations authored cleanly via `alembic revision --autogenerate`.
- [ ] Zero connection pool leaks; all sessions closed upon request teardown.
- [ ] Raw SQL queries parameterized to eliminate SQL injection vulnerabilities.


---

## Skill Metadata
- **Category**: Backend and Infrastructure
- **Authoritative Reference**: SQLAlchemy 2.0 Unified Tutorial; PostgreSQL High Performance (Smith & Rigau)
- **License**: MIT
- **Scope**: Workspace Agent Skill (`.agents/skills/database-engineering`)
