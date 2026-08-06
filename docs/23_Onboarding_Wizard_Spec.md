# 23 Guided Onboarding Wizard — Detailed Agent Spec

This expands Phase 9 of `21_Model_Accuracy_Diagnosis_and_Production_Readiness_Roadmap.md` into a full build spec. Hand this to the agent as a standalone task once Phase 0 (accuracy fix) is confirmed done — this can run in parallel with Phases 1–8 since it doesn't touch the ML pipeline.

**Model tier:** Gemini 3.6 Flash (High) for the bulk of this — it's real but mostly mechanical wiring of existing pages into a guided sequence, not novel architecture. Use Gemini 3.1 Pro (High) only if the state-persistence/gating logic (§3) gets genuinely tricky.

---

## 0. The Core Idea (read this before building anything)

This is not a slideshow of screenshots explaining the product. It is **the user's real first setup, walked through step by step, on the real pages, with "Next" unlocked only when the actual required action is genuinely done.** By the end, their organization isn't "ready to go" — it already has a real camera, a real enrolled employee, and a real verified successful scan. The teaching happens *in situ*, on the actual control they need to use right now, the way a game tutorial highlights "this is your jump button" the first time you'll need to jump — not in a wall of text beforehand.

Two things must always be true:
- **Never fake it.** No sandboxed/demo data, no "simulated" camera or employee. Every action during onboarding is a real API call creating real data.
- **Never trap the user.** Skip and "do this later" must always be available and must never lose progress — this is a guide, not a gate.

---

## 1. The Two Mechanisms, Combined

### A. The Wizard Shell (the "next, next, next" structure)
A persistent, dismissible progress bar/stepper attached to the top of the real app while onboarding is active — showing "Step 3 of 6," a short step title, and Back / Next / Skip Tour controls. This is the same visual language as the existing 3-step Add Subject stepper already used on mobile (`1 Name → 2 Photos → 3 Upload`) — reuse that exact pattern and its existing styling, don't invent a new visual language for this.

### B. The Spotlight/Tooltip (the "teaching" layer)
On each real page, the specific control the user needs for this step is highlighted (a soft glow/pulse on that element, the rest of the page gently dimmed) with a short callout tooltip near it explaining, in one or two sentences, what it does and what to do. Use an existing open-source tour library (e.g., `react-joyride` or an equivalent lightweight spotlight/tour package) for the positioning/z-index mechanics rather than hand-building that from scratch — but restyle its default appearance completely to match the existing design tokens (dark glass, `#5E6AD2` accent) so it doesn't look like a bolted-on third-party widget.

These two run together: the shell tells the user where they are in the journey; the spotlight teaches them the specific control on the specific page they're standing on right now.

---

## 2. The Steps (concrete, tied to real pages)

### Step 0 — Welcome (modal, before entering the real app flow)
Brief: "Let's get your organization set up — this takes about 5 minutes, and you'll have a working system by the end." Two buttons: **Start Setup** and **I'll do this later**. Choosing "later" doesn't lose anything — see §4 (resumable checklist).

### Step 1 — Confirm Your Organization
Page: Settings/Profile. Spotlight the org name, plan tier, and deployment mode fields. One-line explanation of what deployment mode means in plain language ("Local keeps everything on this machine; Cloud syncs across locations"). No gating — just orientation, Next always available.

### Step 2 — Add Your First Camera
Page: wherever camera management currently lives (verify this exists as a real page — if camera CRUD is currently only a backend concept with no dedicated UI, this step requires building that minimal admin panel first, since the wizard can't teach a control that doesn't exist yet). Spotlight the "Add Camera" action. Plain-language explanation: "This creates a secure key that lets a physical camera talk to RMS without needing a login — think of it like a separate password just for that device." **Gate:** Next stays disabled, with a gentle inline nudge ("add a camera to continue"), until at least one camera genuinely exists for this org — checked via a real API call (`GET /api/cameras` or equivalent), not a client-side guess.

### Step 3 — Enroll Your First Employee
Page: `UploadPage.jsx`. Spotlight the Left/Front/Right/Extra dropzones. Plain-language explanation: "More angles means better recognition, especially for security cameras that don't always see someone head-on." **Gate:** Next disabled until at least one employee is enrolled with the minimum required photos, verified via a real API check.

### Step 4 — Run Your First Scan
Page: `TestPage.jsx`. Spotlight "Capture & Run Inference." Plain-language explanation of the three possible results: green CONFIRMED, red NOT FOUND, orange SPOOF — one line each, no jargon. **Gate:** Next disabled until a genuine CONFIRMED result is achieved for the employee just enrolled in Step 3 — this is the "does it actually work" proof moment, and it should feel like a small win when it succeeds (see §5 on positive reinforcement).

### Step 5 — Where You'll Check In Daily
Page: `DashboardPage.jsx` / `LiveAttendancePage.jsx`. Spotlight the live attendance grid and today's summary. No gating, just orientation — "this is what you'll glance at every morning."

### Step 6 — You're Set Up
Completion screen: short congratulations, a recap checklist of what was just done (camera added, employee enrolled, scan confirmed), a link to invite other admins/managers (ties into existing RBAC), and a link to support. Mark onboarding complete on the org record. **Important:** still leave a "Replay Setup Tour" option permanently available in Settings — useful when a second admin joins later, or when the customer adds their second location.

---

## 3. State & Gating — Must Be Server-Side, Not Just localStorage

Store onboarding progress as real state tied to the organization (a small `onboarding_state` field — current step index, completed flags per step — on the `organizations` record, or a lightweight dedicated table if that's cleaner given the existing schema conventions). This matters because:
- A user might start onboarding on one device and finish on another.
- Gating conditions (camera exists, employee enrolled, scan confirmed) must be verified against real backend state on every step, not assumed from client memory — otherwise a page refresh or a different device could show incorrect progress or let someone skip a step that wasn't actually completed.

---

## 4. The Resumable Checklist (for anyone who exits early)

If a user skips or exits mid-wizard, show a small, dismissible checklist card on the Dashboard — "Setup: 3 of 6 done" — that lets them resume exactly where they left off. Never force linear completion in one sitting; a busy office admin adding this between other tasks needs to be able to leave and come back without losing anything or being nagged aggressively. One card, dismissible, reappears next session if still incomplete — not a persistent banner that can't be closed.

---

## 5. Tone & Copy — Teach Like a Game Tutorial, Not a Manual

- One idea per step. If a tooltip needs more than two sentences, the step is trying to teach too much at once — split it.
- Plain language over technical precision in the tooltips themselves — "this key lets your camera talk securely to RMS" beats "generates a unique API key for X-API-Key header authentication." The precise technical explanation can live in a "Learn more" link for anyone who wants it, but it shouldn't be the default text.
- Small positive reinforcement on completing a gated step (a brief checkmark animation, the progress bar visibly filling) — this is what makes a tutorial feel like progress rather than paperwork. Keep it restrained and quick, not a celebratory animation that gets in the way of moving to the next step.
- Never guilt or pressure copy around skipping ("Are you sure? You'll miss out on...") — respect that "later" is a legitimate choice.

---

## 6. Access Control

Only `org_admin` (and `platform_owner`) roles should ever see the setup wizard — a `manager`, `viewer`, or `kiosk` login should never be prompted with "set up your organization," since that's not their job. Verify this against the existing role hierarchy before triggering the wizard on first login.

---

## 7. Accessibility

Respect `prefers-reduced-motion` for the spotlight glow/pulse and progress-fill animations, matching the pattern already established elsewhere in this project (`useReducedMotion.js` already exists — reuse it, don't build a second reduced-motion check).

---

## Acceptance Checklist

- [ ] Every "Next" gate is verified against real backend state, not client-side assumption
- [ ] Onboarding state persists across devices/sessions (tested by starting on one browser, resuming on another)
- [ ] Skip and "do this later" available at every point, tested to confirm no progress is lost
- [ ] By completion, the org has a genuinely real camera, employee, and confirmed scan — not placeholder/demo data
- [ ] Spotlight/tooltip styling matches existing design tokens, doesn't look like a bolted-on third-party widget
- [ ] Only `org_admin`/`platform_owner` roles are ever shown the wizard
- [ ] Resumable checklist card is dismissible and doesn't nag
- [ ] "Replay Setup Tour" remains accessible from Settings after completion
- [ ] `prefers-reduced-motion` respected using the existing hook
- [ ] Tested end-to-end with a genuinely non-technical test user with no prior exposure to the product, confirmed they could complete setup without external help
