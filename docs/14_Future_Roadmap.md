# 14 Future Roadmap

## Completed Milestones ✅
The following items were previously listed as "future" improvements and have been fully implemented:

| Feature | Status | Implementation |
|---------|--------|----------------|
| JWT Authentication | ✅ Complete | `auth.py`, `middleware.py` — bcrypt + JWT with RBAC |
| PostgreSQL Database | ✅ Complete | `database/models.py` — 8 tables with SQLAlchemy ORM |
| Alembic Migrations | ✅ Complete | `migrations/` — Schema versioning |
| Multi-Tenant Isolation | ✅ Complete | `@inject_org_id` middleware + `org_storage.py` |
| MediaPipe Face Detection | ✅ Complete | `face_detection.py` — Replaced Haar Cascades with BlazeFace |
| Liveness Detection | ✅ Complete | `liveness.py` — Edge density, color variance, texture analysis |
| Anti-Spoofing Voting System | ✅ Complete | `liveness.py` — 2-failure system with Moiré grid detection & micro-movement |
| Resilient Ensemble Fallback | ✅ Complete | `ensemble.py` — Dynamic single-model fallback if DeepFace is disabled |
| Per-Camera Thresholds | ✅ Complete | `cameras.confirm_threshold_override` column |
| Docker Compose | ✅ Complete | `docker-compose.yml` in project root |
| Landing Page | ✅ Complete | 9-section storytelling page with scroll animations |
| Edge-Cloud Sync | ✅ Complete | `/api/sync` with API key auth |
| API Key Camera Auth | ✅ Complete | `@require_api_key` in middleware |
| Biometric Consent Tracking | ✅ Complete | `consent_records` database table |

---

## Current Limitations & Known Issues
1. **CPU Bottleneck:** PyTorch MobileNetV2 retraining heavily taxes the CPU. On edge devices with limited cooling, this can cause thermal throttling.
2. **Memory Growth:** Long-running Flask servers holding PyTorch tensors in global variables can accumulate memory over weeks of uptime.
3. **Single-Thread Inference:** Flask's synchronous processing means concurrent webcam requests queue behind each other. Under high concurrent load, response times degrade. (No WebSocket server yet.)
4. **Render Free Tier Cold Starts:** The backend sleeps after 15 minutes of inactivity, requiring ~30-60s to wake up on the first request.
5. **No PDF Report Export:** Analytics dashboard supports JSON/CSV but not exportable PDF reports.
6. **SSO Not Live-Tested:** OAuth2/SSO code exists for Google, Microsoft, and Okta but has not been tested against a real identity provider.
7. **Offline Queue Not Physically Tested:** Mobile offline queue code exists but has not been validated by physically disconnecting network mid-session.

---

## Recently Completed ✅ (moved from Planned)

| Feature | Implementation |
|---------|---------------|
| Model Quantization (INT8) | `ml_robustness.py: quantize_model()` with benchmark comparison |
| Hard Negative Mining | `ml_robustness.py: mine_hard_negatives()` identifies confusable face pairs |
| Adaptive Per-Person Thresholds | `ml_robustness.py: compute_adaptive_thresholds()` per-person optimal distance |
| Expanded Augmentation | Motion blur, occlusion, extreme lighting, low-res, JPEG artifacts in `ml_robustness.py` |
| Active Liveness Decision | Documented as opt-in strict mode in `docs/active_liveness_decision.md` |
| Stripe Billing Integration | `billing.py: handle_stripe_webhook()` with plan limit enforcement |
| Multi-Camera Mosaic Dashboard | `MosaicPage.jsx` — tiled layout with per-camera polling |
| Notification System | `notifications.py` — email alerts, webhook (Slack/Teams), daily summaries, dedup |
| Group Photo Recognition | `/api/predict` returns `faces: [...]` array for multi-face detection |
| Attendance Analytics | `analytics.py` — department aggregation, late-arrival trends, heatmaps |
| Offline Queue (Mobile) | `mobile/src/services/offlineQueue.js` — auto-sync on reconnect |
| OAuth2 / SSO | `security_hardening.py` — Google, Microsoft, Okta OIDC (code complete, not live-tested) |
| API Key Rotation | `security_hardening.py: rotate_api_key()` with grace period |
| Audit Log Dashboard | `AuditLogsPage.jsx` — filterable view of feedback/consent logs |
| End-to-End Encryption | `security_hardening.py: encrypt_encodings()` — AES-256-GCM per-org |
| Backup & Restore | `backup_restore.py` — full backup, restore, and org data export |
| Update Checker & Rollback | `update_checker.py` — manifest check, checksum verify, rollback |
| Session Revocation | `/api/auth/revoke`, `/api/auth/revoke-all` + `RevokedToken` model |
| Consent Revoke & Purge | `/api/employees/<name>/consent/revoke-and-purge` — real data deletion |
| Role-Scoped Navigation | `Navbar.jsx` — `hasRole()` + `minRole` filtering per nav item |

---

## Planned Features (Still Remaining)

### Performance & Scalability
- **Gunicorn Multi-Worker:** Deploy with multiple Gunicorn workers (`--workers 4`) to handle concurrent prediction requests across CPU cores. Requires careful PyTorch model sharing via `torch.multiprocessing`.
- **GPU Acceleration:** Explicit CUDA tensor placement for organizations with NVIDIA GPUs. Currently PyTorch auto-detects GPU but doesn't optimize tensor placement.
- **WebSocket Inference:** Replace the 1.5s polling interval on the Test Console with a persistent WebSocket connection for true real-time video inference.

### AI & ML Improvements
- **RetinaFace Migration:** Evaluate RetinaFace as an alternative to MediaPipe for even more robust multi-angle detection with built-in landmark alignment.
- **Production Benchmarking:** Run hard negative mining and adaptive thresholds against a real held-out test set to measure false-positive reduction.

### Platform Features
- **PDF Report Export:** Generate exportable PDF attendance reports from the analytics engine.
- **Offline Update Path Validation:** Test the manual update upload flow end-to-end with zero outbound network calls.
- **Network Traffic Audit:** Formally verify that the update checker transmits no employee/biometric data.

### Mobile Upgrades
- **React Native Reanimated 3:** Migrate to Reanimated 3 for smoother 60fps native-driver transitions and gesture handling.
- **On-Device ML (TensorFlow Lite):** Explore local face detection on the phone to reduce network bandwidth.
- **Physical Offline Testing:** Validate offline queue by physically disconnecting network mid-session.

### Integration Testing
- **Live SSO Testing:** Test OAuth2/SSO against a real Google Workspace, Microsoft Entra, or Okta tenant.
- **Live Key Rotation Testing:** Test API key rotation with a camera actively mid-request to confirm no dropped requests.
- **Live Encryption Validation:** Confirm encrypted embeddings are still correct for KNN matching end-to-end.
