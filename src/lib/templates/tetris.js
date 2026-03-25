// Tetris — auto-playing falling tetrominos

const TETROMINOS = [
  // I
  { shape: [[1,1,1,1]], color: 0 },
  // O
  { shape: [[1,1],[1,1]], color: 1 },
  // T
  { shape: [[0,1,0],[1,1,1]], color: 2 },
  // S
  { shape: [[0,1,1],[1,1,0]], color: 3 },
  // Z
  { shape: [[1,1,0],[0,1,1]], color: 4 },
  // L
  { shape: [[1,0],[1,0],[1,1]], color: 5 },
  // J
  { shape: [[0,1],[0,1],[1,1]], color: 6 },
];

function randomPiece() {
  const t = TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)];
  // Deep copy the shape so rotations don't mutate the template
  return { shape: t.shape.map(r => [...r]), color: t.color };
}

function rotateCW(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const out = [];
  for (let c = 0; c < cols; c++) {
    const row = [];
    for (let r = rows - 1; r >= 0; r--) {
      row.push(shape[r][c]);
    }
    out.push(row);
  }
  return out;
}

function createInstance() {
  const s = {
    grid: [],
    cols: 10,
    rows: 20,
    piece: null,
    pieceX: 0,
    pieceY: 0,
    tick: 0,
    moveTick: 0,
    flashRows: [],
    flashTimer: 0,
    canvasW: 0,
    canvasH: 0,
  };

  function resetGrid() {
    s.grid = [];
    for (let r = 0; r < s.rows; r++) {
      s.grid.push(new Array(s.cols).fill(-1));
    }
  }

  function collides(shape, px, py) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const gx = px + c;
        const gy = py + r;
        if (gx < 0 || gx >= s.cols || gy >= s.rows) return true;
        if (gy >= 0 && s.grid[gy][gx] !== -1) return true;
      }
    }
    return false;
  }

  function lockPiece() {
    const shape = s.piece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const gy = s.pieceY + r;
        const gx = s.pieceX + c;
        if (gy >= 0 && gy < s.rows && gx >= 0 && gx < s.cols) {
          s.grid[gy][gx] = s.piece.color;
        }
      }
    }
  }

  function clearRows() {
    s.flashRows = [];
    for (let r = s.rows - 1; r >= 0; r--) {
      if (s.grid[r].every(v => v !== -1)) {
        s.flashRows.push(r);
      }
    }
    if (s.flashRows.length > 0) {
      s.flashTimer = 0.3;
    }
  }

  function removeFlashedRows() {
    // Remove completed rows from top to bottom index
    const sorted = [...s.flashRows].sort((a, b) => a - b);
    for (const row of sorted) {
      s.grid.splice(row, 1);
      s.grid.unshift(new Array(s.cols).fill(-1));
    }
    s.flashRows = [];
  }

  function spawnPiece() {
    s.piece = randomPiece();
    s.pieceX = Math.floor((s.cols - s.piece.shape[0].length) / 2);
    s.pieceY = -s.piece.shape.length;
    // If immediate collision at spawn, reset the board
    if (collides(s.piece.shape, s.pieceX, 0)) {
      resetGrid();
      s.pieceY = -s.piece.shape.length;
    }
  }

  return {
    init(canvas, params) {
      // Fit the grid so cells are never smaller than 8px
      const minCell = 8;
      const maxColsFromCanvas = Math.floor(canvas.width  / minCell) - 2;
      s.cols = Math.max(4, Math.min(maxColsFromCanvas, Math.round(params.width || 10)));
      const cellSize = Math.max(minCell, Math.floor(canvas.width / (s.cols + 2)));
      s.rows = Math.max(6, Math.floor(canvas.height / cellSize) - 1);
      s.canvasW = canvas.width;
      s.canvasH = canvas.height;
      s.tick = 0;
      s.moveTick = 0;
      s.flashRows = [];
      s.flashTimer = 0;
      resetGrid();
      spawnPiece();
    },

    update(dt, params) {
      // Handle flash animation
      if (s.flashTimer > 0) {
        s.flashTimer -= dt;
        if (s.flashTimer <= 0) {
          removeFlashedRows();
        }
        return;
      }

      const dropInterval = 0.5 / params.speed;
      s.tick += dt;
      s.moveTick += dt;

      // Auto-move left/right for visual interest
      if (s.moveTick >= dropInterval * 0.6) {
        s.moveTick = 0;
        if (s.piece) {
          const dir = Math.random() < 0.5 ? -1 : 1;
          if (!collides(s.piece.shape, s.pieceX + dir, s.pieceY)) {
            s.pieceX += dir;
          }
          // Occasionally rotate
          if (Math.random() < 0.3) {
            const rotated = rotateCW(s.piece.shape);
            if (!collides(rotated, s.pieceX, s.pieceY)) {
              s.piece.shape = rotated;
            }
          }
        }
      }

      // Drop piece
      if (s.tick >= dropInterval) {
        s.tick = 0;
        if (s.piece) {
          if (!collides(s.piece.shape, s.pieceX, s.pieceY + 1)) {
            s.pieceY += 1;
          } else {
            lockPiece();
            clearRows();
            spawnPiece();
          }
        }
      }
    },

    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      const gridCols = s.cols;
      const gridRows = s.rows;

      // Calculate cell size to fit the grid centered on canvas
      const cellW = Math.floor(width / (gridCols + 2));
      const cellH = Math.floor(height / (gridRows + 1));
      const cellSize = Math.min(cellW, cellH);
      const fontSize = Math.max(8, cellSize - 2);

      const offsetX = Math.floor((width - gridCols * cellSize) / 2);
      const offsetY = Math.floor((height - gridRows * cellSize) / 2);

      ctx.font = `700 ${fontSize}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';

      // Grid outline dots
      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          if (s.grid[r][c] === -1) {
            ctx.fillStyle = colors.secondary + '44';
            ctx.fillText(
              '\u00B7',
              offsetX + c * cellSize + cellSize / 2,
              offsetY + r * cellSize + cellSize * 0.8
            );
          }
        }
      }

      // Locked pieces
      const isFlashing = s.flashTimer > 0;
      const flashOn = isFlashing && Math.floor(s.flashTimer * 12) % 2 === 0;

      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          if (s.grid[r][c] === -1) continue;

          // Flash effect for completed rows
          if (isFlashing && s.flashRows.includes(r)) {
            ctx.fillStyle = flashOn ? '#FFFFFF' : colors.primary;
          } else {
            ctx.fillStyle = colors.primary;
          }

          ctx.fillText(
            '\u2588',
            offsetX + c * cellSize + cellSize / 2,
            offsetY + r * cellSize + cellSize * 0.8
          );
        }
      }

      // Active falling piece
      if (s.piece && !isFlashing) {
        ctx.fillStyle = colors.glow;
        const shape = s.piece.shape;
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (!shape[r][c]) continue;
            const gy = s.pieceY + r;
            const gx = s.pieceX + c;
            if (gy < 0 || gy >= gridRows || gx < 0 || gx >= gridCols) continue;
            ctx.fillText(
              '\u2588',
              offsetX + gx * cellSize + cellSize / 2,
              offsetY + gy * cellSize + cellSize * 0.8
            );
          }
        }
      }

      // Border frame
      ctx.fillStyle = colors.secondary + '66';
      // Top and bottom border
      for (let c = -1; c <= gridCols; c++) {
        ctx.fillText(
          '\u2500',
          offsetX + c * cellSize + cellSize / 2,
          offsetY - cellSize * 0.2
        );
        ctx.fillText(
          '\u2500',
          offsetX + c * cellSize + cellSize / 2,
          offsetY + gridRows * cellSize + cellSize * 0.3
        );
      }
      // Left and right border
      for (let r = 0; r < gridRows; r++) {
        ctx.fillText(
          '\u2502',
          offsetX - cellSize / 2,
          offsetY + r * cellSize + cellSize * 0.8
        );
        ctx.fillText(
          '\u2502',
          offsetX + gridCols * cellSize + cellSize / 2,
          offsetY + r * cellSize + cellSize * 0.8
        );
      }
    },

    destroy() {},
  };
}

export default {
  name: 'Tetris',
  description: 'Auto-playing falling tetrominos',
  params: {
    speed: { min: 0.3, max: 3, default: 1, label: 'Drop Speed', step: 0.1 },
    width: { min: 6, max: 14, default: 10, label: 'Board Width', step: 1 },
  },
  colors: { bg: '#0A0A0B', primary: '#FF6B35', secondary: '#333340', glow: '#FFD700' },
  createInstance,
};
