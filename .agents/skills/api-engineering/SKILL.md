---
name: api-engineering
description: >-
  Design, document, implement, and version RESTful APIs and real-time WebSocket endpoints in Flask and Gevent.
---

# API Engineering & WebSocket Protocol Standard

## Purpose & Scope
Governs RESTful API design, HTTP status codes, error payload schemas, and WebSocket streaming event architectures.

## API Standards
1. **Response Envelope**:
   - Success: Direct JSON entity or list with pagination metadata:
     `{"items": [...], "total": 100, "page": 1, "limit": 25}`
   - Error: Standard RFC 7807 compliant error format:
     `{"error": "Invalid email or password", "code": "AUTH_INVALID_CREDENTIALS", "status": 401}`
2. **HTTP Verb Conventions**:
   - `GET`: Safe, idempotent data retrieval.
   - `POST`: Non-idempotent resource creation.
   - `PUT`: Full resource replacement.
   - `PATCH`: Partial resource mutation.
   - `DELETE`: Resource removal.
3. **Rate Limiting**:
   - Protected endpoints guarded via `Flask-Limiter` (`100 per minute` per IP, `10 per minute` on login).

## Verification Checklist
- [ ] Endpoints validate input schemas before invoking services.
- [ ] Appropriate HTTP status codes used (200, 201, 400, 401, 403, 404, 409, 429, 500).
- [ ] WebSocket connections gracefully handle reconnection and ping/pong heartbeats.


---

## Skill Metadata
- **Category**: Backend and Infrastructure
- **Authoritative Reference**: OpenAPI Specification 3.1; RESTful Web APIs (Richardson & Ruby)
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/api-engineering`)
