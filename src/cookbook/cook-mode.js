/* =============================================================
   cook-mode.js — full-screen cooking flow (§03 of spec).
   Paper-on-iron inversion: cream bg, iron type, gridpaper.
   One step at a time. Timer per step (if timer_min set).
   Swipe / arrow keys / space to navigate. Wake Lock API on enter.
   On "Mark as cooked": persists cook_count + last_cooked.
   ============================================================= */

import { markCooked as persistCooked } from '../core/storage.js';

const css = `
.cook-mode-root {
  position: fixed; inset: 0;
  z-index: 100;
  background: var(--paper-000);
  color: var(--iron-000);
  display: flex; flex-direction: column;
  background-image:
    linear-gradient(to right,  rgba(11,11,12,0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(11,11,12,0.05) 1px, transparent 1px),
    linear-gradient(to right,  rgba(11,11,12,0.10) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(11,11,12,0.10) 1px, transparent 1px);
  background-size: 14px 14px, 14px 14px, 70px 70px, 70px 70px;
  overflow: hidden;
  -webkit-user-select: none; user-select: none;
}
.cook-mode-root .cm-frame {
  flex: 1; display: flex; flex-direction: column;
  width: 100%; max-width: 880px; margin: 0 auto;
}

/* ───── Head ───── */
.cook-mode-root .cm-head {
  padding: 14px 18px 12px;
  border-bottom: 2px solid var(--iron-000);
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px;
}
.cook-mode-root .cm-head .ttl {
  font-family: var(--display); font-weight: 900;
  font-size: 18px; text-transform: uppercase;
  color: var(--iron-000); line-height: 1;
  letter-spacing: -0.005em;
}
.cook-mode-root .cm-head .ttl .of {
  font-family: var(--mono); font-weight: 400;
  font-size: 10px; color: #6B6B70;
  letter-spacing: 0.18em; display: block; margin-top: 4px;
}
.cook-mode-root .cm-head .x {
  width: 32px; height: 32px;
  border: 1px solid var(--iron-000);
  background: transparent; cursor: pointer;
  font-family: var(--display); font-weight: 800;
  font-size: 18px; color: var(--iron-000);
  display: inline-flex; align-items: center; justify-content: center;
  flex: 0 0 32px;
}

/* ───── Progress ───── */
.cook-mode-root .cm-progress {
  display: flex; gap: 4px;
  padding: 12px 18px 0;
}
.cook-mode-root .cm-progress .seg {
  flex: 1; height: 6px;
  background: var(--paper-200);
  border: 1px solid var(--iron-000);
}
.cook-mode-root .cm-progress .seg.active { background: var(--iron-red); }
.cook-mode-root .cm-progress .seg.done   { background: var(--iron-000); }

/* ───── Body ───── */
.cook-mode-root .cm-body {
  flex: 1; padding: 36px 24px 24px;
  display: flex; flex-direction: column;
  justify-content: flex-start; gap: 24px;
  overflow-y: auto;
  touch-action: pan-y;
}
@media (min-width: 768px) { .cook-mode-root .cm-body { padding: 48px 48px 32px; gap: 32px; } }
.cook-mode-root .cm-num {
  font-family: var(--display); font-weight: 900;
  font-size: 120px; line-height: 0.8;
  color: var(--iron-red);
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}
@media (min-width: 768px) { .cook-mode-root .cm-num { font-size: 168px; } }
.cook-mode-root .cm-text {
  font-family: var(--body); font-weight: 600;
  font-size: 24px; line-height: 1.3;
  color: var(--iron-000);
}
@media (min-width: 768px) { .cook-mode-root .cm-text { font-size: 30px; line-height: 1.35; max-width: 22em; } }

/* ───── Timer block ───── */
.cook-mode-root .timer-block {
  border: 2px solid var(--iron-000);
  padding: 18px;
  text-align: center;
  background: var(--paper-100);
  cursor: pointer;
}
.cook-mode-root .timer-block .digit {
  font-family: var(--display); font-weight: 900;
  font-size: 86px; line-height: 1;
  color: var(--iron-000);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
.cook-mode-root .timer-block.running .digit { color: var(--iron-red); }
.cook-mode-root .timer-block.done .digit { color: var(--iron-red); }
.cook-mode-root .timer-block .lbl {
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--iron-000); margin-top: 10px;
  padding: 8px 14px;
  border: 1px solid var(--iron-000);
  display: inline-block; font-weight: 700;
}
.cook-mode-root .timer-block.running .lbl {
  background: var(--iron-red); color: var(--paper-000); border-color: var(--iron-red);
}
.cook-mode-root .timer-block.done .lbl {
  background: var(--iron-red); color: var(--paper-000); border-color: var(--iron-red);
}
@media (min-width: 768px) { .cook-mode-root .timer-block .digit { font-size: 110px; } }

/* ───── Foot ───── */
.cook-mode-root .cm-foot {
  border-top: 2px solid var(--iron-000);
  padding: 14px 18px;
  background: var(--iron-000);
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
@media (min-width: 768px) { .cook-mode-root .cm-foot { padding: 18px 32px; gap: 14px; } }
.cook-mode-root .cm-foot .btn {
  width: 100%; justify-content: center;
  padding: 16px; font-size: 12px;
}
@media (min-width: 768px) { .cook-mode-root .cm-foot .btn { padding: 18px; font-size: 13px; } }

/* ───── Wake-lock notice (if API unavailable, shown once) ───── */
.cook-mode-root .cm-wake-warn {
  font-family: var(--mono); font-size: 9.5px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--iron-500); padding: 8px 18px 0;
  text-align: center;
}

/* ───── No-steps fallback ───── */
.cook-mode-root .cm-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center; padding: 24px;
}
.cook-mode-root .cm-empty .ttl {
  font-family: var(--display); font-weight: 900;
  font-size: 28px; text-transform: uppercase;
  color: var(--iron-000); margin-bottom: 12px;
}
`;

function ensureStyles() {
  if (document.getElementById('cook-mode-css')) return;
  const tag = document.createElement('style');
  tag.id = 'cook-mode-css';
  tag.textContent = css;
  document.head.appendChild(tag);
}

/* ============================================================
   Helpers
   ============================================================ */

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatTime(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const ss = s - m * 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}:${String(m - h * 60).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

/* Audio: tiny WebAudio synth — single 880Hz tone, 250ms. */
let _audioCtx = null;
function beep() {
  try {
    _audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    const now = _audioCtx.currentTime;
    // Two short tones — feels like an alarm
    for (const [start, freq] of [[0, 880], [0.3, 880]]) {
      const osc = _audioCtx.createOscillator();
      const gain = _audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.18, now + start + 0.01);
      gain.gain.linearRampToValueAtTime(0,    now + start + 0.22);
      osc.connect(gain).connect(_audioCtx.destination);
      osc.start(now + start);
      osc.stop(now + start + 0.25);
    }
  } catch (_) { /* no-op */ }
}

function vibrate() {
  try { navigator.vibrate?.([220, 120, 220, 120, 220]); } catch (_) {}
}

/* ============================================================
   Main renderer
   ============================================================ */

export function renderCookMode(mount, recipe) {
  ensureStyles();

  if (!recipe || !(recipe.steps || []).length) {
    mount.innerHTML = `
      <div class="cook-mode-root">
        <div class="cm-frame">
          <div class="cm-head">
            <div class="ttl">${escapeHtml(recipe?.title || 'Recipe')}<span class="of">Cook mode</span></div>
            <button type="button" class="x" data-action="exit">×</button>
          </div>
          <div class="cm-empty">
            <div class="ttl">No steps in this recipe</div>
            <a class="btn outline sm" href="#/cookbook/recipe/${recipe?.id || ''}" style="text-decoration:none;">← Back to recipe</a>
          </div>
        </div>
      </div>`;
    mount.querySelector('[data-action="exit"]')?.addEventListener('click', () => exitTo(recipe?.id));
    return;
  }

  const steps = recipe.steps;
  const N = steps.length;

  /* Local-only state for this session */
  const state = {
    current: 0,
    // timers: stepIdx → { remaining (sec), running (bool), done (bool), totalSec (sec) }
    timers: new Map(),
    wakeLock: null,
    wakeLockUnsupported: !('wakeLock' in navigator),
    tickHandle: null,
    keydownHandler: null,
    swipeStart: null,
  };

  // Seed timers for steps that have timer_min
  steps.forEach((s, i) => {
    if (s.timer_min != null && s.timer_min > 0) {
      const totalSec = s.timer_min * 60;
      state.timers.set(i, { remaining: totalSec, running: false, done: false, totalSec });
    }
  });

  /* ----- Wake Lock ----- */
  async function requestWakeLock() {
    if (state.wakeLockUnsupported) return;
    try {
      state.wakeLock = await navigator.wakeLock.request('screen');
      state.wakeLock.addEventListener('release', () => { state.wakeLock = null; });
    } catch (_) {
      // Permission denied or no user gesture — silent fail
    }
  }
  function releaseWakeLock() {
    if (state.wakeLock) {
      try { state.wakeLock.release(); } catch (_) {}
      state.wakeLock = null;
    }
  }
  document.addEventListener('visibilitychange', onVisibility);
  function onVisibility() {
    if (document.visibilityState === 'visible' && !state.wakeLock) requestWakeLock();
  }

  /* ----- Render ----- */
  function paint() {
    const s = steps[state.current];
    const t = state.timers.get(state.current);
    const progressHtml = steps.map((_, i) => {
      let cls = '';
      if (i < state.current) cls = ' done';
      else if (i === state.current) cls = ' active';
      return `<div class="seg${cls}"></div>`;
    }).join('');

    const timerHtml = t
      ? `<div class="timer-block${t.running ? ' running' : ''}${t.done ? ' done' : ''}" data-action="timer">
           <div class="digit">${escapeHtml(formatTime(t.remaining))}</div>
           <div class="lbl">${
             t.done ? 'Done — tap to reset'
             : t.running ? 'Running · tap to pause'
             : (t.remaining !== t.totalSec ? 'Paused · tap to resume' : 'Tap to start')
           }</div>
         </div>`
      : '';

    const isLast = state.current === N - 1;
    const wakeWarn = state.wakeLockUnsupported
      ? '<div class="cm-wake-warn">Screen wake-lock unsupported in this browser — your screen may dim.</div>'
      : '';

    mount.innerHTML = `
      <div class="cook-mode-root">
        <div class="cm-frame">
          <div class="cm-head">
            <div class="ttl">
              ${escapeHtml(recipe.title || '')}<span class="of">Step ${String(state.current + 1).padStart(2,'0')} of ${String(N).padStart(2,'0')}${t && t.running ? ` · ${formatTime(t.remaining)} left` : ''}</span>
            </div>
            <button type="button" class="x" data-action="exit" title="Exit">×</button>
          </div>
          ${wakeWarn}
          <div class="cm-progress">${progressHtml}</div>
          <div class="cm-body" data-zone="body">
            <div class="cm-num">${String(s.n).padStart(2, '0')}</div>
            <div class="cm-text">${escapeHtml(s.text)}</div>
            ${timerHtml}
          </div>
          <div class="cm-foot">
            <button type="button" class="btn outline" data-action="prev"${state.current === 0 ? ' disabled' : ''}>← Prev</button>
            ${isLast
              ? '<button type="button" class="btn" data-action="done">Mark as cooked ✓</button>'
              : '<button type="button" class="btn" data-action="next">Next Step →</button>'}
          </div>
        </div>
      </div>
    `;
    wire();
  }

  /* ----- Wire interactions ----- */
  function wire() {
    const root = mount.querySelector('.cook-mode-root');
    if (!root) return;

    root.addEventListener('click', e => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      const action = a.dataset.action;
      if (action === 'exit')      return tryExit();
      if (action === 'prev')      return prev();
      if (action === 'next')      return next();
      if (action === 'done')      return markCooked();
      if (action === 'timer')     return toggleTimer();
    });

    /* Touch swipe — only on the body */
    const body = root.querySelector('[data-zone="body"]');
    if (body) {
      body.addEventListener('touchstart', e => {
        if (e.touches.length !== 1) return;
        state.swipeStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
      }, { passive: true });
      body.addEventListener('touchend', e => {
        if (!state.swipeStart) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - state.swipeStart.x;
        const dy = (e.changedTouches[0]?.clientY ?? 0) - state.swipeStart.y;
        const dt = Date.now() - state.swipeStart.t;
        state.swipeStart = null;
        // Only treat as swipe if mostly horizontal, fast enough, and far enough
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500) {
          if (dx < 0) next(); else prev();
        }
      }, { passive: true });
    }
  }

  /* ----- Navigation ----- */
  function prev() { if (state.current > 0) { state.current--; paint(); } }
  function next() { if (state.current < N - 1) { state.current++; paint(); } }

  /* ----- Timer ----- */
  function toggleTimer() {
    const t = state.timers.get(state.current);
    if (!t) return;
    if (t.done) {
      // Reset
      t.done = false;
      t.remaining = t.totalSec;
      t.running = false;
    } else if (t.running) {
      t.running = false;
    } else {
      t.running = true;
      // Resume audio context (user gesture)
      try { _audioCtx?.resume?.(); } catch (_) {}
    }
    ensureTickRunning();
    paint();
  }

  function ensureTickRunning() {
    const anyRunning = Array.from(state.timers.values()).some(t => t.running);
    if (anyRunning && !state.tickHandle) {
      state.tickHandle = setInterval(tick, 1000);
    } else if (!anyRunning && state.tickHandle) {
      clearInterval(state.tickHandle);
      state.tickHandle = null;
    }
  }

  function tick() {
    let anyChanged = false;
    for (const [idx, t] of state.timers) {
      if (!t.running) continue;
      t.remaining -= 1;
      anyChanged = true;
      if (t.remaining <= 0) {
        t.remaining = 0;
        t.running = false;
        t.done = true;
        beep();
        vibrate();
      }
    }
    if (anyChanged) {
      ensureTickRunning();
      paint();
    }
  }

  /* ----- Exit ----- */
  function tryExit() {
    const running = Array.from(state.timers.values()).some(t => t.running);
    if (running && !confirm('A timer is running. Exit cook mode?')) return;
    cleanup();
    exitTo(recipe.id);
  }
  function markCooked() {
    // Persists cook_count + last_cooked in localStorage. The detail view
    // and cookbook list will reflect the new count on their next render.
    const next = persistCooked(recipe.id);
    console.info('[cook-mode] marked cooked:', recipe.id, '→ ×' + next.cook_count);
    cleanup();
    exitTo(recipe.id);
  }
  function cleanup() {
    if (state.tickHandle) { clearInterval(state.tickHandle); state.tickHandle = null; }
    if (state.keydownHandler) {
      window.removeEventListener('keydown', state.keydownHandler);
      state.keydownHandler = null;
    }
    document.removeEventListener('visibilitychange', onVisibility);
    releaseWakeLock();
  }

  /* ----- Keyboard ----- */
  state.keydownHandler = (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
    else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
    else if (e.key === 'Escape') tryExit();
    else if (e.key === 't' || e.key === 'T') {
      if (state.timers.has(state.current)) toggleTimer();
    }
  };
  window.addEventListener('keydown', state.keydownHandler);

  /* ----- Boot ----- */
  requestWakeLock();
  paint();
}

function exitTo(recipeId) {
  // Navigate back to detail (or list if no id)
  location.hash = recipeId ? `#/cookbook/recipe/${recipeId}` : '#/cookbook';
}
