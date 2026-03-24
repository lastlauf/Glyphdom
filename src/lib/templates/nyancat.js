// Nyan Cat — factory pattern
const CAT_SPRITE = [
  ' ,---. ',
  '( o.o )',
  ' > ^ < ',
  '/_____\\',
  ' || || ',
];

const RAINBOW = ['#FF0000', '#FF8800', '#FFFF00', '#00FF00', '#0088FF', '#8800FF'];

function createInstance() {
  const s = { time: 0, stars: [], catY: 0, trail: [] };

  return {
    init(canvas, params, colors) {
      s.time = 0;
      s.catY = 0;
      s.trail = [];
      // Generate background stars
      s.stars = [];
      const count = Math.floor(params.starDensity * 60);
      for (let i = 0; i < count; i++) {
        s.stars.push({
          x: Math.random(),
          y: Math.random(),
          char: Math.random() > 0.5 ? '*' : '.',
          phase: Math.random() * Math.PI * 2,
          speed: 0.5 + Math.random() * 1.5,
        });
      }
    },
    update(dt, params) {
      s.time += dt * params.speed;
      // Cat bobs up and down
      s.catY = Math.sin(s.time * 3) * params.bobAmount;

      // Move stars leftward for parallax
      for (const star of s.stars) {
        star.x -= dt * star.speed * 0.03 * params.speed;
        if (star.x < 0) { star.x = 1; star.y = Math.random(); }
      }
    },
    render(ctx, width, height, charW, charH, params, colors) {
      const cw = 12, ch = 18;
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.textAlign = 'center';

      const cols = Math.floor(width / cw);
      const rows = Math.floor(height / ch);
      const catCol = Math.floor(cols * 0.65);
      const catRow = Math.floor(rows / 2) + Math.round(s.catY * 2);

      // Stars
      ctx.font = `400 ${ch - 6}px "JetBrains Mono", monospace`;
      for (const star of s.stars) {
        const flicker = Math.sin(s.time * 4 + star.phase) * 0.3 + 0.7;
        ctx.globalAlpha = flicker * 0.6;
        ctx.fillStyle = colors.secondary;
        ctx.fillText(star.char, star.x * width, star.y * height);
      }
      ctx.globalAlpha = 1;

      // Rainbow trail
      const trailLen = Math.round(params.trailLength);
      ctx.font = `700 ${ch - 4}px "JetBrains Mono", monospace`;
      for (let band = 0; band < RAINBOW.length; band++) {
        const bandRow = catRow - 1 + band;
        if (bandRow < 0 || bandRow >= rows) continue;
        ctx.fillStyle = RAINBOW[band];
        for (let t = 0; t < trailLen; t++) {
          const col = catCol - 2 - t;
          if (col < 0) break;
          const wave = Math.sin(s.time * 5 + t * 0.3 + band * 0.5) * 0.3;
          const alpha = 0.4 + (1 - t / trailLen) * 0.6;
          ctx.globalAlpha = alpha;
          const drawRow = bandRow + Math.round(wave);
          if (drawRow >= 0 && drawRow < rows) {
            ctx.fillText('=', col * cw + cw / 2, drawRow * ch + ch - 4);
          }
        }
      }
      ctx.globalAlpha = 1;

      // Cat sprite
      ctx.font = `600 ${ch - 5}px "JetBrains Mono", monospace`;
      ctx.fillStyle = colors.primary;
      for (let line = 0; line < CAT_SPRITE.length; line++) {
        const row = catRow - 2 + line;
        if (row < 0 || row >= rows) continue;
        const spriteChars = CAT_SPRITE[line];
        for (let ci = 0; ci < spriteChars.length; ci++) {
          const ch2 = spriteChars[ci];
          if (ch2 === ' ') continue;
          const col = catCol - Math.floor(spriteChars.length / 2) + ci;
          if (col < 0 || col >= cols) continue;
          ctx.fillStyle = (ch2 === 'o' || ch2 === '.') ? colors.glow : colors.primary;
          ctx.fillText(ch2, col * cw + cw / 2, row * ch + ch - 5);
        }
      }
    },
    destroy() { s.stars = []; s.trail = []; },
  };
}

export default {
  name: 'Nyan Cat',
  description: 'Rainbow cat flying through space',
  params: {
    speed:       { min: 0.3, max: 3,  default: 1,   label: 'Speed',        step: 0.1  },
    trailLength: { min: 3,   max: 30, default: 15,  label: 'Trail Length', step: 1    },
    bobAmount:   { min: 0.1, max: 2,  default: 0.8, label: 'Bob Amount',  step: 0.1  },
    starDensity: { min: 0,   max: 1,  default: 0.4, label: 'Star Density', step: 0.05 },
  },
  colors: { bg: '#003366', primary: '#FFAA88', secondary: '#AACCFF', glow: '#FF88CC' },
  createInstance,
};
