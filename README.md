# Mise & Plan

> Eat to train. Train to eat. A personal cookbook + meal planning system for high-protein Thai-supermarket cooking. Built as a PWA, no backend, no build step.

**Current state:** Phase 1 in progress. Cookbook module v0.1. Plan / Shop / Stats modules are placeholders.

## For Claude Code

Read these three files first, in order:
1. `CLAUDE.md` — working rules for editing this repo
2. `ROADMAP.md` — which phase / session we're in
3. `PROJECT_BRIEF.md` — the why and what

Then look at `STRUCTURE.md` for the file map.

## For humans

```bash
# Run locally (Python comes with macOS / most Linux)
cd mise-and-plan
python3 -m http.server 8080
# open http://localhost:8080
```

The site is a static PWA. No build, no transpile, no npm. Edit a file, refresh the browser.

## Deploy

Auto-deployed to Cloudflare Pages on every push to `main`.
- Production: (set after first deploy)
- Build command: none (static)
- Output directory: `/`

## Adding a recipe

1. Copy an existing JSON in `data/recipes/`
2. Rename `<slug>.json` (matches the `id` field)
3. Edit contents — validate against `data/recipes/_schema.json` mentally or via `jsonschema`
4. Add entry to `data/recipes/_index.json`
5. Commit + push → live in ~30s
