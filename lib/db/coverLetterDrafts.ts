import { db } from "./index";
import type { CoverLetterDraft } from "./types";

export interface NewCoverLetterDraft {
  scout_session_id: number;
  cover_letter_markdown: string;
  research_sources: string; // caller passes JSON.stringify(CoverLetterResearchSource[])
  word_count: number;
}

export function listCoverLetterDraftsForSession(sessionId: number): CoverLetterDraft[] {
  return db
    .prepare(`SELECT * FROM cover_letter_drafts WHERE scout_session_id = ? ORDER BY id DESC`)
    .all(sessionId) as CoverLetterDraft[];
}

export function insertCoverLetterDraft(d: NewCoverLetterDraft): CoverLetterDraft {
  const info = db
    .prepare(
      `INSERT INTO cover_letter_drafts (scout_session_id, cover_letter_markdown, research_sources, word_count)
       VALUES (@scout_session_id, @cover_letter_markdown, @research_sources, @word_count)`
    )
    .run(d);
  return db
    .prepare(`SELECT * FROM cover_letter_drafts WHERE id = ?`)
    .get(Number(info.lastInsertRowid)) as CoverLetterDraft;
}
