// Pac-Man — maze, dots, ghosts, and chomp animation

function generateMaze(cols, rows) {
  // Create a grid-based maze with walls on a regular pattern
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      // Border walls
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
        grid[r][c] = 1; // wall
      }
      // Internal wall pillars on even grid intersections
      else if (r % 2 === 0 && c % 2 === 0) {
        grid[r][c] = 1;
      }
      // Random wall extensions from pillars
      else if (r % 2 === 0 && c % 2 === 1 && c > 1 && c < cols - 2) {
        grid[r][c] = Math.random() < 0.35 ? 1 : 0;
      }
      else if (r % 2 === 1 && c % 2 === 0 && r > 1 && r < rows - 2) {
        grid[r][c] = Math.random() < 0.35 ? 1 : 0;
      }
      else {
        grid[r][c] = 0; // open
      }
    }
  }
  return grid;
}

function findNeighbors(grid, r, c, rows, cols) {
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  const result = [];
  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 0) {
      result.push({ r: nr, c: nc });
    }
  }
  return result;
}

const GHOST_COLORS = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];

function createInstance() {
  const s = {
    time: 0,
    tickAccum: 0,
    mazeGrid: [],
    mazeCols: 0,
    mazeRows: 0,
    dots: [],
    pacman: { r: 0, c: 0, dir: 0, chomp: false },
    ghosts: [],
    screenCols: 0,
    screenRows: 0,
    offsetC: 0,
    offsetR: 0,
  };

  function placeDots() {
    s.dots = [];
    for (let r = 0; r < s.mazeRows; r++) {
      for (let c = 0; c < s.mazeCols; c++) {
        if (s.mazeGrid[r][c] === 0) {
          s.dots.push({ r, c, alive: true });
        }
      }
    }
  }

  function placeEntity(avoidList) {
    // Find an open cell not occupied
    for (let attempt = 0; attempt < 200; attempt++) {
      const r = 1 + Math.floor(Math.random() * (s.mazeRows - 2));
      const c = 1 + Math.floor(Math.random() * (s.mazeCols - 2));
      if (s.mazeGrid[r][c] !== 0) continue;
      let occupied = false;
      for (const a of avoidList) {
        if (a.r === r && a.c === c) { occupied = true; break; }
      }
      if (!occupied) return { r, c };
    }
    return { r: 1, c: 1 };
  }

  function buildMaze(params) {
    const scale = params.mazeSize || 1;
    s.mazeCols = Math.max(7, Math.floor(s.screenCols * 0.7 * scale));
    s.mazeRows = Math.max(7, Math.floor(s.screenRows * 0.7 * scale));
    // Ensure odd dimensions for nice grid pattern
    if (s.mazeCols % 2 === 0) s.mazeCols--;
    if (s.mazeRows % 2 === 0) s.mazeRows--;
    s.mazeGrid = generateMaze(s.mazeCols, s.mazeRows);
    s.offsetC = Math.floor((s.screenCols - s.mazeCols) / 2);
    s.offsetR = Math.floor((s.screenRows - s.mazeRows) / 2);
    placeDots();

    const gCount = Math.round(params.ghostCount || 3);
    const placed = [];
    const pacPos = placeEntity(placed);
    s.pacman.r = pacPos.r;
    s.pacman.c = pacPos.c;
    s.pacman.dir = 0;
    s.pacman.chomp = false;
    placed.push(pacPos);

    s.ghosts = [];
    for (let i = 0; i < gCount; i++) {
      const gPos = placeEntity(placed);
      s.ghosts.push({ r: gPos.r, c: gPos.c, colorIdx: i % GHOST_COLORS.length });
      placed.push(gPos);
    }
  }

  function findNearestDot() {
    let best = null;
    let bestDist = Infinity;
    for (const d of s.dots) {
      if (!d.alive) continue;
      const dist = Math.abs(d.r - s.pacman.r) + Math.abs(d.c - s.pacman.c);
      if (dist < bestDist) { bestDist = dist; best = d; }
    }
    return best;
  }

  function moveToward(entity, targetR, targetC) {
    const neighbors = findNeighbors(s.mazeGrid, entity.r, entity.c, s.mazeRows, s.mazeCols);
    if (neighbors.length === 0) return;
    let best = neighbors[0];
    let bestDist = Math.abs(best.r - targetR) + Math.abs(best.c - targetC);
    for (let i = 1; i < neighbors.length; i++) {
      const d = Math.abs(neighbors[i].r - targetR) + Math.abs(neighbors[i].c - targetC);
      if (d < bestDist) { bestDist = d; best = neighbors[i]; }
    }
    // Small random chance to pick a random neighbor instead (makes movement less predictable)
    if (Math.random() < 0.15 && neighbors.length > 1) {
      best = neighbors[Math.floor(Math.random() * neighbors.length)];
    }
    entity.r = best.r;
    entity.c = best.c;
  }

  return {
    init(canvas, params, colors) {
      s.time = 0;
      s.tickAccum = 0;
      s.screenCols = Math.floor(canvas.width / 12);
      s.screenRows = Math.floor(canvas.height / 18);
      buildMaze(params);
    },

    update(dt, params, colors) {
      s.time += dt;
      const tickInterval = 0.18 / (params.speed || 1);
      s.tickAccum += dt;
      if (s.tickAccum < tickInterval) return;
      s.tickAccum -= tickInterval;

      // Toggle chomp each tick
      s.pacman.chomp = !s.pacman.chomp;

      // Move Pac-Man toward nearest dot
      const target = findNearestDot();
      if (target) {
        moveToward(s.pacman, target.r, target.c);
      }

      // Eat dot at current position
      for (const d of s.dots) {
        if (d.alive && d.r === s.pacman.r && d.c === s.pacman.c) {
          d.alive = false;
          break;
        }
      }

      // Move ghosts toward Pac-Man
      for (const g of s.ghosts) {
        moveToward(g, s.pacman.r, s.pacman.c);
      }

      // Check if all dots are eaten
      const remaining = s.dots.filter(d => d.alive).length;
      if (remaining === 0) {
        buildMaze(params);
      }
    },

    render(ctx, width, height, charW, charH, params, colors) {
      const cw = 12, ch = 18;
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.textAlign = 'center';

      const oC = s.offsetC;
      const oR = s.offsetR;

      // Draw maze walls
      ctx.font = `700 ${ch - 2}px "JetBrains Mono", monospace`;
      ctx.fillStyle = colors.secondary;
      for (let r = 0; r < s.mazeRows; r++) {
        for (let c = 0; c < s.mazeCols; c++) {
          if (s.mazeGrid[r][c] === 1) {
            const sx = (oC + c) * cw + cw / 2;
            const sy = (oR + r) * ch + ch - 2;
            ctx.fillText('#', sx, sy);
          }
        }
      }

      // Draw dots
      ctx.font = `400 ${ch - 4}px "JetBrains Mono", monospace`;
      ctx.fillStyle = colors.primary;
      for (const d of s.dots) {
        if (!d.alive) continue;
        const sx = (oC + d.c) * cw + cw / 2;
        const sy = (oR + d.r) * ch + ch - 2;
        ctx.fillText('.', sx, sy);
      }

      // Draw ghosts
      ctx.font = `700 ${ch - 2}px "JetBrains Mono", monospace`;
      for (const g of s.ghosts) {
        ctx.fillStyle = GHOST_COLORS[g.colorIdx];
        const sx = (oC + g.c) * cw + cw / 2;
        const sy = (oR + g.r) * ch + ch - 2;
        ctx.fillText('M', sx, sy);
      }

      // Draw Pac-Man
      ctx.font = `700 ${ch - 2}px "JetBrains Mono", monospace`;
      ctx.fillStyle = colors.glow;
      const px = (oC + s.pacman.c) * cw + cw / 2;
      const py = (oR + s.pacman.r) * ch + ch - 2;
      ctx.fillText(s.pacman.chomp ? 'C' : 'c', px, py);
    },

    destroy() {},
  };
}

export default {
  name: 'Pac-Man',
  description: 'Pac-Man eating dots in a maze with ghosts',
  params: {
    speed:      { min: 0.3, max: 3, default: 1,   label: 'Speed',       step: 0.1 },
    ghostCount: { min: 1,   max: 4, default: 3,   label: 'Ghost Count', step: 1 },
    mazeSize:   { min: 0.5, max: 2, default: 1,   label: 'Maze Size',   step: 0.1 },
  },
  colors: { bg: '#0A0A0B', primary: '#FFFF00', secondary: '#2121DE', glow: '#FFAA00' },
  createInstance,
};
