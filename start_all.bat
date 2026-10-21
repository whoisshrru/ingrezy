@echo off
echo ===================================================
echo             Starting Ingrezy Full Stack
echo ===================================================
echo.

echo [1/3] Starting Backend API (http://localhost:5000)...
start "Ingrezy Backend" cmd /k "cd /d D:\ingrezy\backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Admin Dashboard (http://localhost:3000)...
start "Ingrezy Admin" cmd /k "cd /d D:\ingrezy\admin && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Flutter Mobile App (Windows Desktop)...
start "Ingrezy Mobile" cmd /k "cd /d D:\ingrezy\mobile && flutter run -d windows"

echo.
echo ===================================================
echo  All 3 services are launching in their own windows!
echo ===================================================
pause
