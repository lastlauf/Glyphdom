// 3D Rotating Skull — dense point cloud with cursor interaction
// Higher point density for richer ASCII rendering

function buildSkullPoints() {
  const pts = [];
  // Cranium — denser sphere sampling
  for (let lat = 0; lat <= Math.PI * 0.65; lat += 0.12) {
    for (let lon = 0; lon < Math.PI * 2; lon += 0.14) {
      pts.push({
        x: Math.sin(lat) * Math.cos(lon) * 1.0,
        y: Math.cos(lat) * 1.1 + 0.3,
        z: Math.sin(lat) * Math.sin(lon) * 0.85,
        type: 'cranium',
      });
    }
  }
  // Cheekbones — denser
  for (let a = 0; a < Math.PI * 2; a += 0.15) {
    pts.push({ x: Math.cos(a) * 0.92, y: -0.1 + Math.sin(a) * 0.25, z: Math.sin(a) * 0.72, type: 'cheek' });
    pts.push({ x: Math.cos(a) * 0.85, y: -0.05 + Math.sin(a) * 0.2, z: Math.sin(a) * 0.65, type: 'cheek' });
  }
  // Eye sockets — more detail
  for (let a = 0; a < Math.PI * 2; a += 0.2) {
    for (let r = 0.08; r <= 0.24; r += 0.06) {
      pts.push({ x: -0.38 + Math.cos(a) * r, y: 0.15 + Math.sin(a) * r * 0.7, z: 0.85, type: 'eye' });
      pts.push({ x:  0.38 + Math.cos(a) * r, y: 0.15 + Math.sin(a) * r * 0.7, z: 0.85, type: 'eye' });
    }
  }
  // Nasal cavity
  for (let a = 0; a < Math.PI * 2; a += 0.3) {
    for (let r = 0.04; r <= 0.12; r += 0.04) {
      pts.push({ x: Math.cos(a) * r, y: -0.05 + Math.sin(a) * r, z: 0.9, type: 'nose' });
    }
  }
  // Jaw / teeth row — denser
  for (let tx = -0.6; tx <= 0.6; tx += 0.1) {
    pts.push({ x: tx, y: -0.42, z: 0.7 + Math.abs(tx) * 0.2, type: 'teeth' });
    pts.push({ x: tx, y: -0.48, z: 0.68 + Math.abs(tx) * 0.2, type: 'teeth' });
    pts.push({ x: tx, y: -0.55, z: 0.6 + Math.abs(tx) * 0.2, type: 'jaw' });
    pts.push({ x: tx, y: -0.62, z: 0.55 + Math.abs(tx) * 0.18, type: 'jaw' });
  }
  // Jaw curve bottom — denser
  for (let a = -Math.PI * 0.3; a <= Math.PI * 1.3; a += 0.12) {
    pts.push({ x: Math.cos(a) * 0.7, y: -0.55 + Math.sin(a) * 0.15, z: Math.sin(a) * 0.4, type: 'jaw' });
    pts.push({ x: Math.cos(a) * 0.65, y: -0.62 + Math.sin(a) * 0.12, z: Math.sin(a) * 0.35, type: 'jaw' });
  }
  // Temple details
  for (let lat = 0.3; lat <= 0.7; lat += 0.15) {
    for (let lon = Math.PI * 0.6; lon < Math.PI * 1.4; lon += 0.18) {
      pts.push({
        x: Math.sin(lat) * Math.cos(lon) * 1.05,
        y: Math.cos(lat) * 0.9 + 0.1,
        z: Math.sin(lat) * Math.sin(lon) * 0.88,
        type: 'cranium',
      });
    }
  }
  return pts;
}

const SKULL_POINTS = buildSkullPoints();

// Richer density chars — inspired by classic ASCII art shading
const DEPTH_CHARS = ' .·:;=+*#%@█▓▒░';

function project(x, y, z, cx, cy, fov) {
  const scale = fov / (fov + z);
  return { sx: cx + x * scale * cx * 0.75, sy: cy - y * scale * cy * 0.85, scale };
}

function charForType(type, depth) {
  if (type === 'eye') return depth > 0.5 ? '◉' : '●';
  if (type === 'nose') return depth > 0.4 ? '▼' : '▾';
  if (type === 'teeth') return '▄';
  if (type === 'jaw') {
    if (depth > 0.5) return '▓';
    if (depth > 0.3) return '▒';
    return '░';
  }
  // cranium/cheek — richer depth mapping
  const idx = Math.floor(depth * (DEPTH_CHARS.length - 1));
  return DEPTH_CHARS[Math.max(0, Math.min(DEPTH_CHARS.length - 1, idx))];
}

function lerpColor(a, b, t) {
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
  return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`;
}

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
    update(dt, params) { s.time += dt * params.rotateSpeed; },
    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);
      const cx = width / 2, cy = height / 2;
      const fov = Math.min(width, height) * 0.9;
      const t = s.time;
      const cosY = Math.cos(t), sinY = Math.sin(t);
      const cosX = Math.cos(Math.sin(t * 0.4) * 0.35);
      const sinX = Math.sin(Math.sin(t * 0.4) * 0.35);
      const scale = params.scale;
      const wobble = params.wobble;

      const mCol = s.mouseActive ? Math.floor(s.mouseX / charW) : -100;
      const mRow = s.mouseActive ? Math.floor(s.mouseY / charH) : -100;

      const projected = [];
      for (const pt of SKULL_POINTS) {
        const rx = pt.x * cosY - pt.z * sinY;
        const rz = pt.x * sinY + pt.z * cosY;
        const ry_before = pt.y;
        const ry = ry_before * cosX - rz * sinX + Math.sin(t * 0.7) * wobble * 0.1;
        const rz2 = ry_before * sinX + rz * cosX;
        const { sx, sy } = project(rx * scale, ry * scale, rz2 * scale * 0.6, cx, cy, fov);
        const depth = (rz2 + 1.5) / 3;
        projected.push({ sx, sy, depth, type: pt.type });
      }

      projected.sort((a, b) => a.depth - b.depth);

      ctx.font = `700 ${charH - 2}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';

      for (const { sx, sy, depth, type } of projected) {
        if (sx < 0 || sx > width || sy < 0 || sy > height) continue;
        const col = Math.floor(sx / charW), row = Math.floor(sy / charH);
        let drawX = col * charW + charW / 2, drawY = row * charH + charH - 2;

        // Cursor interaction
        if (s.mouseActive && s.hoverEffect !== 'none') {
          const dx = col - mCol;
          const dy = row - mRow;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 10) {
            const prox = 1 - dist / 10;
            if (s.hoverEffect === 'ripple') {
              drawX += Math.sin(dist * 1.5 - s.time * 6) * prox * 3;
              drawY += Math.cos(dist * 1.5 - s.time * 6) * prox * 2;
            } else if (s.hoverEffect === 'repel') {
              const angle = Math.atan2(dy, dx);
              drawX += Math.cos(angle) * prox * prox * 15;
              drawY += Math.sin(angle) * prox * prox * 15;
            } else if (s.hoverEffect === 'glitch' && Math.random() < prox * 0.3) {
              drawX += (Math.random() - 0.5) * 10;
              drawY += (Math.random() - 0.5) * 6;
            }
          }
        }

        const ch = charForType(type, depth);

        if (type === 'eye' || type === 'nose') {
          ctx.fillStyle = colors.secondary;
        } else if (type === 'teeth') {
          ctx.fillStyle = '#EEEEEE';
        } else {
          const t2 = Math.max(0, Math.min(1, (depth - 0.2) / 0.7));
          ctx.fillStyle = lerpColor(colors.secondary, colors.primary, t2);
        }
        ctx.fillText(ch, drawX, drawY);
      }
    },
    destroy() {},
  };
}

export default {
  name: 'Skull',
  description: '3D rotating skull',
  params: {
    rotateSpeed: { min: 0.1, max: 3, default: 0.8, label: 'Rotate Speed', step: 0.05 },
    scale: { min: 0.5, max: 2, default: 1.0, label: 'Scale', step: 0.05 },
    glow: { min: 0, max: 1, default: 0.5, label: 'Glow', step: 0.05 },
    wobble: { min: 0, max: 1, default: 0.4, label: 'Wobble', step: 0.05 },
  },
  colors: { bg: '#0A0A0B', primary: '#E8E4DC', secondary: '#555550', glow: '#FFFFFF' },
  createInstance,
};
