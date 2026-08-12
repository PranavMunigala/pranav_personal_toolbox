import { db } from "./index";
import type { ResearchProfileHistoryEntry, ResearchProfileHistorySource } from "./types";

export function listProfileHistory(category: string, slug: string): ResearchProfileHistoryEntry[] {
  return db
    .prepare(
      `SELECT * FROM research_profile_history WHERE category = ? AND slug = ? ORDER BY id DESC`
    )
    .all(category, slug) as ResearchProfileHistoryEntry[];
}

export function addProfileHistoryEntry(
  category: string,
  slug: string,
  summary: string,
  source: ResearchProfileHistorySource
): ResearchProfileHistoryEntry {
  const info = db
    .prepare(
      `INSERT INTO research_profile_history (category, slug, summary, source)
       VALUES (@category, @slug, @summary, @source)`
    )
    .run({ category, slug, summary, source });
  return db
    .prepare(`SELECT * FROM research_profile_history WHERE id = ?`)
    .get(Number(info.lastInsertRowid)) as ResearchProfileHistoryEntry;
}
