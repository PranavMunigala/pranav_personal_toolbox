import { db } from "./index";
import type { Preferences } from "./types";

const DEFAULT_INDUSTRIES = [
  "AI in healthcare",
  "Biomedical engineering",
  "Computational biology",
  "Medical devices",
  "Bioinformatics",
];

export function getPreferences(): Preferences {
  const existing = db.prepare("SELECT * FROM preferences WHERE id = 1").get() as
    | Preferences
    | undefined;
  if (existing) return existing;

  db.prepare(
    `INSERT INTO preferences (id, industries, roles, seniority_focus, notes)
     VALUES (1, @industries, @roles, @seniority_focus, @notes)`
  ).run({
    industries: JSON.stringify(DEFAULT_INDUSTRIES),
    roles: JSON.stringify([]),
    seniority_focus: JSON.stringify(["peer", "mid", "senior"]),
    notes: null,
  });
  return db.prepare("SELECT * FROM preferences WHERE id = 1").get() as Preferences;
}

export function updatePreferences(patch: {
  industries?: string[];
  roles?: string[];
  seniority_focus?: string[];
  notes?: string | null;
}): Preferences {
  const current = getPreferences();
  db.prepare(
    `UPDATE preferences SET
       industries=@industries, roles=@roles, seniority_focus=@seniority_focus, notes=@notes,
       updated_at=datetime('now')
     WHERE id = 1`
  ).run({
    industries: JSON.stringify(patch.industries ?? JSON.parse(current.industries)),
    roles: JSON.stringify(patch.roles ?? JSON.parse(current.roles)),
    seniority_focus: JSON.stringify(
      patch.seniority_focus ?? JSON.parse(current.seniority_focus)
    ),
    notes: patch.notes ?? current.notes,
  });
  return getPreferences();
}

export function touchInternshipRefreshTimestamp(): void {
  db.prepare(`UPDATE preferences SET last_internship_refresh_at = datetime('now') WHERE id = 1`).run();
}
