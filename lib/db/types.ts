export type SeniorityTier = "peer" | "mid" | "senior";

export type ContactStatus =
  | "not_contacted"
  | "drafted"
  | "sent"
  | "coffee_chatted"
  | "no_response";

export type ConnectionStatus = "not_connected" | "pending" | "connected";

export interface Contact {
  id: number;
  name: string;
  linkedin_url: string | null;
  email: string | null;
  company: string | null;
  title: string | null;
  seniority_tier: SeniorityTier;
  industry_tags: string; // JSON-encoded string[]
  status: ContactStatus;
  profile_text: string | null;
  notes: string | null;
  date_added: string;
  date_last_contacted: string | null;
  created_at: string;
  updated_at: string;
  phone: string | null;
  is_recruiter: number; // SQLite boolean: 0/1
  connection_status: ConnectionStatus;
  alma_mater: string | null;
  is_close_connection: number; // SQLite boolean: 0/1
  relation: string | null; // e.g. "Theta Tau", "friend", "mom's friend"
}

export type ApplicationStatus =
  | "applied"
  | "oa"
  | "interview"
  | "follow_up"
  | "offer"
  | "rejected";

export interface Application {
  id: number;
  company: string;
  role: string;
  link: string | null;
  location: string | null;
  date_posted: string | null;
  date_applied: string;
  status: ApplicationStatus;
  source: "manual" | "search";
  notes: string | null;
  created_at: string;
  updated_at: string;
  interview_contact_name: string | null;
  interview_contact_email: string | null;
}

export type CommuteTier = "under_30" | "30_45" | "45_60" | "60_75";

export interface TargetCompany {
  id: number;
  name: string;
  location: string | null;
  commute_tier: CommuteTier;
  notes: string | null;
  careers_url: string | null; // known-good direct ATS/job-board link
}

export interface Preferences {
  id: 1;
  industries: string; // JSON-encoded string[]
  roles: string; // JSON-encoded string[]
  seniority_focus: string; // JSON-encoded string[]
  notes: string | null;
  updated_at: string;
  last_internship_refresh_at: string | null;
}

export interface EmailDraft {
  id: number;
  contact_id: number;
  subject: string | null;
  body: string;
  seniority_tier_used: SeniorityTier;
  created_at: string;
}

export type SuggestedContactStatus = "pending" | "added" | "dismissed";

export interface SuggestedContact {
  id: number;
  name: string;
  company: string | null;
  title: string | null;
  linkedin_url: string | null;
  source_snippet: string | null;
  match_reasons: string | null;
  discovered_at: string; // DATE, groups a discovery run into a "batch"
  status: SuggestedContactStatus;
  promoted_contact_id: number | null;
  created_at: string;
}

export type RequireConnection = "any" | "connected_only" | "not_connected_only";

export interface DiscoveryPreferences {
  id: 1;
  target_schools: string; // JSON-encoded string[]
  require_connection: RequireConnection;
  exclude_recruiters: number; // 0/1
  notes: string | null;
  updated_at: string;
  last_discovery_run_at: string | null;
}

export type SuggestedApplicationStatus = "pending" | "added" | "dismissed";

export type SuggestedApplicationVerificationStatus = "confirmed" | "plausible";

export interface SuggestedApplication {
  id: number;
  company: string;
  role: string;
  link: string | null;
  location: string | null;
  date_posted: string | null;
  source_snippet: string | null;
  match_reasons: string | null;
  discovered_at: string; // DATE, groups a search run into a "batch"
  status: SuggestedApplicationStatus;
  promoted_application_id: number | null;
  created_at: string;
  filter_failures: string | null; // JSON-encoded string[] of reasons; null if it passed all enabled filters
  verification_status: SuggestedApplicationVerificationStatus; // "confirmed" = live-verified open; "plausible" = fetch blocked but corroborated
}

export interface InternshipFilterSettings {
  id: 1;
  role_type_enabled: number; // 0/1
  paid_only_enabled: number; // 0/1
  location_enabled: number; // 0/1
  location_state: string;
  seniority_enabled: number; // 0/1
  eligible_class_years: string; // JSON-encoded string[]
  relevance_enabled: number; // 0/1
  relevance_min_score: number;
  updated_at: string;
}

export type ResearchChatRole = "user" | "assistant";

export interface ResearchChatMessage {
  id: number;
  category: string;
  slug: string;
  role: ResearchChatRole;
  content: string;
  created_at: string;
}

export type EmailDraftChatRole = "user" | "assistant";

export interface EmailDraftChatMessage {
  id: number;
  contact_id: number;
  role: EmailDraftChatRole;
  content: string;
  resulting_draft_id: number | null;
  created_at: string;
}

export type ResearchProfileHistorySource = "research" | "document" | "chat" | "incorporate";

export interface ResearchProfileHistoryEntry {
  id: number;
  category: string;
  slug: string;
  summary: string;
  source: ResearchProfileHistorySource;
  created_at: string;
}

export interface ScoutSession {
  id: number;
  application_id: number | null;
  company: string;
  role: string;
  job_posting_url: string | null;
  job_posting_text: string;
  resume_source_text: string;
  extra_context_text: string | null;
  created_at: string;
}

export interface GapAnalysisItem {
  requirement: string;
  evidence_in_resume: boolean;
  note: string;
}

export interface GapAnalysis {
  must_haves: GapAnalysisItem[];
  nice_to_haves: GapAnalysisItem[];
}

export interface ResumeDraft {
  id: number;
  scout_session_id: number;
  tailored_resume_markdown: string;
  gap_analysis: string; // JSON-encoded GapAnalysis
  created_at: string;
}

export type ResumeDraftChatRole = "user" | "assistant";

export interface ResumeDraftChatMessage {
  id: number;
  scout_session_id: number;
  role: ResumeDraftChatRole;
  content: string;
  resulting_draft_id: number | null;
  created_at: string;
}

export interface CoverLetterResearchSource {
  url: string;
  note: string;
}

export interface CoverLetterDraft {
  id: number;
  scout_session_id: number;
  cover_letter_markdown: string;
  research_sources: string; // JSON-encoded CoverLetterResearchSource[]
  word_count: number;
  created_at: string;
}

export type CoverLetterChatRole = "user" | "assistant";

export interface CoverLetterChatMessage {
  id: number;
  scout_session_id: number;
  role: CoverLetterChatRole;
  content: string;
  resulting_draft_id: number | null;
  created_at: string;
}
