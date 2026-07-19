# 17 UI/UX Redesign — Agent Execution Prompt

This is a ready-to-paste brief for your Antigravity/Gemini agents (recommend **Gemini 3.1 Pro High** for the design-system foundation + shell, then **Gemini 3.5 Flash High** for repetitive page builds once the system exists — see `16_SaaS_Transformation_Blueprint.md` §12). It targets the existing stack from `04_Frontend.md`: React + Vite, vanilla CSS variables in `src/index.css`, `framer-motion` already installed. Do not introduce Tailwind or a component library — extend what's there.

---

## 0. Read This First — What "AI-Looking UI" Actually Means, and How We're Avoiding It

Three tells make a UI read as AI-generated on sight, and this brief is written specifically to avoid all three:
1. **Generic indigo/violet gradient blobs + glassmorphism everywhere** — the single most overused look in "blue/purple AI SaaS" right now. If every card has a blurred gradient orb behind it, it reads as templated.
2. **Decoration with no relationship to the product** — numbered badges, floating icons, and abstract shapes that could belong to any SaaS dashboard.
3. **Uniform, scattered animation** — every element fading/sliding in the same way on load, with no orchestration or hierarchy.

The fix isn't "less blue/purple," it's **grounding the design in what this product literally does**: it draws bounding boxes around faces, it scans, it confirms/rejects in binary. The signature visual language below (§3) comes from that, not from a generic template.

---

## 1. Product Context (anchor every design decision to this)

This is an **enterprise security/attendance console**, not a marketing site or consumer app. The user is an HR manager, security officer, or org admin looking at this for hours during a work shift, often on a dim office wall-mounted screen or a phone at a guard station. Design for:
- Legibility at a glance from a few feet away (kiosk/wall-mount use case)
- Fast repeated scanning of live data, not first-impression delight
- Trust and authority — this product denies/grants physical access to real employees, the UI should feel precise and calm, never playful or gimmicky

---

## 2. Design Tokens — Sourced Directly From Linear's Design System (single reference, do not blend with any other system)

This project standardizes on **Linear's actual design tokens** as the single source of truth — not an approximation, not a blend with any other reference. Linear was chosen because its whole discipline (near-black canvas, one restrained lavender-blue accent, hairline-bordered dense panels, software-craft documentation feel) is built for exactly what this product needs: a dense console someone scans for hours, not a marketing page. Implement these exactly.

### Color
```css
:root {
  /* Canvas & surfaces */
  --canvas: #010102;          /* deepest base — the whole app sits on this, not flat #000 */
  --surface-1: #0F1011;       /* primary card/panel */
  --surface-2: #141516;       /* nested/secondary panel */
  --surface-3: #18191A;       /* elevated (dropdowns) */
  --surface-4: #191A1B;       /* modals */

  /* Borders */
  --hairline: #23252A;
  --hairline-strong: #34343A;
  --hairline-tertiary: #3E3E44;

  /* Accent — the ONE chromatic color, used deliberately, never decoratively */
  --accent-primary: #5E6AD2;       /* Linear's signature lavender-blue */
  --accent-hover: #828FFF;
  --accent-focus: #5E69D1;
  --brand-secure: #7A7FAD;         /* muted accent variant — good fit for "verified/secure" states given the name */

  /* Text */
  --ink: #F7F8F8;
  --ink-muted: #D0D6E0;
  --ink-subtle: #8A8F98;
  --ink-tertiary: #62666D;

  /* Semantic (this product's core language: CONFIRMED / NOT FOUND) */
  --success: #27A644;
  --alert-crimson: #F87171;   /* not in source system — nearest semantic red, kept for NOT FOUND state */
  --warn-amber: #FBBF24;      /* not in source system — kept for warning states */
}
```
Rule: `--accent-primary` appears on the brand mark, focus rings, primary CTAs, and the reticle motif (§3) — never as a background wash or gradient fill. This is Linear's own discipline, stated directly in its system: the accent is reserved for a few intentional moments, not decoration. If an agent starts filling card backgrounds or large surfaces with the accent color, that's a deviation — flag it.

### Typography
- **Display (headings, KPI numbers):** Linear Display (SF Pro Display fallback), weight 500–600, with the negative tracking values below — this is what gives Linear's dense screens their "quietly luxurious" feel instead of looking cramped.
- **Body (UI text, labels):** Linear Text (system sans fallback: `-apple-system, "Segoe UI", sans-serif`).
- **Utility/Data (timestamps, employee IDs, confidence scores, prediction IDs):** Linear Mono, 13px — same rationale as before: tabular data reads as precise, not decorative.

```css
--text-display-lg: 56px/1.10, weight 600, tracking -1.8px;   /* page-level heros, rare */
--text-display-md: 40px/1.15, weight 600, tracking -1.0px;   /* section headers */
--text-headline:   28px/1.20, weight 600, tracking -0.6px;   /* card/page titles */
--text-card-title: 22px/1.25, weight 500, tracking -0.4px;
--text-subhead:    20px/1.40, weight 400, tracking -0.2px;
--text-body-lg:    18px/1.50, weight 400, tracking -0.1px;
--text-body:       16px/1.50, weight 400, tracking -0.05px;  /* default UI text */
--text-body-sm:    14px/1.50, weight 400, tracking 0;
--text-caption:    12px/1.40, weight 400, tracking 0;
--text-button:     14px/1.20, weight 500, tracking 0;
--text-eyebrow:    13px/1.30, weight 500, tracking 0.4px;
--text-mono:       13px/1.50, weight 400, tracking 0;
```
Set once in `index.css` as variables, referenced everywhere — no inline font-sizes anywhere in the codebase.

### Spacing & Radius (Linear's actual scale)
```css
--space-xxs: 4px;  --space-xs: 8px;   --space-sm: 12px;  --space-md: 16px;
--space-lg: 24px;  --space-xl: 32px;  --space-xxl: 48px; --space-section: 96px;

--radius-xs: 4px;  --radius-sm: 6px;  --radius-md: 8px;  --radius-lg: 12px;
--radius-xl: 16px; --radius-xxl: 24px; --radius-pill: 9999px;
```
Pills are reserved for status badges and filter tabs only (this matches Linear's own `pricing-tab-selected` usage) — not for general buttons, which use `--radius-md`.

### Component Tokens (directly from source — implement these shapes)
- `button-primary`: bg `--accent-primary`, text white, `--radius-md`, padding `8px 14px`, hover → `--accent-hover`, pressed → `--accent-focus`.
- `button-secondary`: bg `--surface-1`, text `--ink`, same radius/padding.
- `card` (feature/data card): bg `--surface-1`, `--radius-lg`, padding `24px`, border `1px solid var(--hairline)`.
- `text-input`: bg `--surface-1`, `--radius-md`, padding `8px 12px`.
- Screenshot/preview panels (repurpose for camera/video feed containers): bg `--surface-1`, `--radius-xl`, padding `24px`.

---

## 3. Signature Element: The Aperture Reticle

This is the one memorable, deliberately bold element — everything else stays quiet around it, per design discipline (spend the boldness once, not everywhere).

**What it is:** a thin animated corner-bracket frame — literally the same visual language as the bounding boxes your backend already draws around detected faces (`[x, y, w, h]` from `face_detection.py`) — reused as a UI device across the product:
- **Loading states:** instead of a generic spinner, a reticle frame with corner brackets pulses/tightens (0.6s ease, then settles) — ties directly to "the system is scanning."
- **Employee avatars/cards:** a subtle reticle-corner frame on hover (not always-on — always-on would be noisy), indigo→violet gradient only on the four corner brackets, not the full card.
- **Empty states:** an open reticle frame with brackets slightly apart, with copy like "No one's checked in yet today" — implies "waiting to detect," which is literally true of the system.
- **Live capture UI (Test page, camera modal):** the actual bounding box overlay, styled with this same bracket language, so the product UI and the marketing/dashboard UI feel like one coherent system rather than two different designers' work.

This is the one place `--accent-primary` is allowed to appear as a soft gradient (indigo → lavender-hover, i.e. `--accent-primary` → `--accent-hover`) rather than a flat fill. Nowhere else in the product does a gradient appear — that restraint is the entire point of Linear's system, and the thing most "blue/purple AI SaaS" UIs get wrong.

---

## 4. Motion & Microinteraction Spec

Orchestrated, not scattered. Respect `prefers-reduced-motion` globally — wrap all animation in a check and fall back to instant state changes.

| Interaction | Behavior |
|---|---|
| Page load | One orchestrated sequence: sidebar nav items stagger in (40ms offset each), then main content fades up (200ms). Not every card fading in separately. |
| Button press | Scale to 0.97 on `:active`, spring back — tactile, not decorative. |
| CONFIRMED result | Reticle frame snaps tight around the face + green flash pulse (150ms) + haptic-style micro-bounce on the result badge. This is the single most important interaction in the whole product — it needs to feel instant and certain, not cute. |
| NOT FOUND result | Reticle frame stays open/loose, crimson pulse, no bounce — visually distinct rhythm from CONFIRMED, not just a color swap. |
| Live Attendance grid | New check-in cards slide in from the top with a brief highlight-glow that fades over 2s, so admins visually catch new arrivals without a jarring re-render. |
| Feedback correction (marking a prediction wrong) | Modal slides up with spring physics; on submit, the corrected card visibly "re-sorts" into its right place rather than just vanishing — reinforces that the correction did something real. |
| Table row hover | Background lightens to `--surface-2`, no shadow/scale — restraint matters in dense data tables. |
| Toasts | Enter from bottom-right, auto-dismiss with a visible countdown bar, never stack more than 3 — older ones collapse into "+2 more." |
| Nav active state | Left border accent bar (indigo) grows in from top, not a full background fill — quieter, more console-like. |

Avoid: parallax scrolling, floating background shapes, confetti/celebration animations, anything that delays the admin from seeing a result. This is a tool used under time pressure at a security checkpoint — motion serves clarity, never spectacle.

---

## 5. No Broken Components — Required State Coverage

Every interactive component must ship with **all** of these states explicitly designed, not just the happy path. This is the actual fix for "looking unfinished":

- Default / Hover / Active(pressed) / Focus-visible (keyboard) / Disabled
- Loading (skeleton, not spinner-in-empty-space, for anything that fetches data)
- Empty (see reticle empty-state pattern, §3)
- Error (inline, specific — "Image must be under 50MB," not "Upload failed")
- Success/confirmation feedback for every write action (add employee, submit feedback, save settings — each needs a visible acknowledgment, not a silent success)

Before marking any screen done, run it against this checklist. A component missing its error or empty state is not production-ready even if the happy path looks polished.

---

## 6. Screen-by-Screen Brief

Build in this order — foundation first, then pages (matches `04_Frontend.md` structure):

1. **Design system foundation:** `index.css` tokens (§2), base components (Button, Card, Badge, Modal, Toast, Table, Input) with full state coverage (§5). *(Assign: Pro High)*
2. **Navbar/Sidebar:** persistent left rail (desktop) collapsing to bottom tabs (mobile, per existing `Navbar.jsx` responsibility). Org name + role badge visible at top, matching RBAC roles from the SaaS blueprint.
3. **DashboardPage:** KPI cards using the mono utility face for numbers, system health status (from `/api/health`) shown as a calm status line, not an alarming red/green wall.
4. **LiveAttendancePage:** the grid, reticle-corner hover cards, real-time slide-in for new arrivals (§4).
5. **AttendancePage:** dense data table, sticky header, CSV export button, filter bar — this is the "spend hours looking at this" screen, prioritize scan-ability over decoration.
6. **TestPage + Feedback Modal:** the actual camera/upload flow with the CONFIRMED/NOT FOUND interaction (§4) as the centerpiece — this is the moment that sells the product in a demo, give it the most polish.
7. **ManagePersonPage / Add Person (single + bulk):** form with inline validation, drag-drop image upload with per-image thumbnail + blur-quality indicator (ties to the enrollment quality gate from the SaaS blueprint §5), bulk CSV upload with the per-row success/failure report.
8. **TrainingPage:** live SSE progress bar for retraining, styled as a calm progress indicator, not a loading-screen-style blocker.
9. **Settings/Org Admin:** threshold tuning, RBAC user management table, deployment mode toggle (cloud/local/hybrid).
10. **Login:** minimal, single reticle-frame signature moment on the mark/logo, everything else restrained — first impression sets the tone for "precise instrument."

---

## 7. Acceptance Checklist (verify before accepting any agent output)

- [ ] No gradient backgrounds outside the reticle motif
- [ ] Every interactive element has visible keyboard focus (test with Tab, not just mouse)
- [ ] `prefers-reduced-motion` respected — test with it enabled
- [ ] Every async component has a loading skeleton, not a blank flash
- [ ] Every form has inline, specific error states
- [ ] Mobile breakpoint tested down to ~375px width, not just resized desktop
- [ ] CONFIRMED/NOT FOUND interaction feels distinct and instant, not just recolored
- [ ] Data tables remain legible and don't reflow awkwardly with 50+ rows
- [ ] No component uses inline styles or hardcoded hex values outside `index.css` tokens
