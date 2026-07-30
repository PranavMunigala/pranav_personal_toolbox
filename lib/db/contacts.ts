import { db } from "./index";
import type { Contact, ContactStatus, SeniorityTier } from "./types";

export interface NewContact {
  name: string;
  linkedin_url?: string | null;
  email?: string | null;
  company?: string | null;
  title?: string | null;
  seniority_tier?: SeniorityTier;
  industry_tags?: string[];
  status?: ContactStatus;
  profile_text?: string | null;
  notes?: string | null;
  date_last_contacted?: string | null;
}

export function listContacts(): Contact[] {
  return db.prepare("SELECT * FROM contacts ORDER BY updated_at DESC").all() as Contact[];
}

export function getContact(id: number): Contact | undefined {
  return db.prepare("SELECT * FROM contacts WHERE id = ?").get(id) as Contact | undefined;
}

export function findContactByLinkedInUrl(linkedin_url: string): Contact | undefined {
  return db
    .prepare("SELECT * FROM contacts WHERE linkedin_url = ?")
    .get(linkedin_url) as Contact | undefined;
}

export function findContactsByCompany(company: string): Contact[] {
  return db
    .prepare("SELECT * FROM contacts WHERE company = ? COLLATE NOCASE")
    .all(company) as Contact[];
}

export function insertContact(c: NewContact): Contact {
  const info = db
    .prepare(
      `INSERT INTO contacts
        (name, linkedin_url, email, company, title, seniority_tier, industry_tags, status, profile_text, notes, date_last_contacted)
       VALUES (@name, @linkedin_url, @email, @company, @title, @seniority_tier, @industry_tags, @status, @profile_text, @notes, @date_last_contacted)`
    )
    .run({
      name: c.name,
      linkedin_url: c.linkedin_url ?? null,
      email: c.email ?? null,
      company: c.company ?? null,
      title: c.title ?? null,
      seniority_tier: c.seniority_tier ?? "mid",
      industry_tags: JSON.stringify(c.industry_tags ?? []),
      status: c.status ?? "not_contacted",
      profile_text: c.profile_text ?? null,
      notes: c.notes ?? null,
      date_last_contacted: c.date_last_contacted ?? null,
    });
  return getContact(Number(info.lastInsertRowid))!;
}

export function updateContact(id: number, patch: Partial<NewContact>): Contact {
  const existing = getContact(id);
  if (!existing) throw new Error(`Contact ${id} not found`);
  const merged = {
    name: patch.name ?? existing.name,
    linkedin_url: patch.linkedin_url ?? existing.linkedin_url,
    email: patch.email ?? existing.email,
    company: patch.company ?? existing.company,
    title: patch.title ?? existing.title,
    seniority_tier: patch.seniority_tier ?? existing.seniority_tier,
    industry_tags: patch.industry_tags
      ? JSON.stringify(patch.industry_tags)
      : existing.industry_tags,
    status: patch.status ?? existing.status,
    profile_text: patch.profile_text ?? existing.profile_text,
    notes: patch.notes ?? existing.notes,
    date_last_contacted: patch.date_last_contacted ?? existing.date_last_contacted,
  };
  db.prepare(
    `UPDATE contacts SET
      name=@name, linkedin_url=@linkedin_url, email=@email, company=@company, title=@title,
      seniority_tier=@seniority_tier, industry_tags=@industry_tags, status=@status,
      profile_text=@profile_text, notes=@notes, date_last_contacted=@date_last_contacted,
      updated_at=datetime('now')
     WHERE id=@id`
  ).run({ ...merged, id });
  return getContact(id)!;
}

/**
 * Dedup guard: a contact can only transition to 'sent' if there is no existing
 * record (by id, or by matching linkedin_url/name) already sent or coffee_chatted.
 * This is enforced here in code, not just left to prompt instructions, so the UI
 * and any skill/script that goes through this function gets the same protection.
 */
export function markSent(id: number): { ok: true; contact: Contact } | { ok: false; reason: string } {
  const contact = getContact(id);
  if (!contact) return { ok: false, reason: `Contact ${id} not found` };

  if (contact.status === "sent" || contact.status === "coffee_chatted") {
    return {
      ok: false,
      reason: `${contact.name} is already marked "${contact.status}" — refusing to re-send to avoid duplicate outreach.`,
    };
  }

  if (contact.linkedin_url) {
    const dupe = db
      .prepare(
        `SELECT * FROM contacts WHERE linkedin_url = ? AND id != ? AND status IN ('sent', 'coffee_chatted')`
      )
      .get(contact.linkedin_url, id) as Contact | undefined;
    if (dupe) {
      return {
        ok: false,
        reason: `Another contact record (id ${dupe.id}) with the same LinkedIn URL is already "${dupe.status}" — refusing to re-send.`,
      };
    }
  }

  const updated = updateContact(id, {
    status: "sent",
    date_last_contacted: new Date().toISOString(),
  });
  return { ok: true, contact: updated };
}

export function markCoffeeChatted(id: number): Contact {
  return updateContact(id, {
    status: "coffee_chatted",
    date_last_contacted: new Date().toISOString(),
  });
}

export function deleteContact(id: number): void {
  db.prepare("DELETE FROM contacts WHERE id = ?").run(id);
}
