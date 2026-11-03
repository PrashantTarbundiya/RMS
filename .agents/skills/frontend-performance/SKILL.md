---
name: frontend-performance
description: >-
  Optimize React and Vite performance, code splitting, asset minification, virtual scrolling, and Core Web Vitals.
---

# Frontend Performance Engineering Standard

## Purpose & Scope
Maximizes client-side execution efficiency, minimizes render delays, and eliminates frame drops during real-time camera streaming.

## Target Web Vitals
- **Largest Contentful Paint (LCP)**: $\le 1.8\text{s}$
- **First Input Delay (FID) / INP**: $\le 100\text{ms}$
- **Cumulative Layout Shift (CLS)**: $\le 0.05$
- **Frame Rate during Video Streaming**: $\ge 30\text{ FPS}$

## Optimization Techniques
1. **Dynamic Code Splitting**:
   - Lazy load heavy route components (`React.lazy(() => import('./pages/...'))`).
2. **DOM Layout Thrashing Prevention**:
   - Batch DOM reads and writes; avoid interleaved `getBoundingClientRect` calls.
3. **Video Canvas Memory Management**:
   - Recycle `OffscreenCanvas` contexts; avoid generating uncollected base64 blobs in tight requestAnimationFrame loops.

## Verification Checklist
- [ ] Production build chunk sizes stay within bundle budget ($< 500\text{KB}$ per vendor chunk).
- [ ] Zero memory leaks during prolonged camera kiosk operation.


---

## Skill Metadata
- **Category**: Product and Frontend
- **Authoritative Reference**: Google Web Vitals Specification; High Performance Browser Networking (Ilya Grigorik)
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/frontend-performance`)
