/**
 * Production host for the built SPA.
 *
 * - Serves `dist/` with SPA fallback so client-side routes resolve.
 * - Proxies `/api/*` upstream to `process.env.API_URL` so the browser only
 *   ever talks to its own origin (no CORS, no build-time URL baking).
 *
 * Local prod sanity check:
 *   npm run build && API_URL=http://localhost:3001 PORT=4321 npm start
 */

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const API_URL = (process.env.API_URL || '').replace(/\/+$/, '');

if (!API_URL) {
  console.warn('[web] API_URL is not set — /api requests will 502.');
}

const app = express();

if (API_URL) {
  app.use(
    createProxyMiddleware({
      pathFilter: (path) => path.startsWith('/api'),
      target: API_URL,
      changeOrigin: true,
      xfwd: true,
      logLevel: 'warn',
    }),
  );
}

const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir, { index: false, maxAge: '1h' }));

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[web] listening on :${PORT} → /api → ${API_URL || '(unset)'}`);
});
