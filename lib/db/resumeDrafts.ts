import { db } from "./index";
import type { ResumeDraft } from "./types";

export interface NewResumeDraft {
  scout_session_id: number;
  tailored_resume_markdown: string;
  gap_analysis: string; // caller passes JSON.stringify(GapAnalysis)
}

export function listResumeDraftsForSession(sessionId: number): ResumeDraft[] {
  return db
    .prepare(`SELECT * FROM resume_drafts WHERE scout_session_id = ? ORDER BY id DESC`)
    .all(sessionId) as ResumeDraft[];
}

export function insertResumeDraft(d: NewResumeDraft): ResumeDraft {
  const info = db
    .prepare(
      `INSERT INTO resume_drafts (scout_session_id, tailored_resume_markdown, gap_analysis)
       VALUES (@scout_session_id, @tailored_resume_markdown, @gap_analysis)`
    )
    .run(d);
  return db
    .prepare(`SELECT * FROM resume_drafts WHERE id = ?`)
    .get(Number(info.lastInsertRowid)) as ResumeDraft;
}
