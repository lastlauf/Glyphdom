export const COLOR_PRESETS = [
  { name: 'Matrix',    bg: '#0A0A0B', primary: '#00FF41', secondary: '#003B00', glow: '#00FF41' },
  { name: 'Amber',     bg: '#0A0700', primary: '#FFB000', secondary: '#4A3000', glow: '#FFB000' },
  { name: 'Cyan',      bg: '#000A0A', primary: '#00FFD0', secondary: '#003328', glow: '#00FFD0' },
  { name: 'Hot Pink',  bg: '#0A0008', primary: '#FF2D9E', secondary: '#5A0035', glow: '#FF2D9E' },
  { name: 'Ice',       bg: '#060810', primary: '#AAD4FF', secondary: '#1A3060', glow: '#88AAFF' },
  { name: 'Classic',   bg: '#0A0A0B', primary: '#E8E6E0', secondary: '#555550', glow: '#FFFFFF' },
];

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

export function isValidHex(hex) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}
