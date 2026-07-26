import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const LANGUAGES = [
  { name: "Python", icon: "🐍", color: "#3776ab" },
  { name: "Java", icon: "☕", color: "#e76f00" },
  { name: "C", icon: "🔧", color: "#5c6bc0" },
  { name: "C++", icon: "⚙️", color: "#00599c" },
  { name: "JavaScript", icon: "🟨", color: "#f0db4f" },
  { name: "TypeScript", icon: "🔷", color: "#3178c6" },
  { name: "Go", icon: "🐹", color: "#00add8" },
  { name: "HTML", icon: "🌐", color: "#e34c26" },
  { name: "CSS", icon: "🎨", color: "#264de4" },
];

const STATS = [
  { value: 15, suffix: "+", label: "Languages" },
  { value: 2, suffix: "s", prefix: "<", label: "Review time" },
  { value: 95, suffix: "%", label: "Detection accuracy" },
  { value: 1000, suffix: "+", label: "Reviews generated" },
];

const FEATURES = [
  { to: "/review", icon: "◆", title: "AI Review", desc: "Detect bugs, code smells, optimization opportunities and best practices." },
  { to: "/history", icon: "◷", title: "Review History", desc: "Access previous reviews, compare improvements and re-run analyses." },
  { to: "/metrics", icon: "◱", title: "Metrics Dashboard", desc: "Visualize code quality, complexity, performance and review statistics." },
];

function useCountUp(target, start) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let frame;
    const duration = 1100;
    const startTime = performance.now();
    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, target]);
  return value;
}

function StatCard({ stat }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.4 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const count = useCountUp(stat.value, inView);

  return (
    <div className="stat-card glass" ref={ref}>
      <div className="stat-value">
        {stat.prefix}{count}{stat.suffix}
      </div>
      <div className="stat-label">{stat.label}</div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="page-content home">
      <div className="bg-decor" aria-hidden="true">
        <div className="grid-overlay" />
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <span className="float-symbol sym-1">&lt;/&gt;</span>
        <span className="float-symbol sym-2">{"{ }"}</span>
        <span className="float-symbol sym-3">/</span>
        <span className="float-symbol sym-4">&lt;&gt;</span>
      </div>

      <section className="hero-v2 fade-in">
        <div className="hero-copy">
          <span className="badge-pill">⚡ Powered by Groq AI</span>
          <h1 className="hero-title-v2">
            AI Code Reviews<br />That Think Like<br />Senior Developers.
          </h1>
          <p className="hero-sub">
            Paste your code or upload a source file and receive an AI-powered review in
            seconds. Detect bugs, improve performance, uncover security issues, analyse
            complexity, and receive clean refactoring suggestions — all in one place.
          </p>
          <div className="hero-actions">
            <Link to="/review" className="cta-btn">Start Review →</Link>
            <Link to="/review" className="cta-btn-outline">See Demo</Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="mock-editor glass floaty">
            <div className="mock-editor-bar">
              <span className="mock-dot red" />
              <span className="mock-dot yellow" />
              <span className="mock-dot green" />
              <span className="mock-editor-name">submission.js</span>
            </div>
            <pre className="mock-code">
<span className="tok-kw">function</span> <span className="tok-fn">add</span>(a,b){"{"}
  <span className="tok-kw">return</span> a+b
{"}"}
            </pre>
          </div>

          <div className="mock-review glass floaty floaty-delay">
            <div className="mock-review-title">Review Result</div>
            <ul className="mock-review-list">
              <li><span className="mr-icon mr-bug">✓</span> 3 Bugs Found</li>
              <li><span className="mr-icon mr-perf">⚡</span> Performance Improved</li>
              <li><span className="mr-icon mr-sec">🔒</span> Security Suggestion</li>
              <li><span className="mr-icon mr-cx">📈</span> Complexity: O(n)</li>
              <li><span className="mr-icon mr-score">⭐</span> Code Quality: 91/100</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="stats-row fade-in">
        {STATS.map((s) => <StatCard key={s.label} stat={s} />)}
      </section>

      <section className="lang-strip fade-in">
        <span className="lang-strip-label">Supported languages</span>
        <div className="lang-chips">
          {LANGUAGES.map((l) => (
            <span key={l.name} className="chip-v2" style={{ "--chip-color": l.color }}>
              <span className="chip-icon">{l.icon}</span> {l.name}
            </span>
          ))}
        </div>
      </section>

      <section className="section-grid fade-in">
        {FEATURES.map((f) => (
          <Link key={f.to} to={f.to} className="section-card glass">
            <span className="section-card-icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}