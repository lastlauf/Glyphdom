// Star Wars Crawl — factory pattern
const CRAWL_TEXT = [
  'EPISODE IV',
  '',
  'A NEW HOPE',
  '',
  'It is a period of digital',
  'unrest. ASCII rebels have',
  'built a forge capable of',
  'rendering infinite realms',
  'from simple characters.',
  '',
  'During the compile, rebel',
  'engineers managed to ship',
  'the secret templates to a',
  'distant server, an armored',
  'space station with enough',
  'processing power to render',
  'an entire galaxy from text.',
  '',
  'Pursued by sinister agents',
  'of the Dark Framework, the',
  'developers race aboard their',
  'terminal, custodians of the',
  'stolen chars that can save',
  'their people and restore',
  'freedom to the console....',
];

function createInstance() {
  const s = { time: 0, stars: [], scroll: 0 };

  return {
    init(canvas, params, colors) {
      s.time = 0;
      s.scroll = 0;
      // Generate star field
      s.stars = [];
      const count = Math.floor(params.starDensity * 80);
      for (let i = 0; i < count; i++) {
        s.stars.push({
          x: Math.random(),
          y: Math.random(),
          brightness: 0.2 + Math.random() * 0.6,
          char: Math.random() > 0.6 ? '*' : '.',
          flicker: Math.random() * Math.PI * 2,
        });
      }
    },
    update(dt, params) {
      s.time += dt;
      s.scroll += dt * params.speed * 20;
    },
    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      const cw = 14, ch = 20;

      // Star field
      ctx.font = `400 ${ch - 6}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      for (const star of s.stars) {
        const flicker = Math.sin(s.time * 2 + star.flicker) * 0.3 + 0.7;
        ctx.globalAlpha = star.brightness * flicker;
        ctx.fillStyle = colors.glow;
        ctx.fillText(star.char, star.x * width, star.y * height);
      }
      ctx.globalAlpha = 1;

      // Crawl text with perspective
      const centerX = width / 2;
      const totalLines = CRAWL_TEXT.length;
      const lineSpacing = ch * 1.8;
      const perspectiveStrength = params.perspective;

      for (let i = 0; i < totalLines; i++) {
        const line = CRAWL_TEXT[i];
        if (!line) continue;

        // y position: starts from bottom, scrolls up
        const rawY = height + i * lineSpacing - s.scroll;
        // Loop the crawl
        const loopRange = totalLines * lineSpacing + height;
        const y = ((rawY % loopRange) + loopRange) % loopRange;

        // Perspective: lines near bottom are full size, near top are smaller
        const progress = 1 - y / height; // 0 at bottom, 1 at top
        if (y < -ch || y > height + ch) continue;

        const scale = Math.max(0.3, 1 - progress * 0.6 * perspectiveStrength);
        const alpha = Math.max(0, Math.min(1, 1 - progress * 0.8));
        const fontSize = Math.max(8, Math.floor((ch - 2) * scale));

        // Horizontal squeeze for perspective
        const squeeze = 1 - progress * 0.4 * perspectiveStrength;

        ctx.font = `700 ${fontSize}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.globalAlpha = alpha;

        // Color interpolation based on distance
        if (progress < 0.3) {
          ctx.fillStyle = colors.primary;
        } else if (progress < 0.7) {
          const t = (progress - 0.3) / 0.4;
          const pr = parseInt(colors.primary.slice(1, 3), 16);
          const pg = parseInt(colors.primary.slice(3, 5), 16);
          const pb = parseInt(colors.primary.slice(5, 7), 16);
          const sr = parseInt(colors.secondary.slice(1, 3), 16);
          const sg = parseInt(colors.secondary.slice(3, 5), 16);
          const sb = parseInt(colors.secondary.slice(5, 7), 16);
          ctx.fillStyle = `rgb(${Math.round(pr + (sr - pr) * t)},${Math.round(pg + (sg - pg) * t)},${Math.round(pb + (sb - pb) * t)})`;
        } else {
          ctx.fillStyle = colors.secondary;
        }

        ctx.save();
        ctx.translate(centerX, y);
        ctx.scale(squeeze, 1);
        ctx.fillText(line, 0, 0);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    },
    destroy() { s.stars = []; },
  };
}

export default {
  name: 'Star Wars',
  description: 'Opening crawl text',
  params: {
    speed:       { min: 0.3, max: 3, default: 0.6, label: 'Scroll Speed', step: 0.05 },
    perspective: { min: 0.3, max: 2, default: 1,   label: 'Perspective',   step: 0.1  },
    starDensity: { min: 0,   max: 1, default: 0.3, label: 'Star Density', step: 0.05 },
  },
  colors: { bg: '#0A0A0B', primary: '#FFE81F', secondary: '#665A00', glow: '#FFFFFF' },
  createInstance,
};
