---
name: caching-and-redis
description: >-
  Design and manage caching layers, Redis key structures, cache invalidation protocols, and Celery task broker pipelines.
---

# Caching & Redis Integration Standard

## Purpose & Scope
Accelerates frequent read operations and manages distributed task queues using Redis.

## Cache Strategy
1. **Key Naming Convention**:
   `aurapass:{org_id}:{resource}:{id}`
   Example: `aurapass:f549fd90:employee:emp-0001`
2. **TTL Policies**:
   - Dashboard Stats: TTL = 60 seconds (with event-driven cache bust on new checkin).
   - Enrolled Roster: TTL = 300 seconds.
   - User Session: TTL = 1800 seconds.
3. **Cache Invalidation**:
   - Invalidate tenant cache immediately upon employee enrollment, deletion, or photo upload.

## Verification Checklist
- [ ] Redis cache hit ratio $\ge 85\%$ for read-heavy endpoints.
- [ ] Stale cache successfully purged upon tenant updates.


---

## Skill Metadata
- **Category**: Backend and Infrastructure
- **Authoritative Reference**: Redis Design Patterns; Celery User Guide Architecture
- **License**: BSD-3-Clause
- **Scope**: Workspace Agent Skill (`.agents/skills/caching-and-redis`)
