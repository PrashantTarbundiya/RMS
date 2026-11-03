---
name: debugging
description: >-
  Systematic root-cause diagnosis, stack trace dissection, socket/HTTP connection tracking, and state reproduction.
---

# Systematic Debugging Protocol

## Purpose & Scope
Standardized workflow for rapidly isolating, reproducing, and fixing runtime defects without introducing secondary bugs.

## Debugging Phases
1. **Observation & Minimal Reproduction**:
   - Capture exact error code, stack trace, and execution context.
   - Formulate minimal reproducible curl request or unit test.
2. **Hypothesis Formulation**:
   - State testable hypotheses explaining the root cause.
3. **Instrument & Validate**:
   - Add structured debug logs or breakpoints at boundary conditions.
   - Verify hypothesis against runtime evidence before editing source code.
4. **Targeted Fix & Regression Test**:
   - Apply minimal surgical fix.
   - Write automated regression test asserting the failure mode is eradicated.

## Verification Checklist
- [ ] Root cause identified and explained in technical terms.
- [ ] Fix verified with actual runtime command execution.
- [ ] No unrelated files or formatting altered during debugging.


---

## Skill Metadata
- **Category**: Core Engineering
- **Authoritative Reference**: Why Programs Fail: A Guide to Systematic Debugging (Andreas Zeller)
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/debugging`)
