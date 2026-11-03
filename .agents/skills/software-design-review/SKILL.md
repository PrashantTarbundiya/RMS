---
name: software-design-review
description: >-
  Conduct structural software design reviews evaluating SOLID principles, coupling, cyclomatic complexity, concurrency safety, and modularity.
---

# Software Design Review Standard

## Purpose & Scope
Evaluates architectural health, code maintainability, and design patterns across frontend and backend components.

## Evaluation Dimensions
1. **Single Responsibility**: Classes and route modules must have one reason to change.
2. **Interface Segregation**: Clients should not be forced to depend upon interfaces they do not use.
3. **Concurrency Safety**: Gevent greenlets sharing memory must avoid non-thread-safe global state.
4. **Idempotence**: Critical mutating operations (attendance logging, employee creation) must support idempotency keys.

## Verification Checklist
- [ ] Functions have a cyclomatic complexity $\le 15$.
- [ ] Database access is isolated behind repository / service layers.
- [ ] React components separate presentation from asynchronous data fetching.


---

## Skill Metadata
- **Category**: Core Engineering
- **Authoritative Reference**: ISO/IEC 25010 Systems and Software Quality Requirements; Clean Architecture (Robert C. Martin)
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/software-design-review`)
