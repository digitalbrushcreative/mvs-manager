/* ==========================================
   API — thin fetch wrapper for the backend
   ==========================================
   The backend exposes a key-value store over HTTP. This
   module handles transport; Storage owns the cache and
   write queue. See backend/src/routes/store.js.
*/

const Api = (function () {
  const BASE = (window.MVS_API_BASE || 'http://localhost:3001') + '/api';

  async function request(path, opts = {}) {
    const res = await fetch(BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...opts
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${res.status} ${res.statusText} — ${text}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  return {
    bootstrap: () => request('/store/bootstrap'),
    put:       (key, value) => request('/store/' + encodeURIComponent(key), { method: 'PUT', body: JSON.stringify(value) }),
    remove:    (key) => request('/store/' + encodeURIComponent(key), { method: 'DELETE' }),
    clear:     () => request('/store/clear', { method: 'POST' }),
    health:    () => request('/health')
  };
})();
