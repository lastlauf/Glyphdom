import { useEffect, useRef, useState } from 'react';

export default function StatusBar({ stats }) {
  const { fps = 0, chars = 0, cols = 0, rows = 0 } = stats || {};
  const [displayFps, setDisplayFps] = useState(fps);
  const smoothRef = useRef(fps);

  useEffect(() => {
    smoothRef.current = smoothRef.current * 0.85 + fps * 0.15;
    const t = setTimeout(() => setDisplayFps(Math.round(smoothRef.current)), 16);
    return () => clearTimeout(t);
  }, [fps]);

  const fpsColor = displayFps >= 55 ? '#00FF41' : displayFps >= 30 ? '#FFB000' : '#FF4444';

  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="status-label">FPS</span>
        <span className="status-value" style={{ color: fpsColor }}>
          {displayFps}
        </span>
      </div>
      <div className="status-sep" />
      <div className="status-item">
        <span className="status-label">CHARS</span>
        <span className="status-value">{chars.toLocaleString()}</span>
      </div>
      <div className="status-sep" />
      <div className="status-item">
        <span className="status-label">GRID</span>
        <span className="status-value">{cols}×{rows}</span>
      </div>
      <div className="status-spacer" />
      <div className="status-item">
        <span className="status-label">ENGINE</span>
        <span className="status-value" style={{ color: 'var(--accent)' }}>HTML5 CANVAS</span>
      </div>
    </div>
  );
}
