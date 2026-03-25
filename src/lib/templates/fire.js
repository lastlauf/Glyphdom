// Fire — dense cellular automata with cursor interaction
const FIRE_CHARS = ' .·\'`^":;~-=+*!|¦xXoO#%$@&█▓▒░';
function heatToChar(h) { return FIRE_CHARS[Math.max(0, Math.min(FIRE_CHARS.length - 1, Math.floor((h / 255) * (FIRE_CHARS.length - 1))))]; }

function lerpColor(a, b, t) {
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
  return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`;
}
function heatToColor(heat, primary, secondary) {
  if (heat < 20) return null;
  if (heat < 60) return lerpColor(secondary, primary, (heat - 20) / 40);
  if (heat < 180) return lerpColor(primary, '#FFB000', (heat - 60) / 120);
  return lerpColor('#FFB000', '#FFFFFF', (heat - 180) / 75);
}

function createInstance() {
  const s = {
    buf: null, buf2: null, cols: 0, rows: 0,
    cw: 8, ch: 12, time: 0, embers: [],
    mouseX: -1, mouseY: -1, mouseActive: false, hoverEffect: 'ripple'
  };
  return {
    setMouse(x, y, active, effect) {
      s.mouseX = x; s.mouseY = y; s.mouseActive = active; s.hoverEffect = effect;
    },
    init(canvas, params, colors) {
      s.cw = 8; s.ch = 12;
      s.cols = Math.floor(canvas.width / s.cw);
      s.rows = Math.floor(canvas.height / s.ch);
      s.buf = new Uint8Array(s.cols * s.rows).fill(0);
      s.buf2 = new Uint8Array(s.cols * s.rows).fill(0);
      s.time = 0; s.embers = [];
    },
    update(dt, params) {
      s.time += dt * params.speed;
      const { cols, rows, buf, buf2 } = s;
      const cx = Math.floor(cols / 2), hw = Math.floor(cols * params.width * 0.5);

      // Generate base heat — cursor adds extra heat
      for (let x = 0; x < cols; x++) {
        const inRange = x >= cx - hw && x <= cx + hw;
        let heat = inRange && Math.random() < params.intensity
          ? Math.floor(200 + Math.random() * 55)
          : Math.floor(Math.random() * 40);

        // Cursor as heat source
        if (s.mouseActive && s.hoverEffect !== 'none') {
          const mCol = Math.floor(s.mouseX / s.cw);
          const mRow = Math.floor(s.mouseY / s.ch);
          const dist = Math.abs(x - mCol);
          if (dist < 8 && mRow > rows * 0.3) {
            heat = Math.max(heat, Math.floor(255 * (1 - dist / 8)));
          }
        }

        buf[(rows - 1) * cols + x] = heat;
      }

      for (let y = 0; y < rows - 1; y++) {
        for (let x = 0; x < cols; x++) {
          const decay = 1 + Math.floor(Math.random() * 3);
          const l = x > 0 ? buf[(y + 1) * cols + x - 1] : 0;
          const r = x < cols - 1 ? buf[(y + 1) * cols + x + 1] : 0;
          const d = buf[(y + 1) * cols + x];
          const d2 = y < rows - 2 ? buf[(y + 2) * cols + x] : 0;
          buf2[y * cols + x] = Math.max(0, Math.round((l + r + d + d2) / 4 - decay));
        }
      }
      for (let i = 0; i < cols * (rows - 1); i++) buf[i] = buf2[i];

      s.embers = s.embers.filter(e => e.life > 0);
      while (s.embers.length < params.emberCount) {
        s.embers.push({
          x: cx - hw + Math.random() * hw * 2, y: rows - 2,
          vx: (Math.random() - 0.5) * 0.4, vy: -(0.5 + Math.random() * 2),
          life: 20 + Math.floor(Math.random() * 50)
        });
      }
      for (const e of s.embers) { e.x += e.vx; e.vy *= 0.98; e.y += e.vy; e.life--; }
    },
    render(ctx, width, height, charW, charH, params, colors) {
      const { cols, rows, buf, cw, ch } = s;
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.font = `500 ${ch - 1}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';

      const mCol = s.mouseActive ? Math.floor(s.mouseX / cw) : -100;
      const mRow = s.mouseActive ? Math.floor(s.mouseY / ch) : -100;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const heat = buf[y * cols + x];
          if (heat < 10) continue;
          const c2 = heatToChar(heat);
          if (c2 === ' ') continue;
          const color = heatToColor(heat, colors.primary, colors.secondary);
          if (!color) continue;

          let drawX = x * cw + cw / 2;
          let drawY = y * ch + ch - 2;

          // Cursor interaction
          if (s.mouseActive && s.hoverEffect !== 'none') {
            const dx = x - mCol;
            const dy = y - mRow;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 10) {
              const prox = 1 - dist / 10;
              if (s.hoverEffect === 'ripple') {
                drawX += Math.sin(dist - s.time * 8) * prox * 3;
              } else if (s.hoverEffect === 'repel') {
                const angle = Math.atan2(dy, dx);
                drawX += Math.cos(angle) * prox * prox * 10;
                drawY += Math.sin(angle) * prox * prox * 10;
              } else if (s.hoverEffect === 'glitch' && Math.random() < prox * 0.3) {
                drawX += (Math.random() - 0.5) * 8;
              }
            }
          }

          ctx.fillStyle = color;
          ctx.fillText(c2, drawX, drawY);
        }
      }

      ctx.font = `600 8px "JetBrains Mono", monospace`;
      for (const e of s.embers) {
        ctx.globalAlpha = e.life / 60;
        ctx.fillStyle = colors.glow;
        ctx.fillText('*', e.x * cw + cw / 2, e.y * ch);
      }
      ctx.globalAlpha = 1;
    },
    destroy() { s.buf = null; s.buf2 = null; s.embers = []; },
  };
}

export default {
  name: 'Fire',
  description: 'Rising flame simulation',
  params: {
    intensity:  { min: 0.1, max: 1,  default: 0.8,  label: 'Intensity',    step: 0.05 },
    width:      { min: 0.2, max: 1,  default: 0.85, label: 'Spread Width', step: 0.05 },
    speed:      { min: 0.5, max: 3,  default: 1.3,  label: 'Speed',        step: 0.05 },
    emberCount: { min: 0,   max: 60, default: 25,   label: 'Embers',       step: 1    },
  },
  colors: { bg: '#0A0A0B', primary: '#FF4500', secondary: '#8B0000', glow: '#FF6600' },
  createInstance,
};
