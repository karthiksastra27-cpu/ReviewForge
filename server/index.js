import "dotenv/config";
import express from "express";
import cors from "cors";
import db from "./db.js";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/review", async (req, res) => {
  const { code, language } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: "code is required" });
  }

  try {
    const prompt = `You are a senior software engineer performing a thorough code review. Review the following ${language || "code"} snippet and respond with ONLY a valid JSON object (no markdown fences, no extra text before or after) matching exactly this shape:

{
  "score": <integer 0-100, overall code quality>,
  "summary": "<2-3 sentence overview>",
  "bugs": ["<bug 1>", "<bug 2>"],
  "codeSmells": ["<smell 1>"],
  "performanceIssues": ["<issue 1>"],
  "securityIssues": ["<issue 1>"],
  "bestPractices": ["<note 1>"],
  "readability": ["<note 1>"],
  "optimizationSuggestions": ["<suggestion 1>"],
  "refactoredCode": "<the improved version of the code, as a plain string with \\n for newlines>",
  "complexityAnalysis": "<short paragraph on time/space complexity if relevant, else general structural complexity>",
  "conclusion": "<1-2 sentence closing verdict>"
}

If a category has nothing to report, return an empty array for it (never omit a key). Code to review:
${code}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;

    if (!rawText) {
      console.error("Unexpected OpenRouter response:", JSON.stringify(data));
      return res.status(500).json({ error: "No response returned from the AI model" });
    }

    const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

    let review;
    try {
      review = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse AI response as JSON:", rawText);
      return res.status(500).json({ error: "AI response was not valid JSON. Try again." });
    }

    review.model = data.model || "unknown";
    review.usage = data.usage?.total_tokens ?? null;

    db.prepare(
      "INSERT INTO reviews (language, code, feedback) VALUES (?, ?, ?)"
    ).run(language || "unknown", code, JSON.stringify(review));

    res.json({ review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong generating the review" });
  }
});
app.get("/api/reviews", (req, res) => {
  const rows = db.prepare("SELECT * FROM reviews ORDER BY created_at DESC").all();
  const reviews = rows.map((r) => ({
    id: r.id,
    language: r.language,
    code: r.code,
    review: JSON.parse(r.feedback),
    createdAt: r.created_at,
  }));
  res.json({ reviews });
});

app.delete("/api/reviews/:id", (req, res) => {
  const info = db.prepare("DELETE FROM reviews WHERE id = ?").run(req.params.id);
  if (info.changes === 0) {
    return res.status(404).json({ error: "review not found" });
  }
  res.status(204).send();
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});