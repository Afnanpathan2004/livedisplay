# 🚀 LiveDisplay - Quick Start Guide

## Prerequisites
- Node.js installed (v16 or higher)
- npm installed
- Ports 4000 and 5173 available

## 🎯 Start the Application (Easiest Method)

### Windows
Simply double-click or run:
```bash
RESET_AND_START.bat
```

This will:
1. Kill any processes on port 4000
2. Clear build cache
3. Start backend server on port 4000
4. Start frontend dev server on port 5173
5. Open browser automatically

### Manual Start

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

## 🔐 Login Credentials

```
Username: admin
Password: admin123
```

## 📍 Access Points

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000
- **Display Page:** http://localhost:5173/display
- **Admin Panel:** http://localhost:5173/login (then navigate to Admin)
- **Health Check:** http://localhost:4000/api/health

## 🎨 Main Features

### 1. Display Page (Public)
- View today's schedules
- See active announcements
- Real-time updates
- No login required

**URL:** http://localhost:5173/display

### 2. Admin Panel (Protected)
Login required to access:

#### Schedules Tab
- Add new schedule entries
- Edit existing schedules
- Delete schedules
- Filter by date, room, faculty

**Format:**
```
Date: YYYY-MM-DD
Start Time: HH:MM (e.g., 10:00)
End Time: HH:MM (e.g., 11:30)
Room Number: Room 101
Subject: Computer Science
Faculty Name: Dr. Smith
```

#### Announcements Tab
- Create announcements
- Edit active announcement
- Announcements appear on display page

#### Tasks Tab
- Create tasks
- Update task status
- Set priorities
- Track completion

#### Employees Tab
- Add employee records
- Edit employee info
- Delete employees

#### Visitors Tab
- Check-in visitors
- Track visitor information
- Check-out visitors

#### Rooms Tab
- Add rooms
- Set capacity
- List amenities

## 🧪 Testing

### Quick Feature Test
1. **Login** → Use admin/admin123
2. **Add Schedule** → Go to Admin → Schedules → Fill form → Submit
3. **View Display** → Open http://localhost:5173/display
4. **Verify** → Schedule should appear on display page

### Run Automated Tests
```bash
node test-api.js
```

This will test all API endpoints automatically.

## 📊 Sample Data Included

The application starts with:
- ✅ 3 sample schedules for today
- ✅ 1 welcome announcement
- ✅ 1 completed task
- ✅ Admin user (admin/admin123)

## 🔧 Troubleshooting

### Issue: Port already in use
**Solution:** Run `RESET_AND_START.bat` which kills processes on port 4000

### Issue: Blank page or errors
**Solution:** 
1. Clear browser cache (Ctrl+Shift+Delete)
2. Use incognito/private mode
3. Restart servers

### Issue: Schedule not showing
**Solution:**
1. Check date is set to today
2. Verify time format is HH:MM (e.g., 10:00)
3. Check browser console for errors

### Issue: Login not working
**Solution:**
1. Ensure backend is running (check http://localhost:4000/api/health)
2. Use exact credentials: admin/admin123
3. Check browser console for errors

## 📱 Features Overview

### ✅ Working Features
- [x] User Authentication (JWT)
- [x] Schedule Management (CRUD)
- [x] Announcement Management (CRUD)
- [x] Task Management (CRUD)
- [x] Employee Management (CRUD)
- [x] Visitor Management
- [x] Room Management
- [x] Real-time WebSocket Updates
- [x] Display Page with Live Data
- [x] Dashboard Statistics
- [x] Responsive Design

### 🎯 Key Endpoints

**Public:**
- GET `/api/health` - Server status
- GET `/api/schedule?date=YYYY-MM-DD` - Get schedules
- GET `/api/announcements` - Get announcements

**Protected (requires auth token):**
- POST `/api/auth/login` - Login
- POST `/api/schedule` - Create schedule
- POST `/api/announcements` - Create announcement
- POST `/api/tasks` - Create task
- GET `/api/dashboard/stats` - Dashboard data

## 🎨 UI Navigation

```
http://localhost:5173
├── / (Landing Page)
├── /login (Login Page)
├── /display (Public Display - No Auth)
├── /dashboard (User Dashboard - Auth Required)
└── /admin (Admin Panel - Auth Required)
    ├── Schedules Tab
    ├── Announcements Tab
    ├── Tasks Tab
    ├── Employees Tab
    ├── Visitors Tab
    └── Rooms Tab
```

## 💡 Pro Tips

1. **Use Today's Date:** Schedules only show on display if date matches today
2. **Time Format:** Always use 24-hour format (HH:MM)
3. **Real-time Updates:** Changes may require page refresh
4. **Multiple Tabs:** Open display in one tab, admin in another to see updates
5. **Sample Data:** Server includes sample data on startup for testing

## 📝 Next Steps

1. ✅ Start the application
2. ✅ Login with admin/admin123
3. ✅ Explore the Admin Panel
4. ✅ Add a schedule for today
5. ✅ View it on the Display page
6. ✅ Create an announcement
7. ✅ Test other features

## 🆘 Need Help?

- Check `TEST_FEATURES.md` for detailed testing guide
- Check `FIXES_APPLIED.md` for technical details
- Run `node test-api.js` to verify API health
- Check browser console for frontend errors
- Check terminal for backend errors

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Login redirects to dashboard
- ✅ Can create schedule without errors
- ✅ Schedule appears on display page
- ✅ Announcements show on display page
- ✅ All tabs in admin panel load
- ✅ API test script passes all tests

---

**Status: Ready to Use** 🚀

For production deployment, see `DEPLOYMENT.md`
