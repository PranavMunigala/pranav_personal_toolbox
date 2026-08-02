import { listContacts } from "@/lib/db/contacts";
import { getPreferences } from "@/lib/db/preferences";
import {
  getDiscoveryPreferences,
  touchDiscoveryRunTimestamp,
} from "@/lib/db/discoveryPreferences";
import { getResume } from "@/lib/db/resume";
import { listSuggestedContacts, insertSuggestedContact } from "@/lib/db/suggestedContacts";
import { searchWeb, type TinyFishSearchResult } from "@/lib/tinyfish/client";
import { callOpenRouter, MODEL_HEAVY } from "@/lib/openrouter/client";
import type { SuggestedContact } from "@/lib/db/types";

// "Specific" discovery (customQuery-driven, from the Run Contact Discovery card) can be
// run as many times as the user likes, but returns at most 3 per run.
const SPECIFIC_MAX_CANDIDATES = 3;
// "Daily" discovery (general sweep off resume+preferences alone) is broader — up to 5 —
// but gated to once per 24h so it can't be spammed for cost reasons.
const DAILY_MAX_CANDIDATES = 5;
const RUN_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function candidatesSchema(maxCandidates: number) {
  return {
    name: "contact_candidates",
    schema: {
      type: "object",
      properties: {
        candidates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              company: { type: ["string", "null"] },
              title: { type: ["string", "null"] },
              linkedin_url: { type: ["string", "null"] },
              source_snippet: { type: ["string", "null"] },
              match_reasons: { type: ["string", "null"] },
            },
            required: ["name", "company", "title", "linkedin_url", "source_snippet", "match_reasons"],
            additionalProperties: false,
          },
        },
        note: {
          type: "string",
          description: `One sentence: how the search went (e.g. why fewer than ${maxCandidates} were found, or that nothing new turned up).`,
        },
      },
      required: ["candidates", "note"],
      additionalProperties: false,
    },
  } as const;
}

interface RawCandidate {
  name: string;
  company: string | null;
  title: string | null;
  linkedin_url: string | null;
  source_snippet: string | null;
  match_reasons: string | null;
}

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
  const lastRunMs = new Date(lastRunAt.replace(" ", "T") + "Z").getTime();
  const nextAvailableMs = lastRunMs + RUN_COOLDOWN_MS;
  if (nextAvailableMs <= Date.now()) return { isRateLimited: false, nextAvailableLabel: null };
  return {
    isRateLimited: true,
    nextAvailableLabel: new Date(nextAvailableMs).toLocaleString(),
  };
}

function formatSearchResults(results: TinyFishSearchResult[]): string {
  if (results.length === 0) return "(no results)";
  return results
    .slice(0, 8)
    .map((r) => `- ${r.title} — ${r.url}\n  ${r.snippet}`)
    .join("\n");
}

async function runDiscoveryCore(
  customQuery: string | undefined,
  maxCandidates: number
): Promise<DiscoveryRunResult> {
  const preferences = getPreferences();
  const discoveryPreferences = getDiscoveryPreferences();
  const resume = getResume();
  const existingContacts = listContacts();
  const pendingSuggestions = listSuggestedContacts();

  const industries = JSON.parse(preferences.industries) as string[];
  const roles = JSON.parse(preferences.roles) as string[];
  const targetSchools = JSON.parse(discoveryPreferences.target_schools) as string[];
  const excludeRecruiters = Boolean(discoveryPreferences.exclude_recruiters);
  const resumeKeywords = resume ? (JSON.parse(resume.keywords) as string[]) : [];

  if (
    industries.length === 0 &&
    roles.length === 0 &&
    resumeKeywords.length === 0 &&
    !discoveryPreferences.notes &&
    !customQuery?.trim()
  ) {
    throw new Error(
      "Nothing to match against yet — upload a resume, set preferences, or describe who you're looking for."
    );
  }

  const dedupUrls = new Set(
    [
      ...existingContacts.map((c) => c.linkedin_url),
      ...pendingSuggestions.map((s) => s.linkedin_url),
    ]
      .filter((url): url is string => Boolean(url))
      .map((url) => url.toLowerCase())
  );

  // Build a handful of real search queries in code, run them via TinyFish, then hand
  // the model the actual results to extract candidates from — decoupled from whichever
  // LLM preset is in play, same reasoning as verifyPosting.ts/enrichContacts.ts.
  const queries: string[] = [];
  if (customQuery?.trim()) {
    queries.push(`${customQuery.trim()} LinkedIn`);
  }
  const fieldTerms = [...industries, ...roles].slice(0, 3);
  for (const term of fieldTerms) {
    queries.push(`${term} LinkedIn profile ${targetSchools[0] ?? ""}`.trim());
  }
  if (targetSchools.length) {
    queries.push(`"${targetSchools[0]}" alumni ${fieldTerms[0] ?? "biomedical AI"} LinkedIn`);
  }
  if (queries.length === 0 && resumeKeywords.length) {
    queries.push(`${resumeKeywords.slice(0, 5).join(" ")} LinkedIn`);
  }

  const searchBatches = await Promise.all(
    queries.slice(0, 5).map(async (q) => {
      try {
        return { query: q, results: await searchWeb(q) };
      } catch {
        return { query: q, results: [] as TinyFishSearchResult[] };
      }
    })
  );

  const searchSection = searchBatches
    .map((b) => `Query: "${b.query}"\n${formatSearchResults(b.results)}`)
    .join("\n\n");

  const promptSections = [
    `Find up to ${maxCandidates} new people to suggest as cold-outreach contacts — people, not companies or job postings — using ONLY the real search results below (fetched just now). Never fabricate a detail that isn't grounded in what's actually shown.`,
    `Search results:\n${searchSection}`,
    industries.length || roles.length
      ? `Target industries/roles: ${[...industries, ...roles].join(", ") || "none set"}.`
      : null,
    resumeKeywords.length
      ? `Resume keywords (use as match signal, don't require every one): ${resumeKeywords.slice(0, 40).join(", ")}.`
      : null,
    targetSchools.length
      ? `Bias toward alumni of these schools working in the target field: ${targetSchools.join(", ")}.`
      : null,
    excludeRecruiters
      ? `Skip anyone whose title clearly reads as a recruiting/talent-acquisition role.`
      : null,
    discoveryPreferences.notes
      ? `Additional standing context from the user: ${discoveryPreferences.notes}`
      : null,
    customQuery?.trim() ? `For this run specifically, the user also asked: ${customQuery.trim()}` : null,
    dedupUrls.size
      ? `Do not suggest anyone whose LinkedIn URL matches one of these (already tracked or already suggested): ${Array.from(dedupUrls).join(", ")}.`
      : null,
    `Only include a candidate if you have at least a name plus company or title — don't invent missing fields. Omit linkedin_url if you can't confirm one from the search results; never guess a URL. Write a short, honest match_reasons grounded in what you found, and put the raw snippet text in source_snippet. If nothing new and relevant turns up, return an empty candidates array and say so in note.`,
  ].filter(Boolean);

  const content = await callOpenRouter({
    model: MODEL_HEAVY,
    content: promptSections.join("\n\n"),
    responseSchema: candidatesSchema(maxCandidates),
  });

  let parsed: { candidates: RawCandidate[]; note: string };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Couldn't parse the search result.");
  }

  const seenThisRun = new Set<string>();
  const added: SuggestedContact[] = [];
  for (const candidate of parsed.candidates) {
    if (added.length >= maxCandidates) break;
    if (!candidate.name?.trim()) continue;
    if (!candidate.company && !candidate.title) continue;

    const url = candidate.linkedin_url?.toLowerCase() ?? null;
    if (url) {
      if (dedupUrls.has(url) || seenThisRun.has(url)) continue;
      seenThisRun.add(url);
    }

    added.push(
      insertSuggestedContact({
        name: candidate.name.trim(),
        company: candidate.company,
        title: candidate.title,
        linkedin_url: candidate.linkedin_url,
        source_snippet: candidate.source_snippet,
        match_reasons: candidate.match_reasons,
      })
    );
  }

  return { added, note: parsed.note };
}

/**
 * Specific/ad-hoc discovery — driven by a custom query the user types in. Unlimited runs
 * per day; capped at 3 results per run.
 */
export async function runContactDiscovery(customQuery?: string): Promise<DiscoveryRunResult> {
  return runDiscoveryCore(customQuery, SPECIFIC_MAX_CANDIDATES);
}

/**
 * General daily sweep — off resume+preferences alone, no custom query. Gated to once per
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
