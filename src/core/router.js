/* =============================================================
   router.js — hash-based routing
   Routes:
     #/cookbook            → list view
     #/cookbook/recipe/:id → detail view
     #/cookbook/recipe/:id/cook → cooking mode
     (plan / shop / stats are placeholders for later modules)
   ============================================================= */

const mount = document.getElementById('app');

/* Map route prefix → loader function.
   Loaders return a render(params) function. They are imported lazily
   so each module is only fetched when actually visited. */
const routes = {
  cookbook: () => import('../cookbook/cookbook.js').then(m => m.render),
  plan:     () => import('../planner/planner.js').then(m => m.render),
  shop:     () => import('../shopping/shopping.js').then(m => m.render),
  stats:    () => import('../insights/insights.js').then(m => m.render),
};

function parseHash() {
  const raw = (location.hash || '#/cookbook').replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const segments = path.split('/').filter(Boolean);
  const module = segments[0] || 'cookbook';
  const rest = segments.slice(1);
  const params = Object.fromEntries(new URLSearchParams(query));
  return { module, rest, params };
}

async function render() {
  const { module, rest, params } = parseHash();

  // Highlight the active tab
  document.querySelectorAll('#app-nav button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.route === module);
  });

  // Disabled tab clicked? Keep them on cookbook.
  if (!routes[module]) {
    mount.innerHTML = `
      <div class="empty">
        <div class="icon-frame"></div>
        <div class="title-row">Not built yet</div>
        <div class="sub">This module is on the roadmap but not live. Come back when it ships.</div>
        <a href="#/cookbook" class="action" style="text-decoration:none; display:inline-block;">← Back to Cookbook</a>
      </div>`;
    return;
  }

  // Loading state
  mount.innerHTML = `
    <div style="padding: 32px 16px; display:flex; flex-direction:column; gap:14px;">
      <div class="skeleton"></div>
      <div class="skeleton"></div>
      <div class="skeleton"></div>
    </div>`;

  try {
    const renderFn = await routes[module]();
    await renderFn({ mount, rest, params });
  } catch (err) {
    console.error('[router] render failed:', err);
    mount.innerHTML = `
      <div class="empty">
        <div class="title-row">Something broke</div>
        <div class="sub">${err.message}</div>
        <button class="action" onclick="location.reload()">Reload</button>
      </div>`;
  }
}

export function initRouter() {
  window.addEventListener('hashchange', render);
  if (!location.hash) location.hash = '#/cookbook';
  render();
}
