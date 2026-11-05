# AuraPass™ Enterprise — Public Experience Page Inventory
**Scope**: All Public-Facing and Semi-Public Application Surfaces  
**Last Updated**: November 5, 2026  
**Auditor**: Principal Product Designer & Senior Frontend Architect

---

## 1. Master Route & Component Inventory

| Route URL | File Path | Component Name | Production Status | Header / Navigation | Theme Support | Core Libraries | Key Deficiencies / Bugs |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `frontend/src/pages/LandingPage.jsx` | `LandingPage` | **Active** | Dedicated Pop.site header (Theme toggle, auth state button) | Dual (Light & Dark) | `framer-motion`, `lucide-react`, `marketing.css` | No mobile menu drawer; toy simulated punch card instead of live trial; currency locked to ₹; orphaned sections. |
| `/docs` | `frontend/src/pages/DocsPage.jsx` | `DocsPage` | **Active** | Custom Docs header with `Scan` icon & `v2026.2-lts` badge | **Dark Only** (Hardcoded `#06090B`) | `react-markdown`, `remark-gfm`, `rehype-slug`, `lucide-react` | Ignores Light theme; brand logo mismatch (`Scan` vs `Shield`); right TOC rail hidden on $< 1280\text{px}$; no employee privacy guide. |
| `/support`<br>`/help` | `frontend/src/pages/SupportPage.jsx` | `SupportPage` | **Active** | Custom Support header (`Scan` icon, only 2 nav links) | **Dark Only** (Hardcoded `#06090B`) | `lucide-react`, `marketing/Button`, `marketing/Container` | Ignores Light theme; ticket submission form uses mock `setTimeout` without persisting to backend API; missing landing nav links. |
| `/privacy`<br>`/privacy-policy` | `frontend/src/pages/PrivacyPolicyPage.jsx` | `PrivacyPolicyPage` | **Active** | Legal header with Print button and mobile TOC toggle | **Dark Only** (Hardcoded `#06090B`) | `lucide-react`, custom print CSS | Ignores Light theme; print button crowds mobile viewport; body text is dense `text-[13px]`. |
| `/terms`<br>`/terms-and-conditions` | `frontend/src/pages/TermsPage.jsx` | `TermsPage` | **Active** | Legal header with Print button and mobile TOC toggle | **Dark Only** (Hardcoded `#06090B`) | `lucide-react`, custom print CSS | Ignores Light theme; print button crowds mobile viewport; dense typography. |
| `/login` | `frontend/src/pages/LoginPage.jsx` | `LoginPage` | **Active** | Auth header (`Scan` icon + "Secure Sign In" badge) | **Dark Only** (Hardcoded `#0A0D14`) | `lucide-react`, `framer-motion` | Ignores Light theme; "Sign in with Google" button throws fake client error; fictional testimonial carousel. |
| `/register` | `frontend/src/pages/RegisterPage.jsx` | `RegisterPage` | **Active** | Auth header (`Scan` icon + "Enterprise Onboarding") | **Dark Only** (Hardcoded `#0B0F19`) | `lucide-react`, `framer-motion` | Ignores Light theme; fictional testimonial carousel; lacks plan pre-selection from pricing tier. |
| `*` | `frontend/src/pages/NotFoundPage.jsx` | `NotFoundPage` | **Active** | Custom 404 header (`Shield` icon + `LTS v2026.2`) | **Dark Only** (Hardcoded `#06090B`) | `framer-motion`, `lucide-react` | Ignores Light theme; displays `Press ⌘K` on mobile devices where no Command key exists; custom non-standard header. |

---

## 2. Missing Public Surfaces (Not Implemented in Routing)

The marketing copy, documentation, and stakeholder guidelines describe product capabilities that do not have dedicated public routes in `frontend/src/App.jsx`:

| Target Surface | Expected Route | Current Placement | Deficiencies in Current State | Priority for Creation |
| :--- | :--- | :--- | :--- | :--- |
| **Product Overview & Features** | `/features` | Reduced to `#features` on Landing | Only 3 brief cards on landing page. Lacks camera compatibility matrix (Hikvision, Dahua, Axis, CP Plus, Webcams), RTSP/ONVIF specs, and hardware acceleration benchmarks. | **High** |
| **How It Works (Pipeline)** | `/how-it-works` | Reduced to `#how-it-works` on Landing | Only 3 text steps. Lacks an interactive visual architecture illustrating RTSP frame buffer $\rightarrow$ BlazeFace $\rightarrow$ FaceNet512 tensor math $\rightarrow$ GPIO pulse. | **High** |
| **3D Interactive Simulator** | `/simulator` | Not Implemented | Only a 2D text input on the landing page that renders a static card. Lacks an interactive 3D turnstile simulator, webcam test, or virtual access gate. | **High** |
| **Dedicated Pricing Matrix** | `/pricing` | Reduced to `#pricing` on Landing | 3 cards without detailed feature breakdown, FAQ, enterprise SLA tiers, annual discount toggle, or multi-currency support (USD / INR). | **High** |
| **Security, Privacy & Trust** | `/security` or `/trust` | Split between `/privacy` and `/docs` | No dedicated page for CISO / Security Officer evaluation explaining local data isolation, cryptographic non-inversion, air-gapped deployment, and penetration testing benchmarks. | **High** |

---

## 3. Orphaned Component Inventory (`frontend/src/components/landing/`)

The following files exist in `frontend/src/components/landing/` but are **never imported or rendered** by any active page in the project:

| Orphaned File | Description / Intended Purpose | Size / Complexity | Action Required |
| :--- | :--- | :--- | :--- |
| `BentoGrid.jsx` | 6-card bento grid with technical telemetry and live charts. | 145 lines | Audit and integrate into dedicated `/features` page. |
| `HeroReticleCanvas.jsx` | Canvas-based technical targeting reticle with coordinate overlays. | 78 lines | Refactor for lightweight SVG or incorporate into Hero visual. |
| `PipelineSection.jsx` | 5-step technical biometric pipeline diagram. | 132 lines | Integrate into new `/how-it-works` page. |
| `ProofWidget.jsx` | Interactive client-side biometric proof widget. | 110 lines | Adapt for `/simulator` or landing demonstration. |
| `SovereigntySection.jsx` | Air-gapped on-premise architecture diagram & DPDP Act compliance. | 125 lines | Integrate into new `/security` trust page. |
| `StatsSection.jsx` | 4-column enterprise metric showcase (99.4% LFW, 184ms latency, etc.). | 62 lines | Clean up and re-use on landing page. |
| `FaqSection.jsx` | Standalone FAQ component with accordion. | 95 lines | Duplicate of inline FAQ in `LandingPage.jsx`; consolidate into shared primitive. |
| `FinalCta.jsx` | Bottom conversion banner with registration links. | 45 lines | Consolidate with unified footer. |

---

## 4. Shared Public UI Primitives (`frontend/src/components/ui/marketing/`)

| Primitive Component | Location | Usage | Status |
| :--- | :--- | :--- | :--- |
| `Button.jsx` | `src/components/ui/marketing/Button.jsx` | Used only in `SupportPage.jsx` | Inconsistent with main Radix `button.tsx` and inline Tailwind buttons. |
| `Container.jsx` | `src/components/ui/marketing/Container.jsx` | Used in `DocsPage.jsx`, `SupportPage.jsx` | Standard responsive container (`max-w-6xl mx-auto px-4 sm:px-6`). Good utility. |
| `Eyebrow.jsx` | `src/components/ui/marketing/Eyebrow.jsx` | Used only in `SupportPage.jsx` | Monospace uppercase badge with emerald dot. Useful for technical SaaS. |
| `MarkdownRenderer.jsx` | `src/components/ui/marketing/MarkdownRenderer.jsx` | Used only in `DocsPage.jsx` | Core markdown rendering engine. High quality. |
| `TableOfContents.jsx` | `src/components/ui/marketing/TableOfContents.jsx` | Used only in `DocsPage.jsx` | TOC rail with active heading observer. |
| `Section.jsx` | `src/components/ui/marketing/Section.jsx` | Used only in `SupportPage.jsx` | Basic section wrapper. |
| `Accordion.jsx` | `src/components/ui/marketing/Accordion.jsx` | **Unused (0 imports)** | Orphaned. |
| `Badge.jsx` | `src/components/ui/marketing/Badge.jsx` | **Unused (0 imports)** | Orphaned. Duplicate of Radix `badge.tsx`. |
| `Callout.jsx` | `src/components/ui/marketing/Callout.jsx` | **Unused (0 imports)** | Orphaned. |
| `CodeBlock.jsx` | `src/components/ui/marketing/CodeBlock.jsx` | **Unused (0 imports)** | Orphaned. Syntax highlighting logic unused. |
| `FeedbackWidget.jsx` | `src/components/ui/marketing/FeedbackWidget.jsx` | **Unused (0 imports)** | Orphaned. |
| `SectionHeader.jsx` | `src/components/ui/marketing/SectionHeader.jsx` | **Unused (0 imports)** | Orphaned. |
| `Tabs.jsx` | `src/components/ui/marketing/Tabs.jsx` | **Unused (0 imports)** | Orphaned. Duplicate of Radix `tabs.tsx`. |

