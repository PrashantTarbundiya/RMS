---
name: performance-testing
description: >-
  Execute load testing, stress testing, concurrency benchmarks, and resource saturation testing on API and ML servers.
---

# Performance & Stress Testing Standard

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


---

## Skill Metadata
- **Category**: Quality Assurance
- **Authoritative Reference**: Performance Testing Guidance for Web Applications (Microsoft Patterns & Practices)
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/performance-testing`)
