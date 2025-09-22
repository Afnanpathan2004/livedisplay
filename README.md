# LiveBoard

A production-ready, real-time daily class schedule display for TVs in offices and educational environments.

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + Prisma + Socket.IO
- Database: PostgreSQL (via Prisma)
- Realtime: Socket.IO
- Cron: node-cron (midnight reset)

## Monorepo Structure

```
project-root/
├── client/ (React Frontend)
│   ├── src/
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── server/ (Express Backend)
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── websocket/
│   │   ├── utils/
│   │   └── cron/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.example
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Features

- Fullscreen TV display UI (kiosk-ready) with current time/date
- Room-wise grid for current and upcoming schedules
- Color-coded slots (current: green, past: gray, upcoming: yellow)
- Admin panel for CRUD on schedule entries, announcements (optional auth)
- Realtime updates via WebSocket to all connected displays
- Automated midnight tick/reset to advance day and refresh displays
- Dark mode, responsive

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
