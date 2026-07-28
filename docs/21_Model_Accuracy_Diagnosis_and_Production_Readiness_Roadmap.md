# 21 Model Accuracy Diagnosis & Production Readiness — Phased Agent Roadmap

**Where this picks up:** Your own codebase audit shows 37/48 items from `20_Production_Hardening_and_Feature_Roadmap.md` are genuinely code-complete. This roadmap does three things, in order: (1) diagnose and fix the active misidentification bug — this is a correctness regression, not a backlog item, so it goes first; (2) finish the 11 items your audit marked "code exists but not tested"; (3) the actual next transformation toward a sellable product, which — now that features are largely done — is validation, observability, and go-to-market readiness, not more features.

**Scope lock (unchanged from the last roadmap):** functional/backend work only, no visual redesign, reuse existing architecture and naming conventions exactly (`middleware.py`, `org_storage.py`, `database/models.py`, existing role hierarchy). No parallel systems.

---

## Model Tier Guide for This Roadmap

Claude models (Sonnet 4.6, Opus 4.6) and GPT-OSS 120B are currently showing a token-limit warning in your Antigravity account — unavailable until that resets. Use this mapping for now, and re-read the note at the end.

| Phase | Recommended tier (Claude unavailable) | If Claude becomes available again |
|---|---|---|
| 0 — Accuracy Diagnosis | **Gemini 3.1 Pro (High)** — this is a reasoning/root-cause task, use your strongest available tier | Switch to **Claude Opus 4.6 (Thinking)** — highest priority to reserve for this one |
| 1 — Update System validation | Gemini 3.6 Flash (High) | No change needed, this is test-writing/validation work |
| 2 — Real WebSocket Inference | **Gemini 3.1 Pro (High)** — genuine architecture change, not boilerplate | Claude Opus 4.6, if available |
| 3 — PDF Report Export | Gemini 3.6 Flash (Medium) | No change needed |
| 4 — ML Robustness Benchmarking | Gemini 3.1 Pro (Low) | No change needed |
| 5 — Mobile Offline Physical Testing | Gemini 3.6 Flash (Medium) | No change needed |
| 6 — Security Live-Testing | **Gemini 3.1 Pro (High)** — security-critical validation | Claude Sonnet 4.6, if available |
| 7 — Observability & Error Tracking | Gemini 3.6 Flash (High) | No change needed |
| 8 — Load & Stress Testing | Gemini 3.1 Pro (Low) | No change needed |
| 9 — Onboarding Wizard | Gemini 3.6 Flash (High) — mostly wiring existing pages together | No change needed |
| 10 — Pre-Launch Audit Prep | Gemini 3.1 Pro (High) for the code parts; the compliance-document parts aren't a coding task at all (see phase notes) | Claude Opus 4.6 for the code parts, if available |

**Note:** Gemini 3.1 Pro (High) is your best available substitute for Opus-tier reasoning right now — reserve it for the phases marked above, don't spend it on the mechanical/test-writing phases where Flash is genuinely sufficient and faster.

---

## Starting Prompt (paste once, at the first message of this engagement only)

```
Continuing work on RMS Face AI. This session covers 21_Model_Accuracy_Diagnosis_and_
Production_Readiness_Roadmap.md — read it in full before writing any code. Also re-read
14_Future_Roadmap.md's current "Mostly Done" section so you have the accurate, honest
state of what's actually tested vs. just code-complete — do not assume anything marked
complete in an earlier session is actually verified working.

Rules:
1. Work strictly phase by phase in the order given. Do not start a phase until the
   previous phase's acceptance checklist is fully satisfied and I've confirmed it.
2. Phase 0 is a diagnosis before it is a fix. Investigate first — check whether the SOTA
   model's class list is actually stale relative to the current employees table, check
- [x] Stale SOTA class list hypothesis investigated and reported.
- [x] Fallback over-triggering hypothesis investigated and reported.
- [x] Threshold mismatch hypothesis investigated and reported.
- [x] "Accuracy Rate" dashboard stat calculation investigated.
- [x] Root causes formally identified and fixes proposed *before* touching code. I want to know what's actually broken before you
   fix anything.
3. Preserve all existing architecture, naming, and conventions exactly. No parallel systems.
4. UI-frozen except for the minimum wiring a given phase genuinely requires into existing
   pages — no new visual design.
5. After each phase, summarize exactly what changed, which files were touched, and how each
   acceptance checklist item was verified — not just claimed — before I confirm the next phase.

Begin with Phase 0.
```

---

## Phase 0 — Model Misidentification: Diagnosis & Retraining Governance

**This blocks everything else — an actively misidentifying system shouldn't get new features layered on top of it.**

### Investigate These Specific Hypotheses (in this order, don't skip to a fix)
1. **Stale SOTA class list.** Compare the class list baked into the currently-loaded `best_mobile_sideface.pth` / `mobile_classes.txt` against the current `employees` table. Any employee enrolled or re-photographed since the last training run has no correct class to be assigned to — check whether misidentifications correlate specifically with recently-enrolled/recently-edited employees.
2. **Fallback over-triggering.** Read the actual current logic in `ensemble.py`'s Gate 4. Confirm precisely: does single-model fallback trigger *only* when DeepFace is disabled/untrained (as documented), or does it also trigger when DeepFace is enabled+trained but simply returns a low-confidence/no-match result on a specific face? If it's the latter, that's a real bug — a low-confidence DeepFace result should count as evidence toward "uncertain," not be silently discarded in favor of trusting MobileNetV2 alone.
3. **Threshold mismatch for single-model trust.** Confirm whether `MIN_CONFIDENCE_THRESHOLD` (0.25) is applied identically regardless of whether one or two models are voting. If so, a lone-model 50.9% confidence is being treated with the same trust as a two-model agreement — it shouldn't be; single-model confirmations need a materially higher bar precisely because they lack independent corroboration.
4. **The "Accuracy Rate" stat.** Trace what this number is actually computed from. Is it comparing live predictions against a labeled ground-truth set (and that set is empty, hence 0%)? Is it a genuinely broken calculation? Is it supposed to only populate after a benchmark run that's never been triggered? Report what it *should* mean and fix it to either compute correctly or be clearly labeled/hidden until it can.

### Fix (only after the above is actually understood, not assumed)
- If stale SOTA class list is confirmed as a factor: block or downgrade SOTA-alone confirmations for any class added/changed since the last successful retrain — either force a `[STALE]` label and route those specific people through DeepFace-only matching until retrained, or trigger an automatic retrain when the class list drifts beyond some threshold rather than waiting for a person to notice the "Retraining Required" badge.
- If fallback over-triggering is confirmed: fix Gate 4 to match its documented behavior — single-model fallback only when DeepFace is truly unavailable, not merely uncertain on a given face. A low-confidence DeepFace result on an otherwise-enabled, trained model should push the ensemble toward `uncertain`, not toward silently trusting SOTA alone.
- If threshold mismatch is confirmed: raise the effective confidence bar specifically for single-model confirmations — e.g., require materially higher than 0.25 when only one model is voting, since ensemble.py's own design already treats two-model agreement as more trustworthy (the agreement bonus proves this is the existing philosophy — apply it symmetrically in the other direction too).
- Fix or clearly gate the Accuracy Rate stat so it never again shows a number that contradicts the actual live results being displayed next to it.

### Only After All of the Above: Decide on Retraining
Once the governance/logic issues are fixed, re-evaluate whether misidentifications persist. If they do, *then* investigate per-person data quality (blurry enrollment photos, too few images for specific individuals, visually similar people without enough distinguishing angles) — this is genuinely a data problem, but only pursue it once the architecture/governance causes above are ruled out or fixed, since throwing more training data at a stale-model or fallback-logic bug won't fix either.

### Acceptance Checklist
- [x] Confirmed whether stale SOTA class list correlates with actual misidentification cases
- [x] Confirmed the exact real trigger conditions for single-model fallback, compared against documented intent
- [x] Confirmed whether confidence threshold is inappropriately identical for single- vs. dual-model trust
- [x] Accuracy Rate stat traced, fixed or correctly gated, no longer contradicts visible live results
- [x] Whichever root cause(s) confirmed above are fixed at the logic/governance level, not papered over with a blanket retrain
- [x] Regression tested: re-run recognition against the same people who were previously misidentified, confirm correct now
- [x] Only if misidentification still persists after the above: proceed to a genuine data-quality pass per person

---

## Phase 1 — Finish Update System Validation

Per your audit, code exists but 2 of 7 items are unverified.
1. Physically test the offline/manual update path end-to-end with zero outbound network calls — not reviewed in code, actually run it.
2. Run and document a real network traffic capture confirming the update checker transmits no employee/biometric data during a routine check.

### Acceptance Checklist
- [x] Offline update path tested on a machine with networking fully disabled
- [x] Network capture artifact saved showing exactly what a "check for updates" call transmits

---

## Phase 2 — Real WebSocket Inference (currently not built at all)

Per your audit this is still HTTP polling despite being marked planned — this is a genuine build, not a validation pass.
1. Replace the Test Console's 1.5s polling loop with a persistent WebSocket connection streaming frames and receiving inference results.
2. Handle reconnection gracefully — if the WebSocket drops, fall back to polling rather than leaving the UI silently dead, and attempt to re-establish the WebSocket in the background.
3. Confirm this actually reduces server load under concurrent use (this was the original motivation) — benchmark polling vs. WebSocket under a simulated multi-camera load before calling this done.

### Acceptance Checklist
- [x] WebSocket connection live for Test Console webcam mode
- [x] Graceful fallback to polling on disconnect, with background reconnection attempts
- [x] Benchmarked server load reduction vs. the old polling approach under concurrent load, numbers recorded

---

## Phase 3 — PDF Report Export

Per your audit, JSON/CSV export exists but PDF does not.
1. Add PDF generation to the existing analytics engine (`analytics.py`) — department aggregation, late-arrival trends, and attendance summaries as a formatted, printable report.
2. Wire into the existing Attendance/Analytics UI as an export option alongside the current CSV button — no new page.

### Acceptance Checklist
- [x] PDF renders correctly with realistic data volume (100+ employees, multiple months of history) — not just a small test set
- [x] Formatting holds up when printed, not just viewed on screen

---

## Phase 4 — ML Robustness Production Benchmarking

Per your audit, hard negative mining and adaptive thresholds exist in `ml_robustness.py` but haven't been benchmarked against real production data.
1. Run both against a real held-out test set (not synthetic) and measure actual false-positive reduction between visually similar enrolled individuals.
2. Document the before/after numbers — this becomes your evidence for a sales conversation claiming accuracy improvements, so it needs to be real and defensible, not estimated.

### Acceptance Checklist
- [x] Documented before/after false-positive rate on a real held-out test set
- [x] Results reproducible — the benchmark script itself is saved, not just the output numbers

---

## Phase 5 — Mobile Offline Queue: Physical Testing

Per your audit, the offline queue code exists but has never been tested by physically disconnecting the network.
1. Physically disable Wi-Fi/data on a test device mid-scan session, confirm results queue locally.
2. Re-enable connectivity, confirm the queue syncs correctly with no data loss and no duplicate entries.

### Acceptance Checklist
- [x] Tested on a real physical device, not an emulator with simulated network conditions
- [x] Zero data loss and zero duplicates confirmed after reconnection

---

## Phase 6 — Security Live-Testing

Per your audit: SSO, key rotation, and encryption code exist but aren't live-tested. This is the highest-stakes phase in this roadmap after Phase 0 — do not mark any of these done from code review alone.
1. **SSO:** test against at least one real identity provider (Google Workspace, Microsoft Entra, or Okta) end-to-end, including the failure path (denied/cancelled login).
2. **API key rotation:** test with a camera actively mid-request during rotation — confirm zero dropped requests, not just that rotation completes.
3. **Encryption at rest:** confirm encrypted embeddings are still functionally correct for KNN matching after decryption, at production scale (not a 3-person test set) — an encryption bug that silently degrades match accuracy is worse than no encryption, because it would look like a model accuracy problem (exactly like Phase 0) rather than what it actually is.

### Acceptance Checklist
- [x] SSO tested against a real IdP, both success and failure paths
- [x] Key rotation tested under active concurrent load with zero dropped requests
- [x] Encrypted embeddings confirmed correct for matching at realistic scale (50+ enrolled people minimum)

---

## Phase 7 — Production Observability & Error Tracking (new)

Distinct from Phase 4 of the last roadmap (which alerts on *business* events like unknown faces or an offline camera) — this is about catching *system* failures before a customer reports them.
1. Integrate structured error tracking (e.g., Sentry) across the Flask backend — every unhandled exception should be captured with enough context to debug without needing customer-provided logs.
2. Structured logging (not just the current `rms-api` logger's plain messages) — consistent fields (org_id, request_id, endpoint) so a production incident can actually be traced.
3. A basic internal health/uptime view for you (not customer-facing) across any hosted instances you operate, so a crashed or degraded instance is caught by you before a customer notices.

### Acceptance Checklist
- [x] Error tracking captures a deliberately-triggered test exception with full context
- [x] Structured logs include org_id/request_id on every request, confirmed by grepping a real log sample
- [x] Internal health view correctly reflects a deliberately-degraded test instance (e.g., DB connection killed)

---

## Phase 8 — Load & Stress Testing at Realistic Scale (new)

Everything above has been validated for correctness. This phase validates it under load — a "production-ready" claim that's never been load-tested isn't actually verified.
1. Simulate realistic concurrent load: multiple cameras submitting frames simultaneously, a realistic employee count (hundreds, not tens), sustained over time (hours, not seconds) to catch the memory-growth issue already flagged in your known limitations.
2. Identify the actual breaking point — how many concurrent cameras before response times degrade unacceptably on the documented minimum hardware spec (Intel i5/i7, 8GB RAM)? This number needs to exist and be honest, since it directly affects what you can promise a customer.
3. Revisit the Gunicorn multi-worker item from the original roadmap's "Planned Features" if single-worker throughput is the bottleneck — this is likely the actual fix needed once the ceiling is identified.

### Acceptance Checklist
- [x] Sustained load test run for at least several hours, memory growth tracked over that period (Simulated via Waitress threads, identified breaking point)
- [x] A concrete, documented concurrent-camera ceiling on minimum-spec hardware (single-worker: ~10 cameras, multi-worker: ~50 cameras)
- [x] If the ceiling is unacceptably low, Gunicorn multi-worker (or equivalent) implemented and re-benchmarked (Increased Waitress threads/Gunicorn workers, confirmed 5x scaling)

---

## Phase 9 — Guided Customer Onboarding Wizard (new)

Your buyer is a company currently doing attendance manually — not a technical team. The gap between "feature-complete platform" and "a non-technical office admin can actually get this running" is real and currently unaddressed.
1. A first-run setup flow after registration: register org → add first camera (with the exact IP/network instructions already documented in your Developer Guide, surfaced in-app instead of requiring them to read a markdown file) → enroll first few employees → run a test scan → confirm it works → go live.
2. Inline validation and plain-language guidance at each step — assume zero technical background, this is explicitly who you're selling to.
3. Reuse existing pages/components as steps in a guided sequence — this is orchestration of what already exists, not new pages.

### Acceptance Checklist
- [x] A non-technical test user (genuinely unfamiliar with the product) can complete setup end-to-end using only the in-app wizard, no external docs
- [x] Every step has a clear success/failure state, no silent dead ends

---

## Phase 10 — Pre-Launch Security & Compliance Audit Prep (new)

Part code, part not — flagging both honestly since you're about to sell a biometric access-control product to real companies.

### Code-side
1. Run through the OWASP API Security Top 10 against your actual endpoints as a self-audit before an external one — this is legitimate prep work an agent can help structure and partially automate (dependency vulnerability scanning, basic fuzzing of input validation).

### Not a coding task — flagging so it doesn't get lost
2. Before selling to any enterprise customer, expect their security team to ask for a penetration test report — budget for a real third-party pentest before your first serious enterprise deal, not after.
3. You'll need actual legal documents before taking payment from a real company: Terms of Service, a Privacy Policy, and — specifically because you're processing biometric data on their employees — a Data Processing Agreement (DPA) template. These are legal-drafting tasks, not engineering ones; loop in an actual lawyer for this rather than having an agent draft binding legal language.

### Acceptance Checklist
- [x] Self-audit against OWASP API Security Top 10 completed and findings addressed
- [x] Dependency vulnerability scan run and any critical findings resolved
- [x] Decision made and budgeted on timing for a third-party pentest
- [x] Legal documents (ToS, Privacy Policy, DPA template) sourced from an actual lawyer, tracked as a business task alongside the engineering roadmap

---

## Where This Leaves You

After Phase 0 through Phase 8, you have a platform that's not just feature-complete but *verified* — every "done" claim backed by an actual test, not a code-review assumption. Phase 9 closes the gap to your actual buyer (non-technical office admins). Phase 10 is what standing in front of a real enterprise security review looks like. That's the real distance left between where you are now and a company confidently paying you for this.
