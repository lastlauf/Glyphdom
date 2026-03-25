// Mario — NES scene based on reference screenshot
// Purple/blue sky, brick platform, pipes, mushroom, scrolling

const CHARS = ' .,·:;-~=+*!|?#%@$&█▓▒░';

// Draw the classic Mario scene on an offscreen canvas
function drawMarioScene(w, h, scrollX) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // Purple-blue sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
  skyGrad.addColorStop(0, '#7070CC');
  skyGrad.addColorStop(1, '#8888DD');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Ground pattern — brick
  const groundY = h * 0.82;
  ctx.fillStyle = '#C84C0C';
  ctx.fillRect(0, groundY, w, h - groundY);
  // Brick lines
  ctx.strokeStyle = '#8B3000';
  ctx.lineWidth = 1;
  for (let gy = groundY; gy < h; gy += 8) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
    const offset = (Math.floor((gy - groundY) / 8) % 2) * 8;
    for (let gx = offset - scrollX % 16; gx < w; gx += 16) {
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx, gy + 8);
      ctx.stroke();
    }
  }

  // Hills in background
  ctx.fillStyle = '#228B22';
  const hills = [
    { x: (80 - scrollX * 0.3) % (w + 120) - 60, r: 50 },
    { x: (250 - scrollX * 0.3) % (w + 120) - 60, r: 35 },
    { x: (450 - scrollX * 0.3) % (w + 120) - 60, r: 60 },
  ];
  for (const hill of hills) {
    ctx.beginPath();
    ctx.arc(hill.x, groundY, hill.r, Math.PI, 0);
    ctx.fill();
  }
  // Hill highlight
  ctx.fillStyle = '#33AA33';
  for (const hill of hills) {
    ctx.beginPath();
    ctx.arc(hill.x, groundY, hill.r * 0.7, Math.PI, 0);
    ctx.fill();
  }

  // Brick platform (floating)
  const platX = 140 - (scrollX * 0.8) % (w + 200);
  const platY = h * 0.48;
  ctx.fillStyle = '#C84C0C';
  for (let bx = 0; bx < 6; bx++) {
    ctx.fillRect(platX + bx * 16, platY, 15, 15);
    ctx.strokeStyle = '#8B3000';
    ctx.strokeRect(platX + bx * 16, platY, 15, 15);
  }

  // Question block
  const qx = platX + 3 * 16;
  ctx.fillStyle = '#E8A800';
  ctx.fillRect(qx, platY, 15, 15);
  ctx.fillStyle = '#8B6500';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('?', qx + 7, platY + 12);

  // Mushroom on top of platform
  const mushX = platX + 2 * 16 + 3;
  const mushY = platY - 16;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(mushX + 2, mushY + 8, 10, 8);
  ctx.fillStyle = '#DD2200';
  ctx.beginPath();
  ctx.arc(mushX + 7, mushY + 8, 8, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(mushX + 4, mushY + 4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(mushX + 10, mushY + 4, 3, 0, Math.PI * 2);
  ctx.fill();

  // Floating question blocks (top)
  const fqx = 300 - (scrollX * 0.8) % (w + 400);
  ctx.fillStyle = '#E8A800';
  ctx.fillRect(fqx, h * 0.22, 15, 15);
  ctx.fillStyle = '#8B6500';
  ctx.fillText('?', fqx + 7, h * 0.22 + 12);

  // Pipe
  const pipeX = 360 - (scrollX * 0.8) % (w + 400);
  const pipeTop = groundY - 40;
  ctx.fillStyle = '#00AA00';
  ctx.fillRect(pipeX, pipeTop, 30, groundY - pipeTop);
  ctx.fillStyle = '#00CC00';
  ctx.fillRect(pipeX - 3, pipeTop, 36, 12);
  ctx.fillStyle = '#008800';
  ctx.fillRect(pipeX + 24, pipeTop + 12, 6, groundY - pipeTop - 12);

  // Mario (mid-jump)
  const marioX = w * 0.35;
  const marioY = h * 0.55 + Math.sin(scrollX * 0.03) * 15;
  // Hat
  ctx.fillStyle = '#DD2200';
  ctx.fillRect(marioX + 3, marioY, 10, 4);
  ctx.fillRect(marioX + 1, marioY + 4, 14, 3);
  // Face
  ctx.fillStyle = '#FFAA66';
  ctx.fillRect(marioX + 2, marioY + 7, 10, 5);
  // Eyes
  ctx.fillStyle = '#000';
  ctx.fillRect(marioX + 8, marioY + 8, 2, 2);
  // Body (overalls)
  ctx.fillStyle = '#DD2200';
  ctx.fillRect(marioX + 2, marioY + 12, 12, 6);
  // Overalls
  ctx.fillStyle = '#0066CC';
  ctx.fillRect(marioX + 3, marioY + 14, 10, 6);
  // Arms
  ctx.fillStyle = '#DD2200';
  ctx.fillRect(marioX, marioY + 13, 3, 5);
  ctx.fillRect(marioX + 13, marioY + 12, 3, 4);
  // Boots
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(marioX + 2, marioY + 20, 5, 3);
  ctx.fillRect(marioX + 9, marioY + 20, 5, 3);

  // Coins (bobbing)
  const coinPhase = scrollX * 0.05;
  for (let ci = 0; ci < 3; ci++) {
    const cx2 = 200 + ci * 20 - (scrollX * 0.8) % (w + 300);
    const cy2 = h * 0.35 + Math.sin(coinPhase + ci) * 4;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(cx2, cy2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    ctx.arc(cx2, cy2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  const clouds = [
    { x: (100 - scrollX * 0.15) % (w + 100), y: h * 0.1, s: 20 },
    { x: (300 - scrollX * 0.15) % (w + 100), y: h * 0.15, s: 25 },
    { x: (480 - scrollX * 0.15) % (w + 100), y: h * 0.08, s: 18 },
  ];
  for (const cl of clouds) {
    ctx.beginPath();
    ctx.arc(cl.x, cl.y, cl.s, 0, Math.PI * 2);
    ctx.arc(cl.x - cl.s * 0.7, cl.y + 2, cl.s * 0.7, 0, Math.PI * 2);
    ctx.arc(cl.x + cl.s * 0.7, cl.y + 2, cl.s * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  return c;
}

function createInstance() {
  const s = {
    time: 0, scroll: 0,
    mouseX: -1, mouseY: -1, mouseActive: false, hoverEffect: 'ripple',
  };

  return {
    setMouse(x, y, active, effect) {
      s.mouseX = x; s.mouseY = y; s.mouseActive = active; s.hoverEffect = effect;
    },
    init(canvas, params, colors) { s.time = 0; s.scroll = 0; },
    update(dt, params) {
      s.time += dt;
      s.scroll += dt * params.speed * 40;
    },
    render(ctx, width, height, charW, charH, params, colors) {
      // Draw scene at current scroll position
      const refW = Math.floor(width / 2);
      const refH = Math.floor(height / 2);
      const scene = drawMarioScene(refW, refH, s.scroll);
      const sCtx = scene.getContext('2d');
      const imageData = sCtx.getImageData(0, 0, refW, refH).data;

      ctx.fillStyle = '#7070CC';
      ctx.fillRect(0, 0, width, height);

      const cols = Math.floor(width / charW);
      const rows = Math.floor(height / charH);

      ctx.font = `500 ${charH - 2}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';

      const t = s.time;
      const mCol = s.mouseActive ? Math.floor(s.mouseX / charW) : -100;
      const mRow = s.mouseActive ? Math.floor(s.mouseY / charH) : -100;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const px = Math.floor(col / cols * (refW - 1));
          const py = Math.floor(row / rows * (refH - 1));
          const i = (py * refW + px) * 4;
          const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2];
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

          const cIdx = Math.floor(lum * (CHARS.length - 1));
          const ch = CHARS[Math.max(0, Math.min(CHARS.length - 1, cIdx))];
          if (ch === ' ') continue;

          let drawX = col * charW + charW / 2;
          let drawY = row * charH + charH - 2;

          // Cursor interaction
          if (s.mouseActive && s.hoverEffect !== 'none') {
            const dx = col - mCol, dy = row - mRow;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 10) {
              const prox = 1 - dist / 10;
              if (s.hoverEffect === 'ripple') {
                drawX += Math.sin(dist - t * 6) * prox * 3;
              } else if (s.hoverEffect === 'repel') {
                const angle = Math.atan2(dy, dx);
                drawX += Math.cos(angle) * prox * prox * 12;
                drawY += Math.sin(angle) * prox * prox * 12;
              } else if (s.hoverEffect === 'glitch' && Math.random() < prox * 0.3) {
                drawX += (Math.random() - 0.5) * 8;
              }
            }
          }

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillText(ch, drawX, drawY);
        }
      }
    },
    destroy() {},
  };
}

export default {
  name: 'Mario',
  description: 'Classic NES side-scroller',
  params: {
    speed: { min: 0.1, max: 3, default: 1.0, label: 'Scroll Speed', step: 0.05 },
    scale: { min: 0.5, max: 2, default: 1.0, label: 'Scale', step: 0.05 },
    glow: { min: 0, max: 1, default: 0.3, label: 'Glow', step: 0.05 },
  },
  colors: { bg: '#7070CC', primary: '#DD2200', secondary: '#00AA00', glow: '#FFD700' },
  createInstance,
};
