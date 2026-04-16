/* ==========================================
   PERSISTENCE — localStorage wrapper
   ==========================================
   Provides a safe, namespaced API over localStorage.
   All state lives under the `mvs-trips` root key,
   with sub-keys for each collection.
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

const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      console.warn('[Storage.get]', key, err);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('[Storage.set]', key, err);
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    Object.values(StorageKeys).forEach(k => localStorage.removeItem(k));
  },

  /** Replace this app's entire dataset with `data`. */
  import(data) {
    try {
      Object.entries(data).forEach(([k, v]) => Storage.set(k, v));
      return true;
    } catch (err) {
      console.error('[Storage.import]', err);
      return false;
    }
  },

  /** Export full dataset for backup. */
  export() {
    const out = {};
    Object.values(StorageKeys).forEach(k => {
      const v = Storage.get(k);
      if (v !== null) out[k] = v;
    });
    return out;
  }
};
