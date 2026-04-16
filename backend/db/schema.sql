-- MVS Field Trips — SQLite schema
--
-- One table, key-value. Each collection from the frontend (trips, pupils,
-- payments, documents, bookings, activities, communications, documentTypes,
-- settings) is persisted as a single JSON blob keyed by its StorageKey.
--
-- This mirrors the frontend's localStorage model exactly: Storage.get(key)
-- returns a JSON-parsed value, Storage.set(key, value) persists the whole
-- collection. The backend adds durability, shared access, and backup.

CREATE TABLE IF NOT EXISTS kv_store (
  key       TEXT PRIMARY KEY,
  value     TEXT NOT NULL,
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
