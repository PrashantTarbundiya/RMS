---
name: api-testing
description: >-
  Perform comprehensive API functional, contract, boundary, and error-handling testing using automated HTTP clients.
---

# API Testing & Contract Verification Standard

## Purpose & Scope
Validates RESTful API endpoints for functional correctness, schema conformity, and boundary resilience.

## Test Categories
1. **Happy Path**: Valid credentials and payloads return expected 200/201 responses.
2. **Authentication & Authorization**: Missing/invalid/expired tokens return 401/403.
3. **Malformed Inputs**: Missing required fields, invalid datatypes, and oversized payloads return 400 Bad Request.
4. **Boundary Testing**: Maximum length strings, special characters, and boundary dates.

## Verification Checklist
- [ ] Automated script exercises all public and protected API routes.
- [ ] Error response JSON matches RFC 7807 specification.


---

## Skill Metadata
- **Category**: Quality Assurance
- **Authoritative Reference**: Postman API Testing Best Practices; RFC 9110 HTTP Semantics
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/api-testing`)
