# AuraPass Enterprise: Public Surface Redesign Brief

**Audience:** Antigravity AI agent (Gemini Flash, high reasoning)
**Scope:** Landing page, Docs, Help Center, Legal pages, and their shared components.
**Out of scope (DO NOT MODIFY):** Console / core system pages (dashboard, attendance console, departments, kiosk, telemetry, auth logic, API, backend). Those are approved.

---

## 0. How to work (read first)

1. **Inspect before editing.** Open the repo, find the router, the landing page component, the docs page, and any legal/help pages. List every file you will touch before touching it. Reuse the existing Tailwind config / CSS variables. Do not introduce a second styling system.
2. **Work in phases** (Section 12). Finish and self-verify one phase before starting the next. After each phase run the app (`localhost:5173`) and check the result at 1440px, 1024px, 768px and 390px widths.
3. **Never ship placeholder content** like "Lorem ipsum", "Feature 1", or fake logos. Use the real product facts from Section 2.
4. **Do not break the build.** Run the type check / lint / build at the end of every phase.
5. **Keep the existing brand**: dark navy background, emerald accent, monospace technical labels. We are *elevating* it, not replacing it.
6. If a requirement conflicts with an existing system page's styling, system pages win. Adapt the public pages to match them.

---

## 1. Diagnosis: what is wrong today

Based on the current screenshots, these are the problems to fix.

### Landing page
- **Generic, template-like.** Every section is "pill label + big bold heading + subtitle + grid of dark cards". There is no rhythm, no variety, no story.
- **Static.** Almost nothing moves or responds to scroll. The 3D/hardware simulator is a flat dark box with a faded screenshot inside it.
- **Hero is weak.** The headline wraps badly and leaves an orphan ("people,") on its own line. Gradient text on "not badges or plastic cards." is fine as an accent but the hero has no product visual above the fold, so the visitor cannot *see* what the product does.
- **Heading weight is too heavy and tightly tracked** (looks like faux-bold). It reduces readability and feels cheap.
- **No social proof, no clear "how it works", no comparison, no FAQ, no final conversion strip that earns the click.**
- **Pricing**: "Annual Billing SAVE 20%" is shown but only one price ($399) is displayed, and the toggle does not visibly change anything. Cards have inconsistent heights and internal spacing.
- **Trust claims read as unverifiable marketing** ("Verified Enterprise Documentation", "Production Ready", "100% offline air-gap certified"). Visitors in security/HR roles will distrust unsubstantiated badges.
- **Footer is thin** and missing contact, status, security, and social/legal basics.

### Docs
- **Markdown is not rendered.** Literal `**bold**` asterisks and raw `&NDASH;` entities are visible in the body. This is the single biggest credibility killer.
- **Entire paragraphs are ALL-CAPS monospace green.** Long content in uppercase mono is nearly unreadable. This must become normal sentence-case body text with proper lists, headings and callouts.
- Each sidebar group has only one page, so the docs feel empty. No "On this page" table of contents, no prev/next, no copy buttons on code, no last-updated date, no feedback widget.
- Search box exists but is not clearly functional.

### Legal / Help
- Must be restructured into a readable long-form layout with a sticky table of contents, effective date, version, and plain-language summaries.

---

## 2. Source of truth: product facts (use ONLY these)

Do not invent features, customers, certifications, or statistics beyond this list.

**Product:** AuraPass Enterprise: on-premise facial-recognition attendance and access verification.

**Core claims already on the site (keep, but word carefully, see Section 9):**
- Turns any standard IP camera (RTSP/ONVIF) or USB webcam into a facial verification gate.
- Verification speed under 300 ms.
- Face detection + landmarks: MediaPipe BlazeFace / FaceLandmarker. Embeddings: FaceNet512 (512-dimensional vectors).
- 100% on-premise inference; no outbound internet connection required; can run on an isolated VLAN.
- Raw images can be discarded after vectorization; only embeddings are stored.
- 3-shot enrollment: frontal 0°, left 15°, right 15°. Under 2 minutes per person; min face box 160x160 px; even lighting.
- Anti-spoofing / liveness detection (photo and screen replay rejection), glasses and mask tolerance.
- Real-time attendance timeline, on-time / late / early-departure statuses with per-department grace periods (e.g. 15 min), CSV / Excel / PDF export for payroll.
- Department rostering with custom shift policies (6 configured department shifts in demo).
- Camera support: Hikvision, Dahua, Axis, Hanwha, Logitech USB; protocols RTSP, ONVIF, UVC USB. Auto stream reconnect, substream bandwidth tuning, multi-camera mosaic.
- Relay / turnstile integration (hardware triggers, GPIO, digital relays).
- Kiosk terminal mode.
- Storage: SQLite (Starter), PostgreSQL with auto-backup (Business).
- Compliance posture: designed to support GDPR Art. 9, Illinois BIPA, CCPA/CPRA obligations.
- **Pricing:**
  - Starter $0 forever: up to 200 enrolled employees, up to 5 camera streams, SQLite, sub-300ms verification, daily logs and CSV export.
  - Business $399 / facility / month: up to 5,000 employees, unlimited RTSP lanes, PostgreSQL + auto-backup, tamper-evident audit logs, department grace periods and roster rules, priority 2-hour SLA email and phone support.
  - Custom Enterprise: 50,000+ vector capacity, pre-configured 1U rackmount appliances, custom turnstile GPIO integration, 100% offline air-gapped updates, dedicated solutions architect.
  - Annual billing = 20% off. Compute: $399 x 0.8 = **$319 / facility / month billed annually**. The toggle must actually switch the displayed price.
- Version string: Local On-Premise Engine v2026.2.

If something is needed that is not listed (e.g. customer logos, testimonials), **leave it out or use a clearly labeled placeholder component that is hidden behind a `SHOW_SOCIAL_PROOF = false` flag**. Never fabricate.

---

## 3. Design system (extend, do not replace)

Create or extend a single token file (CSS variables in the global stylesheet and mirrored in the Tailwind theme). Extract exact values from the existing console where possible; the values below are the target if not already defined.

```css
:root {
  /* surfaces */
  --bg-0: #070A12;        /* page background (deepest) */
  --bg-1: #0B0F19;        /* section background */
  --bg-2: #0F1524;        /* card */
  --bg-3: #141B2E;        /* raised card / hover */
  --border: rgba(148,163,184,.14);
  --border-strong: rgba(148,163,184,.26);

  /* text */
  --text-1: #F1F5F9;      /* headings */
  --text-2: #CBD5E1;      /* body */
  --text-3: #94A3B8;      /* muted */

  /* brand */
  --accent: #34D399;      /* emerald, primary CTA */
  --accent-strong: #10B981;
  --accent-soft: rgba(52,211,153,.12);
  --accent-glow: rgba(52,211,153,.35);

  /* semantic secondary (used sparingly, as tags only) */
  --violet: #A78BFA;  --amber: #FBBF24;  --cyan: #22D3EE;  --rose: #FB7185;

  /* radius, shadow, motion */
  --r-sm: 8px; --r-md: 12px; --r-lg: 20px; --r-xl: 28px;
  --shadow-card: 0 1px 0 rgba(255,255,255,.04) inset, 0 20px 50px -20px rgba(0,0,0,.6);
  --ease-out: cubic-bezier(.22,1,.36,1);
}
```

### Typography
- **Sans (UI + body):** Inter or the existing sans. Weights used: 400, 500, 600, 700. **Headings max weight 700**, not 800/900. Letter-spacing on large headings: `-0.02em` (not -0.05em).
- **Mono (technical labels only):** JetBrains Mono or the existing mono. Use ONLY for: eyebrow labels, code, hostnames, metrics, timestamps, IDs. **Never for paragraphs.**
- Scale (desktop / mobile): H1 `clamp(40px, 6vw, 72px)`, H2 `clamp(30px, 4vw, 48px)`, H3 `22px`, body `17px` on landing, `16px` in docs, small `14px`. Line-height: headings 1.1, body 1.65.
- Apply `text-wrap: balance` to all headings and `text-wrap: pretty` to paragraphs. This fixes the orphan "people," problem.
- Max paragraph width: `65ch`.

### Layout
- Container: `max-width: 1200px`, side padding `24px` (mobile) / `32px` (desktop). Docs and legal content column: `max-width: 760px`.
- Vertical section rhythm: `112px` desktop, `72px` mobile. Alternate section backgrounds subtly (`--bg-0` / `--bg-1`) and separate with a 1px gradient hairline, not heavy boxes.
- Background texture: keep the subtle dotted grid, but fade it with a radial mask so it appears behind the hero only. Add one soft emerald radial glow behind the hero visual. Remove the dull purple smear in other sections.

### Shared components to build (put in `components/ui/` or the existing equivalent)
`Button` (primary, secondary, ghost, sizes), `Badge/Eyebrow`, `Card` (with optional spotlight hover), `SectionHeader`, `Container`, `Callout` (info, success, warning, danger), `CodeBlock` (language label, copy button, line wrap toggle), `Kbd`, `Tabs`, `Accordion`, `Tooltip`, `Stat`, `Breadcrumbs`, `TableOfContents`, `Prose` (typography wrapper), `FeedbackWidget`, `AnimatedCounter`, `Reveal` (scroll-in wrapper). Every public page must use these. No one-off inline styling.

---

## 4. Motion system (premium but restrained)

Use **Framer Motion** (`motion` / `framer-motion`) for component animation. Add **Lenis** for smooth scroll only if it does not conflict with the existing layout; otherwise skip it.

Rules:
- Default reveal: fade + 16px translate-up, `0.6s`, `--ease-out`, trigger once when 20% in view. Stagger children by `0.06s`.
- Hover: cards lift `-2px` with a border-color shift to `--border-strong` and a cursor-following radial "spotlight" gradient inside the card. Buttons: slight glow increase, arrow nudges `+3px`.
- Scroll-linked effects only in the hero visual, the "How it works" section, and the nav (backdrop blur increases after 8px scroll).
- Numbers count up once when visible (`AnimatedCounter`).
- **Respect `prefers-reduced-motion`**: disable translate/scale/parallax, keep simple opacity fades.
- Never animate layout properties that cause reflow; animate `transform` and `opacity` only.
- Keep total JS animation budget light. No auto-playing video backgrounds.

---

## 5. Landing page: full specification

Goal: **a visitor scrolls once and understands the whole system, believes it, and clicks "Create free account".** The page tells a story in this order:

> Problem -> Solution -> See it work -> How it works -> Capabilities -> Privacy/trust -> Integrations -> Pricing -> FAQ -> Final CTA.

Primary CTA everywhere: **"Start free"** (-> signup/org creation). Secondary: **"Watch it work"** (scrolls to the simulator). Tertiary: **"Docs"**. Do not show more than two CTAs side by side.

### 5.1 Navigation (sticky)
- Left: logo + wordmark (drop the "Enterprise" pill from the nav; move it to a small version tag in the footer).
- Center links: Product, How it works, Security, Pricing, Docs, Support. Highlight the active section while scrolling (scroll-spy).
- Right: "Sign in" (ghost) and "Start free" (primary). Replace the current "Console" button label with "Sign in" / "Open console" depending on auth state.
- Transparent at top; after scrolling it gets `backdrop-filter: blur(12px)`, a bottom hairline, and shrinks from 80px to 64px.
- Mobile: hamburger opening a full-height sheet with large tap targets and the CTA pinned at the bottom.
- Anchor links smooth-scroll with a top offset equal to the nav height.

### 5.2 Hero
- Two-column on desktop (copy left ~50%, product visual right ~50%); stacked on mobile with visual below the copy.
- **Eyebrow:** small pill: `On-premise facial attendance` with a pulsing emerald dot. (Remove "AuraPass Enterprise 2026".)
- **H1 (max 2 lines on desktop):** "Attendance that recognizes people, not badges." Accent the last words with the emerald gradient. Use `text-wrap: balance`.
- **Subhead (max 2 lines, 18-20px, `--text-2`):** "Turn any IP camera or USB webcam into a sub-300 ms face-verification gate. Everything runs on your own hardware, behind your own firewall."
- **CTAs:** `Start free` (primary, with arrow) + `See it work` (secondary with play icon that smooth-scrolls to the simulator).
- **Trust row below CTAs** (4 small items with check icons, muted): Free forever starter tier · Setup in about 10 minutes · Works offline · Hikvision, Dahua, Axis, Webcams.
- **Hero visual (the most important element):** an animated product mockup built in code (not a static PNG): a browser-frame window containing a camera viewport with a looping sequence: face-detection bracket appears -> 512-point landmark mesh draws in -> liveness check ticks -> "Verified 99.4%" chip -> a new row slides into a live attendance log at the right with an "On time" badge -> loop. Use SVG + Framer Motion. Slight 3D tilt on mouse move (max 4 degrees). Floating small stat cards around it (e.g. "<300 ms", "512-d embeddings", "0 bytes to cloud") with gentle float animation.
- Below the hero visual, a thin **logo/compatibility strip**: text-only brand names for supported hardware (Hikvision, Dahua, Axis, Hanwha, Logitech) with a "Works with the cameras you already own" label. Use text/wordmarks only; do not use copyrighted logo images.

### 5.3 "The problem" strip (short)
Three compact columns with icons, one line each, to frame pain: Badges get lost, shared and buddy-punched / Cloud face systems send employee biometrics off-site / Manual timesheets cause payroll disputes. End with a connecting line: "AuraPass fixes all three, on your own hardware." Subtle reveal animation. Keep this section under one viewport tall.

### 5.4 Interactive simulator ("See it work")
Keep the existing three scenarios but redesign the shell:
- Segmented control tabs: Standard check-in / Photo & screen spoofing / Glasses & mask.
- Left: large camera viewport. Right: a live panel with a step-by-step pipeline checklist that fills as the simulation runs (Frame captured -> Face detected -> Liveness -> Embedding (512-d) -> Match -> Gate unlocked), each with a millisecond timing that counts up and a total at the end (under 300 ms).
- Spoof scenario must visibly end in a red "Rejected: presentation attack detected" state. Glasses scenario ends green.
- The "Simulate check-in" button becomes a prominent primary button; after finishing it changes to "Run again". Add an **auto-play on first scroll-into-view** (once).
- Remove the dim/faded overlay on the preview so the content is crisp. Keep the "Zero data egress" label as a footer line of the panel.
- Status chips (IDLE / mode / latency / anti-spoofing) become a clean HUD overlay on the viewport corners.

### 5.5 How it works (scroll-driven, 4 steps)
A sticky two-column layout: left shows steps 1-4 as large numbered text; right shows a visual that changes as each step scrolls into focus (scroll-linked crossfade). On mobile, stack the steps vertically with a small visual each.
1. **Connect** your camera (RTSP/ONVIF/USB). Auto-discovery, auto-reconnect.
2. **Enroll** staff in three quick shots (0°, 15° left, 15° right). Under 2 minutes each.
3. **Verify** in under 300 ms on your own hardware, with liveness and anti-spoofing.
4. **Act**: log attendance, apply department grace rules, trigger turnstile/relay, export to payroll.
Add a thin vertical progress line connecting the steps that fills as the user scrolls.

### 5.6 Capabilities (bento grid, NOT equal cards)
Use an asymmetric bento grid (mix of 2x1, 1x1, 1x2 tiles) so the section has visual rhythm. Each tile has a tiny live micro-visual:
- **Attendance timeline & payroll export** (large): animated table rows appearing; export format chips CSV / Excel / PDF.
- **Shift policies & grace periods**: a small clock/slider showing "15 min grace".
- **3-shot enrollment**: three face-angle icons lighting up in sequence.
- **Camera orchestration**: brand chips + animated connection lines.
- **Anti-spoofing**: a photo icon being blocked with a red cross.
- **Audit logs (tamper-evident)**: scrolling log lines.
- **Relay & turnstile**: a gate icon toggling open on verification.
- **Kiosk mode**: small kiosk frame.
Each tile: 1 title (max 6 words), 1 sentence, optional tag. No more than ~20 words of copy per tile.

### 5.7 Product tour (tabs, replaces "Designed for professional enterprise administrators")
Tabs: Live attendance / Department rostering / Kiosk mode / Model telemetry. Each tab shows a **real screenshot or faithful live-rendered mockup** of the console (reuse actual console components in read-only demo mode if feasible, using static sample data) inside a browser frame, with a short caption and 3 bullet outcomes on the side. Animate tab changes with a crossfade. Remove the "Production Ready" badge; replace with "Live preview".
Replace misleading sample claims like "Today: 100% Present". Use realistic demo data (some late, one absent) so it reads as authentic.

### 5.8 Privacy & trust ("Biometric sovereignty")
This is a key conversion section for HR/security buyers. Layout: left = three principle cards; right = a **data-flow diagram** (SVG) showing Camera -> Your server (inference + vector store) -> Attendance logs, with a firewall boundary and a crossed-out cloud icon labeled "No outbound traffic". Animate dashed flow lines.
Below: a "What we store / What we never store" two-column comparison (Stores: 512-d numeric embeddings, attendance events, audit logs. Never stores: raw face photos after vectorization (configurable), anything in a public cloud, third-party tracking).
Add a compliance row with honest wording (see Section 9) linking to the Compliance docs page. Link "Read the security whitepaper" to the Security docs.

### 5.9 Integrations & deployment
Short section: supported hardware chips, protocols (RTSP, ONVIF, UVC), databases (SQLite, PostgreSQL), exports (CSV, Excel, PDF), and a "Runs on" line (Windows / Linux workstation or 1U appliance). Include a copyable one-line install/quickstart snippet in a `CodeBlock` only if it exists in the real docs; otherwise link to the Quickstart.

### 5.10 Pricing
- Working monthly/annual toggle with animated price change (number tween). Annual shows **$319** with the original **$399** struck through and a "Save 20%" badge.
- Three cards with **equal height**, identical internal structure: tier tag, name, one-line audience, price, CTA, divider, feature list. CTA buttons aligned on the same baseline across cards (use flex column with `mt-auto`).
- Business card highlighted: emerald border glow, "Most popular" badge, filled CTA. Others use secondary buttons.
- Below the cards: a collapsible **"Compare all features"** table (Starter / Business / Enterprise).
- Footnote line: "No per-scan fees. No cloud surcharges. Cancel anytime." (only if true for the business; confirm with the owner and otherwise remove "cancel anytime").
- CTA labels: "Start free", "Start Business trial" or "Get Business", "Talk to engineering".

### 5.11 FAQ
Accordion, 8-10 questions, smooth height animation, single-open. Must cover: Does any data leave my network? Which cameras work? How accurate is it and in what conditions? How do you stop photo/screen spoofing? What happens to employee photos? Is it GDPR/BIPA-ready and what do I still need to do? What hardware do I need? Can I export to payroll? What happens when I outgrow the free tier? How do I get support? Keep answers 2-3 sentences with links to the relevant doc.

### 5.12 Final CTA band
Full-width, emerald-tinted gradient panel with a subtle animated grid. Headline: "Start verifying faces in about 10 minutes." Primary: "Create free account". Secondary: "Read the docs". Beneath: "No credit card required."

### 5.13 Footer
Four-plus columns: Brand + one-line description + system status dot (link to status page if one exists) · Product · Documentation · Company/Support (Help center, Contact, Security) · Legal. Bottom bar: copyright, version tag `On-premise engine v2026.2`, language/region if applicable. Add "Back to top" button.

### 5.14 Page-level UX
- Add a slim top scroll-progress bar in the accent color.
- Add a **sticky mobile CTA bar** (appears after the hero is out of view, hides near pricing/final CTA).
- Update `<title>` and meta description, add Open Graph and Twitter tags, a favicon set, and `theme-color`.
- Lazy-load below-the-fold visuals. Aim for Lighthouse: Performance >= 90, Accessibility >= 95, SEO >= 95 on the landing page.

---

## 6. Documentation: full specification

### 6.1 Layout
Three-column desktop layout:
- **Left sidebar (280px):** grouped navigation, collapsible groups, active page highlighted with an accent left border, scroll position remembered. Sticky below the header.
- **Center content:** `Prose` column, max 760px.
- **Right rail (220px):** "On this page" table of contents generated from `h2`/`h3`, with scroll-spy highlighting, and a "Was this helpful?" widget plus "Edit/Report an issue" link.
- Tablet: right rail hidden. Mobile: sidebar becomes a slide-over drawer opened by a "Menu" button; ToC becomes a collapsible "On this page" dropdown at the top of the article.

### 6.2 Header
Logo + "Docs" + version selector (v2026.2), search with a `Ctrl/Cmd + K` command palette (fuzzy search over page titles and headings; use `fuse.js` or similar on a pre-built index), "Help center" and "Open console" links, theme-consistent.

### 6.3 Rendering (critical fix)
- Render all doc content through a real Markdown pipeline: `react-markdown` + `remark-gfm` + `rehype-slug` + `rehype-autolink-headings` + `rehype-raw` (only if needed and content is trusted) + a syntax highlighter (`shiki` or `rehype-highlight`).
- **Convert all content to proper Markdown or MDX.** Replace literal `**text**` with real bold, `&NDASH;` with a true en dash, numbered "1. 2. 3." pseudo-lists with real ordered lists, and "- -" pseudo-bullets with real unordered lists.
- **Remove the ALL-CAPS mono paragraph styling entirely.** Body text is sentence-case Inter. Mono is for inline code and code blocks only.
- Style: `h1` 40px, `h2` 28px with a top border and 56px top margin, `h3` 20px, inline `code` with a subtle chip background, tables with sticky headers and zebra rows, blockquotes as callouts, images with captions.
- Heading anchors: a `#` link appears on hover; clicking copies the URL.
- Code blocks: language label, copy button with "Copied" feedback, optional filename tab, horizontal scroll (never wrap by default).
- Callout component variants (Note, Tip, Important, Warning) with icon and colored left border. The existing "Air-gap certification" green box becomes a `Callout` using careful wording.

### 6.4 Page chrome
Each page gets: breadcrumbs, title, one-sentence summary, "Last updated" date, estimated read time, then content, then **Previous / Next** cards, then feedback widget.
Remove the "Verified Enterprise Documentation" badge from every page. Replace with a small "Updated <date> · v2026.2" meta line.

### 6.5 Content depth (fill the thin sidebar)
Expand the sidebar so no group has a single page. Write real content (drawn only from Section 2 facts) for at least:

- **Getting started:** Overview and architecture (add a diagram), Hardware & OS requirements (table), 5-minute quickstart (numbered steps + code), Core concepts (embeddings, thresholds, liveness, grace periods), Glossary.
- **Cameras:** Supported cameras and RTSP URL formats (table of vendor URL patterns only if accurate), USB webcams and kiosk terminals, Network and bandwidth tuning, Troubleshooting stream drops.
- **Enrollment:** 3-shot protocol (with an illustrated angle diagram), Image quality requirements, Bulk enrollment (only if the feature exists), Re-enrollment and removal.
- **Departments & rostering:** Shift schedules and grace policies (worked example: shift starts 09:00, grace 15 min, arrival 09:12 = on time), Reassigning staff, Reports and payroll export (CSV/Excel/PDF column reference).
- **Kiosk & hardware:** Kiosk terminal deployment, Relay and turnstile integration.
- **Security & compliance:** Biometric sovereignty and air-gap, Data retention and deletion, Audit logs, Compliance mapping (GDPR Art. 9, BIPA, CCPA/CPRA, with the disclaimer in Section 9).
- **API reference:** REST API overview, Authentication, Endpoints (method badge, path, parameters table, example request/response in tabs), Errors and rate limits, Webhooks (only if they exist).
- **Troubleshooting and FAQ.**

If any page's real facts are unknown to you, write the structure with clearly marked `TODO(owner)` callouts instead of inventing details, and list them in the final report (Section 13).

### 6.6 Docs landing (`/docs` index)
A real docs home: hero search, 6 quick-start cards (Quickstart, Cameras, Enrollment, Rostering, API, Security), a "Popular articles" list, and a "Need help?" strip linking to Help Center and Contact.

---

## 7. Help Center / Support: specification

- `/help` home: large search, category cards (Getting started, Cameras & hardware, Enrollment, Attendance & payroll, Billing & plans, Security & privacy, Troubleshooting), "Popular articles", and a contact panel.
- Article page uses the same `Prose` + ToC + feedback components as Docs.
- Troubleshooting articles use a consistent structure: **Symptom -> Likely cause -> Fix -> If it still fails**.
- **Contact page / form:** name, work email, company, topic select (Sales, Support, Security, Other), message, plus the plan tier. Client-side validation with inline errors, success state, and an honest response-time note matching the plans (Business: 2-hour SLA priority; others: best effort). Do not promise anything not in the pricing facts.
- Add a **System status** link/placeholder component (static "All systems operational" only if a real status source exists; otherwise omit).

---

## 8. Legal pages: specification

Pages: **Privacy Policy, Terms of Service, Biometric Data Policy (Sovereignty), GDPR & BIPA Notice, Cookie/Tracking statement** (can be a short page stating zero third-party tracking if true), and optionally Acceptable Use and DPA info.

Layout for all legal pages:
- Centered 760px article, **sticky left or right table of contents** with scroll-spy, numbered sections (`1. Introduction`, `1.1 ...`).
- Header block: Title, **Effective date**, **Last updated**, **Version**, and a "Download PDF" and "Print" button (print stylesheet: white background, black text, hide nav/footer).
- A **"Plain-language summary"** callout at the top of each page (5-7 bullets) before the full legal text. Mark it clearly as a summary that does not replace the full text.
- Defined terms in bold on first use. Tables for data categories (Category, Purpose, Retention, Legal basis).
- A "Changes to this policy" section and a "Contact" section with a real contact placeholder (`TODO(owner): legal contact email`).
- Cross-links between related legal pages and the relevant docs pages.
- Body text 16px, line-height 1.75, high contrast. No uppercase blocks except short labels.
- **Do not invent legal commitments.** Where specific legal text, entity names, addresses, retention periods or jurisdictions are required and unknown, insert a visible `TODO(owner)` marker and list it in the final report. The agent is a UI implementer, not counsel; add a comment in the code reminding the owner to have counsel review.

---

## 9. Copy and claims guidelines (trust is the product)

Biometric buyers are skeptical. Precise, defensible wording converts better than hype.

- Replace **"mathematically impossible to reconstruct the photograph"** with: "Embeddings are designed as one-way numeric representations. AuraPass does not store raw face images after enrollment processing, and nothing leaves your network." (Absolute impossibility claims are not defensible.)
- Replace **"100% offline air-gap certified"** with: "Runs fully offline. No outbound connection required." Use the word "certified" only if a real third-party certificate exists; otherwise avoid it.
- Replace **"Regulatory Compliance Ready"** with: "Built to support GDPR Article 9, Illinois BIPA, and CCPA/CPRA requirements." Add the line: "Compliance depends on how you deploy and operate the system. See our compliance guide." Never claim "compliant" or "certified" on the product's behalf.
- Replace **"Verified Enterprise Documentation"**, **"Production Ready"**: remove.
- Accuracy: "99.4% on the LFW benchmark" is a benchmark number, not real-world accuracy. Always attach the context: "99.4% on the LFW benchmark. Real-world accuracy depends on lighting, camera placement and enrollment quality."
- Speed: "under 300 ms" should be labeled "typical end-to-end verification on recommended hardware".
- Voice: confident, plain, specific. Short sentences. Active verbs. No "revolutionize", "cutting-edge", "seamless", "next-gen", "leverage", "unlock the power of". Prefer numbers and concrete nouns.
- Headings use sentence case, not Title Case Everywhere.
- Eyebrow labels: 2-4 words, uppercase mono, small.
- Each section: one idea, one headline, one supporting sentence, then the visual.

---

## 10. Accessibility, responsiveness, SEO, performance

- WCAG 2.2 AA: text contrast >= 4.5:1 (muted text must still pass on `--bg-1`; lighten `--text-3` if it fails), visible focus rings (2px accent outline with offset), full keyboard navigation (tabs, accordion, command palette, mobile menu with focus trap and Esc to close), semantic landmarks (`header`, `nav`, `main`, `aside`, `footer`), one `h1` per page, skip-to-content link, `aria-current` on active nav, `alt` text on meaningful visuals, `aria-hidden` on decorative ones.
- Touch targets >= 44x44px on mobile.
- Test widths: 390, 768, 1024, 1440, 1920. No horizontal scroll at any width; tables and code scroll inside their own containers.
- Each route sets its own `<title>`, meta description, canonical, and OG tags (use `react-helmet-async` or the router's head API). Add `sitemap.xml` and `robots.txt` entries for public pages. Add JSON-LD `SoftwareApplication` on the landing page.
- Fonts: self-host or `font-display: swap`; preload the primary weight. Images: modern formats, explicit width/height to prevent layout shift. Code-split docs and legal routes. Avoid heavy libraries on the landing page bundle (no full icon packs; import individual icons).
- The router should handle deep links and scroll restoration; hash links (`/docs#section`) must scroll correctly.
- A branded 404 page with search and links back to Home and Docs.

---

## 11. Consistency with the system pages

- Use the same tokens, radius, border color, button styles, badge styles and icon set (Lucide) as the console.
- Landing page "Sign in / Open console" and "Start free" must route to the real auth flow.
- Visual language bridge: the console's cards and tables should look like the product screenshots in the landing page tour, so the promise matches the product.
- Do not use different green shades across pages. One `--accent`.

---

## 12. Execution plan (do in this order)

**Phase 1: Foundations.** Audit repo. Consolidate tokens. Build shared UI components (Section 3) and the motion helpers. Add `Prose`. Global typography fixes (heading weight, tracking, `text-wrap`). Verify nothing in the console changed visually.

**Phase 2: Docs and Help.** Build the 3-column docs layout, the Markdown pipeline, TOC, search palette, callouts, code blocks, prev/next, feedback. Migrate and fix existing content (remove asterisks, entities, uppercase). Expand the sidebar content per 6.5. Build `/docs` home and `/help`.

**Phase 3: Legal.** Build the legal layout, TOC, summary callouts, print styles, and the pages with `TODO(owner)` markers.

**Phase 4: Landing page.** Implement 5.1 to 5.14 section by section, top to bottom. Build the hero animation and the simulator last within the phase, after the static structure is in place.

**Phase 5: Polish and QA.** Responsive pass, reduced-motion pass, accessibility pass, Lighthouse, link check (every nav/footer/CTA link must resolve), 404 page, meta tags.

After each phase: build, run, and visually review at the four widths.

---

## 13. Deliverables and final report

At the end, output a short report containing:
1. List of files created/modified.
2. Any new dependencies added (keep them minimal and justify each).
3. All `TODO(owner)` items that need a human (legal contact, entity name, retention periods, unverified claims, missing real screenshots).
4. Copy changes made for claim safety (Section 9) so the owner can approve them.
5. Known limitations.

## 14. Definition of done (checklist)

- [ ] Console/system pages unchanged and still working.
- [ ] Landing page follows the 13-section story, with working animated hero, interactive simulator, scroll-driven "How it works", bento capabilities, working pricing toggle, FAQ, final CTA, full footer.
- [ ] No orphan words in headings; headings are weight <= 700 with sane tracking.
- [ ] Docs render real Markdown: zero literal `**`, zero `&NDASH;`, zero ALL-CAPS paragraphs.
- [ ] Docs have sidebar, "On this page" ToC, Cmd/Ctrl+K search, copy buttons, prev/next, feedback, last-updated.
- [ ] Help center and contact form exist and validate.
- [ ] Legal pages have effective date, version, ToC, plain-language summary, print styles.
- [ ] All unverifiable claims replaced with defensible wording.
- [ ] All pages responsive 390-1920px, keyboard accessible, reduced-motion safe.
- [ ] Lighthouse landing page: Perf >= 90, A11y >= 95, SEO >= 95.
- [ ] Every link and CTA resolves; 404 page exists.
- [ ] Production build passes with no type or lint errors.
