import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import TEMPLATES from '../lib/templates/index.js';
import { registerPreview, unregisterPreview } from '../lib/sharedLoop.js';
import { IconHeart } from '../components/Icons.jsx';

const MOCK_ENTRIES = [
  { id: 1, template: 'Matrix',    preset: 'Neon Green', author: 'user_0x1A', likes: 142 },
  { id: 2, template: 'Fire',      preset: 'Hot Pink',   author: 'crt_wizard', likes: 89 },
  { id: 3, template: 'Starfield', preset: 'Ice Blue',   author: 'void_scan', likes: 231 },
  { id: 4, template: 'Marble',    preset: 'Amber',      author: 'glitch.art', likes: 67 },
  { id: 5, template: 'Plasma',    preset: 'Custom',     author: 'termcore',  likes: 188 },
  { id: 6, template: 'Circuits',  preset: 'Cyan',       author: 'vt100_fan', likes: 54 },
  { id: 7, template: 'Skull',     preset: 'Classic',    author: 'bone_haus', likes: 312 },
  { id: 8, template: 'Ocean',     preset: 'Ice Blue',   author: 'wav_form',  likes: 97  },
  { id: 9, template: 'Rain',      preset: 'Cyan',       author: 'drip_feed', likes: 74  },
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
        <Link to="/auth" className="cta-primary">
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
              <span className="gallery-author">@{entry.author}</span>
              <span className="gallery-likes"><IconHeart size={13} /> {entry.likes}</span>
            </div>
            <div className="gallery-preset-badge">{entry.preset}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
