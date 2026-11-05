# AuraPass™ Enterprise — Principal Frontend UX/UI Audit Report
**Authority**: Principal Product Designer, Senior Frontend Architect, Design Systems Lead & Accessibility Specialist  
**Target Scope**: Public-Facing Product Experience (`/`, `/docs`, `/support`, `/privacy`, `/terms`, `/login`, `/register`, `*`)  
**Audit Date**: November 5, 2026  
**Status**: READ-ONLY AUDIT (Phase 0 Complete)

---

## 1. Executive Summary & Audit Mandate

AuraPass™ Enterprise has established a functional on-premise facial biometric attendance and access engine with sub-300ms verification and zero cloud data egress. While the authenticated system console (`/dashboard`, `/attendance`, `/kiosk`, `/departments`, `/profile`, `/models`) has received focused UI repairs, the **public-facing customer journey remains deeply fragmented, disjointed, and functionally incomplete**.

The public-facing product experience currently exhibits four critical architectural deficiencies:

1. **Severe Visual and Thematic Incoherence**: The main landing page (`/`) implements a light/dark dual mode with Cal.com/Pop.site-inspired clean slate styling, whereas the documentation (`/docs`), help center (`/support`), legal documents (`/privacy`, `/terms`), and 404 page (`*`) are hardcoded to an aggressive pitch-black `#06090B` theme. A user navigating from the landing page to Docs or Legal experiences a disorienting flash of inverted contrast.
2. **Missing Core SaaS Product Surfaces**: Major product requirements referenced in enterprise marketing—including dedicated **Product Overview/Features**, **How It Works (Architectural Walkthrough)**, a **3D Interactive Simulator**, a dedicated **Pricing Matrix**, and a standalone **Security & Trust / Sovereign AI** page—do not exist as distinct routes in `App.jsx`. They are either reduced to brief anchor sections on a single landing page or completely absent.
3. **Dead Code & Orphaned Architecture**: Multiple substantial components (e.g., `frontend/src/components/landing/BentoGrid.jsx`, `PipelineSection.jsx`, `SovereigntySection.jsx`, `HeroReticleCanvas.jsx`, `ProofWidget.jsx`) were written during previous design iterations and left completely orphaned in the repository, while `LandingPage.jsx` re-implemented inline monolithic alternatives. Furthermore, heavy external packages like `gsap` (65KB+) are declared in `package.json` with zero actual imports anywhere in the codebase.
4. **Motion & Interaction Anti-Patterns**: Transitions rely on generic, uncurved Framer Motion animations (e.g., animating `height: auto` on accordion triggers causing layout reflows, using unbounded `transition-all`, scaling elements out from 0, and entirely omitting `@media (prefers-reduced-motion: reduce)` accessibility queries).

---

## 2. Architecture & Technology Stack Assessment

### 2.1 Framework & Dependencies (`frontend/package.json`)
- **Core Runtime**: React 19.2.4 + React DOM 19.2.4 (Latest modern concurrent React).
- **Build System**: Vite 8.0.1 (Rollup/Rolldown bundler; build times ~3.9s–4.2s for 2,530 modules).
- **Styling Pipeline**: Tailwind CSS 3.4.19 + Autoprefixer + PostCSS.
- **Component Primitives**: Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-select`, `@radix-ui/react-tabs`, `@radix-ui/react-switch`, `@radix-ui/react-checkbox`, `@radix-ui/react-progress`).
- **Icons**: Lucide React 0.577.0 (Unified SVG icon suite).
- **Motion Libraries**:
  - `framer-motion` 12.42.2: Active across page transitions, modals, and landing interactive widgets.
  - `gsap` 3.15.0: **CRITICAL FINDING: DEAD DEPENDENCY**. Verified via AST search across `frontend/src/`. Zero files import or call GSAP. It adds unnecessary weight to `node_modules` and risk of supply chain debt.
- **Routing**: `react-router-dom` 7.13.1 (BrowserRouter with dynamic `useLocation` and `AnimatePresence`).

### 2.2 Entry Points & Routing Structure (`frontend/src/App.jsx`)
In `App.jsx`, routing is handled via `AnimatedRoutes` wrapped in `PageWrapper`. The route inventory for public surfaces is:

```
/                       -> LandingPage.jsx (Public Landing)
/login                  -> LoginPage.jsx (GuestRoute - Split Screen Auth)
/register               -> RegisterPage.jsx (GuestRoute - Split Screen Registration)
/privacy-policy         -> PrivacyPolicyPage.jsx (Legal)
/privacy                -> PrivacyPolicyPage.jsx (Legal alias)
/terms                  -> TermsPage.jsx (Legal)
/terms-and-conditions   -> TermsPage.jsx (Legal alias)
/support                -> SupportPage.jsx (Help Center & Diagnostic Form)
/help                   -> SupportPage.jsx (Help alias)
/docs                   -> DocsPage.jsx (8-Category Engineering Documentation)
*                       -> NotFoundPage.jsx (404 Fallback)
```

**Architectural Routing Gaps (Verified Missing Routes)**:
- No `/features` or `/product` route.
- No `/how-it-works` route.
- No `/simulator` or `/3d-kiosk` route.
- No `/pricing` dedicated page.
- No `/security` or `/trust` dedicated page.

### 2.3 Global Styling & Design Tokens Collision
The project currently suffers from three competing styling paradigms operating concurrently:

1. **`frontend/src/index.css` (4,736 lines)**:
   - Defines CSS variables under `:root` and `.dark` (`--background`, `--foreground`, `--primary`, `--surface-1` through `--surface-4`, `--glass-bg`, etc.).
   - Contains thousands of legacy classes from earlier prototypes (`.glass-panel`, `.futuristic-glow`, `.neon-border`, `.aura-card`).
2. **`frontend/src/styles/marketing.css` (121 lines)**:
   - Imported at the very top of `App.jsx` (`import './styles/marketing.css'`).
   - Introduces a second set of tokens: `--bg-0`, `--bg-1`, `--bg-2`, `--bg-3`, `--text-1`, `--text-2`, `--text-3`, `--accent`, `--accent-glow`.
   - In `.dark`, sets `--bg-0: #090D16` and `--border: #1E293B` (blue-tinted slate), directly conflicting with the neutral zinc/pure obsidian tokens in `index.css`.
3. **Hardcoded Inline Hex Colors**:
   - `DocsPage.jsx`, `SupportPage.jsx`, `PrivacyPolicyPage.jsx`, `TermsPage.jsx`, and `NotFoundPage.jsx` bypass both token systems entirely, hardcoding `bg-[#06090B]`, `text-[#9AA7A3]`, `text-[#F3F6F5]`, `border-white/[0.08]`, and `text-[#3DDC97]`.

---

## 3. Page-by-Page UX/UI Audit

### 3.1 Main Landing Page (`/` — `frontend/src/pages/LandingPage.jsx`)

#### A. Visual Hierarchy & Content Flow
- **Hero Section**: Strong, unambiguous headline (*"Attendance that recognizes people, not badges."*). Good contrast in light mode between text and slate-50 canvas.
- **Interactive Quick Punch Simulator**: Allows entering a staff name and clicking "Test Live Punch". 
  - *UX Problem*: While visually responsive, it produces a simulated card with hardcoded fake telemetry (*"Rajesh Patel • EMP-0142 • 184ms • 99.4% Verified"*). Clicking the button does not trigger the browser's webcam or let the user experience actual biometric inference. First-time evaluators immediately recognize it as a static mock, which diminishes technical credibility.
- **RTSP Mock Terminal**: Shows a simulated 1080p camera feed with dashed green face box and live punch stream. Excellent contextual storytelling, but uses hardcoded dummy timestamps and employee names that do not sync with the real system kiosk.
- **Core Capabilities Bento Grid**: Three cards (Any Camera, Sub-300ms AI, Shift Rules & Payroll).
  - *UX Problem*: Visually underwhelming compared to industry SaaS leaders (Stripe, Linear, Pop.site). Icons are placed inside generic colored rounded squares (`bg-blue-500/10`, `bg-emerald-500/10`, `bg-amber-500/10`).
- **How It Works**: 3 numbered steps.
  - *UX Problem*: Pure text. Lacks visual architectural diagrams or live interactive demonstrations of RTSP stream ingestion, tensor vectorization, and GPIO relay firing.
- **ROI & Cost Calculator**: Interactive range slider (20 to 1,000 employees). Good interactive micro-utility, but calculation formulas are simplistic: `calculateHoursSaved = (count * 1.5 * 22) / 60` and `calculateHardwareSaved = count > 100 ? '₹85,000+' : '₹45,000+'`.
- **Pricing Cards**: 3 tiers (Starter ₹0, Business Pro ₹1,999/mo, Enterprise Custom).
  - *UX Problem*: Currency is hardcoded to INR (`₹`). International visitors have no USD/EUR switcher. CTA buttons go directly to `/register` without passing selected plan metadata in route state.

#### B. Navigation & Header
- **Desktop**: Clean sticky header with brand icon, version badge, anchor navigation (`Features`, `How It Works`, `Pricing`, `Docs`, `Support`), theme toggle, and CTA.
- **Mobile (< 768px)**: **CRITICAL UX FLAW**. The `<nav>` element has `className="hidden md:flex"`. There is **NO hamburger menu or mobile drawer**. On mobile phones, all navigation links disappear completely. Mobile visitors cannot navigate to Documentation, Help Center, or Pricing from the header.

---

### 3.2 Documentation Portal (`/docs` — `frontend/src/pages/DocsPage.jsx`)

#### A. Strengths
- Comprehensive, high-quality technical documentation covering 8 categories: Getting Started, Cameras, Enrollment, Rostering & Grace, Kiosks & Relays, Security, API Reference, and Technical FAQ.
- Accurate technical content: RTSP syntax, MediaPipe BlazeFace, FaceNet512 512-D tensor math, 24V DC opto-isolated GPIO relay wiring, and DPDP Act 2023 compliance.
- Functional markdown rendering with `rehype-slug`, `remark-gfm`, and custom alert callouts (`[!NOTE]`, `[!IMPORTANT]`).
- On-page Table of Contents rail and mobile navigation drawer.

#### B. Deficiencies & UX Anti-Patterns
1. **Hardcoded Dark Theme**: Uses `className="min-h-screen bg-[#06090B] text-[#9AA7A3] ..."` on line 503. It completely ignores `ThemeContext`. If a user is in Light Mode, navigating to `/docs` forces an un-toggleable pitch-black dark screen.
2. **Header Logo Inconsistency**: Uses `<Scan className="w-3.5 h-3.5" />` inside a square badge with text `AuraPass DOCS`, whereas the Landing Page uses `<Shield className="w-4 h-4" />`. Two completely different logos for the same brand.
3. **Table of Contents Rail Breakpoint**: `<aside className="hidden xl:block ...">`. On screens between 768px and 1279px (all tablets and small laptops), the right TOC rail is completely hidden, forcing users to scroll through long articles without section visibility.
4. **Search Experience**: Search filters the document tree, but results render in a floating dropdown that lacks keyboard navigation (arrow up/down, Enter to select).

---

### 3.3 Help Center & Support (`/support` — `frontend/src/pages/SupportPage.jsx`)

#### A. Strengths
- Structured category cards for hardware troubleshooting, illumination standards, turnstile relays, and data compliance.
- Interactive ticket escalation form with validation.

#### B. Deficiencies & UX Anti-Patterns
1. **Hardcoded Theme**: Hardcoded to `bg-[#06090B] text-[#9AA7A3]` with zero light mode support.
2. **Fake Ticket Dispatch**: Form submission executes `setTimeout(() => setTicketSubmitted(true), 800)`. It does not send an API request to `POST /api/support/ticket` or log to the audit database. A real enterprise user requesting deployment assistance receives a confirmation message, but no ticket is stored anywhere.
3. **Broken Navigation Links**: Header contains only two links: `Documentation` and `← System Overview`. It lacks the primary navigation links present on the landing page.
4. **Header Logo Mismatch**: Like Docs, uses `<Scan>` instead of `<Shield>`.

---

### 3.4 Legal Pages (`/privacy-policy`, `/terms` — `PrivacyPolicyPage.jsx`, `TermsPage.jsx`)

#### A. Strengths
- Detailed statutory content referencing the Digital Personal Data Protection Act 2023 (DPDP Act, India), GDPR Article 9 (Special Category Biometric Data), and ISO/IEC 30107 Presentation Attack Detection standards.
- Real mathematical explanation of 512-D vector extraction and why biometric templates cannot be inverted back into facial photographs.
- Functional section scrolling and active TOC tracking.

#### B. Deficiencies & UX Anti-Patterns
1. **Hardcoded Theme**: Hardcoded to `bg-[#06090B]` and `text-[#F3F6F5]`. Incompatible with light mode.
2. **Mobile Screen Space Waste**: The sticky top header features a large "Print Document" button (`window.print()`). On mobile viewports ($< 480\text{px}$), this button crowds out the title and TOC menu button, despite mobile users almost never printing legal policies from phones.
3. **Typography**: Font sizes for body paragraphs drop to `text-[13px]`, which is dense and fatiguing during prolonged reading.

---

### 3.5 Authentication Surfaces (`/login`, `/register` — `LoginPage.jsx`, `RegisterPage.jsx`)

#### A. Strengths
- Modern two-column split layout on desktop (`lg:grid-cols-12`) with testimonial carousel on the left and form on the right.
- Client-side validation, password visibility toggles, and clear error banners.
- Explicit, unchecked consent checkbox on registration adhering to privacy-by-design standards.

#### B. Deficiencies & UX Anti-Patterns
1. **Mock Google SSO Button**: `LoginPage.jsx` line 150 includes a "Sign in with Google" button. Clicking it executes:
   ```javascript
   onClick={() => setError('Google Workspace sign-in requires SAML configuration inside organization settings.')}
   ```
   This is a decorative, non-functional placeholder that damages user trust. If Google OAuth is not configured, the button should be removed or clearly labeled *"Enterprise SSO (Contact Admin)"*.
2. **Fictional Testimonials**: Both pages feature carousel testimonials with stock quotes and fictional personas (*"Elena Rostova - Sovereign Industrial"*, *"Dr. Marcus Vance - Apex Manufacturing"*). Repeating fictional personas across login, register, and demo streams creates an impression of an unproven product.
3. **Theme Incoherence**: Both pages are locked into a dark blue/slate theme (`bg-[#0A0D14]`, `border-[#222E4A]`) and do not respect the global light theme.

---

### 3.6 404 Error Page (`*` — `NotFoundPage.jsx`)

#### A. Strengths
- Helpful recovery options: search input, popular quick links, and "Go to Dashboard" button.
- Keyboard shortcut `⌘K` / `Ctrl+K` to focus search.

#### B. Deficiencies & UX Anti-Patterns
1. **Hardcoded Theme**: Locked into `bg-[#06090B]`.
2. **Mobile Inappropriateness**: The prompt prominently displays `Press ⌘K to search`. On mobile devices, there is no physical command key, confusing mobile users.
3. **Header Divergence**: Custom header that matches neither the landing page nor the docs header.

---

## 4. Landing Page Conversion Audit

Evaluating the landing page against the 6 fundamental conversion criteria:

| Evaluation Question | Current Status | Finding & Conversion Obstacle |
| :--- | :--- | :--- |
| **1. What does AuraPass do?** | **PASS** | Hero headline and subtitle clearly communicate on-premise facial recognition for attendance using existing cameras. |
| **2. Who should use it?** | **PARTIAL** | Mentions offices and factories in passing, but lacks clear persona-oriented value propositions (HR Managers, Facility Heads, IT Security Officers, Plant Directors). |
| **3. How does it work?** | **WEAK** | Reduced to 3 generic text steps. Lacks an interactive visual diagram explaining the edge RTSP stream $\rightarrow$ vector embedding $\rightarrow$ relay pulse sequence. |
| **4. Why is it different?** | **MODERATE** | Accurately highlights "No hardware lock-in" and "Zero cloud upload", but lacks a direct comparison matrix against conventional biometric devices (e.g. ZKTeco/eSSL fingerprint units) and cloud AI APIs. |
| **5. How is privacy protected?** | **WEAK** | The core differentiator—local vector sovereignty—is buried in small typography in the terminal mockup and FAQ. The dedicated `SovereigntySection.jsx` is orphaned and not visible on the page. |
| **6. What should the visitor do next?** | **CONFUSING** | The primary hero input invites users to "Test Live Punch", but typing a name merely shows a static mock card instead of opening a real camera trial or routing to `/kiosk`. |

---

## 5. Documentation & Stakeholder Trust Audit

Evaluating documentation readability and utility across 5 distinct target personas:

### 5.1 First-Time Administrators
- **Status**: **POOR**
- **Gap**: Lacks a visual, step-by-step "First 30 Minutes" walkthrough. An admin logging in for the first time has no clear roadmap connecting user enrollment, department scheduling, and kiosk configuration.

### 5.2 HR Managers
- **Status**: **MODERATE**
- **Gap**: While the mathematical shift grace policy is documented in `shifts-and-grace`, there is no operational guide for handling employee leaves, attendance regularization, manual punch audits, or integrating exported CSV/Excel files into payroll software like Zoho People, Tally Prime, or SAP.

### 5.3 IT Administrators & DevOps
- **Status**: **EXCELLENT**
- **Strength**: Highly detailed specifications for RTSP URL formatting, PoE switch budgets, UDP vs TCP packet loss, Docker commands, SQLite WAL modes, and PostgreSQL multi-tenant isolation.

### 5.4 Employees (The Verified Subjects)
- **Status**: **CRITICAL DEFICIENCY (ZERO COVERAGE)**
- **Gap**: There is no employee-facing guide or FAQ. Employees naturally have privacy concerns regarding facial recognition in the workplace. The documentation provides no shareable one-pager explaining:
  - *Are my photos saved?* (No, only 512-D vectors).
  - *Can anyone reconstruct my photo from the vector?* (No, non-invertible transform).
  - *Does management track my movements outside the gate?* (No, perimeter gates only).

### 5.5 Technical Installation & Field Teams
- **Status**: **GOOD**
- **Strength**: High-quality wiring diagrams for 24V DC opto-isolated dry contacts, 450ms momentary pulse duration, and fail-open vs fail-secure emergency safety overrides.

---

## 6. Design Reference Skills Audit (`emilkowalski/skills`)

We evaluated the coding environment against the authoritative design engineering skills published in [`emilkowalski/skills`](https://github.com/emilkowalski/skills):

### 6.1 Environment Status
- **Current Installation Status**: **NOT INSTALLED** in `.agents/skills/`.
- **Appropriate Installation Method**:
  1. Automated installation via the skills CLI:
     ```bash
     npx skills@latest add emilkowalski/skills
     ```
  2. Manual installation: Copy the skill directories (`emil-design-eng`, `animate`, `apple-design`, `review-animations`, `animation-performance`, `mobile-native`) into `e:\RMS\.agents\skills\`.

### 6.2 Audit Findings Against Emil Kowalski Design Principles

#### 1. Animation Curves & Timing (`animate`, `review-animations`)
- **Anti-Pattern Identified**: In `LandingPage.jsx` lines 666–670, the FAQ accordion animates `height: auto` using Framer Motion. Animating `height` triggers continuous layout reflows on the main browser thread.
  - *Kowalski Principle*: Animate composite properties only (`transform`, `opacity`). For accordions, use CSS Grid transition `grid-template-rows: 0fr -> 1fr` with `overflow: hidden`, or use Radix UI Accordion with calibrated `cubic-bezier(0.16, 1, 0.3, 1)` easing.
- **Anti-Pattern Identified**: Unbounded `transition-all` on multiple interactive buttons (`LandingPage.jsx:115, 128, 143, 207, 589`).
  - *Kowalski Principle*: Never transition all properties. Specify only the exact properties being animated (`transition: transform 150ms ease, opacity 150ms ease, background-color 150ms ease`).

#### 2. Accessibility & Reduced Motion (`animation-performance`)
- **Anti-Pattern Identified**: Complete absence of `prefers-reduced-motion` handling in Framer Motion components.
  - *Kowalski Principle*: Respect system accessibility preferences. All animated entrances must wrap transitions with `useReducedMotion()` or CSS `@media (prefers-reduced-motion: reduce)` to disable spatial movement and default to instant or simple opacity fades.

#### 3. Apple Design & Calm Aesthetics (`apple-design`, `emil-design-eng`)
- **Anti-Pattern Identified**: Oversaturated neon badge borders (`border-emerald-500/20`, `bg-emerald-500/10`) and generic rounded pill cards.
  - *Kowalski Principle*: Restraint and physical realism. Replace glowing outlines with crisp, hairline borders (`border-black/5 dark:border-white/10`), subtle specular highlights (`inset 0 1px 0 rgba(255,255,255,0.06)`), and authentic typography weight hierarchy.

---

## 7. Categorized Issue Matrix

| Issue ID | Page / Component | Exact File Path | Problem & UX Harm | Recommended Correction | Priority | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Global Navigation | `frontend/src/pages/LandingPage.jsx:105` | Nav links are `hidden md:flex` with no mobile drawer. Mobile visitors cannot access Docs, Support, or Pricing. | Implement a responsive, accessible mobile slide-over drawer with backdrop blur. | **Critical** | Medium |
| **SEC-02** | Theme System | `frontend/src/pages/DocsPage.jsx:503`<br>`SupportPage.jsx:166`<br>`PrivacyPolicyPage.jsx:61`<br>`TermsPage.jsx:59` | Hardcoded dark background `#06090B` and text colors. Completely breaks Light Mode when navigating from Landing. | Refactor all public pages to consume unified semantic design tokens (`bg-background`, `text-foreground`, etc.). | **Critical** | High |
| **SEC-03** | Core Routes | `frontend/src/App.jsx:188-250` | Missing dedicated pages for Features, How It Works, 3D Simulator, Pricing, and Security/Trust. | Architect dedicated routes with rich, interactive, standalone page components. | **Critical** | High |
| **SEC-04** | Dead Code | `frontend/package.json:29` | `gsap` is installed (65KB+) but never imported anywhere in the project. | Remove `gsap` from `package.json` and purge orphaned imports. | **Medium** | Low |
| **SEC-05** | Dead Components | `frontend/src/components/landing/*` | 6 full components (`BentoGrid`, `PipelineSection`, `SovereigntySection`, etc.) are unreferenced orphaned code. | Audit, clean up, or modularize and integrate into the main landing experience. | **High** | Medium |
| **SEC-06** | Auth Mock SSO | `frontend/src/pages/LoginPage.jsx:150-176` | Google SSO button throws a mock client-side error string when clicked. | Replace with an honest *"Sign in with Enterprise SSO"* modal or remove until SAML/OAuth backend is linked. | **High** | Low |
| **SEC-07** | Motion Performance | `frontend/src/pages/LandingPage.jsx:666` | FAQ accordion animates `height: auto` causing layout thrashing; multiple `transition-all`. | Replace with Radix Accordion or CSS grid transitions; eliminate `transition-all`. | **High** | Medium |
| **SEC-08** | Accessibility (WCAG) | `frontend/src/pages/LandingPage.jsx:165`<br>`SupportPage.jsx:176` | Subtext contrast violations (`emerald-500` on white, `text-white/40` on dark) and missing `prefers-reduced-motion`. | Enforce WCAG AA 4.5:1 minimum contrast across all labels and integrate `useReducedMotion()`. | **High** | Medium |
| **SEC-09** | Public Header | `frontend/src/components/Navbar.jsx`<br>`frontend/src/pages/DocsPage.jsx:519` | Inconsistent brand icons (`Shield` vs `Scan`), mismatched logos, and different header heights across public pages. | Build a single, authoritative `PublicHeader` component shared across all public surfaces. | **High** | Medium |
| **SEC-10** | Employee Guidance | `frontend/src/pages/DocsPage.jsx:31` | Zero documentation addressing employee privacy concerns, rights, and biometric vector security. | Author a dedicated *"Employee Privacy & Biometric Rights"* guide in the documentation tree. | **Medium** | Low |

---

## 8. Verified Findings vs. Working Premises

### Verified Findings (Empirically Confirmed)
1. `gsap` is installed in `package.json` line 29, but not a single file in `frontend/src` imports it.
2. `LandingPage.jsx` hides the navigation menu on mobile viewports ($< 768\text{px}$) with no drawer alternative.
3. `DocsPage.jsx`, `SupportPage.jsx`, `PrivacyPolicyPage.jsx`, `TermsPage.jsx`, and `NotFoundPage.jsx` use hardcoded `#06090B` backgrounds, completely ignoring the global light mode.
4. `LoginPage.jsx` line 150 contains a decorative Google login button that only triggers a local `setError` state.
5. Six components in `frontend/src/components/landing/` are orphaned and unimported.
6. The `emilkowalski/skills` package is not installed in the local environment.

### Working Premises & Assumptions
1. The backend system APIs (`/api/auth/*`, `/api/attendance/*`, etc.) are approved, operational, and must remain untouched.
2. The user desires the public experience to lead in light mode by default while supporting a flawless dark mode.
3. The pricing structure (Starter ₹0, Business Pro ₹1,999, Enterprise Custom) reflects the intended commercial model.

---

## 9. Next Steps & Implementation Sequence

To resolve these findings systematically without destabilizing core features:

1. **Phase 1A: Design Token & Shared Component Unification**
   - Harmonize `marketing.css` with `index.css`. Establish single source of truth for semantic colors in both light and dark modes.
   - Build a unified `PublicHeader` (with mobile drawer and theme toggle) and `PublicFooter` shared across all public pages.
2. **Phase 1B: Refactor Existing Public Pages to Semantic Tokens**
   - Upgrade `DocsPage.jsx`, `SupportPage.jsx`, `PrivacyPolicyPage.jsx`, `TermsPage.jsx`, and `NotFoundPage.jsx` to full dual-theme support.
3. **Phase 1C: Build Missing Dedicated Public Pages**
   - Create `/features` (Product Deep-Dive & Hardware Compatibility).
   - Create `/how-it-works` (Interactive Architectural Pipeline).
   - Create `/pricing` (Comprehensive Comparison Matrix & Currency Switcher).
   - Create `/security` (Data Sovereignty, DPDP Act Compliance & Air-Gapped Verification).
   - Create `/simulator` (Interactive Web-Camera Proof-of-Concept).
4. **Phase 1D: Motion & Polish via Emil Kowalski Guidelines**
   - Remove `gsap`. Fix accordion transitions, eliminate `transition-all`, and integrate `useReducedMotion()`.
5. **Phase 1E: Quality Gate Verification**
   - Run automated build, test responsiveness across 320px–1440px viewports, and audit WCAG AA contrast.

