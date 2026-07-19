# 04 Frontend Web Dashboard

## Overview
The frontend is a React Single Page Application (SPA) built with Vite. It serves as the primary administrative dashboard for managing personnel, reviewing attendance, tuning ML parameters, and observing system health.

## Project Structure
```text
/frontend
 ├── public/             # Static assets (Favicons, etc.)
 ├── src/
 │   ├── assets/         # Inline SVGs and logo files
 │   ├── components/     # Reusable UI widgets (Navbar, Cards, Modals)
 │   ├── pages/          # Full route views
 │   ├── config.js       # Centralized constants (API URL)
 │   ├── index.css       # Global design system & theme variables
 │   └── main.jsx        # React DOM mount point & Router
 ├── vite.config.js      # Bundler config
 └── package.json        # Dependencies
```

## Styling & Theme
The application utilizes a **Premium Linear Dark** design language.
- **CSS Variables:** Define all brand colors, gradient stops, and spacing tokens (e.g., `--background: #010102`, `--border`, `--primary: #5E6AD2`) in `src/index.css`.
- **Border Gradients:** Heavily utilizes the `.card-linear` layout pattern, clean borders, and dark backgrounds for a premium console feel.
- **Animations:** Employs `framer-motion` for page transitions, camera feedback, and drag-and-drop allocations.


## State Management & Routing
- **Routing:** Handled via `react-router-dom`. `main.jsx` wraps the application in a `<BrowserRouter>`.
- **State:** No global state management library (Redux/Zustand) is used. Given the flat architecture of the app, standard React Hooks (`useState`, `useEffect`) and context (where necessary) are sufficient. API responses are stored locally within the Page components.

## Pages
1. **DashboardPage.jsx:** The landing view. Fetches `/api/health` to display system status, loaded models, and the number of enrolled personnel.
2. **ManagePersonPage.jsx:** Administrative view to see all registered identities in the KNN index.
3. **UploadPage.jsx / AddPersonScreen:** The enrollment flow. Uses `FormData` to bundle the employee name and 15+ images into a multipart request.
4. **LiveAttendancePage.jsx:** Polls or subscribes to the `/api/attendance` data stream to show a grid of employees currently on the premises, along with their check-in times.
5. **TestPage.jsx:** The staging ground for the AI. Users can upload arbitrary images to test the model's accuracy. Includes a custom **Feedback Modal** where admins can correct false positives, sending `is_correct=false` back to the ML pipeline to purge bad data.
6. **TrainingPage.jsx:** Manages the background PyTorch fine-tuning task. Displays status on the MobileNetV2 retraining process.

## API Integration (`config.js`)
Instead of hardcoding `localhost:5000` in every Axios call, `config.js` defines `API_URL`.
```javascript
// Example config.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export default API_URL;
```
This is critical for deployment, allowing the production environment variable to point to the actual backend IP.

## Performance
- **Vite:** Offers near-instant Hot Module Replacement (HMR) during development.
- **Image Optimization:** The frontend avoids holding large Base64 strings in memory for long periods, preferring `URL.createObjectURL` for image previews before dispatching them to the backend via `FormData`.
