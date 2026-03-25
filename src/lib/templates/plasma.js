// Plasma — dense demoscene waves with cursor interaction
const PLASMA_CHARS = ' .·:;=+*!|xX#%@$&█▓▒░◆◇○●';

function createInstance() {
  const s = {
    time: 0,
    mouseX: -1, mouseY: -1, mouseActive: false, hoverEffect: 'ripple'
  };
  return {
    setMouse(x, y, active, effect) {
      s.mouseX = x; s.mouseY = y; s.mouseActive = active; s.hoverEffect = effect;
    },
    init(canvas, params, colors) { s.time = 0; },
    update(dt, params) { s.time += dt * params.speed; },
    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);
      const cw = 8, ch = 12; // denser grid
      const cols = Math.floor(width / cw), rows = Math.floor(height / ch);
      ctx.font = `400 ${ch - 2}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      const t = s.time;

      const mCol = s.mouseActive ? Math.floor(s.mouseX / cw) : -100;
      const mRow = s.mouseActive ? Math.floor(s.mouseY / ch) : -100;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const nx = col / cols, ny = row / rows;

          // Mouse distortion
          let distort = 0;
          if (s.mouseActive && s.hoverEffect !== 'none') {
            const dx = col - mCol;
            const dy = row - mRow;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 12) {
              const prox = 1 - dist / 12;
              if (s.hoverEffect === 'ripple') {
                distort = Math.sin(dist * 0.8 - t * 6) * prox * 2;
              } else if (s.hoverEffect === 'repel' || s.hoverEffect === 'spotlight') {
                distort = prox * prox * 3;
              } else if (s.hoverEffect === 'glitch') {
                distort = Math.random() * prox * 4;
              }
            }
          }

          const v1 = Math.sin((nx + distort * 0.05) * params.frequency * 6 + t);
          const v2 = Math.sin(ny * params.frequency * 6 - t * 0.7);
          const v3 = Math.sin((nx + ny) * params.frequency * 4 + t * 0.5);
          const v4 = Math.sin(Math.sqrt((nx - 0.5) ** 2 + (ny - 0.5) ** 2) * params.frequency * 8 - t);
          const v = (v1 + v2 + v3 + v4 * params.amplitude + distort * 0.2) / 4;
          const norm = v * 0.5 + 0.5;
          const idx = Math.floor(norm * (PLASMA_CHARS.length - 1));
          const ch2 = PLASMA_CHARS[idx];
          if (ch2 === ' ') continue;
          const hue = (norm * 360 + params.palette * 90 + t * 30) % 360;
          ctx.fillStyle = `hsl(${hue},100%,${35 + norm * 45}%)`;

          let drawX = col * cw + cw / 2;
          let drawY = row * ch + ch - 2;

          // Physical displacement for repel
          if (s.mouseActive && s.hoverEffect === 'repel') {
            const dx = col - mCol;
            const dy = row - mRow;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 10 && dist > 0) {
              const prox = 1 - dist / 10;
              const angle = Math.atan2(dy, dx);
              drawX += Math.cos(angle) * prox * prox * 12;
              drawY += Math.sin(angle) * prox * prox * 12;
            }
          }

          ctx.fillText(ch2, drawX, drawY);
        }
      }
    },
    destroy() {},
  };
}

export default {
  name: 'Plasma',
  description: 'Demoscene plasma waves',
  params: {
    frequency: { min: 0.5, max: 5, default: 2.0, label: 'Frequency', step: 0.1 },
    amplitude: { min: 0.1, max: 2, default: 1.0, label: 'Amplitude', step: 0.05 },
    speed: { min: 0.1, max: 3, default: 0.8, label: 'Speed', step: 0.05 },
    palette: { min: 0, max: 3, default: 0, label: 'Palette Shift', step: 1 },
  },
  colors: { bg: '#0A0A0B', primary: '#FF00FF', secondary: '#00FFFF', glow: '#FF88FF' },
  createInstance,
};
