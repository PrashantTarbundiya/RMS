---
name: technical-documentation
description: >-
  Author, validate, and maintain engineering specifications, Architecture Decision Records (ADRs), API guides, and runbooks.
---

# Technical Documentation Standard

## Purpose & Scope
Standardizes engineering documentation format, technical accuracy, and synchronization with source code.

## Documentation Types
1. **Architecture Decision Records (ADR)**: Capture context, options considered, decisions, and consequences.
2. **API Documentation**: OpenAPI / Swagger compliant route descriptions, request schemas, status codes, and error models.
3. **Runbooks**: Step-by-step operational instructions for deployment, backup restoration, and incident response.

## Style Guidelines
- Use clear, active voice and precise terminology.
- Provide runnable code snippets and realistic examples.
- Include clickable `file://` links for referenced files and symbols.

## Verification Checklist
- [ ] Documentation accurately reflects current source code implementation.
- [ ] All code blocks use appropriate syntax highlighting tags.
- [ ] Diagrams use standard Mermaid flowchart or sequence formats.


---

## Skill Metadata
- **Category**: Core Engineering
- **Authoritative Reference**: Write the Docs Documentation Guide; ADR Standard (Michael Nygard)
- **License**: CC-BY-SA-4.0
- **Scope**: Workspace Agent Skill (`.agents/skills/technical-documentation`)
