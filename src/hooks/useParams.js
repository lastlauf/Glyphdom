import { useState, useCallback, useEffect } from 'react';

export default function useParams(template) {
  const defaultParams = (tmpl) => tmpl
    ? Object.fromEntries(Object.entries(tmpl.params).map(([k, v]) => [k, v.default]))
    : {};

  const [params, setParams] = useState(() => defaultParams(template));
  const [colors, setColors] = useState(() => template?.colors ? { ...template.colors } : {});

  // Reset when template changes
  useEffect(() => {
    setParams(defaultParams(template));
    setColors(template?.colors ? { ...template.colors } : {});
  }, [template]);

  const resetParams = useCallback(() => {
    setParams(defaultParams(template));
    setColors(template?.colors ? { ...template.colors } : {});
  }, [template]);

  const randomizeParams = useCallback(() => {
    if (!template) return;
    setParams(Object.fromEntries(
      Object.entries(template.params).map(([k, v]) => {
        const rand = v.min + Math.random() * (v.max - v.min);
        const stepped = Math.round(rand / v.step) * v.step;
        return [k, Math.max(v.min, Math.min(v.max, stepped))];
      })
    ));
  }, [template]);

  const setParam = useCallback((key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const setColor = useCallback((key, value) => {
    setColors(prev => ({ ...prev, [key]: value }));
  }, []);

  return { params, colors, setParam, setColor, setColors, resetParams, randomizeParams };
}
