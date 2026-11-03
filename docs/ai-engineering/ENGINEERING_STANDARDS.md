# AuraPass™ Enterprise — Engineering Standards & Coding Guidelines

This document codifies the technical standards, coding practices, and architectural boundaries governing all software written for AuraPass Enterprise.

---

## 1. Python Backend Standards (Flask, Gevent, SQLAlchemy)

### 1.1 Language & Style
- Python `3.10+` compliance.
- Strict adherence to PEP 8 styling guidelines.
- Mandatory type hints on all public service interfaces and helper functions.
- Maximum function length: 60 lines. Extract sub-helpers for complex algorithmic branches.

### 1.2 Gevent Concurrency Rules
- **No Blocking I/O**: Never invoke blocking calls (e.g., synchronous socket operations) without Gevent monkey-patching or yielding.
- **Offload Heavy Computation**: Batch embedding extraction and model retraining must execute in separate worker processes (Celery / multiprocessing) to prevent freezing the WebSocket event loop.
- **Process Fork Safety**: Always dispose inherited SQLAlchemy engine connection pools (`_engine.dispose(close=False)`) upon child worker fork.

### 1.3 Database Access (SQLAlchemy 2.0)
- Always use context-managed database sessions:
  ```python
  with get_db_session() as session:
      employee = session.query(Employee).filter_by(id=emp_id, org_id=org_id).first()
  ```
- All multi-tenant queries must include `org_id` in the `WHERE` clause.
- Never write raw unparameterized SQL strings.

### 1.4 Structured Logging
- Use standard Python `logging` with structured JSON formatting:
  ```python
  logger.info("Face verified", extra={"org_id": org_id, "confidence": 0.92, "duration_ms": 48})
  ```
- Never log raw passwords, JWT tokens, or base64 facial image strings.

---

## 2. Frontend Standards (React 19, Vite, Tailwind CSS)

### 2.1 Component Architecture
- Separate container components (data fetching, state orchestration) from presentational components (pure UI rendering).
- Use React hooks for encapsulating reusable logic (`useAuth`, `useToast`, `usePwa`).
- Never perform asynchronous side-effects directly inside render loops.

### 2.2 Responsive Styling Guidelines
- Mobile-first CSS: write base styles for mobile viewports, layering `sm:`, `md:`, `lg:`, `xl:` responsive modifiers.
- Use `min-w-0` on flex items to prevent text overflow bugs.
- Design tokens defined in `src/index.css` must be used instead of arbitrary ad-hoc hex values.

### 2.3 WebRTC & Camera Feeds
- Always request user media with explicit constraints:
  `{ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } }`
- Implement explicit fallback handling when camera permissions are denied or when hardware is unavailable.
- Release camera tracks immediately when unmounting view components (`stream.getTracks().forEach(t => t.stop())`).

---

## 3. Backward Compatibility & Deprecation Protocol
1. **Public API Immutability**: Existing API endpoints and response field names must remain backwards-compatible. If an endpoint is updated, deprecate with a sunset header (`Sunset: <date>`) and support the previous contract for at least one minor release cycle.
2. **Database Migrations**: Additive migrations only (adding nullable columns or defaults). Dropping columns requires a two-phase rollout.

