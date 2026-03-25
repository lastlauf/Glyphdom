// Smiley — 3D rendered yellow face, based on reference image
// Bright yellow sphere with blue eyes, brown eyebrows, open mouth

const CHARS = ' .,·:;-~=+*!|?#%@$&█▓▒░';

function drawSmileyReference(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#E8E0D0';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h * 0.48, radius = Math.min(w, h) * 0.4;

  // Main face — yellow sphere with 3D shading
  const faceGrad = ctx.createRadialGradient(cx - radius * 0.2, cy - radius * 0.2, radius * 0.05, cx, cy, radius);
  faceGrad.addColorStop(0, '#FFE44D');
  faceGrad.addColorStop(0.4, '#FFCC00');
  faceGrad.addColorStop(0.7, '#E6A800');
  faceGrad.addColorStop(0.9, '#CC8800');
  faceGrad.addColorStop(1, '#996600');
  ctx.fillStyle = faceGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Specular highlight
  const specGrad = ctx.createRadialGradient(cx - radius * 0.25, cy - radius * 0.3, 0, cx - radius * 0.25, cy - radius * 0.3, radius * 0.4);
  specGrad.addColorStop(0, 'rgba(255,255,230,0.5)');
  specGrad.addColorStop(1, 'rgba(255,255,200,0)');
  ctx.fillStyle = specGrad;
  ctx.beginPath();
  ctx.arc(cx - radius * 0.25, cy - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows
  ctx.strokeStyle = '#6B3A1F';
  ctx.lineWidth = radius * 0.06;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.42, cy - radius * 0.35);
  ctx.quadraticCurveTo(cx - radius * 0.28, cy - radius * 0.5, cx - radius * 0.12, cy - radius * 0.38);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + radius * 0.12, cy - radius * 0.38);
  ctx.quadraticCurveTo(cx + radius * 0.28, cy - radius * 0.5, cx + radius * 0.42, cy - radius * 0.35);
  ctx.stroke();

  // Eyes
  for (const side of [-1, 1]) {
    const ex = cx + side * radius * 0.28;
    ctx.fillStyle = '#FFFFF5';
    ctx.beginPath();
    ctx.ellipse(ex, cy - radius * 0.1, radius * 0.16, radius * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3366CC';
    ctx.beginPath();
    ctx.arc(ex - side * radius * 0.02, cy - radius * 0.08, radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(ex - side * radius * 0.03, cy - radius * 0.07, radius * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(ex + side * radius * 0.01, cy - radius * 0.13, radius * 0.03, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mouth
  ctx.fillStyle = '#8B1A1A';
  ctx.beginPath();
  ctx.ellipse(cx, cy + radius * 0.25, radius * 0.38, radius * 0.25, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#5C0A0A';
  ctx.beginPath();
  ctx.ellipse(cx, cy + radius * 0.28, radius * 0.3, radius * 0.18, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#CC4444';
  ctx.beginPath();
  ctx.ellipse(cx, cy + radius * 0.38, radius * 0.15, radius * 0.1, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(cx, cy + radius * 0.22, radius * 0.3, radius * 0.06, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  return c;
}

function createInstance() {
  const s = {
    time: 0, refCanvas: null, refData: null, refW: 0, refH: 0,
    mouseX: -1, mouseY: -1, mouseActive: false, hoverEffect: 'ripple',
  };

  return {
    setMouse(x, y, active, effect) {
      s.mouseX = x; s.mouseY = y; s.mouseActive = active; s.hoverEffect = effect;
    },
    init(canvas, params, colors) {
      s.time = 0;
      s.refW = 120; s.refH = 120;
      s.refCanvas = drawSmileyReference(s.refW, s.refH);
      s.refData = s.refCanvas.getContext('2d').getImageData(0, 0, s.refW, s.refH).data;
    },
    update(dt, params) { s.time += dt * params.speed; },
    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);
      if (!s.refData) return;

      const cols = Math.floor(width / charW);
      const rows = Math.floor(height / charH);
      const refAspect = s.refW / s.refH;
      const charAspect = charW / charH;
      const adjusted = refAspect / charAspect;
      let fitCols, fitRows;
      if (adjusted > cols / rows) { fitCols = cols; fitRows = Math.round(cols / adjusted); }
      else { fitRows = rows; fitCols = Math.round(rows * adjusted); }
      fitCols = Math.min(fitCols, cols);
      fitRows = Math.min(fitRows, rows);
      const ox = Math.floor((cols - fitCols) / 2);
      const oy = Math.floor((rows - fitRows) / 2);

      ctx.font = `500 ${charH - 2}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';

      const t = s.time;
      const mCol = s.mouseActive ? Math.floor(s.mouseX / charW) : -100;
      const mRow = s.mouseActive ? Math.floor(s.mouseY / charH) : -100;
      const bounceY = Math.sin(t * 2) * params.bounce * 2;
      const squash = 1 + Math.sin(t * 2 + Math.PI / 2) * params.bounce * 0.03;
      const stretch = 1 - Math.sin(t * 2 + Math.PI / 2) * params.bounce * 0.03;

      for (let row = 0; row < fitRows; row++) {
        for (let col = 0; col < fitCols; col++) {
          const nx = (col / fitCols - 0.5) / squash + 0.5;
          const ny = (row / fitRows - 0.5) / stretch + 0.5;
          if (nx < 0 || nx > 1 || ny < 0 || ny > 1) continue;

          const px = Math.floor(nx * (s.refW - 1));
          const py = Math.floor(ny * (s.refH - 1));
          const i = (py * s.refW + px) * 4;
          const r = s.refData[i], g = s.refData[i + 1], b = s.refData[i + 2];
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

          const cIdx = Math.floor(lum * (CHARS.length - 1));
          const ch = CHARS[Math.max(0, Math.min(CHARS.length - 1, cIdx))];
          if (ch === ' ') continue;

          const drawCol = col + ox;
          const drawRow = row + oy;
          let drawX = drawCol * charW + charW / 2;
          let drawY = drawRow * charH + charH - 2 + bounceY;

          if (s.mouseActive && s.hoverEffect !== 'none') {
            const dx = drawCol - mCol, dy = drawRow - mRow;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 10) {
              const prox = 1 - dist / 10;
              if (s.hoverEffect === 'ripple') {
                drawX += Math.sin(dist * 1.5 - t * 6) * prox * 3;
              } else if (s.hoverEffect === 'repel') {
                const angle = Math.atan2(dy, dx);
                drawX += Math.cos(angle) * prox * prox * 14;
                drawY += Math.sin(angle) * prox * prox * 14;
              }
            }
          }

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillText(ch, drawX, drawY);
        }
      }
    },
    destroy() { s.refCanvas = null; s.refData = null; },
  };
}

export default {
  name: 'Smiley',
  description: '3D bouncing smiley face',
  params: {
    speed: { min: 0.1, max: 3, default: 0.8, label: 'Speed', step: 0.05 },
    bounce: { min: 0, max: 1, default: 0.5, label: 'Bounce', step: 0.05 },
    scale: { min: 0.5, max: 2, default: 1.0, label: 'Scale', step: 0.05 },
    glow: { min: 0, max: 1, default: 0.4, label: 'Glow', step: 0.05 },
  },
  colors: { bg: '#E8E0D0', primary: '#FFCC00', secondary: '#3366CC', glow: '#FFE44D' },
  createInstance,
};
