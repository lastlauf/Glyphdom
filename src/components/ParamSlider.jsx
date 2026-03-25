import { useRef, useCallback } from 'react';
import { IconReset } from './Icons.jsx';

// Custom pointer-capture slider — works on mouse AND touch drag
export default function ParamSlider({ label, min, max, step, value, onChange, onReset }) {
  const trackRef = useRef(null);

  const clamp = useCallback((raw) => {
    const stepped = Math.round(raw / step) * step;
    const clamped = Math.max(min, Math.min(max, stepped));
    return parseFloat(clamped.toFixed(10));
  }, [min, max, step]);

  const calcFromEvent = useCallback((e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onChange(clamp(min + pct * (max - min)));
  }, [min, max, clamp, onChange]);

  const onPointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    calcFromEvent(e);
  }, [calcFromEvent]);

  const onPointerMove = useCallback((e) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    calcFromEvent(e);
  }, [calcFromEvent]);

  const pct = ((value - min) / (max - min)) * 100;
  const displayValue = step >= 1 ? Math.round(value) : value.toFixed(2);

  return (
    <div className="param-slider">
      <div className="param-slider-header">
        <span className="param-label">{label}</span>
        <div className="param-value-group">
          <span className="param-value">{displayValue}</span>
          <button className="param-reset" onClick={onReset} title="Reset"><IconReset size={13} /></button>
        </div>
      </div>
      <div
        ref={trackRef}
        className="custom-slider-track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
      >
        <div className="custom-slider-fill" style={{ width: `${pct}%` }} />
        <div className="custom-slider-thumb" style={{ left: `${pct}%` }} />
      </div>
    </div>
  );
}
