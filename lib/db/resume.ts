import { db } from "./index";
import type { Resume } from "./types";

// Common English stopwords plus resume boilerplate that isn't a useful match signal.
const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "have", "has", "had",
  "was", "were", "are", "you", "your", "our", "their", "his", "her", "its",
  "into", "onto", "over", "under", "than", "then", "them", "they", "which",
  "who", "whom", "will", "would", "could", "should", "can", "may", "might",
  "not", "but", "also", "such", "each", "any", "all", "some", "more", "most",
  "other", "these", "those", "about", "above", "after", "before", "being",
  "between", "both", "during", "further", "here", "there", "when", "where",
  "while", "why", "how", "what", "out", "off", "up", "down", "again", "once",
  "email", "phone", "address", "resume", "references", "available", "request",
]);

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[.#+]+|[.#+]+$/g, ""))
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  const seen = new Set<string>();
  const keywords: string[] = [];
  for (const w of words) {
    if (!seen.has(w)) {
      seen.add(w);
      keywords.push(w);
    }
    if (keywords.length >= 80) break;
  }
  return keywords;
}

export function getResume(): Resume | undefined {
  return db.prepare("SELECT * FROM resume WHERE id = 1").get() as Resume | undefined;
}

export function setResume(input: { raw_text: string; filename?: string | null }): Resume {
  const keywords = extractKeywords(input.raw_text);
  db.prepare(
    `INSERT INTO resume (id, raw_text, keywords, filename, uploaded_at)
     VALUES (1, @raw_text, @keywords, @filename, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       raw_text=excluded.raw_text, keywords=excluded.keywords,
       filename=excluded.filename, uploaded_at=excluded.uploaded_at`
  ).run({
    raw_text: input.raw_text,
    keywords: JSON.stringify(keywords),
    filename: input.filename ?? null,
  });
  return getResume()!;
}
