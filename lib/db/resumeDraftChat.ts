import { db } from "./index";
import type { ResumeDraftChatMessage, ResumeDraftChatRole } from "./types";

export function listResumeDraftChatMessages(sessionId: number): ResumeDraftChatMessage[] {
  return db
    .prepare(`SELECT * FROM resume_draft_chat_messages WHERE scout_session_id = ? ORDER BY id ASC`)
    .all(sessionId) as ResumeDraftChatMessage[];
}

export function addResumeDraftChatMessage(
  sessionId: number,
  role: ResumeDraftChatRole,
  content: string,
  resultingDraftId: number | null = null
): ResumeDraftChatMessage {
  const info = db
    .prepare(
      `INSERT INTO resume_draft_chat_messages (scout_session_id, role, content, resulting_draft_id)
       VALUES (@scout_session_id, @role, @content, @resulting_draft_id)`
    )
    .run({
      scout_session_id: sessionId,
      role,
      content,
      resulting_draft_id: resultingDraftId,
    });
  return db
    .prepare(`SELECT * FROM resume_draft_chat_messages WHERE id = ?`)
    .get(Number(info.lastInsertRowid)) as ResumeDraftChatMessage;
}
