-- MVS Field Trips — SQLite schema
-- Each row stores a JSON blob for flexibility while keeping key columns
-- indexable (id, tripId, pupilId, status). Mirrors the factories in
-- frontend/js/data/schema.js.

CREATE TABLE IF NOT EXISTS trips (
  id         TEXT PRIMARY KEY,
  code       TEXT,
  name       TEXT,
  status     TEXT,
  startDate  TEXT,
  endDate    TEXT,
  data       TEXT NOT NULL,
  createdAt  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pupils (
  id            TEXT PRIMARY KEY,
  tripId        TEXT NOT NULL,
  firstName     TEXT,
  lastName      TEXT,
  grade         INTEGER,
  paymentStatus TEXT,
  status        TEXT,
  data          TEXT NOT NULL,
  createdAt     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_pupils_trip ON pupils(tripId);

CREATE TABLE IF NOT EXISTS payments (
  id       TEXT PRIMARY KEY,
  tripId   TEXT NOT NULL,
  pupilId  TEXT NOT NULL,
  amount   REAL NOT NULL DEFAULT 0,
  method   TEXT,
  paidAt   TEXT,
  data     TEXT NOT NULL,
  FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (pupilId) REFERENCES pupils(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_payments_trip ON payments(tripId);
CREATE INDEX IF NOT EXISTS idx_payments_pupil ON payments(pupilId);
