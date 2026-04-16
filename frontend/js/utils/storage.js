/* ==========================================
   PERSISTENCE — in-memory cache synced to backend
   ==========================================
   Reads are synchronous (served from cache); writes
   update the cache immediately and fire a debounced
   PUT to the API. On the very first call, Storage.bootstrap()
   must be awaited so the cache is populated before pages render.

   The keys and method signatures are unchanged from the
   original localStorage-backed version, so Store.js needs
   no modifications.
*/

const StorageKeys = {
  ROOT: 'mvs-trips',
  TRIPS: 'mvs-trips:trips',
  PUPILS: 'mvs-trips:pupils',
  PAYMENTS: 'mvs-trips:payments',
  DOCUMENTS: 'mvs-trips:documents',
  BOOKINGS: 'mvs-trips:bookings',
  ACTIVITIES: 'mvs-trips:activities',
  COMMUNICATIONS: 'mvs-trips:communications',
  DOCUMENT_TYPES: 'mvs-trips:document-types',
  INTERESTS: 'mvs-trips:interests',
  USERS: 'mvs-trips:users',
  SESSIONS: 'mvs-trips:sessions',
  SETTINGS: 'mvs-trips:settings',
  SEEDED: 'mvs-trips:seeded',
};

const Storage = (function () {
  const cache = new Map();
  const pending = new Map(); // key -> { timer, value }
  const DEBOUNCE_MS = 50;
  let booted = false;

  function scheduleWrite(key, value) {
    const existing = pending.get(key);
    if (existing) clearTimeout(existing.timer);
    const entry = { value, timer: null };
    entry.timer = setTimeout(async () => {
      pending.delete(key);
      try {
        await Api.put(key, entry.value);
      } catch (firstErr) {
        console.warn('[Storage] PUT failed (will retry once)', key, firstErr);
        try {
          await new Promise(r => setTimeout(r, 300));
          await Api.put(key, entry.value);
        } catch (err) {
          console.error('[Storage] PUT failed permanently for', key, err);
          if (typeof Toast !== 'undefined') Toast.error('Could not save to server: ' + key.replace('mvs-trips:', ''));
        }
      }
    }, DEBOUNCE_MS);
    pending.set(key, entry);
  }

  // Flush every queued write synchronously with fetch({ keepalive: true }),
  // which allows the request to outlive the current page. Called on pagehide
  // so edits made just before a refresh or close still land in the backend.
  function flushPending() {
    const base = ((window.MVS_API_BASE || 'http://localhost:3001') + '/api/store/');
    for (const [key, entry] of pending) {
      clearTimeout(entry.timer);
      try {
        fetch(base + encodeURIComponent(key), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry.value),
          keepalive: true
        });
      } catch (err) {
        console.warn('[Storage] keepalive PUT failed for', key, err);
      }
    }
    pending.clear();
  }
  window.addEventListener('pagehide', flushPending);
  // visibilitychange fires earlier on mobile / tab switch — catches more cases.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPending();
  });

  async function bootstrap() {
    const remote = await Api.bootstrap();
    cache.clear();
    for (const [k, v] of Object.entries(remote || {})) cache.set(k, v);
    booted = true;
  }

  function get(key, fallback = null) {
    if (!booted) console.warn('[Storage.get] called before bootstrap:', key);
    return cache.has(key) ? cache.get(key) : fallback;
  }

  function set(key, value) {
    cache.set(key, value);
    scheduleWrite(key, value);
    return true;
  }

  function remove(key) {
    cache.delete(key);
    if (pending.has(key)) { clearTimeout(pending.get(key)); pending.delete(key); }
    Api.remove(key).catch(err => console.warn('[Storage.remove]', key, err));
  }

  function clear() {
    cache.clear();
    pending.forEach(id => clearTimeout(id));
    pending.clear();
    return Api.clear();
  }

  function importData(data) {
    Object.entries(data).forEach(([k, v]) => set(k, v));
    return true;
  }

  function exportData() {
    const out = {};
    for (const [k, v] of cache.entries()) out[k] = v;
    return out;
  }

  return {
    bootstrap,
    get, set, remove, clear,
    flush: flushPending,
    import: importData,
    export: exportData,
    isBooted: () => booted
  };
})();
