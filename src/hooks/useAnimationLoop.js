import { useRef, useEffect, useCallback } from 'react';

export default function useAnimationLoop(callback, active = true) {
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const fpsRef = useRef(60);
  const frameCountRef = useRef(0);
  const fpsTimerRef = useRef(0);

  const loop = useCallback((timestamp) => {
    if (!active) return;
    if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = timestamp;

    // FPS counter
    frameCountRef.current++;
    fpsTimerRef.current += dt;
    if (fpsTimerRef.current >= 0.5) {
      fpsRef.current = Math.round(frameCountRef.current / fpsTimerRef.current);
      frameCountRef.current = 0;
      fpsTimerRef.current = 0;
    }

    callback(dt, fpsRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [callback, active]);

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return;
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loop, active]);

  return fpsRef;
}
