import { db } from "./index";
import type { InternshipFilterSettings } from "./types";

export function getInternshipFilterSettings(): InternshipFilterSettings {
  const existing = db.prepare("SELECT * FROM internship_filter_settings WHERE id = 1").get() as
    | InternshipFilterSettings
    | undefined;
  if (existing) return existing;

  db.prepare(
    `INSERT INTO internship_filter_settings (id) VALUES (1)`
  ).run();
  return db
    .prepare("SELECT * FROM internship_filter_settings WHERE id = 1")
    .get() as InternshipFilterSettings;
}

export function updateInternshipFilterSettings(patch: {
  role_type_enabled?: boolean;
  paid_only_enabled?: boolean;
  location_enabled?: boolean;
  location_state?: string;
  seniority_enabled?: boolean;
  eligible_class_years?: string[];
  relevance_enabled?: boolean;
  relevance_min_score?: number;
}): InternshipFilterSettings {
  const current = getInternshipFilterSettings();
  db.prepare(
    `UPDATE internship_filter_settings SET
       role_type_enabled=@role_type_enabled, paid_only_enabled=@paid_only_enabled,
       location_enabled=@location_enabled, location_state=@location_state,
       seniority_enabled=@seniority_enabled, eligible_class_years=@eligible_class_years,
       relevance_enabled=@relevance_enabled, relevance_min_score=@relevance_min_score,
       updated_at=datetime('now')
     WHERE id = 1`
  ).run({
    role_type_enabled:
      patch.role_type_enabled !== undefined ? (patch.role_type_enabled ? 1 : 0) : current.role_type_enabled,
    paid_only_enabled:
      patch.paid_only_enabled !== undefined ? (patch.paid_only_enabled ? 1 : 0) : current.paid_only_enabled,
    location_enabled:
      patch.location_enabled !== undefined ? (patch.location_enabled ? 1 : 0) : current.location_enabled,
    location_state: patch.location_state ?? current.location_state,
    seniority_enabled:
      patch.seniority_enabled !== undefined ? (patch.seniority_enabled ? 1 : 0) : current.seniority_enabled,
    eligible_class_years: patch.eligible_class_years
      ? JSON.stringify(patch.eligible_class_years)
      : current.eligible_class_years,
    relevance_enabled:
      patch.relevance_enabled !== undefined ? (patch.relevance_enabled ? 1 : 0) : current.relevance_enabled,
    relevance_min_score: patch.relevance_min_score ?? current.relevance_min_score,
  });
  return getInternshipFilterSettings();
}
