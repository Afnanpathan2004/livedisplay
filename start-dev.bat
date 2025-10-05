@echo off
echo ========================================
echo   LiveBoard Development Startup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed or not in PATH
    pause
    exit /b 1
)

echo [INFO] npm version:
npm --version
echo.

REM Install dependencies if needed
echo [STEP 1/4] Checking dependencies...
if not exist "node_modules\" (
    echo [INFO] Installing root dependencies...
    call npm install
)

if not exist "server\node_modules\" (
    echo [INFO] Installing server dependencies...
    cd server
    call npm install
    cd ..
)

if not exist "client\node_modules\" (
    echo [INFO] Installing client dependencies...
    cd client
    call npm install
    cd ..
)

echo [SUCCESS] Dependencies ready!
echo.

REM Start backend server
echo [STEP 2/4] Starting backend server on port 4000...
start "LiveBoard Backend" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 3 /nobreak >nul

REM Start frontend dev server
echo [STEP 3/4] Starting frontend dev server on port 5173...
start "LiveBoard Frontend" cmd /k "cd /d %~dp0client && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   LiveBoard Started Successfully!
echo ========================================
echo.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:5173
echo.
echo Demo Login Credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo [INFO] Two terminal windows have been opened:
echo   1. Backend Server (port 4000)
echo   2. Frontend Server (port 5173)
echo.
echo Press Ctrl+C in each window to stop the servers
echo.
pause
