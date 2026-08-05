import { db } from "./index";
import type { EmailDraftChatMessage, EmailDraftChatRole } from "./types";

export function listDraftChatMessages(contactId: number): EmailDraftChatMessage[] {
  return db
    .prepare(`SELECT * FROM email_draft_chat_messages WHERE contact_id = ? ORDER BY id ASC`)
    .all(contactId) as EmailDraftChatMessage[];
}

export function addDraftChatMessage(
  contactId: number,
  role: EmailDraftChatRole,
  content: string,
  resultingDraftId: number | null = null
): EmailDraftChatMessage {
  const info = db
    .prepare(
      `INSERT INTO email_draft_chat_messages (contact_id, role, content, resulting_draft_id)
       VALUES (@contact_id, @role, @content, @resulting_draft_id)`
    )
    .run({
      contact_id: contactId,
      role,
      content,
      resulting_draft_id: resultingDraftId,
    });
  return db
    .prepare(`SELECT * FROM email_draft_chat_messages WHERE id = ?`)
    .get(Number(info.lastInsertRowid)) as EmailDraftChatMessage;
}
