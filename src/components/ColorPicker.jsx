import { useState, useCallback } from 'react';
import { COLOR_PRESETS, isValidHex } from '../lib/colors.js';

export default function ColorPicker({ colors, onColorChange, onPresetApply }) {
  const [editing, setEditing] = useState(null);
  const [draftValues, setDraftValues] = useState({});

  const colorKeys = [
    { key: 'bg',        label: 'Background' },
    { key: 'primary',   label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'glow',      label: 'Glow' },
  ];

  const handleHexInput = useCallback((key, raw) => {
    setDraftValues(prev => ({ ...prev, [key]: raw }));
    const hex = raw.startsWith('#') ? raw : '#' + raw;
    if (isValidHex(hex)) {
      onColorChange(key, hex);
    }
  }, [onColorChange]);

  const handleNativeColor = useCallback((key, value) => {
    onColorChange(key, value);
    setDraftValues(prev => ({ ...prev, [key]: value }));
  }, [onColorChange]);

  return (
    <div className="color-picker">
      <div className="color-presets">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.name}
            className="preset-swatch"
            style={{ background: preset.primary }}
            title={preset.name}
            onClick={() => onPresetApply(preset)}
          />
        ))}
      </div>

      <div className="color-rows">
        {colorKeys.map(({ key, label }) => {
          const value = colors[key] || '#000000';
          const draft = draftValues[key] ?? value;
          return (
            <div key={key} className="color-row">
              <span className="color-row-label">{label}</span>
              <div className="color-row-controls">
                <label className="color-swatch-btn" style={{ background: value }}>
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => handleNativeColor(key, e.target.value)}
                    style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
                  />
                </label>
                <input
                  className="color-hex-input"
                  value={editing === key ? draft : value}
                  onFocus={() => { setEditing(key); setDraftValues(p => ({...p, [key]: value})); }}
                  onBlur={() => setEditing(null)}
                  onChange={(e) => handleHexInput(key, e.target.value)}
                  spellCheck={false}
                  maxLength={7}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
