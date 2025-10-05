# 🚀 LiveBoard Development Environment Setup & Troubleshooting Guide

## 📋 Complete Step-by-Step Checklist

### Phase 1: Environment Verification & Cleanup

#### 1.1 Check Current Processes
```bash
# Check for running Node.js processes
Get-Process -Name node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName

# Kill any existing processes if needed
taskkill /f /im node.exe 2>nul
```

#### 1.2 Verify Port Availability
```bash
# Check if ports are in use
netstat -ano | findstr :4000
netstat -ano | findstr :5174

# Alternative: Use PowerShell
Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue
```

#### 1.3 Environment Variables Check
```bash
# Verify .env files exist and are properly configured
Test-Path .\.env.local
Test-Path .\server\.env.local
Test-Path .\client\.env.local

# Check .env content (if exists)
Get-Content .\.env.local -ErrorAction SilentlyContinue
```

---

### Phase 2: Backend Server Setup (Port 4000)

#### 2.1 Navigate to Server Directory
```bash
cd f:\LiveDisplay\server
```

#### 2.2 Install Dependencies (if needed)
```bash
npm install
```

#### 2.3 Start Backend Server
```bash
# Development mode with auto-restart
npm run dev

# Alternative: Production mode
npm start
```

#### 2.4 Verify Backend is Running
```bash
# Test health endpoint
Invoke-WebRequest -Uri http://localhost:4000/api/health -UseBasicParsing -TimeoutSec 5

# Test Socket.io endpoint
Invoke-WebRequest -Uri http://localhost:4000/socket.io/ -UseBasicParsing -TimeoutSec 5

# Test authentication endpoint
$body = @{username="admin"; password="admin123"} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:4000/api/auth/login -Method POST -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "ok": true,
  "timestamp": "2025-01-30T...",
  "uptime": 0.123,
  "users": 1,
  "schedules": 1,
  "announcements": 1,
  "tasks": 1
}
```

---

### Phase 3: Frontend Client Setup (Port 5174)

#### 3.1 Navigate to Client Directory
```bash
cd f:\LiveDisplay\client
```

#### 3.2 Install Dependencies (if needed)
```bash
npm install
```

#### 3.3 Start Vite Development Server
```bash
npm run dev
```

#### 3.4 Verify Frontend is Running
```bash
# Test main application
Invoke-WebRequest -Uri http://localhost:5174/ -UseBasicParsing -TimeoutSec 5

# Test display endpoint
Invoke-WebRequest -Uri http://localhost:5174/display -UseBasicParsing -TimeoutSec 5
```

**Expected Response:** `StatusCode: 200`

---

### Phase 4: Socket.io Real-time Testing

#### 4.1 Test WebSocket Connection
```bash
# Test Socket.io endpoint availability
Invoke-WebRequest -Uri http://localhost:4000/socket.io/ -UseBasicParsing -TimeoutSec 5

# Monitor server logs for connection messages
# Should see: "🔗 Client connected: [socket-id]"
```

#### 4.2 Test Real-time Features
```bash
# Create a test schedule via API
$scheduleBody = @{
  title="Test Schedule"
  content="Testing real-time updates"
  startTime="2025-01-30T15:00:00Z"
  endTime="2025-01-30T16:00:00Z"
  type="meeting"
  priority="medium"
} | ConvertTo-Json

# Note: Requires authentication token from login
```

---

### Phase 5: Authentication Testing

#### 5.1 Login Test
```bash
# Test login with default credentials
$loginBody = @{username="admin"; password="admin123"} | ConvertTo-Json
$response = Invoke-WebRequest -Uri http://localhost:4000/api/auth/login -Method POST -Body $loginBody -ContentType "application/json"
$token = ($response.Content | ConvertFrom-Json).token

# Store token for subsequent requests
$headers = @{"Authorization" = "Bearer $token"}
```

#### 5.2 Protected Route Test
```bash
# Test accessing protected API routes
Invoke-WebRequest -Uri http://localhost:4000/api/schedule -Headers $headers -UseBasicParsing

Invoke-WebRequest -Uri http://localhost:4000/api/dashboard/stats -Headers $headers -UseBasicParsing
```

---

### Phase 6: Complete Application Testing

#### 6.1 Frontend-Application Integration
1. Open browser to `http://localhost:5174/display`
2. Verify real-time connection status indicator shows "Connected"
3. Test login functionality at `http://localhost:5174/login`
4. Verify schedule/announcement updates appear in real-time

#### 6.2 Error Monitoring
```bash
# Monitor browser console for:
# ✅ "🔗 Socket connected successfully"
# ❌ Any connection errors or warnings

# Monitor server logs for:
# ✅ "🎉 ===== LIVEBOARD SERVER STARTED SUCCESSFULLY ====="
# ✅ "🔗 Client connected: [socket-id]"
# ✅ "🔐 Socket authenticated for user: [username]"
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Port Already in Use
```bash
# Find process using the port
netstat -ano | findstr :4000
# Kill process: taskkill /PID [PID] /F

# Alternative: Change port in server/src/bulletproof-server.js
const PORT = process.env.PORT || 4001; # Change to 4001
```

### Issue 2: Environment Variables Not Set
```bash
# Create .env.local files if missing
New-Item -Path .\server\.env.local -ItemType File -Force
New-Item -Path .\client\.env.local -ItemType File -Force

# Add required variables:
# server/.env.local:
# JWT_SECRET=your-super-secret-jwt-key-for-liveboard
# PORT=4000

# client/.env.local:
# VITE_WEBSOCKET_URL=http://localhost:4000
```

### Issue 3: Dependencies Missing
```bash
# Clean install for server
cd f:\LiveDisplay\server
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
npm install

# Clean install for client
cd f:\LiveDisplay\client
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
npm install
```

### Issue 4: React Router Future Flags (Optional)
```bash
# In client/src/main.jsx or App.jsx, add future flags:
import { BrowserRouter } from 'react-router-dom'

<BrowserRouter
  future={{
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }}
>
```

---

## 🔄 Quick Recovery Commands

### Complete Restart (Nuclear Option)
```bash
# Kill all Node processes
taskkill /f /im node.exe 2>nul

# Clean start backend
cd f:\LiveDisplay\server && npm run dev

# Clean start frontend (in new terminal)
cd f:\LiveDisplay\client && npm run dev
```

### Health Check One-Liner
```bash
# Quick status check
Write-Host "=== LiveBoard Health Check ===" -ForegroundColor Green
try { Invoke-WebRequest -Uri http://localhost:4000/api/health -UseBasicParsing -TimeoutSec 3 | Out-Null; Write-Host "✅ Backend: OK" -ForegroundColor Green } catch { Write-Host "❌ Backend: DOWN" -ForegroundColor Red }
try { Invoke-WebRequest -Uri http://localhost:5174/ -UseBasicParsing -TimeoutSec 3 | Out-Null; Write-Host "✅ Frontend: OK" -ForegroundColor Green } catch { Write-Host "❌ Frontend: DOWN" -ForegroundColor Red }
try { Invoke-WebRequest -Uri http://localhost:4000/socket.io/ -UseBasicParsing -TimeoutSec 3 | Out-Null; Write-Host "✅ Socket.io: OK" -ForegroundColor Green } catch { Write-Host "❌ Socket.io: DOWN" -ForegroundColor Red }
```

---

## 🎯 Development Workflow

### Daily Development Cycle
1. **Start Backend**: `cd f:\LiveDisplay\server && npm run dev`
2. **Start Frontend**: `cd f:\LiveDisplay\client && npm run dev`
3. **Test Connection**: Visit `http://localhost:5174/display`
4. **Verify Real-time**: Check browser console for socket connection
5. **Login Test**: Visit `http://localhost:5174/login` (admin/admin123)

### Production Deployment
```bash
# Build for production
cd f:\LiveDisplay\client && npm run build

# Start production server
cd f:\LiveDisplay\server && npm run start:prod
```

---

## 📊 Monitoring & Debugging

### Server Logs Monitoring
```bash
# Monitor server console output for:
# ✅ "🎉 ===== LIVEBOARD SERVER STARTED SUCCESSFULLY ====="
# ✅ "🔗 Client connected: [socket-id]"
# ✅ "✅ Admin user created: admin/admin123"
# ✅ "✅ Sample data loaded for demo"
# ❌ Any error messages or stack traces
```

### Browser Console Monitoring
```bash
# Monitor for:
# ✅ "🔗 Socket connected successfully"
# ✅ "🔐 Socket authenticated for user: [username]"
# ❌ "❌ Socket connection error"
# ❌ WebSocket connection failures
```

---

## 🚨 Emergency Fixes

### If Everything Fails
```bash
# 1. Nuclear reset
taskkill /f /im node.exe 2>nul

# 2. Clear all caches
cd f:\LiveDisplay\client && Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue
cd f:\LiveDisplay\server && Remove-Item node_modules/.cache -Recurse -Force -ErrorAction SilentlyContinue

# 3. Fresh install
cd f:\LiveDisplay && npm install

# 4. Start servers
cd f:\LiveDisplay\server && npm run dev
cd f:\LiveDisplay\client && npm run dev
```

---

## ✅ Verification Checklist

- [ ] Backend server running on port 4000
- [ ] Frontend server running on port 5174
- [ ] Socket.io endpoint accessible
- [ ] Authentication working (admin/admin123)
- [ ] Real-time updates functional
- [ ] No console errors in browser
- [ ] No connection refused errors
- [ ] All CRUD operations working
- [ ] Dashboard statistics updating

---

*This guide ensures reliable setup and quick troubleshooting for the LiveBoard development environment.* 🎯
