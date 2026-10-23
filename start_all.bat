@echo off
echo ===================================================
echo             Starting Ingrezy Full Stack
echo   Connected to Render Backend: https://ingrezy.onrender.com
echo ===================================================
echo.

echo [Optional] Press 'Y' if you want to start a local backend server (port 5000)
echo Otherwise, press Enter to use the live Render backend...
set /p START_LOCAL_BE="Start local backend? (y/N): "
if /i "%START_LOCAL_BE%"=="y" (
    echo Starting Local Backend API (http://localhost:5000)...
    start "Ingrezy Backend" cmd /k "cd /d D:\ingrezy\backend && npm run dev"
    timeout /t 3 /nobreak >nul
) else (
    echo Using live Render backend (https://ingrezy.onrender.com) - no local backend needed!
)

echo [1/2] Starting Admin Dashboard (http://localhost:3000)...
start "Ingrezy Admin" cmd /k "cd /d D:\ingrezy\admin && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Flutter Mobile App (Chrome Web Browser)...
start "Ingrezy Mobile" cmd /k "cd /d D:\ingrezy\mobile && flutter run -d chrome"

echo.
echo ===================================================
echo  Services launched! Connected to https://ingrezy.onrender.com
echo ===================================================
pause
