function buildReviewPrompt(code, language) {
  return `You are a senior software engineer performing a thorough code review. Review the following ${language || "code"} snippet and respond with ONLY a valid JSON object (no markdown fences, no extra text before or after) matching exactly this shape:

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
}

async function handleCreateReview(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { code, language } = body || {};
  if (!code || !code.trim()) {
    return Response.json({ error: "code is required" }, { status: 400 });
  }

  if (!env.OPENROUTER_API_KEY) {
    console.error(JSON.stringify({ message: "missing OPENROUTER_API_KEY secret" }));
    return Response.json({ error: "Server AI key is not configured" }, { status: 500 });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [{ role: "user", content: buildReviewPrompt(code, language) }],
      }),
    });

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;

    if (!rawText) {
      console.error(JSON.stringify({ message: "unexpected OpenRouter response", status: response.status, data }));
      return Response.json({ error: "No response returned from the AI model" }, { status: 500 });
    }

    const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

    let review;
    try {
      review = JSON.parse(cleaned);
    } catch {
      console.error(JSON.stringify({ message: "failed to parse AI response as JSON", rawText }));
      return Response.json({ error: "AI response was not valid JSON. Try again." }, { status: 500 });
    }

    review.model = data.model || "unknown";
    review.usage = data.usage?.total_tokens ?? null;

    await env.DB.prepare("INSERT INTO reviews (language, code, feedback) VALUES (?, ?, ?)")
      .bind(language || "unknown", code, JSON.stringify(review))
      .run();

    return Response.json({ review });
  } catch (err) {
    console.error(JSON.stringify({
      message: "failed to generate review",
      error: err instanceof Error ? err.message : String(err),
    }));
    return Response.json({ error: "Something went wrong generating the review" }, { status: 500 });
  }
}

async function handleListReviews(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, language, code, feedback, created_at FROM reviews ORDER BY created_at DESC, id DESC"
  ).all();

  const reviews = (results || []).map((r) => ({
    id: r.id,
    language: r.language,
    code: r.code,
    review: JSON.parse(r.feedback),
    createdAt: r.created_at,
  }));

  return Response.json({ reviews });
}

async function handleDeleteReview(id, env) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return Response.json({ error: "invalid review id" }, { status: 400 });
  }

  const info = await env.DB.prepare("DELETE FROM reviews WHERE id = ?").bind(numericId).run();
  if (!info.meta || info.meta.changes === 0) {
    return Response.json({ error: "review not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    try {
      if (pathname === "/api/health" && request.method === "GET") {
        return Response.json({ ok: true });
      }

      if (pathname === "/api/review" && request.method === "POST") {
        return await handleCreateReview(request, env);
      }

      if (pathname === "/api/reviews" && request.method === "GET") {
        return await handleListReviews(env);
      }

      const deleteMatch = pathname.match(/^\/api\/reviews\/([^/]+)$/);
      if (deleteMatch && request.method === "DELETE") {
        return await handleDeleteReview(deleteMatch[1], env);
      }

      if (pathname.startsWith("/api/")) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }

      return await env.ASSETS.fetch(request);
    } catch (err) {
      console.error(JSON.stringify({
        message: "unhandled worker error",
        path: pathname,
        error: err instanceof Error ? err.message : String(err),
      }));
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
};
