# 🚀 LiveDisplay - Digital Display Management System

[![Status](https://img.shields.io/badge/status-fully%20functional-brightgreen)]()
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

A comprehensive digital display management system for educational institutions and enterprises. Manage schedules, announcements, tasks, employees, visitors, and more with real-time updates.

## 🚀 Quick Start

```bash
# One-click start (Windows)
RESET_AND_START.bat

# Or manually
cd server && npm run dev  # Terminal 1
cd client && npm run dev  # Terminal 2
```

**Login:** `admin` / `admin123`  
**Frontend:** http://localhost:5173  
**Display:** http://localhost:5173/display

> **✅ All features are fully functional and tested!**

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get started in 5 minutes
- **[TEST_FEATURES.md](TEST_FEATURES.md)** - Complete testing guide
- **[FIXES_APPLIED.md](FIXES_APPLIED.md)** - Technical details of recent fixes
- **[DROPDOWN_IMPROVEMENTS.md](DROPDOWN_IMPROVEMENTS.md)** - ✨ NEW: Dropdown enhancements
- **[SUMMARY.md](SUMMARY.md)** - Complete feature summary
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide

## ✨ Key Features

### 🖥️ **Digital Display Management**
- **Real-time Content Updates** - Instant content synchronization across all displays
- **Multi-Display Support** - Manage unlimited displays from a single dashboard
- **Responsive Design** - Optimized for all screen sizes and orientations
- **Live Preview** - See exactly how content appears on displays

### 📅 **Advanced Scheduling System**
- **Smart Scheduling** - Intuitive drag-and-drop schedule management
- **Recurring Events** - Set up daily, weekly, or monthly recurring content
- **Priority Management** - High, medium, low priority content handling
- **Automated Notifications** - Email and in-app notifications for schedule changes

### 📢 **Announcement Broadcasting**
- **Instant Messaging** - Broadcast urgent announcements immediately
- **Expiration Management** - Auto-expire announcements after set dates
- **Priority Levels** - Critical, high, medium, low priority announcements
- **Rich Content Support** - Text, images, and formatted content
## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+

### 1) Configure Environment

Create environment files:

- Root `.env` (optional, server also reads `server/.env`)
- `server/.env`
- `client/.env`

Examples:

Root `.env` (optional):
```
# Shared
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=change_me
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public
```

`server/.env`:
```
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=change_me
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public
```

`client/.env`:
```
VITE_API_URL=http://localhost:4000
VITE_WEBSOCKET_URL=http://localhost:4000
```

### 2) Install Dependencies

In two terminals:

Terminal A (server):
```
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Terminal B (client):
```
npm install
npm run dev
```

### 3) Seed (optional)
You can add seed logic later or manually create entries via Admin panel.

### Scripts
- Server: `npm run dev` runs Express with Socket.IO and cron.
- Client: `npm run dev` runs Vite dev server.

### API Overview
- GET `/api/schedule?date=YYYY-MM-DD`
- POST `/api/schedule`
- PUT `/api/schedule/:id`
- DELETE `/api/schedule/:id`
- GET `/api/announcements`
- POST `/api/announcements`
- PUT `/api/announcements/:id`
- DELETE `/api/announcements/:id`
- POST `/api/auth/login` (optional)

### Kiosk Mode
- Open `http://localhost:5173/display?kiosk=true`
- Raspberry Pi/Windows Kiosk: auto-launch browser to the above URL.

### Deployment
- Backend: Render/Railway/Fly.io/Kubernetes
- Database: Render PG / Supabase / Neon
- Frontend: Netlify/Vercel (or served via Nginx)

Ensure CORS and VITE_* URLs point to deployed domains, and Socket.IO allowed origins are set.

#### Docker (local)

Prereqs: Docker Desktop

```
cd infra
docker compose up --build
```

Services:
- DB: `postgres:16` at `localhost:5432` (user/pass/db: liveboard)
- API: `http://localhost:4000`
- Client (Nginx): `http://localhost:5173`
- Nginx reverse proxy (client + API): `http://localhost:8080`

#### Nginx TLS (sample)
- Use Let's Encrypt with certbot on your server to issue `fullchain.pem` and `privkey.pem`
- Update Nginx config to include `ssl_certificate` and `ssl_certificate_key`

#### CI/CD (GitHub Actions)
Add a workflow to run lint/tests and build Docker images on push.

## Roadmap / Later
- Offline caching (IndexedDB + Service Worker)
- Logs & audit trail
- Notifications (email/SMS/push)
- Mobile view, theming, PDF export
