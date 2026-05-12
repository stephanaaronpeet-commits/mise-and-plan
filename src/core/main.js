/* =============================================================
   main.js — app entry point
   Boots the router, hydrates nav, mounts the active module.
   ============================================================= */

import { initRouter } from './router.js';
import { initNav } from './nav.js';

initNav();
initRouter();
