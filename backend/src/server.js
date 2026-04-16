const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'mvs-manager-api' }));

app.use('/api/store', require('./routes/store'));
app.use('/api/public', require('./routes/public'));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'server error' });
});

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
