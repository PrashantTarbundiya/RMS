# Active Liveness Challenge — Design Decision Document

## Decision: Available as Opt-In Strict Mode (Not Default)

**Date:** 2026-07-24  
**Status:** Decided — ready for implementation when a customer requests it.

## Background
Active liveness challenges (blink detection, head-turn prompts) provide the strongest
anti-spoofing defense by requiring the subject to perform a real-time action that a
static photo or video replay cannot reproduce. However, they introduce friction and
require camera cooperation from the subject.

## Decision

Active liveness is **available as a per-organization opt-in** configuration, NOT a
system-wide default. This is controlled by a configuration flag per org.

### Configuration
```
Organization.require_active_liveness: bool (default: false)
```

When `true`:
- The `/api/predict` endpoint, after passing all passive liveness checks, sends
  a challenge response requesting the camera to capture a specific action (blink,
  head turn left/right).
- The camera must submit a second prediction with the challenge frames.
- The system verifies the challenge was completed before confirming identity.

When `false` (default):
- Standard passive liveness checks (6 checks including CNN) are sufficient.
- No action required from the subject.

### Rationale
1. **Lobby cameras / kiosks:** Passive liveness is sufficient. Employees walking past
   a gate camera cannot stop for a blink challenge.
2. **Server rooms / restricted areas:** Active liveness provides stronger assurance
   for high-security zones where a brief delay is acceptable.
3. **Customer choice:** Enterprise customers have different security postures.
   Forcing active liveness on all deployments would reduce product appeal.

### Implementation When Needed
- Add `require_active_liveness` column to `organizations` table (Alembic migration).
- Extend `/api/predict` to return `{ "challenge_required": true, "challenge_type": "blink" }` 
  when the org has this enabled and the initial prediction passes passive checks.
- Camera firmware/app sends a follow-up request with challenge frames.
- Backend verifies challenge completion (eye aspect ratio change for blink,
  head pose angle change for turn).

### Dependencies
- Requires MediaPipe Face Mesh (468 landmarks) for eye/head tracking.
- Already available in the MediaPipe package installed in `requirements.txt`.

## Current Protection Stack (Without Active Liveness)
The passive system already provides 6 independent anti-spoofing layers:
1. Edge density (Laplacian variance) — catches blurry prints
2. Specular glare detection — catches screen glass reflections
3. Color variance analysis (HSV) — catches uniform color reproduction
4. Moiré/FFT periodicity detection — catches screen pixel grids
5. Multi-frame micro-movement — catches static photos/screens (camera path)
6. Anti-spoof CNN (MobileNetV2 binary classifier) — learned real/spoof boundary

These 6 layers, with fail-closed error handling and tightened thresholds, provide
production-grade anti-spoofing for standard deployments. Active liveness is an
additional assurance layer for customers who explicitly require it.
