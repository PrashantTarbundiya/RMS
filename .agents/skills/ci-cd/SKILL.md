---
name: ci-cd
description: >-
  Construct, automate, and maintain Continuous Integration and Continuous Deployment pipelines, automated testing, and release tagging.
---

# CI/CD Pipeline & Release Automation Standard

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


---

## Skill Metadata
- **Category**: Backend and Infrastructure
- **Authoritative Reference**: Continuous Delivery (Humble & Farley); GitHub Actions Security Hardening
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/ci-cd`)
