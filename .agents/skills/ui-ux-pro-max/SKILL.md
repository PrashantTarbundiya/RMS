---
name: ui-ux-pro-max
description: >-
  Design and review high-conversion, professional enterprise SaaS UI/UX using established design systems, typography hierarchy, and visual harmony.
---

# UI/UX Pro Max Engineering Standard

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


---

## Skill Metadata
- **Category**: Product and Frontend
- **Authoritative Reference**: nextlevelbuilder/ui-ux-pro-max-skill; Refactoring UI (Wathan & Schoger)
- **License**: MIT
- **Scope**: Workspace Agent Skill (`.agents/skills/ui-ux-pro-max`)
