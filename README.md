# MVS Field Trips

Field trip management system for Mountain View School.

- **Frontend** — static single-page app (no build step), localStorage persistence
- **Backend** — Node.js + Express + SQLite (`better-sqlite3`)

## Project layout

```
mvs-manager/
├── frontend/                 ← static SPA
│   ├── index.html
│   ├── css/                  ← tokens, base, layout, components, pages, modals
│   └── js/
│       ├── utils/            ← dom, format, storage, toast
│       ├── data/             ← schema, seed, store
│       ├── components/       ← chips, kpi, table, banner
│       ├── modals/           ← modal framework + entity forms
│       ├── pages/            ← dashboard, roster, itinerary, ...
│       ├── router.js
│       └── app.js
├── backend/                  ← Express API
│   ├── src/
│   │   ├── server.js         ← entrypoint
│   │   ├── db.js             ← SQLite connection
│   │   └── routes/           ← trips, pupils, payments
│   ├── db/
│   │   ├── schema.sql        ← CREATE TABLE statements
│   │   └── mvs.sqlite        ← generated at first run (gitignored)
│   └── package.json
└── package.json              ← root scripts: dev, start, install:all
```

## Quickstart

Install dependencies once:

```bash
npm run install:all
```

Run both servers (API on :3001, web on :8000):

```bash
npm run dev
```

Open http://localhost:8000.

Run them separately if you prefer:

```bash
npm run dev:api     # http://localhost:3001
npm run dev:web     # http://localhost:8000
```

## API

Base URL: `http://localhost:3001/api`

The backend is a **key-value store** — each collection (trips, pupils, payments, documents, bookings, activities, communications, documentTypes, settings) is persisted as a single JSON blob keyed by its storage key. This mirrors the frontend's in-memory cache model, so `store.js` needs no changes.

| Method | Path                  | Notes                                      |
|--------|-----------------------|--------------------------------------------|
| GET    | `/health`             | liveness check                             |
| GET    | `/store/bootstrap`    | returns `{ key: value }` for all keys      |
| GET    | `/store/:key`         | one collection                             |
| PUT    | `/store/:key`         | replace the collection (body is the value) |
| DELETE | `/store/:key`         | remove one collection                      |
| POST   | `/store/clear`        | wipe all collections                       |

Allowed keys are enumerated in [backend/src/routes/store.js](backend/src/routes/store.js).

## Frontend architecture

Everything is a global in the browser — no modules, no bundler, no framework. Load order matters and is controlled by the `<script>` tags in `frontend/index.html`. Pages subscribe to `Store` changes via pub/sub and re-render when their domain changes.

### Data flow

```
  [Store]  ──get/set──►  [Storage cache]  ──debounced PUT──►  [API]  ──►  [SQLite]
    ▲                          ▲
    │                          │ bootstrap() on load hydrates from API
    └── subscribe/notify ──────┘
```

- **Reads** stay synchronous — served from the in-memory cache that was hydrated at boot.
- **Writes** update the cache immediately (so pages re-render instantly) and schedule a debounced `PUT /api/store/:key` (150 ms) — multiple rapid writes to the same key coalesce into one request.
- **Bootstrap** — `app.js` awaits `Storage.bootstrap()` before rendering; the cache is populated from `GET /api/store/bootstrap`.

### Store (`frontend/js/data/store.js`)

All data access goes through `Store`. Any write notifies subscribers for that collection; the router listens and re-renders the current page if its domain was touched.

```js
Store.getPupils(tripId)
Store.createPupil({...})
Store.updatePupil(id, { paymentStatus: 'paid' })
Store.createPayment({ pupilId, amount, method })
Store.subscribe('pupils', () => renderRoster());
```

## Keyboard shortcuts

- `⌘/Ctrl + Shift + E` — download a JSON backup of all data
- `⌘/Ctrl + Shift + R` — reset to seed dataset
- `Esc` — close topmost modal
