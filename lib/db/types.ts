export type SeniorityTier = "peer" | "mid" | "senior";

export type ContactStatus =
  | "not_contacted"
  | "drafted"
  | "sent"
  | "coffee_chatted"
  | "no_response";

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
}

export type CommuteTier = "under_30" | "30_45" | "45_60" | "60_75";

export interface TargetCompany {
  id: number;
  name: string;
  location: string | null;
  commute_tier: CommuteTier;
  notes: string | null;
}

export interface Preferences {
  id: 1;
  industries: string; // JSON-encoded string[]
  roles: string; // JSON-encoded string[]
  seniority_focus: string; // JSON-encoded string[]
  notes: string | null;
  updated_at: string;
}
