/* =============================================================
   cookbook.js — Recipe list + detail.
   - List view: matches §01 of _design/cookbook-design-v1.html
     (browse rail, filter chips with live counts, sort, search, cards).
   - Detail view: unchanged from v0.1 (will be reworked in Session 1.3).
   ============================================================= */

import { storage, ensureSchemaCurrent, applyRecipeState, getUserRecipe, getUserRecipesIndex } from '../core/storage.js';
import * as F from './filters.js';
import { renderDetail } from './recipe-detail.js';
import { renderCookMode } from './cook-mode.js';
import { render as renderForm } from './recipe-form.js';

ensureSchemaCurrent();

/* ============================================================
   STYLES — scoped to the cookbook module
   ============================================================ */
const css = `
/* ───────── LIST: section head ───────── */
.cb-head {
  padding: 18px 16px 14px;
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 12px; border-bottom: 1px solid var(--iron-300);
  background: var(--iron-000);
}
.cb-head .ttl {
  font-family: var(--display); font-weight: 900;
  font-size: 36px; line-height: 0.9;
  letter-spacing: -0.01em; text-transform: uppercase;
  color: var(--paper-000);
}
.cb-head .sub {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-500); margin-top: 8px;
}
.cb-head-stats {
  display: none;  /* mobile: hidden */
  gap: 18px; align-items: center;
}
.cb-head-stats .stat {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-500); text-align: center;
}
.cb-head-stats .stat .n {
  font-family: var(--display); font-weight: 800;
  font-size: 28px; display: block; line-height: 1;
  color: var(--paper-000); margin-bottom: 4px;
  font-variant-numeric: tabular-nums;
}
.cb-head-stats .stat.fav .n { color: var(--iron-red); }
.cb-head-meta-mobile {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-500); text-align: right; line-height: 1.5;
}
.cb-head-meta-mobile .strong { color: var(--paper-000); font-weight: 700; }
.cb-head-meta-mobile .red    { color: var(--iron-red); font-weight: 700; }

@media (min-width: 768px) {
  .cb-head { padding: 22px 28px 18px; }
  .cb-head .ttl { font-size: 56px; }
  .cb-head-stats { display: flex; }
  .cb-head-meta-mobile { display: none; }
}

/* ───────── LIST: browse rail (sticky) ───────── */
.cb-browse {
  padding: 14px 16px;
  border-bottom: 1px solid var(--iron-300);
  display: flex; gap: 8px;
  overflow-x: auto; -webkit-overflow-scrolling: touch;
  scroll-snap-type: x proximity;
  background-color: var(--iron-100);
  background-image:
    linear-gradient(to right,  rgba(242,239,230,0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(242,239,230,0.03) 1px, transparent 1px);
  background-size: 12px 12px;
  position: sticky; top: 0; z-index: 5;
}
@media (min-width: 768px) {
  .cb-browse { padding: 16px 28px; gap: 12px; flex-wrap: wrap; overflow: visible; }
}
.browse-tile {
  flex: 0 0 auto;
  width: 88px; padding: 12px 10px 10px;
  border: 1px solid var(--iron-300);
  background: var(--iron-000); color: var(--paper-000);
  cursor: pointer; text-align: left;
  scroll-snap-align: start;
  transition: border-color 100ms linear;
}
.browse-tile:hover:not(.active) { border-color: var(--paper-200); }
.browse-tile .name {
  font-family: var(--display); font-weight: 800;
  font-size: 17px; line-height: 1;
  letter-spacing: 0; text-transform: uppercase;
}
.browse-tile .count {
  font-family: var(--mono); font-size: 9.5px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-500); margin-top: 8px;
}
.browse-tile.active {
  background: var(--paper-000); color: var(--iron-000); border-color: var(--paper-000);
}
.browse-tile.active .count { color: var(--iron-400); }
@media (min-width: 768px) {
  .browse-tile { width: 112px; padding: 14px 12px 12px; }
  .browse-tile .name { font-size: 20px; }
}

/* ───────── LIST: filter bar ───────── */
.cb-filter {
  padding: 12px 16px 14px;
  border-bottom: 1px solid var(--iron-300);
  background: var(--iron-000);
  display: flex; flex-direction: column; gap: 10px;
  position: relative;
}
@media (min-width: 768px) {
  .cb-filter {
    padding: 14px 28px;
    flex-direction: row; align-items: center; flex-wrap: wrap;
    gap: 14px;
  }
}

/* Search */
.cb-search {
  border: 1px solid var(--iron-300);
  background: var(--iron-100);
  padding: 8px 12px;
  display: flex; align-items: center; gap: 8px;
}
@media (min-width: 768px) { .cb-search { flex: 1; min-width: 240px; max-width: 360px; } }
.cb-search-icon {
  width: 14px; height: 14px;
  border: 1.5px solid var(--iron-500); border-radius: 50%;
  position: relative; flex: 0 0 14px;
}
.cb-search-icon::after {
  content: ""; position: absolute;
  width: 6px; height: 1.5px; background: var(--iron-500);
  transform: rotate(45deg); right: -4px; bottom: -1px;
}
.cb-search-input {
  flex: 1; background: transparent; border: 0; outline: 0;
  font-family: var(--mono); font-size: 12px;
  letter-spacing: 0.06em; color: var(--paper-000);
  padding: 2px 0; min-width: 0;
}
.cb-search-input::placeholder {
  color: var(--iron-500); text-transform: uppercase;
  letter-spacing: 0.12em; font-size: 11px;
}
.cb-search:focus-within { border-color: var(--paper-200); }

/* Chip row */
.cb-chips {
  display: flex; gap: 6px; align-items: center;
  overflow-x: auto; -webkit-overflow-scrolling: touch; flex-wrap: nowrap;
}
@media (min-width: 768px) { .cb-chips { flex-wrap: wrap; overflow: visible; } }
.chip {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.16em; text-transform: uppercase;
  padding: 6px 9px;
  border: 1px solid var(--iron-300); color: var(--paper-100);
  background: transparent; cursor: pointer;
  display: inline-flex; align-items: center; gap: 4px;
  flex: 0 0 auto; white-space: nowrap;
  transition: border-color 100ms linear, background 100ms linear, color 100ms linear;
}
.chip:hover { border-color: var(--paper-200); }
.chip.active { background: var(--paper-000); color: var(--iron-000); border-color: var(--paper-000); }
.chip .count {
  color: var(--iron-500); font-size: 9px;
  margin-left: 2px; font-variant-numeric: tabular-nums;
}
.chip.active .count { color: var(--iron-400); }
.chip .x { font-size: 11px; margin-left: 2px; line-height: 1; }

/* Sort dropdown */
.cb-sort-wrap { position: relative; }
@media (min-width: 768px) { .cb-sort-wrap { margin-left: auto; } }
.sort {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  padding: 8px 12px;
  border: 1px solid var(--iron-300); color: var(--paper-100);
  background: var(--iron-100); cursor: pointer;
  display: inline-flex; align-items: center; gap: 8px;
  user-select: none;
}
.sort:hover { border-color: var(--paper-200); }
.sort .caret { color: var(--iron-500); font-family: var(--display); }
.sort.open { border-color: var(--paper-000); color: var(--paper-000); }
.sort.open .caret { color: var(--paper-000); transform: rotate(180deg); }
.sort-menu {
  position: absolute; top: calc(100% + 4px); right: 0;
  background: var(--iron-100); border: 1px solid var(--paper-000);
  min-width: 180px; z-index: 10;
  display: none; padding: 4px 0;
}
.sort.open + .sort-menu { display: block; }
.sort-opt {
  display: block; width: 100%; text-align: left;
  background: transparent; border: 0; cursor: pointer;
  font-family: var(--mono); font-size: 11px;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--paper-100); padding: 9px 14px;
}
.sort-opt:hover { background: var(--iron-200); color: var(--paper-000); }
.sort-opt.on { color: var(--paper-000); background: var(--iron-200); }
.sort-opt.on::before { content: "› "; color: var(--iron-red); margin-right: 2px; }

/* ───────── LIST: recipe card grid ───────── */
.cb-grid {
  padding: 16px;
  display: grid; gap: 12px;
  grid-template-columns: 1fr;
}
@media (min-width: 768px) { .cb-grid { padding: 24px 28px; grid-template-columns: repeat(2, 1fr); gap: 16px; } }
@media (min-width: 1100px) { .cb-grid { grid-template-columns: repeat(3, 1fr); } }

.rc {
  background: var(--iron-100);
  border: 1px solid var(--iron-300);
  color: var(--paper-000); cursor: pointer;
  text-decoration: none; display: block;
  transition: border-color 100ms linear;
}
.rc:hover { border-color: var(--paper-200); }
.rc-photo {
  height: 140px;
  background-color: var(--iron-200);
  background-image: repeating-linear-gradient(135deg, rgba(242,239,230,0.05) 0 10px, transparent 10px 20px);
  position: relative; border-bottom: 1px solid var(--iron-300);
}
.rc-photo.cuisine-thai {
  background-color: #1a1410;
  background-image:
    repeating-linear-gradient(45deg, rgba(194,51,30,0.08) 0 6px, transparent 6px 16px),
    repeating-linear-gradient(135deg, rgba(242,239,230,0.04) 0 10px, transparent 10px 20px);
}
.rc-photo.cuisine-korean {
  background-color: #161116;
  background-image: repeating-linear-gradient(135deg, rgba(242,239,230,0.04) 0 10px, transparent 10px 20px);
}
.rc-photo.cuisine-bowl {
  background-color: #14171a;
  background-image:
    radial-gradient(circle at 50% 60%, rgba(242,239,230,0.08) 0 18%, transparent 19%),
    repeating-linear-gradient(135deg, rgba(242,239,230,0.04) 0 10px, transparent 10px 20px);
}
.rc-photo .ph-label {
  position: absolute; bottom: 12px; left: 12px;
  font-family: var(--mono); font-size: 9px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-500);
  border: 1px dashed var(--iron-400);
  padding: 3px 6px;
}
.rc-photo .stamp { position: absolute; top: 10px; right: 10px; }

.rc-body { padding: 14px 14px 0; }
.rc-cat {
  font-family: var(--mono); font-size: 9.5px;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--iron-red); margin-bottom: 4px;
}
.rc h4 {
  font-family: var(--display); font-weight: 800;
  font-size: 22px; line-height: 1;
  text-transform: uppercase; letter-spacing: -0.005em;
  margin: 0 0 6px; color: var(--paper-000);
}
.rc .rc-sub {
  font-family: var(--mono); font-size: 9.5px;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--iron-500); margin-bottom: 12px;
}

.macro-strip {
  display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr;
  border-top: 1px solid var(--iron-300);
}
.macro-strip > div {
  padding: 10px 8px 11px;
  border-right: 1px solid var(--iron-300);
  text-align: left;
  font-family: var(--mono); font-size: 8.5px;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--iron-500); line-height: 1;
}
.macro-strip > div:last-child { border-right: none; }
.macro-strip .v {
  display: block; font-family: var(--display); font-weight: 800;
  font-size: 22px; color: var(--paper-000);
  margin-top: 4px; font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em; line-height: 1;
}
.macro-strip .v .u {
  font-family: var(--mono); font-size: 9px;
  color: var(--iron-500); font-weight: 400;
  margin-left: 2px; letter-spacing: 0.05em;
}
.macro-strip .protein { background: var(--iron-000); }
.macro-strip .protein .v { color: var(--iron-red); font-size: 26px; font-weight: 900; }
.macro-strip .protein .v .u { color: var(--iron-red-deep); }
.macro-strip .protein .l { color: var(--iron-red); font-weight: 700; }

/* ───────── LIST: empty state ───────── */
.cb-empty {
  padding: 64px 24px; text-align: center;
  background-image: repeating-linear-gradient(45deg, transparent 0 8px, rgba(242,239,230,0.03) 8px 9px);
  border: 1px dashed var(--iron-400);
  margin: 16px;
}
.cb-empty .glyph {
  width: 56px; height: 56px;
  border: 2px solid var(--iron-400);
  margin: 0 auto 16px; position: relative;
}
.cb-empty .glyph::before, .cb-empty .glyph::after {
  content: ""; position: absolute;
  background: var(--iron-400); left: 50%; top: 50%;
  width: 32px; height: 2px;
}
.cb-empty .glyph::before { transform: translate(-50%,-50%) rotate(45deg); }
.cb-empty .glyph::after  { transform: translate(-50%,-50%) rotate(-45deg); }
.cb-empty .ttl {
  font-family: var(--display); font-weight: 900;
  font-size: 26px; text-transform: uppercase;
  margin-bottom: 8px; color: var(--paper-000);
}
.cb-empty .lede {
  font-family: var(--mono); font-size: 11px;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--iron-500); margin-bottom: 16px;
}

/* Detail-view styles live in recipe-detail.js (its own scoped stylesheet). */
`;

function ensureStyles() {
  if (document.getElementById('cookbook-css')) return;
  const tag = document.createElement('style');
  tag.id = 'cookbook-css';
  tag.textContent = css;
  document.head.appendChild(tag);
}

/* ============================================================
   DATA LOADING
   ============================================================ */

async function loadIndex() {
  // Seed index (from /data/recipes/_index.json) — cached + revalidated.
  const cached = storage.get('recipes:index', null);
  if (cached) {
    fetchIndex().then(fresh => { if (fresh) storage.set('recipes:index', fresh); });
    return mergeUserIndex(cached);
  }
  const fresh = await fetchIndex();
  if (fresh) storage.set('recipes:index', fresh);
  return mergeUserIndex(fresh || []);
}

/* User-created recipes win on id collision (so an in-app edit of a seed
   recipe shadows the seed). User-only ids get appended. */
function mergeUserIndex(seedIdx) {
  const user = getUserRecipesIndex();
  if (!user.length) return seedIdx;
  const userIds = new Set(user.map(r => r.id));
  const filteredSeed = seedIdx.filter(r => !userIds.has(r.id));
  return [...user, ...filteredSeed];
}

async function fetchIndex() {
  try {
    const res = await fetch('/data/recipes/_index.json');
    if (!res.ok) throw new Error('index not found');
    return await res.json();
  } catch (e) {
    console.warn('[cookbook] failed to load index:', e);
    return null;
  }
}

async function loadRecipe(id) {
  // User-created/edited recipe wins. Otherwise fall back to seed cache,
  // then network. User state (fav/cook_count/last_cooked) is layered last.
  const user = getUserRecipe(id);
  if (user) return applyRecipeState(user);

  const cached = storage.get(`recipe:${id}`, null);
  if (cached) return applyRecipeState(cached);
  try {
    const res = await fetch(`/data/recipes/${id}.json`);
    if (!res.ok) throw new Error(`recipe ${id} not found`);
    const data = await res.json();
    storage.set(`recipe:${id}`, data);
    return applyRecipeState(data);
  } catch (e) {
    console.warn('[cookbook] failed to load recipe:', id, e);
    return null;
  }
}

/* ============================================================
   LIST VIEW — helpers
   ============================================================ */

const NEW_DAYS = 14;

function daysSince(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(then.getTime())) return null;
  const now = Date.now();
  return Math.max(0, Math.floor((now - then.getTime()) / 86400000));
}

function isNew(r) {
  const d = daysSince(r.created);
  return d != null && d <= NEW_DAYS;
}

function cuisinePhotoClass(r) {
  if (r.cuisine === 'thai') return 'cuisine-thai';
  if (r.cuisine === 'korean') return 'cuisine-korean';
  return 'cuisine-bowl';
}

function categoryLabel(r) {
  const t = (r.title || '').toLowerCase();
  const isBreakfast = (r.meal_type || []).includes('breakfast');
  const tags = r.tags || [];
  const flags = r.diet_flags || [];

  // Suffix
  let suffix;
  if (t.includes('soup'))                                                suffix = 'Soups';
  else if (t.includes('bowl'))                                           suffix = 'Bowls';
  else if (flags.includes('vegetarian') || flags.includes('vegan')
        || tags.includes('vegetarian'))                                  suffix = 'Veg';
  else if (tags.includes('batch') || tags.includes('meal-prep'))         suffix = 'Batch';
  else if (isBreakfast)                                                  suffix = 'Bowls';
  else                                                                   suffix = 'Mains';

  // Prefix — breakfast overrides cuisine
  let prefix;
  if (isBreakfast) prefix = "B'fast";
  else if (r.cuisine) prefix = r.cuisine.charAt(0).toUpperCase() + r.cuisine.slice(1);
  else prefix = 'Misc';

  return `${prefix} · ${suffix}`;
}

function subLineFor(r) {
  const parts = [];
  const t = r.time?.total_min;
  if (t != null) parts.push(`${t} MIN`);
  if (r.cook_count && r.cook_count > 0) {
    parts.push(`×${r.cook_count} COOKED`);
    const d = daysSince(r.last_cooked);
    if (d != null) parts.push(`LAST ${d}D AGO`);
  } else {
    parts.push('NOT YET COOKED');
  }
  return parts.join(' · ');
}

function stampFor(r) {
  if (isNew(r))                              return { cls: 'new',    text: 'NEW' };
  if (r.favorite)                            return { cls: 'fav',    text: 'FAV' };
  if (r.cook_count && r.cook_count > 0)      return { cls: 'cooked', text: `×${r.cook_count} COOKED` };
  return null;
}

/* ============================================================
   LIST VIEW — HTML builders
   ============================================================ */

function cardHtml(r) {
  const m = r.macros_per_serving || {};
  const stamp = stampFor(r);
  return `
    <a class="rc" href="#/cookbook/recipe/${r.id}">
      <div class="rc-photo ${cuisinePhotoClass(r)}">
        ${stamp ? `<span class="stamp ${stamp.cls}">${escapeHtml(stamp.text)}</span>` : ''}
        <span class="ph-label">PHOTO</span>
      </div>
      <div class="rc-body">
        <div class="rc-cat">${escapeHtml(categoryLabel(r))}</div>
        <h4>${escapeHtml(r.title || '')}</h4>
        <div class="rc-sub">${escapeHtml(subLineFor(r))}</div>
      </div>
      <div class="macro-strip">
        <div class="protein"><span class="l">Protein</span><span class="v">${m.protein_g ?? '?'}<span class="u">g</span></span></div>
        <div><span class="l">kCal</span><span class="v">${m.kcal ?? '?'}</span></div>
        <div><span class="l">Carb</span><span class="v">${m.carbs_g ?? '?'}<span class="u">g</span></span></div>
        <div><span class="l">Fat</span><span class="v">${m.fat_g ?? '?'}<span class="u">g</span></span></div>
      </div>
    </a>
  `;
}

function browseRailHtml(state, allRecipes) {
  return F.BROWSE_ORDER.map(id => {
    const cfg = F.BROWSE_CONFIGS[id];
    const count = F.browseCount(allRecipes, id);
    const active = state.browse === id ? ' active' : '';
    return `
      <button type="button" class="browse-tile${active}" data-browse="${id}">
        <div class="name">${escapeHtml(cfg.label)}</div>
        <div class="count">${count}</div>
      </button>
    `;
  }).join('');
}

function chipsHtml(state, allRecipes) {
  return F.CHIP_ORDER.map(id => {
    const cfg = F.CHIP_CONFIGS[id];
    const count = F.chipCount(allRecipes, state, id);
    const active = state.chips.includes(id);
    return `
      <button type="button" class="chip${active ? ' active' : ''}" data-chip="${id}">
        ${escapeHtml(cfg.label)}${active ? '<span class="x">×</span>' : `<span class="count">${count}</span>`}
      </button>
    `;
  }).join('');
}

function sortMenuHtml(state) {
  return F.SORT_OPTIONS.map(o =>
    `<button type="button" class="sort-opt${state.sort === o.id ? ' on' : ''}" data-sort="${o.id}">${escapeHtml(o.label)}</button>`
  ).join('');
}

function sectionHeadHtml(allCount, filteredCount, favCount, newCount, filtersActive) {
  return `
    <div class="cb-head">
      <div>
        <div class="ttl">Cookbook</div>
        <div class="sub">Personal recipe collection · ${allCount} recipe${allCount !== 1 ? 's' : ''}</div>
      </div>
      <div class="cb-head-stats">
        <div class="stat"><span class="n cb-count-total">${allCount}</span>Recipes</div>
        <div class="stat fav"><span class="n">${favCount}</span>Favorites</div>
        <div class="stat"><span class="n">${newCount}</span>New</div>
        <a class="btn sm" href="#/cookbook/new" style="text-decoration:none;"><span class="plus">+</span>Add Recipe</a>
      </div>
      <div class="cb-head-meta-mobile cb-meta-mobile">
        <span class="cb-count-show"></span>
        <a class="btn sm" href="#/cookbook/new" style="text-decoration:none; display:inline-flex; margin-top:8px;"><span class="plus">+</span>Add</a>
      </div>
    </div>
  `;
}

function emptyHtml() {
  return `
    <div class="cb-empty">
      <div class="glyph"></div>
      <div class="ttl">Nothing here</div>
      <div class="lede">No match for these filters</div>
      <button type="button" class="btn outline sm" data-action="clear-filters">Reset</button>
    </div>
  `;
}

/* ============================================================
   LIST VIEW — orchestrator
   ============================================================ */

function renderList(mount, allRecipes, initialParams = {}) {
  if (!allRecipes.length) {
    mount.innerHTML = `
      <div class="cb-head">
        <div class="ttl">Cookbook</div>
        <div class="cb-head-meta-mobile">0 RECIPES</div>
      </div>
      <div class="cb-empty">
        <div class="glyph"></div>
        <div class="ttl">No recipes yet</div>
        <div class="lede">The cookbook is empty</div>
      </div>`;
    return;
  }

  let state = F.fromParams(initialParams);
  const favCount = allRecipes.filter(r => r.favorite).length;
  const newCount = allRecipes.filter(isNew).length;

  mount.innerHTML = `
    <div class="cb-root">
      ${sectionHeadHtml(allRecipes.length, allRecipes.length, favCount, newCount, !F.isEmpty(state))}
      <div class="cb-browse">${browseRailHtml(state, allRecipes)}</div>
      <div class="cb-filter">
        <div class="cb-search">
          <span class="cb-search-icon"></span>
          <input class="cb-search-input" type="search" placeholder="Search recipes, ingredients…" value="${escapeHtml(state.q)}" />
        </div>
        <div class="cb-chips">${chipsHtml(state, allRecipes)}</div>
        <div class="cb-sort-wrap">
          <button type="button" class="sort${F.SORT_OPTIONS.find(o => o.id === state.sort) ? '' : ''}">
            Sort · <span class="sort-label">${escapeHtml(F.SORT_OPTIONS.find(o => o.id === state.sort)?.label || 'Most cooked')}</span>
            <span class="caret">▾</span>
          </button>
          <div class="sort-menu">${sortMenuHtml(state)}</div>
        </div>
      </div>
      <div class="cb-grid"></div>
    </div>
  `;

  const root      = mount.querySelector('.cb-root');
  const gridEl    = root.querySelector('.cb-grid');
  const metaEl    = root.querySelector('.cb-meta-mobile .cb-count-show');
  const searchEl  = root.querySelector('.cb-search-input');
  const sortBtn   = root.querySelector('.sort');
  const sortLabel = root.querySelector('.sort-label');

  function syncUrl() {
    history.replaceState({}, '', '#/cookbook' + F.toQueryString(state));
  }

  function refreshMobileMeta(filteredCount) {
    if (!metaEl) return;
    if (F.isEmpty(state)) {
      metaEl.innerHTML = `${allRecipes.length}&nbsp;<span class="strong">REC</span><br/>${favCount}&nbsp;<span class="red">FAV</span> · ${newCount} NEW`;
    } else {
      metaEl.innerHTML = `${filteredCount} / ${allRecipes.length}<br/><span class="strong">MATCH${filteredCount === 1 ? '' : 'ES'}</span>`;
    }
  }

  function paintCards() {
    const filtered = F.applyFilters(allRecipes, state);
    const sorted   = F.applySort(filtered, state.sort);
    refreshMobileMeta(sorted.length);
    if (!sorted.length) {
      gridEl.innerHTML = emptyHtml();
      return;
    }
    gridEl.innerHTML = sorted.map(cardHtml).join('');
    // Save the current filtered URL so the detail page's back-link returns
    // to *this* view (preserving filters/sort) instead of bare /cookbook.
    gridEl.querySelectorAll('a.rc').forEach(card => {
      card.addEventListener('click', () => {
        sessionStorage.setItem('mp:cookbook-return', location.hash);
      });
    });
  }

  function refreshChipCounts() {
    root.querySelectorAll('.chip').forEach(chip => {
      const id = chip.dataset.chip;
      if (!id) return;
      const c = F.chipCount(allRecipes, state, id);
      const countEl = chip.querySelector('.count');
      if (countEl && !chip.classList.contains('active')) countEl.textContent = c;
    });
  }

  /* ----- Event delegation for the whole list ----- */
  root.addEventListener('click', e => {
    // Reset button (in empty state)
    const reset = e.target.closest('[data-action="clear-filters"]');
    if (reset) {
      state = F.defaultState();
      // Repaint everything (resets all states)
      mount.querySelector('.cb-browse').innerHTML = browseRailHtml(state, allRecipes);
      mount.querySelector('.cb-chips').innerHTML  = chipsHtml(state, allRecipes);
      searchEl.value = '';
      sortLabel.textContent = F.SORT_OPTIONS.find(o => o.id === state.sort).label;
      mount.querySelector('.sort-menu').innerHTML = sortMenuHtml(state);
      syncUrl(); paintCards();
      return;
    }

    // Browse tile
    const tile = e.target.closest('.browse-tile');
    if (tile) {
      const id = tile.dataset.browse;
      if (!id || id === state.browse) return;
      state.browse = id;
      root.querySelectorAll('.browse-tile').forEach(t =>
        t.classList.toggle('active', t.dataset.browse === id));
      refreshChipCounts();
      syncUrl(); paintCards();
      return;
    }

    // Chip
    const chip = e.target.closest('.chip');
    if (chip) {
      const id = chip.dataset.chip;
      if (!id) return;
      const idx = state.chips.indexOf(id);
      if (idx >= 0) state.chips.splice(idx, 1); else state.chips.push(id);
      // Re-render just the chip row to swap × and count
      root.querySelector('.cb-chips').innerHTML = chipsHtml(state, allRecipes);
      syncUrl(); paintCards();
      return;
    }

    // Sort button (toggle dropdown)
    if (e.target.closest('.sort')) {
      e.stopPropagation();
      sortBtn.classList.toggle('open');
      return;
    }

    // Sort option
    const opt = e.target.closest('.sort-opt');
    if (opt) {
      const id = opt.dataset.sort;
      const cfg = F.SORT_OPTIONS.find(o => o.id === id);
      if (!cfg) return;
      state.sort = id;
      sortLabel.textContent = cfg.label;
      root.querySelectorAll('.sort-opt').forEach(o =>
        o.classList.toggle('on', o.dataset.sort === id));
      sortBtn.classList.remove('open');
      syncUrl(); paintCards();
      return;
    }
  });

  // Close sort dropdown on outside click
  document.addEventListener('click', () => sortBtn.classList.remove('open'));

  // Search input — debounced 150ms (no re-render of the bar; preserves focus)
  let debounce;
  searchEl.addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.q = e.target.value;
      refreshChipCounts();
      syncUrl(); paintCards();
    }, 150);
  });

  paintCards();
}

/* ============================================================
   HELPERS
   ============================================================ */

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ============================================================
   ENTRY POINT (called by router)
   ============================================================ */

export async function render({ mount, rest, params }) {
  ensureStyles();

  // New / edit form
  if (rest[0] === 'new' || rest[0] === 'edit') {
    return renderForm({ mount, rest, params });
  }

  if (rest[0] === 'recipe' && rest[1]) {
    const recipe = await loadRecipe(rest[1]);
    if (rest[2] === 'cook') {
      renderCookMode(mount, recipe);
    } else {
      renderDetail(mount, recipe);
    }
    return;
  }

  const index = await loadIndex();
  let recipes = [];
  if (index && index.length) {
    recipes = await Promise.all(index.map(meta => loadRecipe(meta.id)));
    recipes = recipes.filter(Boolean);
  }
  renderList(mount, recipes, params);
}
