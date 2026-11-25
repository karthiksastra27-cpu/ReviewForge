import { useEffect, useState } from "react";

const ISSUE_CATEGORIES = [
  { key: "bugs", label: "Bugs" },
  { key: "codeSmells", label: "Code Smells" },
  { key: "securityIssues", label: "Security Issues" },
  { key: "performanceIssues", label: "Performance Issues" },
];

export default function Metrics() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/reviews");
        const data = await res.json();
        setReviews(data.reviews || []);
      } catch {
        setError("Could not reach the server. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="page-content"><div className="empty-list">Loading metrics…</div></div>;
  if (error) return <div className="page-content"><div className="review-error">{error}</div></div>;

  const total = reviews.length;
  const avgScore = total
    ? Math.round(reviews.reduce((sum, r) => sum + (r.review?.score || 0), 0) / total)
    : 0;

  const langCounts = {};
  reviews.forEach((r) => { langCounts[r.language] = (langCounts[r.language] || 0) + 1; });
  const topLang = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0];

  const categoryTotals = ISSUE_CATEGORIES.map((c) => ({
    ...c,
    count: reviews.reduce((sum, r) => sum + (r.review?.[c.key]?.length || 0), 0),
  }));
  const topCategory = [...categoryTotals].sort((a, b) => b.count - a.count)[0];

  // oldest -> newest for the trend chart
  const trend = [...reviews].reverse();

  return (
    <div className="page-content metrics-page">
      <h1 className="lang-page-title">Metrics Dashboard</h1>
      <p className="lang-page-sub">Aggregated stats across every review stored in your database.</p>

      {total === 0 ? (
        <div className="empty-list">No reviews yet — run some from the Code Review page first.</div>
      ) : (
        <>
          <div className="metrics-stat-grid">
            <div className="metric-card glass">
              <div className="metric-value">{total}</div>
              <div className="metric-label">Total Reviews</div>
            </div>
            <div className="metric-card glass">
              <div className="metric-value">{avgScore}/100</div>
              <div className="metric-label">Average Score</div>
            </div>
            <div className="metric-card glass">
              <div className="metric-value" style={{ textTransform: "capitalize" }}>{topLang?.[0] ?? "—"}</div>
              <div className="metric-label">Most Reviewed Language</div>
            </div>
            <div className="metric-card glass">
              <div className="metric-value">{topCategory?.label ?? "—"}</div>
              <div className="metric-label">Most Common Issue Type</div>
            </div>
          </div>

          <div className="chart-card glass">
            <h3>Score trend (oldest → newest)</h3>
            <div className="bar-chart">
              {trend.map((r, i) => (
                <div key={r.id} className="bar-col" title={`${r.review?.score ?? 0}/100`}>
                  <div className="bar-fill" style={{ height: `${(r.review?.score || 0)}%` }} />
                  <span className="bar-index">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card glass">
            <h3>Issues by category</h3>
            <div className="category-bars">
              {categoryTotals.map((c) => (
                <div key={c.key} className="category-row">
                  <span className="category-label">{c.label}</span>
                  <div className="category-track">
                    <div
                      className="category-fill"
                      style={{ width: `${Math.min(100, c.count * 10)}%` }}
                    />
                  </div>
                  <span className="category-count">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}