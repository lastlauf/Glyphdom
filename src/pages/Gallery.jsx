import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import TEMPLATES from '../lib/templates/index.js';
import { registerPreview, unregisterPreview } from '../lib/sharedLoop.js';
import { IconHeart } from '../components/Icons.jsx';

const MOCK_ENTRIES = [
  { id:  1, template: 'Pac-Man',        title: 'Pac-Man',         author: 'ghost_hunt',   likes: 847 },
  { id:  2, template: 'Space Invaders', title: 'Space Invaders',  author: 'pixel_raid',   likes: 612 },
  { id:  3, template: 'Nyan Cat',       title: 'Nyan Cat',        author: 'nyan.wav',     likes: 1204 },
  { id:  4, template: 'Snake',          title: 'Snake',           author: 'snek_king',    likes: 389 },
  { id:  5, template: 'Tetris',         title: 'Tetris',          author: 'tetromino_',   likes: 731 },
  { id:  6, template: 'Matrix',         title: 'The Matrix',      author: 'r3d_pill',     likes: 956 },
  { id:  7, template: 'Game of Life',   title: 'Game of Life',    author: 'conway_fan',   likes: 428 },
  { id:  8, template: 'Starfield',      title: 'Hyperspace',      author: 'han_s0lo',     likes: 573 },
  { id:  9, template: 'Plasma',         title: 'Synthwave',       author: 'vapor_wave',   likes: 682 },
  { id: 10, template: 'Fire',           title: 'Hadouken',        author: 'sf2_fan',      likes: 441 },
  { id: 11, template: 'Ripple',         title: 'Blade Runner',    author: 'voight_k',     likes: 318 },
  { id: 12, template: 'Flow Field',     title: 'Interstellar',    author: 'nolan_wr',     likes: 509 },
];

function GalleryPreview({ templateName }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tmpl = TEMPLATES.find(t => t.name === templateName);
    if (!tmpl) return;

    const params = Object.fromEntries(
      Object.entries(tmpl.params).map(([k, v]) => [k, v.default])
    );
    const colors = { ...tmpl.colors };

    // Use fixed canvas size — parent is aspect-ratio controlled
    const setSize = () => {
      const w = canvas.offsetWidth || 320;
      const h = canvas.offsetHeight || 200;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    setSize();

    const inst = tmpl.createInstance();
    inst.init(canvas, params, colors);

    const tick = (dt) => {
      if (!canvas.isConnected) return;
      inst.update(dt * 0.5, params, colors);
      inst.render(canvas.getContext('2d'), canvas.width, canvas.height, 12, 18, params, colors);
    };
    registerPreview(tick);

    return () => {
      unregisterPreview(tick);
      if (inst.destroy) inst.destroy();
    };
  }, [templateName]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
}

export default function Gallery() {
  return (
    <div className="gallery-page">
      <div className="gallery-hero">
        <div>
          <h1 className="gallery-title">Gallery</h1>
          <p className="gallery-sub">Community creations — coming soon.</p>
        </div>
        <Link to="/editor" className="cta-primary">
          Create Your Own
        </Link>
      </div>

      <div className="gallery-grid">
        {MOCK_ENTRIES.map((entry) => (
          <div key={entry.id} className="gallery-card">
            <div className="gallery-card-canvas">
              <GalleryPreview templateName={entry.template} />
            </div>
            <div className="gallery-card-meta">
              <div className="gallery-card-info">
                <span className="gallery-card-title">{entry.title}</span>
                <span className="gallery-author">@{entry.author}</span>
              </div>
              <span className="gallery-likes"><IconHeart size={13} /> {entry.likes}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
