// Fire — factory pattern
const FIRE_CHARS = ' .\'`^":;-~+*!|xX#%@';
function heatToChar(h) { return FIRE_CHARS[Math.max(0, Math.min(FIRE_CHARS.length-1, Math.floor((h/255)*(FIRE_CHARS.length-1))))]; }
function lerpColor(a, b, t) {
  const ar=parseInt(a.slice(1,3),16), ag=parseInt(a.slice(3,5),16), ab=parseInt(a.slice(5,7),16);
  const br=parseInt(b.slice(1,3),16), bg=parseInt(b.slice(3,5),16), bb=parseInt(b.slice(5,7),16);
  return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;
}
function heatToColor(heat, primary, secondary) {
  if (heat < 30) return null;
  if (heat < 80) return lerpColor(secondary, primary, (heat-30)/50);
  if (heat < 200) return lerpColor(primary, '#FFB000', (heat-80)/120);
  return lerpColor('#FFB000', '#FFFFFF', (heat-200)/55);
}

function createInstance() {
  const s = { buf: null, buf2: null, cols: 0, rows: 0, cw: 10, ch: 16, time: 0, embers: [] };
  return {
    init(canvas, params, colors) {
      s.cw = 10; s.ch = 16;
      s.cols = Math.floor(canvas.width / s.cw);
      s.rows = Math.floor(canvas.height / s.ch);
      s.buf  = new Uint8Array(s.cols * s.rows).fill(0);
      s.buf2 = new Uint8Array(s.cols * s.rows).fill(0);
      s.time = 0; s.embers = [];
    },
    update(dt, params) {
      s.time += dt * params.speed;
      const { cols, rows, buf, buf2 } = s;
      const cx = Math.floor(cols/2), hw = Math.floor(cols * params.width * 0.5);
      for (let x = 0; x < cols; x++) {
        const inRange = x >= cx-hw && x <= cx+hw;
        buf[(rows-1)*cols+x] = inRange && Math.random() < params.intensity
          ? Math.floor(200 + Math.random()*55) : Math.floor(Math.random()*50);
      }
      for (let y = 0; y < rows-1; y++) {
        for (let x = 0; x < cols; x++) {
          const decay = 2 + Math.floor(Math.random()*4);
          const l = x>0 ? buf[(y+1)*cols+x-1] : 0;
          const r = x<cols-1 ? buf[(y+1)*cols+x+1] : 0;
          const d = buf[(y+1)*cols+x];
          const d2 = y<rows-2 ? buf[(y+2)*cols+x] : 0;
          buf2[y*cols+x] = Math.max(0, Math.round((l+r+d+d2)/4 - decay));
        }
      }
      for (let i = 0; i < cols*(rows-1); i++) buf[i] = buf2[i];
      s.embers = s.embers.filter(e => e.life > 0);
      while (s.embers.length < params.emberCount) {
        s.embers.push({ x: cx-hw + Math.random()*hw*2, y: rows-2,
          vx: (Math.random()-0.5)*0.3, vy: -(0.5+Math.random()*1.5), life: 20+Math.floor(Math.random()*40) });
      }
      for (const e of s.embers) { e.x += e.vx; e.vy *= 0.98; e.y += e.vy; e.life--; }
    },
    render(ctx, width, height, charW, charH, params, colors) {
      const { cols, rows, buf, cw, ch } = s;
      ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, width, height);
      ctx.font = `500 ${ch-2}px "JetBrains Mono", monospace`; ctx.textAlign = 'center';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const heat = buf[y*cols+x]; if (heat < 15) continue;
          const c2 = heatToChar(heat); if (c2 === ' ') continue;
          const color = heatToColor(heat, colors.primary, colors.secondary); if (!color) continue;
          ctx.fillStyle = color;
          ctx.fillText(c2, x*cw+cw/2, y*ch+ch-2);
        }
      }
      ctx.font = `600 10px "JetBrains Mono", monospace`;
      for (const e of s.embers) {
        ctx.globalAlpha = e.life/60; ctx.fillStyle = colors.glow;  
        ctx.fillText('*', e.x*cw+cw/2, e.y*ch);
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
    intensity:  { min: 0.1, max: 1,  default: 0.75, label: 'Intensity',    step: 0.05 },
    width:      { min: 0.2, max: 1,  default: 0.8,  label: 'Spread Width', step: 0.05 },
    speed:      { min: 0.5, max: 3,  default: 1.2,  label: 'Speed',        step: 0.05 },
    emberCount: { min: 0,   max: 50, default: 20,   label: 'Embers',       step: 1    },
  },
  colors: { bg: '#0A0A0B', primary: '#FF4500', secondary: '#8B0000', glow: '#FF6600' },
  createInstance,
};
