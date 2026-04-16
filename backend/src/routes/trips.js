const express = require('express');
const db = require('../db');

const router = express.Router();
const uid = () => 'trip_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const rowToTrip = (row) => ({ ...JSON.parse(row.data), id: row.id });

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM trips ORDER BY createdAt DESC').all();
  res.json(rows.map(rowToTrip));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(rowToTrip(row));
});

router.post('/', (req, res) => {
  const trip = { ...req.body, id: req.body.id || uid(), createdAt: new Date().toISOString() };
  db.prepare(
    `INSERT INTO trips (id, code, name, status, startDate, endDate, data)
     VALUES (@id, @code, @name, @status, @startDate, @endDate, @data)`
  ).run({
    id: trip.id,
    code: trip.code ?? null,
    name: trip.name ?? null,
    status: trip.status ?? 'draft',
    startDate: trip.startDate ?? null,
    endDate: trip.endDate ?? null,
    data: JSON.stringify(trip)
  });
  res.status(201).json(trip);
});

router.patch('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  const merged = { ...rowToTrip(row), ...req.body, id: req.params.id };
  db.prepare(
    `UPDATE trips SET code=@code, name=@name, status=@status,
     startDate=@startDate, endDate=@endDate, data=@data WHERE id=@id`
  ).run({
    id: merged.id,
    code: merged.code ?? null,
    name: merged.name ?? null,
    status: merged.status ?? 'draft',
    startDate: merged.startDate ?? null,
    endDate: merged.endDate ?? null,
    data: JSON.stringify(merged)
  });
  res.json(merged);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM trips WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

module.exports = router;
