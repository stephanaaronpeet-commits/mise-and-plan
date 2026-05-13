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

/* =============================================================
   Recipe state — per-user mutations layered on top of seed JSON.
   The recipe files in /data/recipes are pristine seed data; the
   user's favorites and cook history live here under a separate key.
   Phase 2.1 planner will mutate cook_count/last_cooked via markCooked().
   ============================================================= */

function recipeStateKey(id) { return `recipe-state:${id}`; }

export function getRecipeState(id) {
  return storage.get(recipeStateKey(id), null);
}

export function setRecipeState(id, partial) {
  const cur = storage.get(recipeStateKey(id), {}) || {};
  const next = { ...cur, ...partial };
  storage.set(recipeStateKey(id), next);
  return next;
}

export function toggleFavorite(id, currentValue = false) {
  return setRecipeState(id, { favorite: !currentValue });
}

export function markCooked(id) {
  const cur = storage.get(recipeStateKey(id), {}) || {};
  const today = new Date().toISOString().slice(0, 10);
  return setRecipeState(id, {
    cook_count: (cur.cook_count || 0) + 1,
    last_cooked: today,
  });
}

/* Merge user state (favorite, cook_count, last_cooked) onto a recipe
   object loaded from the seed JSON. User state always wins. */
export function applyRecipeState(recipe) {
  if (!recipe || !recipe.id) return recipe;
  const state = getRecipeState(recipe.id);
  if (!state) return recipe;
  return { ...recipe, ...state };
}
