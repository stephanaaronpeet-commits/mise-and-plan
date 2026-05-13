/* =============================================================
   planner.js — weekly meal planner (Phase 2.1).
   View: 7 days, starting Monday of the chosen week.
   Each day shows assigned recipes, daily macro totals, and an
   "+ Add recipe" affordance.
   Cooked toggle in planner → increments cook_count + last_cooked
   via storage.markCooked (already used by cook-mode "Mark as cooked").
   ============================================================= */

import {
  storage, ensureSchemaCurrent,
  getDayPlan, addToPlan, removeFromPlan, toggleCookedInPlan,
  applyRecipeState, getUserRecipe, getUserRecipesIndex,
} from '../core/storage.js';

ensureSchemaCurrent();

/* ============================================================
   STYLES
   ============================================================ */
const css = `
.pl-root { max-width: 1200px; margin: 0 auto; }

.pl-head {
  padding: 18px 16px 14px;
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--iron-300);
  background: var(--iron-000);
}
.pl-head .ttl {
  font-family: var(--display); font-weight: 900;
  font-size: 36px; line-height: 0.9;
  letter-spacing: -0.01em; text-transform: uppercase;
  color: var(--paper-000);
}
@media (min-width: 768px) { .pl-head { padding: 22px 28px 18px; } .pl-head .ttl { font-size: 56px; } }
.pl-head .sub {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-500); margin-top: 8px;
}
.pl-head-right { display: flex; gap: 8px; align-items: center; }
.pl-nav-btn {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  padding: 8px 12px;
  border: 1px solid var(--iron-400);
  background: transparent; color: var(--paper-100);
  cursor: pointer;
}
.pl-nav-btn:hover { border-color: var(--paper-200); color: var(--paper-000); }
.pl-nav-btn.today { border-color: var(--iron-red); color: var(--iron-red); }

/* Week container */
.pl-week {
  padding: 14px 16px;
  display: grid; gap: 12px;
  grid-template-columns: 1fr;
}
@media (min-width: 900px) { .pl-week { padding: 18px 28px; grid-template-columns: repeat(7, 1fr); gap: 10px; } }

/* Day card */
.pl-day {
  border: 1px solid var(--iron-300);
  background: var(--iron-100);
  display: flex; flex-direction: column;
}
.pl-day.today { border-top: 2px solid var(--iron-red); }
.pl-day.past { opacity: 0.65; }
.pl-day-head {
  padding: 10px 12px;
  display: flex; align-items: baseline; justify-content: space-between;
  border-bottom: 1px dashed var(--iron-300);
  background: var(--iron-000);
}
.pl-day-head .dow {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--iron-500);
}
.pl-day.today .pl-day-head .dow { color: var(--iron-red); font-weight: 700; }
.pl-day-head .dnum {
  font-family: var(--display); font-weight: 900;
  font-size: 24px; line-height: 1;
  color: var(--paper-000);
  font-variant-numeric: tabular-nums;
}

/* Macro totals strip */
.pl-macros {
  display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr;
  border-bottom: 1px dashed var(--iron-300);
}
.pl-macros > div {
  padding: 8px 8px 9px;
  border-right: 1px solid var(--iron-300);
  font-family: var(--mono); font-size: 8px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-500); line-height: 1;
}
.pl-macros > div:last-child { border-right: none; }
.pl-macros .v {
  display: block; font-family: var(--display); font-weight: 800;
  font-size: 17px; color: var(--paper-000);
  margin-top: 3px; font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em; line-height: 1;
}
.pl-macros .protein .v { color: var(--iron-red); font-size: 19px; font-weight: 900; }
.pl-macros .protein .l { color: var(--iron-red); font-weight: 700; }
.pl-macros.empty .v { color: var(--iron-500); }
.pl-macros.empty .protein .v { color: var(--iron-400); }

/* Recipe entries */
.pl-entries { flex: 1; padding: 6px 0; }
.pl-entry {
  display: grid; grid-template-columns: 18px 1fr auto auto;
  gap: 8px; padding: 8px 12px;
  align-items: center;
  border-bottom: 1px dashed var(--iron-300);
}
.pl-entry:last-child { border-bottom: none; }
.pl-entry .check {
  width: 16px; height: 16px;
  border: 1.5px solid var(--paper-000);
  position: relative; cursor: pointer; flex: 0 0 16px;
}
.pl-entry.cooked .check { background: var(--paper-000); }
.pl-entry.cooked .check::after {
  content: ""; position: absolute; inset: 2px;
  background:
    linear-gradient(45deg, transparent 0 45%, var(--iron-000) 45% 55%, transparent 55%),
    linear-gradient(-45deg, transparent 0 45%, var(--iron-000) 45% 55%, transparent 55%);
}
.pl-entry .title-link {
  font-family: var(--body); font-weight: 600;
  font-size: 13px; color: var(--paper-000);
  line-height: 1.2; text-decoration: none;
  min-width: 0; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap;
}
.pl-entry.cooked .title-link { color: var(--iron-500); text-decoration: line-through; }
.pl-entry .title-link:hover { color: var(--iron-red); }
.pl-entry .meta {
  font-family: var(--mono); font-size: 9px;
  letter-spacing: 0.1em; color: var(--iron-500);
  white-space: nowrap;
}
.pl-entry .meta .pro { color: var(--iron-red); font-weight: 700; }
.pl-entry .rm {
  width: 20px; height: 20px;
  background: transparent; border: 0;
  color: var(--iron-500); cursor: pointer;
  font-family: var(--display); font-size: 16px; line-height: 1;
}
.pl-entry .rm:hover { color: var(--paper-000); }

/* + Add button */
.pl-add {
  padding: 10px 12px;
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--iron-500); background: transparent;
  border: 0; border-top: 1px dashed var(--iron-300);
  cursor: pointer; text-align: center;
}
.pl-add:hover { color: var(--paper-000); }
.pl-empty {
  padding: 18px 12px; text-align: center;
  font-family: var(--mono); font-size: 9px;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--iron-500);
}

/* Recipe picker modal */
.pl-modal-bg {
  position: fixed; inset: 0;
  background: rgba(11,11,12,0.85);
  z-index: 100;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.pl-modal {
  background: var(--iron-100);
  border: 1px solid var(--paper-000);
  width: 100%; max-width: 520px;
  max-height: 80vh; display: flex; flex-direction: column;
}
.pl-modal-head {
  padding: 14px 18px;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid var(--iron-300);
}
.pl-modal-head .ttl {
  font-family: var(--display); font-weight: 800;
  font-size: 22px; text-transform: uppercase;
  color: var(--paper-000); line-height: 1;
}
.pl-modal-head .x {
  width: 28px; height: 28px;
  background: transparent; border: 1px solid var(--paper-000);
  color: var(--paper-000); cursor: pointer;
  font-family: var(--display); font-weight: 800; font-size: 16px;
}
.pl-modal-search {
  padding: 10px 18px;
  border-bottom: 1px solid var(--iron-300);
}
.pl-modal-search input {
  width: 100%; background: var(--iron-000);
  border: 1px solid var(--iron-300);
  padding: 8px 10px; color: var(--paper-000);
  font-family: var(--mono); font-size: 12px;
  outline: 0;
}
.pl-modal-search input:focus { border-color: var(--paper-200); }
.pl-modal-list {
  flex: 1; overflow-y: auto;
  padding: 6px 0;
}
.pl-modal-item {
  display: grid; grid-template-columns: 1fr auto;
  padding: 10px 18px; gap: 12px;
  border-bottom: 1px dashed var(--iron-300);
  cursor: pointer; background: transparent;
  text-align: left; width: 100%; border-left: 0; border-right: 0; border-top: 0;
}
.pl-modal-item:hover { background: var(--iron-200); }
.pl-modal-item .name {
  font-family: var(--display); font-weight: 700;
  font-size: 16px; text-transform: uppercase;
  color: var(--paper-000); line-height: 1;
}
.pl-modal-item .meta {
  font-family: var(--mono); font-size: 9px;
  letter-spacing: 0.14em; color: var(--iron-500);
  margin-top: 4px; text-transform: uppercase;
}
.pl-modal-item .pro {
  font-family: var(--display); font-weight: 800;
  font-size: 18px; color: var(--iron-red);
  font-variant-numeric: tabular-nums;
}

/* Date picker (used when Add-to-Plan is called from recipe detail) */
.pl-date-strip {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: 6px; padding: 12px 18px;
}
.pl-date-tile {
  border: 1px solid var(--iron-300);
  background: var(--iron-000); cursor: pointer;
  padding: 10px 4px; text-align: center;
}
.pl-date-tile:hover { border-color: var(--paper-200); }
.pl-date-tile.today { border-color: var(--iron-red); }
.pl-date-tile .dow {
  font-family: var(--mono); font-size: 9px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-500);
}
.pl-date-tile .dnum {
  font-family: var(--display); font-weight: 800;
  font-size: 22px; color: var(--paper-000); line-height: 1;
  margin-top: 4px; font-variant-numeric: tabular-nums;
}

/* Add-to-plan toast */
.pl-toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: var(--iron-000); color: var(--paper-000);
  border: 2px solid var(--iron-red);
  padding: 12px 18px;
  font-family: var(--mono); font-size: 11px;
  letter-spacing: 0.18em; text-transform: uppercase;
  z-index: 200; animation: pl-toast-in 0.18s ease-out;
}
@keyframes pl-toast-in { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translateX(-50%); } }

/* Empty state */
.pl-week-empty {
  padding: 40px 24px; text-align: center;
  border: 1px dashed var(--iron-400);
  margin: 24px 16px;
}
.pl-week-empty .ttl {
  font-family: var(--display); font-weight: 900;
  font-size: 24px; text-transform: uppercase;
  margin-bottom: 8px; color: var(--paper-000);
}
.pl-week-empty .sub {
  font-family: var(--mono); font-size: 11px;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--iron-500); margin-bottom: 16px;
}
`;

function ensureStyles() {
  if (document.getElementById('planner-css')) return;
  const tag = document.createElement('style');
  tag.id = 'planner-css';
  tag.textContent = css;
  document.head.appendChild(tag);
}

/* ============================================================
   DATE HELPERS
   ============================================================ */

function todayKey() {
  const d = new Date();
  return ymd(d);
}
function ymd(d) {
  return d.toISOString().slice(0, 10);
}
function parseYmd(s) {
  return new Date(s + 'T00:00:00');
}
function addDays(d, n) {
  const out = new Date(d.getTime());
  out.setDate(out.getDate() + n);
  return out;
}
function mondayOf(d) {
  // ISO week: Mon=1..Sun=7
  const day = d.getDay();  // Sun=0..Sat=6
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(d, offset);
}
const DOW_LONG  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtWeekRange(monday) {
  const sun = addDays(monday, 6);
  if (monday.getMonth() === sun.getMonth()) {
    return `${MONTH_SHORT[monday.getMonth()]} ${monday.getDate()}–${sun.getDate()} · ${sun.getFullYear()}`;
  }
  return `${MONTH_SHORT[monday.getMonth()]} ${monday.getDate()} – ${MONTH_SHORT[sun.getMonth()]} ${sun.getDate()}`;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ============================================================
   RECIPE LOAD (mirrors cookbook.loadRecipe but lightweight)
   ============================================================ */

async function loadRecipeForPlanner(id) {
  // Try user-recipes first
  const user = getUserRecipe(id);
  if (user) return applyRecipeState(user);
  // Then cached seed
  const cached = storage.get(`recipe:${id}`, null);
  if (cached) return applyRecipeState(cached);
  // Then fetch
  try {
    const res = await fetch(`/data/recipes/${id}.json`);
    if (!res.ok) throw new Error('not found');
    const data = await res.json();
    storage.set(`recipe:${id}`, data);
    return applyRecipeState(data);
  } catch (e) {
    return null;
  }
}

async function loadAllRecipesForPicker() {
  // Combine seed index + user-recipes index
  const userIdx = getUserRecipesIndex();
  let seedIdx = storage.get('recipes:index', null);
  if (!seedIdx) {
    try {
      const res = await fetch('/data/recipes/_index.json');
      if (res.ok) {
        seedIdx = await res.json();
        storage.set('recipes:index', seedIdx);
      }
    } catch (e) {
      seedIdx = [];
    }
  }
  const seen = new Set(userIdx.map(r => r.id));
  const merged = [...userIdx, ...(seedIdx || []).filter(r => !seen.has(r.id))];
  return merged;
}

/* ============================================================
   HTML BUILDERS
   ============================================================ */

function dayHtml(date, entries, recipesById) {
  const k = ymd(date);
  const today = k === todayKey();
  const isPast = k < todayKey();
  const dow = DOW_SHORT[date.getDay()];
  const dnum = date.getDate();

  // Macro totals (sum across entries × servings ratio)
  const totals = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  let renderedCount = 0;
  const entryRows = entries.map((e, i) => {
    const r = recipesById[e.recipeId];
    if (!r) return `<div class="pl-entry"><div class="check"></div><span class="title-link">(missing recipe)</span><span class="meta">—</span><button class="rm" data-rm="${i}" data-day="${k}">×</button></div>`;
    const baseServ = r.servings || 1;
    const useServ = e.servings || baseServ;
    const scale = useServ / baseServ;
    const m = r.macros_per_serving || {};
    // Macros in the recipe are per-serving; total for the meal = useServ * per-serving
    totals.kcal      += (m.kcal      || 0) * useServ;
    totals.protein_g += (m.protein_g || 0) * useServ;
    totals.carbs_g   += (m.carbs_g   || 0) * useServ;
    totals.fat_g     += (m.fat_g     || 0) * useServ;
    renderedCount++;
    const cookedCls = e.cooked ? ' cooked' : '';
    return `
      <div class="pl-entry${cookedCls}" data-day="${k}" data-idx="${i}">
        <div class="check" data-action="toggle-cook"></div>
        <a class="title-link" href="#/cookbook/recipe/${escapeHtml(r.id)}">${escapeHtml(r.title || r.id)}</a>
        <span class="meta">×${useServ} · <span class="pro">${Math.round((m.protein_g || 0) * useServ)}g</span></span>
        <button class="rm" data-action="remove" title="Remove">×</button>
      </div>
    `;
  }).join('');

  const macrosCls = renderedCount === 0 ? ' empty' : '';
  const macroHtml = `
    <div class="pl-macros${macrosCls}">
      <div class="protein">
        <span class="l">Protein</span>
        <span class="v">${Math.round(totals.protein_g)}g</span>
      </div>
      <div><span class="l">kCal</span><span class="v">${Math.round(totals.kcal)}</span></div>
      <div><span class="l">Carb</span><span class="v">${Math.round(totals.carbs_g)}g</span></div>
      <div><span class="l">Fat</span><span class="v">${Math.round(totals.fat_g)}g</span></div>
    </div>
  `;

  const body = entryRows
    ? `<div class="pl-entries">${entryRows}</div>`
    : `<div class="pl-empty">No meals planned</div>`;

  return `
    <div class="pl-day${today ? ' today' : ''}${isPast && !today ? ' past' : ''}" data-day="${k}">
      <div class="pl-day-head">
        <span class="dow">${dow}</span>
        <span class="dnum">${dnum}</span>
      </div>
      ${macroHtml}
      ${body}
      <button class="pl-add" data-action="add-recipe" data-day="${k}">+ Add recipe</button>
    </div>
  `;
}

function recipePickerHtml(recipes, query = '') {
  const q = query.toLowerCase();
  const filtered = q
    ? recipes.filter(r => (r.title || '').toLowerCase().includes(q))
    : recipes;
  const items = filtered.map(r => `
    <button type="button" class="pl-modal-item" data-recipe-id="${escapeHtml(r.id)}">
      <div>
        <div class="name">${escapeHtml(r.title || r.id)}</div>
        <div class="meta">${escapeHtml(r.cuisine || '')} · ${r.time_total ?? '?'} MIN${r.user_created ? ' · USER' : ''}</div>
      </div>
      <div class="pro">${r.protein_g ?? '?'}g</div>
    </button>
  `).join('');
  return items || '<div class="pl-empty" style="padding: 32px;">No matches</div>';
}

/* ============================================================
   ADD-TO-PLAN PICKER (called from recipe detail page)
   ============================================================ */

export function openDatePicker(recipeId) {
  ensureStyles();
  const monday = mondayOf(new Date());
  const todayK = todayKey();
  const tiles = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i);
    const k = ymd(d);
    const isToday = k === todayK;
    return `
      <button type="button" class="pl-date-tile${isToday ? ' today' : ''}" data-date="${k}">
        <div class="dow">${DOW_SHORT[d.getDay()]}</div>
        <div class="dnum">${d.getDate()}</div>
      </button>
    `;
  }).join('');

  const overlay = document.createElement('div');
  overlay.className = 'pl-modal-bg';
  overlay.innerHTML = `
    <div class="pl-modal">
      <div class="pl-modal-head">
        <div class="ttl">Add to Plan</div>
        <button type="button" class="x" data-action="close">×</button>
      </div>
      <div class="pl-date-strip">${tiles}</div>
    </div>
  `;
  document.body.appendChild(overlay);

  function close() { overlay.remove(); }

  overlay.addEventListener('click', e => {
    if (e.target === overlay) return close();
    if (e.target.closest('[data-action="close"]')) return close();
    const tile = e.target.closest('.pl-date-tile');
    if (tile) {
      const date = tile.dataset.date;
      addToPlan(date, recipeId);
      close();
      showToast(`Added to ${dowLabel(date)}`);
    }
  });
}

function dowLabel(dateStr) {
  const d = parseYmd(dateStr);
  if (dateStr === todayKey()) return 'today';
  if (dateStr === ymd(addDays(new Date(), 1))) return 'tomorrow';
  return `${DOW_LONG[d.getDay()]} ${d.getDate()}`;
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'pl-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

/* ============================================================
   MAIN RENDER
   ============================================================ */

export async function render({ mount, rest, params }) {
  ensureStyles();

  // Week offset: params.w = "+1" means next week, "-1" previous. Default = current.
  const offsetWeeks = Number(params.w || 0);
  const monday = addDays(mondayOf(new Date()), offsetWeeks * 7);

  // Show loading first
  mount.innerHTML = `<div style="padding: 32px;"><div class="skeleton" style="height:280px;"></div></div>`;

  // Collect all recipe IDs referenced across the week
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const planByDay = {};
  const recipeIdsSet = new Set();
  for (const d of days) {
    const k = ymd(d);
    const plan = getDayPlan(k);
    planByDay[k] = plan;
    for (const e of plan) recipeIdsSet.add(e.recipeId);
  }

  // Load each referenced recipe
  const recipesById = {};
  await Promise.all([...recipeIdsSet].map(async id => {
    const r = await loadRecipeForPlanner(id);
    if (r) recipesById[id] = r;
  }));

  const totalEntries = Object.values(planByDay).reduce((s, p) => s + p.length, 0);

  mount.innerHTML = `
    <div class="pl-root">
      <div class="pl-head">
        <div>
          <div class="ttl">Plan</div>
          <div class="sub">${fmtWeekRange(monday)} · ${totalEntries} meal${totalEntries === 1 ? '' : 's'} planned</div>
        </div>
        <div class="pl-head-right">
          <button type="button" class="pl-nav-btn" data-action="prev">← Prev</button>
          <button type="button" class="pl-nav-btn today" data-action="today">Today</button>
          <button type="button" class="pl-nav-btn" data-action="next">Next →</button>
        </div>
      </div>
      ${totalEntries === 0 && offsetWeeks === 0 ? `
        <div class="pl-week-empty">
          <div class="ttl">Nothing planned yet</div>
          <div class="sub">Open a recipe and tap “Add to Plan”</div>
          <a href="#/cookbook" class="btn outline sm" style="text-decoration:none;">→ Cookbook</a>
        </div>
      ` : `
        <div class="pl-week">
          ${days.map(d => dayHtml(d, planByDay[ymd(d)] || [], recipesById)).join('')}
        </div>
      `}
    </div>
  `;

  wireEvents(mount, params, monday, planByDay, recipesById);
}

async function wireEvents(mount, params, monday, planByDay, recipesById) {
  const root = mount.querySelector('.pl-root');
  if (!root) return;

  root.addEventListener('click', async (e) => {
    // Header nav
    const navBtn = e.target.closest('.pl-nav-btn');
    if (navBtn) {
      const action = navBtn.dataset.action;
      const offset = Number(params.w || 0);
      if (action === 'prev')       location.hash = `#/plan?w=${offset - 1}`;
      else if (action === 'next')  location.hash = `#/plan?w=${offset + 1}`;
      else if (action === 'today') location.hash = `#/plan`;
      return;
    }

    // Toggle cooked
    const checkBtn = e.target.closest('[data-action="toggle-cook"]');
    if (checkBtn) {
      const entryEl = checkBtn.closest('.pl-entry');
      const k = entryEl.dataset.day;
      const idx = Number(entryEl.dataset.idx);
      toggleCookedInPlan(k, idx);
      // Re-render in place via location.hash bounce (cheap and reliable)
      const offset = Number(params.w || 0);
      location.hash = offset === 0 ? '#/plan' : `#/plan?w=${offset}`;
      // Force re-render: trigger hashchange listener
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      return;
    }

    // Remove entry
    const rmBtn = e.target.closest('[data-action="remove"]');
    if (rmBtn) {
      const entryEl = rmBtn.closest('.pl-entry');
      const k = entryEl.dataset.day;
      const idx = Number(entryEl.dataset.idx);
      removeFromPlan(k, idx);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      return;
    }

    // + Add recipe (per day)
    const addBtn = e.target.closest('[data-action="add-recipe"]');
    if (addBtn) {
      const day = addBtn.dataset.day;
      const recipes = await loadAllRecipesForPicker();
      openRecipePicker(recipes, day);
      return;
    }
  });
}

function openRecipePicker(recipes, dateStr) {
  const overlay = document.createElement('div');
  overlay.className = 'pl-modal-bg';
  overlay.innerHTML = `
    <div class="pl-modal">
      <div class="pl-modal-head">
        <div class="ttl">Add to ${escapeHtml(dowLabel(dateStr))}</div>
        <button type="button" class="x" data-action="close">×</button>
      </div>
      <div class="pl-modal-search">
        <input type="search" placeholder="Search recipes…" autofocus />
      </div>
      <div class="pl-modal-list">${recipePickerHtml(recipes)}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  const listEl = overlay.querySelector('.pl-modal-list');
  const searchEl = overlay.querySelector('input');
  function close() { overlay.remove(); }

  overlay.addEventListener('click', e => {
    if (e.target === overlay) return close();
    if (e.target.closest('[data-action="close"]')) return close();
    const item = e.target.closest('.pl-modal-item');
    if (item) {
      const recipeId = item.dataset.recipeId;
      addToPlan(dateStr, recipeId);
      close();
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      showToast(`Added`);
    }
  });
  let debounce;
  searchEl.addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      listEl.innerHTML = recipePickerHtml(recipes, e.target.value);
    }, 80);
  });
}
