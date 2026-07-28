# 04 Frontend Web Dashboard

## Overview
The frontend is a React Single Page Application (SPA) built with Vite. It serves as the primary administrative dashboard for authentication, attendance monitoring, personnel enrollment, model management, AI inference testing, and system configuration. It also hosts a premium marketing landing page.

## Project Structure
```text
/frontend
 ├── public/              # Static assets (favicons, AI-generated background images)
 ├── src/
 │   ├── assets/          # Inline SVGs and logo files
 │   ├── components/      # Reusable UI widgets
 │   │   ├── Navbar.jsx   # Responsive sidebar + mobile capsule navbar
 │   │   ├── Modal.jsx    # Reusable modal dialog
 │   │   ├── ApertureReticle.jsx  # Face detection overlay
 │   │   ├── landing/     # Landing page section components (9 files)
 │   │   └── ui/          # Primitive UI building blocks
 │   ├── context/
 │   │   └── AuthContext.jsx  # JWT token management & API client
 │   ├── lib/
 │   │   ├── useGsap.js       # Lazy GSAP loader with reduced-motion check
 │   │   └── useReducedMotion.js  # Media query hook for accessibility
 │   ├── pages/           # 14 route components
 │   ├── config.js        # Centralized API URL configuration
 │   ├── index.css        # Global design system & theme variables
 │   └── main.jsx         # React DOM mount point & Router
 ├── vite.config.js       # Bundler config
 └── package.json         # Dependencies
```

## Authentication (`AuthContext.jsx`)
The application uses a centralized authentication context that manages the full JWT lifecycle:
- **Token Storage:** Access and refresh tokens are stored in `localStorage`.
- **API Client Factory:** Creates an Axios instance (`apiClient`) that automatically injects the `Authorization: Bearer <token>` header on every request.
- **Auto-Refresh:** When a 401 response is received, the context automatically attempts to refresh the access token using the stored refresh token. If refresh fails, the user is redirected to the login page.
- **User State:** Exposes `{ user, login, logout, apiClient, isAuthenticated }` to all child components via React Context.

## Styling & Theme
The application implements a **Premium AI SaaS Dark Mode** design language with liquid glassmorphism effects.

- **CSS Variables:** All brand colors, gradient stops, and spacing tokens are defined in `src/index.css`:
  - `--background: #010102`, `--border: #23252A`, `--primary: #5E6AD2`
  - Glass effects: `.liquid-glass`, `.liquid-glass-strong`, `.liquid-glass-subtle`
- **Card System:** The `.card-linear` pattern provides clean borders with dark backgrounds for a premium console feel.
- **Glassmorphism:** Backdrop blur filters, semi-transparent backgrounds, and iridescent shine overlays for cards and containers.
- **Animations:** `framer-motion` for page transitions and component animations. GSAP for scroll-driven landing page effects.
- **Responsive Design:** Full mobile responsiveness with breakpoint-specific layouts.

## State Management & Routing
- **Routing:** `react-router-dom` with `<BrowserRouter>`. Protected routes redirect unauthenticated users to `/login`.
- **State:** Standard React Hooks (`useState`, `useEffect`, `useCallback`, `useRef`) and Context. No external state management library.

## Pages (14 total)

### Public Pages
1. **LandingPage.jsx:** Marketing landing page with scroll-driven storytelling. 9 section components: Hero with animated reticle canvas, Problem Statement, AI Pipeline visualization, Live Proof terminal, Bento Grid features, Data Sovereignty diagram, Statistics counters, FAQ accordion, and Final CTA. Features AI-generated background images and liquid glassmorphism.
2. **LoginPage.jsx:** JWT authentication form. Submits credentials to `/api/auth/login`, stores tokens, and redirects to the dashboard.
3. **RegisterPage.jsx:** Organization registration with admin account creation. Multi-step form for organization name, email, and password.

### Protected Dashboard Pages
4. **DashboardPage.jsx:** Main overview. Displays system health (`/api/health`), model status, enrolled personnel count, today's attendance summary, and roster search with employee cards.
5. **AttendancePage.jsx:** Tabular view of historical check-in records with date filtering, search, and CSV export.
6. **LiveAttendancePage.jsx:** Real-time grid showing "who is currently on site" with auto-refreshing elapsed timers and check-in timestamps.
7. **TestPage.jsx:** Live Inference Console. Features:
   - **Upload mode:** Drag-and-drop or paste image for static inference.
   - **Webcam mode:** Live video feed with continuous prediction loop (every 1.5s).
   - **Strict Telemetry Sync:** Bounding boxes dynamically inherit colors and labels strictly from backend states (`ensemble.is_recognized` and `liveness.is_live`), replacing legacy hardcoded frontend thresholds (Green = Confirmed, Orange = Spoof, Red = Unknown).
   - **Capture & Run Inference:** Freezes the video frame, stops the camera, and runs high-quality static inference.
   - **Feedback Modal:** Structured 3-step correction flow ("Is this a person?" → "Is the prediction correct?" → "Who is this?").
   - **Mode tracking:** Uses `modeRef` to prevent stale live-camera results from overwriting captured photo results.
8. **UploadPage.jsx:** Multi-view drag-and-drop enrollment interface. Organized into Left/Front/Right/Extra category slots with inline photo grids, green "Enrolled" badges for database photos, and violet "New" badges for local uploads.
9. **ManagePersonPage.jsx:** Administrative view of all registered identities. Photo management, inline editing, and person deletion.
10. **TrainingPage.jsx:** MobileNetV2 retraining control panel. Displays real-time SSE progress (current epoch, loss, accuracy) and training history.
11. **ModelsPage.jsx:** AI model configuration. DeepFace enable/disable toggle, threshold sliders, ensemble weight adjustments, and per-camera threshold overrides.
12. **LogsPage.jsx:** System logs and recognition history viewer with filtering and search.
13. **ProfilePage.jsx:** User account settings, password change, and storage infrastructure information.
14. **SupportPage.jsx:** Help documentation, FAQ, and support contact resources.

## Landing Page Components (`/components/landing/`)
The landing page uses a modular section-based architecture for storytelling:

| Component | Purpose |
|-----------|---------|
| `HeroReticleCanvas.jsx` | Animated SVG reticle grid with intersection scanning effect |
| `ProblemSection.jsx` | Problem narrative with RFID/PIN/Cloud failure scenarios |
| `PipelineSection.jsx` | Scroll-driven AI pipeline visualization with connecting lines |
| `ProofWidget.jsx` | Typewriter terminal simulating live inference results |
| `BentoGrid.jsx` | Hierarchical feature cards in bento layout with glassmorphism |
| `SovereigntySection.jsx` | Air-gap deployment diagram with on-prem vs cloud comparison |
| `StatsSection.jsx` | Animated count-up statistics (accuracy, speed, faces enrolled) |
| `FaqSection.jsx` | Spring-animated accordion with common questions |
| `FinalCta.jsx` | Portal gateway CTA with cosmic background image |

## API Integration (`config.js`)
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export default API_URL;
```
The `AuthContext` wraps this into an authenticated `apiClient` that handles token injection and refresh automatically.

## Performance
- **Vite:** Near-instant Hot Module Replacement (HMR) during development.
- **Image Optimization:** Uses `URL.createObjectURL` for image previews, avoiding large Base64 strings in memory.
- **Code Splitting:** Landing page components are independent modules for efficient bundling.
- **Reduced Motion:** `useReducedMotion` hook respects `prefers-reduced-motion` media query for accessibility.
