/* =============================================================
   nav.js — top-bar tab interactions
   ============================================================= */

export function initNav() {
  const nav = document.getElementById('app-nav');
  if (!nav) return;
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || btn.disabled) return;
    const route = btn.dataset.route;
    if (!route) return;
    location.hash = `#/${route}`;
  });
}
