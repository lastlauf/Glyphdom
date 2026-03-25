// Image/Video to ASCII conversion engine
// Preserves source aspect ratio, supports animation effects

const ASCII_RAMP = ' .·:;=+*#%@█▓▒░';
const ASCII_RAMP_DENSE = ' .,·:;-~=+*!|?#%@$&█▓▒░▀▄▌▐';

export function getCharForBrightness(brightness, dense = true) {
  const ramp = dense ? ASCII_RAMP_DENSE : ASCII_RAMP;
  const idx = Math.floor((1 - brightness) * (ramp.length - 1));
  return ramp[Math.max(0, Math.min(ramp.length - 1, idx))];
}

// Calculate grid dimensions that preserve image aspect ratio
// charW/charH ratio matters — chars are taller than wide
export function calcAspectGrid(sourceW, sourceH, maxCols, maxRows, charW, charH) {
  const charAspect = charW / charH; // ~0.57 for 8/14
  const imageAspect = sourceW / sourceH;
  // Adjusted aspect accounting for character shape
  const adjustedAspect = imageAspect / charAspect;

  let cols, rows;
  if (adjustedAspect > maxCols / maxRows) {
    // Image is wider — fit to width
    cols = maxCols;
    rows = Math.round(cols / adjustedAspect);
  } else {
    // Image is taller — fit to height
    rows = maxRows;
    cols = Math.round(rows * adjustedAspect);
  }

  cols = Math.max(1, Math.min(maxCols, cols));
  rows = Math.max(1, Math.min(maxRows, rows));

  // Centering offsets (in cells)
  const offsetX = Math.floor((maxCols - cols) / 2);
  const offsetY = Math.floor((maxRows - rows) / 2);

  return { cols, rows, offsetX, offsetY };
}

// Get source dimensions (works for both Image and Video elements)
export function getSourceDimensions(source) {
  if (source instanceof HTMLVideoElement) {
    return { w: source.videoWidth || source.width, h: source.videoHeight || source.height };
  }
  return { w: source.naturalWidth || source.width, h: source.naturalHeight || source.height };
}

// Sample an image/video frame, preserving aspect ratio
export function mediaToAsciiGrid(source, cols, rows, options = {}) {
  const { invert = false, contrast = 1, brightness = 0 } = options;

  const sCanvas = document.createElement('canvas');
  sCanvas.width = cols;
  sCanvas.height = rows;
  const sCtx = sCanvas.getContext('2d', { willReadFrequently: true });

  sCtx.drawImage(source, 0, 0, cols, rows);
  const imageData = sCtx.getImageData(0, 0, cols, rows);
  const data = imageData.data;

  const grid = [];
  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      let r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];

      if (a < 10) {
        row.push({ char: ' ', r: 0, g: 0, b: 0, brightness: 0 });
        continue;
      }

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

// Render with animation effects and aspect-ratio centering
export function renderAsciiGrid(ctx, grid, width, height, charW, charH, offsetX, offsetY, options = {}) {
  const {
    colorMode = true, bgColor = '#0A0A0B', tintColor = null,
    time = 0, effects = {},
  } = options;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  ctx.font = `500 ${charH - 2}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';

  const { wave = 0, scan = 0, shimmer = 0, pulse = 0, jitter = 0 } = effects;

  // Pulse: global brightness modulation
  const pulseMod = pulse > 0 ? 1 + Math.sin(time * 3) * pulse * 0.2 : 1;

  // Scan line position (0-1 looping)
  const scanPos = scan > 0 ? (time * 0.5 * scan) % 1 : -1;

  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const cell = row[x];
      if (cell.char === ' ') continue;

      // Base position with centering offset
      let drawX = (x + offsetX) * charW + charW / 2;
      let drawY = (y + offsetY) * charH + charH - 2;

      // Wave: horizontal sinusoidal displacement
      if (wave > 0) {
        drawX += Math.sin(y * 0.3 + time * 2.5) * wave * 6;
        drawY += Math.cos(x * 0.2 + time * 1.8) * wave * 2;
      }

      // Jitter: random positional noise
      if (jitter > 0) {
        drawX += (Math.random() - 0.5) * jitter * 6;
        drawY += (Math.random() - 0.5) * jitter * 4;
      }

      // Brightness modifiers
      let brightMod = pulseMod;

      // Shimmer: per-character random flicker
      if (shimmer > 0) {
        brightMod *= 1 + (Math.random() - 0.5) * shimmer * 0.6;
      }

      // Scan line: bright band sweeping down
      if (scanPos >= 0) {
        const normY = y / grid.length;
        const dist = Math.abs(normY - scanPos);
        if (dist < 0.08) {
          brightMod *= 1 + (1 - dist / 0.08) * scan * 1.5;
        }
      }

      let r = cell.r, g = cell.g, b = cell.b;

      if (tintColor) {
        const lum = cell.brightness * brightMod;
        const tr = parseInt(tintColor.slice(1, 3), 16);
        const tg = parseInt(tintColor.slice(3, 5), 16);
        const tb = parseInt(tintColor.slice(5, 7), 16);
        r = Math.min(255, Math.round(tr * lum));
        g = Math.min(255, Math.round(tg * lum));
        b = Math.min(255, Math.round(tb * lum));
      } else if (colorMode) {
        r = Math.min(255, Math.round(r * brightMod));
        g = Math.min(255, Math.round(g * brightMod));
        b = Math.min(255, Math.round(b * brightMod));
      } else {
        const v = Math.min(255, Math.round(cell.brightness * 255 * brightMod));
        r = g = b = v;
      }

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillText(cell.char, drawX, drawY);
    }
  }
}
