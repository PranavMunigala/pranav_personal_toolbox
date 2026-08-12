import { db } from "./index";
import { findExistingApplication, insertApplication, type NewApplication } from "./applications";
import type {
  Application,
  SuggestedApplication,
  SuggestedApplicationVerificationStatus,
} from "./types";

export interface NewSuggestedApplication {
  company: string;
  role: string;
  link?: string | null;
  location?: string | null;
  date_posted?: string | null;
  source_snippet?: string | null;
  match_reasons?: string | null;
  discovered_at?: string; // defaults to today
  filter_failures?: string[] | null; // reasons it failed enabled filters; null/omitted if it passed all
  verification_status?: SuggestedApplicationVerificationStatus; // defaults to "confirmed"
}

export function listSuggestedApplications(discoveredAt?: string): SuggestedApplication[] {
  const date =
    discoveredAt ??
    (
      db
        .prepare(
          `SELECT MAX(discovered_at) as d FROM suggested_applications WHERE status = 'pending'`
        )
        .get() as { d: string | null }
    ).d;
  if (!date) return [];
  return db
    .prepare(
      `SELECT * FROM suggested_applications WHERE discovered_at = ? AND status = 'pending' ORDER BY id`
    )
    .all(date) as SuggestedApplication[];
}

/**
 * Every company+role+link ever suggested, regardless of status or date — used for
 * dedup so a dismissed or older-batch suggestion doesn't resurface, not just the
 * current pending batch (which is all listSuggestedApplications() returns by default).
 */
export function listAllSuggestedApplicationKeys(): { company: string; role: string; link: string | null }[] {
  return db.prepare(`SELECT company, role, link FROM suggested_applications`).all() as {
    company: string;
    role: string;
    link: string | null;
  }[];
}

export function latestBatchDate(): string | null {
  const row = db
    .prepare(`SELECT MAX(discovered_at) as d FROM suggested_applications WHERE status = 'pending'`)
    .get() as { d: string | null };
  return row.d;
}

export function getSuggestedApplication(id: number): SuggestedApplication | undefined {
  return db.prepare("SELECT * FROM suggested_applications WHERE id = ?").get(id) as
    | SuggestedApplication
    | undefined;
}

export function insertSuggestedApplication(s: NewSuggestedApplication): SuggestedApplication {
  const info = db
    .prepare(
      `INSERT INTO suggested_applications
        (company, role, link, location, date_posted, source_snippet, match_reasons, discovered_at, filter_failures, verification_status)
       VALUES (@company, @role, @link, @location, @date_posted, @source_snippet, @match_reasons, COALESCE(@discovered_at, date('now')), @filter_failures, COALESCE(@verification_status, 'confirmed'))`
    )
    .run({
      company: s.company,
      role: s.role,
      link: s.link ?? null,
      location: s.location ?? null,
      date_posted: s.date_posted ?? null,
      source_snippet: s.source_snippet ?? null,
      match_reasons: s.match_reasons ?? null,
      discovered_at: s.discovered_at ?? null,
      filter_failures: s.filter_failures?.length ? JSON.stringify(s.filter_failures) : null,
      verification_status: s.verification_status ?? null,
    });
  return getSuggestedApplication(Number(info.lastInsertRowid))!;
}

export function dismissSuggestedApplication(id: number): SuggestedApplication {
  db.prepare(`UPDATE suggested_applications SET status = 'dismissed' WHERE id = ?`).run(id);
  return getSuggestedApplication(id)!;
}

export function promoteSuggestedApplication(
  id: number,
  overrides?: Partial<NewApplication>
): { ok: true; application: Application } | { ok: false; reason: string } {
  const suggestion = getSuggestedApplication(id);
  if (!suggestion) return { ok: false, reason: `Suggestion ${id} not found` };
  if (suggestion.status !== "pending") {
    return { ok: false, reason: `Suggestion ${id} is already "${suggestion.status}"` };
  }

  const existing = findExistingApplication(suggestion.company, suggestion.role, suggestion.link);
  if (existing) {
    return {
      ok: false,
      reason: `Already tracked: ${existing.company} — ${existing.role} (status: ${existing.status}).`,
    };
  }

  const application = insertApplication({
    company: suggestion.company,
    role: suggestion.role,
    link: suggestion.link,
    location: suggestion.location,
    date_posted: suggestion.date_posted,
    source: "search",
    notes: suggestion.match_reasons ? `Found via internship search: ${suggestion.match_reasons}` : null,
    ...overrides,
  });

  db.prepare(
    `UPDATE suggested_applications SET status = 'added', promoted_application_id = ? WHERE id = ?`
  ).run(application.id, id);

  return { ok: true, application };
}
