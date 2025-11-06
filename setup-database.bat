@echo off
echo ========================================
echo LiveDisplay PostgreSQL Setup
echo ========================================
echo.

echo Step 1: Starting PostgreSQL with Docker...
docker-compose up -d postgres
timeout /t 5 /nobreak >nul

echo.
echo Step 2: Generating Prisma Client...
cd server
call npx prisma generate

echo.
echo Step 3: Running database migrations...
call npx prisma db push

echo.
echo Step 4: Initializing default data...
node src/utils/dbInit.js

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Default Login Credentials:
echo Username: admin
echo Password: admin123
echo.
echo To start the application:
echo - Run: npm run dev:server (in server directory)
echo - Run: npm run dev:client (in client directory)
echo.
pause
