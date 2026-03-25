import { useRef, useEffect, useCallback } from 'react';
import useAnimationLoop from '../hooks/useAnimationLoop';

export default function AsciiCanvas({ template, params, colors, onStats, hoverEffect = 'ripple', glowEnabled = true }) {
  const canvasRef = useRef(null);
  const glowCanvasRef = useRef(null);
  const instanceRef = useRef(null);
  const paramsRef = useRef(params);
  const colorsRef = useRef(colors);
  const statsThrottleRef = useRef(0);
  const mouseRef = useRef({ x: -1, y: -1, active: false });
  const hoverEffectRef = useRef(hoverEffect);
  const glowEnabledRef = useRef(glowEnabled);

  paramsRef.current = params;
  colorsRef.current = colors;
  hoverEffectRef.current = hoverEffect;
  glowEnabledRef.current = glowEnabled;

  // Track mouse
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
    };
    const onLeave = () => { mouseRef.current = { x: -1, y: -1, active: false }; };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    // Touch support
    const onTouch = (e) => {
      const t = e.touches[0];
      if (!t) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: t.clientX - rect.left, y: t.clientY - rect.top, active: true };
    };
    canvas.addEventListener('touchmove', onTouch, { passive: true });
    canvas.addEventListener('touchend', onLeave);
    return () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('touchmove', onTouch);
      canvas.removeEventListener('touchend', onLeave);
    };
  }, []);

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

    // Set up offscreen glow canvas
    if (glowCanvasRef.current) {
      glowCanvasRef.current.width = w;
      glowCanvasRef.current.height = h;
    }

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
    const charW = 10, charH = 14; // denser grid

    // Pass mouse and hover effect to the instance if it supports it
    const mouse = mouseRef.current;
    if (inst.setMouse) {
      inst.setMouse(mouse.x, mouse.y, mouse.active, hoverEffectRef.current);
    }

    inst.update(dt, paramsRef.current, colorsRef.current);
    inst.render(ctx, canvas.width, canvas.height, charW, charH, paramsRef.current, colorsRef.current);

    // Subtle glow pass using compositing (lightweight, no shadowBlur)
    if (glowEnabledRef.current && glowCanvasRef.current) {
      const gCtx = glowCanvasRef.current.getContext('2d');
      gCtx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw the main canvas into the glow canvas, slightly blurred via CSS filter
      gCtx.globalAlpha = 0.35;
      gCtx.filter = 'blur(3px)';
      gCtx.drawImage(canvas, 0, 0);
      gCtx.filter = 'none';
      gCtx.globalAlpha = 1;

      // Composite the glow back onto the main canvas
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.25;
      ctx.drawImage(glowCanvasRef.current, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // Cursor hover overlay — draw a subtle interactive zone
    if (mouse.active) {
      const effect = hoverEffectRef.current;
      const radius = 80;
      if (effect === 'spotlight') {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, radius);
        grad.addColorStop(0, 'rgba(255,255,255,0.06)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(mouse.x - radius, mouse.y - radius, radius * 2, radius * 2);
      }
    }

    // Throttle stats to 2×/sec
    if (onStats) {
      statsThrottleRef.current += dt;
      if (statsThrottleRef.current >= 0.5) {
        statsThrottleRef.current = 0;
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
      if (glowCanvasRef.current) {
        glowCanvasRef.current.width = w;
        glowCanvasRef.current.height = h;
      }
      if (instanceRef.current) {
        instanceRef.current.init(canvas, paramsRef.current, colorsRef.current);
      }
    });
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
      />
      <canvas
        ref={glowCanvasRef}
        style={{ display: 'none' }}
      />
    </>
  );
}
