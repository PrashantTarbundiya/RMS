@echo off
title RMS Face AI - Dev Mode (Auto-Restart)
color 0A
echo.
echo  ================================================
echo   RMS Face AI - FAST DEV MODE
echo  ================================================
echo   Auto-restart on Python file changes (like nodemon)
echo   Frontend: Vite HMR (instant reload)
echo  ================================================
echo.

:: Check if we're in the right directory
if not exist "backend\server.py" (
    echo  [ERROR] Run this from the RMS project root directory.
    pause
    exit /b 1
)

:: ── Python Detection (fast path) ──
set PYTHON=python
if exist "backend\venv\Scripts\python.exe" (
    set PYTHON=backend\venv\Scripts\python.exe
) else if exist "C:\Python313\python.exe" (
    set PYTHON=C:\Python313\python.exe
)

:: Detect local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

echo  [1/2] Starting Flask API with auto-restart...
start "RMS Flask API (Dev)" cmd /k "%PYTHON% backend/dev.py"

echo  [2/2] Starting Vite frontend (HMR enabled)...
echo.
echo  ================================================
echo   RMS Face AI - Dev Services Running
echo  ================================================
echo.
echo   Backend API:    http://127.0.0.1:5000  (auto-restart on .py changes)
echo   Web Dashboard:  http://localhost:5173   (instant HMR reload)
echo   Health Check:   http://127.0.0.1:5000/api/health
echo.
echo   Mobile App:     cd mobile ^& npx expo start
echo   Network URL:    http://%LOCAL_IP%:5000
echo.
echo   TIP: Edit any .py file and save - backend restarts automatically!
echo.
echo  ================================================
echo   Press Ctrl+C to stop the frontend.
echo   Close "RMS Flask API (Dev)" window to stop backend.
echo  ================================================
echo.

cd frontend
call npm run dev
