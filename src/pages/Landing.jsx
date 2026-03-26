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

    const CHARS = ' .,:;!|+xX#%@$█▓▒░◆●';
    let time = 0, raf;

    const glowC = document.createElement('canvas');
    glowC.width = W; glowC.height = H;

    const STARS = [
      [0.28,0.09],[0.44,0.06],[0.56,0.13],[0.65,0.08],
      [0.72,0.18],[0.88,0.28],[0.36,0.21],[0.51,0.25],
      [0.18,0.16],[0.78,0.08],[0.93,0.15],[0.12,0.10],
    ];

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width)  * W,
        y: ((e.clientY - rect.top)  / rect.height) * H,
        active: true,
      };
    };
    const onLeave = () => { mouseRef.current = { x: -1, y: -1, active: false }; };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

    function draw() {
      const ctx = canvas.getContext('2d');
      const cw = 6, ch = 9;
      const cols = Math.ceil(W / cw), rows = Math.ceil(H / ch);

      ctx.fillStyle = '#05061A';
      ctx.fillRect(0, 0, W, H);
      ctx.font = '500 7px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';

      const t  = time;
      const m  = mouseRef.current;
      const mC = m.active ? m.x / cw : -9999;
      const mR = m.active ? m.y / ch : -9999;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const nx = col / cols;
          const ny = row / rows;

          // Mouse proximity
          const mdx = col - mC, mdy = row - mR;
          const mDist = Math.sqrt(mdx*mdx + mdy*mdy);
          const mProx = m.active && mDist < 14 ? (1 - mDist/14) : 0;
          const mPhase = mProx * 3.2;

          // Zones
          const inSky = ny < 0.68;

          // Cypress tree (left, tall)
          const cypW = 0.068 * (0.4 + (1-ny)*0.6);
          const inCypress = Math.abs(nx - 0.105) < cypW && ny > 0.07;

          // Village strip
          const inVillage = ny > 0.72;
          const inHills   = ny > 0.66 && ny < 0.73 && nx > 0.08;

          // Moon
          const moonD = ((nx-0.83)/0.065)**2 + ((ny-0.13)/0.082)**2;
          const nearMoon = moonD < 1.0;

          // Stars
          let bestStar = Infinity;
          for (const [sx,sy] of STARS) {
            const d = ((nx-sx)/0.032)**2 + ((ny-sy)/0.026)**2;
            if (d < bestStar) bestStar = d;
          }
          const nearStar = bestStar < 1.0;

          // Sky swirl
          const swirlT = t + mPhase;
          const sv = (
            Math.sin(nx*9  + ny*5  + swirlT*1.1) * 0.35 +
            Math.sin(nx*5  - ny*8  + swirlT*0.8) * 0.30 +
            Math.sin((nx+ny)*12 + swirlT*1.4)    * 0.20 +
            Math.cos(nx*3  + ny*11 + swirlT*0.6) * 0.15
          ) * 0.5 + 0.5;

          let r, g, b, density;

          if (bestStar < 0.15) {
            r=255; g=252; b=195; density=0.95;
          } else if (nearStar) {
            const gv = 1-bestStar;
            r=Math.round(180+gv*75); g=Math.round(205+gv*47); b=Math.round(100+gv*95); density=0.30+gv*0.60;
          } else if (nearMoon) {
            const mv=1-moonD; r=Math.round(235+mv*20); g=Math.round(238+mv*17); b=Math.round(170+mv*40); density=0.38+mv*0.52;
          } else if (inCypress) {
            const tv=(Math.sin(nx*42+ny*28-t*0.4)+1)*0.5;
            r=Math.round(6+tv*20); g=Math.round(20+tv*30); b=Math.round(8+tv*18); density=0.70+tv*0.24;
          } else if (inVillage) {
            const bldgH=0.72+(Math.sin(Math.floor(nx*14)*7.3)*0.5+0.5)*0.12;
            if (ny>bldgH) {
              const wv=(Math.sin(nx*20+ny*16)+1)*0.5;
              r=Math.round(150+wv*70); g=Math.round(100+wv*55); b=Math.round(20+wv*45); density=0.50+wv*0.32;
            } else {
              r=10; g=16; b=52; density=0.20+sv*0.28;
            }
          } else if (inHills) {
            const hv=(Math.sin(nx*9+ny*5-t*0.07)+1)*0.5;
            r=Math.round(10+hv*22); g=Math.round(38+hv*45); b=Math.round(50+hv*60); density=0.48+hv*0.38;
          } else {
            // Sky
            const depth=1-ny;
            const boost=mProx*0.4;
            r=Math.round( 6+sv*30+depth*20+boost*50);
            g=Math.round(28+sv*60+depth*40+boost*80);
            b=Math.round(85+sv*95+depth*45+boost*40);
            density=0.32+sv*0.48+mProx*0.08;
          }

          r=Math.min(255,Math.max(0,r));
          g=Math.min(255,Math.max(0,g));
          b=Math.min(255,Math.max(0,b));

          const ci=Math.min(CHARS.length-1,Math.floor(density*CHARS.length));
          const ch2=CHARS[ci];
          if (ch2===' ') continue;

          ctx.fillStyle=`rgb(${r},${g},${b})`;
          ctx.fillText(ch2, col*cw+cw/2, row*ch+ch-1);
        }
      }

      // glow pass
      const gCtx=glowC.getContext('2d');
      gCtx.clearRect(0,0,W,H);
      gCtx.filter='blur(4px)';
      gCtx.drawImage(canvas,0,0);
      gCtx.filter='none';
      ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=0.12;
      ctx.drawImage(glowC,0,0);
      ctx.globalAlpha=1;
      ctx.globalCompositeOperation='source-over';

      time += 0.016 * 0.22;
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
