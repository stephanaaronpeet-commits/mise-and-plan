# STRUCTURE.md
## Repo tree, deploy plan, migration order

> Output of Session 0.3. Two open decisions resolved with reasoning + recommendation. Decisions become final when Stephan confirms.

---

## DECISION 1 · Build order

**Question:** Cookbook first, or wait until other modules exist?

### → Decision: **Cookbook first.** It's the only module that exists right now. Planner, shopping, insights are placeholders in the architecture, built when there's a real need. No migration to worry about — we're starting from a blank repo.

---

## DECISION 2 · Deploy strategy

**Question:** Where does the app live on the public internet?

### Option A — **Subroute** (`miseandplan.com/cookbook`, `miseandplan.com/plan`)  *(recommended)*
- One Cloudflare Pages project, one deploy, one domain.
- Hash-based routing inside the SPA: `miseandplan.com/#/cookbook/recipe/chicken-larb`
- All modules share localStorage, service worker, fonts, design tokens — for free.

**Why this:**
- Matches the "one app, multiple tabs" architectural decision in `PROJECT_BRIEF.md` §4.
- Single PWA install on the phone — opens to last-used tab. iOS handles this well.
- One service worker caches everything. Offline behaviour is dead-simple.
- One Cloudflare project to maintain. No DNS gymnastics.

### Option B — Subdomain (`cookbook.miseandplan.com`)
- Two separate Cloudflare Pages projects, two builds, two service workers.
- Cross-subdomain localStorage requires explicit `postMessage` plumbing — annoying.
- Two PWA installs on the phone, two icons.

**Why not this:**
- Defeats the "one app" decision. Recipes can't talk to the planner without extra wiring.
- Two service workers = two offline caches = two sources of staleness.
- Only valuable if Cookbook and M&P planner were going to be separately deployable or separately owned — which they're not.

### → Decision: **A — Subroute.** Hash routing inside one SPA. URL is `miseandplan.com/#/cookbook/...`

---

## FINAL REPO TREE (locked for Phase 1)

```
mise-and-plan/
├── PROJECT_BRIEF.md            # why + what (read-once)
├── ROADMAP.md                  # phases + sessions (living)
├── CLAUDE.md                   # Claude Code working rules
├── STRUCTURE.md                # this file
│
├── index.html                  # app shell: <head>, nav, <main id="app">
├── manifest.webmanifest        # PWA install config
├── sw.js                       # service worker — caches shell + recipes + fonts
├── icon-192.png                # PWA icons
├── icon-512.png
├── icon-maskable-512.png
│
├── src/
│   ├── core/
│   │   ├── design.css          # Iron & Paper tokens + base components
│   │   ├── storage.js          # localStorage wrapper, schema versioning, migrations
│   │   ├── router.js           # hash-based routing: parse #/cookbook/recipe/:id
│   │   └── nav.js              # top tab bar, active state
│   │
│   ├── cookbook/
│   │   ├── cookbook.js         # module entry, renders into <main>
│   │   ├── recipe-card.js      # card component (used in list + planner)
│   │   ├── recipe-detail.js    # detail view + cooking mode
│   │   ├── filters.js          # filter chips, search, URL-hash sync
│   │   ├── macro-badge.js      # shared 4-cell macro display
│   │   ├── ingredient-row.js   # checkable ingredient row
│   │   ├── step-row.js         # numbered step with optional timer
│   │   ├── sub-card.js         # substitution toggle card
│   │   ├── empty.js            # empty + loading states
│   │   └── seed.js             # first-run: load /data/recipes/*.json → localStorage
│   │
│   ├── planner/                # MIGRATED HERE in Phase 2.1, empty for Phase 1
│   ├── shopping/               # Phase 2.2
│   └── insights/               # Phase 3+
│
└── data/
    ├── recipes/
    │   ├── _schema.json        # JSON-schema, validated on every write
    │   ├── _index.json         # generated: [{id, title, tags, ...}] for fast list-view loads
    │   ├── chicken-larb-isaan.json
    │   ├── beef-pad-krapow.json
    │   └── ...                 # one file per recipe, slug = filename
    │
    └── images/
        ├── chicken-larb-isaan.jpg
        └── ...                 # optional, compressed, referenced by recipe.image
```

### File-size discipline
- Any JS module >300 lines → split.
- `design.css` is allowed to grow; it's the only stylesheet.
- Recipe JSON files: avg ~3KB each. 100 recipes = ~300KB. Trivially cacheable.

### What lives where — quick reference
| Concern                    | File                                  |
|----------------------------|---------------------------------------|
| Add a new design token     | `src/core/design.css`                 |
| Change route logic         | `src/core/router.js`                  |
| Add localStorage migration | `src/core/storage.js` (bump schema_v) |
| Modify recipe rendering    | `src/cookbook/recipe-detail.js`       |
| Add a filter type          | `src/cookbook/filters.js`             |
| Add a new recipe           | `data/recipes/<slug>.json`            |
| Schema change              | `data/recipes/_schema.json` + migration in storage.js |

---

## DEPLOY PIPELINE

```
Local edit (Cursor) ──► git commit ──► git push ──► Cloudflare Pages auto-build
                                                       │
                                              [ static site published ]
                                                       │
                                          miseandplan.com  (production)
```

- **Hosting:** Cloudflare Pages, free tier, custom domain `miseandplan.com`
- **Build command:** none. It's static HTML/CSS/JS, no transpile.
- **Branch strategy:**
  - `main` → production (auto-deploy on push)
  - `phase-2`, `phase-3` → feature branches, preview URLs auto-generated by Cloudflare
- **DNS:** Cloudflare-managed. SSL auto.

---

## ROUTING TABLE (hash-based, no server config needed)

| URL                                            | What it shows                    |
|------------------------------------------------|----------------------------------|
| `/`                                            | redirect → `#/plan` (default tab)|
| `#/plan`                                       | Planner (Phase 2)                |
| `#/plan/2026-05-12`                            | Planner for a specific day       |
| `#/cookbook`                                   | Recipe list                      |
| `#/cookbook?tag=thai&min_protein=50`           | Recipe list, filters in hash     |
| `#/cookbook/recipe/chicken-larb-isaan`         | Recipe detail                    |
| `#/cookbook/recipe/chicken-larb-isaan/cook`    | Cooking mode (full-screen)       |
| `#/shop`                                       | Shopping list (Phase 2)          |
| `#/stats`                                      | Insights (Phase 3+)              |

Filters in the URL hash = shareable, back-button-friendly, restored on reload. Worth the tiny bit of plumbing.

---

## OFFLINE STRATEGY

Service worker caches three buckets:

1. **App shell** — `index.html`, all `src/**/*.js`, `src/core/design.css`. Versioned by build hash. Cache-first.
2. **Recipe data** — `data/recipes/*.json` + `_index.json`. Stale-while-revalidate (use cache, fetch in background, update next load).
3. **Fonts** — Google Fonts CSS + font files. Cache-first, 1 year TTL.

**What doesn't get cached:** nothing yet, no external APIs in Phase 1.

**Cache busting:** `sw.js` bumps a `CACHE_NAME` constant on every release. Old caches deleted on activate.

---

## OPEN QUESTIONS (resolved)

1. **Domain:** Starting on Cloudflare's free `*.pages.dev` subdomain. Custom domain can be wired up any time later — zero-cost decision to defer.
2. **Existing planner / tracker code:** Doesn't exist yet. Cookbook is module #1. Other modules (`src/planner/`, `src/shopping/`, `src/insights/`) stay as empty folders until needed — the architecture is ready for them.
