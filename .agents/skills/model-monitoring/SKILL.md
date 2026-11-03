---
name: model-monitoring
description: >-
  Monitor production model behavior, detect embedding drift, track unknown face clusters, and aggregate operational telemetry.
---

# Model Monitoring & Telemetry Standard

## Purpose & Scope
Continuous observability of machine learning model performance in production deployments.

## Monitored Indicators
1. **Confidence Distribution Drift**:
   - Track 7-day rolling median of match confidence scores. A drop below $82\%$ indicates sensor degradation, lens smudging, or lighting changes.
2. **False Rejection Spike Detection**:
   - Monitor ratio of `Unknown` classifications during peak shift arrival hours ($8:30 - 9:30\text{ AM}$).
3. **Edge Disconnect & Latency Telemetry**:
   - Track round-trip WebSocket recognition latency.

## Verification Checklist
- [ ] Telemetry events recorded in `audit_logs` without storing unencrypted raw biometrics.
- [ ] Alerts triggered automatically when confidence drop exceeds $2\sigma$ historical standard deviation.


---

## Skill Metadata
- **Category**: AI and Computer Vision
- **Authoritative Reference**: Sculley et al., Hidden Technical Debt in Machine Learning Systems (NeurIPS)
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/model-monitoring`)
