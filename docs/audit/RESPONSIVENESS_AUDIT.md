# AuraPass™ Enterprise — Responsive & Viewport Ergonomics Audit
**Authority**: Senior Frontend Architect & Accessibility Specialist  
**Standards Enforced**: WCAG 2.1 AA (Reflow 1.4.10, Target Size 2.5.5 / 2.5.8), Apple Human Interface Guidelines (44×44pt touch targets)  
**Date**: November 5, 2026

---

## 1. Breakpoint Architecture & Configuration

AuraPass utilizes standard Tailwind CSS responsive breakpoints configured in `tailwind.config.js`:

- `sm`: `640px` (Large phones & small landscape)
- `md`: `768px` (Tablets / iPad portrait)
- `lg`: `1024px` (Tablets landscape / small laptops)
- `xl`: `1280px` (Desktop displays)
- `2xl`: `1400px` (Container max-width limit)

---

## 2. Breakpoint-by-Breakpoint Evaluation

### 2.1 Mobile Viewport: 320px to 390px (iPhone SE, iPhone 14/15, Galaxy S21)

#### 1. Landing Page Navigation Collapse Failure
- **File**: `frontend/src/pages/LandingPage.jsx:105`
- **Issue**: `<nav className="hidden md:flex ...">` hides the navigation list on screens below 768px, but **provides no mobile menu trigger (`<Menu>` button or slide-out drawer)**.
- **Severity**: **CRITICAL**. On small mobile screens, the header renders only the brand logo, theme switcher, and "Start Free" button. A mobile visitor has no means to access Documentation, Support, Features, or Pricing without manually guessing URLs.
- **Correction**: Implement an accessible slide-over sheet drawer using Radix UI Dialog / Framer Motion containing full navigation links, theme toggle, and quick contact.

#### 2. Hero Interactive Input Padding Collision
- **File**: `frontend/src/pages/LandingPage.jsx:197`
- **Issue**: The hero form input uses `flex-col sm:flex-row`. While it stacks vertically, the input wrapper uses `rounded-2xl` with `p-1.5`. On 320px viewports (iPhone SE), the text inside the input touches the boundaries of the container.
- **Correction**: Set explicit `px-4 py-3 text-sm` padding and ensure min-height of 44px for touch targets.

#### 3. RTSP Terminal Mockup Header Overflow
- **File**: `frontend/src/pages/LandingPage.jsx:255-266`
- **Issue**: The window chrome header inside the mock terminal contains:
  - Three macOS traffic light dots.
  - Text: `Front Entrance Lane 01 • RTSP 1080p`.
  - Right cluster: `● 30 FPS Active` and `Latency: 184ms`.
- **Result on 360px–390px screens**: The left text collides with the right status pill, forcing awkward two-line text wrapping that pushes the camera preview down.
- **Correction**: Hide `Front Entrance Lane 01` on `< 640px`, or change the flex container to `flex-wrap` with appropriate row gap.

#### 4. Legal Document Print Button Space Squandering
- **File**: `frontend/src/pages/PrivacyPolicyPage.jsx:178` and `TermsPage.jsx:178`
- **Issue**: The legal page header displays a "Print Document" button (`window.print()`). On 375px mobile viewports, this button consumes 110px of header width, pushing the document title into ellipsis and squeezing the TOC menu button.
- **Severity**: **High**. Mobile users rarely print legal documents.
- **Correction**: Wrap the print button in `hidden sm:flex` and provide an export option inside an action menu.

---

### 2.2 Mobile Large Viewport: 391px to 480px (iPhone Plus / Pro Max, Pixel 7)

#### 1. ROI Slider Thumb Touch Collision
- **File**: `frontend/src/pages/LandingPage.jsx:463-470`
- **Issue**: The input `<input type="range" min="20" max="1000" ... />` has a thin track height (`h-2`). On touch screens, the thumb target area is approximately 20×20px, failing the Apple HIG 44×44pt and WCAG 2.5.8 (Target Size Minimum 24×24px) recommendations.
- **Correction**: Add custom CSS touch padding or use a styled Radix Slider primitive with an expanded invisible hit area (`touch-action: none; padding: 12px 0`).

#### 2. Pricing Tier Cards Horizontal Alignment
- **File**: `frontend/src/pages/LandingPage.jsx:513`
- **Issue**: Pricing cards stack in a single column (`grid-cols-1 md:grid-cols-3`). On 420px viewports, the cards stretch to 100% width, making the "Most Popular" center badge appear detached from the card corners.
- **Correction**: Bound individual pricing card widths with `max-w-md mx-auto w-full`.

---

### 2.3 Tablet Viewport: 768px to 1024px (iPad Mini, iPad Air, Surface Pro)

#### 1. Documentation Portal TOC Rail Disappearance
- **File**: `frontend/src/pages/DocsPage.jsx:672`
- **Issue**: The Table of Contents right sidebar is marked `<aside className="hidden xl:block ...">`. The `xl` breakpoint in Tailwind is `1280px`.
- **Result**: On all tablet screens (768px to 1024px) and 13-inch laptop viewports (1100px–1279px), the document body expands to fill the screen, but the on-page table of contents is **completely removed from the DOM layout**. Readers must scroll blindly through 800-line documentation articles without jump links.
- **Correction**: Display the TOC rail starting at `lg` (`1024px`), or provide a floating floating table-of-contents button on tablet viewports.

#### 2. Auth Pages Testimonial Column Cut-Off
- **File**: `frontend/src/pages/LoginPage.jsx:106` and `RegisterPage.jsx:106`
- **Issue**: The split layout is configured as `grid grid-cols-1 lg:grid-cols-12`. On tablets in portrait orientation (768px to 1023px), the entire left column (security certifications, customer testimonials, and ROI quotes) is hidden via `hidden lg:flex`. The right form takes 100% width, resulting in input fields stretching awkwardly to 740px wide unless capped by `max-w-md`.
- **Correction**: Ensure the registration form is constrained by `max-w-md mx-auto` on tablet viewports.

---

### 2.4 Desktop Viewport: 1024px to 1440px+

#### 1. Container Width Uniformity
- **File**: `frontend/src/components/ui/marketing/Container.jsx` vs `LandingPage.jsx` vs `DocsPage.jsx`
- **Issue**:
  - `LandingPage.jsx` uses `max-w-6xl` (1152px) for the navbar and features, `max-w-4xl` (896px) for the hero, and `max-w-5xl` (1024px) for the camera preview.
  - `DocsPage.jsx` uses `max-w-[1400px]` (1400px).
  - `PrivacyPolicyPage.jsx` uses `max-w-[1160px]` (1160px).
- **Result**: As a user clicks between Landing, Documentation, and Privacy Policy, the content margins and page grid shift by up to 248px left and right, creating visual instability.
- **Correction**: Standardize all public pages on a single container token: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.

---

## 3. WCAG 2.1 AA Reflow & Scrolling Audit

| Requirement | Audit Criterion | Current Status | Violation / Observation |
| :--- | :--- | :--- | :--- |
| **SC 1.4.10 (Reflow)** | No horizontal scrolling at 320px width (400% zoom at 1280px) | **PASS** | Viewport meta is set to `width=device-width, initial-scale=1.0`; no unintended fixed-width containers trigger horizontal scroll. |
| **SC 2.5.5 (Target Size)** | Minimum 44×44 CSS pixels for touch targets | **FAIL** | - Theme switcher icon button in Landing header is `p-2` with 16px icon ($\approx 32\times 32\text{px}$).<br>- ROI slider thumb is $\approx 20\times 20\text{px}$.<br>- Legal page TOC links in mobile menu are `py-1` ($\approx 28\text{px}$ high). |
| **SC 1.4.3 (Contrast)** | Minimum 4.5:1 for normal text, 3:1 for large text | **FAIL** | - `emerald-500` icon on white background in Hero is $\approx 2.9:1$.<br>- `text-white/40` timestamps in dark headers are $\approx 2.1:1$.<br>- Muted text `#64748B` on `#F8FAFC` is $4.6:1$ (marginal). |
| **SC 2.4.7 (Focus Visible)** | Visible keyboard focus ring on all interactive elements | **PARTIAL** | Input fields have `focus:ring-1 focus:ring-emerald-500`, but custom buttons and accordion triggers lack explicit `focus-visible:ring-2` styles. |

