import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TEMPLATES from '../lib/templates/index.js';
import { IconLightning, IconSliders, IconHexGrid, IconPalette } from '../components/Icons.jsx';
import { registerPreview, unregisterPreview } from '../lib/sharedLoop.js';

const plasmaTemplate = TEMPLATES.find(t => t.name === 'Plasma');

function ShowcaseCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !plasmaTemplate) return;

    const params = Object.fromEntries(
      Object.entries(plasmaTemplate.params).map(([k, v]) => [k, v.default])
    );
    params.speed = 1.1;
    params.frequency = 2.8;
    const colors = { ...plasmaTemplate.colors };

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const inst = plasmaTemplate.createInstance();
    inst.init(canvas, params, colors);

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      inst.setMouse(
        (e.clientX - rect.left) * scaleX,
        (e.clientY - rect.top) * scaleY,
        true, 'ripple'
      );
    };
    const onLeave = () => inst.setMouse(-1, -1, false, 'ripple');
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

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
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
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

function MonaLisaPortrait() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = 480;
    canvas.height = 640;

    const CHARS = ' .,:;!|i+xX#%@$&█▓▒░';
    let time = 0;
    let raf;

    // Offscreen canvas for glow pass — created once
    const glowC = document.createElement('canvas');
    glowC.width = 480; glowC.height = 640;

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
      const cw = 6, ch = 9;
      const cols = Math.ceil(W / cw), rows = Math.ceil(H / ch);

      ctx.fillStyle = '#0E0D06';
      ctx.fillRect(0, 0, W, H);
      ctx.font = '500 7px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';

      const t = time;
      const FCX = 0.478, FCY = 0.345;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const nx = (col + 0.5) / cols;
          const ny = (row + 0.5) / rows;
          const dx = nx - FCX;
          const dy = ny - FCY;

          // Zone detection
          const skinDist    = (dx / 0.21) ** 2 + (dy / 0.245) ** 2;
          const hairTopD    = (dx / 0.175) ** 2 + ((ny - 0.165) / 0.155) ** 2;
          const leftHairD   = ((nx - 0.225) / 0.135) ** 2 + ((ny - 0.465) / 0.30) ** 2;
          const rightHairD  = ((nx - 0.725) / 0.110) ** 2 + ((ny - 0.425) / 0.255) ** 2;
          const neckD       = ((nx - FCX) / 0.072) ** 2 + ((ny - 0.595) / 0.095) ** 2;
          const handsD      = ((nx - 0.50) / 0.255) ** 2 + ((ny - 0.905) / 0.085) ** 2;
          const inDress     = ny > 0.70 || (ny > 0.625 && (nx < 0.235 || nx > 0.745));
          const inShoulders = ny > 0.575 && ny < 0.72 && Math.abs(dx) > 0.125 && Math.abs(dx) < 0.375;
          const leftEye     = ((nx - 0.415) / 0.033) ** 2 + ((ny - 0.345) / 0.020) ** 2 < 1;
          const rightEye    = ((nx - 0.548) / 0.031) ** 2 + ((ny - 0.342) / 0.019) ** 2 < 1;
          const lipsD       = ((nx - FCX + 0.006) / 0.066) ** 2 + ((ny - 0.465) / 0.022) ** 2;

          const n  = noise(nx * 8, ny * 7, t);
          const nn = (n + 1) * 0.5;

          const bgN    = noise(nx * 4, ny * 3.5, t * 0.25);
          const bgHaze = (bgN + 1) * 0.5 * 0.65 + 0.35;
          const leftBias  = Math.max(0, 0.5 - nx) * 1.2;
          const rightBias = Math.max(0, nx - 0.5) * 0.8;

          let r, g, b, density;

          if (leftEye || rightEye) {
            r = 48; g = 36; b = 22; density = 0.92;

          } else if (lipsD < 1.0) {
            const lv = 0.75 + nn * 0.25;
            r = Math.round(180 * lv); g = Math.round(108 * lv); b = Math.round(58 * lv);
            density = 0.50 + nn * 0.34;

          } else if (skinDist < 1.0) {
            const s = 0.78 + nn * 0.22;
            r = Math.round((225 + nn * 22) * s);
            g = Math.round((165 + nn * 18) * s);
            b = Math.round((80  + nn * 14) * s);
            density = 0.12 + nn * 0.34;

          } else if (hairTopD < 1.0 && ny < FCY + 0.09) {
            const hs = (Math.sin(nx * 13 + ny * 15 - t * 0.5) + 1) * 0.5;
            r = Math.round(92 + hs * 28); g = Math.round(48 + hs * 20); b = Math.round(18 + hs * 11);
            density = 0.66 + nn * 0.28;

          } else if (leftHairD < 1.0) {
            const hs = (Math.sin(nx * 9 + ny * 18 - t * 0.45) + 1) * 0.5;
            r = Math.round(88 + hs * 30); g = Math.round(45 + hs * 22); b = Math.round(16 + hs * 11);
            density = 0.62 + nn * 0.30;

          } else if (rightHairD < 1.0) {
            const hs = (Math.sin(nx * 9 + ny * 16 - t * 0.40) + 1) * 0.5;
            r = Math.round(86 + hs * 28); g = Math.round(43 + hs * 20); b = Math.round(15 + hs * 10);
            density = 0.60 + nn * 0.30;

          } else if (neckD < 1.0) {
            const s = 0.74 + nn * 0.24;
            r = Math.round(210 * s); g = Math.round(155 * s); b = Math.round(70 * s);
            density = 0.14 + nn * 0.30;

          } else if (handsD < 1.0) {
            const s = 0.68 + nn * 0.26;
            r = Math.round(202 * s); g = Math.round(148 * s); b = Math.round(64 * s);
            density = 0.16 + nn * 0.32;

          } else if (inDress || inShoulders) {
            const ds = (Math.sin(nx * 7 + ny * 5 + t * 0.2) + 1) * 0.5;
            r = Math.round(30 + ds * 20 + leftBias * 8);
            g = Math.round(32 + ds * 22 + leftBias * 6);
            b = Math.round(18 + ds * 14);
            density = 0.46 + nn * 0.40;

          } else {
            const haze = Math.max(0.1, bgHaze - leftBias * 0.3 + rightBias * 0.1);
            r = Math.round(108 + haze * 72 - leftBias * 25);
            g = Math.round(105 + haze * 62 - leftBias * 12);
            b = Math.round(38  + haze * 35 + rightBias * 12);
            density = 0.28 + haze * 0.44;
          }

          r = Math.min(255, Math.max(0, r));
          g = Math.min(255, Math.max(0, g));
          b = Math.min(255, Math.max(0, b));

          const ci   = Math.min(CHARS.length - 1, Math.floor(density * CHARS.length));
          const char = CHARS[ci];
          if (char === ' ') continue;

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillText(char, col * cw + cw / 2, row * ch + ch - 1);
        }
      }

      // Subtle glow/bloom pass
      const gCtx = glowC.getContext('2d');
      gCtx.clearRect(0, 0, 480, 640);
      gCtx.filter = 'blur(4px)';
      gCtx.drawImage(canvas, 0, 0);
      gCtx.filter = 'none';
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.10;
      ctx.drawImage(glowC, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      time += 0.016 * 0.16;
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

  const GAME_NAMES = new Set(['Pac-Man','Space Invaders','Tetris','Snake','Nyan Cat','Game of Life','Mario','Smiley','Star Wars']);
  const AMBIENT_TEMPLATES = TEMPLATES
    .map((tmpl, i) => ({ tmpl, originalIndex: i }))
    .filter(({ tmpl }) => !GAME_NAMES.has(tmpl.name));

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
            Every character responds to where you are. Hover the canvas — waves bend and pulse around your cursor — the plasma responds to every move.
          </p>
          <Link to="/studio" className="cta-primary" style={{ alignSelf: 'flex-start' }}>Try in Studio</Link>
        </div>
      </div>

      <div className="landing-grid-section">
        <div className="landing-grid-header">
          <h2 className="landing-grid-title">Templates</h2>
          <span className="landing-grid-count">{AMBIENT_TEMPLATES.length} animations</span>
        </div>
        <div className="template-gallery-grid">
          {AMBIENT_TEMPLATES.map(({ tmpl, originalIndex }) => (
            <GalleryCard key={tmpl.name} template={tmpl} index={originalIndex} templateIndex={originalIndex} />
          ))}
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
    </div>
  );
}
