/* =============================================================
   storage.js — localStorage wrapper, schema versioning, migrations
   All keys are prefixed with `mp:` so we never collide with other apps.
   ============================================================= */

const PREFIX = 'mp:';
const SCHEMA_VERSION = 1;

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
      console.warn('[storage] get failed for', key, e);
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[storage] set failed for', key, e);
      return false;
    }
  },
  remove(key) {
    try { localStorage.removeItem(PREFIX + key); } catch (e) {}
  },
  keys() {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .map(k => k.slice(PREFIX.length));
  },
};

/* Schema version check + migration scaffold.
   When the recipe schema shape changes, bump SCHEMA_VERSION above and
   add a case to runMigrations(). */
export function ensureSchemaCurrent() {
  const stored = storage.get('schema_version', 0);
  if (stored === SCHEMA_VERSION) return;
  runMigrations(stored, SCHEMA_VERSION);
  storage.set('schema_version', SCHEMA_VERSION);
}

function runMigrations(from, to) {
  console.info(`[storage] migrating schema ${from} → ${to}`);
  // No migrations yet. Each future bump adds a case:
  // if (from < 2) { /* mutate stored recipes... */ }
}
