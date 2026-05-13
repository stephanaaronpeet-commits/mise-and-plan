/* =============================================================
   recipe-detail.js — single-recipe detail view (§02 of spec).
   Persisted: favorite toggle (via storage.toggleFavorite).
   Session-only: servings scaler, active subs, ingredient checkboxes
   (reset on view close — spec design intent).
   ============================================================= */

import { toggleFavorite } from '../core/storage.js';

/* ============================================================
   STYLES (scoped to .recipe-detail, injected once)
   ============================================================ */
const css = `
.recipe-detail { max-width: 1200px; margin: 0 auto; padding-bottom: 80px; }
.recipe-detail .back-link {
  display: inline-block;
  padding: 14px 16px 0;
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--iron-500); text-decoration: none;
  cursor: pointer;
}
.recipe-detail .back-link:hover { color: var(--paper-000); }
@media (min-width: 768px) { .recipe-detail .back-link { padding: 18px 28px 0; } }

/* ───── Hero photo ───── */
.recipe-detail .hero-photo {
  height: 220px;
  background-color: #1a1410;
  background-image:
    repeating-linear-gradient(45deg, rgba(194,51,30,0.1) 0 8px, transparent 8px 18px),
    repeating-linear-gradient(135deg, rgba(242,239,230,0.05) 0 12px, transparent 12px 24px);
  border-top: 1px solid var(--iron-300);
  border-bottom: 1px solid var(--iron-300);
  margin: 14px 0 16px;
  position: relative;
  display: flex; align-items: center; justify-content: center;
}
@media (min-width: 768px) { .recipe-detail .hero-photo { height: 280px; margin: 14px 0 20px; } }
.recipe-detail .hero-photo.cuisine-korean {
  background-color: #161116;
  background-image: repeating-linear-gradient(135deg, rgba(242,239,230,0.05) 0 12px, transparent 12px 24px);
}
.recipe-detail .hero-photo.cuisine-bowl {
  background-color: #14171a;
  background-image:
    radial-gradient(circle at 50% 60%, rgba(242,239,230,0.08) 0 18%, transparent 19%),
    repeating-linear-gradient(135deg, rgba(242,239,230,0.05) 0 12px, transparent 12px 24px);
}
.recipe-detail .hero-photo .ph-label {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-500); padding: 6px 10px;
  border: 1px dashed var(--iron-400);
}
.recipe-detail .hero-photo .utility {
  position: absolute; top: 12px; right: 12px;
  display: flex; gap: 6px;
}
.recipe-detail .util-btn {
  width: 32px; height: 32px;
  border: 1px solid var(--paper-000);
  background: rgba(11,11,12,0.7);
  color: var(--paper-000);
  font-family: var(--display); font-weight: 800;
  font-size: 16px; line-height: 1;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background 100ms linear, color 100ms linear;
}
.recipe-detail .util-btn:hover { background: rgba(11,11,12,0.95); }
.recipe-detail .util-btn.star.on { background: var(--paper-000); color: var(--iron-000); }

/* ───── Head: tag row + title + sub + (desktop) aside ───── */
.recipe-detail .detail-head {
  padding: 0 16px;
}
@media (min-width: 768px) {
  .recipe-detail .detail-head {
    display: grid; grid-template-columns: 1.4fr 1fr;
    gap: 32px; align-items: end; padding: 0 28px;
  }
}
.recipe-detail .tag-row {
  display: flex; gap: 6px; flex-wrap: wrap;
  margin-bottom: 12px;
}
.recipe-detail .tag {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  padding: 4px 8px;
  border: 1px solid var(--paper-100);
  color: var(--paper-100);
}
.recipe-detail .tag.filled {
  background: var(--iron-red); border-color: var(--iron-red);
  color: var(--paper-000);
}
.recipe-detail h1.detail-title {
  font-family: var(--display); font-weight: 900;
  font-size: 44px; line-height: 0.9;
  text-transform: uppercase; color: var(--paper-000);
  letter-spacing: -0.01em; margin: 0 0 6px;
}
@media (min-width: 768px) { .recipe-detail h1.detail-title { font-size: 64px; } }
.recipe-detail .detail-sub {
  font-family: var(--mono); font-size: 10.5px;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--iron-500); margin-bottom: 18px;
}
@media (min-width: 768px) { .recipe-detail .detail-sub { font-size: 11px; margin-bottom: 0; } }
.recipe-detail .head-side {
  display: none;  /* mobile: hidden, the .servings-bar carries the scaler */
}
@media (min-width: 768px) {
  .recipe-detail .head-side { display: block; }
  .recipe-detail .servings-bar { display: none; }  /* desktop: scaler is in head-side */
}
.recipe-detail .head-side-label {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--iron-500); margin-bottom: 8px;
}
.recipe-detail .head-side-cookmeta {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-500); margin-top: 14px;
}
.recipe-detail .head-side-cookmeta .strong {
  color: var(--paper-000); font-family: var(--display); font-weight: 800; font-size: 18px;
}

/* ───── Macro big (5 cells) ───── */
.recipe-detail .macro-big {
  display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr;
  border-top: 1px solid var(--iron-300);
  border-bottom: 1px solid var(--iron-300);
  margin: 18px 0 0;
}
@media (min-width: 768px) { .recipe-detail .macro-big { margin: 24px 0 0; } }
.recipe-detail .macro-big > div {
  padding: 18px 14px 16px;
  border-right: 1px solid var(--iron-300);
  font-family: var(--mono); font-size: 9.5px;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--iron-500); line-height: 1;
}
.recipe-detail .macro-big > div:last-child { border-right: none; }
.recipe-detail .macro-big .v {
  display: block; font-family: var(--display); font-weight: 800;
  font-size: 34px; color: var(--paper-000);
  margin-top: 6px; font-variant-numeric: tabular-nums;
  line-height: 1; letter-spacing: -0.01em;
}
.recipe-detail .macro-big .v .u {
  font-family: var(--mono); font-size: 10px;
  color: var(--iron-500); font-weight: 400;
  margin-left: 2px; letter-spacing: 0.05em;
}
.recipe-detail .macro-big .protein { background: var(--iron-000); }
.recipe-detail .macro-big .protein .l { color: var(--iron-red); font-weight: 700; }
.recipe-detail .macro-big .protein .v { color: var(--iron-red); font-size: 48px; font-weight: 900; }
.recipe-detail .macro-big .protein .v .u { color: var(--iron-red-deep); }
@media (min-width: 768px) {
  .recipe-detail .macro-big .protein .v { font-size: 56px; }
  .recipe-detail .macro-big .v { font-size: 40px; }
}

/* ───── Servings bar (mobile-only — desktop uses head-side) ───── */
.recipe-detail .servings-bar {
  padding: 16px;
  border-bottom: 1px solid var(--iron-300);
  display: flex; align-items: center; justify-content: space-between;
}
.recipe-detail .servings-bar .l {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--iron-500);
}

/* Scaler — shared by mobile bar + desktop aside */
.recipe-detail .scaler {
  display: inline-flex; align-items: center; gap: 6px;
}
.recipe-detail .scaler .pm {
  width: 32px; height: 32px;
  border: 1px solid var(--paper-000);
  color: var(--paper-000); background: transparent;
  font-family: var(--display); font-weight: 800;
  font-size: 18px; line-height: 1;
  cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  user-select: none;
  transition: background 100ms linear, color 100ms linear;
}
.recipe-detail .scaler .pm:hover { background: var(--paper-000); color: var(--iron-000); }
.recipe-detail .scaler .pm[disabled] {
  opacity: 0.3; cursor: not-allowed;
}
.recipe-detail .scaler .pm[disabled]:hover { background: transparent; color: var(--paper-000); }
.recipe-detail .scaler .n {
  font-family: var(--display); font-weight: 900;
  font-size: 26px; color: var(--paper-000);
  min-width: 32px; text-align: center;
  font-variant-numeric: tabular-nums; line-height: 1;
}
.recipe-detail .scaler .lbl {
  font-family: var(--mono); font-size: 9.5px;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--iron-500); margin-left: 4px;
}

/* ───── Block head (Ingredients / Substitutions / Method / Notes / Serves with) ───── */
.recipe-detail .block-head {
  padding: 22px 16px 10px;
  display: flex; align-items: baseline; justify-content: space-between;
}
@media (min-width: 768px) { .recipe-detail .block-head { padding: 28px 28px 12px; } }
.recipe-detail .block-head .name {
  font-family: var(--display); font-weight: 900;
  font-size: 26px; text-transform: uppercase;
  letter-spacing: -0.005em; color: var(--paper-000); line-height: 1;
}
@media (min-width: 768px) { .recipe-detail .block-head .name { font-size: 32px; } }
.recipe-detail .block-head .info {
  font-family: var(--mono); font-size: 10px;
  color: var(--iron-500); letter-spacing: 0.18em;
  text-transform: uppercase;
}

/* ───── Ingredient groups + rows ───── */
.recipe-detail .ing-group { border-top: 1px solid var(--iron-300); }
.recipe-detail .ing-group-head {
  padding: 8px 16px;
  background: var(--iron-100);
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--paper-200);
  border-bottom: 1px dashed var(--iron-300);
  display: flex; justify-content: space-between;
}
.recipe-detail .ing-group-head.protein { color: var(--iron-red); }
@media (min-width: 768px) { .recipe-detail .ing-group-head { padding: 8px 28px; } }
.recipe-detail .ing-row {
  padding: 12px 16px;
  border-bottom: 1px dashed var(--iron-300);
  display: grid; grid-template-columns: 22px 80px 1fr; gap: 10px;
  align-items: start;
  cursor: pointer;
  transition: background 100ms linear;
}
.recipe-detail .ing-row:hover { background: rgba(242,239,230,0.02); }
@media (min-width: 768px) { .recipe-detail .ing-row { padding: 12px 28px; grid-template-columns: 22px 100px 1fr; } }
.recipe-detail .ing-row .box {
  width: 18px; height: 18px;
  border: 1.5px solid var(--paper-000);
  margin-top: 2px; position: relative;
  flex: 0 0 18px;
}
.recipe-detail .ing-row.checked .box { background: var(--paper-000); }
.recipe-detail .ing-row.checked .box::after {
  content: ""; position: absolute; inset: 3px;
  background:
    linear-gradient(45deg, transparent 0 45%, var(--iron-000) 45% 55%, transparent 55%),
    linear-gradient(-45deg, transparent 0 45%, var(--iron-000) 45% 55%, transparent 55%);
}
.recipe-detail .ing-row .qty {
  font-family: var(--display); font-weight: 800;
  font-size: 18px; color: var(--paper-000); line-height: 1.05;
  font-variant-numeric: tabular-nums;
}
.recipe-detail .ing-row .qty .u {
  font-family: var(--mono); font-size: 10px;
  color: var(--iron-500); font-weight: 400;
  letter-spacing: 0.1em; margin-left: 2px;
}
.recipe-detail .ing-row.protein .qty { color: var(--iron-red); }
.recipe-detail .ing-row.protein .qty .u { color: var(--iron-red-deep); }
.recipe-detail .ing-row .item {
  font-family: var(--body); font-weight: 600;
  font-size: 15px; color: var(--paper-000); line-height: 1.2;
}
.recipe-detail .ing-row .item .swap-flag {
  display: inline-block;
  font-family: var(--mono); font-size: 9px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-red); margin-left: 6px;
}
.recipe-detail .ing-row .prep {
  font-family: var(--mono); font-size: 10px;
  color: var(--iron-500); margin-top: 2px;
  letter-spacing: 0.05em; text-transform: uppercase;
}
.recipe-detail .ing-row .tip {
  font-family: var(--body); font-size: 12px;
  color: var(--paper-200); margin-top: 4px;
  line-height: 1.4;
  border-left: 2px solid var(--paper-200);
  padding-left: 8px; font-style: italic;
}
.recipe-detail .ing-row .tip.warn {
  color: var(--safety); border-color: var(--safety);
}
.recipe-detail .ing-row.checked .item {
  color: var(--iron-500); text-decoration: line-through;
}

/* ───── Substitution cards ───── */
.recipe-detail .sub-card {
  margin: 12px 16px;
  border: 1px solid var(--iron-300);
  padding: 14px 16px;
  background: var(--iron-100);
  display: grid; grid-template-columns: 1fr auto; gap: 12px;
  align-items: start;
  cursor: pointer;
  transition: border-color 100ms linear;
}
@media (min-width: 768px) { .recipe-detail .sub-card { margin: 12px 28px; } }
.recipe-detail .sub-card.on { border-color: var(--paper-000); }
.recipe-detail .sub-card .swap {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--iron-500); margin-bottom: 6px;
}
.recipe-detail .sub-card .swap .out { text-decoration: line-through; color: var(--iron-500); }
.recipe-detail .sub-card .swap .in  { color: var(--paper-000); font-weight: 700; }
.recipe-detail .sub-card .swap .arrow { color: var(--iron-red); margin: 0 4px; }
.recipe-detail .sub-card .deltas {
  display: flex; gap: 10px; flex-wrap: wrap;
}
.recipe-detail .sub-card .delta {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.1em; text-transform: uppercase;
  font-weight: 700;
}
.recipe-detail .sub-card .delta.up      { color: var(--iron-red); }
.recipe-detail .sub-card .delta.down    { color: var(--plate-green); }
.recipe-detail .sub-card .delta.neutral { color: var(--paper-200); }
.recipe-detail .sub-card .note {
  font-family: var(--body); font-size: 12px;
  color: var(--iron-500); margin-top: 8px; line-height: 1.4;
}
.recipe-detail .toggle {
  width: 40px; height: 20px;
  border: 1px solid var(--paper-000);
  position: relative; cursor: pointer;
  flex: 0 0 40px;
}
.recipe-detail .toggle .knob {
  position: absolute; top: 1px; left: 1px;
  width: 16px; height: 16px;
  background: var(--paper-000);
}
.recipe-detail .toggle.on { border-color: var(--iron-red); }
.recipe-detail .toggle.on .knob { left: auto; right: 1px; background: var(--iron-red); }

/* ───── Steps ───── */
.recipe-detail .step-row {
  padding: 16px;
  border-bottom: 1px dashed var(--iron-300);
  display: grid; grid-template-columns: 56px 1fr; gap: 14px;
  align-items: start;
}
@media (min-width: 768px) { .recipe-detail .step-row { padding: 18px 28px; grid-template-columns: 70px 1fr; gap: 18px; } }
.recipe-detail .step-row .num {
  font-family: var(--display); font-weight: 900;
  font-size: 48px; line-height: 0.85;
  color: var(--iron-red);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
@media (min-width: 768px) { .recipe-detail .step-row .num { font-size: 64px; } }
.recipe-detail .step-row .text {
  font-family: var(--body); font-size: 16px;
  line-height: 1.4; color: var(--paper-000);
}
@media (min-width: 768px) { .recipe-detail .step-row .text { font-size: 17px; } }
.recipe-detail .timer-tag {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 8px; padding: 4px 8px;
  border: 1px solid var(--iron-red);
  background: rgba(194,51,30,0.1);
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-red); font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.recipe-detail .timer-tag::before {
  content: ""; width: 8px; height: 8px;
  border: 1.5px solid var(--iron-red);
  border-radius: 50%; display: inline-block;
}

/* ───── Notes ───── */
.recipe-detail .notes-block {
  padding: 14px 16px 16px;
  border-bottom: 1px solid var(--iron-300);
}
@media (min-width: 768px) { .recipe-detail .notes-block { padding: 14px 28px 20px; } }
.recipe-detail .notes-block .body {
  font-family: var(--body); font-size: 14px;
  line-height: 1.55; color: var(--paper-100);
  border-left: 2px solid var(--iron-red);
  padding-left: 12px;
  font-style: italic;
}

/* ───── Serves with ───── */
.recipe-detail .serves-with { padding: 0 16px 18px; }
@media (min-width: 768px) { .recipe-detail .serves-with { padding: 0 28px 24px; } }
.recipe-detail .serves-with .mini-row {
  display: grid; gap: 8px;
  grid-template-columns: 1fr 1fr;
}
@media (min-width: 768px) {
  .recipe-detail .serves-with .mini-row { grid-template-columns: repeat(3, 1fr); gap: 12px; }
}
.recipe-detail .mini-card {
  background: var(--iron-100);
  border: 1px solid var(--iron-300);
  padding: 10px 12px;
}
.recipe-detail .mini-card .name {
  font-family: var(--display); font-weight: 700;
  font-size: 14px; text-transform: uppercase;
  color: var(--paper-000); line-height: 1.15;
}
.recipe-detail .mini-card .meta {
  font-family: var(--mono); font-size: 9px;
  color: var(--iron-red); letter-spacing: 0.1em;
  margin-top: 4px; text-transform: uppercase;
}

/* ───── Sticky action bar ───── */
.recipe-detail .sticky-bar {
  position: sticky; bottom: 0;
  border-top: 2px solid var(--iron-red);
  background: var(--iron-000);
  padding: 12px 16px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  z-index: 10;
}
@media (min-width: 768px) {
  .recipe-detail .sticky-bar {
    padding: 14px 28px;
    grid-template-columns: auto 1fr 1fr; gap: 14px;
  }
}
.recipe-detail .sticky-bar .meta {
  font-family: var(--mono); font-size: 10px;
  color: var(--iron-500); letter-spacing: 0.18em;
  text-transform: uppercase;
  display: none; align-self: center;
}
@media (min-width: 768px) { .recipe-detail .sticky-bar .meta { display: block; } }
.recipe-detail .sticky-bar .meta strong {
  color: var(--paper-000); font-family: var(--display);
  font-weight: 800; font-size: 18px;
}
.recipe-detail .sticky-bar .btn {
  width: 100%; justify-content: center;
  padding: 14px; font-size: 12px;
}

/* ───── Not-found state ───── */
.recipe-detail .not-found {
  padding: 64px 24px; text-align: center;
  border: 1px dashed var(--iron-400); margin: 32px 16px;
}
`;

function ensureStyles() {
  if (document.getElementById('recipe-detail-css')) return;
  const tag = document.createElement('style');
  tag.id = 'recipe-detail-css';
  tag.textContent = css;
  document.head.appendChild(tag);
}

/* ============================================================
   HELPERS
   ============================================================ */

const CAT_ORDER = ['protein', 'produce', 'pantry', 'dairy', 'frozen', 'spice', 'other'];

// Macro direction map: +1 = "more is better", -1 = "less is better", 0 = neutral.
// Used to colour deltas in substitution cards.
const MACRO_GOOD_DIR = {
  kcal:     -1,
  protein_g:+1,
  fat_g:    -1,
  fiber_g:  +1,
  carbs_g:   0,
};

const MACRO_SHORT = { kcal: 'KCAL', protein_g: 'G PROTEIN', carbs_g: 'G CARB', fat_g: 'G FAT', fiber_g: 'G FIBER' };

function deltaClass(key, value) {
  if (value === 0) return 'neutral';
  const dir = MACRO_GOOD_DIR[key];
  if (!dir) return 'neutral';
  return (Math.sign(value) === dir) ? 'down' : 'up';
}

function deltaText(key, value) {
  if (value === 0) return `±0 ${MACRO_SHORT[key] || key.toUpperCase()}`;
  const sign = value > 0 ? '+' : '−';
  return `${sign}${Math.abs(value)} ${MACRO_SHORT[key] || key.toUpperCase()}`;
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(then.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - then.getTime()) / 86400000));
}

function cuisineClass(r) {
  if (r.cuisine === 'thai')   return 'cuisine-thai';
  if (r.cuisine === 'korean') return 'cuisine-korean';
  return 'cuisine-bowl';
}

function scaledQty(qty, scale) {
  if (qty == null || isNaN(qty)) return '—';
  const v = qty * scale;
  // Whole number when close to one
  if (Math.abs(v - Math.round(v)) < 0.05) return String(Math.round(v));
  // 1 decimal otherwise
  return v.toFixed(1).replace(/\.0$/, '');
}

function unitDisplay(u) {
  if (u === 'piece') return 'pc';
  if (u === 'to-taste') return '';
  if (u === 'pinch') return '';
  return u;
}

function formatTime(min) {
  if (!min || min < 60) return `${min}:00`;
  const h = Math.floor(min / 60);
  const m = min - h * 60;
  return `${h}:${String(m).padStart(2, '0')}:00`;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function isOilCapTip(ing) {
  const t = (ing.note || ing.thai_market_tip || '').toLowerCase();
  return t.includes('oil cap');
}

/* ============================================================
   COMPUTE — derive effective ingredients + macros from state
   ============================================================ */

function compute(recipe, state) {
  const baseServings = recipe.servings || 1;
  const scale = state.servings / baseServings;

  // Macros: per-serving stays per-serving. Add macro_delta from active subs.
  const baseMacros = recipe.macros_per_serving || {};
  const macros = { ...baseMacros };
  (state.activeSubs || []).forEach(idx => {
    const sub = recipe.substitutions?.[idx];
    const delta = sub?.macro_delta || {};
    for (const k of Object.keys(delta)) {
      macros[k] = (macros[k] || 0) + delta[k];
    }
  });

  // Ingredients: scale qty + swap labels for active subs.
  const subsByOut = {};
  (state.activeSubs || []).forEach(idx => {
    const sub = recipe.substitutions?.[idx];
    if (sub?.swap_out) subsByOut[sub.swap_out] = sub.swap_in;
  });
  const ingredients = (recipe.ingredients || []).map((ing, i) => {
    const swap = subsByOut[ing.item];
    return {
      ...ing,
      _idx: i,
      displayItem: swap || ing.item,
      swapped: !!swap,
      displayQty: scaledQty(ing.qty, scale),
    };
  });

  return { macros, ingredients, scale };
}

/* ============================================================
   HTML BUILDERS
   ============================================================ */

function tagRowHtml(recipe) {
  const tags = (recipe.tags || []).slice(0, 4);
  if (!tags.length) return '';
  return `
    <div class="tag-row">
      ${tags.map((t, i) =>
        `<span class="tag${i === 0 ? ' filled' : ''}">${escapeHtml(t)}</span>`
      ).join('')}
    </div>
  `;
}

function detailSubHtml(recipe) {
  const parts = [];
  const p = recipe.time?.prep_min, c = recipe.time?.cook_min;
  if (p != null) parts.push(`${p} MIN PREP`);
  if (c != null) parts.push(`${c} MIN COOK`);
  parts.push(`${recipe.servings || 1} SERV`);
  if (recipe.cook_count > 0) {
    const d = daysSince(recipe.last_cooked);
    parts.push(d != null ? `LAST COOKED ${d}D AGO` : `×${recipe.cook_count} COOKED`);
  } else {
    parts.push('NOT YET COOKED');
  }
  return `<div class="detail-sub">${parts.join(' · ')}</div>`;
}

function macroBigHtml(macros) {
  const fmt = v => v == null ? '?' : Math.round(v);
  return `
    <div class="macro-big">
      <div class="protein">
        <span class="l">Protein</span>
        <span class="v">${fmt(macros.protein_g)}<span class="u">g</span></span>
      </div>
      <div><span class="l">kCal</span><span class="v">${fmt(macros.kcal)}</span></div>
      <div><span class="l">Carb</span><span class="v">${fmt(macros.carbs_g)}<span class="u">g</span></span></div>
      <div><span class="l">Fat</span><span class="v">${fmt(macros.fat_g)}<span class="u">g</span></span></div>
      <div><span class="l">Fiber</span><span class="v">${fmt(macros.fiber_g)}<span class="u">g</span></span></div>
    </div>
  `;
}

function scalerHtml(state) {
  return `
    <div class="scaler">
      <button type="button" class="pm" data-action="dec"${state.servings <= 1 ? ' disabled' : ''}>−</button>
      <span class="n">${state.servings}</span>
      <button type="button" class="pm" data-action="inc"${state.servings >= 12 ? ' disabled' : ''}>+</button>
      <span class="lbl">×${(state.servings / (state._base || 1)).toFixed(2)}</span>
    </div>
  `;
}

function headSideHtml(recipe, state) {
  const cookMeta = recipe.cook_count > 0
    ? `<div class="head-side-cookmeta">Cook count <span class="strong">×${recipe.cook_count}</span> · last ${daysSince(recipe.last_cooked) ?? '?'}D ago</div>`
    : '';
  return `
    <div class="head-side">
      <div class="head-side-label">Servings · scale</div>
      ${scalerHtml(state)}
      ${cookMeta}
    </div>
  `;
}

function servingsBarHtml(state) {
  return `
    <div class="servings-bar">
      <div class="l">Servings · scale</div>
      ${scalerHtml(state)}
    </div>
  `;
}

function ingredientGroupsHtml(ingredients, state) {
  const byCat = {};
  ingredients.forEach(ing => {
    const c = ing.category || 'other';
    (byCat[c] ||= []).push(ing);
  });
  const cats = CAT_ORDER.filter(c => byCat[c]);
  if (!cats.length) return '';
  const totalItems = ingredients.length;
  const totalCats = cats.length;

  const head = `
    <div class="block-head">
      <div class="name">Ingredients</div>
      <div class="info">${totalItems} item${totalItems === 1 ? '' : 's'} · ${totalCats} cat.</div>
    </div>
  `;

  const groups = cats.map(cat => {
    const items = byCat[cat];
    const optCount = items.filter(i => i.optional).length;
    const allOpt = optCount === items.length;
    const headLabel = items.length === 1 ? '1 item' : `${items.length} items`;
    const optSuffix = allOpt ? ' · opt.' : '';
    return `
      <div class="ing-group">
        <div class="ing-group-head${cat === 'protein' ? ' protein' : ''}">
          <span>${escapeHtml(cat)}</span><span>${headLabel}${optSuffix}</span>
        </div>
        ${items.map(ing => {
          const checked = state.checked.has(ing._idx) ? ' checked' : '';
          const isPro = cat === 'protein' ? ' protein' : '';
          const unit = unitDisplay(ing.unit);
          const qtyDisplay = ing.unit === 'to-taste'
            ? '—'
            : `${ing.displayQty}${unit ? `<span class="u">${escapeHtml(unit)}</span>` : ''}`;
          const tip = ing.thai_market_tip
            ? `<div class="tip">${escapeHtml(ing.thai_market_tip)}</div>` : '';
          const note = ing.note
            ? `<div class="tip${isOilCapTip(ing) ? ' warn' : ''}">${escapeHtml(ing.note)}</div>` : '';
          const prep = ing.prep
            ? `<div class="prep">${escapeHtml(ing.prep)}</div>` : '';
          const swap = ing.swapped ? '<span class="swap-flag">SUB</span>' : '';
          return `
            <div class="ing-row${isPro}${checked}" data-ing="${ing._idx}">
              <div class="box"></div>
              <div class="qty">${qtyDisplay}</div>
              <div>
                <div class="item">${escapeHtml(ing.displayItem)}${swap}</div>
                ${prep}
                ${note}
                ${tip}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');

  return head + groups;
}

function subCardsHtml(recipe, state) {
  const subs = recipe.substitutions || [];
  if (!subs.length) return '';
  const head = `
    <div class="block-head">
      <div class="name">Substitutions</div>
      <div class="info">${subs.length} option${subs.length === 1 ? '' : 's'}</div>
    </div>
  `;
  const cards = subs.map((s, i) => {
    const on = state.activeSubs.includes(i);
    const ratio = s.ratio ? ` · ${escapeHtml(s.ratio)}` : '';
    const deltas = s.macro_delta
      ? Object.entries(s.macro_delta).map(([k, v]) =>
          `<span class="delta ${deltaClass(k, v)}">${escapeHtml(deltaText(k, v))}</span>`
        ).join('')
      : '';
    const note = s.note ? `<div class="note">${escapeHtml(s.note)}</div>` : '';
    return `
      <div class="sub-card${on ? ' on' : ''}" data-sub="${i}">
        <div>
          <div class="swap">
            <span class="out">${escapeHtml(s.swap_out)}</span>
            <span class="arrow">→</span>
            <span class="in">${escapeHtml(s.swap_in)}</span>${ratio}
          </div>
          ${deltas ? `<div class="deltas">${deltas}</div>` : ''}
          ${note}
        </div>
        <div class="toggle${on ? ' on' : ''}"><div class="knob"></div></div>
      </div>
    `;
  }).join('');
  return head + cards;
}

function stepsHtml(recipe) {
  const steps = recipe.steps || [];
  if (!steps.length) return '';
  const head = `
    <div class="block-head">
      <div class="name">Method</div>
      <div class="info">${steps.length} steps · ${recipe.time?.total_min || '?'} min</div>
    </div>
  `;
  const rows = steps.map(s => {
    const timer = s.timer_min ? `<div class="timer-tag">Timer · ${formatTime(s.timer_min)}</div>` : '';
    return `
      <div class="step-row">
        <div class="num">${String(s.n).padStart(2, '0')}</div>
        <div class="text">${escapeHtml(s.text)}${timer}</div>
      </div>
    `;
  }).join('');
  return head + rows;
}

function notesHtml(recipe) {
  if (!recipe.notes) return '';
  return `
    <div class="block-head">
      <div class="name">Notes</div>
      <div class="info">Author</div>
    </div>
    <div class="notes-block">
      <div class="body">${escapeHtml(recipe.notes)}</div>
    </div>
  `;
}

function servesWithHtml(recipe) {
  const sw = recipe.serves_with || [];
  if (!sw.length) return '';
  const head = `
    <div class="block-head">
      <div class="name">Serves with</div>
      <div class="info">${sw.length} suggested</div>
    </div>
  `;
  const cards = sw.map(s => {
    const label = (s.ref || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `
      <div class="mini-card">
        <div class="name">${escapeHtml(label)}</div>
        ${s.note ? `<div class="meta">${escapeHtml(s.note)}</div>` : ''}
      </div>
    `;
  }).join('');
  return `${head}<div class="serves-with"><div class="mini-row">${cards}</div></div>`;
}

function stickyBarHtml(recipe) {
  const meta = recipe.cook_count > 0
    ? `<span class="meta">Cook count <strong>×${recipe.cook_count}</strong></span>`
    : '';
  return `
    <div class="sticky-bar">
      ${meta}
      <button type="button" class="btn outline" data-action="add-to-plan">Add to Plan</button>
      <a class="btn" href="#/cookbook/recipe/${recipe.id}/cook" style="text-decoration:none;" data-action="cook-now">Cook Now →</a>
    </div>
  `;
}

/* ============================================================
   MAIN RENDERER
   ============================================================ */

export function renderDetail(mount, recipe) {
  ensureStyles();

  if (!recipe) {
    mount.innerHTML = `
      <div class="recipe-detail">
        <a class="back-link" href="#/cookbook">← Cookbook</a>
        <div class="not-found">
          <div style="font-family: var(--display); font-weight: 900; font-size: 26px; text-transform: uppercase; color: var(--paper-000); margin-bottom: 12px;">Recipe not found</div>
          <a class="btn outline sm" href="#/cookbook" style="text-decoration: none;">← Back to cookbook</a>
        </div>
      </div>`;
    return;
  }

  // Local-only state for this view
  const state = {
    favorite: !!recipe.favorite,
    servings: recipe.servings || 1,
    _base: recipe.servings || 1,
    activeSubs: [],
    checked: new Set(),
  };

  function paint() {
    const { macros, ingredients } = compute(recipe, state);
    mount.innerHTML = `
      <div class="recipe-detail">
        <a class="back-link" href="#/cookbook">← Cookbook</a>
        <div class="hero-photo ${cuisineClass(recipe)}">
          <span class="ph-label">HERO PHOTO · 16:9</span>
          <div class="utility">
            <button type="button" class="util-btn star${state.favorite ? ' on' : ''}" data-action="fav" title="Favorite">★</button>
            <button type="button" class="util-btn" data-action="more" title="More">⋯</button>
          </div>
        </div>
        <div class="detail-head">
          <div>
            ${tagRowHtml(recipe)}
            <h1 class="detail-title">${escapeHtml(recipe.title || '')}</h1>
            ${detailSubHtml(recipe)}
          </div>
          ${headSideHtml(recipe, state)}
        </div>
        ${macroBigHtml(macros)}
        ${servingsBarHtml(state)}
        ${ingredientGroupsHtml(ingredients, state)}
        ${subCardsHtml(recipe, state)}
        ${stepsHtml(recipe)}
        ${notesHtml(recipe)}
        ${servesWithHtml(recipe)}
        ${stickyBarHtml(recipe)}
      </div>
    `;
    wire();
  }

  /* ----- Event wiring ----- */
  function wire() {
    const root = mount.querySelector('.recipe-detail');
    if (!root) return;

    root.addEventListener('click', e => {
      // Favorite toggle — persists to localStorage under mp:recipe-state:<id>
      const fav = e.target.closest('[data-action="fav"]');
      if (fav) {
        state.favorite = !state.favorite;
        toggleFavorite(recipe.id, !state.favorite);  // pass current value pre-toggle
        fav.classList.toggle('on');
        return;
      }

      // More menu (placeholder)
      if (e.target.closest('[data-action="more"]')) {
        console.info('[recipe-detail] more menu — not implemented yet');
        return;
      }

      // Servings scaler
      const pm = e.target.closest('.scaler .pm');
      if (pm) {
        const action = pm.dataset.action;
        if (pm.hasAttribute('disabled')) return;
        if (action === 'inc' && state.servings < 12) state.servings++;
        else if (action === 'dec' && state.servings > 1) state.servings--;
        else return;
        paint();
        return;
      }

      // Substitution toggle (entire card is clickable)
      const sub = e.target.closest('.sub-card');
      if (sub) {
        const i = Number(sub.dataset.sub);
        const idx = state.activeSubs.indexOf(i);
        if (idx >= 0) state.activeSubs.splice(idx, 1);
        else state.activeSubs.push(i);
        paint();
        return;
      }

      // Ingredient checkbox toggle (row clickable)
      const row = e.target.closest('.ing-row');
      if (row) {
        const i = Number(row.dataset.ing);
        if (state.checked.has(i)) state.checked.delete(i); else state.checked.add(i);
        row.classList.toggle('checked');
        return;
      }

      // Sticky bar actions (placeholders)
      const stickyAction = e.target.closest('.sticky-bar [data-action]');
      if (stickyAction) {
        console.info(`[recipe-detail] action: ${stickyAction.dataset.action} — not implemented yet`);
        return;
      }
    });
  }

  paint();
}
