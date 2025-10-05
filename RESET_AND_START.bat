@echo off
echo ========================================
echo   LiveBoard - Reset and Clean Start
echo ========================================
echo.

echo [STEP 1/5] Killing any processes on port 4000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
    taskkill /F /PID %%a 2>nul
)
echo Done!
echo.

echo [STEP 2/5] Clearing browser cache and build artifacts...
if exist "client\dist" (
    rmdir /s /q "client\dist"
    echo Removed client\dist
)
if exist "client\.vite" (
    rmdir /s /q "client\.vite"
    echo Removed client\.vite
)
echo Done!
echo.

echo [STEP 3/5] Starting backend server...
start "LiveBoard Backend" cmd /k "cd /d %~dp0server && echo Starting backend on port 4000... && npm run dev"
timeout /t 5 /nobreak >nul
echo Backend started!
echo.

echo [STEP 4/5] Starting frontend dev server...
start "LiveBoard Frontend" cmd /k "cd /d %~dp0client && echo Starting frontend on port 5173... && npm run dev"
timeout /t 5 /nobreak >nul
echo Frontend started!
echo.

echo [STEP 5/5] Opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo.

echo ========================================
echo   LiveBoard is Running!
echo ========================================
echo.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:5173
echo.
echo IMPORTANT: Clear your browser cache!
echo   Press Ctrl+Shift+Delete in browser
echo   Or use Incognito/Private mode
echo.
echo Login Credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo Two terminal windows are open for monitoring.
echo Press Ctrl+C in each window to stop servers.
echo.
pause
