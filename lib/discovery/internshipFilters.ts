// Hardcoded eligibility filters, isolated from search/fetch so criteria are easy to
// tune later without touching the API-calling code. These act on structured fields the
// model is required to emit per candidate (see resultsSchema in runInternshipSearch.ts)
// rather than trusting prose instructions alone.
//
// Each check is independently toggleable/editable (see lib/db/internshipFilterSettings.ts)
// and returns a human-readable reason on failure, so a candidate that doesn't fully
// match isn't just silently dropped — it can be surfaced to the user with the specific
// reason(s), for them to override or dismiss.

import type { InternshipFilterSettings } from "@/lib/db/types";

export type RoleType = "internship" | "co_op" | "other";
export type Compensation = "paid" | "unpaid" | "unknown";
export type Term = "fall" | "winter" | "spring" | "summer" | "unknown";

export interface FilterableCandidate {
  role_type: RoleType;
  compensation: Compensation;
  term: Term;
  state: string | null;
  eligible_class_years: string[];
  relevance_score: number;
}

export interface FilterCheckResult {
  pass: boolean;
  failedReasons: string[];
}

/**
 * Checks a candidate against every enabled filter, collecting a specific reason for
 * each one it fails (rather than short-circuiting on the first failure) so the UI can
 * show the full picture of why a posting didn't fully match.
 */
export function checkHardcodedFilters(
  c: FilterableCandidate,
  settings: InternshipFilterSettings
): FilterCheckResult {
  const reasons: string[] = [];

  if (settings.role_type_enabled && c.role_type !== "internship" && c.role_type !== "co_op") {
    reasons.push(`Role type: ${c.role_type}, needed internship or co-op`);
  }

  if (settings.paid_only_enabled && c.compensation !== "paid") {
    reasons.push(`Compensation: ${c.compensation}, needed paid`);
  }

  if (settings.location_enabled && c.term !== "summer" && c.state !== settings.location_state) {
    reasons.push(
      `Location: ${c.state ?? "remote/unknown"}, needed ${settings.location_state} for ${c.term} term`
    );
  }

  if (settings.seniority_enabled) {
    const allowedYears = new Set(
      (JSON.parse(settings.eligible_class_years) as string[]).map((y) => y.toLowerCase())
    );
    const eligible = c.eligible_class_years.some((y) => allowedYears.has(y.toLowerCase()));
    if (!eligible) {
      reasons.push(
        `Seniority: open to ${c.eligible_class_years.join(", ") || "unspecified"}, not restricted to ${Array.from(allowedYears).join("/")}`
      );
    }
  }

  if (settings.relevance_enabled && c.relevance_score < settings.relevance_min_score) {
    reasons.push(
      `Resume relevance: score ${c.relevance_score}/5, needed at least ${settings.relevance_min_score}`
    );
  }

  return { pass: reasons.length === 0, failedReasons: reasons };
}
