/* =============================================================
   main.js — app entry point
   Boots the router, hydrates nav, mounts the active module,
   and registers the service worker for offline use.
   ============================================================= */

import { initRouter } from './router.js';
import { initNav } from './nav.js';

initNav();
initRouter();

// Service worker — registers after first paint so it doesn't compete
// for bandwidth on initial load. Localhost works without HTTPS.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(e =>
      console.warn('[sw] register failed:', e)
    );
  });
}
