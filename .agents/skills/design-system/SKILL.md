---
name: design-system
description: >-
  Architect and maintain atomic UI components, design tokens, typography scales, and CSS utility variables.
---

# Design System Architecture

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


---

## Skill Metadata
- **Category**: Product and Frontend
- **Authoritative Reference**: Atomic Design (Brad Frost); Radix UI Design Primitives
- **License**: MIT
- **Scope**: Workspace Agent Skill (`.agents/skills/design-system`)
