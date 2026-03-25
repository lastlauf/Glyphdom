// Flow Field — dense character grid following a noise-driven vector field
// Cursor creates a vortex disturbance in the flow

// Characters that suggest direction by angle (4 buckets)
const ANGLE_CHARS = ['-', '/', '|', '\\'];
// Density ramp for brightness variation
const DENSITY = ' ·.:;=+*#@';

function noise(x, y, t) {
  // Multi-octave sine approximation — organic, smooth
  return (
    Math.sin(x * 0.18 + t * 0.6) * Math.cos(y * 0.22 - t * 0.4) +
    Math.sin(x * 0.07 - y * 0.11 + t * 0.35) * 0.6 +
    Math.cos((x + y) * 0.13 + t * 0.8) * 0.4 +
    Math.sin(x * 0.3 + y * 0.25 - t * 0.5) * 0.3
  );
}

function createInstance() {
  const s = {
    time:    0,
    mouseX:  -1,    // pixel coords, -1 = absent
    mouseY:  -1,
    canvas:  null,
    _onMove: null,
    _onLeave: null,
  };

  return {
    init(canvas, params, colors) {
      s.canvas  = canvas;
      s.mouseX  = -1;
      s.mouseY  = -1;

      s._onMove = (e) => {
        const r = canvas.getBoundingClientRect();
        s.mouseX = e.clientX - r.left;
        s.mouseY = e.clientY - r.top;
      };
      s._onLeave = () => { s.mouseX = -1; s.mouseY = -1; };
      canvas.addEventListener('mousemove',  s._onMove);
      canvas.addEventListener('mouseleave', s._onLeave);
    },

    update(dt, params) {
      s.time += dt * (params.speed || 1);
    },

    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      const cw   = charW;
      const ch   = charH;
      const cols = Math.floor(width  / cw);
      const rows = Math.floor(height / ch);
      ctx.font = `700 ${Math.max(6, ch - 2)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';

      const pc = colors.primary || '#0AE8B8';
      const pr = parseInt(pc.slice(1, 3), 16);
      const pg = parseInt(pc.slice(3, 5), 16);
      const pb = parseInt(pc.slice(5, 7), 16);

      const hasMouse = s.mouseX >= 0;
      const t = s.time;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const wx = c / cols;  // 0-1
          const wy = r / rows;

          // Base flow angle from noise
          let angle = noise(wx * 8, wy * 8, t) * Math.PI;

          // Cursor vortex — add a counter-clockwise spin around mouse
          if (hasMouse) {
            const dx = c * cw + cw / 2 - s.mouseX;
            const dy = r * ch + ch / 2 - s.mouseY;
            const dist  = Math.sqrt(dx * dx + dy * dy);
            const reach = Math.min(width, height) * 0.35;
            if (dist < reach) {
              const strength = (1 - dist / reach) ** 2;
              const vortexAngle = Math.atan2(dy, dx) + Math.PI / 2;
              angle = angle * (1 - strength) + vortexAngle * strength;
            }
          }

          // Map angle to character (4 visual direction buckets)
          const bucket = Math.floor(((angle % Math.PI + Math.PI) / Math.PI) * 4) % 4;
          const char   = ANGLE_CHARS[bucket];

          // Brightness from noise layer
          const n = noise(wx * 6 + 100, wy * 5 - 100, t * 0.7);
          const bright = 0.2 + (n * 0.5 + 0.5) * 0.8;

          ctx.fillStyle = `rgb(${Math.round(pr * bright)},${Math.round(pg * bright)},${Math.round(pb * bright)})`;
          ctx.fillText(char, c * cw + cw / 2, r * ch + ch * 0.8);
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
  name: 'Flow Field',
  description: 'Noise-driven flow that your cursor bends',
  params: {
    speed: { min: 0.1, max: 3, default: 0.7, label: 'Flow Speed', step: 0.05 },
  },
  colors: { bg: '#0A0A0B', primary: '#0AE8B8', secondary: '#002D24', glow: '#0AE8B8' },
  createInstance,
};
