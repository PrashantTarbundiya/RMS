---
name: automated-testing
description: >-
  Architect, maintain, and execute automated unit and component testing suites using Pytest and Vitest with high test coverage.
---

# Automated Testing & Test Suite Architecture

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


---

## Skill Metadata
- **Category**: Quality Assurance
- **Authoritative Reference**: Test-Driven Development (Kent Beck); Google Testing Blog Standards
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/automated-testing`)
