// Conway's Game of Life — factory pattern
function createInstance() {
  const s = { grid: null, prev: null, trail: null, cols: 0, rows: 0, time: 0, ticker: 0, gen: 0, stableCount: 0, lastPop: 0 };

  function seed(density) {
    for (let i = 0; i < s.cols * s.rows; i++) {
      s.grid[i] = Math.random() < density ? 1 : 0;
      s.trail[i] = 0;
    }
    s.gen = 0;
    s.stableCount = 0;
    s.lastPop = 0;
  }

  function countNeighbors(x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = (x + dx + s.cols) % s.cols;
        const ny = (y + dy + s.rows) % s.rows;
        if (s.grid[ny * s.cols + nx]) count++;
      }
    }
    return count;
  }

  return {
    init(canvas, params, colors) {
      s.cols = Math.floor(canvas.width / 14);
      s.rows = Math.floor(canvas.height / 20);
      s.grid = new Uint8Array(s.cols * s.rows);
      s.prev = new Uint8Array(s.cols * s.rows);
      s.trail = new Float32Array(s.cols * s.rows);
      s.time = 0;
      s.ticker = 0;
      seed(params.density);
    },
    update(dt, params) {
      s.time += dt;
      s.ticker += dt * params.speed;

      if (s.ticker < 0.1) return;
      s.ticker = 0;
      s.gen++;

      // Decay trails
      for (let i = 0; i < s.cols * s.rows; i++) {
        if (s.trail[i] > 0) s.trail[i] -= 0.05 * (1 - params.trailFade * 0.8);
        if (s.trail[i] < 0) s.trail[i] = 0;
      }

      // Copy to prev
      s.prev.set(s.grid);

      // Apply rules
      let pop = 0;
      for (let y = 0; y < s.rows; y++) {
        for (let x = 0; x < s.cols; x++) {
          const idx = y * s.cols + x;
          const n = countNeighbors(x, y);
          if (s.prev[idx]) {
            s.grid[idx] = (n === 2 || n === 3) ? 1 : 0;
            if (!s.grid[idx]) s.trail[idx] = 1; // just died
          } else {
            s.grid[idx] = (n === 3) ? 1 : 0;
          }
          if (s.grid[idx]) pop++;
        }
      }

      // Detect stagnation
      if (pop === s.lastPop) {
        s.stableCount++;
      } else {
        s.stableCount = 0;
      }
      s.lastPop = pop;

      // Reseed if stagnant or dead
      if (pop === 0 || s.stableCount > params.reseedTimer * 10) {
        seed(params.density);
      }
    },
    render(ctx, width, height, charW, charH, params, colors) {
      const cw = 14, ch = 20;
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.font = `600 ${ch - 4}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';

      for (let y = 0; y < s.rows; y++) {
        for (let x = 0; x < s.cols; x++) {
          const idx = y * s.cols + x;
          if (s.grid[idx]) {
            ctx.fillStyle = colors.primary;
            ctx.fillText('#', x * cw + cw / 2, y * ch + ch - 4);
          } else if (s.trail[idx] > 0.05) {
            ctx.globalAlpha = s.trail[idx] * 0.6;
            ctx.fillStyle = colors.secondary;
            ctx.fillText('░', x * cw + cw / 2, y * ch + ch - 4);
            ctx.globalAlpha = 1;
          }
        }
      }
    },
    destroy() { s.grid = null; s.prev = null; s.trail = null; },
  };
}

export default {
  name: 'Game of Life',
  description: "Conway's cellular automata",
  params: {
    speed:      { min: 0.3, max: 3,   default: 1,   label: 'Speed',      step: 0.1  },
    density:    { min: 0.1, max: 0.6, default: 0.3, label: 'Density',    step: 0.05 },
    trailFade:  { min: 0,   max: 1,   default: 0.5, label: 'Trail Fade', step: 0.05 },
    reseedTimer:{ min: 2,   max: 15,  default: 6,   label: 'Reseed (s)', step: 1    },
  },
  colors: { bg: '#0A0A0B', primary: '#00FF88', secondary: '#004422', glow: '#66FFAA' },
  createInstance,
};
