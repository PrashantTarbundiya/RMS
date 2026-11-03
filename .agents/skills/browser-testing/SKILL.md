---
name: browser-testing
description: >-
  Execute automated end-to-end browser testing, DOM layout checks, and responsive viewport verification using Playwright MCP.
---

# Browser Automation & Playwright Testing Protocol

## Purpose & Scope
Automates end-to-end user journey validation, responsive viewport checks, and DOM interaction tests.

## Playwright MCP Capabilities
- Navigate to URLs (`playwright_navigate`).
- Click, fill forms, and trigger buttons (`playwright_click`, `playwright_fill`).
- Inspect page layout bounding boxes (`playwright_evaluate`).
- Capture screenshots for visual regression verification (`playwright_screenshot`).

## Mandatory Multi-Viewport Matrix
- Mobile: $320\text{px}$, $375\text{px}$, $414\text{px}$
- Tablet: $768\text{px}$, $1024\text{px}$
- Desktop: $1280\text{px}$, $1920\text{px}$

## Verification Checklist
- [ ] All pages load without console errors or unhandled exceptions.
- [ ] No elements exceed viewport width (`document.body.scrollWidth === window.innerWidth`).
- [ ] Modal dialogs and navigation drawers open and close smoothly.


---

## Skill Metadata
- **Category**: Quality Assurance
- **Authoritative Reference**: Microsoft Playwright Documentation; Cross-Browser Testing Guide
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/browser-testing`)
