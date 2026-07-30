import { db } from "./index";
import type { Application, ApplicationStatus } from "./types";
import type { Contact } from "./types";

export interface NewApplication {
  company: string;
  role: string;
  link?: string | null;
  location?: string | null;
  date_posted?: string | null;
  date_applied?: string;
  status?: ApplicationStatus;
  source?: "manual" | "search";
  notes?: string | null;
}

export function listApplications(): Application[] {
  return db
    .prepare("SELECT * FROM applications ORDER BY date_applied DESC")
    .all() as Application[];
}

export function getApplication(id: number): Application | undefined {
  return db.prepare("SELECT * FROM applications WHERE id = ?").get(id) as
    | Application
    | undefined;
}

/** Dedup by link if present, else by company+role (case-insensitive). */
export function findExistingApplication(
  company: string,
  role: string,
  link?: string | null
): Application | undefined {
  if (link) {
    const byLink = db
      .prepare("SELECT * FROM applications WHERE link = ?")
      .get(link) as Application | undefined;
    if (byLink) return byLink;
  }
  return db
    .prepare(
      "SELECT * FROM applications WHERE company = ? COLLATE NOCASE AND role = ? COLLATE NOCASE"
    )
    .get(company, role) as Application | undefined;
}

export function insertApplication(a: NewApplication): Application {
  const info = db
    .prepare(
      `INSERT INTO applications (company, role, link, location, date_posted, date_applied, status, source, notes)
       VALUES (@company, @role, @link, @location, @date_posted, COALESCE(@date_applied, datetime('now')), @status, @source, @notes)`
    )
    .run({
      company: a.company,
      role: a.role,
      link: a.link ?? null,
      location: a.location ?? null,
      date_posted: a.date_posted ?? null,
      date_applied: a.date_applied ?? null,
      status: a.status ?? "applied",
      source: a.source ?? "manual",
      notes: a.notes ?? null,
    });
  return getApplication(Number(info.lastInsertRowid))!;
}

export function updateApplicationStatus(id: number, status: ApplicationStatus): Application {
  db.prepare("UPDATE applications SET status=?, updated_at=datetime('now') WHERE id=?").run(
    status,
    id
  );
  return getApplication(id)!;
}

export function linkContactToApplication(applicationId: number, contactId: number): void {
  db.prepare(
    "INSERT OR IGNORE INTO application_contacts (application_id, contact_id) VALUES (?, ?)"
  ).run(applicationId, contactId);
}

export function getContactsForApplication(applicationId: number): Contact[] {
  return db
    .prepare(
      `SELECT c.* FROM contacts c
       JOIN application_contacts ac ON ac.contact_id = c.id
       WHERE ac.application_id = ?`
    )
    .all(applicationId) as Contact[];
}

export function deleteApplication(id: number): void {
  db.prepare("DELETE FROM applications WHERE id = ?").run(id);
}
