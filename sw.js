/* =============================================================
   sw.js — service worker
   Cache strategy:
     - Shell (HTML/JS/CSS/icons): cache-first, versioned
     - Recipes (data/recipes/*):  stale-while-revalidate
       Precached on install so 'open on plane mode' works first try.
     - Fonts (google):            cache-first, long TTL
   Bump CACHE_VERSION on every release to invalidate old caches.
   ============================================================= */

const CACHE_VERSION = 'mp-v0.8.0';
const SHELL_CACHE   = `${CACHE_VERSION}-shell`;
const DATA_CACHE    = `${CACHE_VERSION}-data`;
const FONT_CACHE    = `${CACHE_VERSION}-fonts`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/src/core/main.js',
  '/src/core/router.js',
  '/src/core/nav.js',
  '/src/core/storage.js',
  '/src/core/design.css',
  '/src/cookbook/cookbook.js',
  '/src/cookbook/filters.js',
  '/src/cookbook/recipe-detail.js',
  '/src/cookbook/cook-mode.js',
  '/src/cookbook/recipe-form.js',
  '/src/planner/planner.js',
  '/src/shopping/shopping.js',
  '/src/insights/insights.js',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE);
    await shell.addAll(SHELL_ASSETS);

    // Precache the recipe index + every recipe it references.
    // After this completes, opening offline shows all recipes.
    const data = await caches.open(DATA_CACHE);
    try {
      const res = await fetch('/data/recipes/_index.json');
      if (res.ok) {
        await data.put('/data/recipes/_index.json', res.clone());
        const idx = await res.json();
        const paths = idx.map(r => `/data/recipes/${r.id}.json`);
        // Use individual put() so one missing file doesn't fail the whole install
        await Promise.all(paths.map(p =>
          fetch(p).then(r => r.ok ? data.put(p, r) : null).catch(() => null)
        ));
      }
    } catch (e) {
      console.warn('[sw] recipe precache skipped (offline at install?):', e);
    }
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !k.startsWith(CACHE_VERSION)).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Only handle GET. POST/PUT pass through.
  if (e.request.method !== 'GET') return;

  // Fonts (Google Fonts) — cache-first
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(cacheFirst(e.request, FONT_CACHE));
    return;
  }

  // Recipe data — stale-while-revalidate
  if (url.pathname.startsWith('/data/recipes/')) {
    e.respondWith(staleWhileRevalidate(e.request, DATA_CACHE));
    return;
  }

  // Same-origin app shell — cache-first with network fallback,
  // and SPA fallback to /index.html for navigation requests offline.
  if (url.origin === location.origin) {
    e.respondWith(shellHandler(e.request));
    return;
  }
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  } catch (err) {
    if (hit) return hit;
    throw err;
  }
}

async function shellHandler(req) {
  const cache = await caches.open(SHELL_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  } catch (err) {
    // SPA fallback for navigations — return cached index.html
    if (req.mode === 'navigate' || req.destination === 'document') {
      const fallback = await cache.match('/index.html');
      if (fallback) return fallback;
    }
    throw err;
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const fetchPromise = fetch(req).then(res => {
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  }).catch(() => hit);
  return hit || fetchPromise;
}
