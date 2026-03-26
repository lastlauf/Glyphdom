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

function StarryNightPortrait() {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: -1, y: -1, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 800, H = 560;
    canvas.width = W; canvas.height = H;

    const CHARS = ' .,:;!|+*xX#%@$█▓▒░◆●';
    let time = 0, raf;
    const glowC = document.createElement('canvas');
    glowC.width = W; glowC.height = H;

    // Major glowing orbs: [nx, ny, radius_scale, is_moon]
    const ORBS = [
      [0.40, 0.37, 1.0, false],  // big swirl center star
      [0.54, 0.22, 0.75, false],
      [0.27, 0.30, 0.7, false],
      [0.64, 0.15, 0.65, false],
      [0.18, 0.22, 0.55, false],
      [0.08, 0.28, 0.5, false],
      [0.72, 0.35, 0.6, false],
      [0.48, 0.10, 0.5, false],
      [0.875, 0.14, 1.4, true],  // moon — large, orange
    ];

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width) * W,
        y: ((e.clientY - rect.top) / rect.height) * H,
        active: true,
      };
    };
    const onLeave = () => { mouseRef.current = { x:-1, y:-1, active:false }; };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

    function draw() {
      const ctx = canvas.getContext('2d');
      const cw = 6, ch = 9;
      const cols = Math.ceil(W / cw), rows = Math.ceil(H / ch);

      ctx.fillStyle = '#080B2A';
      ctx.fillRect(0, 0, W, H);
      ctx.font = '500 7px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';

      const t = time;
      const m = mouseRef.current;
      const mC = m.active ? m.x / cw : -9999;
      const mR = m.active ? m.y / ch : -9999;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const nx = col / cols;
          const ny = row / rows;

          // Mouse proximity
          const mdx = col - mC, mdy = row - mR;
          const mDist = Math.sqrt(mdx*mdx + mdy*mdy);
          const mProx = m.active && mDist < 12 ? (1 - mDist/12) : 0;
          const mTimeBoost = mProx * 4;

          // ── Find nearest orb ──────────────────────
          let bestOrbBright = 0, bestOrbR = 0, bestOrbG = 0, bestOrbB = 0;
          let isMoonPixel = false;
          for (const [sx, sy, rs, isMoon] of ORBS) {
            const baseR = isMoon ? 0.10 : 0.065;
            const orbR = baseR * rs;
            const dx = (nx - sx) / orbR;
            const dy = (ny - sy) / (orbR * 0.85);
            const d = Math.sqrt(dx*dx + dy*dy);
            if (d < 1.8) {
              const glow = Math.max(0, 1 - d/1.8);
              const boost = glow * (1 + mProx * 0.5);
              if (boost > bestOrbBright) {
                bestOrbBright = boost;
                isMoonPixel = isMoon;
                if (isMoon) {
                  // Orange-gold moon
                  if (d < 0.25)      { bestOrbR=255; bestOrbG=210; bestOrbB=100; }
                  else if (d < 0.55) { bestOrbR=255; bestOrbG=175; bestOrbB=40; }
                  else if (d < 0.90) { bestOrbR=255; bestOrbG=220; bestOrbB=120; }
                  else               { bestOrbR=220; bestOrbG=210; bestOrbB=160; }
                } else {
                  // White-yellow star
                  if (d < 0.15)      { bestOrbR=255; bestOrbG=255; bestOrbB=240; }
                  else if (d < 0.45) { bestOrbR=255; bestOrbG=238; bestOrbB=120; }
                  else if (d < 0.85) { bestOrbR=240; bestOrbG=205; bestOrbB=60; }
                  else               { bestOrbR=180; bestOrbG=175; bestOrbB=120; }
                }
              }
            }
          }

          // ── Cypress tree ─────────────────────────
          const cypX = 0.105;
          const cypW = (0.038 + (ny < 0.5 ? (0.5-ny)*0.06 : (ny-0.5)*0.04)) * (0.5 + (1-ny)*0.5);
          const inCypress = Math.abs(nx - cypX) < cypW && ny > 0.04 && ny < 0.83;

          // ── Village ───────────────────────────────
          const inVillage = ny > 0.82;

          // ── Mountains / hills ─────────────────────
          const hill1 = 0.68 + Math.sin(nx * 6.2 + 1.1) * 0.04 + Math.cos(nx * 3.7) * 0.03;
          const hill2 = 0.72 + Math.sin(nx * 4.8 - 0.8) * 0.035 + Math.cos(nx * 7.1) * 0.025;
          const inHills = ny > Math.min(hill1, hill2) && ny < 0.82;

          // ── Sky swirl ─────────────────────────────
          // Spiral emanating from swirl center (0.42, 0.37)
          const scx = 0.42, scy = 0.37;
          const sAngle = Math.atan2((ny - scy) * 1.2, (nx - scx));
          const sRadius = Math.sqrt(((nx-scx)*1.5)**2 + (ny-scy)**2) * 10;
          const swirl1 = Math.sin(sRadius - sAngle * 1.5 + (t + mTimeBoost) * 1.0) * 0.5 + 0.5;
          const swirl2 = Math.sin(nx*7 + ny*5 + (t + mTimeBoost)*0.8) * 0.35
                       + Math.sin(nx*4 - ny*9 + (t + mTimeBoost)*1.2) * 0.30
                       + Math.sin((nx+ny)*11 + (t + mTimeBoost)*0.6) * 0.20;
          const sv = swirl1 * 0.6 + (swirl2 * 0.5 + 0.5) * 0.4;

          // ── Assign color ──────────────────────────
          let r, g, b, density;

          if (bestOrbBright > 0.05) {
            const blend = Math.min(1, bestOrbBright * 1.2);
            r = Math.round(bestOrbR * blend + (12 + sv*35) * (1-blend));
            g = Math.round(bestOrbG * blend + (30 + sv*70) * (1-blend));
            b = Math.round(bestOrbB * blend + (90 + sv*110) * (1-blend));
            density = 0.35 + blend * 0.60;

          } else if (inCypress) {
            const tex = (Math.sin(nx*55 + ny*38 - t*0.5)+1)*0.5;
            const edge = 1 - Math.abs(nx - cypX) / cypW;
            r = Math.round(8  + tex*18 + edge*5);
            g = Math.round(14 + tex*22 + edge*8);
            b = Math.round(8  + tex*14);
            density = 0.68 + tex*0.26;

          } else if (inVillage) {
            // Tiny warm-lit buildings
            const bldgSeed = Math.floor(nx * 18);
            const bldgTop = 0.82 + (Math.sin(bldgSeed * 7.3) * 0.5 + 0.5) * 0.09;
            const isWindow = ny > bldgTop + 0.02 && ny < bldgTop + 0.055
              && ((nx * 60) % 1) > 0.3 && ((nx * 60) % 1) < 0.6
              && Math.sin(bldgSeed * 13.7) > 0.3;
            if (isWindow) {
              r=255; g=195; b=45; density=0.88;
            } else if (ny > bldgTop) {
              r=12; g=18; b=55; density=0.55;
            } else {
              r=8; g=14; b=48; density=0.18 + sv*0.25;
            }

          } else if (inHills) {
            const hv = (Math.sin(nx*8 + ny*4 - t*0.08)+1)*0.5;
            const ridge = Math.max(0, 1 - Math.abs(ny - hill1) * 18);
            r = Math.round(14 + hv*20 + ridge*25);
            g = Math.round(30 + hv*35 + ridge*30);
            b = Math.round(88 + hv*55 + ridge*40);
            density = 0.42 + hv*0.36;

          } else {
            // Sky — deep blue with Van Gogh swirls
            const depth = 1 - ny * 0.5; // slightly darker at top
            r = Math.round(10 + sv*38 + depth*12 + mProx*40);
            g = Math.round(24 + sv*72 + depth*25 + mProx*70);
            b = Math.round(88 + sv*115 + depth*35 + mProx*35);
            density = 0.28 + sv*0.52 + mProx*0.10;
          }

          r = Math.min(255, Math.max(0, r));
          g = Math.min(255, Math.max(0, g));
          b = Math.min(255, Math.max(0, b));

          const ci  = Math.min(CHARS.length-1, Math.floor(density * CHARS.length));
          const ch2 = CHARS[ci];
          if (ch2 === ' ') continue;

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillText(ch2, col*cw + cw/2, row*ch + ch-1);
        }
      }

      // Glow pass
      const gCtx = glowC.getContext('2d');
      gCtx.clearRect(0, 0, W, H);
      gCtx.filter = 'blur(5px)';
      gCtx.drawImage(canvas, 0, 0);
      gCtx.filter = 'none';
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.18;
      ctx.drawImage(glowC, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      time += 0.016 * 0.20;
      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="vangogh-canvas" />;
}

// Lightweight ASCII background renderer for the hero
function useHeroBgCanvas(canvasRef, mouseRef) {
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

      // Convert mouse page coords to canvas-local cell coords
      const m = mouseRef ? mouseRef.current : null;
      let mCol = -9999, mRow = -9999;
      if (m && m.active) {
        const rect = canvas.getBoundingClientRect();
        const localX = m.x - rect.left;
        const localY = m.y - rect.top;
        mCol = localX / cw;
        mRow = localY / ch;
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const nx = c / cols * 4 + time * 0.5;
          const ny = r / rows * 3 + time * 0.3;

          // Mouse proximity disturbance
          const mdx = c - mCol, mdy = r - mRow;
          const dist = Math.sqrt(mdx * mdx + mdy * mdy);
          const mouseInfluence = dist < 10 ? (1 - dist / 10) * 1.8 : 0;

          const wave = Math.sin(nx * 1.5 + ny * 2 + time + mouseInfluence) * 0.5
            + Math.sin(nx * 0.7 - ny + time * 1.3 + mouseInfluence * 0.6) * 0.3
            + Math.sin((nx + ny) * 2.5 + time * 0.6 + mouseInfluence * 0.4) * 0.2;
          const v = (wave + 1) * 0.5;
          const idx = Math.floor(v * (CHARS.length - 1));
          const alpha = 0.04 + v * 0.1 + mouseInfluence * 0.15;
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
  const heroMouseRef = useRef({ x: -1, y: -1, active: false });

  const GAME_NAMES = new Set(['Pac-Man','Space Invaders','Tetris','Snake','Nyan Cat','Game of Life','Mario','Smiley','Star Wars']);
  const AMBIENT_TEMPLATES = TEMPLATES
    .map((tmpl, i) => ({ tmpl, originalIndex: i }))
    .filter(({ tmpl }) => !GAME_NAMES.has(tmpl.name));

  useEffect(() => {
    scrambleTo(headRef.current, 'Make text move.', 500, 1200);
  }, []);

  useHeroBgCanvas(heroBgRef, heroMouseRef);

  const handleHeroMouseMove = (e) => {
    heroMouseRef.current = { x: e.clientX, y: e.clientY, active: true };
  };

  const handleHeroMouseLeave = () => {
    heroMouseRef.current = { x: -1, y: -1, active: false };
  };

  return (
    <div className="landing">
      <div
        className="landing-hero"
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
      >
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
          <StarryNightPortrait />
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
