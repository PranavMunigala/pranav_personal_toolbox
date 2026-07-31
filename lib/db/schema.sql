-- Personal Toolbox schema. SQLite. Applied idempotently via CREATE TABLE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  linkedin_url TEXT UNIQUE,
  email TEXT,
  company TEXT,
  title TEXT,
  seniority_tier TEXT NOT NULL DEFAULT 'mid' CHECK (seniority_tier IN ('peer', 'mid', 'senior')),
  industry_tags TEXT NOT NULL DEFAULT '[]', -- JSON array of strings
  status TEXT NOT NULL DEFAULT 'not_contacted'
    CHECK (status IN ('not_contacted', 'drafted', 'sent', 'coffee_chatted', 'no_response')),
  profile_text TEXT, -- raw pasted LinkedIn About/Experience text
  notes TEXT,
  date_added TEXT NOT NULL DEFAULT (datetime('now')),
  date_last_contacted TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL,
  seniority_tier_used TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  link TEXT,
  location TEXT,
  date_posted TEXT,
  date_applied TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'applied'
    CHECK (status IN ('applied', 'oa', 'interview', 'follow_up', 'offer', 'rejected')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'search')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS application_contacts (
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  PRIMARY KEY (application_id, contact_id)
);

CREATE TABLE IF NOT EXISTS target_companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  commute_tier TEXT NOT NULL, -- e.g. 'under_30', '30_45', '45_60', '60_75'
  notes TEXT
);

CREATE TABLE IF NOT EXISTS preferences (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  industries TEXT NOT NULL DEFAULT '[]', -- JSON array
  roles TEXT NOT NULL DEFAULT '[]',      -- JSON array
  seniority_focus TEXT NOT NULL DEFAULT '[]', -- JSON array
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Candidate contacts found by the contact-discovery skill, pending human review.
-- Never a source of truth on its own: promoting one always goes through
-- lib/db/contacts.ts::insertContact, same as any other new contact.
CREATE TABLE IF NOT EXISTS suggested_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT,
  title TEXT,
  linkedin_url TEXT,
  source_snippet TEXT,
  match_reasons TEXT,
  discovered_at TEXT NOT NULL DEFAULT (date('now')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'added', 'dismissed')),
  promoted_contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS discovery_preferences (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  target_schools TEXT NOT NULL DEFAULT '[]', -- JSON array, e.g. ["Rutgers"]
  require_connection TEXT NOT NULL DEFAULT 'any'
    CHECK (require_connection IN ('any', 'connected_only', 'not_connected_only')),
  exclude_recruiters INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resume (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  raw_text TEXT,
  keywords TEXT NOT NULL DEFAULT '[]', -- JSON array, extracted locally (no LLM call)
  filename TEXT,
  uploaded_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_applications_company ON applications(company);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_suggested_contacts_discovered_at ON suggested_contacts(discovered_at);
CREATE INDEX IF NOT EXISTS idx_suggested_contacts_status ON suggested_contacts(status);
