import { useState, useRef, useCallback } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #0c1a12;
    min-height: 100vh;
    color: #e8ede9;
  }

  .app {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 60% at 50% -10%, #1a3a22 0%, transparent 60%),
      radial-gradient(ellipse 40% 40% at 80% 80%, #0d2b1a 0%, transparent 50%),
      #0c1a12;
    display: flex;
    flex-direction: column;
  }

  .header {
    padding: 2rem 2rem 1rem;
    text-align: center;
  }

  .header-eyebrow {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #5a9e6a;
    margin-bottom: 0.5rem;
  }

  .header-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2.2rem, 5vw, 3.5rem);
    font-weight: 400;
    line-height: 1.1;
    color: #d4edda;
    letter-spacing: -0.01em;
  }

  .header-title em {
    font-style: italic;
    color: #7bc98a;
  }

  .header-subtitle {
    margin-top: 0.6rem;
    font-size: 0.85rem;
    font-weight: 300;
    color: #6e8f74;
    letter-spacing: 0.02em;
  }

  .main {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    padding: 1rem 2rem 2rem;
    max-width: 1100px;
    margin: 0 auto;
    width: 100%;
  }

  @media (max-width: 700px) {
    .main { grid-template-columns: 1fr; padding: 1rem; }
  }

  /* --- Upload Panel --- */
  .panel {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .panel-label {
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #4a7a55;
    padding: 1rem 1.25rem 0.5rem;
  }

  .drop-zone {
    flex: 1;
    margin: 0 1rem 1rem;
    border: 1.5px dashed rgba(90, 158, 106, 0.3);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 260px;
    position: relative;
    overflow: hidden;
    background: rgba(0,0,0,0.15);
  }

  .drop-zone:hover, .drop-zone.dragging {
    border-color: rgba(90, 158, 106, 0.7);
    background: rgba(90, 158, 106, 0.05);
  }

  .drop-zone input[type=file] {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }

  .drop-icon {
    width: 52px;
    height: 52px;
    margin-bottom: 0.8rem;
    opacity: 0.4;
  }

  .drop-label {
    font-size: 0.85rem;
    color: #6e8f74;
    text-align: center;
    line-height: 1.5;
  }

  .drop-label strong { color: #8dba96; font-weight: 500; }

  .preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    inset: 0;
    border-radius: 10px;
  }

  .preview-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%);
    border-radius: 10px;
    display: flex;
    align-items: flex-end;
    padding: 0.75rem;
  }

  .preview-name {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.8);
    font-weight: 400;
  }

  /* Config section */
  .config-section {
    padding: 0 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .field-label {
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #4a7a55;
    margin-bottom: 0.25rem;
    display: block;
  }

  .text-input {
    width: 100%;
    background: rgba(0,0,0,0.25);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 0.55rem 0.8rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    color: #c8deca;
    outline: none;
    transition: border-color 0.2s;
  }

  .text-input:focus { border-color: rgba(90,158,106,0.5); }
  .text-input::placeholder { color: #3d5c45; }

  .row { display: flex; gap: 0.6rem; }
  .row > * { flex: 1; }

  .btn-identify {
    width: calc(100% - 2rem);
    margin: 0 1rem 1rem;
    padding: 0.75rem;
    background: linear-gradient(135deg, #2d6e3a 0%, #1e4e29 100%);
    border: 1px solid rgba(90,158,106,0.3);
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: #c8edcc;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn-identify:hover:not(:disabled) {
    background: linear-gradient(135deg, #3a8048 0%, #27613a 100%);
    border-color: rgba(90,158,106,0.5);
    transform: translateY(-1px);
  }

  .btn-identify:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(200,237,204,0.3);
    border-top-color: #c8edcc;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* --- Results Panel --- */
  .results-inner {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0 1rem 1rem;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    opacity: 0.35;
    min-height: 200px;
  }

  .empty-icon {
    width: 56px; height: 56px;
    opacity: 0.5;
  }

  .empty-text {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 1rem;
    color: #6e8f74;
    text-align: center;
  }

  /* Result card */
  .result-card {
    background: rgba(0,0,0,0.2);
    border: 1px solid rgba(90,158,106,0.25);
    border-radius: 12px;
    padding: 1.2rem;
    margin-bottom: 0.75rem;
    animation: slideIn 0.35s ease-out;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .result-rank {
    font-size: 0.62rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #4a7a55;
    margin-bottom: 0.3rem;
  }

  .result-common {
    font-family: 'Playfair Display', serif;
    font-size: 1.35rem;
    font-weight: 600;
    color: #d4edda;
    line-height: 1.2;
  }

  .result-scientific {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 0.88rem;
    color: #6aab78;
    margin-top: 0.1rem;
    margin-bottom: 0.8rem;
  }

  .confidence-bar-wrap {
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }

  .confidence-bar-bg {
    flex: 1;
    height: 4px;
    background: rgba(255,255,255,0.08);
    border-radius: 2px;
    overflow: hidden;
  }

  .confidence-bar-fill {
    height: 100%;
    border-radius: 2px;
    background: linear-gradient(90deg, #2d7a3a, #6aab78);
    transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .confidence-pct {
    font-size: 0.75rem;
    font-weight: 500;
    color: #7bc98a;
    min-width: 36px;
    text-align: right;
  }

  /* Divider */
  .secondary-label {
    font-size: 0.62rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #354e3b;
    text-align: center;
    margin: 0.4rem 0;
  }

  .result-card.secondary {
    background: rgba(0,0,0,0.1);
    border-color: rgba(90,158,106,0.1);
    padding: 0.85rem 1.2rem;
  }

  .result-card.secondary .result-common {
    font-size: 1rem;
    color: #b8d8be;
  }

  .result-card.secondary .result-scientific {
    font-size: 0.78rem;
  }

  /* Error */
  .error-box {
    background: rgba(160,40,40,0.15);
    border: 1px solid rgba(200,80,80,0.25);
    border-radius: 10px;
    padding: 1rem;
    font-size: 0.82rem;
    color: #e8a8a8;
    line-height: 1.5;
  }

  /* Meta info */
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    padding: 0.75rem;
    background: rgba(0,0,0,0.15);
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.05);
  }

  .meta-item-label {
    font-size: 0.62rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #4a7a55;
    margin-bottom: 0.15rem;
  }

  .meta-item-val {
    font-size: 0.82rem;
    color: #a8c8ae;
  }

  /* Footer bar */
  .footer-bar {
    padding: 0.8rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid rgba(255,255,255,0.05);
    font-size: 0.72rem;
    color: #2e4e35;
  }

  .status-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 0.4rem;
    animation: pulse 2s ease-in-out infinite;
  }

  .status-dot.idle { background: #2e4e35; animation: none; }
  .status-dot.active { background: #5a9e6a; }
  .status-dot.error { background: #9e5a5a; animation: none; }

  @keyframes pulse {
    0%,100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  return (
    <div className="confidence-bar-wrap">
      <div className="confidence-bar-bg">
        <div className="confidence-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="confidence-pct">{pct}%</span>
    </div>
  );
}

function ResultCard({ prediction, rank, secondary }) {
  return (
    <div className={`result-card ${secondary ? "secondary" : ""}`}>
      <div className="result-rank">
        {rank === 1 ? "Top identification" : `Alternative ${rank - 1}`}
      </div>
      <div className="result-common">{prediction.common_name || prediction.label || "Unknown species"}</div>
      {prediction.scientific_name && (
        <div className="result-scientific">{prediction.scientific_name}</div>
      )}
      <ConfidenceBar value={prediction.score ?? prediction.confidence ?? 0} />
    </div>
  );
}

export default function App() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [vmUrl, setVmUrl] = useState("http://YOUR_VM_IP:5000");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setResults(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const onInputChange = (e) => handleFile(e.target.files[0]);

  const identify = async () => {
    if (!imageFile) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      if (country) formData.append("country", country);
      if (state) formData.append("state", state);

      const res = await fetch(`${vmUrl}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Server returned ${res.status}: ${txt}`);
      }

      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Parse predictions from various SpeciesNet response shapes
  const parsePredictions = (data) => {
    if (!data) return [];
    // SpeciesNet returns { predictions: [{ label, score, ... }] }
    if (Array.isArray(data.predictions)) return data.predictions;
    if (Array.isArray(data.results)) return data.results;
    if (data.prediction) return [data.prediction];
    if (data.label) return [data];
    return [];
  };

  const predictions = parsePredictions(results);
  const [top, ...rest] = predictions;

  const statusDot = loading ? "active" : error ? "error" : "idle";
  const statusText = loading
    ? "Running SpeciesNet inference…"
    : error
    ? "Error during identification"
    : results
    ? `Identified ${predictions.length} prediction${predictions.length !== 1 ? "s" : ""}`
    : "Awaiting image";

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        <header className="header">
          <div className="header-eyebrow">Powered by SpeciesNet · Google Cloud VM</div>
          <h1 className="header-title">
            <em>Bird</em> Identification
          </h1>
          <p className="header-subtitle">
            Upload a photograph · SpeciesNet classifies the species
          </p>
        </header>

        <main className="main">
          {/* Upload + Config Panel */}
          <div className="panel">
            <div className="panel-label">Image</div>

            <div
              className={`drop-zone ${dragging ? "dragging" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onInputChange}
                onClick={(e) => e.stopPropagation()}
              />
              {image ? (
                <>
                  <img src={image} alt="preview" className="preview-img" />
                  <div className="preview-overlay">
                    <span className="preview-name">{imageFile?.name}</span>
                  </div>
                </>
              ) : (
                <>
                  <svg className="drop-icon" viewBox="0 0 52 52" fill="none">
                    <circle cx="26" cy="26" r="25" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3"/>
                    <path d="M26 18v12M26 18l-4 4M26 18l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M16 36h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="32" cy="22" r="4" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                  </svg>
                  <div className="drop-label">
                    <strong>Drop a bird photo here</strong>
                    <br />or click to browse
                    <br /><span style={{fontSize:'0.75rem',color:'#3d5c45'}}>JPG, PNG, WEBP</span>
                  </div>
                </>
              )}
            </div>

            <div className="config-section">
              <div>
                <span className="field-label">VM Backend URL</span>
                <input
                  className="text-input"
                  value={vmUrl}
                  onChange={(e) => setVmUrl(e.target.value)}
                  placeholder="http://YOUR_VM_IP:5000"
                />
              </div>
              <div className="row">
                <div>
                  <span className="field-label">Country (ISO 3166-1 alpha-3)</span>
                  <input
                    className="text-input"
                    value={country}
                    onChange={(e) => setCountry(e.target.value.toUpperCase())}
                    placeholder="e.g. USA"
                    maxLength={3}
                  />
                </div>
                <div>
                  <span className="field-label">State (optional)</span>
                  <input
                    className="text-input"
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    placeholder="e.g. CA"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            <button
              className="btn-identify"
              onClick={identify}
              disabled={!imageFile || loading}
            >
              {loading ? (
                <><div className="spinner" /> Identifying…</>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Identify Species
                </>
              )}
            </button>
          </div>

          {/* Results Panel */}
          <div className="panel">
            <div className="panel-label">Results</div>
            <div className="results-inner">
              {!results && !error && !loading && (
                <div className="empty-state">
                  <svg className="empty-icon" viewBox="0 0 56 56" fill="none">
                    <path d="M28 10C18 10 8 18 8 28s10 18 20 18 20-8 20-18S38 10 28 10z" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M20 30c2-4 8-4 10 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <circle cx="22" cy="24" r="2" fill="currentColor"/>
                    <circle cx="34" cy="24" r="2" fill="currentColor"/>
                    <path d="M28 10 Q22 4 14 6" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
                    <path d="M28 10 Q34 4 42 6" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
                  </svg>
                  <span className="empty-text">Upload an image to<br/>begin identification</span>
                </div>
              )}

              {loading && (
                <div className="empty-state" style={{ opacity: 1 }}>
                  <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
                  <span className="empty-text" style={{ opacity: 0.6 }}>
                    Running SpeciesNet…
                  </span>
                </div>
              )}

              {error && (
                <div className="error-box">
                  <strong style={{ display: 'block', marginBottom: '0.3rem' }}>Identification failed</strong>
                  {error}
                  <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: '#c08080' }}>
                    Make sure your VM is running the backend server and the URL is correct.
                    Check that the firewall allows TCP on the chosen port.
                  </div>
                </div>
              )}

              {results && !error && (
                <>
                  {results.prediction_source && (
                    <div className="meta-grid">
                      <div>
                        <div className="meta-item-label">Model</div>
                        <div className="meta-item-val">SpeciesNet</div>
                      </div>
                      <div>
                        <div className="meta-item-label">Source</div>
                        <div className="meta-item-val">{results.prediction_source}</div>
                      </div>
                      {country && (
                        <div>
                          <div className="meta-item-label">Geography</div>
                          <div className="meta-item-val">{[country, state].filter(Boolean).join(" / ")}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {predictions.length === 0 && (
                    <div className="error-box" style={{ background: 'rgba(200,160,40,0.1)', borderColor: 'rgba(200,160,40,0.25)', color: '#e8d080' }}>
                      No species identified. The model may have returned a blank or non-animal prediction.
                    </div>
                  )}

                  {top && <ResultCard prediction={top} rank={1} />}

                  {rest.length > 0 && (
                    <>
                      <div className="secondary-label">Alternatives</div>
                      {rest.slice(0, 3).map((p, i) => (
                        <ResultCard key={i} prediction={p} rank={i + 2} secondary />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </main>

        <footer className="footer-bar">
          <span>
            <span className={`status-dot ${statusDot}`} />
            {statusText}
          </span>
          <span>BirdID · SpeciesNet · Google Cloud</span>
        </footer>
      </div>
    </>
  );
}
