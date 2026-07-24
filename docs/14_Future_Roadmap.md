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
3. **Single-Thread Inference:** Flask's synchronous processing means concurrent webcam requests queue behind each other. Under high concurrent load, response times degrade.
4. **Render Free Tier Cold Starts:** The backend sleeps after 15 minutes of inactivity, requiring ~30-60s to wake up on the first request.
5. **Mobile Offline:** The mobile app requires a continuous network connection; no offline inference capability.

---

## Planned Features

### Performance & Scalability
- **Gunicorn Multi-Worker:** Deploy with multiple Gunicorn workers (`--workers 4`) to handle concurrent prediction requests across CPU cores. Requires careful PyTorch model sharing via `torch.multiprocessing`.
- **GPU Acceleration:** Explicit CUDA tensor placement for organizations with NVIDIA GPUs. Currently PyTorch auto-detects GPU but doesn't optimize tensor placement.
- **Model Quantization:** Convert MobileNetV2 to INT8 quantized inference for 2-4x speedup on CPU-only edge devices.
- **WebSocket Inference:** Replace the 1.5s polling interval on the Test Console with a persistent WebSocket connection for true real-time video inference.

### AI & ML Improvements
- **Hard Negative Mining:** Refine training to focus on difficult-to-distinguish face pairs, reducing false positives between similar-looking individuals.
- **Adaptive Per-Person Thresholds:** Automatically learn tighter thresholds for individuals with distinctive features and looser thresholds for those with common facial structures.
- **Expanded Augmentation:** Train against motion blur, partial occlusion (masks, sunglasses), and extreme lighting to improve robustness.
- **RetinaFace Migration:** Evaluate RetinaFace as an alternative to MediaPipe for even more robust multi-angle detection with built-in landmark alignment.
- **Active Liveness (Blink Detection):** Add active liveness challenges (blink, head turn) for high-security deployments beyond passive texture analysis.

### Platform Features
- **Stripe Billing Integration:** Connect the `subscriptions` table to Stripe for automated plan management, usage-based billing, and payment processing.
- **Multi-Camera Dashboard:** Live mosaic view showing feeds from all connected cameras simultaneously with real-time recognition overlays.
- **Notification System:** Push notifications and email alerts for unknown face detections, system health issues, and daily attendance summaries.
- **Group Photo Recognition:** Process uploaded group photos and identify all faces simultaneously.
- **Attendance Analytics:** Advanced reporting with department-level aggregation, trend analysis, late-arrival patterns, and exportable PDF reports.

### Mobile Upgrades
- **React Native Reanimated 3:** Migrate to Reanimated 3 for smoother 60fps native-driver transitions and gesture handling.
- **On-Device ML (TensorFlow Lite):** Explore local face detection on the phone to reduce network bandwidth by sending only cropped face artifacts to the server.
- **Offline Queue:** Cache recognition results locally when the network drops and sync when connectivity is restored.

### Security Enhancements
- **OAuth2 / SSO:** Support enterprise SSO providers (Google Workspace, Microsoft Entra, Okta) for seamless corporate authentication.
- **API Key Rotation:** Automated key rotation for edge cameras with grace periods for transitioning to new keys.
- **Audit Log Dashboard:** Visual interface for browsing the `feedback_logs` and `consent_records` tables with filtering and export.
- **End-to-End Encryption:** Encrypt face embeddings at rest in `encodings.pickle` using organization-specific encryption keys.
