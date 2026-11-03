---
name: accessibility
description: >-
  Audit and implement web accessibility standards adhering to WCAG 2.1 AA/AAA requirements, ARIA attributes, and keyboard navigation.
---

# Accessibility (a11y) & WCAG 2.1 AA Standard

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


---

## Skill Metadata
- **Category**: Product and Frontend
- **Authoritative Reference**: W3C Web Content Accessibility Guidelines (WCAG) 2.1; WebAIM Standards
- **License**: W3C Open Standard
- **Scope**: Workspace Agent Skill (`.agents/skills/accessibility`)
