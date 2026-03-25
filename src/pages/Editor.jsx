import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { mediaToAsciiGrid, renderAsciiGrid } from '../lib/imageToAscii.js';

const CHAR_W = 8;
const CHAR_H = 12;

export default function Editor() {
  const [media, setMedia] = useState(null); // { type: 'image'|'video', src, element }
  const [isDragging, setIsDragging] = useState(false);
  const [settings, setSettings] = useState({
    contrast: 1.2,
    brightness: 0,
    invert: false,
    colorMode: true,
    tintColor: null,
    charSize: 1, // 0=tiny, 1=normal, 2=large
  });
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const dropRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');

    if (isVideo) {
      const video = document.createElement('video');
      video.src = url;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.addEventListener('loadeddata', () => {
        video.play();
        videoRef.current = video;
        setMedia({ type: 'video', src: url, element: video });
      });
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setMedia({ type: 'image', src: url, element: img });
      };
      img.src = url;
    }
  }, []);

  // Drag & drop handlers
  const onDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  // File input handler
  const onFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    handleFile(file);
  }, [handleFile]);

  // Render loop
  useEffect(() => {
    if (!media?.element) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const sizes = [6, 8, 10];
    const cw = sizes[settings.charSize] || CHAR_W;
    const ch = Math.round(cw * 1.5);

    function render() {
      const parent = canvas.parentElement;
      if (!parent) return;

      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const cols = Math.floor(w / cw);
      const rows = Math.floor(h / ch);

      const grid = mediaToAsciiGrid(media.element, cols, rows, {
        contrast: settings.contrast,
        brightness: settings.brightness,
        invert: settings.invert,
        colorMode: settings.colorMode,
      });

      renderAsciiGrid(ctx, grid, w, h, cw, ch, {
        colorMode: settings.colorMode,
        bgColor: '#0A0A0B',
        tintColor: settings.tintColor,
      });

      if (media.type === 'video') {
        rafRef.current = requestAnimationFrame(render);
      }
    }

    render();
    // For video, keep running
    if (media.type === 'video') {
      rafRef.current = requestAnimationFrame(render);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [media, settings]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (media?.src) URL.revokeObjectURL(media.src);
      if (videoRef.current) { videoRef.current.pause(); videoRef.current = null; }
    };
  }, [media]);

  const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  return (
    <div className="editor-layout">
      <div className="editor-canvas-area">
        <div className="studio-nav">
          <Link to="/" className="studio-logo">ASCIIFORGE</Link>
          <div className="studio-nav-links">
            <Link to="/studio" className="studio-nav-link">Studio</Link>
            <Link to="/gallery" className="studio-nav-link">Community</Link>
          </div>
        </div>

        <div className="editor-canvas-wrap">
          {!media ? (
            <div
              ref={dropRef}
              className={`editor-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div className="dropzone-content">
                <div className="dropzone-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <h2 className="dropzone-title">Drop image or video</h2>
                <p className="dropzone-desc">Drag media here or click to browse. Supports JPG, PNG, GIF, MP4, WebM.</p>
                <label className="dropzone-browse-btn">
                  Browse Files
                  <input type="file" accept="image/*,video/*" onChange={onFileSelect} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              style={{ display: 'block', width: '100%', height: '100%' }}
            />
          )}
        </div>
      </div>

      <aside className="control-panel" role="complementary">
        <section className="panel-section">
          <h2 className="section-label">Source</h2>
          {media ? (
            <div className="editor-source-info">
              <div className="source-preview">
                {media.type === 'image' ? (
                  <img src={media.src} alt="source" className="source-thumb" />
                ) : (
                  <video src={media.src} muted loop autoPlay playsInline className="source-thumb" />
                )}
              </div>
              <label className="dropzone-browse-btn" style={{ width: '100%', textAlign: 'center' }}>
                Replace
                <input type="file" accept="image/*,video/*" onChange={onFileSelect} style={{ display: 'none' }} />
              </label>
            </div>
          ) : (
            <p className="export-desc">Upload an image or video to convert to ASCII art.</p>
          )}
        </section>

        {media && (
          <>
            <section className="panel-section">
              <h2 className="section-label">Adjustments</h2>
              <div className="params-list">
                <div>
                  <div className="param-slider-header">
                    <span className="param-label">Contrast</span>
                    <span className="param-value">{settings.contrast.toFixed(1)}</span>
                  </div>
                  <div className="slider-track-wrap">
                    <input
                      type="range" className="slider-input"
                      min="0.5" max="3" step="0.1"
                      value={settings.contrast}
                      onChange={(e) => updateSetting('contrast', parseFloat(e.target.value))}
                      style={{ '--pct': `${((settings.contrast - 0.5) / 2.5) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="param-slider-header">
                    <span className="param-label">Brightness</span>
                    <span className="param-value">{settings.brightness.toFixed(2)}</span>
                  </div>
                  <div className="slider-track-wrap">
                    <input
                      type="range" className="slider-input"
                      min="-0.5" max="0.5" step="0.02"
                      value={settings.brightness}
                      onChange={(e) => updateSetting('brightness', parseFloat(e.target.value))}
                      style={{ '--pct': `${((settings.brightness + 0.5) / 1) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="panel-section">
              <h2 className="section-label">Display</h2>
              <div className="interaction-controls">
                <div className="control-row">
                  <span className="control-label">Color</span>
                  <button
                    className={`toggle-btn ${settings.colorMode ? 'active' : ''}`}
                    onClick={() => updateSetting('colorMode', !settings.colorMode)}
                  >
                    {settings.colorMode ? 'On' : 'Off'}
                  </button>
                </div>
                <div className="control-row">
                  <span className="control-label">Invert</span>
                  <button
                    className={`toggle-btn ${settings.invert ? 'active' : ''}`}
                    onClick={() => updateSetting('invert', !settings.invert)}
                  >
                    {settings.invert ? 'On' : 'Off'}
                  </button>
                </div>
                <div className="control-row">
                  <span className="control-label">Density</span>
                  <div className="hover-effect-pills">
                    {['Fine', 'Normal', 'Coarse'].map((label, i) => (
                      <button
                        key={label}
                        className={`effect-pill ${settings.charSize === i ? 'active' : ''}`}
                        onClick={() => updateSetting('charSize', i)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="panel-section">
              <h2 className="section-label">Tint</h2>
              <div className="interaction-controls">
                <div className="control-row">
                  <span className="control-label">Mono Tint</span>
                  <button
                    className={`toggle-btn ${settings.tintColor ? 'active' : ''}`}
                    onClick={() => updateSetting('tintColor', settings.tintColor ? null : '#00FF41')}
                  >
                    {settings.tintColor ? 'On' : 'Off'}
                  </button>
                </div>
                {settings.tintColor && (
                  <div className="control-row">
                    <span className="control-label">Color</span>
                    <div className="color-row-controls">
                      <input
                        type="color"
                        value={settings.tintColor}
                        onChange={(e) => updateSetting('tintColor', e.target.value)}
                        className="color-swatch-btn"
                        style={{ background: settings.tintColor }}
                      />
                      <input
                        type="text"
                        value={settings.tintColor}
                        onChange={(e) => updateSetting('tintColor', e.target.value)}
                        className="color-hex-input"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </aside>
    </div>
  );
}
