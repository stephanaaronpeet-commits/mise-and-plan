/* =============================================================
   filters.js — filter + search bar for the cookbook list view
   State lives in URL hash query params, so it's bookmarkable
   and survives the back button.
   ============================================================= */

const css = `
.filter-bar {
  padding: 14px 16px 16px;
  border-bottom: 1px solid var(--iron-300);
  background: var(--iron-100);
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
}
@media (min-width: 768px) {
  .filter-bar { padding: 16px 32px 18px; }
}
.filter-row {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 12px;
  align-items: center;
  min-height: 26px;
}
@media (max-width: 480px) {
  .filter-row { grid-template-columns: 64px 1fr; gap: 8px; }
}
.filter-label {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--iron-500);
}
.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.filter-pill {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 4px 9px;
  background: transparent;
  border: 1px solid var(--iron-400);
  color: var(--paper-200);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.08s, background 0.08s, color 0.08s;
}
.filter-pill:hover {
  border-color: var(--paper-200);
  color: var(--paper-000);
}
.filter-pill.on {
  background: var(--paper-000);
  border-color: var(--paper-000);
  color: var(--iron-000);
}
.filter-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--iron-400);
  padding: 3px 0;
  transition: border-color 0.08s;
}
.filter-search-wrap:focus-within {
  border-bottom-color: var(--paper-000);
}
.filter-search-icon {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--iron-500);
}
.filter-search {
  flex: 1;
  background: transparent;
  border: 0;
  padding: 4px 0;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--paper-000);
  outline: 0;
  width: 100%;
}
.filter-search::placeholder {
  color: var(--iron-500);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.08em;
}
.filter-clear {
  position: absolute;
  top: 14px;
  right: 16px;
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  padding: 4px 8px;
  background: transparent;
  border: 1px dashed var(--iron-500);
  color: var(--iron-500);
  cursor: pointer;
}
.filter-clear:hover {
  border-color: var(--paper-200);
  color: var(--paper-000);
}
@media (min-width: 768px) {
  .filter-clear { top: 16px; right: 32px; }
}
`;

const TIME_OPTIONS = [{ label: '≤15', v: 15 }, { label: '≤30', v: 30 }, { label: '≤60', v: 60 }];
const PROT_OPTIONS = [{ label: '≥50', v: 50 }, { label: '≥55', v: 55 }, { label: '≥60', v: 60 }];

/* ---------- State helpers ---------- */

export function fromParams(params = {}) {
  return {
    q:       (params.q       || '').trim(),
    cuisine: splitCsv(params.cuisine),
    meal:    splitCsv(params.meal),
    maxtime: params.maxtime ? Number(params.maxtime) : null,
    minprot: params.minprot ? Number(params.minprot) : null,
  };
}

export function toQueryString(state) {
  const out = new URLSearchParams();
  if (state.q) out.set('q', state.q);
  if (state.cuisine.length) out.set('cuisine', state.cuisine.join(','));
  if (state.meal.length)    out.set('meal',    state.meal.join(','));
  if (state.maxtime != null) out.set('maxtime', String(state.maxtime));
  if (state.minprot != null) out.set('minprot', String(state.minprot));
  const s = out.toString();
  return s ? '?' + s : '';
}

export function isEmpty(state) {
  return !state.q
    && !state.cuisine.length
    && !state.meal.length
    && state.maxtime == null
    && state.minprot == null;
}

export function applyFilters(recipes, state) {
  const terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
  return recipes.filter(r => {
    if (state.cuisine.length && !state.cuisine.includes(r.cuisine)) return false;
    if (state.meal.length && !(r.meal_type || []).some(m => state.meal.includes(m))) return false;
    if (state.maxtime != null && (r.time?.total_min ?? Infinity) > state.maxtime) return false;
    if (state.minprot != null && (r.macros_per_serving?.protein_g ?? 0) < state.minprot) return false;
    if (terms.length) {
      const hay = (
        r.title + ' ' +
        (r.ingredients || []).map(i => i.item).join(' ') + ' ' +
        (r.tags || []).join(' ')
      ).toLowerCase();
      if (!terms.every(t => hay.includes(t))) return false;
    }
    return true;
  });
}

/* ---------- Bar mount ---------- */

export function mountFilterBar(container, initialState, allRecipes, onChange) {
  ensureStyles();
  const state = clone(initialState);

  const cuisines = uniq(allRecipes.map(r => r.cuisine).filter(Boolean)).sort();
  const meals    = uniq(allRecipes.flatMap(r => r.meal_type || []));

  // Stable meal_type order matching schema enum
  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack', 'post-workout'];
  meals.sort((a, b) => mealOrder.indexOf(a) - mealOrder.indexOf(b));

  container.innerHTML = `
    <div class="filter-bar">
      ${row('Search', `
        <div class="filter-search-wrap">
          <span class="filter-search-icon">⌕</span>
          <input class="filter-search" type="search" placeholder="title, ingredient, tag…" value="${esc(state.q)}" />
        </div>
      `)}
      ${cuisines.length ? row('Cuisine', pills(cuisines.map(c => ({
        label: c.toUpperCase(), action: 'cuisine', value: c, on: state.cuisine.includes(c),
      })))) : ''}
      ${meals.length ? row('Meal', pills(meals.map(m => ({
        label: m.toUpperCase(), action: 'meal', value: m, on: state.meal.includes(m),
      })))) : ''}
      ${row('Max Time', pills([
        ...TIME_OPTIONS.map(o => ({ label: `${o.label} MIN`, action: 'maxtime', value: String(o.v), on: state.maxtime === o.v })),
        { label: 'ANY', action: 'maxtime', value: '', on: state.maxtime == null },
      ]))}
      ${row('Min Protein', pills([
        ...PROT_OPTIONS.map(o => ({ label: `${o.label} G`, action: 'minprot', value: String(o.v), on: state.minprot === o.v })),
        { label: 'ANY', action: 'minprot', value: '', on: state.minprot == null },
      ]))}
    </div>
  `;

  const bar = container.querySelector('.filter-bar');
  const searchInput = bar.querySelector('.filter-search');

  function refreshClearBtn() {
    let btn = bar.querySelector('.filter-clear');
    if (isEmpty(state)) { btn?.remove(); return; }
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-clear';
      btn.dataset.action = 'clear';
      btn.textContent = '× CLEAR';
      bar.appendChild(btn);
    }
  }
  refreshClearBtn();

  function emit() { onChange(clone(state)); }

  // Pills + clear
  bar.addEventListener('click', e => {
    const btn = e.target.closest('button.filter-pill, button.filter-clear');
    if (!btn) return;
    const { action, value } = btn.dataset;

    if (action === 'clear') {
      state.q = ''; state.cuisine = []; state.meal = [];
      state.maxtime = null; state.minprot = null;
      searchInput.value = '';
      bar.querySelectorAll('.filter-pill.on').forEach(p => p.classList.remove('on'));
      // Re-activate 'ANY' pills
      bar.querySelectorAll('.filter-pill[data-action="maxtime"][data-value=""]').forEach(p => p.classList.add('on'));
      bar.querySelectorAll('.filter-pill[data-action="minprot"][data-value=""]').forEach(p => p.classList.add('on'));
      refreshClearBtn();
      emit();
      return;
    }

    if (action === 'cuisine' || action === 'meal') {
      const arr = state[action];
      const i = arr.indexOf(value);
      if (i >= 0) arr.splice(i, 1); else arr.push(value);
      btn.classList.toggle('on');
    } else if (action === 'maxtime' || action === 'minprot') {
      const sib = btn.closest('.filter-pills').querySelectorAll('.filter-pill');
      sib.forEach(p => p.classList.remove('on'));
      btn.classList.add('on');
      state[action] = value === '' ? null : Number(value);
    }
    refreshClearBtn();
    emit();
  });

  // Search — debounced 150ms
  let debounce;
  searchInput.addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.q = e.target.value;
      refreshClearBtn();
      emit();
    }, 150);
  });
}

/* ---------- Helpers ---------- */

function row(label, content) {
  return `<div class="filter-row"><div class="filter-label">${label}</div><div class="filter-pills-wrap">${content}</div></div>`;
}

function pills(items) {
  return `<div class="filter-pills">${items.map(p => (
    `<button type="button" class="filter-pill${p.on ? ' on' : ''}" data-action="${p.action}" data-value="${esc(p.value)}">${esc(p.label)}</button>`
  )).join('')}</div>`;
}

function splitCsv(v) {
  return (v || '').split(',').map(s => s.trim()).filter(Boolean);
}

function uniq(arr) { return [...new Set(arr)]; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ensureStyles() {
  if (document.getElementById('filters-css')) return;
  const tag = document.createElement('style');
  tag.id = 'filters-css';
  tag.textContent = css;
  document.head.appendChild(tag);
}
