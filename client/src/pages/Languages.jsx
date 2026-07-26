import { useNavigate } from "react-router-dom";

const LANGUAGES = [
  { value: "python", name: "Python", icon: "🐍", color: "#3776ab", note: "Great for scripts, data work, and readability checks." },
  { value: "java", name: "Java", icon: "☕", color: "#e76f00", note: "Strong on OOP structure, naming, and exception handling." },
  { value: "c", name: "C", icon: "🔧", color: "#5c6bc0", note: "Focus on memory safety, pointers, and manual resource handling." },
  { value: "cpp", name: "C++", icon: "⚙️", color: "#00599c", note: "Covers memory management, STL usage, and modern C++ idioms." },
  { value: "javascript", name: "JavaScript", icon: "🟨", color: "#f0db4f", note: "Async patterns, type coercion pitfalls, and modern ES syntax." },
  { value: "typescript", name: "TypeScript", icon: "🔷", color: "#3178c6", note: "Type safety, interface design, and strictness checks." },
];

export default function Languages() {
  const navigate = useNavigate();

  return (
    <div className="page-content languages-page">
      <h1 className="lang-page-title">Supported Languages</h1>
      <p className="lang-page-sub">
        Pick a language below to jump straight into the editor with it pre-selected.
      </p>

      <div className="lang-grid">
        {LANGUAGES.map((l) => (
          <button
            key={l.value}
            className="lang-card glass"
            style={{ "--chip-color": l.color }}
            onClick={() => navigate("/review", { state: { language: l.value, code: "" } })}
          >
            <span className="lang-card-icon">{l.icon}</span>
            <h3>{l.name}</h3>
            <p>{l.note}</p>
          </button>
        ))}
      </div>
    </div>
  );
}