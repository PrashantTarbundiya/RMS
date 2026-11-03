import os

SKILLS_DIR = os.path.abspath(".agents/skills")
os.makedirs(SKILLS_DIR, exist_ok=True)

frontend_skills = [
    {
        "name": "ui-ux-pro-max",
        "description": "Design and review high-conversion, professional enterprise SaaS UI/UX using established design systems, typography hierarchy, and visual harmony.",
        "category": "Product and Frontend",
        "reference": "nextlevelbuilder/ui-ux-pro-max-skill; Refactoring UI (Wathan & Schoger)",
        "license": "MIT",
        "content": r"""# UI/UX Pro Max Engineering Standard

## Purpose & Scope
Elevates raw user interfaces into world-class commercial SaaS experiences with refined visual hierarchy, balanced contrast, and restrained modern styling.

## Design Principles
1. **Visual Hierarchy**:
   - Establish primary, secondary, and tertiary information tiers using font weight, scale, and color rather than heavy border lines.
2. **Color System**:
   - Canvas: Deep OLED Black (`#07090E`, `#0F1011`).
   - Surface / Cards: `#141517` with subtle `#23252A` border hairlines.
   - Primary Accent: Enterprise Electric Blue (`#2563EB`, hover `#1D4ED8`).
   - Success / Warning / Danger: `#34D399` / `#FBBF24` / `#F87171`.
3. **Restraint Over Decoration**:
   - Avoid garish full-screen gradients and thick glassmorphism blurs that degrade mobile performance.
   - Use subtle ambient glow accents (`blur-3xl`, opacity $\le 12\%$).

## Verification Checklist
- [ ] Typography uses modern geometric sans-serif (Plus Jakarta Sans / Inter).
- [ ] Card surfaces maintain uniform inner padding ($16\text{px}$ on mobile, $24\text{px}$ on desktop).
- [ ] Action buttons have clear hover, active, focused, and disabled states.
"""
    },
    {
        "name": "responsive-design",
        "description": "Design, test, and implement fluid responsive layouts across all standard viewports from 320px to 1920px with zero horizontal scroll.",
        "category": "Product and Frontend",
        "reference": "Responsive Web Design (Ethan Marcotte); CSS Grid & Flexbox W3C Specifications",
        "license": "W3C / Open Web",
        "content": r"""# Responsive Design & Multi-Viewport Architecture

## Purpose & Scope
Ensures flawless visual rendering, component adaptation, and usability across mobile, tablet, laptop, and ultra-wide desktop displays.

## Mandatory Test Viewports
- Mobile: `320px`, `360px`, `375px`, `390px`, `414px`, `430px`, `480px`
- Tablet: `768px`, `1024px`
- Desktop: `1280px`, `1440px`, `1920px`

## Core Responsive Rules
1. **Zero Horizontal Overflow**:
   - Never allow `document.body.scrollWidth > window.innerWidth`.
   - Prevent overflow using `min-w-0` on flex children and `break-words` on long strings.
2. **Touch Targets**:
   - All interactive elements (buttons, inputs, menu triggers) must meet minimum touch target dimensions: $\ge 44 \times 44\text{px}$.
3. **Table & Data Adaptation**:
   - Mobile: Convert tabular data into stacked responsive cards or priority-column layouts.
   - Desktop: Full tabular view with sorting and pagination controls.

## Verification Checklist
- [ ] Automated viewport audit script passes 100% across all 11 target widths.
- [ ] Mobile navigation drawer smoothly animates and locks background scrolling.
- [ ] Sticky headers never obscure main page content.
"""
    },
    {
        "name": "accessibility",
        "description": "Audit and implement web accessibility standards adhering to WCAG 2.1 AA/AAA requirements, ARIA attributes, and keyboard navigation.",
        "category": "Product and Frontend",
        "reference": "W3C Web Content Accessibility Guidelines (WCAG) 2.1; WebAIM Standards",
        "license": "W3C Open Standard",
        "content": r"""# Accessibility (a11y) & WCAG 2.1 AA Standard

## Purpose & Scope
Guarantees inclusive software design accessible to individuals with visual, motor, auditory, or cognitive disabilities.

## Accessibility Requirements
1. **Color Contrast Ratios**:
   - Normal text: Minimum contrast ratio of $4.5:1$ against background.
   - Large text ($\ge 18\text{pt}$ or bold $\ge 14\text{pt}$): Minimum contrast ratio of $3.0:1$.
   - UI components & borders: Minimum contrast ratio of $3.0:1$.
2. **Keyboard Navigability**:
   - Every interactive control must be focusable via `Tab` key.
   - Visible focus rings (`focus-visible:ring-2 focus-visible:ring-[#2563EB]`).
   - Modals trap focus and close on `Escape`.
3. **Semantic HTML & ARIA**:
   - Icon-only buttons must have `aria-label` or `sr-only` text descriptions.
   - Form controls have explicitly linked `<label htmlFor="...">`.

## Verification Checklist
- [ ] Axe-core / Lighthouse Accessibility audit score $\ge 95$.
- [ ] Complete user journeys (Sign in -> View Attendance -> Filter) operable using keyboard only.
- [ ] Screen readers properly announce live camera scanning status.
"""
    },
    {
        "name": "frontend-performance",
        "description": "Optimize React and Vite performance, code splitting, asset minification, virtual scrolling, and Core Web Vitals.",
        "category": "Product and Frontend",
        "reference": "Google Web Vitals Specification; High Performance Browser Networking (Ilya Grigorik)",
        "license": "Apache-2.0",
        "content": r"""# Frontend Performance Engineering Standard

## Purpose & Scope
Maximizes client-side execution efficiency, minimizes render delays, and eliminates frame drops during real-time camera streaming.

## Target Web Vitals
- **Largest Contentful Paint (LCP)**: $\le 1.8\text{s}$
- **First Input Delay (FID) / INP**: $\le 100\text{ms}$
- **Cumulative Layout Shift (CLS)**: $\le 0.05$
- **Frame Rate during Video Streaming**: $\ge 30\text{ FPS}$

## Optimization Techniques
1. **Dynamic Code Splitting**:
   - Lazy load heavy route components (`React.lazy(() => import('./pages/...'))`).
2. **DOM Layout Thrashing Prevention**:
   - Batch DOM reads and writes; avoid interleaved `getBoundingClientRect` calls.
3. **Video Canvas Memory Management**:
   - Recycle `OffscreenCanvas` contexts; avoid generating uncollected base64 blobs in tight requestAnimationFrame loops.

## Verification Checklist
- [ ] Production build chunk sizes stay within bundle budget ($< 500\text{KB}$ per vendor chunk).
- [ ] Zero memory leaks during prolonged camera kiosk operation.
"""
    },
    {
        "name": "design-system",
        "description": "Architect and maintain atomic UI components, design tokens, typography scales, and CSS utility variables.",
        "category": "Product and Frontend",
        "reference": "Atomic Design (Brad Frost); Radix UI Design Primitives",
        "license": "MIT",
        "content": r"""# Design System Architecture

## Purpose & Scope
Centralizes design tokens, component primitives, and styling rules across AuraPass Enterprise.

## Token Hierarchy
- **Colors**: Expressed as CSS variables in `index.css` (`--canvas`, `--surface`, `--accent-primary`, `--ink`).
- **Typography Scale**: Display ($28\text{px}$), Headline ($20\text{px}$), Body ($14\text{px}$), Caption ($12\text{px}$), Mono ($11\text{px}$).
- **Elevation & Shadows**: Multi-layered dark mode shadows (`shadow-2xl shadow-black/80`).
- **Primitives**: Built on unstyled Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-switch`) styled with Tailwind CSS.

## Verification Checklist
- [ ] No hardcoded ad-hoc hex colors in page templates; all use design system tokens.
- [ ] Dark theme consistency verified across all dialogs, tooltips, and dropdown menus.
"""
    },
    {
        "name": "user-experience-review",
        "description": "Execute cognitive walkthroughs, Nielsen-Norman heuristic audits, error-prevention assessments, and user onboarding flow optimization.",
        "category": "Product and Frontend",
        "reference": "Nielsen Norman Group 10 Usability Heuristics; The Design of Everyday Things (Don Norman)",
        "license": "Public Domain",
        "content": r"""# User Experience Review Protocol

## Purpose & Scope
Systematic evaluation of usability, task completion efficiency, cognitive friction, and error recovery.

## 10 Usability Heuristics Applied
1. **Visibility of System Status**: Real-time feedback for camera connection, frame processing, and face matching.
2. **Match Between System and Real World**: Use human terminology (e.g., "Present", "On Time", "Late") rather than raw embedding distances.
3. **User Control and Freedom**: Clear emergency exits, undo actions, and modal close buttons.
4. **Consistency and Standards**: Identical interaction patterns across Dashboard, Attendance, and Settings.
5. **Error Prevention**: Confirmation dialogs for high-impact actions (deleting employee, resetting AI weights).

## Verification Checklist
- [ ] Empty states provide clear guidance on how to populate data.
- [ ] Form validation errors pinpoint the exact field with actionable recovery text.
- [ ] Onboarding wizard seamlessly guides first-time administrators.
"""
    }
]

for skill in frontend_skills:
    s_dir = os.path.join(SKILLS_DIR, skill["name"])
    os.makedirs(s_dir, exist_ok=True)
    skill_md = os.path.join(s_dir, "SKILL.md")
    content = f"""---
name: {skill["name"]}
description: >-
  {skill["description"]}
---

{skill["content"]}

---

## Skill Metadata
- **Category**: {skill["category"]}
- **Authoritative Reference**: {skill["reference"]}
- **License**: {skill["license"]}
- **Scope**: Workspace Agent Skill (`.agents/skills/{skill["name"]}`)
"""
    with open(skill_md, "w", encoding="utf-8") as f:
        f.write(content)

print(f"Generated {len(frontend_skills)} Product & Frontend skills successfully.")

