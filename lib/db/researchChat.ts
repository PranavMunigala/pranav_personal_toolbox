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
  content: string
): ResearchChatMessage {
  const info = db
    .prepare(
      `INSERT INTO research_chat_messages (category, slug, role, content)
       VALUES (@category, @slug, @role, @content)`
    )
    .run({ category, slug, role, content });
  return db
    .prepare(`SELECT * FROM research_chat_messages WHERE id = ?`)
    .get(Number(info.lastInsertRowid)) as ResearchChatMessage;
}
