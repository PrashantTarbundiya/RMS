# AuraPass™ Enterprise — Design System Specification (Phase 1)
**Version**: 2026.2 (Phase 1 Foundation)  
**Authority**: Principal Design Systems Engineer & Senior Product Designer  
**Foundations**: Apple Human Interface Guidelines (Translucent Materials & Liquid Glass), Emil Kowalski Motion Engineering, WCAG 2.1 AA/AAA Accessibility

---

## 1. Design Philosophy & Aesthetic Principles

AuraPass™ Enterprise balances two critical imperatives:
1. **Sovereign Enterprise Credibility**: Calm, dense, readable, high-trust engineering precision. No cartoonish floating blobs, rainbow gradients, or glowing neon slop.
2. **Apple-Inspired Fluidity & Restrained Liquid Glass**: Tactile surfaces, specular edge reflections, direct spatial manipulation, instant feedback on press, and compositor-friendly motion.

```
Core Rule: "Restrained Liquid Glass"
• USE GLASS for: Top navigation chrome, floating action toolbars, modal overlays, interactive preview chips.
• KEEP SOLID for: Documentation bodies, long legal prose, high-density data tables, and forms.
```

---

## 2. Typography System

### 2.1 Font Family Hierarchy
- **Primary Typeface**: `Plus Jakarta Sans` with system font fallbacks:
  ```css
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  ```
- **Technical & Monospace Typeface**: `JetBrains Mono` for code, telemetry, IP addresses, latencies, and vector coordinates:
  ```css
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
  font-variant-numeric: tabular-nums;
  ```

### 2.2 Complete Type Scale & Rhythm

| Token / Role | Target Size | Line Height | Letter Spacing | Font Weight | CSS Class |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | `clamp(2.25rem, 5vw + 1rem, 3.75rem)` (36px–60px) | `1.08` | `-0.025em` | 800 (Extrabold) | `.display-hero` |
| **Section Title** | `clamp(1.75rem, 3vw + 0.5rem, 2.5rem)` (28px–40px) | `1.15` | `-0.02em` | 700 (Bold) | `.section-heading` |
| **Card Header** | `1.25rem` (20px) | `1.30` | `-0.015em` | 600 (Semibold) | `text-xl font-semibold tracking-tight` |
| **Subheading / Lead** | `clamp(1rem, 1.2vw + 0.5rem, 1.25rem)` (16px–20px) | `1.60` | `-0.01em` | 400 (Regular) | `.subheading-lead` |
| **Body (Readable)** | `0.9375rem` (15px) | `1.68` | `0` | 400 (Regular) | `.body-readable` (`max-w-[65ch]`) |
| **Secondary / Meta** | `0.8125rem` (13px) | `1.50` | `0` | 400 / 500 | `text-xs text-muted-foreground` |
| **Eyebrow / Category** | `0.75rem` (12px) | `1.00` | `0.05em` | 600 (Semibold) | `.eyebrow-chip` (`uppercase`) |
| **Captions / Legal Footers** | `0.6875rem` (11px) | `1.40` | `0` | 400 (Regular) | `text-[11px] text-muted-foreground` |
| **Tabular Numbers / Telemetry** | `0.75rem` to `0.875rem` | `1.20` | `0` | 500 (Medium) | `.font-mono-tabular` |

> [!NOTE]
> All long-form paragraph content is bounded to `max-width: 65ch` (`.body-readable`) to prevent fatigue and excessive horizontal eye movement. Large display headlines enforce `text-wrap: balance`.

---

## 3. Color & Surface Token System

AuraPass enforces a strict, predictable dual-theme model. The public experience leads with a pristine **Slate-50 light canvas** while supporting a deep **neutral Zinc-950 obsidian dark canvas**.

### 3.1 Light Mode Tokens (`:root`, `.light`)
- `--bg-0`: `#F8FAFC` (Slate-50 Page Background)
- `--bg-1`: `#F1F5F9` (Slate-100 Section & Sub-surface Fill)
- `--bg-2`: `#FFFFFF` (Pure White Card Surface)
- `--bg-3`: `#E2E8F0` (Slate-200 Active/Hover Surface)
- `--border`: `#E2E8F0` (Hairline boundary)
- `--border-strong`: `#CBD5E1` (High-contrast boundary)
- `--text-1`: `#0F172A` (Slate-900 Display Text — 15:1 contrast against white)
- `--text-2`: `#334155` (Slate-700 Body Text — 9:1 contrast)
- `--text-3`: `#64748B` (Slate-500 Muted Copy — 4.6:1 contrast, passes WCAG AA)
- `--accent`: `#059669` (Emerald-600 Primary Accent — passes WCAG AA on white)
- `--accent-hover`: `#047857` (Emerald-700)
- `--accent-soft`: `rgba(5, 150, 105, 0.08)`

### 3.2 Dark Mode Tokens (`.dark`)
- `--bg-0`: `#09090B` (Zinc-950 Neutral Obsidian)
- `--bg-1`: `#121215` (Zinc-900 Sub-surface)
- `--bg-2`: `#18181B` (Zinc-900 Elevated Card)
- `--bg-3`: `#27272A` (Zinc-800 Active/Hover Surface)
- `--border`: `rgba(255, 255, 255, 0.08)` (Subtle hairline)
- `--border-strong`: `rgba(255, 255, 255, 0.16)`
- `--text-1`: `#FAFAFA` (Zinc-50 Crisp White — 18:1 contrast)
- `--text-2`: `#D4D4D8` (Zinc-300 Body Text — 12:1 contrast)
- `--text-3`: `#A1A1AA` (Zinc-400 Muted Copy — 6.8:1 contrast)
- `--accent`: `#10B981` (Emerald-500 Radiant Accent — 8.5:1 on dark)
- `--accent-hover`: `#34D399` (Emerald-400)
- `--accent-soft`: `rgba(16, 185, 129, 0.12)`

### 3.3 Semantic Status & Alert Tokens

| Status | Semantic Role | Light Mode Value | Dark Mode Value |
| :--- | :--- | :--- | :--- |
| **Success / Validated** | Verified Match, Liveness OK | `#059669` (`bg-emerald-500/10`) | `#10B981` (`bg-emerald-500/10`) |
| **Warning / Grace** | Shift Grace Period Active | `#D97706` (`bg-amber-500/10`) | `#F59E0B` (`bg-amber-500/10`) |
| **Error / Security Alert** | Spoof Attack Flagged, Denied | `#DC2626` (`bg-red-500/10`) | `#EF4444` (`bg-red-500/10`) |
| **Info / Telemetry** | Stream Syncing, Active RTSP | `#2563EB` (`bg-blue-500/10`) | `#3B82F6` (`bg-blue-500/10`) |

---

## 4. Liquid Glass Material Language

Liquid Glass conveys functional hierarchy by letting content gently refract underneath interactive chrome.

### 4.1 Material Treatments

```css
/* 1. Navigation Glass (.glass-nav) */
background-color: var(--glass-nav-bg);
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
border-bottom: 1px solid var(--glass-border);

/* 2. Interactive Card Glass (.glass-card) */
background-color: var(--glass-card-bg);
backdrop-filter: blur(16px) saturate(160%);
-webkit-backdrop-filter: blur(16px) saturate(160%);
border: 1px solid var(--glass-border);
box-shadow: var(--shadow-card), var(--glass-specular-edge);

/* 3. Floating Pill (.glass-pill) */
background-color: var(--accent-soft);
backdrop-filter: blur(12px) saturate(160%);
border: 1px solid rgba(16, 185, 129, 0.22);
box-shadow: inset 0 1px 0 0 var(--accent-specular);
```

### 4.2 Specular Highlights & Edge Reflections
To avoid flat "transparent gray" boxes, all glass surfaces include a calibrated **specular top highlight**:
- Light: `inset 0 1px 0 0 rgba(255, 255, 255, 0.90)`
- Dark: `inset 0 1px 0 0 rgba(255, 255, 255, 0.09)`
This creates the physical illusion of ambient light catching the bevel of the glass.

### 4.3 Accessibility Fallbacks
- `@supports not (backdrop-filter: blur(1px))`: Surfaces render with opaque fallback `background-color: var(--bg-2)`.
- `@media (prefers-reduced-transparency: reduce)`: All blurs are disabled and opacity is clamped to 100% solid surfaces.

---

## 5. Motion Principles (Emil Kowalski & Apple WWDC Standards)

Motion in AuraPass serves **orientation and feedback**, never decoration.

### 5.1 Physics & Easing Curves
- **Apple Standard Spring Curve**: `cubic-bezier(0.16, 1, 0.3, 1)`
  - Used for modal reveals, drawer entries, card hover lifts, and accordion expansions.
  - Feels alive and velocity-aware without distracting bounce.
- **Micro-Interaction Duration**: `120ms` to `200ms`.
- **Layout & Sheet Duration**: `300ms` to `350ms`.

### 5.2 Direct Tactile Feedback (`.btn-tactile`)
Every button and interactive card responds on pointer-down:
```css
.btn-tactile:active {
  transform: scale(0.97);
  transition: transform 100ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

### 5.3 Eliminating Layout Thrashing
- **Zero Height/Width Animations**: Accordions animate via CSS Grid `grid-template-rows: 0fr -> 1fr` with `overflow: hidden`. This runs 100% on the GPU without triggering JavaScript reflows.
- **Zero `transition: all`**: Every transition explicitly specifies its target properties:
  `transition: transform 150ms ease, opacity 150ms ease, background-color 150ms ease;`

### 5.4 Reduced Motion Mode
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 6. Spatial System & Responsive Breakpoints

| Breakpoint | Minimum Width | Device Class | Container Max-Width | Horizontal Padding |
| :--- | :--- | :--- | :--- | :--- |
| **`xs`** | `320px` | Small Mobile (iPhone SE) | `100%` | `1rem` (16px) |
| **`sm`** | `640px` | Large Mobile / Phablets | `100%` | `1.5rem` (24px) |
| **`md`** | `768px` | Tablets (iPad Portrait) | `100%` | `1.5rem` (24px) |
| **`lg`** | `1024px` | Small Laptops / Tablets Landscape | `1024px` | `2rem` (32px) |
| **`xl`** | `1280px` | Standard Desktop Displays | `1280px` | `2rem` (32px) |
| **`2xl`** | `1400px` | Ultra-Wide Workstations | `1400px` (`max-w-7xl`) | `2rem` (32px) |

---

## 7. Component Library Blueprint

| Component | File Path | Status | Key Features |
| :--- | :--- | :--- | :--- |
| **`PublicHeader`** | `src/components/layout/PublicHeader.jsx` | **Production Ready** | Responsive liquid glass, canonical `<Shield>` logo, mobile slide-over drawer, 48px touch targets, theme toggle, and contextual auth CTA. |
| **`PublicFooter`** | `src/components/layout/PublicFooter.jsx` | **Production Ready** | 4-column enterprise trust hierarchy, live system operational status badge, compliance links, and quick theme toggle. |
| **`Button`** | `src/components/ui/marketing/Button.jsx` | **Production Ready** | Tactile scale on press (`scale(0.97)`), WCAG AAA contrast, variants: `primary`, `secondary`, `glass`, `ghost`, `outline`. |
| **`GlassCard`** | `src/components/ui/marketing/GlassCard.jsx` | **Production Ready** | Specular edge highlights, subtle blur, interactive hover lift (`-translate-y-0.5`). |
| **`Badge`** | `src/components/ui/marketing/Badge.jsx` | **Production Ready** | Dual-theme semantic colors, optional pulsing status dot, monospace typography. |
| **`Accordion`** | `src/components/ui/marketing/Accordion.jsx` | **Production Ready** | CSS Grid reflow-free transition (`grid-template-rows: 0fr -> 1fr`), full ARIA attributes. |

---

## 8. Accessibility Verification Standards (WCAG 2.1 AA/AAA)

1. **Contrast Ratio Compliance**:
   - Primary Headings (`--text-1`): $\ge 15:1$ on light, $\ge 18:1$ on dark (**AAA compliant**).
   - Body Copy (`--text-2`): $\ge 9:1$ on light, $\ge 12:1$ on dark (**AAA compliant**).
   - Muted/Secondary Text (`--text-3`): $\ge 4.6:1$ on light, $\ge 6.8:1$ on dark (**AA compliant**).
   - Primary Emerald Accent (`--accent`): `#059669` on white is $4.6:1$ (**AA compliant**); `#10B981` on dark is $8.5:1$ (**AAA compliant**).
2. **Touch Target Sizing**:
   - All mobile interactive targets enforce $\ge 44\times 44\text{pt}$ (Apple HIG) and $\ge 24\times 24\text{px}$ (WCAG 2.5.8 Target Size).
3. **Keyboard Focus Visibility**:
   - All buttons, links, and accordion headers implement:
     `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50`.

