const express = require('express');
const db = require('../db');

const router = express.Router();
const uid = () => 'pay_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const rowToPayment = (row) => ({ ...JSON.parse(row.data), id: row.id });

router.get('/', (req, res) => {
  const { tripId, pupilId } = req.query;
  let sql = 'SELECT * FROM payments';
  const params = [];
  const where = [];
  if (tripId) { where.push('tripId = ?'); params.push(tripId); }
  if (pupilId) { where.push('pupilId = ?'); params.push(pupilId); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY paidAt DESC';
  res.json(db.prepare(sql).all(...params).map(rowToPayment));
});

router.post('/', (req, res) => {
  const payment = { ...req.body, id: req.body.id || uid(), paidAt: req.body.paidAt || new Date().toISOString() };
  if (!payment.tripId || !payment.pupilId) {
    return res.status(400).json({ error: 'tripId and pupilId required' });
  }
  db.prepare(
    `INSERT INTO payments (id, tripId, pupilId, amount, method, paidAt, data)
     VALUES (@id, @tripId, @pupilId, @amount, @method, @paidAt, @data)`
  ).run({
    id: payment.id,
    tripId: payment.tripId,
    pupilId: payment.pupilId,
    amount: payment.amount ?? 0,
    method: payment.method ?? null,
    paidAt: payment.paidAt,
    data: JSON.stringify(payment)
  });
  res.status(201).json(payment);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

module.exports = router;
