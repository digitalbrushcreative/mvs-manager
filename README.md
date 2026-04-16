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

| Method | Path                       | Notes                              |
|--------|----------------------------|------------------------------------|
| GET    | `/health`                  | liveness check                     |
| GET    | `/trips`                   |                                    |
| GET    | `/trips/:id`               |                                    |
| POST   | `/trips`                   |                                    |
| PATCH  | `/trips/:id`               | merges into existing record        |
| DELETE | `/trips/:id`               | cascades to pupils and payments    |
| GET    | `/pupils?tripId=...`       |                                    |
| POST   | `/pupils`                  | `tripId` required                  |
| PATCH  | `/pupils/:id`              |                                    |
| DELETE | `/pupils/:id`              |                                    |
| GET    | `/payments?tripId=&pupilId=` |                                  |
| POST   | `/payments`                | `tripId` and `pupilId` required    |
| DELETE | `/payments/:id`            |                                    |

## Frontend architecture

Everything is a global in the browser — no modules, no bundler, no framework. Load order matters and is controlled by the `<script>` tags in `frontend/index.html`. Data currently lives in `localStorage` under the `mvs-trips:*` namespace. Pages subscribe to `Store` changes via pub/sub and re-render when their domain changes.

### Store (`frontend/js/data/store.js`)

All data access goes through `Store`. Any write notifies subscribers for that collection; the router listens and re-renders the current page if its domain was touched.

```js
Store.getPupils(tripId)
Store.createPupil({...})
Store.updatePupil(id, { paymentStatus: 'paid' })
Store.createPayment({ pupilId, amount, method })
Store.subscribe('pupils', () => renderRoster());
```

### Wiring the frontend to the backend

The frontend still reads/writes `localStorage`. To migrate, replace the `Storage.get/set` calls inside `store.js` with `fetch()` calls to the API. Keep the pub/sub layer untouched — pages won't know the difference.

## Keyboard shortcuts

- `⌘/Ctrl + Shift + E` — download a JSON backup of all data
- `⌘/Ctrl + Shift + R` — reset to seed dataset
- `Esc` — close topmost modal
