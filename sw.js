/* =============================================================
   sw.js — service worker
   Cache strategy:
     - Shell (HTML/JS/CSS):  cache-first, versioned
     - Recipes (data/*):     stale-while-revalidate
     - Fonts (google):       cache-first, long TTL
   Bump CACHE_VERSION on every release to invalidate old caches.
   ============================================================= */

const CACHE_VERSION = 'mp-v0.1.0';
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
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL_ASSETS))
  );
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

  // Same-origin app shell — cache-first, fallback to network
  if (url.origin === location.origin) {
    e.respondWith(cacheFirst(e.request, SHELL_CACHE));
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
  } catch (e) {
    if (hit) return hit;
    throw e;
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
