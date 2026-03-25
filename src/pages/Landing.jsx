import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TEMPLATES from '../lib/templates/index.js';
import { IconLightning, IconSliders, IconHexGrid, IconPalette } from '../components/Icons.jsx';
import { registerPreview, unregisterPreview } from '../lib/sharedLoop.js';

const flowTemplate = TEMPLATES.find(t => t.name === 'Flow Field');

function ShowcaseCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !flowTemplate) return;

    const params = Object.fromEntries(
      Object.entries(flowTemplate.params).map(([k, v]) => [k, v.default])
    );
    const colors = { ...flowTemplate.colors };

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const inst = flowTemplate.createInstance();
    inst.init(canvas, params, colors);

    let raf, last = 0;
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

function GalleryCard({ template, index, templateIndex }) {
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
      onClick={() => navigate(`/studio?t=${templateIndex}`)}
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

// Mona Lisa portrait — procedural ASCII portrait with sfumato atmosphere
function MonaLisaPortrait() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = 384;
    canvas.height = 504;

    const CHARS = ' .,:;!|i+xX#%@$&█▓▒░';
    let time = 0;
    let raf;

    function noise(x, y, t) {
      return (
        Math.sin(x * 2.7 + y * 1.3 + t * 0.12) * 0.4 +
        Math.cos(x * 1.5 - y * 2.1 + t * 0.09) * 0.3 +
        Math.sin((x + y) * 3.1 + t * 0.15) * 0.2 +
        Math.cos(x * 0.9 + y * 4.3 - t * 0.07) * 0.1
      );
    }

    function draw() {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const cw = 8, ch = 12;
      const cols = Math.ceil(W / cw), rows = Math.ceil(H / ch);

      ctx.fillStyle = '#131208';
      ctx.fillRect(0, 0, W, H);
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';

      const t = time;
      // Mona Lisa — 3/4 pose, face slightly left of center
      const FCX = 0.475, FCY = 0.355;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const nx = (col + 0.5) / cols;
          const ny = (row + 0.5) / rows;
          const dx = nx - FCX;
          const dy = ny - FCY;

          // Zone detection — Mona Lisa proportions
          const skinDist    = (dx / 0.205) ** 2 + (dy / 0.24) ** 2;
          // Hair: parted in middle, flows down both sides
          const hairTopD    = (dx / 0.165) ** 2 + ((ny - 0.175) / 0.15) ** 2;
          const leftHairD   = ((nx - 0.235) / 0.125) ** 2 + ((ny - 0.46) / 0.28) ** 2;
          const rightHairD  = ((nx - 0.715) / 0.105) ** 2 + ((ny - 0.42) / 0.24) ** 2;
          const neckD       = ((nx - FCX) / 0.068) ** 2 + ((ny - 0.59) / 0.09) ** 2;
          const handsD      = ((nx - 0.50) / 0.24) ** 2 + ((ny - 0.90) / 0.09) ** 2;
          const inDress     = ny > 0.70 || (ny > 0.62 && (nx < 0.24 || nx > 0.74));
          const inShoulders = ny > 0.57 && ny < 0.72 && Math.abs(dx) > 0.13 && Math.abs(dx) < 0.36;
          // Eyes — slightly asymmetric (3/4 pose)
          const leftEye     = ((nx - 0.412) / 0.031) ** 2 + ((ny - 0.352) / 0.018) ** 2 < 1;
          const rightEye    = ((nx - 0.545) / 0.030) ** 2 + ((ny - 0.349) / 0.018) ** 2 < 1;
          const lipsD       = ((nx - FCX + 0.008) / 0.062) ** 2 + ((ny - 0.465) / 0.020) ** 2;

          const n  = noise(nx * 8, ny * 7, t);
          const nn = (n + 1) * 0.5;

          // Sfumato: hazy olive-yellow-green atmospheric background
          const bgN    = noise(nx * 4, ny * 3.5, t * 0.25);
          const bgHaze = (bgN + 1) * 0.5 * 0.6 + 0.4;
          // Left side (rocks) darker olive, right side (sky/water) warmer yellow-green
          const leftBias  = Math.max(0, 0.5 - nx) * 1.2;
          const rightBias = Math.max(0, nx - 0.5) * 0.8;

          let r, g, b, density;

          if (leftEye || rightEye) {
            r = 42; g = 32; b = 20; density = 0.90;

          } else if (lipsD < 1.0) {
            const lv = 0.72 + nn * 0.28;
            r = Math.round(168 * lv); g = Math.round(98 * lv); b = Math.round(52 * lv);
            density = 0.48 + nn * 0.36;

          } else if (skinDist < 1.0) {
            // Warm golden amber — da Vinci's characteristic warm flesh
            const s = 0.74 + nn * 0.26;
            r = Math.round((202 + nn * 28) * s);
            g = Math.round((152 + nn * 20) * s);
            b = Math.round((72  + nn * 16) * s);
            density = 0.14 + nn * 0.36;

          } else if (hairTopD < 1.0 && ny < FCY + 0.08) {
            // Parted center hair — dark auburn
            const hs = (Math.sin(nx * 13 + ny * 15 - t * 0.5) + 1) * 0.5;
            r = Math.round(82 + hs * 26); g = Math.round(42 + hs * 18); b = Math.round(16 + hs * 10);
            density = 0.64 + nn * 0.30;

          } else if (leftHairD < 1.0) {
            // Left flowing hair — dark auburn, gentle wave
            const hs = (Math.sin(nx * 9 + ny * 18 - t * 0.45) + 1) * 0.5;
            r = Math.round(80 + hs * 28); g = Math.round(40 + hs * 20); b = Math.round(15 + hs * 10);
            density = 0.60 + nn * 0.32;

          } else if (rightHairD < 1.0) {
            const hs = (Math.sin(nx * 9 + ny * 16 - t * 0.40) + 1) * 0.5;
            r = Math.round(78 + hs * 26); g = Math.round(38 + hs * 18); b = Math.round(14 + hs * 9);
            density = 0.58 + nn * 0.32;

          } else if (neckD < 1.0) {
            const s = 0.70 + nn * 0.26;
            r = Math.round(196 * s); g = Math.round(142 * s); b = Math.round(64 * s);
            density = 0.15 + nn * 0.33;

          } else if (handsD < 1.0) {
            const s = 0.64 + nn * 0.28;
            r = Math.round(188 * s); g = Math.round(136 * s); b = Math.round(60 * s);
            density = 0.18 + nn * 0.34;

          } else if (inDress || inShoulders) {
            // Very dark olive-charcoal dress
            const ds = (Math.sin(nx * 7 + ny * 5 + t * 0.2) + 1) * 0.5;
            r = Math.round(26 + ds * 18 + leftBias * 8);
            g = Math.round(28 + ds * 20 + leftBias * 6);
            b = Math.round(16 + ds * 12);
            density = 0.44 + nn * 0.42;

          } else {
            // Sfumato landscape — warm olive-yellow with atmospheric haze
            const haze = bgHaze - leftBias * 0.3 + rightBias * 0.1;
            r = Math.round(88  + haze * 68 - leftBias * 20);
            g = Math.round(90  + haze * 58 - leftBias * 10);
            b = Math.round(30  + haze * 32 + rightBias * 10);
            density = 0.28 + haze * 0.44;
          }

          r = Math.min(255, Math.max(0, r));
          g = Math.min(255, Math.max(0, g));
          b = Math.min(255, Math.max(0, b));

          const ci   = Math.min(CHARS.length - 1, Math.floor(density * CHARS.length));
          const char = CHARS[ci];
          if (char === ' ') continue;

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillText(char, col * cw + cw / 2, row * ch + ch - 2);
        }
      }

      time += 0.016 * 0.18; // slow, contemplative
      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="vangogh-canvas" />;
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
          <ShowcaseCanvas />
        </div>
        <div className="skull-showcase-copy">
          <p className="skull-showcase-label">Interactive</p>
          <h2 className="skull-showcase-heading">Move your cursor<br />through it.</h2>
          <p className="skull-showcase-body">
            Every character responds to where you are. Hover the canvas — a vortex bends the flow field around your cursor in real time.
          </p>
          <Link to="/studio" className="cta-primary" style={{ alignSelf: 'flex-start' }}>Try in Studio</Link>
        </div>
      </div>

      {/* Gallery CTA — Van Gogh portrait */}
      <div className="gallery-portrait-cta">
        <div className="gallery-portrait-canvas-wrap">
          <MonaLisaPortrait />
        </div>
        <div className="gallery-portrait-copy">
          <p className="gallery-portrait-label">Gallery</p>
          <h2 className="gallery-portrait-heading">
            Every portrait.<br />
            Every loop.<br />
            Every glitch.
          </h2>
          <p className="gallery-portrait-body">
            The Glyphdom community turns images, videos, and ideas into living ASCII art. Browse what others have made — or upload your own.
          </p>
          <Link to="/gallery" className="cta-gallery">Browse Gallery →</Link>
        </div>
      </div>

      <div className="landing-grid-section">
        <div className="landing-grid-header">
          <h2 className="landing-grid-title">Templates</h2>
          <span className="landing-grid-count">{TEMPLATES.length} animations</span>
        </div>
        <div className="template-gallery-grid">
          {TEMPLATES.map((tmpl, i) => (
            <GalleryCard key={tmpl.name} template={tmpl} index={i} templateIndex={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
