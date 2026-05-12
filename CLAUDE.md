# CLAUDE.md
## Working rules for Claude Code in this repo

> This file is auto-loaded by Claude Code as context for every session. Don't bloat it. Update it when patterns change.

---

## WHO THIS PROJECT IS FOR

One user: **Stephan**. Dutch, lives in Bangkok, Google Ads specialist (not a developer). He reads code fine but doesn't write it daily. Talk to him like a peer building a tool together, not like a student.

**Communication style with Stephan:**
- Bullets over paragraphs. Direct.
- Lead with impact: "shaves 80ms off load" not "I improved performance"
- Have opinions, challenge bad ideas with reasoning
- If he asks to do X but data/code says Y is wrong — push back, show why
- Suggest the next step after every task
- He speaks Dutch when he's correcting or giving ground truth; respond in the language he's using

---

## NON-NEGOTIABLES

### Design system
- Iron & Paper aesthetic. See `src/core/design.css` for tokens.
- **Iron-red `#C2331E` is reserved for protein only.** Don't use it for buttons, links, or other accents. If something needs emphasis and isn't protein, use border-weight, hatching, or mono-type instead.
- Display font: Barlow Condensed, always UPPERCASE for headings.
- No emojis, no drop shadows, no gradients. Borders, hatching, and "stamps" only.
- Graph-paper backgrounds are the signature substrate — use them.

### Recipe content rules (when generating or validating recipes)
1. Ingredients must be findable in Thai supermarkets (Tops, Big C, Lotus's, Villa, 7-Eleven, fresh markets). Avoid Western-only items: feta, dill, ricotta, parsley, tahini, sour cream.
2. Rice = ready-made microwave packs. Never raw rice.
3. Prefer pastes/mixes (Thai curry pastes, gochujang, garam masala, oyster/fish/soy/sriracha) over loose spice combinations.
4. Max ~1 tsp oil per serving. Non-stick / steam / grill defaults.
5. **50–60g protein per serving, every recipe.** No exceptions.

### Code style
- Vanilla JS, no frameworks. No React, no Vue, no build step. ES modules + native DOM.
- One file per concern. If a JS file passes 300 lines, split it.
- CSS in `src/core/design.css`. Component-specific CSS lives in `<style>` blocks at top of the JS module that owns it.
- No CSS frameworks. No Tailwind. The design system is hand-rolled and intentional — don't replace it.
- No npm dependencies in Phase 1. If you reach for one, stop and discuss with Stephan first.

### Data
- Recipe schema is in `data/recipes/_schema.json`. Validate against it on every write.
- One JSON file per recipe. Slug = filename = id.
- localStorage key prefix: `mp:` (e.g. `mp:recipes`, `mp:planner:2026-05-12`). Never collide with other apps.
- Schema version field is sacred. Bump it, write a migration, never silently change shape.

### File hygiene
- The nutrition tracker (separate project) uses **full file rewrites, never `sed`** for HTML edits. Same rule applies here for any HTML containing tables or deeply-nested structure.
- After any file edit that the user should review, end with the file path and a one-line summary of what changed.
- Don't create files Stephan didn't ask for. No README boilerplate, no LICENSE, no `.editorconfig` — unless he asks.

---

## WORKFLOW DEFAULTS

### Before starting a task
- Re-read `ROADMAP.md` to confirm which session/task we're in
- Don't skip ahead. If a task feels too small, do it anyway — momentum > scope.

### When generating recipes
- Always: title, subtitle, macros per serving (kcal/protein/carbs/fat/fiber), structured ingredients with `category`, structured steps, substitutions if obvious.
- Validate macros: protein must be 50–60g. If a recipe naturally lands at 45g, scale the protein portion up — don't lower the target.
- Cite the macro source mentally (USDA-ish defaults). Don't invent precise micronutrients we can't verify.
- One recipe at a time unless Stephan asks for a batch. Batches of 5 max.

### When stuck or ambiguous
- Ask **one** clarifying question with **2–4 concrete options**, never open-ended.
- If Stephan's request conflicts with the design system or content rules, raise it: *"You asked for [X] but the design rule says [Y]. Options: (a) keep [X] and update the rule, (b) do [Y] instead, (c) hybrid: ..."*
- Default to shipping the simplest version that meets the success criteria in `PROJECT_BRIEF.md` §7.

### When suggesting next steps
- Always end a task with: "Next: [specific next deliverable from ROADMAP]"
- If the next step on the roadmap is genuinely lower-value than something else you noticed → say so, recommend the swap, let Stephan decide.

---

## ANTI-PATTERNS — don't do these

- ❌ Adding a feature "while we're here" that's not on the roadmap. Note it in `ROADMAP.md` Phase 3, move on.
- ❌ Rewriting `design.css` to "improve" it. The system is decided. Tweaks need an explicit ask.
- ❌ Generating recipes with rice cooked from raw, Western-only ingredients, or <50g protein.
- ❌ Generic-AI-aesthetic UI: rounded corners everywhere, soft shadows, pastel gradients, emoji icons.
- ❌ Telling Stephan to "configure" or "install" something without giving him the exact command/click path.
- ❌ Long explanatory prose when a 5-bullet summary works.
- ❌ Agreeing with a bad idea to be polite. Push back with numbers/reasoning.

---

## REPO MAP (current state)

```
mise-and-plan/
├── PROJECT_BRIEF.md         # the why and what — read once
├── ROADMAP.md               # phased plan — living doc, check off as you go
├── CLAUDE.md                # this file — working rules
├── STRUCTURE.md             # (Session 0.3) repo tree + deploy plan
├── index.html               # app shell, nav, tab switching
├── manifest.webmanifest     # PWA install metadata
├── sw.js                    # service worker
├── src/
│   ├── core/
│   │   ├── design.css
│   │   ├── storage.js
│   │   └── router.js
│   ├── cookbook/            # the current build
│   ├── planner/             # future migration
│   ├── shopping/            # Phase 2
│   └── insights/            # later
└── data/
    └── recipes/
        ├── _schema.json
        └── *.json           # one per recipe
```

---

## QUICK REFERENCE — the protein rule

The hardest constraint: every recipe is 50–60g protein per serving. Rough per-100g protein content for common Thai-supermarket items:

| Item                  | Protein/100g |
|-----------------------|--------------|
| Chicken breast (raw)  | 23g          |
| Chicken thigh (raw)   | 20g          |
| Beef sirloin (raw)    | 22g          |
| Pork tenderloin (raw) | 21g          |
| Salmon fillet         | 20g          |
| Shrimp (raw, peeled)  | 24g          |
| Eggs (whole, 1 large) | 6g           |
| Egg whites (1 large)  | 4g           |
| Greek yogurt (0%)     | 10g          |
| Cottage cheese        | 11g          |
| Firm tofu             | 14g          |
| Tempeh                | 19g          |
| Whey isolate (1 scoop)| 25g          |

Rule of thumb: ~250g raw lean meat per serving lands in the 50–60g protein zone. Tofu/tempeh needs supplementation (egg, dairy, or whey) to hit target.
