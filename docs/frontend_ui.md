# Web Dashboard UI Documentation

## Aesthetic & Design System
The Web Dashboard employs a **Premium Linear Dark** aesthetic. This design is intentionally chosen to project high-end enterprise reliability, minimalist layout, and precision control.

### Core Palette
- **Base Canvas**: Solid deep dark (#010102)
- **Primary Accent**: Linear Purple (#5E6AD2 / #828FFF)
- **Success State**: Emerald Green (#27A644)
- **Border Dividers**: Clean dark gray (#23252A)
- **Cards**: Border gradients (.card-linear) with solid dark background (#0F1011)

### Key Components
1. **Sidebar Navigation**: The dashboard utilizes a left-aligned, sticky sidebar navigation system on desktop screens. This provides a scalable structure for enterprise tools.
2. **Linear Cards**: All analytical data is presented on clean dark panels featuring thin border accents and premium subtle hover indicators.
3. **Webcam Controls**: Fully integrated webcam capture widgets across the roster creation, management, and testing flows.
4. **Bounding Bracket Reticles**: Live test video feed overlays render target indicators as absolute corner-brackets matching the premium console style.

## Screen Breakdown

### Dashboard (`/dashboard`)
- **KPI Grid**: Displays high-level metrics including Registered People, Cleaned Photos, Total Predictions, and Success Rate.
- **Visual Analytics**: Interactive dataset distribution and recognition frequency logs.
- **Recognition History**: A detailed log table of the latest API requests, showcasing exactly which model (DeepFace or MobileNet) confirmed the identity.

### Test & Scan (`/test`)
- **Live Interface**: Users can test the API by dragging and dropping an image, pasting from clipboard, or capturing directly from webcam.
- **Liveness Detection Overlay**: Feedback badges show liveness confirmation with animated glowing states.

### Management (`/upload`, `/manage-person`, `/training`, `/models`)
- **Roster & Uploads**: Row-based category drop boxes (ordered Left, Frontal, Right, Extra) supporting HTML5 file drag-and-drop, clipboard pasting, and custom "Enrolled" / "New" image tag designations.
- **Retraining Output**: Live terminal output streams showing PyTorch MobileNetV2 epoch progress.

