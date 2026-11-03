---
name: regression-testing
description: >-
  Establish automated regression test suites, golden datasets, and biometric accuracy regression prevention gates.
---

# Regression Testing & Biometric Accuracy Gates

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


---

## Skill Metadata
- **Category**: Quality Assurance
- **Authoritative Reference**: Software Engineering: A Practitioner's Approach (Pressman); NIST Biometric Evaluations
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/regression-testing`)
