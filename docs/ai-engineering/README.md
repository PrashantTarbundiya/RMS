# AuraPass™ Enterprise — AI-Native Engineering Environment

Welcome to the **AuraPass™ Enterprise AI-Native Engineering Environment**. This directory (`docs/ai-engineering/`) serves as the central knowledge base, architectural specification, and governance hub for automated, semi-automated, and pair-programming engineering workflows within Google Antigravity.

---

## 1. System Vision & Architecture
AuraPass Enterprise is a commercial SaaS and on-premise biometric access control and smart attendance management platform. It combines:
- **Client Tier**: Modern React 19 Single Page Application with Tailwind CSS, Radix UI primitives, WebRTC camera streaming, and progressive web application (PWA) capabilities.
- **Server Tier**: Flask 3.1 + Gevent WSGI high-concurrency micro-framework delivering RESTful endpoints and real-time WebSocket attendance broadcasts.
- **Biometric Core**: Multi-backbone face recognition architecture utilizing Inception-ResNet Facenet512, InsightFace ArcFace, and GhostFaceNet ONNX edge extractors paired with multi-cue anti-spoofing liveness verification.
- **Storage Tier**: Dual-mode storage engine supporting zero-configuration air-gapped sovereign SQLite (`backend/data/rms.db`) and enterprise multi-tenant PostgreSQL (Supabase / RDS).

---

## 2. Directory Navigation & Knowledge Base Index

| Document | Description | Primary Audience |
| :--- | :--- | :--- |
| [**`TOOLKIT_INVENTORY.md`**](./TOOLKIT_INVENTORY.md) | Exhaustive catalog of tools, libraries, licenses, and scopes. | Architects & DevSecOps |
| [**`INSTALLED_SKILLS.md`**](./INSTALLED_SKILLS.md) | Index of all 51 installed Antigravity agent skills across 6 categories. | AI Agents & Engineers |
| [**`MCP_INTEGRATIONS.md`**](./MCP_INTEGRATIONS.md) | Model Context Protocol servers (Playwright, Context7, Stitch). | Agents & Integrators |
| [**`AGENT_ROLES.md`**](./AGENT_ROLES.md) | 12 specialized engineering agent persona definitions & protocols. | Subagents & Leads |
| [**`ENGINEERING_STANDARDS.md`**](./ENGINEERING_STANDARDS.md) | Coding conventions, AST analysis, and architecture boundaries. | All Engineers |
| [**`SECURITY_RULES.md`**](./SECURITY_RULES.md) | DevSecOps security baseline, ASVS Level 2, and biometric privacy. | Security Auditors |
| [**`TESTING_STANDARDS.md`**](./TESTING_STANDARDS.md) | Automated testing, Playwright multi-viewport matrix, regression gates. | QA Engineers |
| [**`RESEARCH_STANDARDS.md`**](./RESEARCH_STANDARDS.md) | Mathematical loss functions, distance threshold calibration, benchmarks. | ML/CV Researchers |
| [**`TOOL_INSTALLATION_GUIDE.md`**](./TOOL_INSTALLATION_GUIDE.md) | Step-by-step verification and installation runbooks. | DevOps & Developers |
| [**`MAINTENANCE_GUIDE.md`**](./MAINTENANCE_GUIDE.md) | Day-2 operations, log rotation, cache management, health checks. | Site Reliability Engineers |
| [**`CHANGELOG.md`**](./CHANGELOG.md) | Audit trail of all AI engineering infrastructure updates. | Engineering Management |

---

## 3. Core Governance: The 9 Permanent Engineering Rules
All agentic workflows and human engineers operating in this workspace must adhere strictly to the rules codified in the repository root [`GEMINI.md`](../../GEMINI.md):
- **Rule A**: Understand Before Modifying
- **Rule B**: Research Before Technical Decisions
- **Rule C**: Plan Before Executing
- **Rule D**: Independent Verification
- **Rule E**: No Unnecessary Modifications
- **Rule F**: Security-First Development & Biometric Protection
- **Rule G**: Documentation Integrity
- **Rule H**: Desktop and Mobile Verification
- **Rule I**: Honest & Objective Reporting

