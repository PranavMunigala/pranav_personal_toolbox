import { db } from "./index";
import type { CoverLetterChatMessage, CoverLetterChatRole } from "./types";

export function listCoverLetterChatMessages(sessionId: number): CoverLetterChatMessage[] {
  return db
    .prepare(`SELECT * FROM cover_letter_chat_messages WHERE scout_session_id = ? ORDER BY id ASC`)
    .all(sessionId) as CoverLetterChatMessage[];
}

export function addCoverLetterChatMessage(
  sessionId: number,
  role: CoverLetterChatRole,
  content: string,
  resultingDraftId: number | null = null
): CoverLetterChatMessage {
  const info = db
    .prepare(
      `INSERT INTO cover_letter_chat_messages (scout_session_id, role, content, resulting_draft_id)
       VALUES (@scout_session_id, @role, @content, @resulting_draft_id)`
    )
    .run({
      scout_session_id: sessionId,
      role,
      content,
      resulting_draft_id: resultingDraftId,
    });
  return db
    .prepare(`SELECT * FROM cover_letter_chat_messages WHERE id = ?`)
    .get(Number(info.lastInsertRowid)) as CoverLetterChatMessage;
}
