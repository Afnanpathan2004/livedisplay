# 🔄 Restart Instructions - Fix 401 Errors

## The Problem
You're seeing 401 errors because:
1. The backend server is running OLD code (before I made endpoints public)
2. Browser is using cached old build

## The Solution (Follow These Steps)

### Step 1: Stop All Running Servers

In your terminal where backend is running, press:
```
Ctrl + C
```

If that doesn't work, close the terminal window.

### Step 2: Start Backend with NEW Code

Open a **NEW** terminal and run:
```bash
cd f:\LiveDisplay\server
npm run dev
```

You should see:
```
✅ Admin user created: admin/admin123
🚀 Server running on http://localhost:4000
```

### Step 3: Verify Backend is Working

Open **ANOTHER** terminal and run:
```bash
cd f:\LiveDisplay
node test-endpoints.js
```

You should see:
```
✅ Health Check: { ok: true, ... }
✅ Schedule Endpoint (Public): X schedules found
✅ Announcements Endpoint (Public): X announcements found
✅ Dashboard Endpoint (Protected): Correctly requires authentication
```

If you see ❌ errors, the backend isn't running properly.

### Step 4: Clear Browser Cache

**Option A: Hard Refresh**
1. In your browser, press: `Ctrl + Shift + R` or `Ctrl + F5`

**Option B: Clear Cache**
1. Press: `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"

**Option C: Use Incognito Mode** (EASIEST)
1. Press: `Ctrl + Shift + N` (Chrome) or `Ctrl + Shift + P` (Firefox)
2. Go to: http://localhost:5173

### Step 5: Test the Application

1. **Test Display Page (Public - No Login)**:
   - Go to: http://localhost:5173/display
   - Should load WITHOUT errors ✅
   - Should show schedules and announcements

2. **Test Login**:
   - Go to: http://localhost:5173/login
   - Login: `admin` / `admin123`
   - Should redirect to dashboard ✅

3. **Test Dashboard (Protected)**:
   - Should show statistics
   - Can create schedules, announcements, tasks ✅

## Quick Checklist

- [ ] Backend server stopped (Ctrl+C)
- [ ] Backend server restarted with `npm run dev`
- [ ] Test script shows ✅ for public endpoints
- [ ] Browser cache cleared OR using Incognito
- [ ] Display page loads without 401 errors
- [ ] Login works
- [ ] Dashboard works after login

## Still Having Issues?

### Issue: "Port 4000 already in use"
```powershell
# Find and kill the process
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force
```

### Issue: "Backend won't start"
```bash
cd server
npm install
npm run dev
```

### Issue: "Still seeing 401 errors"
1. Make sure backend is running (check terminal)
2. Make sure you cleared browser cache
3. Try Incognito mode
4. Check browser console for actual error

### Issue: "Dashboard shows 401"
- This is CORRECT behavior!
- Dashboard requires login
- Go to `/login` first
- Then access dashboard

## What Changed in the Code

I modified `server/src/bulletproof-server.js`:

**Before:**
```javascript
app.get('/api/schedule', requireAuth, (req, res) => {
  // Required authentication
});
```

**After:**
```javascript
app.get('/api/schedule', (req, res) => {
  // NO authentication required - public endpoint
});
```

Same for `/api/announcements` - now public for display page.

## Summary

The fix is applied in the code. You just need to:
1. **Restart backend** with the new code
2. **Clear browser cache** to see the changes

That's it! 🎉
