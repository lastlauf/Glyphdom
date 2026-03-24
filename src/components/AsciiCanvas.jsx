import { useRef, useEffect, useCallback, useState } from 'react';
import useAnimationLoop from '../hooks/useAnimationLoop';

export default function AsciiCanvas({ template, params, colors, onStats }) {
  const canvasRef = useRef(null);
  const instanceRef = useRef(null);
  const paramsRef = useRef(params);
  const colorsRef = useRef(colors);
  const statsThrottleRef = useRef(0);

  paramsRef.current = params;
  colorsRef.current = colors;

  // create fresh instance when template changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !template) return;

    if (instanceRef.current?.destroy) instanceRef.current.destroy();

    const inst = template.createInstance();
    instanceRef.current = inst;

    const { offsetWidth: w, offsetHeight: h } = canvas.parentElement;
    canvas.width = w;
    canvas.height = h;
    inst.init(canvas, paramsRef.current, colorsRef.current);

    return () => {
      if (inst.destroy) inst.destroy();
    };
  }, [template]);

  const tick = useCallback((dt, fps) => {
    const canvas = canvasRef.current;
    const inst = instanceRef.current;
    if (!canvas || !inst) return;

    const ctx = canvas.getContext('2d');
    inst.update(dt, paramsRef.current, colorsRef.current);
    inst.render(ctx, canvas.width, canvas.height, 12, 18, paramsRef.current, colorsRef.current);

    // Throttle stats to 2×/sec — prevents React re-rendering Studio every frame
    if (onStats) {
      statsThrottleRef.current += dt;
      if (statsThrottleRef.current >= 0.5) {
        statsThrottleRef.current = 0;
        const charW = 12, charH = 18;
        const cols = Math.floor(canvas.width / charW);
        const rows = Math.floor(canvas.height / charH);
        onStats({ fps, chars: cols * rows, cols, rows });
      }
    }
  }, [onStats]);

  useAnimationLoop(tick, !!template);

  // resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const { offsetWidth: w, offsetHeight: h } = canvas.parentElement;
      if (w === canvas.width && h === canvas.height) return;
      canvas.width = w;
      canvas.height = h;
      if (instanceRef.current) {
        instanceRef.current.init(canvas, paramsRef.current, colorsRef.current);
      }
    });
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
