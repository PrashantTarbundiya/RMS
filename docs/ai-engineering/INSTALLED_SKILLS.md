# AuraPass™ Enterprise — Installed Agent Skills Catalog

This document indexes all **51 production-grade Antigravity agent skills** installed in `.agents/skills/`. Each skill provides structured runbooks, operational commands, and verification checklists.

---

## 1. Core Engineering Skills (8 Skills)

| Skill Name | Path | Purpose | Activation Trigger |
| :--- | :--- | :--- | :--- |
| **`project-architecture`** | [`.agents/skills/project-architecture/SKILL.md`](../../.agents/skills/project-architecture/SKILL.md) | Enforces multi-tier system topology, module boundaries, and Gevent/Flask/React data flow. | Architecture redesigns, new service integrations, tier boundary reviews. |
| **`codebase-exploration`** | [`.agents/skills/codebase-exploration/SKILL.md`](../../.agents/skills/codebase-exploration/SKILL.md) | Low-overhead codebase mapping, symbol tracing, and Repomix context bundling. | Exploring unfamiliar modules, mapping dependencies, preparing subagent context. |
| **`reverse-engineering`** | [`.agents/skills/reverse-engineering/SKILL.md`](../../.agents/skills/reverse-engineering/SKILL.md) | Inspects binary artifacts, serialized `.pickle` files, ONNX graphs, and undocumented APIs. | Analyzing legacy models, vector index inspection, debugging serialization errors. |
| **`software-design-review`** | [`.agents/skills/software-design-review/SKILL.md`](../../.agents/skills/software-design-review/SKILL.md) | Evaluates SOLID principles, coupling, cyclomatic complexity, and concurrency safety. | Major code refactoring, PR reviews, introducing design patterns. |
| **`code-review`** | [`.agents/skills/code-review/SKILL.md`](../../.agents/skills/code-review/SKILL.md) | Structured code review protocol assessing correctness, security, performance, and tests. | Peer review passes before merging or finalizing user requests. |
| **`debugging`** | [`.agents/skills/debugging/SKILL.md`](../../.agents/skills/debugging/SKILL.md) | Systematic root-cause isolation, stack trace dissection, and minimal reproduction. | Runtime 500 errors, WebSocket disconnects, state corruption bugs. |
| **`refactoring`** | [`.agents/skills/refactoring/SKILL.md`](../../.agents/skills/refactoring/SKILL.md) | Safe incremental code restructuring with zero behavioral regressions and full test gates. | Cleaning legacy debt, removing code smells, modernizing components. |
| **`technical-documentation`** | [`.agents/skills/technical-documentation/SKILL.md`](../../.agents/skills/technical-documentation/SKILL.md) | Authors and maintains Architecture Decision Records (ADRs), API schemas, and runbooks. | Documenting architectural decisions, API updates, or system modifications. |

---

## 2. AI & Computer Vision Skills (12 Skills)

| Skill Name | Path | Purpose | Activation Trigger |
| :--- | :--- | :--- | :--- |
| **`machine-learning-engineering`** | [`.agents/skills/machine-learning-engineering/SKILL.md`](../../.agents/skills/machine-learning-engineering/SKILL.md) | ML lifecycle, model packaging, quantization, DirectML/CUDA acceleration, and ONNX export. | Training models, quantizing weights, optimizing inference speed. |
| **`computer-vision`** | [`.agents/skills/computer-vision/SKILL.md`](../../.agents/skills/computer-vision/SKILL.md) | Low-level image processing, CLAHE illumination normalization, and aspect ratio padding. | Video preprocessing, handling bad lighting, camera sensor tuning. |
| **`face-recognition-research`** | [`.agents/skills/face-recognition-research/SKILL.md`](../../.agents/skills/face-recognition-research/SKILL.md) | Deep face recognition loss functions (ArcFace, CosFace) and backbone architectures. | Improving recognition accuracy, evaluating new CNN backbones. |
| **`face-embedding-evaluation`** | [`.agents/skills/face-embedding-evaluation/SKILL.md`](../../.agents/skills/face-embedding-evaluation/SKILL.md) | Cosine vs Euclidean L2 distance calibration, FAR/FRR tradeoffs, and ROC curves. | Tuning confidence thresholds, resolving false positives on unknown faces. |
| **`face-detection`** | [`.agents/skills/face-detection/SKILL.md`](../../.agents/skills/face-detection/SKILL.md) | Multi-scale face detection (RetinaFace, MediaPipe BlazeFace, YuNet) and NMS tuning. | Fixing missed face detections, improving profile face capture. |
| **`face-alignment`** | [`.agents/skills/face-alignment/SKILL.md`](../../.agents/skills/face-alignment/SKILL.md) | 5-point facial landmark extraction, affine transformation, and canonical pose normalization. | Face crop normalization, correcting head tilt before embedding extraction. |
| **`face-quality-assessment`** | [`.agents/skills/face-quality-assessment/SKILL.md`](../../.agents/skills/face-quality-assessment/SKILL.md) | Measures Laplacian blur/sharpness, illumination contrast, and head pose boundaries. | Rejecting blurry or unrecognizably dark frames during enrollment and scan. |
| **`face-anti-spoofing`** | [`.agents/skills/face-anti-spoofing/SKILL.md`](../../.agents/skills/face-anti-spoofing/SKILL.md) | Multi-cue biometric liveness detection combining texture analysis, blink, and MobileNet CNN. | Preventing presentation attacks with photos, tablet screens, or replays. |
| **`presentation-attack-detection`** | [`.agents/skills/presentation-attack-detection/SKILL.md`](../../.agents/skills/presentation-attack-detection/SKILL.md) | ISO/IEC 30107-3 compliance testing across PAD Attack Presentation levels A, B, and C. | Formal biometric liveness security audits and compliance certification. |
| **`model-benchmarking`** | [`.agents/skills/model-benchmarking/SKILL.md`](../../.agents/skills/model-benchmarking/SKILL.md) | Evaluates accuracy on academic datasets (LFW, CFP-FP) and profiles FPS and memory. | Comparing model versions, validating hardware throughput targets. |
| **`model-monitoring`** | [`.agents/skills/model-monitoring/SKILL.md`](../../.agents/skills/model-monitoring/SKILL.md) | Tracks production confidence score decay, embedding drift, and false rejection spikes. | Operational telemetry analysis, proactive alerting on camera smudging. |
| **`ml-data-quality`** | [`.agents/skills/ml-data-quality/SKILL.md`](../../.agents/skills/ml-data-quality/SKILL.md) | Audits training datasets, eliminates duplicates, and purges synthetic or corrupt samples. | Enrolling employees, sanitizing training datasets, purging fake data. |

---

## 3. Product & Frontend Skills (6 Skills)

| Skill Name | Path | Purpose | Activation Trigger |
| :--- | :--- | :--- | :--- |
| **`ui-ux-pro-max`** | [`.agents/skills/ui-ux-pro-max/SKILL.md`](../../.agents/skills/ui-ux-pro-max/SKILL.md) | Commercial SaaS UI/UX design intelligence, typography scales, contrast, and layout styling. | Redesigning pages, elevating visual hierarchy, creating modern SaaS screens. |
| **`responsive-design`** | [`.agents/skills/responsive-design/SKILL.md`](../../.agents/skills/responsive-design/SKILL.md) | Fluid layout adaptation across 11 viewports (320px to 1920px), zero horizontal overflow. | Fixing mobile layout bugs, mobile navigation drawers, responsive tables. |
| **`accessibility`** | [`.agents/skills/accessibility/SKILL.md`](../../.agents/skills/accessibility/SKILL.md) | Enforces WCAG 2.1 AA contrast ratios, keyboard navigability, and ARIA attributes. | Accessibility audits, keyboard navigation support, screen reader fixes. |
| **`frontend-performance`** | [`.agents/skills/frontend-performance/SKILL.md`](../../.agents/skills/frontend-performance/SKILL.md) | Vite code splitting, lazy loading, DOM layout thrashing prevention, Web Vitals. | Optimizing bundle size, speeding up page load, smooth 30 FPS video streaming. |
| **`design-system`** | [`.agents/skills/design-system/SKILL.md`](../../.agents/skills/design-system/SKILL.md) | Centralizes design tokens, CSS variables, dark theme palettes, and Radix primitives. | Authoring new reusable components, enforcing design consistency. |
| **`user-experience-review`** | [`.agents/skills/user-experience-review/SKILL.md`](../../.agents/skills/user-experience-review/SKILL.md) | Cognitive walkthroughs, Nielsen-Norman heuristic audits, and user error prevention. | Auditing user onboarding, form ergonomics, empty states, and feedback loops. |

---

## 4. Backend & Infrastructure Skills (11 Skills)

| Skill Name | Path | Purpose | Activation Trigger |
| :--- | :--- | :--- | :--- |
| **`api-engineering`** | [`.agents/skills/api-engineering/SKILL.md`](../../.agents/skills/api-engineering/SKILL.md) | RESTful API standards, JSON schema validation, HTTP status codes, and WebSockets. | Building new backend endpoints, WebSocket event handlers, rate limiting. |
| **`database-engineering`** | [`.agents/skills/database-engineering/SKILL.md`](../../.agents/skills/database-engineering/SKILL.md) | SQLAlchemy 2.0 ORM patterns, dual-mode SQLite/Postgres, migrations, connection pools. | Database schema changes, Alembic migrations, optimizing query latency. |
| **`authentication-and-authorization`** | [`.agents/skills/authentication-and-authorization/SKILL.md`](../../.agents/skills/authentication-and-authorization/SKILL.md) | JWT access/refresh token rotation, bcrypt password hashing, and role-based access control. | Login/registration changes, token security reviews, role permission gates. |
| **`multi-tenant-architecture`** | [`.agents/skills/multi-tenant-architecture/SKILL.md`](../../.agents/skills/multi-tenant-architecture/SKILL.md) | Tenant data isolation, org-scoped queries, cross-tenant leak prevention. | Adding multi-tenant features, auditing tenant data boundaries. |
| **`performance-engineering`** | [`.agents/skills/performance-engineering/SKILL.md`](../../.agents/skills/performance-engineering/SKILL.md) | Gevent concurrency, worker thread pool sizing, asynchronous execution, query profiling. | Server latency spikes, high-concurrency attendance surges. |
| **`caching-and-redis`** | [`.agents/skills/caching-and-redis/SKILL.md`](../../.agents/skills/caching-and-redis/SKILL.md) | Redis key caching, TTL policies, cache invalidation, and Celery task queues. | Accelerating read-heavy routes, asynchronous training jobs. |
| **`devops`** | [`.agents/skills/devops/SKILL.md`](../../.agents/skills/devops/SKILL.md) | Local developer runtime scripts (`dev.bat`, `start.bat`), process supervision, health checks. | Developer environment setup, server startup script maintenance. |
| **`docker`** | [`.agents/skills/docker/SKILL.md`](../../.agents/skills/docker/SKILL.md) | Multi-stage Docker builds, container hardening, non-root execution, Docker Compose. | Containerizing application, auditing Dockerfiles, deployment packaging. |
| **`kubernetes`** | [`.agents/skills/kubernetes/SKILL.md`](../../.agents/skills/kubernetes/SKILL.md) | Kubernetes manifests, Pod specs, PersistentVolumeClaims, rolling updates. | Cloud-native Kubernetes deployments, volume mount configurations. |
| **`cloud-infrastructure`** | [`.agents/skills/cloud-infrastructure/SKILL.md`](../../.agents/skills/cloud-infrastructure/SKILL.md) | Cloud server provisioning (AWS, Render), reverse proxy SSL/TLS, DNS routing. | Configuring domain names, SSL certificates, Nginx reverse proxying. |
| **`ci-cd`** | [`.agents/skills/ci-cd/SKILL.md`](../../.agents/skills/ci-cd/SKILL.md) | GitHub Actions workflows, automated linting, test suites, and release tagging. | Automating build and release pipelines, branch protection gates. |

---

## 5. Security & Privacy Skills (7 Skills)

| Skill Name | Path | Purpose | Activation Trigger |
| :--- | :--- | :--- | :--- |
| **`application-security`** | [`.agents/skills/application-security/SKILL.md`](../../.agents/skills/application-security/SKILL.md) | OWASP Top 10 vulnerabilities, injection defense, CORS configuration, ASVS Level 2. | Security vulnerability audits, penetration test remediation. |
| **`secure-coding`** | [`.agents/skills/secure-coding/SKILL.md`](../../.agents/skills/secure-coding/SKILL.md) | Defensive programming, safe deserialization (avoiding unvetted pickle), path traversal. | Reviewing file upload handlers, input parsers, native C++ extensions. |
| **`privacy-engineering`** | [`.agents/skills/privacy-engineering/SKILL.md`](../../.agents/skills/privacy-engineering/SKILL.md) | GDPR Art. 9 biometric privacy compliance, Right to Erasure, automated retention policies. | Implementing privacy controls, employee deletion workflows. |
| **`secrets-management`** | [`.agents/skills/secrets-management/SKILL.md`](../../.agents/skills/secrets-management/SKILL.md) | Detects, isolates, and rotates credentials, API keys, JWT secrets, and `.env` files. | Secret rotation runbooks, scanning commits for accidental credential leaks. |
| **`dependency-auditing`** | [`.agents/skills/dependency-auditing/SKILL.md`](../../.agents/skills/dependency-auditing/SKILL.md) | Software Bill of Materials (SBOM), vulnerability auditing (`pip-audit`, `npm audit`). | Upgrading packages, pre-release security validation. |
| **`threat-modeling`** | [`.agents/skills/threat-modeling/SKILL.md`](../../.agents/skills/threat-modeling/SKILL.md) | STRIDE threat modeling for biometric access control, attack tree analysis. | Designing new hardware kiosk integrations or external API bridges. |
| **`biometric-data-protection`** | [`.agents/skills/biometric-data-protection/SKILL.md`](../../.agents/skills/biometric-data-protection/SKILL.md) | Irreversible 512-d feature vectors, encryption at rest (AES-256), air-gapped sovereignty. | Cryptographic reviews of stored embeddings, customer privacy guarantees. |

---

## 6. Quality Assurance Skills (7 Skills)

| Skill Name | Path | Purpose | Activation Trigger |
| :--- | :--- | :--- | :--- |
| **`automated-testing`** | [`.agents/skills/automated-testing/SKILL.md`](../../.agents/skills/automated-testing/SKILL.md) | Pytest and Vitest test suites, test doubles, mocking strategies, and code coverage. | Writing unit tests, asserting component behavior, CI test runs. |
| **`browser-testing`** | [`.agents/skills/browser-testing/SKILL.md`](../../.agents/skills/browser-testing/SKILL.md) | Playwright automated browser interaction, multi-viewport layout validation, screenshots. | Validating responsive layouts, testing login flows, UI regression checks. |
| **`api-testing`** | [`.agents/skills/api-testing/SKILL.md`](../../.agents/skills/api-testing/SKILL.md) | Automated API endpoint verification, status code assertions, boundary conditions. | Testing REST endpoints, validating error responses, contract testing. |
| **`integration-testing`** | [`.agents/skills/integration-testing/SKILL.md`](../../.agents/skills/integration-testing/SKILL.md) | Cross-tier kiosk attendance flows (WebRTC frame -> detection -> embedding -> DB record). | End-to-end attendance testing, offline sync validation. |
| **`regression-testing`** | [`.agents/skills/regression-testing/SKILL.md`](../../.agents/skills/regression-testing/SKILL.md) | Golden dataset validation, zero False Acceptance Rate regression gates. | Validating model updates before production deployment. |
| **`performance-testing`** | [`.agents/skills/performance-testing/SKILL.md`](../../.agents/skills/performance-testing/SKILL.md) | Load testing peak morning shift arrival surges (50 concurrent streams), memory leaks. | Stress testing kiosks, benchmarking server throughput. |
| **`release-validation`** | [`.agents/skills/release-validation/SKILL.md`](../../.agents/skills/release-validation/SKILL.md) | Production readiness checklist, build verification, migration dry-runs, rollback plans. | Final gatekeeper sign-off before releasing or distributing software. |

