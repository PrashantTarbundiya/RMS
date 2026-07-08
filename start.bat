@echo off
title RMS Face AI - Startup
color 0B
echo.
echo  ================================================
echo   RMS Face AI v2.0 - Starting Application
echo  ================================================
echo.

:: Check if we're in the right directory
if not exist "app.py" (
    echo  [ERROR] Please run this script from the RMS project root directory.
    echo          Expected files like app.py, model.py etc.
    echo.
    pause
    exit /b 1
)

:: ── Python Detection ──
echo  [1/5] Checking Python installation...
set PYTHON=python
if exist "C:\Python313\python.exe" (
    set PYTHON=C:\Python313\python.exe
    echo        Found Python 3.13 at C:\Python313
) else (
    where python >nul 2>&1
    if errorlevel 1 (
        echo  [ERROR] Python not found! Install Python 3.10+ from python.org
        pause
        exit /b 1
    )
    echo        Using system Python
)

:: ── Python Dependencies ──
echo  [2/5] Checking Python dependencies...
%PYTHON% -c "import flask, torch, cv2, mediapipe" 2>nul
if errorlevel 1 (
    echo        Missing dependencies detected. Installing...
    echo.
    %PYTHON% -m pip install -r requirements.txt
    if errorlevel 1 (
        echo  [ERROR] Failed to install Python dependencies.
        echo          Try: %PYTHON% -m pip install -r requirements.txt
        pause
        exit /b 1
    )
    echo        Dependencies installed successfully.
) else (
    echo        All Python dependencies found.
)

:: ── Node.js Detection ──
echo  [3/5] Checking Node.js installation...
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found! Install from https://nodejs.org
    pause
    exit /b 1
)
echo        Found Node.js

:: ── Frontend Dependencies ──
echo  [4/5] Checking frontend dependencies...
if not exist "frontend\node_modules" (
    echo        Installing frontend npm packages...
    cd frontend
    call npm install
    cd ..
    if errorlevel 1 (
        echo  [ERROR] Failed to install frontend dependencies.
        pause
        exit /b 1
    )
) else (
    echo        Frontend node_modules found.
)

:: ── Launch Services ──
echo  [5/5] Launching services...
echo.

:: Detect local IP for mobile connection
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

:: Start Flask API server in background
echo  Starting Flask API server...
start "RMS Flask API" cmd /k "%PYTHON% frontend/api/server.py"

:: Wait for server startup
echo  Waiting 8 seconds for model loading...
timeout /t 8 /nobreak >nul

:: Start Vite dev server
echo.
echo  ================================================
echo   RMS Face AI v2.0 - All Services Running
echo  ================================================
echo.
echo   Backend API:   http://127.0.0.1:5000
echo   Web Dashboard: http://localhost:5173
echo   Health Check:  http://127.0.0.1:5000/api/health
echo.
echo   Mobile App Connection:
echo     IP Address:  %LOCAL_IP%
echo     Server URL:  http://%LOCAL_IP%:5000/api
echo.
echo   To start the mobile app:
echo     cd mobile ^&^& npx expo start
echo.
echo  ================================================
echo   Press Ctrl+C to stop the frontend server.
echo   Close "RMS Flask API" window to stop the backend.
echo  ================================================
echo.

cd frontend
call npm run dev
