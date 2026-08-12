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

-- Chat turns for the "refine this draft" box on a contact's detail page. Scoped by
-- contact_id (there's one running conversation per contact, not per draft) since each
-- refinement replaces "the latest draft" with a new email_drafts row rather than
-- editing in place. resulting_draft_id links an assistant turn to the draft version it
-- produced (null if the turn was a refusal).
CREATE TABLE IF NOT EXISTS email_draft_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  resulting_draft_id INTEGER REFERENCES email_drafts(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_email_draft_chat_messages_contact ON email_draft_chat_messages(contact_id);

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
  notes TEXT,
  careers_url TEXT -- known-good direct ATS/job-board link, used by internship-search to fetch directly
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

-- Candidate postings found by internship search (daily target-company refresh or a
-- specific query), pending human review. Never a source of truth on its own: promoting
-- one always goes through lib/db/applications.ts::insertApplication, same pattern as
-- suggested_contacts -> insertContact.
CREATE TABLE IF NOT EXISTS suggested_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  link TEXT,
  location TEXT,
  date_posted TEXT,
  source_snippet TEXT,
  match_reasons TEXT,
  discovered_at TEXT NOT NULL DEFAULT (date('now')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'added', 'dismissed')),
  promoted_application_id INTEGER REFERENCES applications(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  filter_failures TEXT, -- JSON array of reason strings; null if it passed all enabled filters
  verification_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (verification_status IN ('confirmed', 'plausible'))
);

CREATE INDEX IF NOT EXISTS idx_suggested_applications_discovered_at ON suggested_applications(discovered_at);
CREATE INDEX IF NOT EXISTS idx_suggested_applications_status ON suggested_applications(status);

-- Toggleable/editable hardcoded internship-search filters. Singleton row (id=1),
-- defaults matching the originally-specified always-on rules. Read fresh on every
-- search run (lib/discovery/internshipFilters.ts) so edits apply live.
CREATE TABLE IF NOT EXISTS internship_filter_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  role_type_enabled INTEGER NOT NULL DEFAULT 1,
  paid_only_enabled INTEGER NOT NULL DEFAULT 1,
  location_enabled INTEGER NOT NULL DEFAULT 1,
  location_state TEXT NOT NULL DEFAULT 'NJ',
  seniority_enabled INTEGER NOT NULL DEFAULT 1,
  eligible_class_years TEXT NOT NULL DEFAULT '["sophomore","junior"]', -- JSON array
  relevance_enabled INTEGER NOT NULL DEFAULT 1,
  relevance_min_score INTEGER NOT NULL DEFAULT 3,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Follow-up chat transcript per research profile (company/product/topic), shown in
-- the sidebar chat on a profile's detail page. Keyed by category+slug rather than a
-- profile id since profiles themselves aren't DB rows — the markdown files under
-- research/ are the source of truth for profile content, this table only stores the
-- conversation about them.
CREATE TABLE IF NOT EXISTS research_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  slug TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_research_chat_messages_profile ON research_chat_messages(category, slug);

-- One entry per profile-changing action (research run, document import, chat save,
-- incorporate), reusing the summary text already generated by the biomed-research
-- skill's `note` field at write time rather than a new LLM call. Keyed by
-- category+slug, same pattern as research_chat_messages above.
CREATE TABLE IF NOT EXISTS research_profile_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('research', 'document', 'chat', 'incorporate')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_research_profile_history_profile ON research_profile_history(category, slug);

CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_applications_company ON applications(company);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_suggested_contacts_discovered_at ON suggested_contacts(discovered_at);
CREATE INDEX IF NOT EXISTS idx_suggested_contacts_status ON suggested_contacts(status);
