const express = require('express');
const db = require('../db');

const router = express.Router();

const TRIPS_KEY = 'mvs-trips:trips';
const INTERESTS_KEY = 'mvs-trips:interests';

function readKey(key) {
  const row = db.prepare('SELECT value FROM kv_store WHERE key = ?').get(key);
  if (!row) return null;
  try { return JSON.parse(row.value); } catch { return null; }
}

function writeKey(key, value) {
  db.prepare(
    `INSERT INTO kv_store (key, value, updatedAt) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`
  ).run(key, JSON.stringify(value));
}

// Sanitise a trip for public display — hide internal fields.
function publicTrip(t) {
  return {
    id: t.id,
    code: t.code,
    name: t.name,
    destination: t.destination,
    description: t.description,
    startDate: t.startDate,
    endDate: t.endDate,
    costPerPupil: t.costPerPupil,
    currency: t.currency,
    gradesAllowed: t.gradesAllowed,
    tripType: t.tripType || 'international',
    status: t.status,
    seatsTotal: t.seatsTotal,
    chaperones: t.chaperones,
    parentsJoining: t.parentsJoining || 0,
    clubIds: t.clubIds || []
  };
}

function publicClubs() {
  const clubs = readKey('mvs-trips:clubs') || [];
  return clubs.map(c => ({ id: c.id, name: c.name, emoji: c.emoji, colour: c.colour }));
}

router.get('/trips', (_req, res) => {
  const trips = readKey(TRIPS_KEY) || [];
  const hidden = new Set(['cancelled', 'complete']);
  res.json(trips.filter(t => !hidden.has(t.status)).map(publicTrip));
});

router.get('/clubs', (_req, res) => {
  res.json(publicClubs());
});

router.post('/interests', (req, res) => {
  const {
    tripId, parentName, parentPhone, parentEmail,
    pupilName, pupilGrade, note
  } = req.body || {};

  if (!tripId || !parentName || !pupilName) {
    return res.status(400).json({ error: 'tripId, parentName and pupilName are required' });
  }

  const trips = readKey(TRIPS_KEY) || [];
  if (!trips.find(t => t.id === tripId)) {
    return res.status(400).json({ error: 'unknown tripId' });
  }

  const makeToken = () =>
    (Date.now().toString(36) + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10))
      .toLowerCase();

  const interest = {
    id: 'int_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    token: makeToken(),
    tripId,
    parentName: String(parentName).trim(),
    parentPhone: parentPhone ? String(parentPhone).trim() : '',
    parentEmail: parentEmail ? String(parentEmail).trim() : '',
    pupilName: String(pupilName).trim(),
    pupilGrade: pupilGrade ? Number(pupilGrade) : null,
    note: note ? String(note).trim() : '',
    // Fields parents fill in later via the return link
    dob: null,
    medicalNotes: '',
    dietaryNotes: '',
    additionalNotes: '',
    documentsRequested: [],    // set by admin when they want specific docs
    documentsSubmitted: [],    // filenames parent claims to have uploaded (stub)
    status: 'new',             // new → contacted → awaiting-details → submitted → converted | declined
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const existing = readKey(INTERESTS_KEY) || [];
  existing.push(interest);
  writeKey(INTERESTS_KEY, existing);

  res.status(201).json({ ok: true, id: interest.id, token: interest.token });
});

// Parent return visit — fetch by token (sanitised, no admin-only fields)
router.get('/interests/token/:token', (req, res) => {
  const all = readKey(INTERESTS_KEY) || [];
  const row = all.find(i => i.token === req.params.token);
  if (!row) return res.status(404).json({ error: 'not found' });
  const trips = readKey(TRIPS_KEY) || [];
  const trip = trips.find(t => t.id === row.tripId);
  res.json({
    id: row.id,
    token: row.token,
    status: row.status,
    trip: trip ? publicTrip(trip) : null,
    parentName: row.parentName,
    parentPhone: row.parentPhone,
    parentEmail: row.parentEmail,
    pupilName: row.pupilName,
    pupilGrade: row.pupilGrade,
    note: row.note,
    dob: row.dob,
    medicalNotes: row.medicalNotes,
    dietaryNotes: row.dietaryNotes,
    additionalNotes: row.additionalNotes,
    documentsRequested: row.documentsRequested || [],
    documentsSubmitted: row.documentsSubmitted || [],
    submittedAt: row.submittedAt,
    updatedAt: row.updatedAt
  });
});

// Parent update — they can edit only their own submission, only safe fields
router.patch('/interests/token/:token', (req, res) => {
  const all = readKey(INTERESTS_KEY) || [];
  const idx = all.findIndex(i => i.token === req.params.token);
  if (idx === -1) return res.status(404).json({ error: 'not found' });

  const EDITABLE = [
    'parentPhone', 'parentEmail', 'pupilGrade',
    'dob', 'medicalNotes', 'dietaryNotes', 'additionalNotes',
    'documentsSubmitted'
  ];
  const patch = {};
  for (const k of EDITABLE) if (k in req.body) patch[k] = req.body[k];

  all[idx] = {
    ...all[idx],
    ...patch,
    status: all[idx].status === 'awaiting-details' ? 'submitted' : all[idx].status,
    updatedAt: new Date().toISOString()
  };
  writeKey(INTERESTS_KEY, all);
  res.json({ ok: true });
});

module.exports = router;
