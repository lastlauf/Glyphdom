// Matrix rain — factory pattern for isolated state per canvas instance
const CHARS_KATAKANA = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
const CHARS_BINARY = '01';
const CHARS_HEX = '0123456789ABCDEF';
const CHARS_ASCII = '!@#$%^&*()_+-=[]{}|;:,.<>?/\\~`';
const CHARS_MATRIX = CHARS_KATAKANA + CHARS_HEX + '01';

function getCharSet(idx) {
  return [CHARS_MATRIX, CHARS_BINARY, CHARS_HEX, CHARS_ASCII][Math.round(idx)] || CHARS_MATRIX;
}
function randomChar(cs) { return cs[Math.floor(Math.random() * cs.length)]; }

function createInstance() {
  const s = { columns: [], charW: 14, charH: 20, cols: 0, rows: 0, charSet: CHARS_MATRIX, time: 0 };

  return {
    init(canvas, params, colors) {
      s.charW = 14; s.charH = 20; s.time = 0;
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
            chars: Array.from({ length: 40 }, () => randomChar(cs)),
            ticker: 0, tickRate: 2 + Math.floor(Math.random() * 4),
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
          if (Math.random() < 0.3) col.chars[Math.floor(Math.random() * col.chars.length)] = randomChar(cs);
        }
        if (col.y - col.length > s.rows) {
          col.y = Math.random() * -10;
          col.speed = (0.3 + Math.random() * 0.7) * params.speed;
          col.length = Math.floor(params.trailLength * (0.5 + Math.random() * 0.5));
        }
      }
      if (Math.random() < 0.02 && s.columns.length < s.cols * params.density * 1.5) {
        const c = Math.floor(Math.random() * s.cols);
        if (!s.columns.find(col => col.x === c) && Math.random() < params.density) {
          s.columns.push({ x: c, y: 0, speed: (0.3 + Math.random() * 0.7) * params.speed,
            length: Math.floor(params.trailLength * (0.5 + Math.random() * 0.5)),
            chars: Array.from({ length: 40 }, () => randomChar(cs)), ticker: 0, tickRate: 2 + Math.floor(Math.random() * 4) });
        }
      }
    },
    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.font = `600 ${s.charH - 2}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      for (const col of s.columns) {
        const headY = Math.floor(col.y);
        for (let i = 0; i < col.length; i++) {
          const cy = headY - i;
          if (cy < 0 || cy >= s.rows) continue;
          const ch = col.chars[((headY - i) + col.chars.length) % col.chars.length];
          const fade = 1 - i / col.length;
          const x = col.x * s.charW + s.charW / 2;
          const y = cy * s.charH + s.charH - 3;
          if (i === 0) ctx.fillStyle = '#FFFFFF';
          else if (i === 1) ctx.fillStyle = colors.primary;
          else {
            const alpha = Math.pow(fade, 1.5);
            ctx.fillStyle = colors.secondary + Math.round(alpha * 255).toString(16).padStart(2, '0');
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
    density:     { min: 0.1, max: 1,  default: 0.55, label: 'Density',      step: 0.05 },
    trailLength: { min: 3,   max: 40, default: 18,   label: 'Trail Length', step: 1    },
    charSet:     { min: 0,   max: 3,  default: 0,    label: 'Char Set',     step: 1    },
  },
  colors: { bg: '#0A0A0B', primary: '#00FF41', secondary: '#003B00', glow: '#00FF41' },
  createInstance,
};
