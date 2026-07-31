import { db } from "./index";
import type { DiscoveryPreferences, RequireConnection } from "./types";

export function getDiscoveryPreferences(): DiscoveryPreferences {
  const existing = db.prepare("SELECT * FROM discovery_preferences WHERE id = 1").get() as
    | DiscoveryPreferences
    | undefined;
  if (existing) return existing;

  db.prepare(
    `INSERT INTO discovery_preferences (id, target_schools, require_connection, exclude_recruiters, notes)
     VALUES (1, @target_schools, @require_connection, @exclude_recruiters, @notes)`
  ).run({
    target_schools: JSON.stringify([]),
    require_connection: "any",
    exclude_recruiters: 0,
    notes: null,
  });
  return db.prepare("SELECT * FROM discovery_preferences WHERE id = 1").get() as DiscoveryPreferences;
}

export function updateDiscoveryPreferences(patch: {
  target_schools?: string[];
  require_connection?: RequireConnection;
  exclude_recruiters?: boolean;
  notes?: string | null;
}): DiscoveryPreferences {
  const current = getDiscoveryPreferences();
  db.prepare(
    `UPDATE discovery_preferences SET
       target_schools=@target_schools, require_connection=@require_connection,
       exclude_recruiters=@exclude_recruiters, notes=@notes, updated_at=datetime('now')
     WHERE id = 1`
  ).run({
    target_schools: JSON.stringify(patch.target_schools ?? JSON.parse(current.target_schools)),
    require_connection: patch.require_connection ?? current.require_connection,
    exclude_recruiters:
      patch.exclude_recruiters !== undefined
        ? patch.exclude_recruiters
          ? 1
          : 0
        : current.exclude_recruiters,
    notes: patch.notes ?? current.notes,
  });
  return getDiscoveryPreferences();
}
