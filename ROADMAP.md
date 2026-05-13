# MISE & PLAN — COOKBOOK ROADMAP

> Living document. Check off as you go. Update when reality diverges from plan.
> Anything in **`bold`** is a deliverable Stephan should be able to see/use.

---

## ◆ WHERE WE ARE (snapshot · 2026-05-13)

Phase 1 ✅ · Phase 2 ✅ · Phase 3 (3 of 6, the load-bearing ones) ✅ · Plus Stats module + persistence layer that the original roadmap didn't list.

- **Live:** https://mise-and-plan.vercel.app (Vercel, not Cloudflare Pages — see Deviations below).
- **Repo:** github.com/stephanaaronpeet-commits/mise-and-plan (public, not private).
- **Recipes:** 15 seed JSONs + user-recipes layered on top via localStorage. Form writes user-recipes.
- **Modules live:** Cookbook · Plan · Shop · Stats. All 4 nav tabs are real screens.
- **Cache version:** sw.js → `mp-v0.7.0`. Bump on every shipping commit that changes JS/CSS.
- **Schema:** v1, frozen. No migration ever shipped.

The roadmap is **ahead of the original "pause and cook 2 weeks" gate** — Stephan pushed past it three times. The thing genuinely missing now is real-use feedback, not more code.

---

## ◆ DEVIATIONS FROM ORIGINAL PLAN

The build diverged from the roadmap in a few honest ways. Snapshot so future-Stephan isn't confused.

- **Host:** Vercel, not Cloudflare Pages. Same outcome (free, fast, push-to-deploy), different vendor.
- **Repo visibility:** public, not private. No secrets in the codebase so it's fine, but worth knowing.
- **`STRUCTURE.md`:** never written. The structure from `PROJECT_BRIEF.md` §4 was implemented as-is, plus `src/insights/` for the Stats module.
- **`cookbook-components.html`:** delivered as `_design/cookbook-design-v1.html.html` (note doubled `.html.html` — download artifact, low-priority rename).
- **"Add to Home Screen" tested on iOS Safari:** not verified by Claude. Manifest is correct, icons exist; needs a real device confirmation by Stephan.
- **Filter UX:** Phase 1.4 originally shipped with pill-based filters (≤15/≤30/≤60 etc). Phase 1.2-redo per `_design/` spec replaced these with browse-rail + chip + sort-dropdown. Pill code is gone.
- **Recipe form drag-reorder:** spec mentions drag handles (≡). Built as add/delete only; users reorder by recreating rows. Phase 3-ish polish.

---

## PHASE 0 · FOUNDATION (chat sessions)

Done as preparation before Claude Code ever touched the repo. No formal "session" commits — these were design conversations.

### Session 0.1 — Schema lock-in
- [x] Walked through `PROJECT_BRIEF.md` §5 schema
- [x] No fields removed; `yield_type` / `yield_unit` added pre-launch
- [x] **Delivered:** `data/recipes/_schema.json` + `chicken-larb-isaan.json` as the seed

### Session 0.2 — Visual components mockup
- [x] HTML mockup in Iron & Paper style
- [x] 5 screens × 2 viewports (mobile 390 / desktop 1024)
- [x] **Delivered:** `_design/cookbook-design-v1.html.html` (everything every screen and component built from this)

### Session 0.3 — Architecture + repo seed
- [x] Folder structure per `PROJECT_BRIEF.md` §4 (with `insights/` added for Stats)
- [ ] ~~`STRUCTURE.md`~~ — never written. Implicit in this file's snapshot block.
- [x] Deploy: own apex via Vercel (`mise-and-plan.vercel.app`). Custom domain not configured.

---

## PHASE 1 · MVP BUILD

### Session 1.1 — Repo + scaffolding ✅
- [x] `git init`, GitHub repo
- [x] Vercel connected, push-to-deploy live
- [x] `index.html` shell with nav (Cookbook · Plan · Shop · Stats), masthead, gridpaper substrate
- [x] `src/core/design.css` ported from Visual System
- [x] **Live URL** returns a styled page

### Session 1.2 — Recipe list view ✅ (rebuilt twice)
- [x] First pass: minimal cards
- [x] Second pass: full spec §01 — browse rail (sticky, 8 tiles), filter chips with live counts, sort dropdown, search input, card grid (1/2/3-col responsive)
- [x] Cards show cuisine-tinted photo placeholder, NEW/FAV/×N COOKED stamps, red-mono category line, sub line with cook history, 4-col macro strip with protein in iron-red
- [x] Browse-rail sticky on scroll
- [x] Sort options: Most cooked (default), Recently added, Highest protein, Quickest, A-Z
- [x] Click card → `#/cookbook/recipe/:id`
- [x] **Live:** all recipes visible as filterable, sortable cards

### Session 1.3 — Recipe detail view + Cook mode ✅
- [x] Full page: hero with cuisine tint + ⋯ menu + ★ favorite, tag row (first iron-red filled), 44/64px title, mono sub line, big macro row with iron-red protein cell
- [x] Servings scaler (mobile: own bar; desktop: in head-side aside)
- [x] Ingredients grouped by category with protein header in iron-red, qty + item + prep + tip per row, oil-cap tips in safety-yellow
- [x] Substitution toggle cards with delta chips (semantic up/down/neutral coloring) — live mutate macros + ingredient list
- [x] Numbered steps with iron-red 48/64px num, timer-tag if `timer_min` set
- [x] Notes block with iron-red left border
- [x] Serves-with mini-cards
- [x] Sticky action bar with iron-red 2px top border, Add to Plan + Cook Now
- [x] Cook mode (§03) at `#/cookbook/recipe/:id/cook` — paper-on-iron inversion, 120/168px iron-red step number, progress bar, timer per step, swipe / arrow keys / space nav, Screen Wake Lock, beep + vibrate + system notification on timer fire, "Mark as cooked ✓" on last step
- [x] **Live:** can follow a recipe end-to-end on phone

### Session 1.4 — Filters + search ✅
- [x] (Replaced by 1.2-redo) Filters live in the cookbook list bar: chip filters with live counts (high-protein, quick, gluten-free, dairy-free, low-carb, vegetarian), browse-rail as "big filter", search input, sort
- [x] Free-text search across title + ingredients + tags + cuisine. AND across whitespace-separated terms.
- [x] State in URL hash: `#/cookbook?browse=thai&q=salmon&chips=gluten-free&sort=protein`
- [x] **Live:** "thai high-protein <20 min" reachable in two taps

### Session 1.5 — Seed library (15 recipes) ✅
- [x] 15 recipes, all schema-validated, all 50–60g protein, all ≤1 tsp added oil per serving
- [x] Mix: 6 lunch/dinner · 3 breakfast · 3 batch · 3 guilty-pleasure
- [x] Cuisine spread: 5 thai · 4 korean · 4 fusion · 1 vietnamese · 1 indian
- [x] **Live:** cookbook is populated

### Session 1.6 — PWA wrapper ✅
- [x] `manifest.webmanifest` + 3 icons (192, 512, maskable-512) — Iron & Paper geometric mark, no font dependency
- [x] Service worker (`sw.js`): 3 caches (shell / data / fonts); precaches every recipe JSON on install via `_index.json`; SPA fallback to `/index.html` for offline navigation
- [x] **Live:** installable, offline-capable
- [ ] "Add to Home Screen" tested on iOS Safari — needs Stephan to confirm

> **Phase 1 = the cookbook is real and usable.** Original gate: "pause, cook 2 weeks." Skipped by user demand; that gate is still legitimately open.

---

## PHASE 2 · INTEGRATION

### Session 2.1 — Planner module ✅
- [x] `src/planner/planner.js` — week view, 7 days starting Monday of chosen week
- [x] Per-day card: date, macro totals (P/K/C/F summed across entries × servings), recipe rows with "✓ cooked" toggle + remove, "+ Add recipe" button
- [x] Today's card iron-red top border; past days dim 65%
- [x] Header nav: ← Prev / Today / Next → via `?w=` offset
- [x] **"Add to Plan"** button on recipe detail opens a 7-day date picker modal (also from planner module)
- [x] Per-day "+ Add recipe" opens a search-filterable recipe picker (merges user-recipes with seed)
- [x] Cooked toggle calls `storage.markCooked()` → cook_count/last_cooked propagate to cookbook stamps + sub lines
- [x] **Bonus (testability):** weekly macro totals strip above the week — Week protein · kCal · Carbs · Fat · Avg P/day

### Session 2.2 — Shopping list generator ✅
- [x] `src/shopping/shopping.js` — aggregates ingredients across planned days
- [x] Range toggle: Next 3 / Next 7 / This week / All planned (URL `?r=`)
- [x] Skips entries already marked `cooked` AND skips ingredients flagged `optional: true`
- [x] Smart unit aggregation: g+kg→kg, ml+l→l, tsp+tbsp combined ("2 tbsp + 1 tsp" when not a round multiple)
- [x] Grouped by category (protein → produce → pantry → dairy → frozen → spice → other)
- [x] Checkbox state persists per-range in `mp:shopping:checked:<r>`
- [x] "From: Recipe A · Recipe B" source line per row
- [x] **Bonus:** manual item adder (text + qty + category) persisted to `mp:shopping:manual`, lives across ranges
- [x] **Bonus:** Copy as text button — plaintext with `[x]`/`[ ]` checkboxes → clipboard
- [x] **Bonus:** Print button + `@media print` stylesheet (zwart-op-wit, iron-red kept on protein)

### Session 2.3 — Recipe creation form ✅
- [x] `src/cookbook/recipe-form.js` — single form for new (`#/cookbook/new`) and edit (`#/cookbook/edit/:id`)
- [x] Sections per spec §04: Basics (title, subtitle, cuisine, servings, meal-type multi-chips, diet-flags multi-chips, free-tag input), Time (prep/cook/auto-summed total), Macros/serving, Ingredients row-builder, Substitutions row-builder, Method row-builder, Notes
- [x] Mobile: single col. Desktop: 2-col.
- [x] **Paste from Claude:** reads clipboard, JSON.parse, overrides form state
- [x] Live total-time auto-sum (prep + cook)
- [x] Macro-delta freeform parser for subs ("+40 kcal, -3 P" → `{kcal: 40, protein_g: -3}`)
- [x] Validation on save: title, servings, protein, kcal, ≥1 ingredient, ≥1 step
- [x] Save → writes to `mp:user-recipes:<slug>`, navigates to detail
- [x] Save + JSON → downloads `<id>.json`
- [x] Edit a seed recipe → overrides seed via user-recipes layer (loadRecipe checks user first)
- [ ] ~~Macro auto-calc from ingredient quantities (foodDatabase)~~ — deferred. Would require a Thai-supermarket food database with per-100g macros, which doesn't exist in this codebase. Manual entry stands.

### State persistence (gap closed between Phase 1 and Phase 2)
Not in the original roadmap but the cookbook couldn't actually feel alive without it.
- [x] `mp:recipe-state:<id>` = `{ favorite, cook_count, last_cooked }`
- [x] Star toggle on detail → persists. Mark as cooked in cook mode → increments cook_count + sets last_cooked.
- [x] cookbook.loadRecipe layers user state on every read so cards reflect changes immediately

---

## PHASE 3 · NICE-TO-HAVES

Original ordering was "rough order of probable value." I shipped the 3 that the Phase 1+2 work made trivial; the other 3 stay deferred until dogfooding shows they're actually wanted.

- [x] **Cooking timers with system notifications (vibrate, beep)** — beep (Web Audio synth) + vibrate + Notification API. Permission requested lazily on first timer-start (real user gesture).
- [ ] **Photo upload per recipe** — deferred. Needs IndexedDB (localStorage too small for compressed JPGs), client-side compression, image-storage strategy. Speculative without an actual photo Stephan wants on a specific recipe.
- [ ] **Recipe import from URL** — deferred. Needs either a server-side scraper or an AI extraction pass. Speculative; in practice "paste from Claude" already covers the AI-extraction path.
- [x] **"Cook this again" pinning** — recipes with `cook_count >= 3` always sort to the top of the cookbook, regardless of active sort.
- [ ] **Variant tracking** — deferred. Needs a per-cook history (date, variant name, notes), which is a real data model. Wait for dogfooding to show this matters.
- [x] **Print/PDF export** — `@media print` stylesheets for recipe detail AND shopping list. `Cmd-P` / `Ctrl-P` from any of those views produces clean paper-friendly output.

---

## ◆ PHASE 2.5 · STATS / INSIGHTS (added outside original plan)

The roadmap mentioned "insights" as a future module placeholder in `PROJECT_BRIEF.md`, but no session was scoped. Built as a testability foundation so all 4 nav tabs are real screens.

- [x] `src/insights/insights.js` at `#/stats`
- [x] Range toggle: Last 7 / 30 / 90 days / All time
- [x] 4 stat tiles: total cooks · avg protein/cook-day · day streak · unique recipes
- [x] Daily protein bars (last 14 days, CSS-only)
- [x] Most-cooked top 5 (linked to recipe detail)
- [x] Cuisine mix bars (only when ≥2 cuisines cooked)
- [x] Cook streak walks back from today; allows a grace day if today has nothing cooked yet
- [x] Empty state when range has zero cooks
- [x] Derives everything from existing planner data + recipe-state — no new persistence layer

---

## PHASE 4 · CLOUD (only if needed)

**Trigger condition NOT MET.** Stephan still uses one device (phone + laptop accessing the same Vercel deploy doesn't count — those don't need editing handoff). Yamin not using it yet.

When triggered:
- [ ] Pick stack: Cloudflare D1 (cheap, same ecosystem) vs Supabase (richer auth)
- [ ] Migrate localStorage → cloud table, same schema
- [ ] Add minimal auth (magic link, no password)
- [ ] Conflict resolution: last-write-wins for v1

---

## WORKING RHYTHM

- **Each session = one deliverable a user can see/use.** No "this session was infrastructure" sessions. ✓ Held throughout.
- **Commit per session minimum.** Branch per phase, merge when phase ends. → Used `main` only; no branching. Fine for one-user solo work; reconsider when Yamin joins.
- **Cook from it as you build.** → This one slipped. Phase 1 → Phase 2 → Phase 3 shipped without any real cooking out of the cookbook in between. Real-use feedback is now the bottleneck, not code.
- **Stuck > 30 min on something = step back, ask in chat (here), then return to Cursor.** ✓ Held.
- **No new features in Phase 1.** ✓ Held — Phase 3 items were noted, not built, until Phase 2 was complete.

---

## ◆ NEXT — the actually-honest version

Three options Stephan can pick from. All assume a stable code base (which is true).

1. **Cook from it for 2 weeks.** Original roadmap gate, still legitimately open. Real bugs, real missing features, real edge cases will surface. Resume building from those.
2. **Polish from observed issues** *(after some dogfooding)*. Likely candidates from what we already know:
   - "Add to Home Screen" verification on iOS Safari
   - Detail page back link could be smarter (always include filter state, even when user typed URL directly)
   - Planner: drag-or-tap servings adjuster per entry (currently uses recipe default)
   - Shopping: optional-ingredient toggle ("include optionals")
   - Form: drag-reorder for row-builders
3. **Phase 3 leftovers** *(if dogfooding shows they're needed)*. In order: photo upload → variant tracking → URL recipe import. Each is its own session.

There is no fourth "build more speculative stuff" option in this roadmap.
