@echo off
echo ========================================
echo   LiveBoard Production Server
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Set production environment
set NODE_ENV=production

REM Load production environment variables
if exist .env.production (
    echo Loading production environment...
    for /f "delims=" %%i in (.env.production) do set %%i
) else (
    echo WARNING: .env.production not found
    echo Using default configuration
)

REM Check if dependencies are installed
if not exist server\node_modules (
    echo Installing server dependencies...
    cd server
    call npm install
    cd ..
)

REM Start the server
echo.
echo Starting LiveBoard server on port %PORT%...
echo Press Ctrl+C to stop
echo.
cd server
node src\bulletproof-server.js

pause
