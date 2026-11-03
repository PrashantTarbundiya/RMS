---
name: devops
description: >-
  Manage local development runtimes, batch scripts (dev.bat, start.bat), process supervision, and operational maintenance.
---

# DevOps & Developer Operations Standard

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


---

## Skill Metadata
- **Category**: Backend and Infrastructure
- **Authoritative Reference**: The DevOps Handbook (Kim, Humble, Debois, Willis)
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/devops`)
