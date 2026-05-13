/* =============================================================
   insights.js — Stats page (Phase 3.5 / testability fundament).
   Computes everything from existing planner data + recipe state.
   No new persistence beyond what already exists.
   ============================================================= */

import {
  storage, ensureSchemaCurrent,
  listPlannedDayKeys, getDayPlan, getUserRecipe, applyRecipeState, getRecipeState,
} from '../core/storage.js';

ensureSchemaCurrent();

/* ============================================================
   STYLES
   ============================================================ */
const css = `
.st-root { max-width: 1000px; margin: 0 auto; padding-bottom: 40px; }

.st-head {
  padding: 18px 16px 14px;
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--iron-300);
  background: var(--iron-000);
}
.st-head .ttl {
  font-family: var(--display); font-weight: 900;
  font-size: 36px; line-height: 0.9;
  letter-spacing: -0.01em; text-transform: uppercase;
  color: var(--paper-000);
}
.st-head .sub {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-500); margin-top: 8px;
}
@media (min-width: 768px) { .st-head { padding: 22px 28px 18px; } .st-head .ttl { font-size: 56px; } }

.st-range {
  display: flex; gap: 6px; padding: 14px 16px;
  border-bottom: 1px solid var(--iron-300);
  background: var(--iron-100); flex-wrap: wrap;
}
@media (min-width: 768px) { .st-range { padding: 14px 28px; } }
.st-range-btn {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.16em; text-transform: uppercase;
  padding: 6px 10px;
  border: 1px solid var(--iron-300);
  background: transparent; color: var(--paper-100);
  cursor: pointer;
}
.st-range-btn:hover { border-color: var(--paper-200); }
.st-range-btn.active {
  background: var(--paper-000); color: var(--iron-000);
  border-color: var(--paper-000);
}

/* 4 big stat boxes */
.st-tiles {
  display: grid; grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid var(--iron-300);
}
@media (min-width: 768px) { .st-tiles { grid-template-columns: repeat(4, 1fr); } }
.st-tile {
  padding: 22px 16px;
  border-right: 1px solid var(--iron-300);
  border-bottom: 1px solid var(--iron-300);
}
@media (min-width: 768px) { .st-tile { border-bottom: 0; padding: 28px 18px; } }
.st-tile:last-child { border-right: 0; }
.st-tile.protein { background: var(--iron-000); }
.st-tile .v {
  display: block; font-family: var(--display); font-weight: 900;
  font-size: 48px; line-height: 0.9;
  color: var(--paper-000);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
.st-tile.protein .v { color: var(--iron-red); }
.st-tile .u {
  font-family: var(--mono); font-size: 12px;
  color: var(--iron-500); margin-left: 2px;
  letter-spacing: 0.05em; font-weight: 400;
}
.st-tile.protein .u { color: var(--iron-red-deep); }
.st-tile .l {
  display: block; margin-top: 8px;
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--iron-500); line-height: 1.4;
}
.st-tile.protein .l { color: var(--iron-red); font-weight: 700; }
@media (min-width: 768px) { .st-tile .v { font-size: 56px; } }

/* Section block */
.st-block {
  padding: 22px 16px 8px;
  border-bottom: 1px solid var(--iron-300);
}
@media (min-width: 768px) { .st-block { padding: 28px 28px 14px; } }
.st-block-head {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 14px;
}
.st-block-head .name {
  font-family: var(--display); font-weight: 900;
  font-size: 22px; text-transform: uppercase;
  color: var(--paper-000); line-height: 1;
}
@media (min-width: 768px) { .st-block-head .name { font-size: 28px; } }
.st-block-head .info {
  font-family: var(--mono); font-size: 10px;
  color: var(--iron-500); letter-spacing: 0.18em;
  text-transform: uppercase;
}

/* Bar rows (daily protein, cuisine mix) */
.st-bar-row {
  display: grid; grid-template-columns: 72px 1fr 70px;
  gap: 10px; padding: 8px 0;
  align-items: center;
}
.st-bar-row .lbl {
  font-family: var(--mono); font-size: 11px;
  letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--iron-500);
}
.st-bar-row.today .lbl { color: var(--iron-red); font-weight: 700; }
.st-bar-row .bar {
  height: 18px; background: var(--iron-200);
  border: 1px solid var(--iron-300);
  position: relative; overflow: hidden;
}
.st-bar-row .bar .fill {
  position: absolute; left: 0; top: 0; bottom: 0;
  background: var(--paper-200);
  transition: width 200ms linear;
}
.st-bar-row.protein-bar .bar .fill { background: var(--iron-red); }
.st-bar-row.zero .bar .fill { background: transparent; }
.st-bar-row .val {
  font-family: var(--mono); font-weight: 700; font-size: 12px;
  color: var(--paper-000);
  font-variant-numeric: tabular-nums;
  text-align: right;
  letter-spacing: 0.04em;
}
.st-bar-row.zero .val { color: var(--iron-500); font-weight: 400; }
.st-bar-row .val.red { color: var(--iron-red); }

/* Top recipes list */
.st-recipe-row {
  display: grid; grid-template-columns: 24px 1fr auto;
  gap: 10px; padding: 10px 0;
  border-bottom: 1px dashed var(--iron-300);
  align-items: center;
}
.st-recipe-row:last-child { border-bottom: 0; }
.st-recipe-row .rank {
  font-family: var(--display); font-weight: 800;
  font-size: 18px; color: var(--iron-500);
  font-variant-numeric: tabular-nums;
}
.st-recipe-row.top1 .rank { color: var(--iron-red); }
.st-recipe-row .name {
  font-family: var(--display); font-weight: 700;
  font-size: 16px; text-transform: uppercase;
  color: var(--paper-000); line-height: 1.1;
  text-decoration: none;
}
.st-recipe-row .name:hover { color: var(--iron-red); }
.st-recipe-row .meta {
  font-family: var(--mono); font-size: 11px;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--iron-red); font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.st-empty {
  padding: 56px 24px; text-align: center;
  border: 1px dashed var(--iron-400);
  margin: 24px 16px;
}
.st-empty .ttl {
  font-family: var(--display); font-weight: 900;
  font-size: 24px; text-transform: uppercase;
  margin-bottom: 8px; color: var(--paper-000);
}
.st-empty .sub {
  font-family: var(--mono); font-size: 11px;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--iron-500); margin-bottom: 16px;
}
`;

function ensureStyles() {
  if (document.getElementById('insights-css')) return;
  const tag = document.createElement('style');
  tag.id = 'insights-css';
  tag.textContent = css;
  document.head.appendChild(tag);
}

/* ============================================================
   DATE HELPERS
   ============================================================ */

function ymd(d) { return d.toISOString().slice(0, 10); }
function addDays(d, n) { const o = new Date(d.getTime()); o.setDate(o.getDate() + n); return o; }
const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const RANGE_OPTIONS = [
  { id: '7',   label: 'Last 7 days',  days: 7 },
  { id: '30',  label: 'Last 30 days', days: 30 },
  { id: '90',  label: 'Last 90 days', days: 90 },
  { id: 'all', label: 'All time',     days: null },
];

function rangeDays(rangeId) {
  const today = new Date();
  const opt = RANGE_OPTIONS.find(o => o.id === rangeId) || RANGE_OPTIONS[0];
  if (opt.days == null) {
    // All time: use all planner keys + today
    const keys = listPlannedDayKeys().sort();
    if (!keys.length) return [ymd(today)];
    const first = new Date(keys[0]);
    const dayCount = Math.max(1, Math.floor((today.getTime() - first.getTime()) / 86400000) + 1);
    return Array.from({ length: dayCount }, (_, i) => ymd(addDays(first, i)));
  }
  // Last N days ENDING today
  return Array.from({ length: opt.days }, (_, i) => ymd(addDays(today, -(opt.days - 1 - i))));
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ============================================================
   RECIPE LOAD (lightweight)
   ============================================================ */
async function loadRecipe(id) {
  const user = getUserRecipe(id);
  if (user) return applyRecipeState(user);
  const cached = storage.get(`recipe:${id}`, null);
  if (cached) return applyRecipeState(cached);
  try {
    const res = await fetch(`/data/recipes/${id}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    storage.set(`recipe:${id}`, data);
    return applyRecipeState(data);
  } catch (e) { return null; }
}

/* ============================================================
   COMPUTE STATS
   ============================================================ */

function computeStats(dayKeys, recipesById) {
  const dailyKcal = {};
  const dailyProtein = {};
  const recipeCookCounts = {};   // id → count in this range
  const cuisineCounts = {};
  let totalCooks = 0;

  for (const k of dayKeys) {
    dailyKcal[k]    = 0;
    dailyProtein[k] = 0;
    const plan = getDayPlan(k);
    for (const e of plan) {
      if (!e.cooked) continue;
      const r = recipesById[e.recipeId];
      if (!r) continue;
      totalCooks++;
      const baseServ = r.servings || 1;
      const useServ = e.servings || baseServ;
      const m = r.macros_per_serving || {};
      dailyKcal[k]    += (m.kcal      || 0) * useServ;
      dailyProtein[k] += (m.protein_g || 0) * useServ;

      recipeCookCounts[e.recipeId] = (recipeCookCounts[e.recipeId] || 0) + 1;
      const cuisine = (r.cuisine || 'misc').toLowerCase();
      cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
    }
  }

  // Avg protein per day, counting only days with ≥1 cooked meal
  const activeDays = dayKeys.filter(k => dailyProtein[k] > 0);
  const avgProtein = activeDays.length
    ? Math.round(activeDays.reduce((s, k) => s + dailyProtein[k], 0) / activeDays.length)
    : 0;

  // Cook streak — consecutive days ending today where ≥1 meal cooked
  const today = ymd(new Date());
  let streak = 0;
  let cursor = new Date();
  // Walk backwards until a gap
  while (true) {
    const k = ymd(cursor);
    const plan = getDayPlan(k);
    const cookedAny = plan.some(e => e.cooked);
    if (!cookedAny) {
      // If today has nothing yet, allow 1 grace day so the streak isn't
      // killed at 09:00 before you've cooked anything.
      if (k === today && streak === 0) {
        cursor = addDays(cursor, -1);
        continue;
      }
      break;
    }
    streak++;
    cursor = addDays(cursor, -1);
  }

  const uniqueRecipes = Object.keys(recipeCookCounts).length;

  return {
    dailyKcal, dailyProtein,
    totalCooks, avgProtein, streak, uniqueRecipes,
    recipeCookCounts, cuisineCounts,
    activeDays: activeDays.length,
  };
}

/* ============================================================
   HTML BUILDERS
   ============================================================ */

function tilesHtml(stats) {
  return `
    <div class="st-tiles">
      <div class="st-tile">
        <span class="v">${stats.totalCooks}</span>
        <span class="l">Meals<br/>cooked</span>
      </div>
      <div class="st-tile protein">
        <span class="v">${stats.avgProtein}<span class="u">g</span></span>
        <span class="l">Avg protein<br/>per cook-day</span>
      </div>
      <div class="st-tile">
        <span class="v">${stats.streak}</span>
        <span class="l">Day<br/>streak</span>
      </div>
      <div class="st-tile">
        <span class="v">${stats.uniqueRecipes}</span>
        <span class="l">Unique<br/>recipes</span>
      </div>
    </div>
  `;
}

function dailyBarsHtml(dayKeys, stats) {
  // Show at most the last 14 days as bars (longer ranges aggregate weekly)
  const showDays = dayKeys.slice(-14);
  const proteins = showDays.map(k => stats.dailyProtein[k] || 0);
  const max = Math.max(60, ...proteins);  // floor at 60g so a single 50g bar isn't full
  const today = ymd(new Date());
  return showDays.map(k => {
    const date = new Date(k + 'T00:00:00');
    const dow = DOW_SHORT[date.getDay()].toUpperCase();
    const dnum = date.getDate();
    const p = stats.dailyProtein[k] || 0;
    const pct = Math.min(100, (p / max) * 100);
    const isToday = k === today;
    const zeroCls = p === 0 ? ' zero' : '';
    return `
      <div class="st-bar-row protein-bar${isToday ? ' today' : ''}${zeroCls}">
        <div class="lbl">${dow} ${dnum}</div>
        <div class="bar"><div class="fill" style="width: ${pct}%;"></div></div>
        <div class="val red">${Math.round(p)}g</div>
      </div>
    `;
  }).join('');
}

function topRecipesHtml(stats, recipesById, max = 5) {
  const entries = Object.entries(stats.recipeCookCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max);
  if (!entries.length) return `<div style="font-family: var(--mono); font-size: 11px; color: var(--iron-500); padding: 12px 0; text-align: center; letter-spacing: 0.18em; text-transform: uppercase;">No cooks in this range</div>`;
  return entries.map(([id, n], i) => {
    const r = recipesById[id];
    const title = r?.title || id;
    return `
      <div class="st-recipe-row${i === 0 ? ' top1' : ''}">
        <div class="rank">${i + 1}</div>
        <a class="name" href="#/cookbook/recipe/${escapeHtml(id)}">${escapeHtml(title)}</a>
        <div class="meta">×${n}</div>
      </div>
    `;
  }).join('');
}

function cuisineMixHtml(stats) {
  const entries = Object.entries(stats.cuisineCounts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return '';
  const total = entries.reduce((s, [, n]) => s + n, 0);
  return entries.map(([c, n]) => {
    const pct = Math.round((n / total) * 100);
    return `
      <div class="st-bar-row">
        <div class="lbl">${escapeHtml(c)}</div>
        <div class="bar"><div class="fill" style="width: ${pct}%;"></div></div>
        <div class="val">${n} · ${pct}%</div>
      </div>
    `;
  }).join('');
}

/* ============================================================
   MAIN RENDER
   ============================================================ */
export async function render({ mount, rest, params }) {
  ensureStyles();
  const rangeId = params.r || '7';
  const dayKeys = rangeDays(rangeId);

  // Skeleton while loading
  mount.innerHTML = `<div style="padding: 32px;"><div class="skeleton" style="height:260px;"></div></div>`;

  // Collect all referenced recipe IDs
  const idSet = new Set();
  for (const k of dayKeys) {
    for (const e of getDayPlan(k)) idSet.add(e.recipeId);
  }
  const recipesById = {};
  await Promise.all([...idSet].map(async id => {
    const r = await loadRecipe(id);
    if (r) recipesById[id] = r;
  }));

  const stats = computeStats(dayKeys, recipesById);

  if (!stats.totalCooks) {
    mount.innerHTML = `
      <div class="st-root">
        <div class="st-head">
          <div>
            <div class="ttl">Stats</div>
            <div class="sub">Cook history · derived from your plan</div>
          </div>
        </div>
        <div class="st-range">${rangeButtonsHtml(rangeId)}</div>
        <div class="st-empty">
          <div class="ttl">No cooks yet</div>
          <div class="sub">Cook a planned meal and stats will populate here</div>
          <a href="#/plan" class="btn outline sm" style="text-decoration:none;">→ Plan</a>
        </div>
      </div>`;
    wireRange(mount);
    return;
  }

  const rangeLabel = RANGE_OPTIONS.find(o => o.id === rangeId)?.label || 'Last 7 days';

  mount.innerHTML = `
    <div class="st-root">
      <div class="st-head">
        <div>
          <div class="ttl">Stats</div>
          <div class="sub">${rangeLabel} · ${stats.totalCooks} meal${stats.totalCooks === 1 ? '' : 's'} cooked · ${stats.activeDays}/${dayKeys.length} active day${stats.activeDays === 1 ? '' : 's'}</div>
        </div>
      </div>
      <div class="st-range">${rangeButtonsHtml(rangeId)}</div>
      ${tilesHtml(stats)}
      <div class="st-block">
        <div class="st-block-head">
          <div class="name">Daily protein</div>
          <div class="info">last ${Math.min(14, dayKeys.length)} day${dayKeys.length === 1 ? '' : 's'}</div>
        </div>
        ${dailyBarsHtml(dayKeys, stats)}
      </div>
      <div class="st-block">
        <div class="st-block-head">
          <div class="name">Most cooked</div>
          <div class="info">top 5</div>
        </div>
        ${topRecipesHtml(stats, recipesById)}
      </div>
      ${Object.keys(stats.cuisineCounts).length > 1 ? `
        <div class="st-block">
          <div class="st-block-head">
            <div class="name">Cuisine mix</div>
            <div class="info">share of cooks</div>
          </div>
          ${cuisineMixHtml(stats)}
        </div>` : ''}
    </div>
  `;

  wireRange(mount);
}

function rangeButtonsHtml(active) {
  return RANGE_OPTIONS.map(o =>
    `<button type="button" class="st-range-btn${o.id === active ? ' active' : ''}" data-range="${o.id}">${o.label}</button>`
  ).join('');
}

function wireRange(mount) {
  mount.querySelector('.st-range')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-range]');
    if (!btn) return;
    const r = btn.dataset.range;
    location.hash = r === '7' ? '#/stats' : `#/stats?r=${r}`;
  });
}
