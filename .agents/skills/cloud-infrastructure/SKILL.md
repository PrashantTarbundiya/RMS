---
name: cloud-infrastructure
description: >-
  Architect and secure cloud hosting environments (AWS, Render), reverse proxies, SSL/TLS certificates, and DNS routing.
---

# Cloud Infrastructure & Network Security Standard

## Purpose & Scope
Governs cloud server provisioning, SSL/TLS termination, reverse proxying, and DNS configuration.

## Cloud Security Baseline
1. **TLS / HTTPS Enforcement**:
   - Minimum TLS version: 1.2, recommended TLS 1.3.
   - HSTS (HTTP Strict Transport Security) enabled with `max-age=31536000`.
2. **Reverse Proxy Configuration (Nginx / Caddy)**:
   - Proxy WebSocket upgrade headers (`Upgrade $http_upgrade`, `Connection "upgrade"`).
   - Restrict administrative endpoints via IP allowlisting or VPN.

## Verification Checklist
- [ ] SSL Labs rating of A+ on public endpoints.
- [ ] All HTTP traffic automatically redirects to HTTPS.


---

## Skill Metadata
- **Category**: Backend and Infrastructure
- **Authoritative Reference**: AWS Well-Architected Framework; Mozilla SSL Configuration Generator
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/cloud-infrastructure`)
