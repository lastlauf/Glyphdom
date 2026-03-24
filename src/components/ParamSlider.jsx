import { useRef, useCallback } from 'react';
import { IconReset } from './Icons.jsx';

export default function ParamSlider({ label, min, max, step, value, onChange, onReset, defaultValue }) {
  const percent = ((value - min) / (max - min)) * 100;

  const handleChange = useCallback((e) => {
    onChange(parseFloat(e.target.value));
  }, [onChange]);

  const displayValue = step >= 1
    ? Math.round(value)
    : value.toFixed(2);

  return (
    <div className="param-slider">
      <div className="param-slider-header">
        <span className="param-label">{label}</span>
        <div className="param-value-group">
          <span className="param-value">{displayValue}</span>
          <button
            className="param-reset"
            onClick={onReset}
            title="Reset to default"
          ><IconReset size={13} /></button>
        </div>
      </div>
      <div className="slider-track-wrap">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="slider-input"
          style={{ '--pct': `${percent}%` }}
        />
      </div>
    </div>
  );
}
