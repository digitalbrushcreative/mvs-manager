# MVS Field Trips

Field trip, club, and staff management for Mountain View School.

- **Web** — React + Vite SPA with CSS Modules and a token-based design system
- **Backend** — Node.js + Express + SQLite (`better-sqlite3`)

## Project layout

```
mvs-manager/
├── web/                            ← React SPA (Vite)
│   ├── public/                     ← static assets (logo, favicon)
│   ├── index.html
│   ├── vite.config.js              ← /api proxy → :3001
│   └── src/
│       ├── main.jsx
│       ├── app/                    ← Providers, router
│       ├── styles/                 ← tokens.css, global.css
│       ├── lib/                    ← api, auth, schema, format, queryClient
│       │   └── hooks/              ← TanStack Query hooks per domain
│       ├── design-system/          ← Button, Card, Modal, Toast, Table,
│       │                             Form, Chip, Badge, Avatar, KpiTile,
│       │                             Donut, StackedBarGrid, Spinner, EmptyState
│       ├── components/              ← TopNav, SubNav, PageContainer,
│       │                             PageHeader, Crest, Layouts,
│       │                             ProtectedRoute, Placeholder
│       └── features/
│           ├── auth/                ← login
│           ├── trips/               ← trip manager (10 routes + forms)
│           ├── clubs/               ← club manager (dashboard, list,
│           │                          members, trips, detail)
│           ├── staff/               ← staff directory
│           ├── parent/              ← parent landing, dashboard, trip detail
│           └── error/               ← forbidden, 404
├── backend/                        ← Express API
│   ├── src/
│   │   ├── server.js
│   │   ├── db.js                   ← SQLite connection
│   │   └── routes/                 ← auth, public, store
│   └── db/
│       ├── schema.sql
│       └── mvs.sqlite              ← generated at first run (gitignored)
└── package.json                    ← root scripts: dev, start, install:all
```

## Quickstart

```bash
npm run install:all
npm run dev
```

- API at <http://localhost:3001>
- Web at <http://localhost:5173>

Run them separately:

```bash
npm run dev:api    # backend only
npm run dev:web    # React app only
```

Demo logins:

- Admin — `admin@mvs.test` / `admin123`
- Parent — `parent@example.com` / `parent123`

## Deploying to Railway

The repo is set up for two Railway services from this single GitHub repo. Each
service has a `railway.json` at its root and uses Nixpacks.

**1. API service (`backend/`)**

- New Service → Deploy from GitHub → repo `mvs-manager`
- Settings → Source → **Root Directory** = `backend`
- Variables:
  - `DB_PATH=/data/mvs.sqlite`
  - `NODE_ENV=production`
- Volumes → New Volume, mount path `/data`, size 1GB
- Generate Domain → note the `*.up.railway.app` URL (used below)

**2. Web service (`web/`)**

- New Service → Deploy from GitHub → same repo
- Settings → Source → **Root Directory** = `web`
- Variables:
  - `API_URL=https://<api-service>.up.railway.app` (from step 1, no trailing slash)
- Generate Domain

The web service runs a tiny Node host (`web/server.js`) that serves `dist/` and
proxies `/api/*` to `API_URL`. That makes the SPA same-origin (no CORS) and lets
you change the API URL without rebuilding. The API service exposes
`/api/health` for Railway's healthcheck.

## API

Base URL: `http://localhost:3001/api` (Vite proxies `/api/*` to this in dev).

The backend is a **key-value store** — each collection (trips, pupils,
payments, documents, bookings, activities, communications, document-types,
clubs, club-members, staff, settings, …) is persisted as a single JSON blob
keyed by its storage key.

| Method | Path                | Notes                                      |
|--------|---------------------|--------------------------------------------|
| GET    | `/health`           | liveness check                             |
| GET    | `/store/bootstrap`  | returns `{ key: value }` for all keys      |
| GET    | `/store/:key`       | one collection                             |
| PUT    | `/store/:key`       | replace the collection (body is the value) |
| DELETE | `/store/:key`       | remove one collection                      |
| POST   | `/store/clear`      | wipe all collections                       |
| POST   | `/auth/login`       | returns `{ token, user }`                  |
| GET    | `/auth/me`          | current user (Bearer token)                |
| POST   | `/auth/logout`      | invalidate the current token               |

Allowed kv-store keys are enumerated in
[backend/src/routes/store.js](backend/src/routes/store.js).

## Web architecture

The React app uses **TanStack Query** as the cache for the kv-store. Each
collection has a domain hook (`useTrips`, `usePupils`, …) backed by a single
`useStoreCollection(key, factory)` primitive — it fetches the JSON blob,
exposes `{ data, create, update, remove, replace }`, and patches the cache
optimistically before persisting via PUT.

Three role areas:

- `/admin/*` — school staff (admin role required)
- `/parent/*` — public landing + protected parent dashboard
- `/auth/login` — single sign-in for both

Routing is in [web/src/app/router.jsx](web/src/app/router.jsx). Module-level
sub-navigation is composed via the `SubNav` component plus a per-module
layout that provides outlet context for opening shared modals (e.g. the trip
form).

### Design system

All visual primitives live under `web/src/design-system/`. Each is a folder
with `Component.jsx` + `Component.module.css`. Tokens (colour, spacing,
typography, radii, shadows) come from
[web/src/styles/tokens.css](web/src/styles/tokens.css) — adjusting a token
ripples through the whole app.

Convention: only design-system components carry visual primitives; feature
code composes them but never re-derives styling from raw colour values.
