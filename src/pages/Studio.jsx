import { useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { IconShuffle, IconReset } from '../components/Icons.jsx';
import AsciiCanvas from '../components/AsciiCanvas.jsx';
import ParamSlider from '../components/ParamSlider.jsx';
import ColorPicker from '../components/ColorPicker.jsx';
import StatusBar from '../components/StatusBar.jsx';
import MiniPreview from '../components/MiniPreview.jsx';
import useParams from '../hooks/useParams.js';
import TEMPLATES from '../lib/templates/index.js';

const HOVER_EFFECTS = [
  { id: 'ripple', label: 'Ripple' },
  { id: 'repel', label: 'Repel' },
  { id: 'spotlight', label: 'Spotlight' },
  { id: 'glitch', label: 'Glitch' },
  { id: 'none', label: 'Off' },
];

function generateEmbedCode(template) {
  const name = template.name.toLowerCase().replace(/\s+/g, '-');
  return `<canvas id="glyphdom" width="800" height="600"></canvas>
<script src="https://glyphdom.vercel.app/embed.js"
  data-template="${name}"
  data-width="800"
  data-height="600">
</script>`;
}

export default function Studio() {
  const [searchParams] = useSearchParams();
  const initialIdx = Math.max(0, Math.min(
    TEMPLATES.length - 1,
    parseInt(searchParams.get('t') || '0', 10) || 0
  ));

  const [activeIdx, setActiveIdx] = useState(initialIdx);
  const [stats, setStats] = useState({ fps: 0, chars: 0, cols: 0, rows: 0 });
  const [copied, setCopied] = useState(false);
  const [hoverEffect, setHoverEffect] = useState('ripple');
  const [glowEnabled, setGlowEnabled] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(false);

  const template = TEMPLATES[activeIdx];
  const { params, colors, setParam, setColor, setColors, resetParams, randomizeParams } = useParams(template);

  const handleSelectTemplate = useCallback((idx) => {
    setActiveIdx(idx);
    setControlsOpen(true); // auto-open controls when selecting a template
  }, []);
  const handlePresetApply = useCallback((preset) => setColors(preset), [setColors]);
  const handleStats = useCallback((s) => setStats(s), []);
  const handleCopyEmbed = useCallback(() => {
    navigator.clipboard.writeText(generateEmbedCode(template));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [template]);

  return (
    <div className="studio-fullscreen">
      {/* Full-screen canvas */}
      <AsciiCanvas
        template={template}
        params={params}
        colors={colors}
        onStats={handleStats}
        hoverEffect={hoverEffect}
        glowEnabled={glowEnabled}
      />
      <div className="canvas-scanlines" aria-hidden="true" />
      <div className="canvas-vignette"  aria-hidden="true" />

      {/* Top nav overlay */}
      <div className="studio-nav studio-nav--overlay">
        <Link to="/" className="studio-logo">GLYPHDOM</Link>
        <div className="studio-nav-links">
          <StatusBar stats={stats} inline />
          <span className="studio-nav-link studio-nav-link--active">Studio</span>
          <Link to="/gallery" className="studio-nav-link">Gallery</Link>
          <Link to="/auth" className="studio-nav-link">Create</Link>
        </div>
      </div>

      {/* Controls panel — slides out from behind template strip */}
      <aside className={`studio-controls-panel ${controlsOpen ? 'is-open' : ''}`}>
        <div className="controls-panel-inner">

          <div className="controls-panel-header">
            <span className="controls-panel-title">{template.name}</span>
            <div className="controls-panel-actions">
              <button className="btn-icon" onClick={randomizeParams} title="Randomize"><IconShuffle size={14} /></button>
              <button className="btn-icon" onClick={resetParams} title="Reset"><IconReset size={14} /></button>
            </div>
          </div>

          <div className="controls-scroll">
            {/* Parameters */}
            {Object.keys(template.params).length > 0 && (
              <section className="ctrl-section">
                <h3 className="ctrl-label">Parameters</h3>
                <div className="params-list">
                  {Object.entries(template.params).map(([key, def]) => (
                    <ParamSlider
                      key={key}
                      label={def.label}
                      min={def.min}
                      max={def.max}
                      step={def.step}
                      value={params[key] ?? def.default}
                      defaultValue={def.default}
                      onChange={(v) => setParam(key, v)}
                      onReset={() => setParam(key, def.default)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Interaction */}
            <section className="ctrl-section">
              <h3 className="ctrl-label">Interaction</h3>
              <div className="ctrl-row">
                <span className="ctrl-row-label">Cursor Effect</span>
                <div className="hover-effect-pills">
                  {HOVER_EFFECTS.map(eff => (
                    <button key={eff.id}
                      className={`effect-pill ${hoverEffect === eff.id ? 'active' : ''}`}
                      onClick={() => setHoverEffect(eff.id)}>
                      {eff.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ctrl-row">
                <span className="ctrl-row-label">Glow</span>
                <button className={`toggle-btn ${glowEnabled ? 'active' : ''}`}
                  onClick={() => setGlowEnabled(v => !v)}>
                  {glowEnabled ? 'On' : 'Off'}
                </button>
              </div>
            </section>

            {/* Colors */}
            <section className="ctrl-section">
              <h3 className="ctrl-label">Colors</h3>
              <ColorPicker colors={colors} onColorChange={setColor} onPresetApply={handlePresetApply} />
            </section>

            {/* Export */}
            <section className="ctrl-section">
              <h3 className="ctrl-label">Export</h3>
              <div className="export-code-block">
                <pre className="export-code">{generateEmbedCode(template)}</pre>
                <button className="export-copy-btn" onClick={handleCopyEmbed}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </aside>

      {/* Template strip — always visible on far right */}
      <aside className="studio-template-strip">
        {/* Controls toggle — sits on left edge of template strip */}
        <button
          className={`controls-toggle ${controlsOpen ? 'is-open' : ''}`}
          onClick={() => setControlsOpen(v => !v)}
          title={controlsOpen ? 'Hide controls' : 'Show controls'}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d={controlsOpen ? 'M7 1L3 5L7 9' : 'M3 1L7 5L3 9'}
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="template-strip-scroll">
          {TEMPLATES.map((tmpl, idx) => (
            <MiniPreview
              key={tmpl.name}
              template={tmpl}
              active={idx === activeIdx}
              onClick={() => handleSelectTemplate(idx)}
            />
          ))}
        </div>
      </aside>
    </div>
  );
}
