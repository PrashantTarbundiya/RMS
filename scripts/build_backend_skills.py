import os

SKILLS_DIR = os.path.abspath(".agents/skills")
os.makedirs(SKILLS_DIR, exist_ok=True)

backend_skills = [
    {
        "name": "api-engineering",
        "description": "Design, document, implement, and version RESTful APIs and real-time WebSocket endpoints in Flask and Gevent.",
        "category": "Backend and Infrastructure",
        "reference": "OpenAPI Specification 3.1; RESTful Web APIs (Richardson & Ruby)",
        "license": "Apache-2.0",
        "content": r"""# API Engineering & WebSocket Protocol Standard

## Purpose & Scope
Governs RESTful API design, HTTP status codes, error payload schemas, and WebSocket streaming event architectures.

## API Standards
1. **Response Envelope**:
   - Success: Direct JSON entity or list with pagination metadata:
     `{"items": [...], "total": 100, "page": 1, "limit": 25}`
   - Error: Standard RFC 7807 compliant error format:
     `{"error": "Invalid email or password", "code": "AUTH_INVALID_CREDENTIALS", "status": 401}`
2. **HTTP Verb Conventions**:
   - `GET`: Safe, idempotent data retrieval.
   - `POST`: Non-idempotent resource creation.
   - `PUT`: Full resource replacement.
   - `PATCH`: Partial resource mutation.
   - `DELETE`: Resource removal.
3. **Rate Limiting**:
   - Protected endpoints guarded via `Flask-Limiter` (`100 per minute` per IP, `10 per minute` on login).

## Verification Checklist
- [ ] Endpoints validate input schemas before invoking services.
- [ ] Appropriate HTTP status codes used (200, 201, 400, 401, 403, 404, 409, 429, 500).
- [ ] WebSocket connections gracefully handle reconnection and ping/pong heartbeats.
"""
    },
    {
        "name": "database-engineering",
        "description": "Architect, optimize, and manage relational database schemas, SQLAlchemy 2.0 ORM models, migrations with Alembic, and connection pools.",
        "category": "Backend and Infrastructure",
        "reference": "SQLAlchemy 2.0 Unified Tutorial; PostgreSQL High Performance (Smith & Rigau)",
        "license": "MIT",
        "content": r"""# Database Engineering & SQLAlchemy 2.0 Standard

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
"""
    },
    {
        "name": "authentication-and-authorization",
        "description": "Implement enterprise security authentication, JWT token lifecycles, bcrypt password hashing, and role-based access control (RBAC).",
        "category": "Backend and Infrastructure",
        "reference": "NIST SP 800-63B Digital Identity Guidelines; OWASP Authentication Cheat Sheet",
        "license": "CC-BY-4.0",
        "content": r"""# Authentication & Authorization (RBAC) Protocol

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
"""
    },
    {
        "name": "multi-tenant-architecture",
        "description": "Enforce strict tenant data isolation, tenant-specific model storage, vector indices, and cross-organization leak prevention.",
        "category": "Backend and Infrastructure",
        "reference": "AWS SaaS Architecture Fundamentals; Multi-Tenant Database Patterns",
        "license": "Apache-2.0",
        "content": r"""# Multi-Tenant Architecture & Data Isolation

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
"""
    },
    {
        "name": "performance-engineering",
        "description": "Profile, benchmark, and optimize backend throughput, Gevent concurrency, worker thread pools, and database query latency.",
        "category": "Backend and Infrastructure",
        "reference": "Systems Performance: Enterprise and the Cloud (Brendan Gregg)",
        "license": "Apache-2.0",
        "content": r"""# Backend Performance & Concurrency Engineering

## Purpose & Scope
Maximizes server throughput and responsiveness under heavy concurrent attendance scan loads.

## Gevent Concurrency Model
- Gevent greenlets provide lightweight cooperative multitasking for I/O operations.
- Long-running CPU-bound tasks (deep model training, batch embedding extraction) must be offloaded to Celery background workers to avoid starving the WSGI event loop.

## Target SLA & Latency Metrics
- `/api/ping`: $\le 5\text{ms}$ (P99)
- `/api/dashboard`: $\le 50\text{ms}$ (P95)
- `/api/attendance`: $\le 35\text{ms}$ (P95)
- Real-time Face Verification: $\le 150\text{ms}$ (P95)

## Verification Checklist
- [ ] Database queries executed in under $10\text{ms}$ with zero table scans on indexed columns.
- [ ] Load testing with 100 concurrent clients shows zero dropped connections.
"""
    },
    {
        "name": "caching-and-redis",
        "description": "Design and manage caching layers, Redis key structures, cache invalidation protocols, and Celery task broker pipelines.",
        "category": "Backend and Infrastructure",
        "reference": "Redis Design Patterns; Celery User Guide Architecture",
        "license": "BSD-3-Clause",
        "content": r"""# Caching & Redis Integration Standard

## Purpose & Scope
Accelerates frequent read operations and manages distributed task queues using Redis.

## Cache Strategy
1. **Key Naming Convention**:
   `aurapass:{org_id}:{resource}:{id}`
   Example: `aurapass:f549fd90:employee:emp-0001`
2. **TTL Policies**:
   - Dashboard Stats: TTL = 60 seconds (with event-driven cache bust on new checkin).
   - Enrolled Roster: TTL = 300 seconds.
   - User Session: TTL = 1800 seconds.
3. **Cache Invalidation**:
   - Invalidate tenant cache immediately upon employee enrollment, deletion, or photo upload.

## Verification Checklist
- [ ] Redis cache hit ratio $\ge 85\%$ for read-heavy endpoints.
- [ ] Stale cache successfully purged upon tenant updates.
"""
    },
    {
        "name": "devops",
        "description": "Manage local development runtimes, batch scripts (dev.bat, start.bat), process supervision, and operational maintenance.",
        "category": "Backend and Infrastructure",
        "reference": "The DevOps Handbook (Kim, Humble, Debois, Willis)",
        "license": "Apache-2.0",
        "content": r"""# DevOps & Developer Operations Standard

## Purpose & Scope
Streamlines local developer onboarding, script automation, and continuous environment health.

## Standard Development Workflows
1. **One-Command Developer Start (`dev.bat`)**:
   - Launches Flask backend in Python venv (port 5000).
   - Launches Vite development server (port 5173).
2. **Production Startup (`start.bat`)**:
   - Executes Gevent WSGI server bound to `0.0.0.0:5000`.
   - Serves pre-built Vite assets from `frontend/dist/`.

## Verification Checklist
- [ ] Clean environment startup with zero manual configuration steps required.
- [ ] Graceful termination handling with SIGINT / SIGTERM cleanup.
"""
    },
    {
        "name": "docker",
        "description": "Author, optimize, harden, and orchestrate Docker multi-stage builds and Docker Compose service definitions.",
        "category": "Backend and Infrastructure",
        "reference": "Docker Best Practices; CIS Docker Benchmark",
        "license": "Apache-2.0",
        "content": r"""# Docker Containerization & Hardening Standard

## Purpose & Scope
Defines container build standards, layer caching, non-root execution, and multi-service orchestration.

## Docker Architecture in AuraPass
1. **Multi-Stage Builds**:
   - Stage 1 (`node:20-alpine`): Compile React Vite frontend into static bundle.
   - Stage 2 (`python:3.10-slim`): Install backend dependencies and copy static assets.
2. **Security Hardening**:
   - Run container as non-root user (`USER appuser`).
   - Read-only root filesystem where feasible.
   - Mount volumes for persistent model weights (`/app/backend/data`).

## Verification Checklist
- [ ] Docker image scans show zero Critical or High severity CVEs.
- [ ] Docker compose up executes cleanly with healthy service status.
"""
    },
    {
        "name": "kubernetes",
        "description": "Design and validate Kubernetes manifests, Pod specifications, PersistentVolumeClaims, and rolling deployment strategies.",
        "category": "Backend and Infrastructure",
        "reference": "Kubernetes Documentation; CNCF Cloud Native Security Whitepaper",
        "license": "Apache-2.0",
        "content": r"""# Kubernetes Cloud-Native Deployment Standard

## Purpose & Scope
Specifies container orchestration, horizontal scaling, and persistent storage management in Kubernetes clusters.

## Manifest Architecture
1. **Deployments & Pod Specs**:
   - Configured with liveness (`/api/ping`) and readiness probes (`/api/dashboard`).
   - Resource requests and limits defined (CPU: 500m request, 2000m limit; RAM: 1Gi request, 4Gi limit).
2. **Persistent Storage (PVC)**:
   - ReadWriteMany (RWX) volume for shared model weight storage across inference pods.

## Verification Checklist
- [ ] Pods terminate gracefully within `terminationGracePeriodSeconds` (30s).
- [ ] Zero downtime achieved during rolling updates.
"""
    },
    {
        "name": "cloud-infrastructure",
        "description": "Architect and secure cloud hosting environments (AWS, Render), reverse proxies, SSL/TLS certificates, and DNS routing.",
        "category": "Backend and Infrastructure",
        "reference": "AWS Well-Architected Framework; Mozilla SSL Configuration Generator",
        "license": "Apache-2.0",
        "content": r"""# Cloud Infrastructure & Network Security Standard

## Purpose & Scope
Governs cloud server provisioning, SSL/TLS termination, reverse proxying, and DNS configuration.

## Cloud Security Baseline
1. **TLS / HTTPS Enforcement**:
   - Minimum TLS version: 1.2, recommended TLS 1.3.
   - HSTS (HTTP Strict Transport Security) enabled with `max-age=31536000`.
2. **Reverse Proxy Configuration (Nginx / Caddy)**:
   - Proxy WebSocket upgrade headers (`Upgrade $http_upgrade`, `Connection "upgrade"`).
   - Restrict administrative endpoints via IP allowlisting or VPN.

## Verification Checklist
- [ ] SSL Labs rating of A+ on public endpoints.
- [ ] All HTTP traffic automatically redirects to HTTPS.
"""
    },
    {
        "name": "ci-cd",
        "description": "Construct, automate, and maintain Continuous Integration and Continuous Deployment pipelines, automated testing, and release tagging.",
        "category": "Backend and Infrastructure",
        "reference": "Continuous Delivery (Humble & Farley); GitHub Actions Security Hardening",
        "license": "Apache-2.0",
        "content": r"""# CI/CD Pipeline & Release Automation Standard

## Purpose & Scope
Automates quality gates, static security scans, unit test suites, and zero-downtime deployment dispatch.

## Pipeline Stages
1. **Lint & Static Analysis**: ESLint, Flake8, and Semgrep scans.
2. **Automated Testing**: Pytest test suite and Vitest frontend suite.
3. **Security Audit**: Dependency vulnerability auditing (`pip-audit`, `npm audit`).
4. **Build & Package**: Docker image build and release artifact signing.

## Verification Checklist
- [ ] Pipeline aborts immediately on any failing test or high-severity security finding.
- [ ] Release artifacts tagged with semantic versioning (`v2.1.0`).
"""
    }
]

for skill in backend_skills:
    s_dir = os.path.join(SKILLS_DIR, skill["name"])
    os.makedirs(s_dir, exist_ok=True)
    skill_md = os.path.join(s_dir, "SKILL.md")
    content = f"""---
name: {skill["name"]}
description: >-
  {skill["description"]}
---

{skill["content"]}

---

## Skill Metadata
- **Category**: {skill["category"]}
- **Authoritative Reference**: {skill["reference"]}
- **License**: {skill["license"]}
- **Scope**: Workspace Agent Skill (`.agents/skills/{skill["name"]}`)
"""
    with open(skill_md, "w", encoding="utf-8") as f:
        f.write(content)

print(f"Generated {len(backend_skills)} Backend & Infrastructure skills successfully.")

