// Magnetic — dense direction field that snaps toward your cursor
// Every character is chosen by its angle to the mouse — like a compass field

// 8-direction ASCII chars indexed by angle bucket (0=right, CCW)
const DIR = ['-', '/', '|', '\\', '-', '/', '|', '\\'];

// Brightness ramp by distance (dense close, sparse far)
const DIST_CHARS = '·.:;=+*#@';

function createInstance() {
  const s = {
    mouseX: 0.5,  // normalized 0-1
    mouseY: 0.5,
    targetX: 0.5,
    targetY: 0.5,
    time: 0,
    canvas: null,
    _onMove: null,
    _onEnter: null,
    inside: false,
  };

  return {
    init(canvas, params, colors) {
      s.canvas = canvas;

      s._onMove = (e) => {
        const r = canvas.getBoundingClientRect();
        s.targetX = (e.clientX - r.left) / r.width;
        s.targetY = (e.clientY - r.top)  / r.height;
        s.inside  = true;
      };
      s._onLeave = () => { s.inside = false; };
      canvas.addEventListener('mousemove',  s._onMove);
      canvas.addEventListener('mouseleave', s._onLeave);
    },

    update(dt, params) {
      s.time += dt;
      if (s.inside) {
        const spd = Math.min(1, (params.speed || 1) * 6 * dt);
        s.mouseX += (s.targetX - s.mouseX) * spd;
        s.mouseY += (s.targetY - s.mouseY) * spd;
      } else {
        // Slow drift when idle
        s.mouseX = 0.5 + Math.sin(s.time * 0.4) * 0.3;
        s.mouseY = 0.5 + Math.cos(s.time * 0.3) * 0.25;
      }
    },

    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      const cw = charW, ch = charH;
      const cols = Math.floor(width  / cw);
      const rows = Math.floor(height / ch);
      const fontSize = Math.max(6, ch - 2);
      ctx.font = `700 ${fontSize}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';

      const mx = s.mouseX * width;
      const my = s.mouseY * height;
      const maxDist = Math.sqrt(width * width + height * height) * 0.6;

      const pc = colors.primary || '#FF6B9D';
      const pr = parseInt(pc.slice(1, 3), 16);
      const pg = parseInt(pc.slice(3, 5), 16);
      const pb = parseInt(pc.slice(5, 7), 16);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = c * cw + cw * 0.5;
          const cy = r * ch + ch * 0.7;

          const dx = mx - cx;
          const dy = my - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Angle → direction character
          const angle  = Math.atan2(dy, dx);                         // -π…π
          const bucket = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 8) % 8;
          const dirChar = DIR[bucket];

          // Wave rings emanating from cursor
          const wave = Math.sin(dist * 0.06 - s.time * (params.speed || 1) * 4);

          // Brightness: strong near cursor, fades at distance, modulated by wave
          const falloff  = Math.max(0, 1 - dist / maxDist);
          const bright   = Math.max(0.05, falloff * 0.9 + (wave * 0.5 + 0.5) * 0.3 * falloff);

          ctx.fillStyle = `rgb(${Math.round(pr * bright)},${Math.round(pg * bright)},${Math.round(pb * bright)})`;
          ctx.fillText(dirChar, cx, cy);
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
  name: 'Magnetic',
  description: 'Direction field that follows your cursor',
  params: {
    speed: { min: 0.2, max: 3, default: 1, label: 'Follow Speed', step: 0.1 },
  },
  colors: { bg: '#0A0A0B', primary: '#FF6B9D', secondary: '#3D0020', glow: '#FF6B9D' },
  createInstance,
};
