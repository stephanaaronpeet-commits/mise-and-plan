/* =============================================================
   recipe-form.js — Add / Edit recipe (Phase 2.3, §04 of spec).
   Saves to localStorage under mp:user-recipes:<id>. The cookbook
   loadRecipe checks user-recipes first, so edits to seed recipes
   override the seed copy without touching /data/recipes/*.json.
   ============================================================= */

import {
  storage, ensureSchemaCurrent,
  getUserRecipe, saveUserRecipe, applyRecipeState,
} from '../core/storage.js';

ensureSchemaCurrent();

/* ============================================================
   STYLES
   ============================================================ */
const css = `
.rf-root { max-width: 1200px; margin: 0 auto; padding-bottom: 100px; }

.rf-head {
  padding: 18px 16px 14px;
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 12px; border-bottom: 1px solid var(--iron-300);
  background: var(--iron-000);
}
.rf-head .ttl {
  font-family: var(--display); font-weight: 900;
  font-size: 32px; line-height: 0.9;
  letter-spacing: -0.01em; text-transform: uppercase;
  color: var(--paper-000);
}
@media (min-width: 768px) { .rf-head { padding: 22px 28px 18px; } .rf-head .ttl { font-size: 48px; } }
.rf-head .sub {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-500); margin-top: 8px;
}

.rf-paste {
  margin: 14px 16px;
  border: 2px dashed var(--iron-red);
  background: rgba(194,51,30,0.06);
  padding: 14px 16px;
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px;
}
@media (min-width: 768px) { .rf-paste { margin: 18px 28px; } }
.rf-paste .l {
  font-family: var(--display); font-weight: 900;
  font-size: 18px; text-transform: uppercase;
  color: var(--paper-000); line-height: 1;
}
.rf-paste .pl {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--iron-500); margin-top: 4px;
}

.rf-body { padding: 0 16px; }
@media (min-width: 768px) { .rf-body { padding: 0 28px; } }
@media (min-width: 1000px) {
  .rf-body { display: grid; grid-template-columns: 1.4fr 1fr; gap: 22px; }
}

.rf-section {
  border: 1px solid var(--iron-300);
  background: var(--iron-100);
  margin-bottom: 14px;
}
.rf-sec-h {
  padding: 12px 14px;
  border-bottom: 1px solid var(--iron-300);
  display: flex; justify-content: space-between; align-items: center;
  background: var(--iron-000);
}
.rf-sec-h .name {
  font-family: var(--display); font-weight: 800;
  font-size: 16px; text-transform: uppercase;
  color: var(--paper-000);
}
.rf-sec-h .hint {
  font-family: var(--mono); font-size: 9px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-500);
}
.rf-grid { padding: 14px; display: grid; gap: 12px; }
.rf-grid.cols-2 { grid-template-columns: 1fr 1fr; }
.rf-grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
.rf-grid.cols-5 { grid-template-columns: repeat(5, 1fr); }

.rf-field { display: flex; flex-direction: column; gap: 5px; }
.rf-field .lbl {
  font-family: var(--mono); font-size: 9.5px;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--iron-500);
}
.rf-field input, .rf-field select, .rf-field textarea {
  border: 1px solid var(--iron-300);
  background: var(--iron-000);
  padding: 9px 11px;
  font-family: var(--body); font-weight: 500;
  color: var(--paper-000); font-size: 14px;
  width: 100%; box-sizing: border-box;
  outline: 0;
}
.rf-field textarea { font-family: var(--body); resize: vertical; min-height: 80px; line-height: 1.4; }
.rf-field input.mono, .rf-field select.mono { font-family: var(--mono); font-size: 13px; font-variant-numeric: tabular-nums; }
.rf-field input:focus, .rf-field select:focus, .rf-field textarea:focus { border-color: var(--paper-200); }
.rf-field input.invalid, .rf-field select.invalid, .rf-field textarea.invalid {
  border-color: var(--iron-red);
}
.rf-field.protein input { border-color: var(--iron-red); color: var(--iron-red); font-weight: 700; }
.rf-field.protein .lbl { color: var(--iron-red); }

.rf-with-unit {
  display: grid; grid-template-columns: 1fr auto;
  align-items: center; border: 1px solid var(--iron-300);
  background: var(--iron-000);
}
.rf-with-unit input { border: 0 !important; background: transparent !important; padding: 9px 11px !important; }
.rf-with-unit .unit {
  font-family: var(--mono); font-size: 11px;
  color: var(--iron-500); letter-spacing: 0.1em;
  text-transform: uppercase; padding-right: 12px;
}

/* Multi-select chips (tags, meal-type, diet-flags) */
.rf-chips {
  display: flex; flex-wrap: wrap; gap: 6px;
  border: 1px solid var(--iron-300);
  background: var(--iron-000);
  padding: 8px; min-height: 38px;
  align-items: center;
}
.rf-chips .chip {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.16em; text-transform: uppercase;
  padding: 5px 9px;
  border: 1px solid var(--iron-400);
  color: var(--paper-100); background: transparent;
  cursor: pointer;
  display: inline-flex; align-items: center; gap: 4px;
}
.rf-chips .chip:hover { border-color: var(--paper-200); }
.rf-chips .chip.active {
  background: var(--paper-000); color: var(--iron-000);
  border-color: var(--paper-000);
}
.rf-chips input.add-input {
  border: 0; background: transparent;
  outline: 0; color: var(--paper-000);
  font-family: var(--mono); font-size: 11px;
  letter-spacing: 0.04em; flex: 1; min-width: 90px;
  padding: 4px 6px;
}

/* Row builders */
.rf-rb { border: 1px solid var(--iron-300); background: var(--iron-000); }
.rf-rb-head, .rf-rb-row {
  display: grid; align-items: stretch;
  border-bottom: 1px dashed var(--iron-300);
}
.rf-rb-head {
  background: var(--iron-100);
  border-bottom: 1px solid var(--iron-300);
}
.rf-rb-head > div {
  padding: 8px 6px;
  font-family: var(--mono); font-size: 9px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-500);
  border-right: 1px solid var(--iron-300);
}
.rf-rb-head > div:last-child { border-right: 0; }
.rf-rb-row > div {
  border-right: 1px solid var(--iron-300);
  padding: 4px;
}
.rf-rb-row > div:last-child { border-right: 0; }
.rf-rb-row input, .rf-rb-row select, .rf-rb-row textarea {
  width: 100%; box-sizing: border-box;
  background: transparent; border: 0;
  padding: 6px 4px; font-family: var(--body);
  font-size: 13px; color: var(--paper-000); outline: 0;
}
.rf-rb-row textarea { resize: vertical; min-height: 30px; line-height: 1.3; }
.rf-rb-row input.mono, .rf-rb-row select.mono { font-family: var(--mono); font-size: 12px; font-variant-numeric: tabular-nums; }
.rf-rb-row input:focus, .rf-rb-row select:focus, .rf-rb-row textarea:focus { background: var(--iron-100); }
.rf-rb-row.protein input.qty-input { color: var(--iron-red); font-weight: 700; }
.rf-rb-row .del-btn {
  width: 100%; height: 100%; background: transparent;
  border: 0; color: var(--iron-500); cursor: pointer;
  font-family: var(--display); font-size: 16px;
  font-weight: 800;
}
.rf-rb-row .del-btn:hover { color: var(--iron-red); }
.rf-rb-add {
  padding: 12px; text-align: center; cursor: pointer;
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase;
  background: var(--iron-100); color: var(--iron-500);
  border-top: 1px solid var(--iron-300); border-bottom: 0;
}
.rf-rb-add:hover { color: var(--paper-000); background: var(--iron-200); }

/* Ingredient builder cols: qty (60) | unit (72) | item (1fr) | cat (96) | prep (1fr) | del (32) */
.rf-rb.ing .rf-rb-head, .rf-rb.ing .rf-rb-row {
  grid-template-columns: 60px 72px 1fr 96px 1fr 32px;
}
.rf-rb.ing .rf-rb-head > div:nth-child(1) { padding-left: 10px; }
.rf-rb.ing .rf-rb-row > div { padding: 2px; }

/* Steps builder: # (28) | text (1fr) | timer (80) | del (32) */
.rf-rb.steps .rf-rb-head, .rf-rb.steps .rf-rb-row {
  grid-template-columns: 28px 1fr 80px 32px;
}
.rf-rb.steps .rf-rb-head > div:nth-child(1) { padding-left: 6px; }
.rf-rb.steps .rf-rb-row .num {
  display: flex; align-items: center; justify-content: center;
  font-family: var(--mono); color: var(--iron-red); font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* Subs builder: out (1fr) | in (1fr) | ratio (80) | macro_delta (1fr) | del (32) */
.rf-rb.subs .rf-rb-head, .rf-rb.subs .rf-rb-row {
  grid-template-columns: 1fr 1fr 80px 1.2fr 32px;
}

.rf-rb-row.add-affordance {
  grid-template-columns: 1fr !important;
}

@media (max-width: 700px) {
  .rf-rb.ing .rf-rb-head { display: none; }
  .rf-rb.ing .rf-rb-row {
    grid-template-columns: 1fr 32px;
    grid-template-areas:
      "qty del"
      "unit del"
      "item del"
      "cat del"
      "prep del";
    grid-template-rows: auto;
    gap: 0;
  }
  .rf-rb.ing .rf-rb-row > div { grid-area: auto; }
  .rf-rb.ing .rf-rb-row > div:nth-child(1) { grid-area: qty; }
  .rf-rb.ing .rf-rb-row > div:nth-child(2) { grid-area: unit; }
  .rf-rb.ing .rf-rb-row > div:nth-child(3) { grid-area: item; }
  .rf-rb.ing .rf-rb-row > div:nth-child(4) { grid-area: cat; }
  .rf-rb.ing .rf-rb-row > div:nth-child(5) { grid-area: prep; }
  .rf-rb.ing .rf-rb-row > div:nth-child(6) { grid-area: del; }
}

/* Sticky form bar */
.rf-bar {
  position: sticky; bottom: 0;
  border-top: 2px solid var(--iron-red);
  background: var(--iron-000);
  padding: 12px 16px;
  display: flex; justify-content: space-between; align-items: center;
  gap: 10px;
  z-index: 10;
}
@media (min-width: 768px) { .rf-bar { padding: 14px 28px; gap: 14px; } }
.rf-bar .left, .rf-bar .right { display: flex; gap: 8px; align-items: center; }
.rf-bar .err {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--iron-red); font-weight: 700;
}

/* Toast (paste / save feedback) */
.rf-toast {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  background: var(--iron-000); color: var(--paper-000);
  border: 2px solid var(--iron-red);
  padding: 10px 16px;
  font-family: var(--mono); font-size: 11px;
  letter-spacing: 0.18em; text-transform: uppercase;
  z-index: 200;
}
`;

function ensureStyles() {
  if (document.getElementById('recipe-form-css')) return;
  const tag = document.createElement('style');
  tag.id = 'recipe-form-css';
  tag.textContent = css;
  document.head.appendChild(tag);
}

/* ============================================================
   CONST: schema enums
   ============================================================ */
const UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'piece', 'clove', 'slice', 'pinch', 'to-taste', 'pack'];
const CATS  = ['protein', 'produce', 'pantry', 'dairy', 'frozen', 'spice', 'other'];
const CUISINES = ['thai', 'korean', 'japanese', 'vietnamese', 'mexican', 'indian', 'mediterranean', 'western', 'fusion'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'post-workout'];
const DIET_FLAGS = ['gluten-free', 'dairy-free', 'low-carb', 'high-protein', 'vegetarian', 'vegan', 'pescatarian'];

function blankRecipe() {
  return {
    id: '',
    schema_version: 1,
    title: '',
    subtitle: '',
    created: new Date().toISOString().slice(0, 10),
    updated: new Date().toISOString().slice(0, 10),
    source: 'personal',
    tags: [],
    cuisine: 'thai',
    meal_type: ['lunch'],
    diet_flags: [],
    servings: 2,
    time: { prep_min: 0, cook_min: 0, total_min: 0 },
    macros_per_serving: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
    ingredients: [],
    substitutions: [],
    steps: [],
    notes: '',
    favorite: false,
    cook_count: 0,
    last_cooked: null,
  };
}

function slugify(s) {
  return (s || '').toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ============================================================
   VALIDATION
   ============================================================ */
function validate(r) {
  const errors = [];
  if (!r.title?.trim())                 errors.push({ field: 'title', msg: 'Title required' });
  if (!r.servings || r.servings < 1)    errors.push({ field: 'servings', msg: 'Servings ≥ 1' });
  if (!r.macros_per_serving?.protein_g) errors.push({ field: 'protein_g', msg: 'Protein required' });
  if (!r.macros_per_serving?.kcal)      errors.push({ field: 'kcal', msg: 'Kcal required' });
  if (!r.ingredients?.length)           errors.push({ field: 'ingredients', msg: 'Need ≥ 1 ingredient' });
  if (!r.steps?.length)                 errors.push({ field: 'steps', msg: 'Need ≥ 1 step' });
  return errors;
}

/* ============================================================
   PASTE FROM CLIPBOARD — accepts JSON
   ============================================================ */
async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

/* ============================================================
   MAIN RENDER
   ============================================================ */
export async function render({ mount, rest, params }) {
  ensureStyles();

  // Modes: /cookbook/new  → blank
  //        /cookbook/edit/<id> → load existing
  const isEdit = rest[0] === 'edit' && rest[1];
  let recipe = blankRecipe();
  if (isEdit) {
    const id = rest[1];
    // Try user-recipes first, else seed
    const u = getUserRecipe(id);
    if (u) recipe = { ...recipe, ...u };
    else {
      try {
        const res = await fetch(`/data/recipes/${id}.json`);
        if (res.ok) recipe = { ...recipe, ...(await res.json()) };
      } catch (e) {}
    }
  }

  // Local state — the entire recipe being edited
  const state = { recipe };

  function paint() {
    const r = state.recipe;
    mount.innerHTML = `
      <div class="rf-root">
        <div class="rf-head">
          <div>
            <div class="ttl">${isEdit ? 'Edit Recipe' : 'New Recipe'}</div>
            <div class="sub">${isEdit ? escapeHtml(r.title || r.id) : 'Form auto-validates'}</div>
          </div>
        </div>

        <div class="rf-paste">
          <div>
            <div class="l">Paste from Claude</div>
            <div class="pl">JSON in clipboard · fills the form</div>
          </div>
          <button type="button" class="btn red sm" data-action="paste">Paste</button>
        </div>

        <div class="rf-body">
          <div class="rf-body-left">
            ${sectionBasics(r)}
            ${sectionIngredients(r)}
            ${sectionSubs(r)}
          </div>
          <div class="rf-body-right">
            ${sectionTime(r)}
            ${sectionMacros(r)}
            ${sectionSteps(r)}
            ${sectionNotes(r)}
          </div>
        </div>

        <div class="rf-bar">
          <div class="left">
            <a class="btn ghost sm" href="#/cookbook" style="text-decoration:none;">Cancel</a>
          </div>
          <div class="right rf-err-slot"></div>
          <div class="right">
            <button type="button" class="btn outline sm" data-action="save-export">Save + JSON</button>
            <button type="button" class="btn sm" data-action="save">Save</button>
          </div>
        </div>
      </div>
    `;
    wireFields(mount, state);
  }

  paint();
}

/* ============================================================
   SECTION BUILDERS
   ============================================================ */
function sectionBasics(r) {
  return `
    <div class="rf-section" data-section="basics">
      <div class="rf-sec-h"><span class="name">Basics</span><span class="hint">Title + cuisine + tags</span></div>
      <div class="rf-grid">
        <div class="rf-field">
          <span class="lbl">Title</span>
          <input data-bind="title" type="text" value="${escapeHtml(r.title)}" placeholder="e.g. Chicken Larb (Isaan-style)" />
        </div>
        <div class="rf-field">
          <span class="lbl">Subtitle</span>
          <input data-bind="subtitle" type="text" value="${escapeHtml(r.subtitle || '')}" placeholder="e.g. Northeastern Thai. 5 min prep, 10 min cook." />
        </div>
        <div class="rf-grid cols-2" style="padding:0;">
          <div class="rf-field">
            <span class="lbl">Cuisine</span>
            <select data-bind="cuisine">
              ${CUISINES.map(c => `<option value="${c}"${c === r.cuisine ? ' selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="rf-field">
            <span class="lbl">Servings</span>
            <input data-bind="servings" type="number" min="1" max="12" value="${r.servings}" class="mono" />
          </div>
        </div>
        <div class="rf-field">
          <span class="lbl">Meal type</span>
          ${multiChips('meal_type', MEAL_TYPES, r.meal_type || [])}
        </div>
        <div class="rf-field">
          <span class="lbl">Diet flags</span>
          ${multiChips('diet_flags', DIET_FLAGS, r.diet_flags || [])}
        </div>
        <div class="rf-field">
          <span class="lbl">Tags <span style="color:var(--iron-500); text-transform: none; letter-spacing: 0;">(free-form, hyphenated)</span></span>
          ${freeChips('tags', r.tags || [])}
        </div>
      </div>
    </div>
  `;
}

function multiChips(field, options, active) {
  return `
    <div class="rf-chips" data-multi="${field}">
      ${options.map(o => `<button type="button" class="chip${active.includes(o) ? ' active' : ''}" data-val="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join('')}
    </div>
  `;
}

function freeChips(field, values) {
  return `
    <div class="rf-chips" data-free="${field}">
      ${values.map(v => `<span class="chip active" data-val="${escapeHtml(v)}">${escapeHtml(v)}<span class="x" data-action="remove-tag" style="margin-left:4px; cursor:pointer;">×</span></span>`).join('')}
      <input class="add-input" type="text" placeholder="+ tag, press Enter…" />
    </div>
  `;
}

function sectionTime(r) {
  const t = r.time || {};
  return `
    <div class="rf-section">
      <div class="rf-sec-h"><span class="name">Time</span><span class="hint">Auto-sums total</span></div>
      <div class="rf-grid cols-3">
        <div class="rf-field"><span class="lbl">Prep</span>
          <div class="rf-with-unit"><input data-bind="time.prep_min" type="number" min="0" value="${t.prep_min || 0}" class="mono" /><span class="unit">min</span></div>
        </div>
        <div class="rf-field"><span class="lbl">Cook</span>
          <div class="rf-with-unit"><input data-bind="time.cook_min" type="number" min="0" value="${t.cook_min || 0}" class="mono" /><span class="unit">min</span></div>
        </div>
        <div class="rf-field"><span class="lbl">Total</span>
          <div class="rf-with-unit"><input data-bind="time.total_min" type="number" min="0" value="${t.total_min || 0}" class="mono" readonly style="color:var(--iron-500); cursor:not-allowed;" /><span class="unit">auto</span></div>
        </div>
      </div>
    </div>
  `;
}

function sectionMacros(r) {
  const m = r.macros_per_serving || {};
  return `
    <div class="rf-section">
      <div class="rf-sec-h"><span class="name">Macros / serving</span><span class="hint">Required: P, kCal, C, F</span></div>
      <div class="rf-grid cols-3">
        <div class="rf-field protein"><span class="lbl">Protein</span>
          <div class="rf-with-unit"><input data-bind="macros_per_serving.protein_g" type="number" step="0.5" min="0" value="${m.protein_g || 0}" class="mono" /><span class="unit">g</span></div>
        </div>
        <div class="rf-field"><span class="lbl">kCal</span>
          <input data-bind="macros_per_serving.kcal" type="number" step="1" min="0" value="${m.kcal || 0}" class="mono" />
        </div>
        <div class="rf-field"><span class="lbl">Carbs</span>
          <div class="rf-with-unit"><input data-bind="macros_per_serving.carbs_g" type="number" step="0.5" min="0" value="${m.carbs_g || 0}" class="mono" /><span class="unit">g</span></div>
        </div>
        <div class="rf-field"><span class="lbl">Fat</span>
          <div class="rf-with-unit"><input data-bind="macros_per_serving.fat_g" type="number" step="0.5" min="0" value="${m.fat_g || 0}" class="mono" /><span class="unit">g</span></div>
        </div>
        <div class="rf-field"><span class="lbl">Fiber</span>
          <div class="rf-with-unit"><input data-bind="macros_per_serving.fiber_g" type="number" step="0.5" min="0" value="${m.fiber_g || 0}" class="mono" /><span class="unit">g</span></div>
        </div>
      </div>
    </div>
  `;
}

function sectionIngredients(r) {
  const rows = (r.ingredients || []).map((ing, i) => `
    <div class="rf-rb-row${ing.category === 'protein' ? ' protein' : ''}" data-row="ing:${i}">
      <div><input class="mono qty-input" data-bind-row="qty"  type="number" step="0.1" min="0" value="${ing.qty || 0}" /></div>
      <div>
        <select class="mono" data-bind-row="unit">
          ${UNITS.map(u => `<option value="${u}"${u === ing.unit ? ' selected' : ''}>${u}</option>`).join('')}
        </select>
      </div>
      <div><input data-bind-row="item" type="text" value="${escapeHtml(ing.item || '')}" placeholder="ingredient" /></div>
      <div>
        <select data-bind-row="category">
          ${CATS.map(c => `<option value="${c}"${c === ing.category ? ' selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
      <div><input data-bind-row="prep" type="text" value="${escapeHtml(ing.prep || '')}" placeholder="prep / note" /></div>
      <div><button type="button" class="del-btn" data-action="remove-row" data-target="ingredients" data-idx="${i}">×</button></div>
    </div>
  `).join('');
  return `
    <div class="rf-section">
      <div class="rf-sec-h"><span class="name">Ingredients</span><span class="hint">${(r.ingredients || []).length} row${(r.ingredients || []).length === 1 ? '' : 's'}</span></div>
      <div style="padding: 10px;">
        <div class="rf-rb ing" data-rb="ingredients">
          <div class="rf-rb-head">
            <div>Qty</div><div>Unit</div><div>Item</div><div>Cat</div><div>Prep/note</div><div></div>
          </div>
          ${rows}
          <div class="rf-rb-add" data-action="add-row" data-target="ingredients">+ Add ingredient</div>
        </div>
      </div>
    </div>
  `;
}

function sectionSteps(r) {
  const rows = (r.steps || []).map((s, i) => `
    <div class="rf-rb-row" data-row="step:${i}">
      <div class="num">${String(s.n || i + 1).padStart(2, '0')}</div>
      <div><textarea data-bind-row="text" rows="1" placeholder="Step text…">${escapeHtml(s.text || '')}</textarea></div>
      <div><input data-bind-row="timer_min" class="mono" type="number" min="0" step="1" value="${s.timer_min ?? ''}" placeholder="—" /></div>
      <div><button type="button" class="del-btn" data-action="remove-row" data-target="steps" data-idx="${i}">×</button></div>
    </div>
  `).join('');
  return `
    <div class="rf-section">
      <div class="rf-sec-h"><span class="name">Method</span><span class="hint">${(r.steps || []).length} step${(r.steps || []).length === 1 ? '' : 's'}</span></div>
      <div style="padding: 10px;">
        <div class="rf-rb steps" data-rb="steps">
          <div class="rf-rb-head">
            <div>#</div><div>Step text</div><div>Timer</div><div></div>
          </div>
          ${rows}
          <div class="rf-rb-add" data-action="add-row" data-target="steps">+ Add step</div>
        </div>
      </div>
    </div>
  `;
}

function sectionSubs(r) {
  const rows = (r.substitutions || []).map((s, i) => `
    <div class="rf-rb-row" data-row="sub:${i}">
      <div><input data-bind-row="swap_out" type="text" value="${escapeHtml(s.swap_out || '')}" placeholder="swap out (matches ingredient)" /></div>
      <div><input data-bind-row="swap_in"  type="text" value="${escapeHtml(s.swap_in || '')}" placeholder="swap in" /></div>
      <div><input data-bind-row="ratio" class="mono" type="text" value="${escapeHtml(s.ratio || '1:1')}" placeholder="ratio" /></div>
      <div><input data-bind-row="macro_delta_text" type="text" value="${escapeHtml(macroDeltaToText(s.macro_delta))}" placeholder="e.g. +40 kcal, -3 P, +5 F" /></div>
      <div><button type="button" class="del-btn" data-action="remove-row" data-target="substitutions" data-idx="${i}">×</button></div>
    </div>
  `).join('');
  return `
    <div class="rf-section">
      <div class="rf-sec-h"><span class="name">Substitutions</span><span class="hint">${(r.substitutions || []).length} optional</span></div>
      <div style="padding: 10px;">
        <div class="rf-rb subs" data-rb="substitutions">
          <div class="rf-rb-head">
            <div>Swap out</div><div>Swap in</div><div>Ratio</div><div>Macro delta</div><div></div>
          </div>
          ${rows}
          <div class="rf-rb-add" data-action="add-row" data-target="substitutions">+ Add substitution</div>
        </div>
      </div>
    </div>
  `;
}

function sectionNotes(r) {
  return `
    <div class="rf-section">
      <div class="rf-sec-h"><span class="name">Notes</span><span class="hint">Optional</span></div>
      <div class="rf-grid">
        <div class="rf-field">
          <textarea data-bind="notes" rows="4" placeholder="Free-form notes…">${escapeHtml(r.notes || '')}</textarea>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================
   MACRO DELTA TEXT PARSER (e.g. "+40 kcal, -3 P, +5 F")
   ============================================================ */
function macroDeltaToText(d) {
  if (!d) return '';
  const map = { kcal: 'kcal', protein_g: 'P', carbs_g: 'C', fat_g: 'F', fiber_g: 'Fb' };
  return Object.entries(d).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${map[k] || k}`).join(', ');
}
function macroDeltaFromText(t) {
  const out = {};
  if (!t) return out;
  const keyMap = { kcal: 'kcal', kc: 'kcal', cal: 'kcal',
                   p: 'protein_g', pro: 'protein_g', protein: 'protein_g',
                   c: 'carbs_g', carb: 'carbs_g', carbs: 'carbs_g',
                   f: 'fat_g', fat: 'fat_g',
                   fb: 'fiber_g', fib: 'fiber_g', fiber: 'fiber_g' };
  for (const part of t.split(/[,;]/)) {
    const m = part.trim().match(/^([+\-−–]?\d+(?:\.\d+)?)\s*g?\s*([a-z]+)/i);
    if (!m) continue;
    const num = parseFloat(m[1].replace(/[−–]/g, '-'));
    const k = keyMap[m[2].toLowerCase()];
    if (k && !isNaN(num)) out[k] = num;
  }
  return out;
}

/* ============================================================
   FIELD WIRING
   ============================================================ */
function setPath(obj, path, val) {
  const segs = path.split('.');
  let o = obj;
  for (let i = 0; i < segs.length - 1; i++) {
    o[segs[i]] = o[segs[i]] || {};
    o = o[segs[i]];
  }
  o[segs[segs.length - 1]] = val;
}

function wireFields(mount, state) {
  const root = mount.querySelector('.rf-root');
  if (!root) return;

  // Plain field bindings
  root.addEventListener('input', e => {
    const input = e.target.closest('[data-bind]');
    if (input) {
      const path = input.dataset.bind;
      let val = input.type === 'number' ? Number(input.value) : input.value;
      if (input.type === 'number' && isNaN(val)) val = 0;
      setPath(state.recipe, path, val);
      // Auto-sum total time
      if (path === 'time.prep_min' || path === 'time.cook_min') {
        const t = state.recipe.time;
        t.total_min = (Number(t.prep_min) || 0) + (Number(t.cook_min) || 0);
        const tot = root.querySelector('[data-bind="time.total_min"]');
        if (tot) tot.value = t.total_min;
      }
      return;
    }

    // Row builder field
    const rowInput = e.target.closest('[data-bind-row]');
    if (rowInput) {
      const rowEl = rowInput.closest('[data-row]');
      if (!rowEl) return;
      const [tgt, idx] = rowEl.dataset.row.split(':');
      const target = tgt === 'ing' ? 'ingredients' : tgt === 'step' ? 'steps' : tgt === 'sub' ? 'substitutions' : null;
      if (!target) return;
      const i = Number(idx);
      const arr = state.recipe[target];
      if (!arr[i]) return;
      const field = rowInput.dataset.bindRow;
      let val = rowInput.type === 'number' ? Number(rowInput.value) : rowInput.value;
      if (rowInput.type === 'number' && rowInput.value === '') val = null;
      if (field === 'macro_delta_text') {
        arr[i].macro_delta = macroDeltaFromText(val);
      } else {
        arr[i][field] = val;
      }
      // Renumber step n
      if (target === 'steps' && field === 'text') {
        arr.forEach((s, i2) => { s.n = i2 + 1; });
      }
      return;
    }

    // Free-tag input — handled on Enter
  });

  // Selects fire 'change' not 'input' sometimes
  root.addEventListener('change', e => {
    const input = e.target.closest('[data-bind]');
    if (input && input.tagName === 'SELECT') {
      setPath(state.recipe, input.dataset.bind, input.value);
    }
    const rowInput = e.target.closest('[data-bind-row]');
    if (rowInput && rowInput.tagName === 'SELECT') {
      const rowEl = rowInput.closest('[data-row]');
      if (!rowEl) return;
      const [tgt, idx] = rowEl.dataset.row.split(':');
      const target = tgt === 'ing' ? 'ingredients' : tgt === 'step' ? 'steps' : tgt === 'sub' ? 'substitutions' : null;
      if (!target) return;
      const i = Number(idx);
      if (!state.recipe[target][i]) return;
      state.recipe[target][i][rowInput.dataset.bindRow] = rowInput.value;
      // protein row visual
      if (rowInput.dataset.bindRow === 'category' && target === 'ingredients') {
        rowEl.classList.toggle('protein', rowInput.value === 'protein');
      }
    }
  });

  // Click delegation
  root.addEventListener('click', async e => {
    // Multi-chip toggle (meal_type, diet_flags)
    const mchip = e.target.closest('.rf-chips[data-multi] .chip');
    if (mchip) {
      const container = mchip.parentElement;
      const field = container.dataset.multi;
      const val = mchip.dataset.val;
      const arr = state.recipe[field] || [];
      const idx = arr.indexOf(val);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(val);
      state.recipe[field] = arr;
      mchip.classList.toggle('active');
      return;
    }

    // Free-tag remove
    const rmTag = e.target.closest('[data-action="remove-tag"]');
    if (rmTag) {
      const chip = rmTag.closest('.chip');
      const container = chip.parentElement;
      const field = container.dataset.free;
      const val = chip.dataset.val;
      state.recipe[field] = (state.recipe[field] || []).filter(v => v !== val);
      chip.remove();
      return;
    }

    // Row builder add
    const addRow = e.target.closest('[data-action="add-row"]');
    if (addRow) {
      const target = addRow.dataset.target;
      if (target === 'ingredients') {
        state.recipe.ingredients.push({ qty: 0, unit: 'g', item: '', category: 'pantry' });
      } else if (target === 'steps') {
        state.recipe.steps.push({ n: state.recipe.steps.length + 1, text: '', timer_min: null });
      } else if (target === 'substitutions') {
        state.recipe.substitutions.push({ swap_out: '', swap_in: '', ratio: '1:1', macro_delta: {} });
      }
      // Re-paint the affected section
      const section = addRow.closest('.rf-section');
      if (section && target === 'ingredients') section.outerHTML = sectionIngredients(state.recipe);
      else if (section && target === 'steps')  section.outerHTML = sectionSteps(state.recipe);
      else if (section && target === 'substitutions') section.outerHTML = sectionSubs(state.recipe);
      return;
    }

    // Row builder remove
    const rmRow = e.target.closest('[data-action="remove-row"]');
    if (rmRow) {
      const target = rmRow.dataset.target;
      const idx = Number(rmRow.dataset.idx);
      state.recipe[target].splice(idx, 1);
      if (target === 'steps') state.recipe.steps.forEach((s, i) => { s.n = i + 1; });
      const section = rmRow.closest('.rf-section');
      if (section && target === 'ingredients') section.outerHTML = sectionIngredients(state.recipe);
      else if (section && target === 'steps')  section.outerHTML = sectionSteps(state.recipe);
      else if (section && target === 'substitutions') section.outerHTML = sectionSubs(state.recipe);
      return;
    }

    // Paste from clipboard
    if (e.target.closest('[data-action="paste"]')) {
      const parsed = await pasteFromClipboard();
      if (!parsed) { showToast('Clipboard is not valid JSON'); return; }
      // Merge over current state — keep schema_version, source defaults
      state.recipe = { ...blankRecipe(), ...parsed, schema_version: 1 };
      // Re-paint everything
      const oldMount = root.parentElement;
      root.outerHTML = '';
      // Easiest: just re-trigger render via location.hash bounce (preserves /new vs /edit)
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      // Stash temporary state for new render to pick up — actually simpler: directly repaint
      // Hard to repaint in-place from inside a section helper. Reload mount HTML.
      // Use a small trick: store on window for the bounced render to read.
      window.__rfPaste = state.recipe;
      showToast('Pasted — fields populated');
      return;
    }

    // Save
    if (e.target.closest('[data-action="save"]') || e.target.closest('[data-action="save-export"]')) {
      const wantsExport = !!e.target.closest('[data-action="save-export"]');
      const errors = validate(state.recipe);
      const errSlot = root.querySelector('.rf-err-slot');
      // Clear previous invalid markers
      root.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
      if (errors.length) {
        if (errSlot) errSlot.innerHTML = `<span class="err">${errors.length} issue${errors.length > 1 ? 's' : ''}: ${errors.map(e => e.msg).join(', ')}</span>`;
        return;
      }
      if (errSlot) errSlot.innerHTML = '';

      // Generate id if missing
      if (!state.recipe.id) {
        const base = slugify(state.recipe.title) || 'recipe';
        let id = base;
        let n = 2;
        while (storage.get(`user-recipes:${id}`) || storage.get(`recipe:${id}`)) {
          id = `${base}-${n++}`;
        }
        state.recipe.id = id;
      }
      state.recipe.updated = new Date().toISOString().slice(0, 10);

      saveUserRecipe(state.recipe);

      if (wantsExport) downloadJson(state.recipe);

      showToast('Saved ✓');
      // Navigate to the new recipe's detail page
      setTimeout(() => { location.hash = `#/cookbook/recipe/${state.recipe.id}`; }, 300);
      return;
    }
  });

  // Enter on free-tag input adds a tag
  root.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const inp = e.target.closest('.rf-chips[data-free] .add-input');
    if (!inp) return;
    e.preventDefault();
    const v = inp.value.trim().toLowerCase().replace(/\s+/g, '-');
    if (!v) return;
    const field = inp.closest('.rf-chips').dataset.free;
    const arr = state.recipe[field] || [];
    if (arr.includes(v)) { inp.value = ''; return; }
    arr.push(v);
    state.recipe[field] = arr;
    // Insert the new chip before the input
    inp.insertAdjacentHTML('beforebegin', `<span class="chip active" data-val="${escapeHtml(v)}">${escapeHtml(v)}<span class="x" data-action="remove-tag" style="margin-left:4px; cursor:pointer;">×</span></span>`);
    inp.value = '';
  });

  // If we just came back from a Paste, pick up the stashed state
  if (window.__rfPaste) {
    state.recipe = window.__rfPaste;
    window.__rfPaste = null;
    // Re-paint via dispatchEvent — but we're already painted. Just trigger a hash bounce.
    // Actually we already rendered with the new state via the initial flow path. Skip.
  }
}

function downloadJson(recipe) {
  const blob = new Blob([JSON.stringify(recipe, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${recipe.id}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'rf-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}
