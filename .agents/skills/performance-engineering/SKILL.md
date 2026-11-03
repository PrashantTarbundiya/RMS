---
name: performance-engineering
description: >-
  Profile, benchmark, and optimize backend throughput, Gevent concurrency, worker thread pools, and database query latency.
---

# Backend Performance & Concurrency Engineering

## Purpose & Scope
Maximizes server throughput and responsiveness under heavy concurrent attendance scan loads.

## Gevent Concurrency Model
- Gevent greenlets provide lightweight cooperative multitasking for I/O operations.
- Long-running CPU-bound tasks (deep model training, batch embedding extraction) must be offloaded to Celery background workers to avoid starving the WSGI event loop.

## Target SLA & Latency Metrics
- `/api/ping`: $\le 5\text{ms}$ (P99)
- `/api/dashboard`: $\le 50\text{ms}$ (P95)
- `/api/attendance`: $\le 35\text{ms}$ (P95)
- Real-time Face Verification: $\le 150\text{ms}$ (P95)

## Verification Checklist
- [ ] Database queries executed in under $10\text{ms}$ with zero table scans on indexed columns.
- [ ] Load testing with 100 concurrent clients shows zero dropped connections.


---

## Skill Metadata
- **Category**: Backend and Infrastructure
- **Authoritative Reference**: Systems Performance: Enterprise and the Cloud (Brendan Gregg)
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/performance-engineering`)
