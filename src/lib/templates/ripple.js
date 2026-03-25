// Ripple — water wave simulation driven by cursor
// Classic two-buffer cellular automata: waves propagate outward from mouse

const RAMP = ' .·:;=+*#%@';

function createInstance() {
  const s = {
    buf:    null,   // current heights Float32Array
    prev:   null,   // previous heights Float32Array
    cols:   0,
    rows:   0,
    time:   0,
    mouseGridX: -1,
    mouseGridY: -1,
    canvas: null,
    _onMove: null,
    _onLeave: null,
  };

  function splash(cx, cy, radius, energy) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > radius) continue;
        const x = cx + dx, y = cy + dy;
        if (x < 1 || x >= s.cols - 1 || y < 1 || y >= s.rows - 1) continue;
        s.buf[y * s.cols + x] += energy * (1 - d / radius);
      }
    }
  }

  return {
    init(canvas, params, colors) {
      s.canvas = canvas;
      const cw = 7, ch = 10;
      s.cols = Math.max(4, Math.floor(canvas.width / cw));
      s.rows = Math.max(4, Math.floor(canvas.height / ch));
      s.buf  = new Float32Array(s.cols * s.rows);
      s.prev = new Float32Array(s.cols * s.rows);

      s._onMove = (e) => {
        const r = canvas.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width;
        const ny = (e.clientY - r.top)  / r.height;
        s.mouseGridX = Math.floor(nx * s.cols);
        s.mouseGridY = Math.floor(ny * s.rows);
        splash(s.mouseGridX, s.mouseGridY, 3, 800 * (params.intensity || 1));
      };
      s._onLeave = () => { s.mouseGridX = -1; s.mouseGridY = -1; };
      canvas.addEventListener('mousemove',  s._onMove);
      canvas.addEventListener('mouseleave', s._onLeave);
    },

    update(dt, params) {
      s.time += dt;

      // Occasional auto-drips so idle state stays alive
      if (Math.random() < 0.04) {
        const rx = 1 + Math.floor(Math.random() * (s.cols - 2));
        const ry = 1 + Math.floor(Math.random() * (s.rows - 2));
        splash(rx, ry, 2, 300 * (params.intensity || 1));
      }

      const damp  = 0.985;
      const { buf, prev, cols, rows } = s;

      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const i = y * cols + x;
          const next = (
            buf[i - 1] + buf[i + 1] +
            buf[i - cols] + buf[i + cols]
          ) / 2 - prev[i];
          prev[i] = next * damp;
        }
      }
      // Swap
      s.buf  = prev;
      s.prev = buf;
    },

    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      const { buf, cols, rows } = s;
      const cw = width  / cols;
      const ch = height / rows;
      ctx.font = `700 ${Math.max(6, Math.round(ch - 2))}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';

      // Parse primary color once
      const pc = colors.primary || '#00FFD0';
      const pr = parseInt(pc.slice(1, 3), 16);
      const pg = parseInt(pc.slice(3, 5), 16);
      const pb = parseInt(pc.slice(5, 7), 16);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const v   = buf[y * cols + x];
          const abs = Math.abs(v);
          if (abs < 2) continue;

          const t    = Math.min(1, abs / 600);
          const idx  = Math.floor(t * (RAMP.length - 1));
          const char = RAMP[idx];
          const br   = 0.15 + t * 0.85;
          ctx.fillStyle = `rgb(${Math.round(pr * br)},${Math.round(pg * br)},${Math.round(pb * br)})`;
          ctx.fillText(char, x * cw + cw / 2, y * ch + ch * 0.8);
        }
      }
    },

    destroy() {
      if (s.canvas) {
        s.canvas.removeEventListener('mousemove',  s._onMove);
        s.canvas.removeEventListener('mouseleave', s._onLeave);
      }
    },
  };
}

export default {
  name: 'Ripple',
  description: 'Water waves that ripple from your cursor',
  params: {
    intensity: { min: 0.2, max: 3, default: 1.2, label: 'Intensity', step: 0.1 },
  },
  colors: { bg: '#0A0A0B', primary: '#00FFD0', secondary: '#003D31', glow: '#00FFD0' },
  createInstance,
};
