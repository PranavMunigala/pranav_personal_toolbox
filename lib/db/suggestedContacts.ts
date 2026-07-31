import { db } from "./index";
import { findContactByLinkedInUrl, insertContact, type NewContact } from "./contacts";
import type { Contact, SuggestedContact } from "./types";

export interface NewSuggestedContact {
  name: string;
  company?: string | null;
  title?: string | null;
  linkedin_url?: string | null;
  source_snippet?: string | null;
  match_reasons?: string | null;
  discovered_at?: string; // defaults to today
}

export function listSuggestedContacts(discoveredAt?: string): SuggestedContact[] {
  const date =
    discoveredAt ??
    (
      db
        .prepare(
          `SELECT MAX(discovered_at) as d FROM suggested_contacts WHERE status = 'pending'`
        )
        .get() as { d: string | null }
    ).d;
  if (!date) return [];
  return db
    .prepare(
      `SELECT * FROM suggested_contacts WHERE discovered_at = ? AND status = 'pending' ORDER BY id`
    )
    .all(date) as SuggestedContact[];
}

export function latestBatchDate(): string | null {
  const row = db
    .prepare(`SELECT MAX(discovered_at) as d FROM suggested_contacts WHERE status = 'pending'`)
    .get() as { d: string | null };
  return row.d;
}

export function getSuggestedContact(id: number): SuggestedContact | undefined {
  return db.prepare("SELECT * FROM suggested_contacts WHERE id = ?").get(id) as
    | SuggestedContact
    | undefined;
}

export function insertSuggestedContact(s: NewSuggestedContact): SuggestedContact {
  const info = db
    .prepare(
      `INSERT INTO suggested_contacts
        (name, company, title, linkedin_url, source_snippet, match_reasons, discovered_at)
       VALUES (@name, @company, @title, @linkedin_url, @source_snippet, @match_reasons, COALESCE(@discovered_at, date('now')))`
    )
    .run({
      name: s.name,
      company: s.company ?? null,
      title: s.title ?? null,
      linkedin_url: s.linkedin_url ?? null,
      source_snippet: s.source_snippet ?? null,
      match_reasons: s.match_reasons ?? null,
      discovered_at: s.discovered_at ?? null,
    });
  return getSuggestedContact(Number(info.lastInsertRowid))!;
}

export function dismissSuggestedContact(id: number): SuggestedContact {
  db.prepare(`UPDATE suggested_contacts SET status = 'dismissed' WHERE id = ?`).run(id);
  return getSuggestedContact(id)!;
}

export function promoteSuggestedContact(
  id: number,
  overrides?: Partial<NewContact>
): { ok: true; contact: Contact } | { ok: false; reason: string } {
  const suggestion = getSuggestedContact(id);
  if (!suggestion) return { ok: false, reason: `Suggestion ${id} not found` };
  if (suggestion.status !== "pending") {
    return { ok: false, reason: `Suggestion ${id} is already "${suggestion.status}"` };
  }

  if (suggestion.linkedin_url) {
    const existing = findContactByLinkedInUrl(suggestion.linkedin_url);
    if (existing) {
      return {
        ok: false,
        reason: `A contact already exists for this LinkedIn URL (id ${existing.id}, status "${existing.status}").`,
      };
    }
  }

  const contact = insertContact({
    name: suggestion.name,
    company: suggestion.company,
    title: suggestion.title,
    linkedin_url: suggestion.linkedin_url,
    notes: suggestion.match_reasons
      ? `Discovered via contact-discovery skill: ${suggestion.match_reasons}`
      : null,
    ...overrides,
  });

  db.prepare(
    `UPDATE suggested_contacts SET status = 'added', promoted_contact_id = ? WHERE id = ?`
  ).run(contact.id, id);

  return { ok: true, contact };
}
