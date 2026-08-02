import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "toolbox.db");
const SCHEMA_PATH = path.join(process.cwd(), "lib", "db", "schema.sql");

declare global {
  var __toolboxDb: Database.Database | undefined;
}

// SQLite has no `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, so columns added to an
// existing table (as opposed to a whole new CREATE TABLE IF NOT EXISTS) go through
// this guard instead — safe to run on every connection.
function addMissingColumns(
  db: Database.Database,
  table: string,
  columns: Record<string, string>
) {
  const existing = new Set(
    (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(
      (r) => r.name
    )
  );
  for (const [name, def] of Object.entries(columns)) {
    if (!existing.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${def}`);
  }
}

const CONTACTS_NEW_COLUMNS: Record<string, string> = {
  phone: "TEXT",
  is_recruiter: "INTEGER NOT NULL DEFAULT 0",
  connection_status:
    "TEXT NOT NULL DEFAULT 'not_connected' CHECK (connection_status IN ('not_connected', 'pending', 'connected'))",
  alma_mater: "TEXT",
  is_close_connection: "INTEGER NOT NULL DEFAULT 0",
  relation: "TEXT",
};

const DISCOVERY_PREFERENCES_NEW_COLUMNS: Record<string, string> = {
  last_discovery_run_at: "TEXT",
};

const APPLICATIONS_NEW_COLUMNS: Record<string, string> = {
  interview_contact_name: "TEXT",
  interview_contact_email: "TEXT",
};

const PREFERENCES_NEW_COLUMNS: Record<string, string> = {
  last_internship_refresh_at: "TEXT",
};

const SUGGESTED_APPLICATIONS_NEW_COLUMNS: Record<string, string> = {
  filter_failures: "TEXT", // JSON array of reason strings; null if it passed all enabled filters
};

function createConnection(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(fs.readFileSync(SCHEMA_PATH, "utf-8"));
  addMissingColumns(db, "contacts", CONTACTS_NEW_COLUMNS);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_contacts_connection_status ON contacts(connection_status);`);
  addMissingColumns(db, "discovery_preferences", DISCOVERY_PREFERENCES_NEW_COLUMNS);
  addMissingColumns(db, "applications", APPLICATIONS_NEW_COLUMNS);
  addMissingColumns(db, "preferences", PREFERENCES_NEW_COLUMNS);
  addMissingColumns(db, "suggested_applications", SUGGESTED_APPLICATIONS_NEW_COLUMNS);
  return db;
}

// Reuse a single connection across Next.js dev hot-reloads.
export const db = globalThis.__toolboxDb ?? createConnection();
if (process.env.NODE_ENV !== "production") globalThis.__toolboxDb = db;
