# MISE & PLAN — COOKBOOK ROADMAP

> Living document. Check off as you go. Update when reality diverges from plan.
> Anything in **`bold`** is a deliverable Stephan should be able to see/use.

---

## PHASE 0 · FOUNDATION (chat sessions, here in Claude.ai)

The thinking work. Done in chat because it's design + decisions, not code shipping.

### Session 0.1 — Schema lock-in *(this session, after this doc is delivered)*
- [ ] Walk through `PROJECT_BRIEF.md` §5 schema together
- [ ] Stephan flags anything that won't survive contact with reality
- [ ] Add/remove/rename fields
- [ ] **Deliverable:** finalized `_schema.json` with 1 fully-filled example recipe (Thai high-protein staple)

### Session 0.2 — Visual components mockup
- [ ] HTML mockup in Iron & Paper style, single file, no JS
- [ ] Mobile viewport (390px) and desktop (1024px) side by side
- [ ] Components: recipe-card, recipe-detail, filter-bar, ingredient-checkbox, step-timer, macro-badge, substitution-toggle, empty-state, loading-state
- [ ] **Deliverable:** `cookbook-components.html` — visual reference for the build phase

### Session 0.3 — Architecture + repo seed
- [ ] Confirm folder structure from `PROJECT_BRIEF.md` §4
- [ ] Decide: does the existing Mise & Plan code get migrated into the new structure now, or does Cookbook ship first and M&P moves in later?
- [ ] Pick deploy: subroute (`miseandplan.com/cookbook`) vs subdomain (`cookbook.miseandplan.com`)
- [ ] **Deliverable:** `STRUCTURE.md` with final repo tree + deploy plan

---

## PHASE 1 · MVP BUILD (Claude Code in Cursor)

The doing work. Done in Cursor because it's multi-file, Git-tracked, and needs to live somewhere real.

### Session 1.1 — Repo + scaffolding
- [ ] `git init`, GitHub private repo
- [ ] Cloudflare Pages connected, blank deploy live
- [ ] `index.html` shell with nav, empty Cookbook tab visible
- [ ] `design.css` ported from Visual System file
- [ ] **Live URL** returns a styled blank page

### Session 1.2 — Recipe list view
- [ ] Read `data/recipes/*.json` at load (seed into localStorage)
- [ ] Render recipe-cards in grid (desktop) / stack (mobile)
- [ ] Click card → detail view route (`#/recipe/:id`)
- [ ] **Live:** can see all seeded recipes as cards

### Session 1.3 — Recipe detail view
- [ ] Full recipe page: image, macros, ingredients, steps, substitutions
- [ ] Step-by-step "cooking mode" — full screen, one step at a time, swipe to advance
- [ ] Ingredient checkbox state (visual only, doesn't persist yet)
- [ ] **Live:** can follow a recipe end-to-end on phone

### Session 1.4 — Filters + search
- [ ] Filter bar: tags, meal_type, max_time_min, min_protein_g
- [ ] Free-text search across title + ingredients
- [ ] Filter state persists in URL hash (shareable, back-button-friendly)
- [ ] **Live:** can find "thai high-protein <20 min" in two taps

### Session 1.5 — Seed library (15 recipes)
- [ ] Stephan + Claude generate 15 starter recipes following the Thai-supermarket / 50–60g protein rules
- [ ] All validated against `_schema.json`
- [ ] Mix: 6 lunch/dinner, 3 breakfast, 3 batch/meal-prep, 3 "guilty pleasure within macro"
- [ ] **Live:** cookbook feels populated, not empty

### Session 1.6 — PWA wrapper
- [ ] `manifest.webmanifest` with icons (192, 512, maskable)
- [ ] Service worker caches shell + recipes JSON + fonts
- [ ] "Add to Home Screen" works on iOS Safari
- [ ] Offline: open app on plane mode, all 15 recipes still load
- [ ] **Live:** installable, offline-capable

> **End of Phase 1 = the cookbook is real and usable.** Pause, cook from it for 2 weeks. See what breaks. See what's missing. Then continue.

---

## PHASE 2 · INTEGRATION (after 2 weeks of real use)

Now the cookbook talks to the rest of Mise & Plan.

### Session 2.1 — Planner module (greenfield)
- [ ] Build a basic planner module from scratch in `src/planner/`
- [ ] "Add to planner" button on recipe detail
- [ ] Recipe macros flow into planner day's macro totals
- [ ] "Cooked" toggle in planner → increments `cook_count`, sets `last_cooked`

### Session 2.2 — Shopping list generator
- [ ] Select N planned recipes → generate aggregated ingredient list
- [ ] Group by `category` (protein, produce, pantry...)
- [ ] Checkbox-able list, state persists
- [ ] Smart aggregation: 200g chicken + 150g chicken = 350g chicken (same item, same unit)
- [ ] Conflict handling: 1 tbsp soy + 1 tsp soy = "1 tbsp + 1 tsp soy" (don't fake-convert)

### Session 2.3 — Recipe creation form
- [ ] In-app form to add new recipes (no more hand-editing JSON)
- [ ] Macro auto-calc from ingredient quantities (uses tracker's foodDatabase)
- [ ] Export-to-file button (copy JSON to clipboard, manual Git commit)

---

## PHASE 3 · NICE-TO-HAVES (when bored, not before)

In rough order of probable value:
- [ ] Cooking timers with system notifications (vibrate, beep)
- [ ] Photo upload per recipe (compressed, lives in repo)
- [ ] Recipe import from URL (paste a recipe link, AI-extracts to schema)
- [ ] "Cook this again" — recipes you've cooked >3 times pinned to top
- [ ] Variant tracking: cooked larb 5x, log which version each time
- [ ] Print/PDF export of selected recipes (analog backup)

---

## PHASE 4 · CLOUD (only if needed)

Trigger condition: Stephan owns 2+ devices that both need editing, or Yamin starts using it.

- [ ] Pick stack: Cloudflare D1 (cheap, same ecosystem) vs Supabase (richer auth)
- [ ] Migrate localStorage → cloud table, same schema
- [ ] Add minimal auth (magic link, no password)
- [ ] Conflict resolution: last-write-wins for v1

---

## WORKING RHYTHM

- **Each session = one deliverable a user can see/use.** No "this session was infrastructure" sessions.
- **Commit per session minimum.** Branch per phase, merge when phase ends.
- **Cook from it as you build.** Bug reports come from real use, not imagination.
- **Stuck > 30 min on something = step back, ask in chat (here), then return to Cursor.** Chat is for design help, Cursor is for shipping.
- **No new features in Phase 1.** Anything you think of goes in Phase 3 with a one-line note. Phase 1 ships, then we revisit.
