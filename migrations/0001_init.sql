CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  feedback TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
