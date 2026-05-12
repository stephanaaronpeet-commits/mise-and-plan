/* =============================================================
   cookbook.js — Recipe list + detail (minimal v0.1)
   Loads recipes from /data/recipes/_index.json, then individual files.
   ============================================================= */

import { storage, ensureSchemaCurrent } from '../core/storage.js';
import { mountFilterBar, fromParams, toQueryString, applyFilters, isEmpty } from './filters.js';

ensureSchemaCurrent();

/* ---------- Styles scoped to this module ---------- */
const css = `
.cookbook-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
@media (min-width: 768px) {
  .cookbook-list {
    padding: 24px 32px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 18px;
  }
}

.card {
  border: 1px solid var(--iron-300);
  background: var(--iron-100);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: block;
  transition: border-color 0.1s;
}
.card:hover { border-color: var(--paper-200); }
.card::before {
  content: "";
  position: absolute;
  top: -1px; left: -1px;
  width: 36px; height: 36px;
  border-top: 2px solid var(--paper-000);
  border-left: 2px solid var(--paper-000);
  pointer-events: none;
}
.card .img {
  height: 130px;
  background: var(--iron-200);
  background-image:
    linear-gradient(135deg, var(--iron-300) 25%, transparent 25%),
    linear-gradient(225deg, var(--iron-300) 25%, transparent 25%),
    linear-gradient(45deg,  var(--iron-300) 25%, transparent 25%),
    linear-gradient(315deg, var(--iron-300) 25%, var(--iron-200) 25%);
  background-position: 14px 0, 14px 0, 0 0, 0 0;
  background-size: 28px 28px;
  border-bottom: 1px solid var(--iron-300);
  position: relative;
}
.card .img-label {
  position: absolute;
  bottom: 8px; right: 10px;
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.2em;
  color: var(--iron-500);
}
.card .stamp-pos {
  position: absolute;
  top: 10px; right: 10px;
  z-index: 2;
}
.card .body { padding: 14px 14px 16px; }
.card .title {
  font-family: var(--display);
  font-weight: 800;
  font-size: 22px;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  color: var(--paper-000);
  margin-bottom: 4px;
}
.card .sub {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--iron-500);
  margin-bottom: 12px;
}
.card .macros {
  display: flex;
  gap: 0;
  border-top: 1px solid var(--iron-300);
  margin-top: 12px;
  padding-top: 10px;
}
.card .macro { flex: 1; text-align: left; }
.card .macro .v {
  font-family: var(--display);
  font-weight: 800;
  font-size: 19px;
  line-height: 1;
  color: var(--paper-000);
}
.card .macro.protein .v { color: var(--iron-red); }
.card .macro .k {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--iron-500);
  margin-top: 4px;
}

/* DETAIL VIEW */
.recipe-detail { max-width: var(--maxw); margin: 0 auto; }
.recipe-detail .back {
  display: inline-block;
  padding: 12px 16px;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--iron-500);
  text-decoration: none;
}
.recipe-detail .back:hover { color: var(--paper-000); }
.recipe-detail .hero {
  height: 220px;
  border-bottom: 1px solid var(--iron-300);
  border-top: 1px solid var(--iron-300);
  background: var(--iron-200);
  background-image:
    linear-gradient(135deg, var(--iron-300) 25%, transparent 25%),
    linear-gradient(225deg, var(--iron-300) 25%, transparent 25%),
    linear-gradient(45deg,  var(--iron-300) 25%, transparent 25%),
    linear-gradient(315deg, var(--iron-300) 25%, var(--iron-200) 25%);
  background-position: 20px 0, 20px 0, 0 0, 0 0;
  background-size: 40px 40px;
}
.recipe-detail .head {
  padding: 24px 16px 18px;
  border-bottom: 1px solid var(--iron-300);
}
.recipe-detail .head .eyebrow-row {
  display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;
}
.recipe-detail .head .title {
  font-family: var(--display);
  font-weight: 900;
  font-size: 38px;
  line-height: 0.9;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  color: var(--paper-000);
  margin-bottom: 8px;
}
.recipe-detail .head .sub {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--paper-200);
}
@media (min-width: 768px) {
  .recipe-detail .head { padding: 36px 32px 26px; }
  .recipe-detail .head .title { font-size: 72px; }
}

.macro-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  border-bottom: 1px solid var(--iron-300);
}
.macro-row .cell {
  padding: 16px 12px;
  border-right: 1px solid var(--iron-300);
}
.macro-row .cell:last-child { border-right: 0; }
.macro-row .cell .v {
  font-family: var(--display);
  font-weight: 900;
  font-size: 32px;
  line-height: 0.85;
  color: var(--paper-000);
}
.macro-row .cell .k {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--iron-500);
  margin-top: 6px;
}
.macro-row .cell.protein {
  background: var(--iron-red);
  border-right-color: var(--iron-red);
}
.macro-row .cell.protein .v { color: var(--paper-000); font-size: 48px; }
.macro-row .cell.protein .k { color: var(--paper-000); opacity: 0.9; }

.block {
  padding: 22px 16px 26px;
  border-bottom: 1px solid var(--iron-300);
}
@media (min-width: 768px) {
  .block { padding: 28px 32px; }
}
.block-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}
.block-head .title {
  font-family: var(--display);
  font-weight: 800;
  font-size: 22px;
  line-height: 1;
  text-transform: uppercase;
}
.block-head .count {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--iron-500);
}

.cat-label {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--iron-500);
  padding: 10px 0 4px;
  border-bottom: 1px dashed var(--iron-400);
  margin-bottom: 6px;
}
.ing {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--iron-300);
  align-items: baseline;
}
.ing:last-child { border-bottom: 0; }
.ing .qty {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--paper-000);
  letter-spacing: 0.04em;
}
.ing.protein-item .qty { color: var(--iron-red); }
.ing .item { font-size: 14px; color: var(--paper-100); }
.ing .item .prep { color: var(--iron-500); font-style: italic; }
.ing .tip {
  grid-column: 2;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--safety);
  margin-top: 4px;
  line-height: 1.4;
}
.ing .tip::before { content: "TIP — "; font-weight: 700; letter-spacing: 0.16em; }

.step {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid var(--iron-300);
  align-items: baseline;
}
.step:last-child { border-bottom: 0; }
.step .n {
  font-family: var(--display);
  font-weight: 900;
  font-size: 32px;
  line-height: 0.85;
  color: var(--iron-500);
  text-align: center;
}
.step .text { font-size: 15px; line-height: 1.45; }
.step .timer-tag {
  display: inline-block;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  padding: 4px 8px;
  border: 1px solid var(--paper-200);
  margin-top: 6px;
  color: var(--paper-100);
}
`;

/* Inject styles once */
function ensureStyles() {
  if (document.getElementById('cookbook-css')) return;
  const tag = document.createElement('style');
  tag.id = 'cookbook-css';
  tag.textContent = css;
  document.head.appendChild(tag);
}

/* ---------- Data loading ---------- */

async function loadIndex() {
  const cached = storage.get('recipes:index', null);
  if (cached) {
    // Stale-while-revalidate: serve cached, fetch fresh in background
    fetchIndex().then(fresh => { if (fresh) storage.set('recipes:index', fresh); });
    return cached;
  }
  const fresh = await fetchIndex();
  if (fresh) storage.set('recipes:index', fresh);
  return fresh || [];
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
  const cached = storage.get(`recipe:${id}`, null);
  if (cached) return cached;
  try {
    const res = await fetch(`/data/recipes/${id}.json`);
    if (!res.ok) throw new Error(`recipe ${id} not found`);
    const data = await res.json();
    storage.set(`recipe:${id}`, data);
    return data;
  } catch (e) {
    console.warn('[cookbook] failed to load recipe:', id, e);
    return null;
  }
}

/* ---------- Renderers ---------- */

function cardHtml(r) {
  return `
    <a class="card" href="#/cookbook/recipe/${r.id}">
      <div class="img"><div class="img-label">IMG</div></div>
      ${r.favorite ? '<div class="stamp-pos"><div class="stamp fav">FAV</div></div>' : ''}
      <div class="body">
        <div class="title">${escapeHtml(r.title)}</div>
        <div class="sub">${escapeHtml(r.cuisine || '')} · ${r.time?.total_min || '?'} MIN · ${r.servings || 1} SVG</div>
        <div class="macros">
          <div class="macro protein"><div class="v">${r.macros_per_serving?.protein_g ?? '?'}g</div><div class="k">Protein</div></div>
          <div class="macro"><div class="v">${r.macros_per_serving?.kcal ?? '?'}</div><div class="k">Kcal</div></div>
          <div class="macro"><div class="v">${r.macros_per_serving?.carbs_g ?? '?'}</div><div class="k">Carbs</div></div>
          <div class="macro"><div class="v">${r.macros_per_serving?.fat_g ?? '?'}</div><div class="k">Fat</div></div>
        </div>
      </div>
    </a>
  `;
}

function renderList(mount, allRecipes, initialParams = {}) {
  if (!allRecipes.length) {
    mount.innerHTML = `
      <div class="section-head">
        <div class="title">Cookbook</div>
        <div class="meta">0 RECIPES</div>
      </div>
      <div class="empty">
        <div class="icon-frame"></div>
        <div class="title-row">No recipes yet</div>
        <div class="sub">The cookbook is empty. Recipes get added one at a time and validated against the schema.</div>
      </div>`;
    return;
  }

  let state = fromParams(initialParams);
  const favCount = allRecipes.filter(r => r.favorite).length;

  mount.innerHTML = `
    <div class="section-head">
      <div class="title">Cookbook</div>
      <div class="meta" id="cookbook-meta"></div>
    </div>
    <div id="cookbook-filterbar"></div>
    <div id="cookbook-cards"></div>
  `;

  const metaMount  = mount.querySelector('#cookbook-meta');
  const barMount   = mount.querySelector('#cookbook-filterbar');
  const cardsMount = mount.querySelector('#cookbook-cards');

  function paint() {
    const filtered = applyFilters(allRecipes, state);
    metaMount.innerHTML = isEmpty(state)
      ? `${allRecipes.length} RECIPE${allRecipes.length !== 1 ? 'S' : ''}<br/>${favCount} FAV`
      : `${filtered.length} / ${allRecipes.length} MATCH${filtered.length === 1 ? '' : 'ES'}`;
    if (!filtered.length) {
      cardsMount.innerHTML = `
        <div class="empty">
          <div class="icon-frame"></div>
          <div class="title-row">No matches</div>
          <div class="sub">Nothing fits these filters. Loosen them and try again.</div>
        </div>`;
      return;
    }
    cardsMount.innerHTML = `<div class="cookbook-list">${filtered.map(cardHtml).join('')}</div>`;
  }

  mountFilterBar(barMount, state, allRecipes, newState => {
    state = newState;
    history.replaceState({}, '', '#/cookbook' + toQueryString(state));
    paint();
  });

  paint();
}

function renderDetail(mount, r) {
  if (!r) {
    mount.innerHTML = `
      <div class="empty">
        <div class="title-row">Recipe not found</div>
        <a class="action" href="#/cookbook" style="text-decoration:none; display:inline-block;">← Back</a>
      </div>`;
    return;
  }
  const m = r.macros_per_serving || {};
  const tags = (r.tags || []).slice(0, 4);

  // Group ingredients by category
  const byCat = {};
  (r.ingredients || []).forEach(ing => {
    (byCat[ing.category] ||= []).push(ing);
  });
  const catOrder = ['protein', 'produce', 'pantry', 'dairy', 'frozen', 'spice', 'other'];
  const ingHtml = catOrder.filter(c => byCat[c]).map(cat => `
    <div class="cat-label">${cat}</div>
    ${byCat[cat].map(ing => `
      <div class="ing${cat === 'protein' ? ' protein-item' : ''}">
        <div class="qty">${formatQty(ing)}</div>
        <div class="item">
          ${escapeHtml(ing.item)}${ing.prep ? ` <span class="prep">— ${escapeHtml(ing.prep)}</span>` : ''}
          ${ing.thai_market_tip ? `<div class="tip">${escapeHtml(ing.thai_market_tip)}</div>` : ''}
          ${ing.note ? `<div class="tip">${escapeHtml(ing.note)}</div>` : ''}
        </div>
      </div>
    `).join('')}
  `).join('');

  const stepsHtml = (r.steps || []).map(s => `
    <div class="step">
      <div class="n">${s.n}</div>
      <div class="text">
        ${escapeHtml(s.text)}
        ${s.timer_min ? `<div class="timer-tag">${s.timer_min}:00 timer</div>` : ''}
      </div>
    </div>
  `).join('');

  mount.innerHTML = `
    <div class="recipe-detail">
      <a class="back" href="#/cookbook">← Cookbook</a>
      <div class="hero"></div>
      <div class="head">
        <div class="eyebrow-row">
          ${tags.map((t, i) => `<span class="eyebrow${i === 0 ? '' : ' outline'}">${escapeHtml(t)}</span>`).join('')}
        </div>
        <div class="title">${escapeHtml(r.title)}</div>
        <div class="sub">${r.time?.prep_min || 0} MIN PREP · ${r.time?.cook_min || 0} MIN COOK · ${r.servings || 1} SERVING${r.servings > 1 ? 'S' : ''}</div>
      </div>
      <div class="macro-row">
        <div class="cell protein"><div class="v">${m.protein_g ?? '?'}g</div><div class="k">Protein</div></div>
        <div class="cell"><div class="v">${m.kcal ?? '?'}</div><div class="k">Kcal</div></div>
        <div class="cell"><div class="v">${m.carbs_g ?? '?'}</div><div class="k">Carbs</div></div>
        <div class="cell"><div class="v">${m.fat_g ?? '?'}</div><div class="k">Fat</div></div>
        <div class="cell"><div class="v">${m.fiber_g ?? '?'}</div><div class="k">Fibre</div></div>
      </div>
      <div class="block">
        <div class="block-head">
          <div class="title">Ingredients</div>
          <div class="count">${(r.ingredients || []).length} ITEMS · ${r.servings || 1} SVG</div>
        </div>
        ${ingHtml}
      </div>
      <div class="block">
        <div class="block-head">
          <div class="title">Steps</div>
          <div class="count">${(r.steps || []).length} STEPS</div>
        </div>
        ${stepsHtml}
      </div>
      ${r.notes ? `<div class="block"><div class="block-head"><div class="title">Notes</div></div><p style="color:var(--paper-100); line-height:1.6;">${escapeHtml(r.notes)}</p></div>` : ''}
    </div>
  `;
}

/* ---------- Helpers ---------- */

function formatQty(ing) {
  if (ing.unit === 'to-taste') return 'to taste';
  if (ing.unit === 'pinch')    return 'pinch';
  const u = ing.unit === 'piece' ? 'pcs' : ing.unit;
  return `${ing.qty} ${u}`;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- Entry point called by router ---------- */

export async function render({ mount, rest, params }) {
  ensureStyles();

  // Route: #/cookbook/recipe/:id
  if (rest[0] === 'recipe' && rest[1]) {
    const recipe = await loadRecipe(rest[1]);
    renderDetail(mount, recipe);
    return;
  }

  // Default: list
  const index = await loadIndex();

  // If we have an index, hydrate full recipes for the cards (small enough)
  let recipes = [];
  if (index && index.length) {
    recipes = await Promise.all(index.map(meta => loadRecipe(meta.id)));
    recipes = recipes.filter(Boolean);
  }
  renderList(mount, recipes, params);
}
