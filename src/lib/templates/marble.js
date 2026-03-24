// Marble flow — factory pattern
const CHARS_MARBLE = ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) | 0; h = Math.imul(h, 1274126177) | 0;
  return (h ^ (h >>> 16)) / 0x80000000;
}
function smoothNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return hash(ix,iy) + (hash(ix+1,iy)-hash(ix,iy))*ux + (hash(ix,iy+1)-hash(ix,iy))*uy + (hash(ix,iy)-hash(ix+1,iy)-hash(ix,iy+1)+hash(ix+1,iy+1))*ux*uy;
}
function fbm(x, y, oct, lac, gain) {
  let val = 0, amp = 1, freq = 1, total = 0;
  for (let i = 0; i < oct; i++) { val += smoothNoise(x*freq, y*freq)*amp; total += amp; freq *= lac; amp *= gain; }
  return val / total;
}
function lerpColor(a, b, t) {
  const ar=parseInt(a.slice(1,3),16), ag=parseInt(a.slice(3,5),16), ab=parseInt(a.slice(5,7),16);
  const br=parseInt(b.slice(1,3),16), bg=parseInt(b.slice(3,5),16), bb=parseInt(b.slice(5,7),16);
  return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;
}

function createInstance() {
  const s = { time: 0 };
  return {
    init(canvas, params, colors) { s.time = 0; },
    update(dt, params) { s.time += dt * params.speed; },
    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, width, height);
      const cols = Math.floor(width / charW), rows = Math.floor(height / charH);
      ctx.font = `400 ${charH - 3}px "JetBrains Mono", monospace`; ctx.textAlign = 'center';
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const nx = (col/cols)*params.scale*params.turbulence, ny = (row/rows)*params.scale*params.turbulence;
          const t = s.time;
          const w1 = fbm(nx+t*0.3, ny+t*0.2, Math.round(params.detail), 2.0, 0.5);
          const w2 = fbm(nx+w1+t*0.1, ny+w1-t*0.15, Math.round(params.detail), 2.1, 0.45);
          const marble = Math.sin(nx*2 + w2*params.turbulence + t*0.5)*0.5+0.5;
          const idx = Math.floor(marble * (CHARS_MARBLE.length - 1));
          const ch = CHARS_MARBLE[idx];
          if (ch === ' ') continue;
          ctx.fillStyle = lerpColor(colors.secondary, colors.primary, marble);
          ctx.fillText(ch, col*charW+charW/2, row*charH+charH-3);
        }
      }
    },
    destroy() {},
  };
}

export default {
  name: 'Marble',
  description: 'Flowing organic noise patterns',
  params: {
    speed:      { min: 0.1, max: 2,  default: 0.4, label: 'Flow Speed',   step: 0.05 },
    turbulence: { min: 0.5, max: 8,  default: 3.0, label: 'Turbulence',   step: 0.1  },
    detail:     { min: 1,   max: 6,  default: 4,   label: 'Detail Level', step: 1    },
    scale:      { min: 0.5, max: 4,  default: 1.5, label: 'Scale',        step: 0.1  },
  },
  colors: { bg: '#0A0A0B', primary: '#C8A882', secondary: '#5C4A3A', glow: '#D4B896' },
  createInstance,
};
