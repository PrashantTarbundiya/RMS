import os

SKILLS_DIR = os.path.abspath(".agents/skills")
os.makedirs(SKILLS_DIR, exist_ok=True)

security_skills = [
    {
        "name": "application-security",
        "description": "Audit, prevent, and remediate web application security vulnerabilities adhering to OWASP Top 10 and OWASP ASVS v4.0.3 standards.",
        "category": "Security and Privacy",
        "reference": "OWASP Top 10 (2021); OWASP Application Security Verification Standard (ASVS v4.0.3)",
        "license": "Creative Commons Attribution-ShareAlike 4.0",
        "content": r"""# Application Security & OWASP ASVS Standard

## Purpose & Scope
Enforces comprehensive application security controls across authentication, session management, access control, and data validation.

## Key Controls (ASVS Level 2 Baseline)
1. **Injection Defense (V5)**:
   - All SQL operations must use parameterized queries or SQLAlchemy ORM abstractions.
   - Command execution (`subprocess`, `os.system`) must avoid shell invocation with untrusted input.
2. **Access Control (V4)**:
   - Server-side enforcement of authorization on every API request using `@inject_org_id` and `@require_auth`.
   - Never trust client-provided tenant identifiers.
3. **Cross-Origin Resource Sharing (CORS)**:
   - Restrict allowed origins to explicit frontend domain (`FRONTEND_URL`); disallow wildcard `*` with credentials.

## Verification Checklist
- [ ] Automated Semgrep security rules pass with zero critical or high findings.
- [ ] Input validation rejects path traversal (`../`) and shell metacharacters.
"""
    },
    {
        "name": "secure-coding",
        "description": "Enforce secure coding practices in Python and JavaScript, memory safety in native CV extensions, and safe deserialization.",
        "category": "Security and Privacy",
        "reference": "SEI CERT Python & C/C++ Coding Standards; CWE Top 25 Most Dangerous Software Weaknesses",
        "license": "Public Domain",
        "content": r"""# Secure Coding Standards

## Purpose & Scope
Guides language-level defensive programming to prevent buffer overflows, unhandled exceptions, and unsafe deserialization.

## Critical Rules
1. **Safe Deserialization (CWE-502)**:
   - Never call `pickle.load()` or `pickle.loads()` on untrusted data from network requests or user uploads.
   - For internal vector indices, verify file hash or use safer formats (ONNX, JSON, Safetensors).
2. **Path Traversal Prevention (CWE-22)**:
   - Sanitize all file paths using `os.path.abspath` and verify they reside within expected base directories.
   - Reject filenames containing `..`, null bytes (`\0`), or invalid Windows characters (`:`, `*`, `?`, `<`, `>`, `|`).
3. **Native Extension Memory Bounds**:
   - Verify array shapes and types before passing NumPy arrays to OpenCV C++ extensions.

## Verification Checklist
- [ ] Code passes static analysis for dangerous function invocations (`eval`, `exec`, `pickle`).
- [ ] All file system read/write operations guarded by path boundary checks.
"""
    },
    {
        "name": "privacy-engineering",
        "description": "Implement privacy-by-design, GDPR / CCPA biometric privacy compliance, consent mechanisms, and automated data retention policies.",
        "category": "Security and Privacy",
        "reference": "GDPR Article 9 (Special Category Biometric Data); CCPA / CPRA Biometric Guidelines",
        "license": "EU Legal Standard",
        "content": r"""# Privacy Engineering & Biometric Compliance

## Purpose & Scope
Ensures full legal compliance with international biometric data privacy laws (GDPR Art. 9, BIPA, CCPA).

## Core Privacy Controls
1. **Explicit Consent & Purpose Limitation**:
   - Biometric facial templates collected strictly for enterprise attendance and access verification.
2. **Right to Erasure (Article 17)**:
   - Deleting an employee permanently purges their raw photo samples, facial crops, and computed vector embeddings across all models.
3. **Data Retention & Expiration**:
   - Automated cleanup job archives attendance logs older than retention window (default 365 days).

## Verification Checklist
- [ ] Employee deletion endpoint scrubs all corresponding embeddings from vector indexes.
- [ ] Export personal data endpoint provides complete machine-readable audit report.
"""
    },
    {
        "name": "secrets-management",
        "description": "Detect, isolate, rotate, and manage sensitive credentials, API keys, database passwords, and JWT signing secrets.",
        "category": "Security and Privacy",
        "reference": "OWASP Secrets Management Cheat Sheet; Gitleaks Secret Detection Framework",
        "license": "MIT",
        "content": r"""# Secrets Management & Credential Protection

## Purpose & Scope
Eliminates hardcoded credentials and governs secure environment variable handling.

## Secret Handling Protocol
1. **Zero Secret Tracking in Git**:
   - `.env`, `.env.local`, and credential files must be explicitly listed in `.gitignore`.
   - Never commit API keys, database passwords, or JWT secrets to repository history.
2. **Template Standards**:
   - Provide `.env.example` with dummy placeholders (e.g., `SECRET_KEY=generate_with_python_secrets`).
3. **Emergency Rotation Runbook**:
   - If a secret is exposed: immediately invalidate the old key, rotate in production environment, and record rotation in security incident log.

## Verification Checklist
- [ ] Gitleaks / secret scanner detects zero active credentials in working tree.
- [ ] Production secrets generated using cryptographically secure random generators (`secrets.token_hex(32)`).
"""
    },
    {
        "name": "dependency-auditing",
        "description": "Generate Software Bill of Materials (SBOM), audit open-source supply chain dependencies, and eliminate known CVE vulnerabilities.",
        "category": "Security and Privacy",
        "reference": "NIST SP 800-161 Cybersecurity Supply Chain Risk Management; CISA SBOM Standards",
        "license": "Public Domain",
        "content": r"""# Dependency Auditing & Supply Chain Security

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
"""
    },
    {
        "name": "threat-modeling",
        "description": "Conduct structured threat modeling using STRIDE and attack tree analysis for biometric presence and physical access control.",
        "category": "Security and Privacy",
        "reference": "Microsoft STRIDE Threat Model; Threat Modeling: Designing for Security (Adam Shostack)",
        "license": "Public Domain",
        "content": r"""# STRIDE Threat Modeling for Biometric Access Control

## Purpose & Scope
Identifies threat actors, attack vectors, and defensive mitigations across the biometric authentication lifecycle.

## STRIDE Analysis Matrix
1. **Spoofing**: Presentation attacks using photos/screens -> *Mitigation*: Multi-cue anti-spoofing + liveness detection.
2. **Tampering**: Alteration of embedding vectors in transit -> *Mitigation*: TLS 1.3 + cryptographic signature on model files.
3. **Repudiation**: Disputing attendance logs -> *Mitigation*: Tamper-evident audit log with timestamps and confidence scores.
4. **Information Disclosure**: Interception of raw camera frames -> *Mitigation*: In-memory frame processing without disk persistence.
5. **Denial of Service**: Overwhelming kiosk with bogus frames -> *Mitigation*: Client-side motion detection + server-side rate limits.
6. **Elevation of Privilege**: Bypassing role checks to promote user to org_admin -> *Mitigation*: Strict RBAC role hierarchy validation.

## Verification Checklist
- [ ] Threat model document updated whenever new external integrations or hardware interfaces are added.
- [ ] High-risk attack paths mitigated with automated test assertions.
"""
    },
    {
        "name": "biometric-data-protection",
        "description": "Architect cryptographic protections, non-invertible transforms, and secure air-gapped enclaves for facial biometric templates.",
        "category": "Security and Privacy",
        "reference": "ISO/IEC 24745 Biometric Information Protection; FIDO Biometric Architecture",
        "license": "ISO Standard",
        "content": r"""# Biometric Data Protection & Cryptographic Sovereignty

## Purpose & Scope
Guarantees irreversible protection of stored biometric feature vectors and absolute data sovereignty.

## Cryptographic Protections
1. **Non-Invertibility**:
   - Facial feature vectors (512-d embeddings) are one-way dimensional reductions from which original faces cannot be reconstructed.
2. **Encryption at Rest**:
   - Vector embeddings stored on disk encrypted using AES-256-GCM.
3. **Air-Gapped Sovereign Deployment**:
   - Full support for complete offline deployment with zero telemetry or outbound connections to third-party cloud services.

## Verification Checklist
- [ ] System operates 100% autonomously without external internet connectivity.
- [ ] Raw video frames discarded from RAM immediately after feature extraction.
"""
    }
]

for skill in security_skills:
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

print(f"Generated {len(security_skills)} Security & Privacy skills successfully.")

