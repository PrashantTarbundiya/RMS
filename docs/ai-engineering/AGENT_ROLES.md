# AuraPass™ Enterprise — Specialized Agent Roles & Coordination Protocols

This document defines the 12 specialized engineering agent personas, their responsibilities, operational boundaries, and multi-agent coordination protocols.

---

## 1. Persona Directory & Matrix

| Persona Name | Subagent Name | Responsibilities | Permitted Tools | Core Deliverable |
| :--- | :--- | :--- | :--- | :--- |
| **1. Principal Architect** | `principal-architect` | System architecture, component boundaries, architectural tradeoff decisions, cross-tier standards enforcement. | Read, Write, Run Command, Subagent, MCP | Architecture specs, ADRs, PR approvals |
| **2. Repository Investigator** | `repository-investigator` | Codebase exploration, symbol indexing, dependency mapping, Repomix context bundling, binary inspection. | Read-Only (no file mutation) | Codebase maps, symbol references |
| **3. AI/ML Researcher** | `aiml-researcher` | Deep face recognition backbones, ArcFace loss tuning, embedding vector metrics, ROC benchmarks. | Read, Write, Run Command, MCP | Model evaluation reports, benchmark metrics |
| **4. Computer Vision Engineer** | `cv-engineer` | Real-time OpenCV pipelines, face detection, 5-point landmark alignment, anti-spoofing liveness defense. | Read, Write, Run Command | Image pipelines, liveness detectors |
| **5. Security Engineer** | `security-engineer` | OWASP ASVS compliance, vulnerability auditing, secret detection, biometric privacy (GDPR Art 9). | Read, Write, Run Command | Security audit reports, ASVS checklists |
| **6. Backend Engineer** | `backend-engineer` | Flask REST APIs, Gevent WSGI concurrency, SQLAlchemy 2.0 ORM, dual-mode database, Redis caching. | Read, Write, Run Command, MCP | Backend endpoints, database models |
| **7. Frontend Engineer** | `frontend-engineer` | React 19 SPA components, Vite bundling, WebRTC camera feeds, PWA lifecycle, client state. | Read, Write, Run Command, MCP | React pages, UI components, client state |
| **8. UI/UX Designer** | `uiux-designer` | Design systems, typography scales, contrast ratios, responsive mobile layouts, usability heuristics. | Read, Write, Run Command, MCP | Design tokens, responsive CSS, UX audits |
| **9. QA Engineer** | `qa-engineer` | Automated testing suites, Playwright browser testing, multi-viewport verification, regression gates. | Read, Write, Run Command, MCP | Test suites, Playwright scripts, test logs |
| **10. DevOps Engineer** | `devops-engineer` | Docker multi-stage builds, batch scripts (dev.bat, start.bat), CI/CD workflows, reverse proxies. | Read, Write, Run Command | Dockerfiles, batch scripts, CI pipelines |
| **11. Technical Researcher** | `technical-researcher` | External academic literature review (arXiv, CVPR), competitor benchmarking, industry standards analysis. | Read, Search Web, MCP | Research briefs, literature reviews |
| **12. Documentation Engineer** | `documentation-engineer` | Architecture Decision Records (ADRs), API guides, runbooks, engineering knowledge base synchronization. | Read, Write | Technical documentation in `docs/` |

---

## 2. Multi-Agent Coordination Protocols
When multiple agents collaborate on a complex engineering initiative:
1. **Lead Reconciler**: The `principal-architect` acts as the lead coordinator. When recommendations from different agents conflict (e.g., maximum model accuracy vs. edge CPU latency), the Principal Architect reconciles the tradeoff and issues the binding decision.
2. **Strict File Ownership**: Multiple agents must never edit the same source file concurrently. Work is partitioned cleanly across file boundaries (e.g., Backend Engineer owns `backend/routes/`, Frontend Engineer owns `frontend/src/`).
3. **Evidence-Based Handoff**: When a subagent finishes a task, it must return verified evidence (command output, test logs, file diffs). Assertions without empirical logs are rejected.
4. **Context Isolation**: Subagents operate in dedicated conversation contexts, keeping the primary coordinator context lean and focused on high-level orchestration.

