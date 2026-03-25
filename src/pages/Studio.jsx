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
  const [panelOpen, setPanelOpen] = useState(true);

  const template = TEMPLATES[activeIdx];
  const { params, colors, setParam, setColor, setColors, resetParams, randomizeParams } = useParams(template);

  const handleSelectTemplate = useCallback((idx) => setActiveIdx(idx), []);
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
          <Link to="/" className="studio-nav-link">Home</Link>
          <Link to="/gallery" className="studio-nav-link">Community</Link>
        </div>
      </div>

      {/* Collapse toggle tab */}
      <button
        className={`panel-tab ${panelOpen ? 'panel-tab--open' : ''}`}
        onClick={() => setPanelOpen(v => !v)}
        aria-label={panelOpen ? 'Collapse controls' : 'Expand controls'}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d={panelOpen ? 'M8 2L4 6L8 10' : 'M4 2L8 6L4 10'}
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Overlay control panel */}
      <aside className={`studio-overlay-panel ${panelOpen ? 'is-open' : ''}`}>
        <div className="overlay-panel-scroll">

          <section className="panel-section">
            <h2 className="section-label">Template</h2>
            <div className="template-list">
              {TEMPLATES.map((tmpl, idx) => (
                <MiniPreview
                  key={tmpl.name}
                  template={tmpl}
                  active={idx === activeIdx}
                  onClick={() => handleSelectTemplate(idx)}
                />
              ))}
            </div>
          </section>

          <section className="panel-section">
            <h2 className="section-label">Parameters</h2>
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

          <section className="panel-section">
            <h2 className="section-label">Interaction</h2>
            <div className="interaction-controls">
              <div className="control-row">
                <span className="control-label">Cursor Effect</span>
                <div className="hover-effect-pills">
                  {HOVER_EFFECTS.map(eff => (
                    <button
                      key={eff.id}
                      className={`effect-pill ${hoverEffect === eff.id ? 'active' : ''}`}
                      onClick={() => setHoverEffect(eff.id)}
                    >
                      {eff.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="control-row">
                <span className="control-label">Glow</span>
                <button className={`toggle-btn ${glowEnabled ? 'active' : ''}`}
                  onClick={() => setGlowEnabled(v => !v)}>
                  {glowEnabled ? 'On' : 'Off'}
                </button>
              </div>
            </div>
          </section>

          <section className="panel-section">
            <h2 className="section-label">Colors</h2>
            <ColorPicker colors={colors} onColorChange={setColor} onPresetApply={handlePresetApply} />
          </section>

          <section className="panel-section">
            <h2 className="section-label">Export</h2>
            <div className="export-section">
              <p className="export-desc">Embed on any webpage:</p>
              <div className="export-code-block">
                <pre className="export-code">{generateEmbedCode(template)}</pre>
                <button className="export-copy-btn" onClick={handleCopyEmbed}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </section>

          <div className="panel-actions">
            <button className="btn-action btn-randomize" onClick={randomizeParams}><IconShuffle size={15} /> Randomize</button>
            <button className="btn-action btn-reset" onClick={resetParams}><IconReset size={15} /> Reset</button>
          </div>

        </div>
      </aside>
    </div>
  );
}
