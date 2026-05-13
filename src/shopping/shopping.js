/* =============================================================
   shopping.js — auto-generated shopping list (Phase 2.2).
   Aggregates ingredients across a chosen range of planned days,
   groups by category, smart-combines units where possible.
   ============================================================= */

import {
  storage, ensureSchemaCurrent,
  getDayPlan, getUserRecipe, applyRecipeState, listPlannedDayKeys,
} from '../core/storage.js';

ensureSchemaCurrent();

/* ============================================================
   STYLES
   ============================================================ */
const css = `
.sh-root { max-width: 900px; margin: 0 auto; padding-bottom: 40px; }

.sh-head {
  padding: 18px 16px 14px;
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--iron-300);
  background: var(--iron-000);
}
.sh-head .ttl {
  font-family: var(--display); font-weight: 900;
  font-size: 36px; line-height: 0.9;
  letter-spacing: -0.01em; text-transform: uppercase;
  color: var(--paper-000);
}
.sh-head .sub {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-500); margin-top: 8px;
}
@media (min-width: 768px) { .sh-head { padding: 22px 28px 18px; } .sh-head .ttl { font-size: 56px; } }

.sh-range {
  display: flex; gap: 6px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--iron-300);
  background: var(--iron-100);
  flex-wrap: wrap;
}
@media (min-width: 768px) { .sh-range { padding: 14px 28px; } }
.sh-range-btn {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.16em; text-transform: uppercase;
  padding: 6px 10px;
  border: 1px solid var(--iron-300);
  background: transparent; color: var(--paper-100);
  cursor: pointer;
}
.sh-range-btn:hover { border-color: var(--paper-200); }
.sh-range-btn.active {
  background: var(--paper-000); color: var(--iron-000);
  border-color: var(--paper-000);
}

.sh-actions {
  display: flex; justify-content: space-between;
  padding: 14px 16px 0;
}
@media (min-width: 768px) { .sh-actions { padding: 18px 28px 0; } }
.sh-stats {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-500); align-self: center;
}
.sh-stats .strong { color: var(--paper-000); font-family: var(--display); font-weight: 800; font-size: 16px; vertical-align: -2px; margin: 0 2px; }
.sh-stats .red { color: var(--iron-red); }
.sh-action-btn {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  padding: 7px 12px;
  border: 1px solid var(--iron-400);
  background: transparent; color: var(--paper-100);
  cursor: pointer;
  margin-left: 6px;
}
.sh-action-btn:hover { border-color: var(--paper-200); color: var(--paper-000); }
.sh-actions-right { display: flex; }

/* Manual-item adder */
.sh-add-manual {
  display: grid; grid-template-columns: 1fr 80px 110px auto;
  gap: 6px; padding: 10px 16px;
  border-bottom: 1px solid var(--iron-300);
  background: var(--iron-100);
}
@media (max-width: 600px) {
  .sh-add-manual { grid-template-columns: 1fr 60px 1fr; }
  .sh-add-manual .add-btn { grid-column: 1 / -1; }
}
@media (min-width: 768px) { .sh-add-manual { padding: 10px 28px; } }
.sh-add-manual input, .sh-add-manual select {
  background: var(--iron-000); border: 1px solid var(--iron-300);
  color: var(--paper-000); padding: 7px 9px;
  font-family: var(--mono); font-size: 12px; outline: 0;
}
.sh-add-manual input:focus, .sh-add-manual select:focus { border-color: var(--paper-200); }
.sh-add-manual .add-btn {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  padding: 7px 12px; cursor: pointer;
  border: 1px solid var(--paper-000); background: var(--paper-000);
  color: var(--iron-000); font-weight: 700;
}
.sh-row.manual .rm-manual {
  width: 22px; height: 22px;
  background: transparent; border: 0;
  color: var(--iron-500); cursor: pointer;
  font-family: var(--display); font-size: 16px;
}
.sh-row.manual .rm-manual:hover { color: var(--iron-red); }

/* Print — strip chrome, clean list */
@media print {
  .masthead, .app-nav, .colophon, .sh-range, .sh-add-manual, .sh-actions-right { display: none !important; }
  html, body, main { background: white !important; }
  body, * { color: black !important; }
  .sh-root { max-width: 100% !important; padding: 0 !important; }
  .sh-head { background: white !important; border-color: black !important; padding: 8pt 0 !important; }
  .sh-head .ttl { color: black !important; font-size: 24pt !important; }
  .sh-head .sub { color: #444 !important; font-size: 8pt !important; }
  .sh-actions { padding: 4pt 0 !important; }
  .sh-stats, .sh-stats * { color: black !important; }
  .sh-stats .red { color: #C2331E !important; }
  .sh-group-head { background: #f3f3f3 !important; border-color: black !important; padding: 4pt 0 !important; color: black !important; }
  .sh-group-head.protein { color: #C2331E !important; }
  .sh-row { padding: 3pt 0 !important; border-color: #999 !important; page-break-inside: avoid; }
  .sh-row .qty { color: black !important; font-size: 10pt !important; }
  .sh-row.protein .qty { color: #C2331E !important; }
  .sh-row .item { color: black !important; font-size: 10pt !important; }
  .sh-row .sources { color: #666 !important; font-size: 7pt !important; }
  .sh-row .box { border-color: black !important; }
  .sh-row.checked .item { text-decoration: line-through; color: #666 !important; }
}

/* Toast */
.sh-toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: var(--iron-000); color: var(--paper-000);
  border: 2px solid var(--iron-red);
  padding: 10px 16px;
  font-family: var(--mono); font-size: 11px;
  letter-spacing: 0.18em; text-transform: uppercase;
  z-index: 200;
}

.sh-group { border-top: 1px solid var(--iron-300); }
.sh-group:first-of-type { border-top: 0; margin-top: 14px; }
.sh-group-head {
  padding: 10px 16px;
  background: var(--iron-100);
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--paper-200);
  border-bottom: 1px dashed var(--iron-300);
  display: flex; justify-content: space-between;
}
.sh-group-head.protein { color: var(--iron-red); }
@media (min-width: 768px) { .sh-group-head { padding: 10px 28px; } }

.sh-row {
  display: grid; grid-template-columns: 24px 110px 1fr;
  gap: 12px; padding: 12px 16px;
  border-bottom: 1px dashed var(--iron-300);
  align-items: start;
  cursor: pointer;
}
.sh-row:hover { background: rgba(242,239,230,0.02); }
@media (min-width: 768px) { .sh-row { padding: 12px 28px; grid-template-columns: 24px 130px 1fr; } }
.sh-row .box {
  width: 18px; height: 18px;
  border: 1.5px solid var(--paper-000);
  margin-top: 3px; position: relative;
  flex: 0 0 18px;
}
.sh-row.checked .box { background: var(--paper-000); }
.sh-row.checked .box::after {
  content: ""; position: absolute; inset: 3px;
  background:
    linear-gradient(45deg, transparent 0 45%, var(--iron-000) 45% 55%, transparent 55%),
    linear-gradient(-45deg, transparent 0 45%, var(--iron-000) 45% 55%, transparent 55%);
}
.sh-row .qty {
  font-family: var(--display); font-weight: 800;
  font-size: 17px; color: var(--paper-000);
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
}
.sh-row.protein .qty { color: var(--iron-red); }
.sh-row .item {
  font-family: var(--body); font-weight: 600;
  font-size: 15px; color: var(--paper-000);
  line-height: 1.25;
}
.sh-row.checked .item { color: var(--iron-500); text-decoration: line-through; }
.sh-row .sources {
  font-family: var(--mono); font-size: 9.5px;
  letter-spacing: 0.08em;
  color: var(--iron-500); margin-top: 3px;
}

.sh-empty {
  padding: 56px 24px; text-align: center;
  border: 1px dashed var(--iron-400);
  margin: 24px 16px;
}
.sh-empty .ttl {
  font-family: var(--display); font-weight: 900;
  font-size: 24px; text-transform: uppercase;
  margin-bottom: 8px; color: var(--paper-000);
}
.sh-empty .sub {
  font-family: var(--mono); font-size: 11px;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--iron-500); margin-bottom: 16px;
}
`;

function ensureStyles() {
  if (document.getElementById('shopping-css')) return;
  const tag = document.createElement('style');
  tag.id = 'shopping-css';
  tag.textContent = css;
  document.head.appendChild(tag);
}

/* ============================================================
   DATE / RANGE HELPERS
   ============================================================ */

function ymd(d) { return d.toISOString().slice(0, 10); }
function addDays(d, n) { const o = new Date(d.getTime()); o.setDate(o.getDate() + n); return o; }

function rangeDays(rangeId) {
  const today = new Date();
  if (rangeId === '3') return Array.from({ length: 3 }, (_, i) => ymd(addDays(today, i)));
  if (rangeId === '7') return Array.from({ length: 7 }, (_, i) => ymd(addDays(today, i)));
  if (rangeId === 'week') {
    // Monday of this week through Sunday
    const day = today.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    const monday = addDays(today, offset);
    return Array.from({ length: 7 }, (_, i) => ymd(addDays(monday, i)));
  }
  if (rangeId === 'all') return listPlannedDayKeys().sort();
  // default
  return Array.from({ length: 7 }, (_, i) => ymd(addDays(today, i)));
}

const RANGE_OPTIONS = [
  { id: '3',    label: 'Next 3 days' },
  { id: '7',    label: 'Next 7 days' },
  { id: 'week', label: 'This week' },
  { id: 'all',  label: 'All planned' },
];

/* ============================================================
   AGGREGATION
   ============================================================ */

const CAT_ORDER = ['protein', 'produce', 'pantry', 'dairy', 'frozen', 'spice', 'other'];
const CATS = CAT_ORDER;

const WEIGHT_UNITS = new Set(['g', 'kg']);
const VOL_UNITS    = new Set(['ml', 'l']);
const SPOON_UNITS  = new Set(['tsp', 'tbsp']);

function fmtNum(n) {
  if (Math.abs(n - Math.round(n)) < 0.005) return String(Math.round(n));
  return n.toFixed(2).replace(/\.?0+$/, '');
}

function aggregate(items) {
  // Group by (category, item-lowercased-trimmed)
  const groups = new Map();
  for (const it of items) {
    const key = `${it.category || 'other'}|${(it.item || '').toLowerCase().trim()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(it);
  }

  const out = [];
  for (const [key, grp] of groups) {
    const parts = [];
    const weights = grp.filter(i => WEIGHT_UNITS.has(i.unit));
    const vols    = grp.filter(i => VOL_UNITS.has(i.unit));
    const spoons  = grp.filter(i => SPOON_UNITS.has(i.unit));
    const others  = grp.filter(i => !WEIGHT_UNITS.has(i.unit) && !VOL_UNITS.has(i.unit) && !SPOON_UNITS.has(i.unit));

    if (weights.length) {
      const totalG = weights.reduce((s, i) => s + (i.unit === 'kg' ? i.qty * 1000 : i.qty), 0);
      parts.push(totalG >= 1000 ? `${fmtNum(totalG / 1000)} kg` : `${Math.round(totalG)} g`);
    }
    if (vols.length) {
      const totalMl = vols.reduce((s, i) => s + (i.unit === 'l' ? i.qty * 1000 : i.qty), 0);
      parts.push(totalMl >= 1000 ? `${fmtNum(totalMl / 1000)} l` : `${Math.round(totalMl)} ml`);
    }
    if (spoons.length) {
      const totalTsp = spoons.reduce((s, i) => s + (i.unit === 'tbsp' ? i.qty * 3 : i.qty), 0);
      if (totalTsp >= 3) {
        const tbsp = Math.floor(totalTsp / 3);
        const remTsp = totalTsp - tbsp * 3;
        parts.push(remTsp > 0 ? `${tbsp} tbsp + ${fmtNum(remTsp)} tsp` : `${tbsp} tbsp`);
      } else {
        parts.push(`${fmtNum(totalTsp)} tsp`);
      }
    }
    // Other units → bucket by unit
    const byUnit = new Map();
    for (const i of others) byUnit.set(i.unit, (byUnit.get(i.unit) || 0) + (i.qty || 0));
    for (const [unit, qty] of byUnit) {
      if (unit === 'to-taste') parts.push('to taste');
      else if (unit === 'pinch') parts.push('pinch');
      else if (unit === 'piece') parts.push(`${fmtNum(qty)} pc`);
      else parts.push(`${fmtNum(qty)} ${unit}`);
    }

    out.push({
      key,
      category: grp[0].category || 'other',
      item: grp[0].item,
      display: parts.join(' + ') || '—',
      sources: [...new Set(grp.map(i => i.recipeTitle).filter(Boolean))],
    });
  }
  return out;
}

/* ============================================================
   RECIPE LOAD
   ============================================================ */

async function loadRecipe(id) {
  const user = getUserRecipe(id);
  if (user) return applyRecipeState(user);
  const cached = storage.get(`recipe:${id}`, null);
  if (cached) return applyRecipeState(cached);
  try {
    const res = await fetch(`/data/recipes/${id}.json`);
    if (!res.ok) throw new Error('not found');
    const data = await res.json();
    storage.set(`recipe:${id}`, data);
    return applyRecipeState(data);
  } catch (e) { return null; }
}

/* ============================================================
   CHECKED STATE — persisted per range
   ============================================================ */
const checkedKey = (rangeId) => `shopping:checked:${rangeId}`;
const getChecked = (rangeId) => new Set(storage.get(checkedKey(rangeId), []) || []);
const setChecked = (rangeId, set) => storage.set(checkedKey(rangeId), [...set]);

/* Manual items — persisted, shared across ranges (your pantry list) */
const MANUAL_KEY = 'shopping:manual';
const getManual = () => storage.get(MANUAL_KEY, []) || [];
const setManual = (list) => storage.set(MANUAL_KEY, list);
function addManual(item, qtyText, category) {
  const list = getManual();
  list.push({ item: item.trim(), qtyText: qtyText.trim(), category: category || 'other', addedAt: Date.now() });
  setManual(list);
}
function removeManual(idx) {
  const list = getManual();
  list.splice(idx, 1);
  setManual(list);
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ============================================================
   MAIN RENDER
   ============================================================ */

export async function render({ mount, rest, params }) {
  ensureStyles();

  const rangeId = params.r || '7';
  const dayKeys = rangeDays(rangeId);

  // Collect entries
  const allEntries = [];
  for (const k of dayKeys) {
    for (const e of getDayPlan(k)) allEntries.push({ ...e, day: k });
  }

  if (!allEntries.length) {
    mount.innerHTML = `
      <div class="sh-root">
        <div class="sh-head">
          <div>
            <div class="ttl">Shop</div>
            <div class="sub">Auto-generated from your plan</div>
          </div>
        </div>
        <div class="sh-range">${rangeButtonsHtml(rangeId)}</div>
        <div class="sh-empty">
          <div class="ttl">Nothing in range</div>
          <div class="sub">Plan some meals first — open a recipe and tap “Add to Plan”</div>
          <a href="#/plan" class="btn outline sm" style="text-decoration:none;">→ Plan</a>
        </div>
      </div>`;
    wireRangeButtons(mount);
    return;
  }

  // Load referenced recipes
  const idSet = new Set(allEntries.map(e => e.recipeId));
  const recipesById = {};
  await Promise.all([...idSet].map(async id => {
    const r = await loadRecipe(id);
    if (r) recipesById[id] = r;
  }));

  // Expand each entry into ingredient items, scaled by servings (entry.servings / recipe.servings)
  const items = [];
  let plannedCount = 0;
  let cookedCount = 0;
  for (const e of allEntries) {
    const r = recipesById[e.recipeId];
    if (!r) continue;
    plannedCount++;
    if (e.cooked) { cookedCount++; continue; }  // already cooked → ingredients already used
    const baseServ = r.servings || 1;
    const useServ = e.servings || baseServ;
    const scale = useServ / baseServ;
    for (const ing of (r.ingredients || [])) {
      if (ing.optional) continue;  // skip optional items by default
      items.push({
        item: ing.item,
        unit: ing.unit,
        qty: (ing.qty || 0) * scale,
        category: ing.category || 'other',
        recipeTitle: r.title || r.id,
      });
    }
  }

  const aggregated = aggregate(items);

  // Manual items — append with a synthetic key under each category
  const manual = getManual();
  const manualAggregated = manual.map((m, i) => ({
    key: `manual:${i}`,
    category: m.category || 'other',
    item: m.item,
    display: m.qtyText || '—',
    sources: ['manual'],
    manual: true,
    manualIdx: i,
  }));

  const allAggregated = [...aggregated, ...manualAggregated];

  // Group by category
  const byCat = new Map();
  for (const a of allAggregated) {
    if (!byCat.has(a.category)) byCat.set(a.category, []);
    byCat.get(a.category).push(a);
  }
  const cats = CAT_ORDER.filter(c => byCat.has(c));

  // Persisted checked state
  const checked = getChecked(rangeId);

  // Stats
  const totalItems = allAggregated.length;
  const doneItems = allAggregated.filter(a => checked.has(a.key)).length;

  mount.innerHTML = `
    <div class="sh-root">
      <div class="sh-head">
        <div>
          <div class="ttl">Shop</div>
          <div class="sub">Auto-generated from ${plannedCount} planned meal${plannedCount === 1 ? '' : 's'}</div>
        </div>
      </div>
      <div class="sh-range">${rangeButtonsHtml(rangeId)}</div>
      <div class="sh-add-manual">
        <input type="text" class="manual-item" placeholder="extra item (olive oil, coffee, ...)" />
        <input type="text" class="manual-qty" placeholder="qty" />
        <select class="manual-cat">${CATS.map(c => `<option value="${c}"${c === 'pantry' ? ' selected' : ''}>${c}</option>`).join('')}</select>
        <button type="button" class="add-btn" data-action="add-manual">+ Add</button>
      </div>
      <div class="sh-actions">
        <div class="sh-stats">
          <span class="strong">${doneItems}</span>/<span class="strong">${totalItems}</span> items
          ${cookedCount ? ` · <span class="red strong">${cookedCount}</span> cooked (skipped)` : ''}
        </div>
        <div class="sh-actions-right">
          <button type="button" class="sh-action-btn" data-action="copy" title="Copy as text">⌘ Copy</button>
          <button type="button" class="sh-action-btn" data-action="print" title="Print list">⎙ Print</button>
          <button type="button" class="sh-action-btn" data-action="reset">↻ Reset</button>
        </div>
      </div>
      ${cats.map(cat => `
        <div class="sh-group">
          <div class="sh-group-head${cat === 'protein' ? ' protein' : ''}">
            <span>${escapeHtml(cat)}</span><span>${byCat.get(cat).length} item${byCat.get(cat).length === 1 ? '' : 's'}</span>
          </div>
          ${byCat.get(cat).map(a => `
            <div class="sh-row${cat === 'protein' ? ' protein' : ''}${checked.has(a.key) ? ' checked' : ''}${a.manual ? ' manual' : ''}" data-key="${escapeHtml(a.key)}"${a.manual ? ` data-manual-idx="${a.manualIdx}"` : ''}>
              <div class="box"></div>
              <div class="qty">${escapeHtml(a.display)}</div>
              <div style="display:flex; justify-content: space-between; align-items: start; gap: 8px;">
                <div style="flex:1; min-width: 0;">
                  <div class="item">${escapeHtml(a.item)}</div>
                  ${a.sources.length ? `<div class="sources">${a.manual ? 'Manual' : 'From: ' + a.sources.map(escapeHtml).join(' · ')}</div>` : ''}
                </div>
                ${a.manual ? '<button type="button" class="rm-manual" data-action="rm-manual" title="Remove">×</button>' : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;

  wireRangeButtons(mount);
  wireRows(mount, rangeId, checked, allAggregated, doneItems, totalItems);
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'sh-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function buildPlaintext(mount) {
  const lines = [];
  const title = mount.querySelector('.sh-head .ttl')?.textContent || 'Shopping';
  const sub   = mount.querySelector('.sh-head .sub')?.textContent || '';
  lines.push(title.toUpperCase());
  if (sub) lines.push(sub);
  lines.push('');
  mount.querySelectorAll('.sh-group').forEach(g => {
    const cat = g.querySelector('.sh-group-head span:first-child')?.textContent || '';
    lines.push(cat.toUpperCase());
    g.querySelectorAll('.sh-row').forEach(r => {
      const checked = r.classList.contains('checked') ? '[x]' : '[ ]';
      const qty = r.querySelector('.qty')?.textContent || '';
      const item = r.querySelector('.item')?.textContent || '';
      lines.push(`  ${checked} ${qty}  ${item}`);
    });
    lines.push('');
  });
  return lines.join('\n');
}

function rangeButtonsHtml(active) {
  return RANGE_OPTIONS.map(o =>
    `<button type="button" class="sh-range-btn${o.id === active ? ' active' : ''}" data-range="${o.id}">${o.label}</button>`
  ).join('');
}

function wireRangeButtons(mount) {
  mount.querySelector('.sh-range')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-range]');
    if (!btn) return;
    const r = btn.dataset.range;
    location.hash = r === '7' ? '#/shop' : `#/shop?r=${r}`;
  });
}

function wireRows(mount, rangeId, checked, aggregated, doneItems, totalItems) {
  const root = mount.querySelector('.sh-root');
  if (!root) return;

  root.addEventListener('click', async e => {
    // Reset
    if (e.target.closest('[data-action="reset"]')) {
      setChecked(rangeId, new Set());
      root.querySelectorAll('.sh-row.checked').forEach(r => r.classList.remove('checked'));
      const stats = root.querySelector('.sh-stats .strong');
      if (stats) stats.textContent = '0';
      return;
    }
    // Copy as text
    if (e.target.closest('[data-action="copy"]')) {
      try {
        await navigator.clipboard.writeText(buildPlaintext(mount));
        showToast('Copied to clipboard');
      } catch (_) { showToast('Copy failed — try Print'); }
      return;
    }
    // Print
    if (e.target.closest('[data-action="print"]')) {
      window.print();
      return;
    }
    // Add manual
    if (e.target.closest('[data-action="add-manual"]')) {
      const itemInp = root.querySelector('.manual-item');
      const qtyInp  = root.querySelector('.manual-qty');
      const catSel  = root.querySelector('.manual-cat');
      const item = itemInp?.value.trim();
      if (!item) { itemInp?.focus(); return; }
      addManual(item, qtyInp?.value || '', catSel?.value || 'pantry');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      return;
    }
    // Remove manual
    if (e.target.closest('[data-action="rm-manual"]')) {
      e.stopPropagation();
      const row = e.target.closest('.sh-row.manual');
      const idx = Number(row?.dataset.manualIdx);
      if (!isNaN(idx)) {
        removeManual(idx);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
      return;
    }
    // Toggle row
    const row = e.target.closest('.sh-row');
    if (row) {
      const k = row.dataset.key;
      if (checked.has(k)) checked.delete(k); else checked.add(k);
      row.classList.toggle('checked');
      setChecked(rangeId, checked);
      const newDone = root.querySelectorAll('.sh-row.checked').length;
      const stats = root.querySelector('.sh-stats .strong');
      if (stats) stats.textContent = newDone;
    }
  });

  // Enter inside manual-item or manual-qty triggers Add
  root.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (!e.target.closest('.sh-add-manual')) return;
    e.preventDefault();
    root.querySelector('[data-action="add-manual"]')?.click();
  });
}
