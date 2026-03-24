import { useRef, useEffect } from 'react';
import { registerPreview, unregisterPreview } from '../lib/sharedLoop.js';

export default function MiniPreview({ template, active, onClick }) {
  const canvasRef = useRef(null);
  const instRef = useRef(null);
  const paramsRef = useRef(null);
  const colorsRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !template) return;

    if (instRef.current?.destroy) instRef.current.destroy();
    if (tickRef.current) { unregisterPreview(tickRef.current); tickRef.current = null; }

    const params = Object.fromEntries(
      Object.entries(template.params).map(([k, v]) => [k, v.default])
    );
    const colors = { ...template.colors };
    paramsRef.current = params;
    colorsRef.current = colors;

    const setup = () => {
      // Use fixed dimensions — don't rely on offsetWidth which may be 0 during layout
      canvas.width = 120;
      canvas.height = 72;

      const inst = template.createInstance();
      instRef.current = inst;
      inst.init(canvas, paramsRef.current, colorsRef.current);

      const tick = (dt) => {
        if (!canvas || !inst) return;
        inst.update(dt * 0.4, paramsRef.current, colorsRef.current);
        inst.render(
          canvas.getContext('2d'),
          canvas.width, canvas.height,
          8, 12,
          paramsRef.current, colorsRef.current
        );
      };
      tickRef.current = tick;
      registerPreview(tick);
    };

    // Defer one microtask to let layout settle
    const id = requestAnimationFrame(setup);
    return () => {
      cancelAnimationFrame(id);
      if (tickRef.current) { unregisterPreview(tickRef.current); tickRef.current = null; }
      if (instRef.current?.destroy) instRef.current.destroy();
    };
  }, [template]);

  return (
    <button
      className={`mini-preview ${active ? 'active' : ''}`}
      onClick={onClick}
      title={template?.name}
    >
      <div className="mini-preview-canvas-wrap">
        <canvas ref={canvasRef} />
      </div>
      <span className="mini-preview-label">{template?.name}</span>
      {active && <span className="mini-preview-active-dot" />}
    </button>
  );
}
