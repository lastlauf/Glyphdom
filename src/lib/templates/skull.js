// 3D Rotating Skull — ASCII art animation
// Skull is rendered as a 3D mesh rotated over time

// Skull shape as ASCII art frames (viewed from front)
const SKULL_SHAPE = [
  '   .d8888b.   ',
  '  d88P  Y88b  ',
  ' 888      888 ',
  ' 888  db  888 ',
  ' 888      888 ',
  '  "88b..d88"  ',
  '   "Y8888P"   ',
  '     /||\\     ',
  '    /_||_\\    ',
];

// 3D skull point cloud — generate programmatically
function buildSkullPoints() {
  const pts = [];
  // Cranium — upper sphere
  for (let lat = 0; lat <= Math.PI * 0.65; lat += 0.18) {
    for (let lon = 0; lon < Math.PI * 2; lon += 0.22) {
      pts.push({
        x: Math.sin(lat) * Math.cos(lon) * 1.0,
        y: Math.cos(lat) * 1.1 + 0.3,
        z: Math.sin(lat) * Math.sin(lon) * 0.85,
        type: 'cranium',
      });
    }
  }
  // Cheekbones
  for (let a = 0; a < Math.PI * 2; a += 0.25) {
    pts.push({ x: Math.cos(a) * 0.9, y: -0.1 + Math.sin(a) * 0.25, z: Math.sin(a) * 0.7, type: 'cheek' });
  }
  // Eye sockets — two hollow regions
  for (let a = 0; a < Math.PI * 2; a += 0.35) {
    // left eye
    pts.push({ x: -0.38 + Math.cos(a)*0.22, y: 0.15 + Math.sin(a)*0.15, z: 0.85, type: 'eye' });
    // right eye
    pts.push({ x:  0.38 + Math.cos(a)*0.22, y: 0.15 + Math.sin(a)*0.15, z: 0.85, type: 'eye' });
  }
  // Nasal cavity
  for (let a = 0; a < Math.PI * 2; a += 0.5) {
    pts.push({ x: Math.cos(a)*0.1, y: -0.05 + Math.sin(a)*0.1, z: 0.9, type: 'nose' });
  }
  // Jaw / teeth row
  for (let tx = -0.55; tx <= 0.55; tx += 0.18) {
    pts.push({ x: tx, y: -0.42, z: 0.7 + Math.abs(tx)*0.2, type: 'teeth' });
    pts.push({ x: tx, y: -0.55, z: 0.6 + Math.abs(tx)*0.2, type: 'jaw' });
  }
  // Jaw curve bottom
  for (let a = -Math.PI * 0.3; a <= Math.PI * 1.3; a += 0.22) {
    pts.push({ x: Math.cos(a)*0.7, y: -0.55 + Math.sin(a)*0.15, z: Math.sin(a)*0.4, type: 'jaw' });
  }
  return pts;
}

const SKULL_POINTS = buildSkullPoints();

function project(x, y, z, cx, cy, fov) {
  const scale = fov / (fov + z);
  return { sx: cx + x * scale * cx * 0.75, sy: cy - y * scale * cy * 0.85, scale };
}

function charForType(type, depth) {
  if (type === 'eye')   return depth > 0.5 ? '@' : '#';
  if (type === 'nose')  return depth > 0.4 ? '#' : 'o';
  if (type === 'teeth') return '█';
  if (type === 'jaw')   return depth > 0.4 ? '▄' : '░';
  // cranium/cheek — vary by depth
  if (depth > 0.85) return '█';
  if (depth > 0.70) return '▓';
  if (depth > 0.55) return '▒';
  if (depth > 0.40) return '░';
  if (depth > 0.25) return ':';
  return '.';
}

function createInstance() {
  const s = { time: 0 };
  return {
    init(canvas, params, colors) { s.time = 0; },
    update(dt, params) { s.time += dt * params.rotateSpeed; },
    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, width, height);
      const cx = width / 2, cy = height / 2;
      const fov = Math.min(width, height) * 0.9;
      const t = s.time;
      const cosY = Math.cos(t), sinY = Math.sin(t);
      const cosX = Math.cos(Math.sin(t * 0.4) * 0.35);
      const sinX = Math.sin(Math.sin(t * 0.4) * 0.35);

      // scale for params
      const scale = params.scale;
      const wobble = params.wobble;

      const projected = [];
      for (const pt of SKULL_POINTS) {
        // Y-axis rotation (spin)
        const rx = pt.x * cosY - pt.z * sinY;
        const rz = pt.x * sinY + pt.z * cosY;
        const ry_before = pt.y;
        // X-axis tilt (nod)
        const ry = ry_before * cosX - rz * sinX + Math.sin(t * 0.7) * wobble * 0.1;
        const rz2 = ry_before * sinX + rz * cosX;

        const { sx, sy, scale: proj_scale } = project(rx * scale, ry * scale, rz2 * scale * 0.6, cx, cy, fov);
        const depth = (rz2 + 1.5) / 3;
        projected.push({ sx, sy, depth, type: pt.type, proj_scale });
      }

      // Sort back to front
      projected.sort((a, b) => a.depth - b.depth);

      ctx.font = `700 ${charH - 2}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';

      for (const { sx, sy, depth, type, proj_scale } of projected) {
        if (sx < 0 || sx > width || sy < 0 || sy > height) continue;
        const col = Math.floor(sx / charW), row = Math.floor(sy / charH);
        const drawX = col * charW + charW / 2, drawY = row * charH + charH - 2;

        const ch = charForType(type, depth);

        if (type === 'eye' || type === 'nose') {
          ctx.fillStyle = colors.secondary;
          
        } else if (type === 'teeth') {
          ctx.fillStyle = '#EEEEEE';
          
        } else {
          // gradient from secondary (dark) to primary (bright)
          const t2 = Math.max(0, Math.min(1, (depth - 0.2) / 0.7));
          ctx.fillStyle = lerpColor(colors.secondary, colors.primary, t2);
        }
        ctx.fillText(ch, drawX, drawY);
      }
      
    },
    destroy() {},
  };
}

function lerpColor(a, b, t) {
  const ar=parseInt(a.slice(1,3),16),ag=parseInt(a.slice(3,5),16),ab=parseInt(a.slice(5,7),16);
  const br=parseInt(b.slice(1,3),16),bg=parseInt(b.slice(3,5),16),bb=parseInt(b.slice(5,7),16);
  return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;
}

export default {
  name: 'Skull',
  description: '3D rotating skull',
  params: {
    rotateSpeed: { min: 0.1, max: 3,  default: 0.8, label: 'Rotate Speed', step: 0.05 },
    scale:       { min: 0.5, max: 2,  default: 1.0, label: 'Scale',        step: 0.05 },
    glow:        { min: 0,   max: 1,  default: 0.5, label: 'Glow',         step: 0.05 },
    wobble:      { min: 0,   max: 1,  default: 0.4, label: 'Wobble',       step: 0.05 },
  },
  colors: { bg: '#0A0A0B', primary: '#E8E4DC', secondary: '#555550', glow: '#FFFFFF' },
  createInstance,
};
