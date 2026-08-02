import { db } from "./index";
import type { EmailDraft, SeniorityTier } from "./types";

export interface NewEmailDraft {
  contact_id: number;
  subject: string | null;
  body: string;
  seniority_tier_used: SeniorityTier;
}

export function listDraftsForContact(contactId: number): EmailDraft[] {
  return db
    .prepare(`SELECT * FROM email_drafts WHERE contact_id = ? ORDER BY id DESC`)
    .all(contactId) as EmailDraft[];
}

export function insertEmailDraft(d: NewEmailDraft): EmailDraft {
  const info = db
    .prepare(
      `INSERT INTO email_drafts (contact_id, subject, body, seniority_tier_used)
       VALUES (@contact_id, @subject, @body, @seniority_tier_used)`
    )
    .run({
      contact_id: d.contact_id,
      subject: d.subject ?? null,
      body: d.body,
      seniority_tier_used: d.seniority_tier_used,
    });
  return db
    .prepare(`SELECT * FROM email_drafts WHERE id = ?`)
    .get(Number(info.lastInsertRowid)) as EmailDraft;
}
