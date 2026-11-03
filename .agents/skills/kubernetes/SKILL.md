---
name: kubernetes
description: >-
  Design and validate Kubernetes manifests, Pod specifications, PersistentVolumeClaims, and rolling deployment strategies.
---

# Kubernetes Cloud-Native Deployment Standard

## Purpose & Scope
Specifies container orchestration, horizontal scaling, and persistent storage management in Kubernetes clusters.

## Manifest Architecture
1. **Deployments & Pod Specs**:
   - Configured with liveness (`/api/ping`) and readiness probes (`/api/dashboard`).
   - Resource requests and limits defined (CPU: 500m request, 2000m limit; RAM: 1Gi request, 4Gi limit).
2. **Persistent Storage (PVC)**:
   - ReadWriteMany (RWX) volume for shared model weight storage across inference pods.

## Verification Checklist
- [ ] Pods terminate gracefully within `terminationGracePeriodSeconds` (30s).
- [ ] Zero downtime achieved during rolling updates.


---

## Skill Metadata
- **Category**: Backend and Infrastructure
- **Authoritative Reference**: Kubernetes Documentation; CNCF Cloud Native Security Whitepaper
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/kubernetes`)
