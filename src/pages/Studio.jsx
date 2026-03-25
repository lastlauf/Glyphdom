import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  const [activeIdx, setActiveIdx] = useState(0);
  const [stats, setStats] = useState({ fps: 0, chars: 0, cols: 0, rows: 0 });
  const [copied, setCopied] = useState(false);
  const [hoverEffect, setHoverEffect] = useState('ripple');
  const [glowEnabled, setGlowEnabled] = useState(true);
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
    <div className="studio-layout">
      {/* Canvas + top bar */}
      <div className="canvas-area">
        <div className="studio-nav">
          <Link to="/" className="studio-logo">GLYPHDOM</Link>
          <div className="studio-nav-links">
            <Link to="/" className="studio-nav-link">Gallery</Link>
            <Link to="/gallery" className="studio-nav-link">Community</Link>
          </div>
        </div>
        <div className="canvas-wrap">
          <AsciiCanvas
            template={template}
            params={params}
            colors={colors}
            onStats={handleStats}
            hoverEffect={hoverEffect}
            glowEnabled={glowEnabled}
          />
          <div className="canvas-scanlines" aria-hidden="true" />
          <div className="canvas-vignette" aria-hidden="true" />
        </div>
        <StatusBar stats={stats} />
      </div>

      {/* Right control panel */}
      <aside className="control-panel" role="complementary">
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
              <button
                className={`toggle-btn ${glowEnabled ? 'active' : ''}`}
                onClick={() => setGlowEnabled(v => !v)}
              >
                {glowEnabled ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </section>

        <section className="panel-section">
          <h2 className="section-label">Colors</h2>
          <ColorPicker
            colors={colors}
            onColorChange={setColor}
            onPresetApply={handlePresetApply}
          />
        </section>

        <section className="panel-section">
          <h2 className="section-label">Export</h2>
          <div className="export-section">
            <p className="export-desc">Embed this animation on any webpage:</p>
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
      </aside>
    </div>
  );
}
