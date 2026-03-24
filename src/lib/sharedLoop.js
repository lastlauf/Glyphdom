// Shared rAF loop for background/preview canvases
// Runs at ~15fps to keep CPU usage low while main canvas gets full 60fps

const registry = new Set();
let raf = null;
let lastTs = null;
let tick = 0;
const INTERVAL = 4; // run every 4 frames ≈ 15fps at 60fps

function loop(ts) {
  raf = requestAnimationFrame(loop);
  if (!lastTs) lastTs = ts;
  const dt = Math.min((ts - lastTs) / 1000, 0.1);
  lastTs = ts;
  tick++;
  if (tick % INTERVAL !== 0) return;
  const batchDt = dt * INTERVAL;
  for (const fn of registry) {
    try { fn(batchDt); } catch (e) { console.error(e); }
  }
}

export function registerPreview(fn) {
  registry.add(fn);
  if (!raf) raf = requestAnimationFrame(loop);
}

export function unregisterPreview(fn) {
  registry.delete(fn);
  if (registry.size === 0 && raf) {
    cancelAnimationFrame(raf);
    raf = null;
    lastTs = null;
    tick = 0;
  }
}
