/* =============================================================
   filters.js — pure logic for the cookbook list.
   No DOM, no styles. State lives in URL hash query params,
   so views are bookmarkable and back-button-friendly.
   ============================================================= */

/* ---------- Browse rail (single-select, the "big filter") ---------- */
export const BROWSE_CONFIGS = {
  all:       { label: 'All',         filter: () => true },
  thai:      { label: 'Thai',        filter: r => r.cuisine === 'thai' },
  korean:    { label: 'Korean',      filter: r => r.cuisine === 'korean' },
  quick:     { label: 'Quick <20',   filter: r => (r.time?.total_min ?? Infinity) < 20 },
  highprot:  { label: 'High-prot',   filter: r => (r.macros_per_serving?.protein_g ?? 0) >= 50 },
  breakfast: { label: "B'fast",      filter: r => (r.meal_type || []).includes('breakfast') },
  batch:     { label: 'Batch',       filter: r => (r.tags || []).includes('batch') || (r.tags || []).includes('meal-prep') },
  fav:       { label: 'Fav',         filter: r => r.favorite === true },
};
export const BROWSE_ORDER = ['all', 'thai', 'korean', 'quick', 'highprot', 'breakfast', 'batch', 'fav'];

/* ---------- Chip filters (multi-select, additive AND) ---------- */
export const CHIP_CONFIGS = {
  'high-protein': { label: 'High-protein', filter: r => (r.macros_per_serving?.protein_g ?? 0) >= 50 },
  'quick':        { label: 'Quick',        filter: r => (r.time?.total_min ?? Infinity) <= 20 },
  'gluten-free':  { label: 'Gluten-free',  filter: r => (r.diet_flags || []).includes('gluten-free') },
  'dairy-free':   { label: 'Dairy-free',   filter: r => (r.diet_flags || []).includes('dairy-free') },
  'low-carb':     { label: 'Low-carb',     filter: r => (r.diet_flags || []).includes('low-carb') },
  'vegetarian':   { label: 'Vegetarian',   filter: r => (r.diet_flags || []).includes('vegetarian') || (r.diet_flags || []).includes('vegan') },
};
export const CHIP_ORDER = ['high-protein', 'quick', 'gluten-free', 'dairy-free', 'low-carb', 'vegetarian'];

/* ---------- Sort ---------- */
export const SORT_OPTIONS = [
  { id: 'cooked',  label: 'Most cooked',     cmp: (a, b) => (b.cook_count || 0) - (a.cook_count || 0) || (a.title || '').localeCompare(b.title || '') },
  { id: 'recent',  label: 'Recently added',  cmp: (a, b) => (b.created || '').localeCompare(a.created || '') },
  { id: 'protein', label: 'Highest protein', cmp: (a, b) => (b.macros_per_serving?.protein_g || 0) - (a.macros_per_serving?.protein_g || 0) },
  { id: 'quick',   label: 'Quickest',        cmp: (a, b) => (a.time?.total_min ?? Infinity) - (b.time?.total_min ?? Infinity) },
  { id: 'az',      label: 'A–Z',             cmp: (a, b) => (a.title || '').localeCompare(b.title || '') },
];
export const DEFAULT_SORT = 'cooked';

/* ---------- State helpers ---------- */

export function defaultState() {
  return { browse: 'all', q: '', chips: [], sort: DEFAULT_SORT };
}

export function fromParams(params = {}) {
  const browse = params.browse && BROWSE_CONFIGS[params.browse] ? params.browse : 'all';
  const sort   = params.sort && SORT_OPTIONS.some(o => o.id === params.sort) ? params.sort : DEFAULT_SORT;
  const chips  = (params.chips || '').split(',').map(s => s.trim()).filter(c => CHIP_CONFIGS[c]);
  return { browse, q: (params.q || '').trim(), chips, sort };
}

export function toQueryString(state) {
  const p = new URLSearchParams();
  if (state.browse && state.browse !== 'all') p.set('browse', state.browse);
  if (state.q) p.set('q', state.q);
  if (state.chips && state.chips.length) p.set('chips', state.chips.join(','));
  if (state.sort && state.sort !== DEFAULT_SORT) p.set('sort', state.sort);
  const s = p.toString();
  return s ? '?' + s : '';
}

export function isEmpty(state) {
  return state.browse === 'all'
    && !state.q
    && !(state.chips && state.chips.length)
    && state.sort === DEFAULT_SORT;
}

/* ---------- Filtering ---------- */

function matchesQuery(r, q) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const hay = (
    (r.title || '') + ' ' +
    (r.ingredients || []).map(i => i.item).join(' ') + ' ' +
    (r.tags || []).join(' ') + ' ' +
    (r.cuisine || '')
  ).toLowerCase();
  return terms.every(t => hay.includes(t));
}

export function applyFilters(recipes, state) {
  const browse = BROWSE_CONFIGS[state.browse]?.filter || (() => true);
  const chipFns = (state.chips || []).map(id => CHIP_CONFIGS[id]?.filter).filter(Boolean);
  return recipes.filter(r =>
    browse(r) && chipFns.every(fn => fn(r)) && matchesQuery(r, state.q)
  );
}

export function applySort(recipes, sortId) {
  const opt = SORT_OPTIONS.find(o => o.id === sortId) || SORT_OPTIONS[0];
  return [...recipes].sort(opt.cmp);
}

/* ---------- Live counts for UI ---------- */

export function browseCount(recipes, browseId) {
  const cfg = BROWSE_CONFIGS[browseId];
  return cfg ? recipes.filter(cfg.filter).length : 0;
}

/* Chip count = how many recipes match browse+search+THIS chip
   (ignoring other active chips, so the count is discoverable rather than 0). */
export function chipCount(recipes, state, chipId) {
  const cfg = CHIP_CONFIGS[chipId];
  if (!cfg) return 0;
  const browse = BROWSE_CONFIGS[state.browse]?.filter || (() => true);
  return recipes.filter(r => browse(r) && matchesQuery(r, state.q) && cfg.filter(r)).length;
}
