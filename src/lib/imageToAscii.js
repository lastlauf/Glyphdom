// Image/Video to ASCII conversion engine
// Maps pixel brightness to ASCII characters with color preservation

const ASCII_RAMP = ' .·:;=+*#%@█▓▒░';
const ASCII_RAMP_DENSE = ' .,·:;-~=+*!|?#%@$&█▓▒░▀▄▌▐';

export function getCharForBrightness(brightness, dense = true) {
  const ramp = dense ? ASCII_RAMP_DENSE : ASCII_RAMP;
  const idx = Math.floor((1 - brightness) * (ramp.length - 1));
  return ramp[Math.max(0, Math.min(ramp.length - 1, idx))];
}

// Sample an image/video frame onto a canvas and return ASCII grid
export function mediaToAsciiGrid(source, targetCols, targetRows, options = {}) {
  const { invert = false, contrast = 1, brightness = 0, colorMode = true } = options;

  // Create sampling canvas
  const sCanvas = document.createElement('canvas');
  sCanvas.width = targetCols;
  sCanvas.height = targetRows;
  const sCtx = sCanvas.getContext('2d', { willReadFrequently: true });

  // Draw source scaled down to grid size
  sCtx.drawImage(source, 0, 0, targetCols, targetRows);
  const imageData = sCtx.getImageData(0, 0, targetCols, targetRows);
  const data = imageData.data;

  const grid = [];
  for (let y = 0; y < targetRows; y++) {
    const row = [];
    for (let x = 0; x < targetCols; x++) {
      const i = (y * targetCols + x) * 4;
      let r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];

      if (a < 10) {
        row.push({ char: ' ', r: 0, g: 0, b: 0, brightness: 0 });
        continue;
      }

      // Apply contrast + brightness
      r = Math.max(0, Math.min(255, ((r / 255 - 0.5) * contrast + 0.5 + brightness) * 255));
      g = Math.max(0, Math.min(255, ((g / 255 - 0.5) * contrast + 0.5 + brightness) * 255));
      b = Math.max(0, Math.min(255, ((b / 255 - 0.5) * contrast + 0.5 + brightness) * 255));

      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const finalLum = invert ? 1 - lum : lum;
      const char = getCharForBrightness(finalLum);

      row.push({ char, r: Math.round(r), g: Math.round(g), b: Math.round(b), brightness: finalLum });
    }
    grid.push(row);
  }

  return grid;
}

// Render an ASCII grid onto a canvas with optional glow
export function renderAsciiGrid(ctx, grid, width, height, charW, charH, options = {}) {
  const { colorMode = true, bgColor = '#0A0A0B', tintColor = null } = options;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  ctx.font = `500 ${charH - 2}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';

  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const cell = row[x];
      if (cell.char === ' ') continue;

      if (colorMode && !tintColor) {
        ctx.fillStyle = `rgb(${cell.r},${cell.g},${cell.b})`;
      } else if (tintColor) {
        const lum = cell.brightness;
        const tr = parseInt(tintColor.slice(1, 3), 16);
        const tg = parseInt(tintColor.slice(3, 5), 16);
        const tb = parseInt(tintColor.slice(5, 7), 16);
        ctx.fillStyle = `rgb(${Math.round(tr * lum)},${Math.round(tg * lum)},${Math.round(tb * lum)})`;
      } else {
        const v = Math.round(cell.brightness * 255);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
      }

      ctx.fillText(cell.char, x * charW + charW / 2, y * charH + charH - 2);
    }
  }
}
