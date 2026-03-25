// Matrix rain — dense, high-quality with cursor interaction
const CHARS_KATAKANA = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
const CHARS_BINARY = '01';
const CHARS_HEX = '0123456789ABCDEF';
const CHARS_DENSE = '░▒▓█▀▄▌▐│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├┼┘┌';
const CHARS_MATRIX = CHARS_KATAKANA + CHARS_HEX + CHARS_DENSE;

function getCharSet(idx) {
  return [CHARS_MATRIX, CHARS_BINARY, CHARS_HEX, CHARS_DENSE][Math.round(idx)] || CHARS_MATRIX;
}
function randomChar(cs) { return cs[Math.floor(Math.random() * cs.length)]; }

function createInstance() {
  const s = {
    columns: [], charW: 10, charH: 14, cols: 0, rows: 0,
    charSet: CHARS_MATRIX, time: 0,
    mouseX: -1, mouseY: -1, mouseActive: false, hoverEffect: 'ripple'
  };

  return {
    setMouse(x, y, active, effect) {
      s.mouseX = x; s.mouseY = y; s.mouseActive = active; s.hoverEffect = effect;
    },
    init(canvas, params, colors) {
      s.charW = 10; s.charH = 14; s.time = 0;
      s.cols = Math.floor(canvas.width / s.charW);
      s.rows = Math.floor(canvas.height / s.charH);
      const cs = getCharSet(params.charSet);
      s.charSet = cs;
      s.columns = [];
      for (let c = 0; c < s.cols; c++) {
        if (Math.random() < params.density) {
          s.columns.push({
            x: c, y: Math.random() * -s.rows,
            speed: (0.3 + Math.random() * 0.7) * params.speed,
            length: Math.floor(params.trailLength * (0.5 + Math.random() * 0.5)),
            chars: Array.from({ length: 50 }, () => randomChar(cs)),
            ticker: 0, tickRate: 1 + Math.floor(Math.random() * 3),
          });
        }
      }
    },
    update(dt, params) {
      s.time += dt;
      const cs = getCharSet(params.charSet);
      s.charSet = cs;
      for (const col of s.columns) {
        col.ticker++;
        if (col.ticker >= col.tickRate) {
          col.ticker = 0;
          col.y += params.speed;
          if (Math.random() < 0.4) col.chars[Math.floor(Math.random() * col.chars.length)] = randomChar(cs);
        }
        if (col.y - col.length > s.rows) {
          col.y = Math.random() * -10;
          col.speed = (0.3 + Math.random() * 0.7) * params.speed;
          col.length = Math.floor(params.trailLength * (0.5 + Math.random() * 0.5));
        }
      }
      // Continuously spawn new columns
      if (Math.random() < 0.05 && s.columns.length < s.cols * params.density * 1.8) {
        const c = Math.floor(Math.random() * s.cols);
        s.columns.push({
          x: c, y: 0,
          speed: (0.3 + Math.random() * 0.7) * params.speed,
          length: Math.floor(params.trailLength * (0.5 + Math.random() * 0.5)),
          chars: Array.from({ length: 50 }, () => randomChar(cs)),
          ticker: 0, tickRate: 1 + Math.floor(Math.random() * 3),
        });
      }
    },
    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.font = `600 ${s.charH - 2}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';

      const mCol = s.mouseActive ? Math.floor(s.mouseX / s.charW) : -100;
      const mRow = s.mouseActive ? Math.floor(s.mouseY / s.charH) : -100;
      const hoverRadius = 8; // in cells

      for (const col of s.columns) {
        const headY = Math.floor(col.y);
        for (let i = 0; i < col.length; i++) {
          const cy = headY - i;
          if (cy < 0 || cy >= s.rows) continue;
          const ch = col.chars[((headY - i) + col.chars.length) % col.chars.length];
          const fade = 1 - i / col.length;

          let x = col.x * s.charW + s.charW / 2;
          let y = cy * s.charH + s.charH - 3;
          let extraBright = 0;

          // Cursor interaction
          if (s.mouseActive && s.hoverEffect !== 'none') {
            const dx = col.x - mCol;
            const dy = cy - mRow;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < hoverRadius) {
              const proximity = 1 - dist / hoverRadius;
              if (s.hoverEffect === 'ripple') {
                const ripple = Math.sin(dist * 1.2 - s.time * 8) * proximity * 4;
                x += ripple;
                y += ripple * 0.5;
                extraBright = proximity * 0.4;
              } else if (s.hoverEffect === 'repel') {
                const angle = Math.atan2(dy, dx);
                const push = proximity * proximity * 12;
                x += Math.cos(angle) * push;
                y += Math.sin(angle) * push;
              } else if (s.hoverEffect === 'glitch') {
                if (Math.random() < proximity * 0.4) {
                  x += (Math.random() - 0.5) * 8;
                  y += (Math.random() - 0.5) * 4;
                  extraBright = Math.random() * 0.5;
                }
              } else if (s.hoverEffect === 'spotlight') {
                extraBright = proximity * 0.6;
              }
            }
          }

          if (i === 0) {
            ctx.fillStyle = '#FFFFFF';
          } else if (i === 1) {
            ctx.fillStyle = colors.primary;
          } else {
            const alpha = Math.min(1, Math.pow(fade, 1.4) + extraBright);
            const r = parseInt(colors.secondary.slice(1, 3), 16);
            const g = parseInt(colors.secondary.slice(3, 5), 16);
            const b = parseInt(colors.secondary.slice(5, 7), 16);
            const pr = parseInt(colors.primary.slice(1, 3), 16);
            const pg = parseInt(colors.primary.slice(3, 5), 16);
            const pb = parseInt(colors.primary.slice(5, 7), 16);
            const mix = extraBright;
            const fr = Math.round(r + (pr - r) * mix);
            const fg = Math.round(g + (pg - g) * mix);
            const fb = Math.round(b + (pb - b) * mix);
            ctx.fillStyle = `rgba(${fr},${fg},${fb},${alpha})`;
          }
          ctx.fillText(ch, x, y);
        }
      }
    },
    destroy() { s.columns = []; },
  };
}

export default {
  name: 'Matrix',
  description: 'Cascading character rain',
  params: {
    speed:       { min: 0.1, max: 3,  default: 0.9,  label: 'Fall Speed',   step: 0.05 },
    density:     { min: 0.1, max: 1,  default: 0.65, label: 'Density',      step: 0.05 },
    trailLength: { min: 3,   max: 50, default: 22,   label: 'Trail Length', step: 1    },
    charSet:     { min: 0,   max: 3,  default: 0,    label: 'Char Set',     step: 1    },
  },
  colors: { bg: '#0A0A0B', primary: '#00FF41', secondary: '#003B00', glow: '#00FF41' },
  createInstance,
};
