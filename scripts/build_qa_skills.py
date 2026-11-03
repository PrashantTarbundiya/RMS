import os

SKILLS_DIR = os.path.abspath(".agents/skills")
os.makedirs(SKILLS_DIR, exist_ok=True)

qa_skills = [
    {
        "name": "automated-testing",
        "description": "Architect, maintain, and execute automated unit and component testing suites using Pytest and Vitest with high test coverage.",
        "category": "Quality Assurance",
        "reference": "Test-Driven Development (Kent Beck); Google Testing Blog Standards",
        "license": "Apache-2.0",
        "content": r"""# Automated Testing & Test Suite Architecture

## Purpose & Scope
Standardizes automated unit testing, test doubles, mocking, and coverage criteria across the codebase.

## Test Directory Structure
- Backend Unit & Integration Tests: `backend/tests/`
- Frontend Component Tests: `frontend/src/**/*.test.jsx`

## Testing Guidelines
1. **Isolated Environments**:
   - Tests must run independently against isolated in-memory or SQLite databases (`test_db.db`).
   - Mock heavy neural network inference during unit tests using pre-computed mock 512-d embeddings.
2. **Deterministic Assertions**:
   - Eliminate flaky time-dependent tests by freezing time (`freezegun`).

## Verification Checklist
- [ ] Backend test suite executes cleanly via `pytest` or `python backend/tests/test_*.py`.
- [ ] Code coverage $\ge 80\%$ on critical authentication and access control modules.
"""
    },
    {
        "name": "browser-testing",
        "description": "Execute automated end-to-end browser testing, DOM layout checks, and responsive viewport verification using Playwright MCP.",
        "category": "Quality Assurance",
        "reference": "Microsoft Playwright Documentation; Cross-Browser Testing Guide",
        "license": "Apache-2.0",
        "content": r"""# Browser Automation & Playwright Testing Protocol

## Purpose & Scope
Automates end-to-end user journey validation, responsive viewport checks, and DOM interaction tests.

## Playwright MCP Capabilities
- Navigate to URLs (`playwright_navigate`).
- Click, fill forms, and trigger buttons (`playwright_click`, `playwright_fill`).
- Inspect page layout bounding boxes (`playwright_evaluate`).
- Capture screenshots for visual regression verification (`playwright_screenshot`).

## Mandatory Multi-Viewport Matrix
- Mobile: $320\text{px}$, $375\text{px}$, $414\text{px}$
- Tablet: $768\text{px}$, $1024\text{px}$
- Desktop: $1280\text{px}$, $1920\text{px}$

## Verification Checklist
- [ ] All pages load without console errors or unhandled exceptions.
- [ ] No elements exceed viewport width (`document.body.scrollWidth === window.innerWidth`).
- [ ] Modal dialogs and navigation drawers open and close smoothly.
"""
    },
    {
        "name": "api-testing",
        "description": "Perform comprehensive API functional, contract, boundary, and error-handling testing using automated HTTP clients.",
        "category": "Quality Assurance",
        "reference": "Postman API Testing Best Practices; RFC 9110 HTTP Semantics",
        "license": "Apache-2.0",
        "content": r"""# API Testing & Contract Verification Standard

## Purpose & Scope
Validates RESTful API endpoints for functional correctness, schema conformity, and boundary resilience.

## Test Categories
1. **Happy Path**: Valid credentials and payloads return expected 200/201 responses.
2. **Authentication & Authorization**: Missing/invalid/expired tokens return 401/403.
3. **Malformed Inputs**: Missing required fields, invalid datatypes, and oversized payloads return 400 Bad Request.
4. **Boundary Testing**: Maximum length strings, special characters, and boundary dates.

## Verification Checklist
- [ ] Automated script exercises all public and protected API routes.
- [ ] Error response JSON matches RFC 7807 specification.
"""
    },
    {
        "name": "integration-testing",
        "description": "Validate cross-component integrations between frontend WebRTC feeds, WebSocket events, ML inference engines, and database state.",
        "category": "Quality Assurance",
        "reference": "Integration Testing from the Trenches; Martin Fowler Integration Test Guide",
        "license": "CC-BY-SA-4.0",
        "content": r"""# End-to-End Integration Testing Protocol

## Purpose & Scope
Validates end-to-end data flow from camera feed capture to real-time face recognition and attendance record persistence.

## Key Integration Flows
1. **Kiosk Attendance Flow**:
   - Video Frame Captured -> Client Emits `process_frame` -> Server Detects Face -> Extracts 512-d Embedding -> Matches Identity -> Emits `attendance_confirmed` -> Record Inserted in SQLite/PostgreSQL -> Live Attendance Table Updates.
2. **Offline-to-Online Sync**:
   - Verify attendance scans recorded during network outage sync cleanly upon reconnection.

## Verification Checklist
- [ ] Full kiosk attendance flow completes within $< 200\text{ms}$.
- [ ] Database record verifies accurate employee ID, timestamp, and confidence score.
"""
    },
    {
        "name": "regression-testing",
        "description": "Establish automated regression test suites, golden datasets, and biometric accuracy regression prevention gates.",
        "category": "Quality Assurance",
        "reference": "Software Engineering: A Practitioner's Approach (Pressman); NIST Biometric Evaluations",
        "license": "Apache-2.0",
        "content": r"""# Regression Testing & Biometric Accuracy Gates

## Purpose & Scope
Guarantees that new code changes, model updates, or refactoring passes never degrade previously verified accuracy or functionality.

## Golden Benchmark Dataset
- Maintain curated test set of 50 verified employee images under varied conditions.
- Any model weight update must achieve:
  - True Positive Rate: $\ge 98.0\%$
  - False Acceptance Rate on Open-Set Negatives: $0.0\%$ (zero false accepts).

## Verification Checklist
- [ ] Regression suite executed before tagging any release.
- [ ] Zero regressions in recognition confidence scores.
"""
    },
    {
        "name": "performance-testing",
        "description": "Execute load testing, stress testing, concurrency benchmarks, and resource saturation testing on API and ML servers.",
        "category": "Quality Assurance",
        "reference": "Performance Testing Guidance for Web Applications (Microsoft Patterns & Practices)",
        "license": "Apache-2.0",
        "content": r"""# Performance & Stress Testing Standard

## Purpose & Scope
Simulates peak morning attendance arrival surges and validates system stability under sustained maximum load.

## Test Scenarios
1. **Morning Rush Hour Simulation**:
   - 50 concurrent kiosk camera streams submitting 2 frames/second for 10 continuous minutes.
   - Target: 0 dropped frames, server CPU $\le 85\%$, RAM stable with zero memory leaks.
2. **Database Connection Saturation**:
   - Simulate 100 simultaneous report generation requests.

## Verification Checklist
- [ ] Server recovers gracefully after peak load without requiring manual restart.
- [ ] Response latency does not degrade by more than $25\%$ during stress peaks.
"""
    },
    {
        "name": "release-validation",
        "description": "Execute production deployment readiness verification, smoke tests, database migration dry-runs, and rollback plans.",
        "category": "Quality Assurance",
        "reference": "Release It! Design and Deploy Production-Ready Software (Michael T. Nygard)",
        "license": "Apache-2.0",
        "content": r"""# Release Validation & Production Readiness Gate

## Purpose & Scope
Final gatekeeper checklist before approving any software release for customer deployment.

## Production Readiness Checklist
1. **Build Integrity**:
   - `npm run build` passes with zero errors and minified assets.
   - Python bytecode compiles cleanly without syntax warnings (`python -m compileall backend/`).
2. **Database Migrations**:
   - Alembic migrations tested in forward and rollback directions.
3. **Security Audit**:
   - Zero hardcoded credentials or uncommitted secrets in build artifacts.
   - SSL certificates and CORS headers verified.
4. **Smoke Test Run**:
   - User sign-in, camera stream activation, face scan, attendance log display, and PDF report export.

## Verification Checklist
- [ ] All 4 gatekeeper criteria explicitly signed off before release tag dispatch.
- [ ] Rollback binary or previous container tag tested and immediately deployable.
"""
    }
]

for skill in qa_skills:
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

print(f"Generated {len(qa_skills)} Quality Assurance skills successfully.")

