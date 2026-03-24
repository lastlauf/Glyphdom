// Space Invaders — factory pattern
function createInstance() {
  const s = { invaders: [], bullets: [], playerX: 0, playerBullets: [], dir: 1, time: 0, ticker: 0, explosions: [], cols: 0, rows: 0 };

  function spawnInvaders(cols, invaderRows, rowCount) {
    s.invaders = [];
    const startCol = Math.floor((cols - rowCount * 3) / 2);
    for (let r = 0; r < invaderRows; r++) {
      for (let c = 0; c < rowCount; c++) {
        s.invaders.push({ x: startCol + c * 3, y: 2 + r * 2, alive: true, flash: 0 });
      }
    }
  }

  return {
    init(canvas, params, colors) {
      s.cols = Math.floor(canvas.width / 14);
      s.rows = Math.floor(canvas.height / 20);
      s.playerX = Math.floor(s.cols / 2);
      s.dir = 1;
      s.time = 0;
      s.ticker = 0;
      s.bullets = [];
      s.playerBullets = [];
      s.explosions = [];
      const rowCount = Math.max(3, Math.floor(s.cols / 4));
      spawnInvaders(s.cols, Math.round(params.invaderRows), rowCount);
    },
    update(dt, params) {
      s.time += dt;
      s.ticker += dt * params.speed;

      // Move invaders on tick
      if (s.ticker >= 0.5) {
        s.ticker = 0;
        let hitEdge = false;
        for (const inv of s.invaders) {
          if (!inv.alive) continue;
          if ((inv.x + s.dir >= s.cols - 1) || (inv.x + s.dir <= 0)) hitEdge = true;
        }
        if (hitEdge) {
          s.dir *= -1;
          for (const inv of s.invaders) { if (inv.alive) inv.y += 1; }
        } else {
          for (const inv of s.invaders) { if (inv.alive) inv.x += s.dir; }
        }

        // Enemy fire
        const alive = s.invaders.filter(i => i.alive);
        if (alive.length > 0 && Math.random() < params.fireRate) {
          const shooter = alive[Math.floor(Math.random() * alive.length)];
          s.bullets.push({ x: shooter.x, y: shooter.y + 1 });
        }

        // Player fire
        if (Math.random() < 0.6) {
          s.playerBullets.push({ x: s.playerX, y: s.rows - 2 });
        }

        // Player AI — move toward nearest invader column
        if (alive.length > 0) {
          const nearest = alive.reduce((a, b) => Math.abs(a.x - s.playerX) < Math.abs(b.x - s.playerX) ? a : b);
          if (nearest.x > s.playerX) s.playerX++;
          else if (nearest.x < s.playerX) s.playerX--;
        }
      }

      // Move bullets
      s.bullets = s.bullets.filter(b => { b.y += 0.5; return b.y < s.rows; });
      s.playerBullets = s.playerBullets.filter(b => { b.y -= 1; return b.y >= 0; });

      // Collision detection
      for (const pb of s.playerBullets) {
        for (const inv of s.invaders) {
          if (inv.alive && Math.abs(inv.x - pb.x) < 1.5 && Math.abs(inv.y - Math.floor(pb.y)) < 1) {
            inv.alive = false;
            pb.y = -10;
            s.explosions.push({ x: inv.x, y: inv.y, life: 6 });
          }
        }
      }

      // Explosions decay
      s.explosions = s.explosions.filter(e => { e.life--; return e.life > 0; });

      // Respawn if all dead or if invaders reach bottom
      const aliveNow = s.invaders.filter(i => i.alive);
      const reachedBottom = aliveNow.some(i => i.y >= s.rows - 3);
      if (aliveNow.length === 0 || reachedBottom) {
        s.bullets = [];
        s.playerBullets = [];
        s.explosions = [];
        const rowCount = Math.max(3, Math.floor(s.cols / 4));
        spawnInvaders(s.cols, Math.round(params.invaderRows), rowCount);
      }
    },
    render(ctx, width, height, charW, charH, params, colors) {
      const cw = 14, ch = 20;
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.font = `600 ${ch - 4}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';

      // Invaders
      const sprites = ['/O\\', '{#}', '^v^', '<*>'];
      for (const inv of s.invaders) {
        if (!inv.alive) continue;
        ctx.fillStyle = colors.primary;
        const sprite = sprites[inv.y % sprites.length] || '/O\\';
        ctx.fillText(sprite, inv.x * cw + cw / 2, inv.y * ch + ch - 4);
      }

      // Explosions
      for (const e of s.explosions) {
        ctx.fillStyle = colors.glow;
        ctx.globalAlpha = e.life / 6;
        ctx.fillText('*', e.x * cw + cw / 2, e.y * ch + ch - 4);
        ctx.globalAlpha = 1;
      }

      // Bullets
      ctx.fillStyle = colors.secondary;
      for (const b of s.bullets) {
        ctx.fillText('|', b.x * cw + cw / 2, Math.floor(b.y) * ch + ch - 4);
      }
      ctx.fillStyle = colors.glow;
      for (const b of s.playerBullets) {
        ctx.fillText('!', b.x * cw + cw / 2, Math.floor(b.y) * ch + ch - 4);
      }

      // Player
      ctx.fillStyle = colors.glow;
      ctx.fillText('/_\\', s.playerX * cw + cw / 2, (s.rows - 1) * ch + ch - 4);
    },
    destroy() { s.invaders = []; s.bullets = []; s.playerBullets = []; s.explosions = []; },
  };
}

export default {
  name: 'Space Invaders',
  description: 'Classic arcade alien invasion',
  params: {
    speed:       { min: 0.3, max: 3, default: 0.8, label: 'Speed',        step: 0.1 },
    invaderRows: { min: 2,   max: 6, default: 4,   label: 'Invader Rows', step: 1   },
    fireRate:    { min: 0.1, max: 1, default: 0.4,  label: 'Fire Rate',    step: 0.05 },
  },
  colors: { bg: '#0A0A0B', primary: '#00FF41', secondary: '#33FF66', glow: '#FFFFFF' },
  createInstance,
};
