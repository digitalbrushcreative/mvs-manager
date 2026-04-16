const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

const USERS_KEY = 'mvs-trips:users';
const SESSIONS_KEY = 'mvs-trips:sessions';

function readKey(key, fallback = null) {
  const row = db.prepare('SELECT value FROM kv_store WHERE key = ?').get(key);
  if (!row) return fallback;
  try { return JSON.parse(row.value); } catch { return fallback; }
}
function writeKey(key, value) {
  db.prepare(
    `INSERT INTO kv_store (key, value, updatedAt) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`
  ).run(key, JSON.stringify(value));
}

function sanitizeUser(u) {
  if (!u) return null;
  const { password, passwordHash, ...safe } = u;
  return safe;
}

// First-run bootstrap: if no users exist yet, insert the two demo accounts
// so the login form works out of the box. Idempotent.
const DEFAULT_USERS = [
  {
    id: 'user_admin',
    email: 'admin@mvs.test',
    password: 'admin123',
    role: 'admin',
    name: 'Trips Coordinator',
    linkedPupilIds: [],
    linkedInterestTokens: []
  },
  {
    id: 'user_parent',
    email: 'parent@example.com',
    password: 'parent123',
    role: 'parent',
    name: 'Parent',
    linkedPupilIds: [],
    linkedInterestTokens: []
  }
];
function ensureDefaultUsers() {
  const existing = readKey(USERS_KEY, []);
  if (existing.length) return existing;
  writeKey(USERS_KEY, DEFAULT_USERS);
  return DEFAULT_USERS;
}

function newToken() {
  return crypto.randomBytes(24).toString('hex');
}

// Dev-grade auth: passwords stored as plain strings on the user record
// so the seed is legible. This is NOT production-safe.
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const users = ensureDefaultUsers();
  const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = newToken();
  const sessions = readKey(SESSIONS_KEY, {});
  sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
  writeKey(SESSIONS_KEY, sessions);
  res.json({ token, user: sanitizeUser(user) });
});

router.get('/me', (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'not logged in' });
  const sessions = readKey(SESSIONS_KEY, {});
  const session = sessions[token];
  if (!session) return res.status(401).json({ error: 'invalid session' });
  const user = readKey(USERS_KEY, []).find(u => u.id === session.userId);
  if (!user) return res.status(401).json({ error: 'user not found' });
  res.json({ user: sanitizeUser(user) });
});

router.post('/logout', (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token) {
    const sessions = readKey(SESSIONS_KEY, {});
    delete sessions[token];
    writeKey(SESSIONS_KEY, sessions);
  }
  res.json({ ok: true });
});

module.exports = router;
