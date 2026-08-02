import { getPreferences, touchInternshipRefreshTimestamp } from "@/lib/db/preferences";
import { listSuggestedApplications } from "@/lib/db/suggestedApplications";
import { runSkill } from "@/lib/claudeCode/runSkill";
import type { SuggestedApplication } from "@/lib/db/types";

// Feature 1 ("Run internship search") — on-demand casual browsing, unlimited runs/day,
// always broad (never restricted to target companies), up to 5 fully-passing results.
const FEATURE1_MAX_RESULTS = 5;
// Feature 2 ("Daily suggested postings") — always target-companies-only, gated to
// once/24h. No meaningful cap ("however many are new"); this is just a sanity bound
// given the target company list is finite (~18 companies today).
const FEATURE2_MAX_RESULTS = 20;
const RUN_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const RESULT_SCHEMA = {
  type: "object",
  properties: {
    addedCount: { type: "integer" },
    note: { type: "string" },
  },
  required: ["addedCount", "note"],
  additionalProperties: false,
} as const;

export interface InternshipSearchResult {
  added: SuggestedApplication[];
  note: string;
}

export interface InternshipRateLimitStatus {
  isRateLimited: boolean;
  nextAvailableLabel: string | null;
}

export function getInternshipRateLimitStatus(lastRunAt: string | null): InternshipRateLimitStatus {
  if (!lastRunAt) return { isRateLimited: false, nextAvailableLabel: null };
  const lastRunMs = new Date(lastRunAt.replace(" ", "T") + "Z").getTime();
  const nextAvailableMs = lastRunMs + RUN_COOLDOWN_MS;
  if (nextAvailableMs <= Date.now()) return { isRateLimited: false, nextAvailableLabel: null };
  return {
    isRateLimited: true,
    nextAvailableLabel: new Date(nextAvailableMs).toLocaleString(),
  };
}

async function runPipeline(
  customQuery: string | undefined,
  targetCompaniesOnly: boolean,
  maxResults: number
): Promise<InternshipSearchResult> {
  // Snapshot the highest existing suggestion id so we can isolate exactly what this run
  // inserts, regardless of how discovered_at buckets land across repeated same-day runs.
  const maxIdBefore = Math.max(0, ...listSuggestedApplications().map((a) => a.id));

  const prompt = [
    `This is a headless/automated invocation. target_companies_only: ${targetCompaniesOnly}. max_results: ${maxResults}.`,
    customQuery?.trim() ? `custom_query: ${customQuery.trim()}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const result = await runSkill<{ addedCount: number; note: string }>({
    skill: "internship-search",
    prompt,
    jsonSchema: RESULT_SCHEMA,
    allowedTools: [
      "Bash(npx tsx scripts/db-cli.ts:*)",
      "Bash(npx tsx scripts/internship-filter-cli.ts:*)",
      "WebSearch",
      "WebFetch",
    ],
    timeoutMs: 480_000,
  });

  // Re-query the DB (source of truth) for whatever the skill actually wrote, rather than
  // trusting the model's self-reported count to build the returned rows. Defensively
  // exclude anything with filter_failures set — only fully-passing postings are surfaced.
  const added = listSuggestedApplications()
    .filter((a) => a.id > maxIdBefore)
    .filter((a) => !a.filter_failures);

  return { added, note: result.note };
}

/**
 * Feature 1 — on-demand casual browsing ("find more to apply to"). Always broad, never
 * restricted to target companies. Unlimited runs/day; fixed at 5 results per run.
 */
export async function runInternshipSearch(customQuery?: string): Promise<InternshipSearchResult> {
  return runPipeline(customQuery, false, FEATURE1_MAX_RESULTS);
}

/**
 * Feature 2 — passive refresh against the target-company list only. Gated to once/24h
 * (checked and stamped here); "however many are new" up to a generous sanity cap.
 */
export async function runDailyInternshipRefresh(): Promise<InternshipSearchResult> {
  const preferences = getPreferences();
  const rateLimit = getInternshipRateLimitStatus(preferences.last_internship_refresh_at);
  if (rateLimit.isRateLimited) {
    throw new Error(
      `Already refreshed today — next refresh available at ${rateLimit.nextAvailableLabel}.`
    );
  }

  const result = await runPipeline(undefined, true, FEATURE2_MAX_RESULTS);
  touchInternshipRefreshTimestamp();
  return result;
}
