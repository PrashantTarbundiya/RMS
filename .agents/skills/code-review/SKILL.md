---
name: code-review
description: >-
  Execute structured peer code reviews assessing correctness, security, performance, regression risk, test coverage, and documentation.
---

# Code Review Protocol

## Purpose & Scope
Mandatory review protocol before approving or merging code modifications into the engineering workspace.

## Review Stages
1. **Intent & Architecture**: Does the change solve the actual user problem without architectural debt?
2. **Correctness & Edge Cases**: Are null/undefined values, network timeouts, and zero-length arrays handled?
3. **Security & Data Safety**: Are credentials, personal data, or raw biometrics exposed?
4. **Performance**: Does the change introduce $O(N^2)$ loops, N+1 database queries, or UI layout thrashing?
5. **Testing**: Are automated regression tests included and passing?

## Verification Checklist
- [ ] All new functions include docstrings explaining parameters and return types.
- [ ] No commented-out dead code or orphaned debugging logs (`console.log`, `print`).
- [ ] Breaking changes are explicitly identified and backwards-compatible fallbacks provided.


---

## Skill Metadata
- **Category**: Core Engineering
- **Authoritative Reference**: Google Engineering Practices — Code Review Developer Guide
- **License**: CC-BY-4.0
- **Scope**: Workspace Agent Skill (`.agents/skills/code-review`)
