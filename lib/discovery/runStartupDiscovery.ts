import { getPreferences } from "@/lib/db/preferences";
import { getDiscoveryPreferences } from "@/lib/db/discoveryPreferences";
import { listContacts } from "@/lib/db/contacts";
import { listSuggestedContacts } from "@/lib/db/suggestedContacts";
import { runSkill } from "@/lib/claudeCode/runSkill";
import type { SuggestedContact } from "@/lib/db/types";

// Company-first counterpart to runContactDiscovery: unlimited runs per day, capped at
// 5 results per run (matches the startup-discovery skill's step 5 cap).
const MAX_CANDIDATES = 5;

const RESULT_SCHEMA = {
  type: "object",
  properties: {
    addedCount: { type: "integer" },
    note: { type: "string" },
  },
  required: ["addedCount", "note"],
  additionalProperties: false,
} as const;

export interface StartupDiscoveryRunResult {
  added: SuggestedContact[];
  note: string;
}

/**
 * Searches for startups in the user's target fields, then for people working at those
 * startups, cross-checking Rutgers alumni as one signal. Unlimited runs per day; capped
 * at 5 results per run. Writes into the same suggested_contacts queue as
 * runContactDiscovery.
 */
export async function runStartupDiscovery(customQuery?: string): Promise<StartupDiscoveryRunResult> {
  // Cheap pre-flight guard in TS so we don't spend a claude -p invocation when there's
  // nothing to match against.
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
      "Nothing to match against yet — set preferences, add a contact, or describe what kind of startups you're looking for."
    );
  }

  // Snapshot the highest existing suggestion id so we can isolate exactly what this run
  // inserts, regardless of how discovered_at buckets land across repeated same-day runs.
  const maxIdBefore = Math.max(0, ...listSuggestedContacts().map((c) => c.id));

  const prompt = [
    `This is a headless/automated invocation. max_candidates: ${MAX_CANDIDATES}.`,
    customQuery?.trim() ? `custom_query: ${customQuery.trim()}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const result = await runSkill<{ addedCount: number; note: string }>({
    skill: "startup-discovery",
    prompt,
    jsonSchema: RESULT_SCHEMA,
    allowedTools: ["Bash(npx tsx scripts/db-cli.ts:*)", "WebSearch"],
    timeoutMs: 180_000,
  });

  // Re-query the DB (source of truth) for whatever the skill actually wrote, rather than
  // trusting the model's self-reported addedCount to build the returned rows.
  const added = listSuggestedContacts()
    .filter((c) => c.id > maxIdBefore)
    .slice(0, MAX_CANDIDATES);

  return { added, note: result.note };
}
