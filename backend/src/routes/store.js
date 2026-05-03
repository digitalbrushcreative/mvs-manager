const express = require('express');
const db = require('../db');

const router = express.Router();

const ALLOWED_KEYS = new Set([
  'mvs-trips:trips',
  'mvs-trips:pupils',
  'mvs-trips:payments',
  'mvs-trips:documents',
  'mvs-trips:bookings',
  'mvs-trips:activities',
  'mvs-trips:communications',
  'mvs-trips:document-types',
  'mvs-trips:interests',
  'mvs-trips:clubs',
  'mvs-trips:club-members',
  'mvs-trips:staff',
  'mvs-trips:users',
  'mvs-trips:sessions',
  'mvs-trips:settings',
  'mvs-trips:seeded'
]);

router.get('/bootstrap', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM kv_store').all();
  const out = {};
  for (const { key, value } of rows) {
    try { out[key] = JSON.parse(value); } catch { out[key] = null; }
  }
  res.json(out);
});

router.get('/:key', (req, res) => {
  if (!ALLOWED_KEYS.has(req.params.key)) return res.status(400).json({ error: 'unknown key' });
  const row = db.prepare('SELECT value FROM kv_store WHERE key = ?').get(req.params.key);
  if (!row) return res.status(404).json({ error: 'not found' });
  try { res.json(JSON.parse(row.value)); }
  catch { res.status(500).json({ error: 'corrupt value' }); }
});

router.put('/:key', (req, res) => {
  const { key } = req.params;
  if (!ALLOWED_KEYS.has(key)) return res.status(400).json({ error: 'unknown key' });
  db.prepare(
    `INSERT INTO kv_store (key, value, updatedAt) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`
  ).run(key, JSON.stringify(req.body));
  res.json({ ok: true, key });
});

router.delete('/:key', (req, res) => {
  if (!ALLOWED_KEYS.has(req.params.key)) return res.status(400).json({ error: 'unknown key' });
  db.prepare('DELETE FROM kv_store WHERE key = ?').run(req.params.key);
  res.status(204).end();
});

router.post('/clear', (_req, res) => {
  db.prepare('DELETE FROM kv_store').run();
  res.json({ ok: true });
});

module.exports = router;
