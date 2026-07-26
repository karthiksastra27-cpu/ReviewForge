import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
];

const TABS = ["Overview", "Bugs", "Security", "Performance", "Optimisation", "Refactored Code"];

function riskLabel(count) {
  if (count === 0) return "Low";
  if (count <= 2) return "Medium";
  return "High";
}

function Accordion({ title, children, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="accordion-item">
      <button className="accordion-head" onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <span className={"accordion-caret" + (open ? " open" : "")}>▼</span>
      </button>
      {open && <div className="accordion-body">{children}</div>}
    </div>
  );
}

function EmptyList({ text }) {
  return <div className="empty-list">{text}</div>;
}

export default function CodeReview() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const location = useLocation();

  useEffect(() => {
    if (location.state?.code) setCode(location.state.code);
    if (location.state?.language) setLanguage(location.state.language);
  }, [location.state]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState(null);
  const [reviewTime, setReviewTime] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const fileInputRef = useRef(null);

  const lines = code.split("\n");
  const lineCount = Math.max(lines.length, 20);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);
  const charCount = code.length;

  async function handleReview() {
    setError("");
    setReview(null);
    setActiveTab("Overview");

    if (!code.trim()) {
      setError("Paste some code before requesting a review.");
      return;
    }

    setLoading(true);
    const startedAt = performance.now();
    try {
      const res = await fetch("http://localhost:4000/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setReview(data.review);
        setReviewTime(((performance.now() - startedAt) / 1000).toFixed(1));
      }
    } catch {
      setError("Could not reach the server. Is it running on port 4000?");
    } finally {
      setLoading(false);
    }
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setCode(evt.target.result);
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handlePasteClick() {
    try {
      const text = await navigator.clipboard.readText();
      setCode((prev) => prev + text);
    } catch {
      setError("Clipboard access denied — paste directly into the editor instead.");
    }
  }

  function handleClear() {
    setCode("");
    setReview(null);
    setError("");
  }

  async function handleCopy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }

  function handleDownloadRefactored() {
    if (!review?.refactoredCode) return;
    const ext = LANGUAGES.find((l) => l.value === language)?.value === "python" ? "py" : language;
    const blob = new Blob([review.refactoredCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `refactored.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReplaceOriginal() {
    if (!review?.refactoredCode) return;
    setCode(review.refactoredCode);
  }

  return (
    <div className="page-content review-page">
      <div className="float-decor" aria-hidden="true">
        <span className="float-symbol dsym-1">&lt; &gt;</span>
        <span className="float-symbol dsym-2">{"{ }"}</span>
        <span className="float-symbol dsym-3">( )</span>
        <span className="float-symbol dsym-4">λ</span>
        <span className="float-symbol dsym-5">&lt;/&gt;</span>
      </div>

      <div className="review-grid">
        {/* LEFT: Editor */}
        <div className="editor-card glass">
          <div className="editor-card-header">
            <h2>Code Editor</h2>
            <div className="editor-toolbar">
              <button className="tool-btn" onClick={handleUploadClick}>Upload File</button>
              <button className="tool-btn" onClick={handlePasteClick}>Paste Code</button>
              <button className="tool-btn" onClick={handleClear}>Clear</button>
              <button className="tool-btn" onClick={() => handleCopy(code)}>Copy</button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".py,.java,.c,.cpp,.js,.ts,.txt"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="editor-subbar">
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          {code ? (
            <div className="mono-editor-body">
              <div className="mono-gutter">
                {lineNumbers.map((n) => <div key={n}>{n}</div>)}
              </div>
              <textarea
                className="mono-editor-textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// paste code, or upload a file"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="mono-editor-body editor-empty-state">
              <textarea
                className="mono-editor-textarea empty-textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder=""
                spellCheck={false}
              />
              <div className="editor-empty-overlay">
                <div className="empty-icon">⇪</div>
                <div className="empty-title">Paste your code or upload a file</div>
                <div className="empty-sub">to receive an AI-powered review</div>
                <div className="empty-langs">
                  {LANGUAGES.map((l) => <span key={l.value} className="empty-lang-chip">{l.label}</span>)}
                </div>
              </div>
            </div>
          )}

          <div className="editor-stats-bar">
            <span>Characters: {charCount}</span>
            <span>Lines: {lines.length}</span>
            <span>Language: {LANGUAGES.find((l) => l.value === language)?.label}</span>
          </div>

          <button className="review-btn" onClick={handleReview} disabled={loading}>
            {loading ? "Reviewing…" : "Review Code →"}
          </button>

          {error && <div className="review-error">{error}</div>}

          {loading && (
            <div className="analyzing-block">
              <div className="analyzing-text">🤖 Analysing your code with OpenRouter AI…</div>
              <div className="progress-track">
                <div className="progress-fill" />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Score cards + accordions */}
        <div className="analysis-card glass">
          <h2>AI Analysis</h2>

          {!review && !loading && (
            <div className="analysis-empty">
              Run a review to see a full breakdown — score, bugs, security, performance, and a
              refactored version of your code.
            </div>
          )}

          {review && (
            <>
              <div className="score-grid">
                <div className="score-card score-card-main">
                  <div className="score-card-label">Overall Score</div>
                  <div className="score-card-value">{review.score}<span className="score-max">/100</span></div>
                </div>
                <div className="score-card">
                  <div className="score-card-label">Bug Risk</div>
                  <div className="score-card-value small">{riskLabel(review.bugs.length)}</div>
                </div>
                <div className="score-card">
                  <div className="score-card-label">Security</div>
                  <div className="score-card-value small">{review.securityIssues.length} Warning{review.securityIssues.length === 1 ? "" : "s"}</div>
                </div>
                <div className="score-card">
                  <div className="score-card-label">Performance</div>
                  <div className="score-card-value small">{review.performanceIssues.length === 0 ? "Excellent" : `${review.performanceIssues.length} note${review.performanceIssues.length === 1 ? "" : "s"}`}</div>
                </div>
              </div>

              <div className="accordion">
                <Accordion title="Summary" defaultOpen>
                  <p className="acc-text">{review.summary}</p>
                </Accordion>
                <Accordion title={`Bugs Found (${review.bugs.length})`}>
                  {review.bugs.length ? (
                    <ul className="acc-list">{review.bugs.map((b, i) => <li key={i}>{b}</li>)}</ul>
                  ) : <EmptyList text="No bugs found." />}
                </Accordion>
                <Accordion title={`Security Issues (${review.securityIssues.length})`}>
                  {review.securityIssues.length ? (
                    <ul className="acc-list">{review.securityIssues.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  ) : <EmptyList text="No security issues flagged." />}
                </Accordion>
                <Accordion title={`Performance Suggestions (${review.performanceIssues.length})`}>
                  {review.performanceIssues.length ? (
                    <ul className="acc-list">{review.performanceIssues.map((p, i) => <li key={i}>{p}</li>)}</ul>
                  ) : <EmptyList text="No performance issues flagged." />}
                </Accordion>
                <Accordion title="Best Practices">
                  {review.bestPractices.length ? (
                    <ul className="acc-list">{review.bestPractices.map((p, i) => <li key={i}>{p}</li>)}</ul>
                  ) : <EmptyList text="Nothing to flag." />}
                </Accordion>
                <Accordion title="Complexity Analysis">
                  <p className="acc-text">{review.complexityAnalysis}</p>
                </Accordion>
                <Accordion title="Refactored Code">
                  <pre className="acc-code">{review.refactoredCode}</pre>
                </Accordion>
                <Accordion title="Final Verdict">
                  <p className="acc-text">{review.conclusion}</p>
                </Accordion>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs section */}
      {review && (
        <div className="tabs-section glass">
          <div className="tabs-strip">
            {TABS.map((t) => (
              <button
                key={t}
                className={"tab-pill" + (activeTab === t ? " active" : "")}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="tab-panel">
            {activeTab === "Overview" && (
              <div className="overview-grid">
                {review.readability.map((r, i) => (
                  <div key={"r" + i} className="overview-item warn"><span>⚠</span> {r}</div>
                ))}
                {review.bestPractices.map((r, i) => (
                  <div key={"b" + i} className="overview-item warn"><span>⚠</span> {r}</div>
                ))}
                {review.bugs.length === 0 && (
                  <div className="overview-item ok"><span>✓</span> No syntax errors or obvious bugs found</div>
                )}
                {review.codeSmells.length === 0 ? (
                  <div className="overview-item ok"><span>✓</span> No code smells detected</div>
                ) : review.codeSmells.map((c, i) => (
                  <div key={"c" + i} className="overview-item warn"><span>⚠</span> {c}</div>
                ))}
              </div>
            )}

            {activeTab === "Bugs" && (
              <div className="timeline-list">
                {review.bugs.length === 0 && <EmptyList text="No bugs found in this submission." />}
                {review.bugs.map((b, i) => (
                  <div key={i} className="timeline-card">
                    <div className="timeline-marker">{i + 1}</div>
                    <div className="timeline-body">{b}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Security" && (
              <div className="sec-list">
                {review.securityIssues.length === 0 && <EmptyList text="No security issues flagged." />}
                {review.securityIssues.map((s, i) => (
                  <div key={i} className="sec-card">
                    <span className="sev-badge">REVIEW</span>
                    <div className="sec-text">{s}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Performance" && (
              <div>
                <p className="acc-text">{review.complexityAnalysis}</p>
                {review.performanceIssues.length === 0 ? (
                  <EmptyList text="No performance issues flagged." />
                ) : (
                  <ul className="acc-list">{review.performanceIssues.map((p, i) => <li key={i}>{p}</li>)}</ul>
                )}
              </div>
            )}

            {activeTab === "Optimisation" && (
              <div>
                {review.optimizationSuggestions.length === 0 ? (
                  <EmptyList text="No further optimisation suggestions." />
                ) : (
                  <ul className="acc-list">{review.optimizationSuggestions.map((o, i) => <li key={i}>{o}</li>)}</ul>
                )}
              </div>
            )}

            {activeTab === "Refactored Code" && (
              <div>
                <div className="refactor-toolbar">
                  <button className="tool-btn" onClick={() => handleCopy(review.refactoredCode)}>Copy</button>
                  <button className="tool-btn" onClick={handleDownloadRefactored}>Download</button>
                </div>
                <pre className="acc-code">{review.refactoredCode}</pre>
                <button className="review-btn replace-btn" onClick={handleReplaceOriginal}>
                  Replace Original Code
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom metrics */}
      {review && (
        <div className="bottom-metrics">
          <div className="metric-card glass">
            <div className="metric-value">{reviewTime ?? "—"}s</div>
            <div className="metric-label">Review Time</div>
          </div>
          <div className="metric-card glass">
            <div className="metric-value">{review.usage ?? "—"}</div>
            <div className="metric-label">Tokens Used</div>
          </div>
          <div className="metric-card glass">
            <div className="metric-value">{review.model ?? "OpenRouter (auto)"}</div>
            <div className="metric-label">Model</div>
          </div>
        </div>
      )}
    </div>
  );
}