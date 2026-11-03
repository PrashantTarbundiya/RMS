---
name: refactoring
description: >-
  Perform safe, step-by-step refactoring of legacy code with zero functional regression and full test coverage.
---

# Safe Refactoring Standard

## Purpose & Scope
Guides code restructuring to improve readability, maintainability, and extensibility without changing external behavior.

## Rules of Refactoring
1. **Pre-Refactor Baseline**: Ensure automated test suite is green before touching code.
2. **Micro-Steps**: Make small, incremental changes (rename symbol, extract function, inline variable).
3. **Run Tests After Every Step**: Execute unit tests immediately after each transformation.
4. **No Simultaneous Feature Work**: Never mix new feature implementation with refactoring passes.

## Verification Checklist
- [ ] All existing automated tests continue to pass.
- [ ] Public API contracts and database schemas remain 100% backward-compatible.
- [ ] Code complexity metrics show measurable reduction.


---

## Skill Metadata
- **Category**: Core Engineering
- **Authoritative Reference**: Refactoring: Improving the Design of Existing Code (Martin Fowler)
- **License**: MIT
- **Scope**: Workspace Agent Skill (`.agents/skills/refactoring`)
