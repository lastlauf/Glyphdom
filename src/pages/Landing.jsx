import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TEMPLATES from '../lib/templates/index.js';
import { IconLightning, IconSliders, IconHexGrid, IconPalette } from '../components/Icons.jsx';
import { registerPreview, unregisterPreview } from '../lib/sharedLoop.js';

const skullTemplate = TEMPLATES.find(t => t.name === 'Skull');

function SkullCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !skullTemplate) return;

    const params = Object.fromEntries(
      Object.entries(skullTemplate.params).map(([k, v]) => [k, v.default])
    );
    const colors = { ...skullTemplate.colors };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const inst = skullTemplate.createInstance();
    inst.init(canvas, params, colors);

    // Full-speed dedicated rAF for the hero skull
    let raf;
    let last = 0;
    const tick = (ts) => {
      const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016;
      last = ts;
      inst.update(dt, params, colors);
      inst.render(canvas.getContext('2d'), canvas.width, canvas.height, 8, 12, params, colors);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (inst.destroy) inst.destroy();
    };
  }, []);

  return <canvas ref={canvasRef} className="skull-hero-canvas" />;
}

const SCRAMBLE_CHARS = '█▓▒░|/\\-_+';

function scrambleTo(el, final, delay = 0, duration = 900) {
  if (!el) return;
  setTimeout(() => {
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const revealed = Math.floor(p * final.length);
      el.textContent = final.split('').map((c, i) =>
        i < revealed ? c : c === ' ' ? ' ' : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
      ).join('');
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = final;
    }
    requestAnimationFrame(step);
  }, delay);
}

function GalleryCard({ template, index }) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const instRef = useRef(null);
  const paramsRef = useRef(null);
  const colorsRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !template) return;

    const params = Object.fromEntries(
      Object.entries(template.params).map(([k, v]) => [k, v.default])
    );
    const colors = { ...template.colors };
    paramsRef.current = params;
    colorsRef.current = colors;

    const setSize = () => {
      canvas.width = canvas.offsetWidth || 300;
      canvas.height = canvas.offsetHeight || 200;
    };
    setSize();

    const inst = template.createInstance();
    instRef.current = inst;
    inst.init(canvas, params, colors);

    const tick = (dt) => {
      if (!canvas.isConnected) return;
      inst.update(dt * 0.55, paramsRef.current, colorsRef.current);
      inst.render(
        canvas.getContext('2d'),
        canvas.width, canvas.height,
        12, 18,
        paramsRef.current, colorsRef.current
      );
    };
    registerPreview(tick);

    return () => {
      unregisterPreview(tick);
      if (inst.destroy) inst.destroy();
    };
  }, [template]);

  return (
    <div
      className="template-gallery-card"
      style={{ animationDelay: `${index * 70 + 300}ms` }}
      onClick={() => navigate('/studio')}
    >
      <div className="template-gallery-canvas">
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>
      <div className="template-gallery-footer">
        <span className="template-gallery-name">{template.name}</span>
        <span className="template-gallery-desc">{template.description}</span>
      </div>
    </div>
  );
}

// Lightweight ASCII background renderer for the hero
function useHeroBgCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let time = 0;
    const CHARS = '.:-=+*#%@';

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function draw(ts) {
      time += 0.008;
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      const cw = 18, ch = 24;
      const cols = Math.floor(w / cw), rows = Math.floor(h / ch);
      ctx.font = `300 ${ch - 6}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const nx = c / cols * 4 + time * 0.5;
          const ny = r / rows * 3 + time * 0.3;
          const wave = Math.sin(nx * 1.5 + ny * 2 + time) * 0.5
            + Math.sin(nx * 0.7 - ny + time * 1.3) * 0.3
            + Math.sin((nx + ny) * 2.5 + time * 0.6) * 0.2;
          const v = (wave + 1) * 0.5;
          const idx = Math.floor(v * (CHARS.length - 1));
          const alpha = 0.04 + v * 0.1;
          ctx.fillStyle = `rgba(17,17,16,${alpha})`;
          ctx.fillText(CHARS[idx], c * cw + cw / 2, r * ch + ch - 4);
        }
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [canvasRef]);
}

export default function Landing() {
  const headRef = useRef(null);
  const heroBgRef = useRef(null);

  useEffect(() => {
    scrambleTo(headRef.current, 'Make text move.', 500, 1200);
  }, []);

  useHeroBgCanvas(heroBgRef);

  return (
    <div className="landing">
      <div className="landing-hero">
        <canvas ref={heroBgRef} className="hero-bg-canvas" aria-hidden="true" />
        <div className="landing-headline-wrap">
          <h1 ref={headRef} className="landing-headline">██████████████</h1>
        </div>
        <p className="landing-sub">
          Design living ASCII systems — responsive, reactive, and endlessly variable. Drop in any image or video and watch it transform.
        </p>
        <div className="landing-cta-row">
          <Link to="/studio" className="cta-primary">Open Studio</Link>
          <Link to="/editor" className="cta-ghost">Upload Media</Link>
        </div>
      </div>

      <div className="landing-features-strip">
        {[
          { icon: <IconLightning size={22} />, title: 'Live Animation',    desc: '60fps HTML5 Canvas. Every frame, every character.' },
          { icon: <IconSliders size={22} />, title: 'Real-Time Params',  desc: 'Drag sliders — watch the animation respond instantly.' },
          { icon: <IconHexGrid size={22} />, title: 'Media to ASCII',    desc: 'Drop any image or video. Watch it render as live ASCII art.' },
          { icon: <IconPalette size={22} />, title: 'Interactive',       desc: 'Hover effects, glow, and cursor interaction built in.' },
        ].map((f, i) => (
          <div
            key={f.title}
            className="feature-item"
            style={{ animation: 'fadeUp 400ms var(--ease-expo-out) both', animationDelay: `${200 + i * 80}ms` }}
          >
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-title">{f.title}</div>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="skull-showcase">
        <div className="skull-showcase-canvas-wrap">
          <SkullCanvas />
        </div>
        <div className="skull-showcase-copy">
          <p className="skull-showcase-label">3D ASCII</p>
          <h2 className="skull-showcase-heading">Every character<br />is a decision.</h2>
          <p className="skull-showcase-body">
            Depth-mapped point clouds projected in real time. Each glyph is chosen by brightness, distance, and density — no sprites, no textures, no shortcuts.
          </p>
          <Link to="/studio" className="cta-primary" style={{ alignSelf: 'flex-start' }}>Try in Studio</Link>
        </div>
      </div>

      <div className="landing-grid-section">
        <div className="landing-grid-header">
          <h2 className="landing-grid-title">Templates</h2>
          <span className="landing-grid-count">{TEMPLATES.length} animations</span>
        </div>
        <div className="template-gallery-grid">
          {TEMPLATES.map((tmpl, i) => (
            <GalleryCard key={tmpl.name} template={tmpl} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
