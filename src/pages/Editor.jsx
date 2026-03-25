import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  mediaToAsciiGrid, renderAsciiGrid,
  calcAspectGrid, getSourceDimensions,
} from '../lib/imageToAscii.js';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export default function Editor() {
  const [media, setMedia] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringMedia, setIsHoveringMedia] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [settings, setSettings] = useState({
    contrast: 1.2,
    brightness: 0,
    invert: false,
    colorMode: true,
    tintColor: null,
    charSize: 1,
    glow: 0.3,
    // Animation effects
    wave: 0,
    scan: 0,
    shimmer: 0,
    pulse: 0,
    jitter: 0,
  });

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const timeRef = useRef(0);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Check if any animation effect is active
  const hasAnimation = settings.wave > 0 || settings.scan > 0 ||
    settings.shimmer > 0 || settings.pulse > 0 || settings.jitter > 0 ||
    settings.glow > 0;

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
        setMedia({ type: 'video', src: url, element: video, name: file.name });
      });
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setMedia({ type: 'image', src: url, element: img, name: file.name });
      };
      img.src = url;
    }
  }, []);

  const clearMedia = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (media?.src) URL.revokeObjectURL(media.src);
    if (videoRef.current) { videoRef.current.pause(); videoRef.current = null; }
    setMedia(null);
    timeRef.current = 0;
  }, [media]);

  const onDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);
  const onFileSelect = useCallback((e) => handleFile(e.target.files[0]), [handleFile]);

  // Main render loop
  useEffect(() => {
    if (!media?.element) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let lastTs = 0;
    const needsLoop = media.type === 'video' || hasAnimation;

    function render(ts) {
      const dt = lastTs ? (ts - lastTs) / 1000 : 0.016;
      lastTs = ts;
      timeRef.current += dt;

      const s = settingsRef.current;
      const sizes = [4, 5, 7, 10];
      const cw = sizes[s.charSize] || 7;
      const ch = Math.round(cw * 1.4);

      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const maxCols = Math.floor(w / cw);
      const maxRows = Math.floor(h / ch);
      const src = getSourceDimensions(media.element);
      const { cols, rows, offsetX, offsetY } = calcAspectGrid(src.w, src.h, maxCols, maxRows, cw, ch);

      const grid = mediaToAsciiGrid(media.element, cols, rows, {
        contrast: s.contrast,
        brightness: s.brightness,
        invert: s.invert,
      });

      renderAsciiGrid(ctx, grid, w, h, cw, ch, offsetX, offsetY, {
        colorMode: s.colorMode,
        bgColor: '#0A0A0B',
        tintColor: s.tintColor,
        time: timeRef.current,
        glow: s.glow,
        effects: { wave: s.wave, scan: s.scan, shimmer: s.shimmer, pulse: s.pulse, jitter: s.jitter },
      });

      if (needsLoop) {
        rafRef.current = requestAnimationFrame(render);
      }
    }

    rafRef.current = requestAnimationFrame(render);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [media, hasAnimation]);

  // Re-render static images when settings change (no animation)
  useEffect(() => {
    if (!media?.element || media.type === 'video' || hasAnimation) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = settings;
    const sizes = [6, 8, 10];
    const cw = sizes[s.charSize] || 8;
    const ch = Math.round(cw * 1.5);
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.offsetWidth;
    const h = parent.offsetHeight;
    canvas.width = w; canvas.height = h;
    const maxCols = Math.floor(w / cw);
    const maxRows = Math.floor(h / ch);
    const src = getSourceDimensions(media.element);
    const { cols, rows, offsetX, offsetY } = calcAspectGrid(src.w, src.h, maxCols, maxRows, cw, ch);
    const grid = mediaToAsciiGrid(media.element, cols, rows, { contrast: s.contrast, brightness: s.brightness, invert: s.invert });
    renderAsciiGrid(ctx, grid, w, h, cw, ch, offsetX, offsetY, {
      colorMode: s.colorMode, bgColor: '#0A0A0B', tintColor: s.tintColor,
      time: 0, glow: s.glow, effects: {},
    });
  }, [media, settings, hasAnimation]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (media?.src) URL.revokeObjectURL(media.src);
      if (videoRef.current) { videoRef.current.pause(); videoRef.current = null; }
    };
  }, [media]);

  // ── GIF Export ──
  const exportGif = useCallback(async () => {
    if (!media?.element) return;
    setRecording(true);
    setRecordProgress(0);

    const s = settingsRef.current;
    const gifW = 640;
    const gifH = 480;
    const sizes = [6, 8, 10];
    const cw = sizes[s.charSize] || 8;
    const ch = Math.round(cw * 1.5);
    const maxCols = Math.floor(gifW / cw);
    const maxRows = Math.floor(gifH / ch);
    const src = getSourceDimensions(media.element);
    const { cols, rows, offsetX, offsetY } = calcAspectGrid(src.w, src.h, maxCols, maxRows, cw, ch);

    const offCanvas = document.createElement('canvas');
    offCanvas.width = gifW;
    offCanvas.height = gifH;
    const offCtx = offCanvas.getContext('2d');

    const totalFrames = 40;
    const delay = 80; // ms per frame
    const gif = GIFEncoder();

    for (let i = 0; i < totalFrames; i++) {
      const t = i * (delay / 1000);
      const grid = mediaToAsciiGrid(media.element, cols, rows, {
        contrast: s.contrast, brightness: s.brightness, invert: s.invert,
      });
      renderAsciiGrid(offCtx, grid, gifW, gifH, cw, ch, offsetX, offsetY, {
        colorMode: s.colorMode, bgColor: '#0A0A0B', tintColor: s.tintColor,
        time: t, glow: s.glow,
        effects: { wave: s.wave, scan: s.scan, shimmer: s.shimmer, pulse: s.pulse, jitter: s.jitter },
      });

      const imageData = offCtx.getImageData(0, 0, gifW, gifH);
      const palette = quantize(imageData.data, 256);
      const index = applyPalette(imageData.data, palette);
      gif.writeFrame(index, gifW, gifH, { palette, delay });
      setRecordProgress(Math.round(((i + 1) / totalFrames) * 100));

      // Yield to keep UI responsive
      await new Promise(r => setTimeout(r, 0));
    }

    gif.finish();
    const blob = new Blob([gif.bytes()], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'glyphdom-export.gif';
    a.click();
    URL.revokeObjectURL(url);
    setRecording(false);
  }, [media]);

  // ── Embed Code ──
  const generateEmbedCode = useCallback(() => {
    if (!media) return '';
    const s = settings;
    return `<!-- Glyphdom Embed -->
<canvas id="glyphdom-editor" width="800" height="600"></canvas>
<script>
  // Visit glyphdom.vercel.app/editor
  // to create your own ASCII art from images
</script>`;
  }, [media, settings]);

  const copyEmbedCode = useCallback(() => {
    navigator.clipboard.writeText(generateEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generateEmbedCode]);

  const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  // Slider helper
  const Slider = ({ label, value, min, max, step, onChange, format }) => (
    <div>
      <div className="param-slider-header">
        <span className="param-label">{label}</span>
        <span className="param-value">{format ? format(value) : value.toFixed(2)}</span>
      </div>
      <div className="slider-track-wrap">
        <input type="range" className="slider-input"
          min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ '--pct': `${((value - min) / (max - min)) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="editor-layout">
      <div className="editor-canvas-area">
        <div className="studio-nav">
          <Link to="/" className="studio-logo">GLYPHDOM</Link>
          <div className="studio-nav-links">
            <Link to="/studio" className="studio-nav-link">Studio</Link>
            <Link to="/gallery" className="studio-nav-link">Community</Link>
          </div>
        </div>

        <div className="editor-canvas-wrap">
          {!media ? (
            <div
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
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
          )}
        </div>
      </div>

      <aside className="control-panel" role="complementary">
        <section className="panel-section">
          <h2 className="section-label">Source</h2>
          {media ? (
            <div className="editor-source-info">
              <div
                className="source-preview"
                onMouseEnter={() => setIsHoveringMedia(true)}
                onMouseLeave={() => setIsHoveringMedia(false)}
                style={{ position: 'relative', cursor: 'pointer' }}
                onClick={clearMedia}
              >
                {media.type === 'image' ? (
                  <img src={media.src} alt="source" className="source-thumb" />
                ) : (
                  <video src={media.src} muted loop autoPlay playsInline className="source-thumb" />
                )}
                <div className={`source-delete-overlay ${isHoveringMedia ? 'visible' : ''}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  <span>Remove</span>
                </div>
              </div>
              <div className="source-meta">
                <span className="source-name">{media.name}</span>
                <span className="source-type">{media.type === 'video' ? 'Video' : 'Image'}</span>
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
                <Slider label="Contrast" value={settings.contrast} min={0.5} max={3} step={0.1}
                  onChange={(v) => updateSetting('contrast', v)} format={(v) => v.toFixed(1)} />
                <Slider label="Brightness" value={settings.brightness} min={-0.5} max={0.5} step={0.02}
                  onChange={(v) => updateSetting('brightness', v)} />
              </div>
            </section>

            <section className="panel-section">
              <h2 className="section-label">Animation</h2>
              <div className="params-list">
                <Slider label="Wave" value={settings.wave} min={0} max={1} step={0.05}
                  onChange={(v) => updateSetting('wave', v)} />
                <Slider label="Scan Line" value={settings.scan} min={0} max={1} step={0.05}
                  onChange={(v) => updateSetting('scan', v)} />
                <Slider label="Shimmer" value={settings.shimmer} min={0} max={1} step={0.05}
                  onChange={(v) => updateSetting('shimmer', v)} />
                <Slider label="Pulse" value={settings.pulse} min={0} max={1} step={0.05}
                  onChange={(v) => updateSetting('pulse', v)} />
                <Slider label="Jitter" value={settings.jitter} min={0} max={1} step={0.05}
                  onChange={(v) => updateSetting('jitter', v)} />
              </div>
            </section>

            <section className="panel-section">
              <h2 className="section-label">Display</h2>
              <div className="interaction-controls">
                <div className="control-row">
                  <span className="control-label">Color</span>
                  <button className={`toggle-btn ${settings.colorMode ? 'active' : ''}`}
                    onClick={() => updateSetting('colorMode', !settings.colorMode)}>
                    {settings.colorMode ? 'On' : 'Off'}
                  </button>
                </div>
                <div className="control-row">
                  <span className="control-label">Invert</span>
                  <button className={`toggle-btn ${settings.invert ? 'active' : ''}`}
                    onClick={() => updateSetting('invert', !settings.invert)}>
                    {settings.invert ? 'On' : 'Off'}
                  </button>
                </div>
                <div className="control-row">
                  <span className="control-label">Density</span>
                  <div className="hover-effect-pills">
                    {['Ultra', 'Fine', 'Normal', 'Coarse'].map((label, i) => (
                      <button key={label}
                        className={`effect-pill ${settings.charSize === i ? 'active' : ''}`}
                        onClick={() => updateSetting('charSize', i)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <Slider label="Glow" value={settings.glow} min={0} max={1} step={0.05}
                  onChange={(v) => updateSetting('glow', v)} />
                <div className="control-row">
                  <span className="control-label">Mono Tint</span>
                  <button className={`toggle-btn ${settings.tintColor ? 'active' : ''}`}
                    onClick={() => updateSetting('tintColor', settings.tintColor ? null : '#00FF41')}>
                    {settings.tintColor ? 'On' : 'Off'}
                  </button>
                </div>
                {settings.tintColor && (
                  <div className="control-row">
                    <span className="control-label">Color</span>
                    <div className="color-row-controls">
                      <input type="color" value={settings.tintColor}
                        onChange={(e) => updateSetting('tintColor', e.target.value)}
                        className="color-swatch-btn" style={{ background: settings.tintColor }} />
                      <input type="text" value={settings.tintColor}
                        onChange={(e) => updateSetting('tintColor', e.target.value)}
                        className="color-hex-input" />
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="panel-section">
              <h2 className="section-label">Export</h2>
              <div className="export-actions">
                <button className="export-btn" onClick={exportGif} disabled={recording}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {recording ? `Recording ${recordProgress}%` : 'Download GIF'}
                </button>
                <button className="export-btn export-btn-secondary" onClick={copyEmbedCode}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  {copied ? 'Copied' : 'Copy Code'}
                </button>
              </div>
              {recording && (
                <div className="export-progress">
                  <div className="export-progress-bar" style={{ width: `${recordProgress}%` }} />
                </div>
              )}
            </section>
          </>
        )}
      </aside>
    </div>
  );
}
