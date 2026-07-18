# Web Dashboard UI Documentation

## Aesthetic & Design System
The Web Dashboard employs a **Premium AI SaaS Glassmorphism** aesthetic. This design is intentionally chosen to project high-end enterprise reliability while remaining futuristic and highly engaging.

### Core Palette
- **Primary Glow**: Deep Space Violet (`#8B5CF6`)
- **Accent Glow**: Neon Cyan (`#06B6D4`)
- **Backgrounds**: Slate Dark (`#020617` to `#0F172A`)
- **Cards**: Frosted glass (`backdrop-filter: blur(24px)`)

### Key Components
1. **Sidebar Navigation**: The dashboard utilizes a left-aligned, sticky sidebar navigation system on desktop screens. This provides a scalable structure for enterprise tools. On mobile devices, it smoothly collapses into a bottom navigation bar.
2. **Glass Panels**: All analytical data is presented on floating glass panels. These panels feature interactive hover states with `cyan` drop-shadows to ensure the UI feels responsive and alive.
3. **Ambient Lighting**: The background features massive radial gradient orbs that shift subtly, emulating the processing power of the underlying AI.

## Screen Breakdown

### Dashboard (`/dashboard`)
- **KPI Grid**: Displays high-level metrics including Registered People, Cleaned Photos, Total Predictions, and Success Rate.
- **Visual Analytics**: Interactive bar charts for dataset distribution.
- **Recognition History**: A detailed log table of the latest API requests, showcasing exactly which model (DeepFace or MobileNet) confirmed the identity, complete with confidence scores and timestamps.

### Test & Scan (`/test`)
- **Live Interface**: Users can test the API by dragging and dropping an image, pasting from their clipboard, or utilizing their webcam directly from the browser.
- **Results**: Employs GitHub-style alerts and badges to present binary outcomes: either `CONFIRMED` or `NOT FOUND`.

### Management (`/upload`, `/training`, `/models`)
- Streamlined interfaces for dataset curation, executing manual ensemble retraining, and monitoring the live status of the loaded AI models in RAM.
