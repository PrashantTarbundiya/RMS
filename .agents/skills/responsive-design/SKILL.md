---
name: responsive-design
description: >-
  Design, test, and implement fluid responsive layouts across all standard viewports from 320px to 1920px with zero horizontal scroll.
---

# Responsive Design & Multi-Viewport Architecture

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


---

## Skill Metadata
- **Category**: Product and Frontend
- **Authoritative Reference**: Responsive Web Design (Ethan Marcotte); CSS Grid & Flexbox W3C Specifications
- **License**: W3C / Open Web
- **Scope**: Workspace Agent Skill (`.agents/skills/responsive-design`)
