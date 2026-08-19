import { getPreferences } from "@/lib/db/preferences";
import { getDiscoveryPreferences, touchDiscoveryRunTimestamp } from "@/lib/db/discoveryPreferences";
import { listContacts } from "@/lib/db/contacts";
import { listSuggestedContacts } from "@/lib/db/suggestedContacts";
import { runSkill } from "@/lib/claudeCode/runSkill";
import type { SuggestedContact } from "@/lib/db/types";
import { parseSqliteUtc, formatDateTime } from "@/lib/dates";

// "Specific" discovery (customQuery-driven, from the Run Contact Discovery card) can be
// run as many times as the user likes, but returns at most 3 per run.
const SPECIFIC_MAX_CANDIDATES = 3;
// "Daily" discovery (general sweep off preferences+existing contacts alone) is broader — up to 5 —
// but gated to once per 24h so it can't be spammed for cost reasons.
const DAILY_MAX_CANDIDATES = 5;
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

export interface DiscoveryRunResult {
  added: SuggestedContact[];
  note: string;
}

export interface DiscoveryRateLimitStatus {
  isRateLimited: boolean;
  nextAvailableLabel: string | null;
}

export function getDiscoveryRateLimitStatus(lastRunAt: string | null): DiscoveryRateLimitStatus {
  if (!lastRunAt) return { isRateLimited: false, nextAvailableLabel: null };
  const lastRunMs = parseSqliteUtc(lastRunAt).getTime();
  const nextAvailableMs = lastRunMs + RUN_COOLDOWN_MS;
  if (nextAvailableMs <= Date.now()) return { isRateLimited: false, nextAvailableLabel: null };
  return {
    isRateLimited: true,
    nextAvailableLabel: formatDateTime(new Date(nextAvailableMs).toISOString()),
  };
}

async function runDiscoveryCore(
  customQuery: string | undefined,
  maxCandidates: number
): Promise<DiscoveryRunResult> {
  // Cheap pre-flight guard in TS so we don't spend a claude -p invocation when there's
  // nothing to match against — mirrors the original OpenRouter-era check.
  const preferences = getPreferences();
  const discoveryPreferences = getDiscoveryPreferences();
  const industries = JSON.parse(preferences.industries) as string[];
  const roles = JSON.parse(preferences.roles) as string[];
  const hasExistingContacts = listContacts().length > 0;
  if (
    industries.length === 0 &&
    roles.length === 0 &&
    !discoveryPreferences.notes &&
    !customQuery?.trim() &&
    !hasExistingContacts
  ) {
    throw new Error(
      "Nothing to match against yet — set preferences, add a contact, or describe who you're looking for."
    );
  }

  // Snapshot the highest existing suggestion id so we can isolate exactly what this run
  // inserts, regardless of how discovered_at buckets land across repeated same-day runs.
  const maxIdBefore = Math.max(0, ...listSuggestedContacts().map((c) => c.id));

  const prompt = [
    `This is a headless/automated invocation. max_candidates: ${maxCandidates}.`,
    customQuery?.trim() ? `custom_query: ${customQuery.trim()}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const result = await runSkill<{ addedCount: number; note: string }>({
    skill: "contact-discovery",
    prompt,
    jsonSchema: RESULT_SCHEMA,
    allowedTools: ["Bash(npx tsx scripts/db-cli.ts:*)", "WebSearch"],
    timeoutMs: 180_000,
  });

  // Re-query the DB (source of truth) for whatever the skill actually wrote, rather than
  // trusting the model's self-reported addedCount to build the returned rows.
  const added = listSuggestedContacts()
    .filter((c) => c.id > maxIdBefore)
    .slice(0, maxCandidates);

  return { added, note: result.note };
}

/**
 * Specific/ad-hoc discovery — driven by a custom query the user types in. Unlimited runs
 * per day; capped at 3 results per run.
 */
export async function runContactDiscovery(customQuery?: string): Promise<DiscoveryRunResult> {
  return runDiscoveryCore(customQuery, SPECIFIC_MAX_CANDIDATES);
}

/**
 * General daily sweep — off preferences+existing contacts alone, no custom query. Gated to once per
 * 24h (checked and stamped here); capped at 5 results.
 */
export async function runDailyDiscovery(): Promise<DiscoveryRunResult> {
  const discoveryPreferences = getDiscoveryPreferences();
  const rateLimit = getDiscoveryRateLimitStatus(discoveryPreferences.last_discovery_run_at);
  if (rateLimit.isRateLimited) {
    throw new Error(
      `Already ran daily discovery today — next run available at ${rateLimit.nextAvailableLabel}.`
    );
  }

  const result = await runDiscoveryCore(undefined, DAILY_MAX_CANDIDATES);
  touchDiscoveryRunTimestamp();
  return result;
}
