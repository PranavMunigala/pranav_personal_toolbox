import { db } from "./index";
import type { ResearchChatMessage, ResearchChatRole } from "./types";

export function listChatMessages(category: string, slug: string): ResearchChatMessage[] {
  return db
    .prepare(
      `SELECT * FROM research_chat_messages WHERE category = ? AND slug = ? ORDER BY id ASC`
    )
    .all(category, slug) as ResearchChatMessage[];
}

export function addChatMessage(
  category: string,
  slug: string,
  role: ResearchChatRole,
  content: string,
  profileUpdated = false
): ResearchChatMessage {
  const info = db
    .prepare(
      `INSERT INTO research_chat_messages (category, slug, role, content, profile_updated)
       VALUES (@category, @slug, @role, @content, @profileUpdated)`
    )
    .run({ category, slug, role, content, profileUpdated: profileUpdated ? 1 : 0 });
  return db
    .prepare(`SELECT * FROM research_chat_messages WHERE id = ?`)
    .get(Number(info.lastInsertRowid)) as ResearchChatMessage;
}

export function markChatMessageProfileUpdated(id: number): void {
  db.prepare(`UPDATE research_chat_messages SET profile_updated = 1 WHERE id = ?`).run(id);
}
