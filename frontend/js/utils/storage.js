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
  SETTINGS: 'mvs-trips:settings',
  SEEDED: 'mvs-trips:seeded',
};

const Storage = (function () {
  const cache = new Map();
  const pending = new Map(); // key -> timeout id (debounce)
  const DEBOUNCE_MS = 150;
  let booted = false;

  function scheduleWrite(key, value) {
    if (pending.has(key)) clearTimeout(pending.get(key));
    pending.set(key, setTimeout(() => {
      pending.delete(key);
      Api.put(key, value).catch(err => {
        console.warn('[Storage] PUT failed for', key, err);
        if (typeof Toast !== 'undefined') Toast.error('Could not save to server');
      });
    }, DEBOUNCE_MS));
  }

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
    import: importData,
    export: exportData,
    isBooted: () => booted
  };
})();
