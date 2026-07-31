import { db } from "./index";
import type { Contact, ConnectionStatus, ContactStatus, SeniorityTier } from "./types";

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
  phone?: string | null;
  is_recruiter?: boolean;
  connection_status?: ConnectionStatus;
  alma_mater?: string | null;
}

export interface ContactFilters {
  status?: ContactStatus;
  company?: string;
  seniority_tier?: SeniorityTier;
  connection_status?: ConnectionStatus;
  is_recruiter?: boolean;
  alma_mater?: string;
  industry_tag?: string;
  q?: string; // free-text substring over name/company/title
}

export function listContacts(filters?: ContactFilters): Contact[] {
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters?.status) {
    clauses.push("status = @status");
    params.status = filters.status;
  }
  if (filters?.company) {
    clauses.push("company = @company COLLATE NOCASE");
    params.company = filters.company;
  }
  if (filters?.seniority_tier) {
    clauses.push("seniority_tier = @seniority_tier");
    params.seniority_tier = filters.seniority_tier;
  }
  if (filters?.connection_status) {
    clauses.push("connection_status = @connection_status");
    params.connection_status = filters.connection_status;
  }
  if (filters?.is_recruiter !== undefined) {
    clauses.push("is_recruiter = @is_recruiter");
    params.is_recruiter = filters.is_recruiter ? 1 : 0;
  }
  if (filters?.alma_mater) {
    clauses.push("alma_mater = @alma_mater COLLATE NOCASE");
    params.alma_mater = filters.alma_mater;
  }
  if (filters?.industry_tag) {
    clauses.push(
      "EXISTS (SELECT 1 FROM json_each(contacts.industry_tags) WHERE json_each.value = @industry_tag COLLATE NOCASE)"
    );
    params.industry_tag = filters.industry_tag;
  }
  if (filters?.q) {
    clauses.push("(name LIKE @q OR company LIKE @q OR title LIKE @q)");
    params.q = `%${filters.q}%`;
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db
    .prepare(`SELECT * FROM contacts ${where} ORDER BY updated_at DESC`)
    .all(params) as Contact[];
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
        (name, linkedin_url, email, company, title, seniority_tier, industry_tags, status, profile_text, notes, date_last_contacted, phone, is_recruiter, connection_status, alma_mater)
       VALUES (@name, @linkedin_url, @email, @company, @title, @seniority_tier, @industry_tags, @status, @profile_text, @notes, @date_last_contacted, @phone, @is_recruiter, @connection_status, @alma_mater)`
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
      phone: c.phone ?? null,
      is_recruiter: c.is_recruiter ? 1 : 0,
      connection_status: c.connection_status ?? "not_connected",
      alma_mater: c.alma_mater ?? null,
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
    phone: patch.phone ?? existing.phone,
    is_recruiter:
      patch.is_recruiter !== undefined ? (patch.is_recruiter ? 1 : 0) : existing.is_recruiter,
    connection_status: patch.connection_status ?? existing.connection_status,
    alma_mater: patch.alma_mater ?? existing.alma_mater,
  };
  db.prepare(
    `UPDATE contacts SET
      name=@name, linkedin_url=@linkedin_url, email=@email, company=@company, title=@title,
      seniority_tier=@seniority_tier, industry_tags=@industry_tags, status=@status,
      profile_text=@profile_text, notes=@notes, date_last_contacted=@date_last_contacted,
      phone=@phone, is_recruiter=@is_recruiter, connection_status=@connection_status, alma_mater=@alma_mater,
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
