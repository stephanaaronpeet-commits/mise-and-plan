# MISE & PLAN — COOKBOOK MODULE
## Project Brief

> The single-source-of-truth for what this project is, why it exists, and the decisions already made. Read this first. Update it when scope changes — not when implementation changes.

---

## 1 · WHAT THIS IS

A personal cookbook built into **Mise & Plan** (the existing meal planner / day-planner app). One codebase, one URL, one mobile install. Recipes live next to the planner and shopping list — they share data, design, and deployment.

**Not** a public recipe site. **Not** a social cookbook. **Not** a content product. This is Stephan's personal kitchen operating system, scaled to last years.

---

## 2 · WHY IT EXISTS

Stephan currently:
- Wants to keep cooking high-protein, Thai-supermarket-realistic meals
- Loses recipes constantly (chat logs, notes apps, memory)
- Has no fast way to go from "what shall I cook" → "what do I need to buy"
- Has a visual design system for Mise & Plan but no code yet — this is the first real build

The Cookbook is module #1 of the Mise & Plan ecosystem. Other modules (planner, shopping list, insights/tracker) are placeholders in the architecture, to be built later as needs emerge. The system is designed so they can plug in without a rewrite:

```
RECIPE ──┬──► PLANNER         (future — assign to a day/meal)
         ├──► INSIGHTS/TRACKER (future — auto-counts protein/kcal)
         └──► SHOPPING LIST   (future — auto-generates ingredients)
```

Every recipe is structured data first, prose second. That's what makes the future integrations possible without re-entering anything.

---

## 3 · DESIGN CONSTRAINTS (non-negotiable)

These are already decided. Don't relitigate.

### Visual
- **Iron & Paper** aesthetic from the Mise & Plan Visual System
- Iron stack (pig-iron `#0B0B0C` → steel) for surfaces
- Paper stack (butcher-cream `#F2EFE6`) for text/cards
- Iron-red `#C2331E` is the *only* accent — reserved for **protein** specifically
- Display: Barlow Condensed (900 weight, UPPERCASE, tight letter-spacing)
- Body: Archivo
- Mono: JetBrains Mono — for labels, codes, numbers, "stamps"
- Graph-paper backgrounds (`.gridpaper`) as the signature substrate
- No emojis. No drop shadows. No gradients. Borders, hatching, and stamps only.

### Recipe content rules
- Ingredients must be **findable in Thai supermarkets** (Tops, Big C, Lotus's, Villa, 7-Eleven, fresh markets). No Western-only items (feta, dill, ricotta, parsley, tahini, sour cream).
- **Rice** is always ready-made microwave packs. Never cooked from raw.
- Prefer **pastes/mixes** over loose spices (Thai curry pastes, gochujang, garam masala, oyster/fish/soy/sriracha).
- Max **~1 tsp oil per serving**. Non-stick, steam, or grill defaults.
- Every recipe is **50–60g protein per serving**.

### Platform
- **PWA** — installable on iOS + Android, also runs in any desktop browser
- **Mobile-first** — the in-kitchen experience is the primary one
- **Offline-capable** — service worker caches everything, recipes survive shitty wifi
- **Hosted on Cloudflare Pages**, custom subdomain (`cookbook.miseandplan.com` or as a route within the main M&P app)
- **No backend** initially. All data lives in the browser (localStorage + JSON files in repo). Sync deferred until clearly needed.

---

## 4 · ARCHITECTURE DECISIONS

### One app, multiple tabs
Mise & Plan grows into a multi-module app. Cookbook is module #1 (after the planner itself).

```
mise-and-plan/
├── index.html               # shell: nav, tab switching, shared header
├── manifest.webmanifest     # PWA install metadata
├── sw.js                    # service worker (offline cache)
├── src/
│   ├── core/
│   │   ├── storage.js       # localStorage wrapper, schema versioning
│   │   ├── design.css       # the Iron & Paper system (variables, type, components)
│   │   └── router.js        # hash-based routing between modules
│   ├── planner/             # existing M&P planner — to be migrated in
│   ├── cookbook/
│   │   ├── cookbook.js
│   │   ├── recipe-card.js
│   │   ├── recipe-detail.js
│   │   ├── filters.js
│   │   └── seed.js          # imports starter recipes on first run
│   ├── shopping/            # future module
│   └── insights/            # future module
└── data/
    └── recipes/
        ├── _schema.json     # JSON schema for validation
        ├── chicken-larb.json
        ├── beef-pad-krapow.json
        └── ...
```

### Recipe storage strategy
- **Source of truth:** `data/recipes/*.json` files in the Git repo, one file per recipe.
- **Runtime:** seeded into localStorage on first visit. User edits write back to localStorage.
- **Future:** an export button writes localStorage back to JSON files (manual sync). Real cloud sync is a Phase 4 problem.

### Why no backend
- Stephan is solo user. No login, no sharing, no multi-device sync needed *yet*.
- Git history = backup + version control.
- Cloudflare Pages = free, fast, zero ops.
- The day a backend is needed (e.g. Yamin starts using it, or true cross-device sync), Cloudflare D1 or Supabase is one Phase away. The schema doesn't change — only where it's stored.

---

## 5 · THE RECIPE SCHEMA (proposal — to be ratified in Session 1)

This is the single most important decision. Everything downstream depends on it. Open for revision in Session 1, locked thereafter.

```jsonc
{
  "id": "chicken-larb-isaan",           // slug, unique, URL-safe
  "schema_version": 1,                  // bump when schema changes
  "title": "Chicken Larb (Isaan-style)",
  "subtitle": "Northeastern Thai. 5 min prep, 10 min cook.",
  "image": "chicken-larb.jpg",          // optional, path under /data/images/
  "created": "2026-05-12",
  "updated": "2026-05-12",
  "source": "personal",                 // "personal" | "adapted-from:url" | "import:url"

  // Discoverability
  "tags": ["thai", "high-protein", "quick", "no-rice-option"],
  "cuisine": "thai",
  "meal_type": ["lunch", "dinner"],     // breakfast | lunch | dinner | snack
  "diet_flags": ["gluten-free", "dairy-free"],

  // Planning math
  "servings": 2,                        // recipe yields this many portions
  "time": {
    "prep_min": 5,
    "cook_min": 10,
    "total_min": 15
  },

  // Per-serving macros — required, never optional
  "macros_per_serving": {
    "kcal": 480,
    "protein_g": 55,
    "carbs_g": 18,
    "fat_g": 18,
    "fiber_g": 4
  },

  // Ingredients — structured, never plain text
  "ingredients": [
    {
      "qty": 300,
      "unit": "g",
      "item": "chicken breast",
      "prep": "minced",
      "category": "protein",            // protein | produce | pantry | dairy | frozen | other
      "thai_market_tip": "ask butcher to mince, faster than home-mincing",
      "optional": false
    },
    {
      "qty": 1,
      "unit": "tbsp",
      "item": "fish sauce",
      "category": "pantry",
      "optional": false
    },
    {
      "qty": 1,
      "unit": "tsp",
      "item": "neutral oil",
      "category": "pantry",
      "optional": false,
      "note": "oil cap — do not exceed"
    }
  ],

  // Substitutions — first-class, not an afterthought
  "substitutions": [
    {
      "swap_out": "chicken breast",
      "swap_in": "firm tofu",
      "ratio": "1:1",
      "macro_delta": { "protein_g": -25, "fat_g": +6 },
      "note": "press tofu, crumble, pan-fry until crispy"
    }
  ],

  // Steps — short, imperative, kitchen-readable on mobile
  "steps": [
    {
      "n": 1,
      "text": "Heat 1 tsp oil in non-stick pan, medium-high.",
      "timer_min": null
    },
    {
      "n": 2,
      "text": "Add minced chicken, break up with spatula, cook until no pink.",
      "timer_min": 6
    }
  ],

  // Pairings & extensions
  "serves_with": [
    { "ref": "microwave-jasmine-rice", "note": "if not cutting carbs" },
    { "ref": "iceberg-lettuce-cups",   "note": "low-carb option" }
  ],

  // Notes & history
  "notes": "If using thigh: +3g fat per serving. Stephan prefers breast on cut.",

  // Tracker integration
  "tracker_food_id": "chicken-larb-isaan", // matches the foodDatabase key in nutrition tracker
  "favorite": false,
  "cook_count": 0,                       // increments when "marked cooked" in planner
  "last_cooked": null
}
```

### Why these fields
- **Macros per serving** required → without it, the planner integration fails.
- **Ingredients as objects** (not strings) → enables shopping list aggregation across recipes.
- **Substitutions** structured with macro_delta → swap chicken for tofu and the macros auto-adjust.
- **Category** on each ingredient → shopping list groups by aisle automatically.
- **Steps with optional timer_min** → mobile UI can show countdown buttons inline.
- **tracker_food_id** → cooking a recipe = logging the meal in one tap, no double entry.

---

## 6 · OUT OF SCOPE (for v1)

To prevent feature-creep paralysis:
- ❌ Multi-user / sharing / social
- ❌ Recipe import from URLs (Phase 3 maybe)
- ❌ AI-generated meal suggestions (Phase 4 maybe)
- ❌ Photo upload / camera integration (Phase 2 maybe)
- ❌ Cooking timers as system notifications (Phase 2)
- ❌ Bilingual content (English only for now)
- ❌ Print-friendly views
- ❌ Recipe ratings / 5-star reviews (it's one user, who cares)

---

## 7 · SUCCESS CRITERIA

This project succeeds when:
1. Stephan opens Cookbook on his phone in the kitchen and follows a recipe without scrolling or zooming.
2. Adding a recipe to a planner day auto-fills macros without retyping.
3. The shopping list for "this week" is generated from planned recipes in one tap.
4. The first 20 recipes were added in under 30 min each (including macros).
5. The repo is still buildable and editable 12 months from now.

If those five are true, ship it. Don't gold-plate.
