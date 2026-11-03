---
name: dependency-auditing
description: >-
  Generate Software Bill of Materials (SBOM), audit open-source supply chain dependencies, and eliminate known CVE vulnerabilities.
---

# Dependency Auditing & Supply Chain Security

## Purpose & Scope
Monitors third-party packages in `package.json` and `requirements.txt` for known vulnerabilities and license compliance.

## Operational Procedures
1. **Python Vulnerability Auditing**:
   - Run pip vulnerability verification:
     ```bash
     pip-audit -r requirements.txt
     ```
2. **Node.js Vulnerability Auditing**:
   - Run npm audit verification:
     ```bash
     npm --prefix frontend audit
     ```
3. **License Verification**:
   - Reject packages with copyleft GPL licenses that conflict with commercial distribution (prefer MIT, Apache-2.0, BSD-3-Clause).

## Verification Checklist
- [ ] Zero Critical or High severity CVEs in direct dependencies.
- [ ] Dependency lockfiles committed to ensure reproducible, tamper-proof builds.


---

## Skill Metadata
- **Category**: Security and Privacy
- **Authoritative Reference**: NIST SP 800-161 Cybersecurity Supply Chain Risk Management; CISA SBOM Standards
- **License**: Public Domain
- **Scope**: Workspace Agent Skill (`.agents/skills/dependency-auditing`)
