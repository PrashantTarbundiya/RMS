# AuraPass™ Enterprise — AI Engineering Changelog

All notable changes, tool configurations, skill additions, and architectural governance updates for the AI-native engineering environment are documented in this file.

---

## [2.1.0-AI-ENGINEERING] - 2026-11-02

### Added
- **Permanent Engineering Rules (`GEMINI.md`)**:
  - Established root-level governance codifying Rules A through I (Understand before modifying, Research before technical decisions, Plan before executing, Independent verification, No unnecessary modifications, Security-first development, Documentation, Desktop & mobile verification, Honest reporting).
- **51 Production-Grade Antigravity Agent Skills (`.agents/skills/`)**:
  - *Core Engineering* (8 skills): `project-architecture`, `codebase-exploration`, `reverse-engineering`, `software-design-review`, `code-review`, `debugging`, `refactoring`, `technical-documentation`.
  - *AI and Computer Vision* (12 skills): `machine-learning-engineering`, `computer-vision`, `face-recognition-research`, `face-embedding-evaluation`, `face-detection`, `face-alignment`, `face-quality-assessment`, `face-anti-spoofing`, `presentation-attack-detection`, `model-benchmarking`, `model-monitoring`, `ml-data-quality`.
  - *Product and Frontend* (6 skills): `ui-ux-pro-max`, `responsive-design`, `accessibility`, `frontend-performance`, `design-system`, `user-experience-review`.
  - *Backend and Infrastructure* (11 skills): `api-engineering`, `database-engineering`, `authentication-and-authorization`, `multi-tenant-architecture`, `performance-engineering`, `caching-and-redis`, `devops`, `docker`, `kubernetes`, `cloud-infrastructure`, `ci-cd`.
  - *Security and Privacy* (7 skills): `application-security`, `secure-coding`, `privacy-engineering`, `secrets-management`, `dependency-auditing`, `threat-modeling`, `biometric-data-protection`.
  - *Quality Assurance* (7 skills): `automated-testing`, `browser-testing`, `api-testing`, `integration-testing`, `regression-testing`, `performance-testing`, `release-validation`.
- **Model Context Protocol (MCP) Integrations**:
  - Integrated official Microsoft Playwright MCP (`@playwright/mcp`) running headless with strict allowed-host security boundaries (`localhost`, `127.0.0.1`, `13-60-225-165.sslip.io`).
  - Integrated Upstash Context7 MCP (`@upstash/context7-mcp`) for version-specific live documentation retrieval.
  - Preserved existing `StitchMCP` and `supabase` configurations.
- **12 Specialized Agent Personas**:
  - Registered native Antigravity subagents: `principal-architect`, `repository-investigator`, `aiml-researcher`, `cv-engineer`, `security-engineer`, `backend-engineer`, `frontend-engineer`, `uiux-designer`, `qa-engineer`, `devops-engineer`, `technical-researcher`, `documentation-engineer`.
- **Central Knowledge Base (`docs/ai-engineering/`)**:
  - Authored 12 structured engineering documents covering inventory, skills, MCP, roles, standards, security, testing, research, installation, maintenance, and changelog.

### Changed
- **Commercial SaaS Privatization**:
  - Updated application branding to **AuraPass™ Enterprise** (Autonomous Biometric Access & Presence Orchestration).
  - Cleaned fake and synthetic benchmark celebrity datasets and synthetic check-in records; restored genuine 3-person team roster (`Vatsal Vadgama`, `Shivam Petkar`, `Rakshit Gajnotar`).
- **Scroll Position Stabilization**:
  - Mounted `<ScrollToTop />` in `frontend/src/App.jsx` to eliminate page transition vertical offset bugs.

### Security & Privacy Audits
- Audited repository for hardcoded credentials. Flagged `.env.docker` default placeholder credentials for rotation prior to production deployment.
- Re-enforced strict `.gitignore` isolation for `.env` and SQLite `.db` binaries.

