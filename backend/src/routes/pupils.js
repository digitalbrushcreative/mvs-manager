const express = require('express');
const db = require('../db');

const router = express.Router();
const uid = () => 'pup_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const rowToPupil = (row) => ({ ...JSON.parse(row.data), id: row.id });

router.get('/', (req, res) => {
  const { tripId } = req.query;
  const rows = tripId
    ? db.prepare('SELECT * FROM pupils WHERE tripId = ? ORDER BY lastName, firstName').all(tripId)
    : db.prepare('SELECT * FROM pupils ORDER BY lastName, firstName').all();
  res.json(rows.map(rowToPupil));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM pupils WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(rowToPupil(row));
});

router.post('/', (req, res) => {
  const pupil = { ...req.body, id: req.body.id || uid(), enrolledAt: req.body.enrolledAt || new Date().toISOString() };
  if (!pupil.tripId) return res.status(400).json({ error: 'tripId required' });
  db.prepare(
    `INSERT INTO pupils (id, tripId, firstName, lastName, grade, paymentStatus, status, data)
     VALUES (@id, @tripId, @firstName, @lastName, @grade, @paymentStatus, @status, @data)`
  ).run({
    id: pupil.id,
    tripId: pupil.tripId,
    firstName: pupil.firstName ?? '',
    lastName: pupil.lastName ?? '',
    grade: pupil.grade ?? null,
    paymentStatus: pupil.paymentStatus ?? 'pending',
    status: pupil.status ?? 'active',
    data: JSON.stringify(pupil)
  });
  res.status(201).json(pupil);
});

router.patch('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM pupils WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  const merged = { ...rowToPupil(row), ...req.body, id: req.params.id };
  db.prepare(
    `UPDATE pupils SET tripId=@tripId, firstName=@firstName, lastName=@lastName,
     grade=@grade, paymentStatus=@paymentStatus, status=@status, data=@data WHERE id=@id`
  ).run({
    id: merged.id,
    tripId: merged.tripId,
    firstName: merged.firstName ?? '',
    lastName: merged.lastName ?? '',
    grade: merged.grade ?? null,
    paymentStatus: merged.paymentStatus ?? 'pending',
    status: merged.status ?? 'active',
    data: JSON.stringify(merged)
  });
  res.json(merged);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM pupils WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

module.exports = router;
