// Skull — photorealistic ASCII from brightness map with rotation animation
// Reference: detailed human skull on black background

const DEPTH_CHARS = ' .·:;=+*#%@█▓▒░';
const DENSE_CHARS = ' .,·:;-~=+*!|?#%@$&█▓▒░';

// Draw a photorealistic skull onto an offscreen canvas
function drawSkullReference(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // Black background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h * 0.42;

  // Cranium — large ellipse with bone-colored gradient
  const cranGrad = ctx.createRadialGradient(cx, cy - h * 0.05, h * 0.02, cx, cy, h * 0.35);
  cranGrad.addColorStop(0, '#D4C8B8');
  cranGrad.addColorStop(0.3, '#C4B8A2');
  cranGrad.addColorStop(0.6, '#A89880');
  cranGrad.addColorStop(0.85, '#706050');
  cranGrad.addColorStop(1, '#000000');
  ctx.fillStyle = cranGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.38, h * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  // Forehead highlight
  const fhGrad = ctx.createRadialGradient(cx, cy - h * 0.12, 0, cx, cy - h * 0.08, h * 0.18);
  fhGrad.addColorStop(0, 'rgba(220,210,195,0.6)');
  fhGrad.addColorStop(1, 'rgba(220,210,195,0)');
  ctx.fillStyle = fhGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy - h * 0.12, w * 0.28, h * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Brow ridge — darker band
  ctx.fillStyle = 'rgba(80,65,50,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + h * 0.02, w * 0.32, h * 0.04, 0, 0, Math.PI);
  ctx.fill();

  // Left eye socket — deep black
  ctx.fillStyle = '#080808';
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.13, cy + h * 0.06, w * 0.1, h * 0.08, -0.15, 0, Math.PI * 2);
  ctx.fill();
  // Socket rim highlight
  const lEyeRim = ctx.createRadialGradient(cx - w * 0.13, cy + h * 0.06, w * 0.06, cx - w * 0.13, cy + h * 0.06, w * 0.12);
  lEyeRim.addColorStop(0, 'rgba(0,0,0,0)');
  lEyeRim.addColorStop(0.7, 'rgba(0,0,0,0)');
  lEyeRim.addColorStop(1, 'rgba(160,140,120,0.4)');
  ctx.fillStyle = lEyeRim;
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.13, cy + h * 0.06, w * 0.12, h * 0.1, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Right eye socket
  ctx.fillStyle = '#080808';
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.13, cy + h * 0.06, w * 0.1, h * 0.08, 0.15, 0, Math.PI * 2);
  ctx.fill();
  const rEyeRim = ctx.createRadialGradient(cx + w * 0.13, cy + h * 0.06, w * 0.06, cx + w * 0.13, cy + h * 0.06, w * 0.12);
  rEyeRim.addColorStop(0, 'rgba(0,0,0,0)');
  rEyeRim.addColorStop(0.7, 'rgba(0,0,0,0)');
  rEyeRim.addColorStop(1, 'rgba(160,140,120,0.4)');
  ctx.fillStyle = rEyeRim;
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.13, cy + h * 0.06, w * 0.12, h * 0.1, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Nasal cavity — inverted triangle
  ctx.fillStyle = '#0A0A0A';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.05, cy + h * 0.14);
  ctx.lineTo(cx + w * 0.05, cy + h * 0.14);
  ctx.lineTo(cx, cy + h * 0.22);
  ctx.closePath();
  ctx.fill();
  // Nose bridge highlight
  ctx.fillStyle = 'rgba(180,165,145,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + h * 0.12, w * 0.03, h * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cheekbones — subtle highlights
  ctx.fillStyle = 'rgba(190,175,155,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.25, cy + h * 0.1, w * 0.08, h * 0.05, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.25, cy + h * 0.1, w * 0.08, h * 0.05, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Upper jaw / maxilla
  ctx.fillStyle = 'rgba(160,145,125,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + h * 0.25, w * 0.22, h * 0.06, 0, 0, Math.PI);
  ctx.fill();

  // Teeth — row of small rectangles
  const teethY = cy + h * 0.27;
  ctx.fillStyle = '#C8BCA8';
  for (let i = -5; i <= 5; i++) {
    const tx = cx + i * w * 0.028;
    const tw = w * 0.022;
    const th = h * 0.035;
    ctx.fillRect(tx - tw / 2, teethY, tw, th);
    // Gap between teeth
    ctx.fillStyle = '#2A2218';
    ctx.fillRect(tx + tw / 2 - 0.5, teethY, 1, th);
    ctx.fillStyle = '#C8BCA8';
  }

  // Lower jaw
  ctx.fillStyle = 'rgba(140,125,105,0.6)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + h * 0.34, w * 0.2, h * 0.08, 0, 0, Math.PI);
  ctx.fill();

  // Jaw shadow
  ctx.fillStyle = 'rgba(40,30,20,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + h * 0.38, w * 0.18, h * 0.05, 0, 0, Math.PI);
  ctx.fill();

  // Temple shadows (sides of skull)
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.36, cy - h * 0.02, w * 0.06, h * 0.2, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.36, cy - h * 0.02, w * 0.06, h * 0.2, -0.2, 0, Math.PI * 2);
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
      // Generate reference skull at high resolution
      s.refW = 120; s.refH = 140;
      s.refCanvas = drawSkullReference(s.refW, s.refH);
      const ctx = s.refCanvas.getContext('2d');
      s.refData = ctx.getImageData(0, 0, s.refW, s.refH).data;
    },
    update(dt, params) { s.time += dt * params.rotateSpeed; },
    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      if (!s.refData) return;

      const cols = Math.floor(width / charW);
      const rows = Math.floor(height / charH);

      // Calculate aspect-preserving placement
      const refAspect = s.refW / s.refH;
      const charAspect = charW / charH;
      const adjustedAspect = refAspect / charAspect;
      let fitCols, fitRows;
      if (adjustedAspect > cols / rows) {
        fitCols = cols;
        fitRows = Math.round(cols / adjustedAspect);
      } else {
        fitRows = rows;
        fitCols = Math.round(rows * adjustedAspect);
      }
      fitCols = Math.min(fitCols, cols);
      fitRows = Math.min(fitRows, rows);
      const ox = Math.floor((cols - fitCols) / 2);
      const oy = Math.floor((rows - fitRows) / 2);

      ctx.font = `600 ${charH - 2}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';

      const t = s.time;
      const mCol = s.mouseActive ? Math.floor(s.mouseX / charW) : -100;
      const mRow = s.mouseActive ? Math.floor(s.mouseY / charH) : -100;

      for (let row = 0; row < fitRows; row++) {
        for (let col = 0; col < fitCols; col++) {
          // Sample from reference with rotation warp
          const nx = col / fitCols;
          const ny = row / fitRows;

          // Rotation effect: horizontal displacement based on time
          const rotOffset = Math.sin(t) * 0.08;
          const perspectiveScale = 1 + Math.sin(t) * 0.04;
          const sampleX = (nx - 0.5) * perspectiveScale + 0.5 + rotOffset * (0.5 - ny);
          const sampleY = ny;

          if (sampleX < 0 || sampleX > 1 || sampleY < 0 || sampleY > 1) continue;

          const px = Math.floor(sampleX * (s.refW - 1));
          const py = Math.floor(sampleY * (s.refH - 1));
          const i = (py * s.refW + px) * 4;
          const r = s.refData[i], g = s.refData[i + 1], b = s.refData[i + 2];
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

          if (lum < 0.04) continue; // skip pure black

          // Char from brightness
          const cIdx = Math.floor(lum * (DENSE_CHARS.length - 1));
          const ch = DENSE_CHARS[Math.max(0, Math.min(DENSE_CHARS.length - 1, cIdx))];
          if (ch === ' ') continue;

          const drawCol = col + ox;
          const drawRow = row + oy;
          let drawX = drawCol * charW + charW / 2;
          let drawY = drawRow * charH + charH - 2;

          // Subtle breathing scale
          const breathe = 1 + Math.sin(t * 1.5) * params.wobble * 0.02;
          drawX = ox * charW + (drawX - ox * charW) * breathe;
          drawY = oy * charH + (drawY - oy * charH) * breathe;

          // Cursor interaction
          if (s.mouseActive && s.hoverEffect !== 'none') {
            const dx = drawCol - mCol, dy = drawRow - mRow;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 10) {
              const prox = 1 - dist / 10;
              if (s.hoverEffect === 'ripple') {
                drawX += Math.sin(dist * 1.5 - t * 6) * prox * 3;
                drawY += Math.cos(dist * 1.5 - t * 6) * prox * 2;
              } else if (s.hoverEffect === 'repel') {
                const angle = Math.atan2(dy, dx);
                drawX += Math.cos(angle) * prox * prox * 14;
                drawY += Math.sin(angle) * prox * prox * 14;
              } else if (s.hoverEffect === 'glitch' && Math.random() < prox * 0.3) {
                drawX += (Math.random() - 0.5) * 10;
                drawY += (Math.random() - 0.5) * 6;
              }
            }
          }

          // Color: bone tones mapped from reference
          const warmth = lum;
          const cr = Math.round(r * 0.9 + warmth * 40);
          const cg = Math.round(g * 0.85 + warmth * 30);
          const cb = Math.round(b * 0.8 + warmth * 20);
          ctx.fillStyle = `rgb(${Math.min(255, cr)},${Math.min(255, cg)},${Math.min(255, cb)})`;
          ctx.fillText(ch, drawX, drawY);
        }
      }
    },
    destroy() { s.refCanvas = null; s.refData = null; },
  };
}

export default {
  name: 'Skull',
  description: 'Photorealistic rotating skull',
  params: {
    rotateSpeed: { min: 0.1, max: 3, default: 0.6, label: 'Rotate Speed', step: 0.05 },
    scale: { min: 0.5, max: 2, default: 1.0, label: 'Scale', step: 0.05 },
    glow: { min: 0, max: 1, default: 0.5, label: 'Glow', step: 0.05 },
    wobble: { min: 0, max: 1, default: 0.3, label: 'Wobble', step: 0.05 },
  },
  colors: { bg: '#0A0A0B', primary: '#D4C8B8', secondary: '#706050', glow: '#E8E0D4' },
  createInstance,
};
