# AuraPass™ Enterprise — Quality Assurance & Testing Standards

This document establishes the automated testing protocols, browser verification matrices, biometric regression gates, and performance benchmarking criteria for AuraPass Enterprise.

---

## 1. Automated Testing Pyramid

```
                ▲
               / \
              /   \
             / E2E \       Playwright Multi-Viewport Browser Tests
            /-------\
           /  Integ  \     API & WebSocket Flow Tests, Database Fixtures
          /-----------\
         /    Unit     \   Pytest Backend Modules & React Component Tests
        /---------------\
```

---

## 2. Multi-Viewport Browser Testing Matrix (Playwright)
In accordance with Rule H, all UI surfaces must be validated across the following 11 target viewports using the Playwright MCP server:

| Device Category | Target Width | Target Height | Emulated Device / Profile | Verification Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **Micro-Mobile** | `320px` | `568px` | iPhone SE (1st Gen) | Zero horizontal scroll, readable headers, touch targets $\ge 44\text{px}$ |
| **Standard Mobile** | `360px` | `740px` | Galaxy S8 / Android Compact | Drawer navigation functional, cards stacked vertically |
| **Modern Compact** | `375px` | `667px` | iPhone SE (2nd/3rd Gen) | Form inputs full width, buttons accessible above virtual keyboard |
| **Mainstream Mobile**| `390px` | `844px` | iPhone 13/14/15 | KPI metrics properly wrapped, video feed maintains aspect ratio |
| **Large Mobile** | `414px` | `896px` | iPhone 11 Pro Max / XR | Grid cleanly transitions from 1-col to 2-col |
| **Wide Mobile** | `430px` | `932px` | iPhone 15 Pro Max | Camera preview renders without cropping or distortion |
| **Phablet / Handheld**| `480px` | `854px` | Large Handheld / Landscape Mobile | Modals fit within viewport without clipping action buttons |
| **Compact Tablet** | `768px` | `1024px` | iPad Mini (Portrait) | Sidebar transitions or persistent toggle appears cleanly |
| **Full Tablet** | `1024px` | `768px` | iPad Pro (Landscape) | Desktop sidebar mounts, multi-column dashboard grid active |
| **Laptop / Desktop** | `1280px` | `800px` | Standard Laptop | Attendance table displays full columns with sorting/pagination |
| **Full HD Desktop** | `1440px` | `900px` | Enterprise Desktop Monitor | Content centered in max-w-7xl with balanced margins |
| **Ultra-Wide** | `1920px` | `1080px` | 1080p Monitor / Kiosk Display | Kiosk mode full-screen, high-contrast recognition badges |

### Playwright Automated Check Procedure
```javascript
// Test zero horizontal overflow
const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
const innerWidth = await page.evaluate(() => window.innerWidth);
expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
```

---

## 3. Biometric Accuracy Regression Gates
Every code modification touching `backend/server.py`, `backend/face_detection.py`, or `backend/org_storage.py` must pass the following biometric accuracy gates:

1. **Closed-Set Verification**:
   - Enrolled employee samples must verify with True Positive Rate $\ge 98.0\%$.
   - Mean matching confidence on enrolled faces must exceed $88.0\%$.
2. **Open-Set Negative Rejection (Zero False Accepts)**:
   - When non-enrolled individuals (negative controls) are presented, the False Acceptance Rate (FAR) must equal **$0.0\%$**.
   - Negative samples must be unambiguously classified as `Unknown` or rejected with distance $> 0.40$.
3. **Consensus Voting Gate**:
   - Primary model (Facenet512) and secondary model (InsightFace ArcFace) must agree on the predicted identity. Disagreements must be flagged as `warning` or require multi-frame confirmation.

---

## 4. Performance & Morning Rush Hour Stress Benchmark
- **Simulation**: 50 concurrent kiosk feeds streaming 2 FPS over WebSockets for 10 consecutive minutes.
- **Acceptance SLA**:
  - P95 Recognition Latency: $\le 150\text{ms}$.
  - Dropped Frames: $0\%$.
  - Server CPU Utilization: $\le 85\%$ sustained.
  - Server Memory Growth: $0\text{MB}$ slope after initial model warm-up (zero memory leaks).

