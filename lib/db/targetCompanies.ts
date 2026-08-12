import { db } from "./index";
import type { TargetCompany } from "./types";

export function listTargetCompanies(): TargetCompany[] {
  return db
    .prepare("SELECT * FROM target_companies ORDER BY commute_tier ASC, name ASC")
    .all() as TargetCompany[];
}

export function findTargetCompanyByName(name: string): TargetCompany | undefined {
  return db
    .prepare("SELECT * FROM target_companies WHERE name = ? COLLATE NOCASE")
    .get(name) as TargetCompany | undefined;
}

export function deleteTargetCompany(id: number): void {
  db.prepare("DELETE FROM target_companies WHERE id = ?").run(id);
}

export function upsertTargetCompany(
  c: Omit<TargetCompany, "id" | "location" | "notes" | "careers_url"> & {
    location?: string | null;
    notes?: string | null;
    careers_url?: string | null;
  }
): void {
  db.prepare(
    `INSERT INTO target_companies (name, location, commute_tier, notes, careers_url)
     VALUES (@name, @location, @commute_tier, @notes, @careers_url)
     ON CONFLICT(name) DO UPDATE SET
       location=excluded.location, commute_tier=excluded.commute_tier, notes=excluded.notes,
       careers_url=excluded.careers_url`
  ).run({
    ...c,
    location: c.location ?? null,
    notes: c.notes ?? null,
    careers_url: c.careers_url ?? null,
  });
}
