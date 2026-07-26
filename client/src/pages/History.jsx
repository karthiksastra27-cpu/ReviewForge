import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function History() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:4000/api/reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      setError("Could not reach the server. Is it running on port 4000?");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await fetch(`http://localhost:4000/api/reviews/${id}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Could not delete that review.");
    }
  }

  function handleRerun(review) {
    navigate("/review", { state: { code: review.code, language: review.language } });
  }

  const filtered = reviews.filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.language.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q) ||
      (r.review?.summary || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-content history-page">
      <div className="history-header">
        <h1>History</h1>
        <input
          className="search-input"
          placeholder="Search by language, code, or summary…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <div className="empty-list">Loading reviews…</div>}
      {error && <div className="review-error">{error}</div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-list">
          {reviews.length === 0 ? "No reviews yet — run one from the Code Review page." : "No reviews match your search."}
        </div>
      )}

      <div className="history-list">
        {filtered.map((r) => (
          <div key={r.id} className="history-card glass">
            <div className="history-card-top">
              <span className="history-lang-tag">{r.language}</span>
              <span className="history-score">{r.review?.score ?? "—"}/100</span>
              <span className="history-date">{new Date(r.createdAt).toLocaleString()}</span>
            </div>
            <pre className="history-code-preview">{r.code.slice(0, 160)}{r.code.length > 160 ? "…" : ""}</pre>
            <p className="history-summary">{r.review?.summary}</p>
            <div className="history-actions">
              <button className="tool-btn" onClick={() => handleRerun(r)}>Re-run</button>
              <button className="tool-btn danger-btn" onClick={() => handleDelete(r.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}