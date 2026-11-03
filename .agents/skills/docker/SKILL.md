---
name: docker
description: >-
  Author, optimize, harden, and orchestrate Docker multi-stage builds and Docker Compose service definitions.
---

# Docker Containerization & Hardening Standard

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


---

## Skill Metadata
- **Category**: Backend and Infrastructure
- **Authoritative Reference**: Docker Best Practices; CIS Docker Benchmark
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/docker`)
