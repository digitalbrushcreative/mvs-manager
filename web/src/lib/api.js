/**
 * Thin client over the kv-store + auth backend at /api.
 *
 * Dev: relative `/api` (Vite proxies → http://localhost:3001).
 * Prod: set VITE_API_URL at build time to the API origin
 *       (e.g. https://mvs-api.up.railway.app).
 */

const RAW = (import.meta.env?.VITE_API_URL || '').replace(/\/+$/, '');
const BASE = RAW ? `${RAW}/api` : '/api';

function authHeaders() {
  try {
    const session = JSON.parse(localStorage.getItem('mvs-session') || 'null');
    return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
  } catch {
    return {};
  }
}

async function jsonFetch(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    let detail;
    try {
      detail = await res.json();
    } catch {
      detail = { error: res.statusText };
    }
    const err = new Error(detail.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.detail = detail;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const Api = {
  // ----- KV store -----
  bootstrap: () => jsonFetch(`${BASE}/store/bootstrap`),
  get: (key) => jsonFetch(`${BASE}/store/${encodeURIComponent(key)}`),
  put: (key, value) =>
    jsonFetch(`${BASE}/store/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify(value),
    }),
  remove: (key) =>
    jsonFetch(`${BASE}/store/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    }),

  // ----- Auth -----
  login: (email, password) =>
    jsonFetch(`${BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => jsonFetch(`${BASE}/auth/logout`, { method: 'POST' }),
  me: () => jsonFetch(`${BASE}/auth/me`),
};
