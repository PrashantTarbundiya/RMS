# 20 Production Hardening & Feature Completion — Phased Agent Roadmap

**Scope lock:** This phase of work is functional/backend only. No visual redesign, no new components, no styling changes. Reuse existing pages, existing design system (`index.css`, `.liquid-glass` utilities), existing component patterns. Any UI touched in this roadmap is wiring a new control into an existing page, never a new look.

**Architecture lock:** Every phase below must use the project's existing conventions exactly as documented — `middleware.py` decorators (`@require_auth`, `@require_api_key`, `@require_role`, `@inject_org_id`), `org_storage.py` for all file paths, `database/models.py` + Alembic for all schema changes, the existing role hierarchy (`platform_owner > org_admin > manager > viewer > kiosk`). Do not introduce a parallel auth system, a parallel storage convention, or a second way of scoping tenant data. If a new feature seems to need a new pattern, it almost certainly should extend an existing one instead — flag it for review rather than inventing one.

---

## Starting Prompt (paste this into Antigravity once, at the very first message only)

```
You are implementing a phased production-hardening plan for RMS Face AI, an existing
multi-tenant facial recognition attendance/access-control platform. The full plan is in
20_Production_Hardening_and_Feature_Roadmap.md — read it in full before writing any code,
along with the existing project docs (00–15, README, PROJECT_GUIDE) to confirm current
architecture before touching anything.

Rules for this engagement:
1. Work strictly phase by phase, in the order given in the document. Do not begin a phase
   until the previous phase's acceptance checklist is fully satisfied and I have explicitly
   confirmed it.
2. Before writing any code for Phase 0, produce a written root-cause diagnosis of the
   liveness/anti-spoofing bypass, based on reading the actual current liveness.py
   implementation (not assumptions) — including which of the three signals (edge density,
   color variance, texture analysis) is failing against phone/tablet screen replay and why.
   Propose your remediation approach and wait for my approval before implementing it.
3. Preserve all existing architecture, naming conventions, and file responsibilities exactly
   as documented. Do not create a parallel system for anything an existing module already
   owns (auth, tenant isolation, storage paths, RBAC).
4. This is a UI-frozen engagement — functional and backend work only, wired into existing
   pages/components. No new visual design.
5. After completing each phase, give me a summary of exactly what changed, which files were
   touched, and how each acceptance checklist item was verified, before I confirm you can
   proceed to the next phase.

Begin with Phase 0.
```

---

## Phase 0 — CRITICAL: Liveness / Anti-Spoofing Bypass Remediation

**This phase blocks everything else. Do not proceed to Phase 1 until this is verified fixed with actual spoof-attack testing, not just code review.**

### Why This Happened (likely root cause — verify against actual code before fixing)
Your `liveness.py` implementation, per the docs, relies on three passive, single-frame heuristics: edge density (Laplacian variance), color variance, and texture/frequency analysis. This class of classical anti-spoofing check has a well-documented, specific weakness: **it's tuned to catch printed photos** (which are genuinely flatter, lower-texture, and more color-uniform than real skin) **but modern phone/tablet screens do not share those properties**. A phone screen displaying a photo has its own high-frequency structure (sub-pixel RGB grid, display sharpening, screen glare/reflection) that can register as "textured enough" or "varied enough" to pass thresholds calibrated against paper prints. This is almost certainly why a screen-replay attack is getting through even though the same checks might correctly catch a printed photo — verify this specifically by testing both attack types separately, not just "spoofing" as one category.

### Immediate Mitigation (ship within days, not weeks)
1. **Tighten all three liveness thresholds conservatively**, accepting a temporary increase in false rejections of real employees (they can just try again — a false rejection is an inconvenience, a false acceptance is a security breach). Do this first, today, as a stopgap.
2. **Add screen-replay-specific detection:** moiré pattern detection via FFT specifically tuned to the frequency signature of sub-pixel display grids (this is a different frequency band than the general "texture frequency analysis" already in place — it needs its own dedicated check, not a threshold tweak on the existing one). Also add basic reflection/glare detection (specular highlight clustering, which is common on phone/tablet glass and rare on real skin or matte paper).
3. **Require a short multi-frame capture instead of a single frame** for any liveness-gated decision (camera/production path especially): capture 3–5 frames over ~1 second and check for micro-movement (subtle position/landmark drift between frames). A completely static photo or a screen held perfectly still fails this; a real person, even trying to hold still, has natural micro-movement. This is a meaningfully stronger defense than any single-frame heuristic and doesn't require new hardware.

### Proper Fix (do after the immediate mitigation ships)
4. **Add a dedicated lightweight anti-spoofing CNN** (a binary real/spoof classifier, e.g. a small MobileNet-based model) trained or fine-tuned on a public anti-spoofing dataset (CelebA-Spoof, CASIA-SURF, or similar — research licensing terms before using any dataset commercially). Run it as an additional, independent vote alongside the classical checks, not as a replacement — an ensemble of a learned classifier plus the frequency/motion checks is significantly harder to fool than either alone.
5. **Active liveness challenge for high-security deployments (optional, configurable per-org):** a blink or head-turn prompt during enrollment/verification, already flagged in your own roadmap — elevate this from "future" to "available now" as an opt-in strict mode for customers who want maximum assurance (e.g., server-room access vs. a general office lobby).

### Testing Protocol (mandatory before sign-off — this is the actual acceptance test, not a code review)
Build a small internal "red team" test set before declaring this fixed:
- 3+ registered test employees
- Printed photos of each (at least 2 paper types/qualities)
- Each shown on at least 2 different screens (phone + tablet, different brightness levels)
- A video replay of each (playing a short clip of the person, not just a static image)
- Track **false-accept rate on spoofs specifically** as the headline metric — not overall model accuracy, which can look fine while spoofing is completely broken. Target: zero false accepts on this test set before shipping to any customer.
- Re-run this exact test set after every future change to `liveness.py` or the ensemble pipeline — this becomes a permanent regression test, not a one-time check.

### Acceptance Checklist
- [ ] Root cause confirmed against actual `liveness.py` code (not assumed)
- [ ] Thresholds tightened and deployed as immediate stopgap
- [ ] Moiré/screen-specific frequency detection added
- [ ] Multi-frame micro-movement check implemented for camera/production path
- [ ] Red-team spoof test set built and passing at 0% false-accept rate
- [ ] Regression test suite created so this can't silently regress in a future change
- [ ] Dedicated anti-spoof CNN integrated as an additional ensemble vote (proper fix, not just mitigation)
- [ ] Decision made and documented on active liveness challenge as an opt-in strict mode

**Model tier note:** Use Opus 4.6 (Thinking) for the root-cause diagnosis and the CNN integration — this is a security-critical reasoning task, not boilerplate. Do not delegate this phase to a faster/cheaper tier.

---

## Phase 1 — License & Release Sync System

**Why this is now urgent, not a nice-to-have:** you sell to each company as an isolated on-premise install (their own registered employees only, no shared cloud tenancy) — this is a genuinely good sales pitch ("your data never leaves your building") and Phase 0 didn't change that. But it means you now have a **fleet of independently-running installs**, and Phase 0 just proved you'll need to push an emergency security patch to all of them at some point without asking each customer to manually reinstall. This system is what makes that possible without breaking the "your network stays isolated" promise.

### Design Constraint (do not violate)
The update mechanism must be **one-directional and metadata-only** by default: each install may *check* a central manifest for the latest available version and changelog, and may *download* an update package — it must never transmit employee data, images, embeddings, or attendance logs as part of this process. This is not just good practice, it's the thing your sales pitch depends on — an "update checker" that quietly phones home with usage data would directly contradict "100% Data Sovereignty" and would be a real trust problem if a customer ever inspected network traffic (and security-conscious customers will).

### Components to Build
1. **Version manifest endpoint (central, hosted by you, not per-customer):** a simple endpoint returning `{"latest_version": "1.4.0", "changelog": "...", "download_url": "...", "checksum": "...", "min_upgrade_from": "1.2.0", "severity": "critical|recommended|optional"}`. This can be a static JSON file on your own infrastructure — it doesn't need a database.
2. **In-app "Check for Updates" panel** (extend the existing Settings/Profile page — no new page, no new visual design): shows current version, checks the manifest, displays available update with changelog and severity, and requires explicit admin (`org_admin` or higher) action to apply — never auto-applies without confirmation, especially for anything touching the database schema.
3. **Signed release packages:** every release package must ship with a checksum (and ideally a signature) that the installed instance verifies before applying — prevents a compromised or spoofed update source from pushing malicious code to a customer's on-prem biometric system. This is a security-critical detail, not a nice-to-have, given what this software has access to.
4. **Update application flow:** download package → verify checksum/signature → back up current version (for rollback) → apply file changes → run `alembic upgrade head` if the release includes schema changes → restart services → confirm health via `/api/health` → report success/failure to the admin.
5. **Rollback capability:** if health check fails post-update, offer a one-click revert to the pre-update backup taken in step 4.
6. **Offline/manual update path (for the most security-conscious customers who won't allow any outbound connection at all):** allow an admin to manually download the release package from your portal on a different machine, then upload it directly through the dashboard for the same verify → backup → apply → migrate flow, with zero outbound network calls required.
7. **Severity-flagged updates:** a `critical` severity flag (exactly what a future liveness-bypass-style patch would use) should be visually distinct in the update panel and should encourage — but still not force — prompt action, since these customers control their own maintenance windows.

### Database/Schema Considerations
- Add an `app_version` and `last_update_checked_at` field to the local instance's config (or a new lightweight `system_info` table in local-mode file storage / a new column set in cloud mode) — this doesn't need to be per-organization in local mode, since each local install is its own deployment.
- Every future Alembic migration must be reviewed for backward compatibility with the rollback path in step 5 — a migration that can't be safely reversed needs an explicit decision logged, not a silent gap.

### Acceptance Checklist
- [ ] Manifest endpoint live and returning version/changelog/checksum/severity
- [ ] In-app check-for-updates wired into existing Settings page
- [ ] Checksum/signature verification blocks any tampered or corrupted package
- [ ] Full update flow tested end-to-end on a non-production instance, including a schema-changing release
- [ ] Rollback tested and confirmed working after a simulated failed update
- [ ] Offline/manual update path tested with zero outbound network calls
- [ ] Confirmed via network capture that a routine "check for updates" call transmits no employee/biometric data whatsoever

---

## Phase 2 — License & Billing Enforcement

You already have the `subscriptions` table (`plan_tier`, `max_employees`, `max_cameras`, `stripe_customer_id`) and `billing.py`/`license.py` files per the docs — this phase is about making those actually enforce limits and connect to real billing, not building them from scratch.

### Components
1. **Stripe integration:** connect `subscriptions.stripe_customer_id`/`stripe_subscription_id` to live Stripe webhooks — subscription created/updated/cancelled/payment failed events should update the local `subscriptions` row automatically.
2. **Plan limit enforcement wired to the UI:** `POST /api/employees` and `POST /api/add_person` must check `subscriptions.max_employees` against the current count and reject with a clear, specific error (not a generic 500) when at the limit — surfaced in the existing enrollment page as an inline message, not a new modal design.
3. **Camera limit enforcement:** same pattern for `max_cameras` when provisioning a new camera API key.
4. **License key validation on startup (on-prem installs specifically):** for local-mode deployments, validate a license key against your `license.py`/`generate_license.py` system at server startup and periodically thereafter — decide now what happens on expiry (grace period + warning banner is more customer-friendly than an immediate hard lockout, and less likely to strand a customer's actual employees at the door if the paperwork is delayed).
5. **Upgrade prompt:** when a plan limit is hit, the existing UI should surface a clear "upgrade your plan" path rather than just a bare rejection.

### Acceptance Checklist
- [ ] Stripe webhook events correctly update local `subscriptions` state
- [ ] Employee/camera limits enforced server-side (not just hidden client-side) — verify by attempting to bypass via direct API call
- [ ] License validation on startup for local-mode installs, with a defined grace-period behavior on expiry
- [ ] Clear, specific error messages (not generic 500s) when a plan limit is hit

---

## Phase 3 — RBAC, User Control & Compliance Self-Service

### 1. Session/Device Management
Add the ability for a user (or an `org_admin` on behalf of their org's users) to view active sessions/refresh tokens and revoke them individually or all-at-once ("log out everywhere") — currently refresh tokens are stateless JWTs with no revocation mechanism per the docs, which means a stolen refresh token is valid for its full 7-day life with no way to cut it off. This needs either a token blocklist (simplest: a small `revoked_tokens` table checked on refresh) or moving refresh tokens to a stored, revocable model.

### 2. Audit Log Dashboard
You already log to `feedback_logs` and `consent_records` — this phase builds the missing *viewing* interface: extend the existing `LogsPage.jsx` (already exists per the docs) with a filterable, searchable view over these two tables, restricted to `org_admin`+ roles. This is both a genuine operational need and a real compliance/sales requirement — "can we see who accessed what" is a question enterprise security buyers will actually ask.

### 3. Biometric Consent Self-Service (compliance-critical, not optional)
You have `consent_records` and `employees.consent_given_at`/`consent_revoked_at` already — but per the docs there's no employee-facing way to exercise their actual legal rights (view what's stored about them, request deletion) under BIPA/GDPR/DPDP. Build:
- An admin-facing view of an employee's consent status and history (extend `ManagePersonPage.jsx`).
- A "revoke consent & purge" action that actually deletes the employee's images, embeddings (removes from `encodings.pickle`/KNN index), and sets `consent_revoked_at` — this needs to be a real, complete purge, not just a status flag, or your compliance story is hollow.
- Document (in your own internal notes, not necessarily in-app) the process for handling a data subject access/erasure request end-to-end, since this is what a regulator or customer's legal team will actually ask about.

### 4. Role-Scoped Navigation
Nav items in `Navbar.jsx` should only render for roles that can actually use them (e.g., a `viewer` shouldn't see a "Training" nav link they'll just get a 403 from) — this is a functional/logic change to an existing component, not a redesign.

### Acceptance Checklist
- [ ] Refresh tokens are revocable individually and all-at-once
- [ ] Audit log dashboard live, filterable, restricted to `org_admin`+
- [ ] Consent revoke-and-purge actually removes images and embeddings, not just a flag
- [ ] Nav items correctly hidden per role, verified for every role in the hierarchy

---

## Phase 4 — Notifications & Alerting

Per your own roadmap: unknown-face alerts, system health issues, daily summaries. Build:
1. **Alert triggers:** unknown/uncertain face detected repeatedly at a camera, camera goes offline, SOTA model untrained for too long, database unreachable.
2. **Delivery:** email (SMTP) as the baseline for every deployment; optional webhook (Slack/Teams) for customers who want it, configurable per-org.
3. **Daily attendance summary email** to `org_admin`/`manager` roles — who checked in, who's late, who's missing.
4. **Notification preferences UI:** extend the existing Settings/Profile page — which alerts, which channel, per-user opt-out.

### Acceptance Checklist
- [ ] Each alert trigger fires correctly and only once per incident (no duplicate spam)
- [ ] Email delivery tested end-to-end
- [ ] Daily summary accurate against actual `attendance_logs` data
- [ ] Notification preferences respected per user

---

## Phase 5 — Multi-Camera & Real-Time Improvements

1. **Multi-camera mosaic dashboard:** live view of all connected cameras' latest recognition state simultaneously — reuse the existing bounding-box overlay pattern from `TestPage.jsx`, just tiled.
2. **WebSocket-based real-time inference:** replace the 1.5s polling interval on the Test Console with a persistent WebSocket connection — meaningfully reduces latency and server load under concurrent use. This also directly helps the CPU-bottleneck/concurrent-request-queueing issue already flagged in your roadmap's known limitations.
3. **Group photo recognition:** process an uploaded photo containing multiple faces and identify all of them in one pass — mostly already supported by the existing `faces: [...]` array response shape in `/api/predict`, this phase is about surfacing it as a distinct, intentional feature in the UI rather than an incidental capability.

### Acceptance Checklist
- [ ] Mosaic view handles at least 4 simultaneous camera feeds without degrading performance
- [ ] WebSocket connection degrades gracefully to polling if it drops (don't leave the user with a silently dead connection)
- [ ] Group photo endpoint tested against a photo with 5+ faces at mixed angles

---

## Phase 6 — Backup, Restore & Data Portability

This is a genuine gap worth adding even though it wasn't on your original roadmap list — every on-prem customer will eventually ask "what happens if this server dies," and right now the honest answer is "you lose everything," which is not acceptable for a product handling irreplaceable enrollment data and legally-sensitive attendance/consent records.

1. **Full backup export:** one action that bundles `encodings.pickle`, `config.json`, the local DB (or a pg_dump for cloud mode), and `dataset_cleaned/` into a single archive an admin can store off-site.
2. **Restore flow:** verified restore from a backup archive onto a fresh install — test this for real, not just in theory; a backup that's never been test-restored is not a backup.
3. **Full org data export (compliance + migration):** a structured export of everything tied to an organization, for customers who want to self-host a migration or need it for a compliance audit.

### Acceptance Checklist
- [ ] Backup archive contains everything needed to fully restore an instance
- [ ] Restore tested end-to-end on a clean install, not just reviewed in code
- [ ] Full org data export produces a complete, structured, human-inspectable output

---

## Phase 7 — Advanced Analytics & Reporting

Department-level aggregation, late-arrival trend analysis, exportable PDF reports — per your roadmap. Lower urgency than the phases above; good candidate for a faster agent tier once the schema/query patterns from earlier phases are established.

### Acceptance Checklist
- [ ] Department aggregation accurate against real `employees.department` + `attendance_logs` data
- [ ] PDF export renders correctly with real data at realistic scale (100+ employees, months of history)

---

## Phase 8 — ML Robustness Follow-Up

Do this after Phase 0's spoof-fix has stabilized, as a second pass on genuine model quality (distinct from the security-critical fix):
1. Hard negative mining for visually similar individuals.
2. Adaptive per-person thresholds.
3. Expanded augmentation (motion blur, occlusion, extreme lighting).
4. Model quantization (INT8) for faster CPU-only edge inference.

### Acceptance Checklist
- [ ] Measurable reduction in false-positive rate between visually similar enrolled individuals, tested on a real held-out set
- [ ] Quantized model benchmarked against the original for both speed and accuracy — confirm no unacceptable accuracy regression before shipping

---

## Phase 9 — Mobile Parity & Offline Resilience

1. Offline queue: cache recognition results locally when network drops, sync when connectivity returns.
2. Evaluate on-device pre-filtering (TensorFlow Lite) to reduce bandwidth — mark as exploratory, not committed, until Phase 0-9 core work is stable.

### Acceptance Checklist
- [ ] Offline queue tested by physically disconnecting network mid-session and confirming sync on reconnect with no data loss

---

## Phase 10 — Broader Security Hardening

1. **OAuth2/SSO** (Google Workspace, Microsoft Entra, Okta) for enterprise customers who require it as a condition of purchase.
2. **API key rotation** with a grace period so a camera doesn't go dark mid-rotation.
3. **Encryption at rest for `encodings.pickle`** using per-organization keys — meaningfully strengthens the "even if this file is stolen, it's useless" claim from a purely mathematical argument to an actual encrypted one.

### Acceptance Checklist
- [ ] SSO login tested against at least one real identity provider
- [ ] Key rotation tested with a camera actively mid-request during rotation — confirm no dropped requests
- [ ] Encrypted embeddings file confirmed unreadable without the correct per-org key, and confirmed still functionally correct for KNN matching after decryption

---

## Overall Sequencing Note

Phases 0–2 are the ones that materially change your business's risk exposure (security bug, ability to patch a deployed fleet, actually collecting money) — treat those as the real "must ship soon" set. Phases 3 onward are genuine value-adds in the order your own roadmap already prioritized them, resequenced only where a later phase depended on an earlier one (e.g., notifications in Phase 4 are more useful once the audit/consent work in Phase 3 exists to alert on).
