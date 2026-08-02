import { listApplications } from "@/lib/db/applications";
import { listTargetCompanies } from "@/lib/db/targetCompanies";
import { getPreferences, touchInternshipRefreshTimestamp } from "@/lib/db/preferences";
import { getResume } from "@/lib/db/resume";
import { listAllSuggestedApplicationKeys, insertSuggestedApplication } from "@/lib/db/suggestedApplications";
import { getInternshipFilterSettings } from "@/lib/db/internshipFilterSettings";
import { checkHardcodedFilters, type FilterableCandidate } from "./internshipFilters";
import { verifyPostings } from "./verifyPosting";
import { searchWeb, type TinyFishSearchResult } from "@/lib/tinyfish/client";
import { callOpenRouter, MODEL_HEAVY } from "@/lib/openrouter/client";
import type { SuggestedApplication, TargetCompany } from "@/lib/db/types";

// Feature 1 ("Run internship search") — on-demand casual browsing, unlimited runs/day,
// always broad (never restricted to target companies), up to 5 fully-passing results.
const FEATURE1_MAX_RESULTS = 5;
// Feature 2 ("Daily suggested postings") — always target-companies-only, gated to
// once/24h. No meaningful cap ("however many are new"); this is just a sanity bound
// given the target company list is finite (~18 companies today).
const FEATURE2_MAX_RESULTS = 20;
// Near-misses (failed ≥1 enabled filter but still verified live) are surfaced
// separately for review, capped independently so the review list can't balloon.
const MAX_NEAR_MISSES = 5;
const RUN_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const RESULTS_SCHEMA = {
  name: "internship_candidates",
  schema: {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            company: { type: "string" },
            role: { type: "string" },
            link: { type: ["string", "null"] },
            location: { type: ["string", "null"] },
            date_posted: { type: ["string", "null"] },
            source_snippet: { type: ["string", "null"] },
            match_reasons: { type: ["string", "null"] },
            role_type: { type: "string", enum: ["internship", "co_op", "other"] },
            compensation: { type: "string", enum: ["paid", "unpaid", "unknown"] },
            term: { type: "string", enum: ["fall", "winter", "spring", "summer", "unknown"] },
            state: { type: ["string", "null"] },
            eligible_class_years: { type: "array", items: { type: "string" } },
            relevance_score: { type: "integer" },
          },
          required: [
            "company",
            "role",
            "link",
            "location",
            "date_posted",
            "source_snippet",
            "match_reasons",
            "role_type",
            "compensation",
            "term",
            "state",
            "eligible_class_years",
            "relevance_score",
          ],
          additionalProperties: false,
        },
      },
      note: {
        type: "string",
        description:
          "One or two sentences: how the search went — including when zero results is the correct outcome, and flagging any source that was inaccessible or unreliable (e.g. Handshake requires a login, LinkedIn blocked a fetch).",
      },
    },
    required: ["results", "note"],
    additionalProperties: false,
  },
} as const;

interface RawResult extends FilterableCandidate {
  company: string;
  role: string;
  link: string | null;
  location: string | null;
  date_posted: string | null;
  source_snippet: string | null;
  match_reasons: string | null;
}

export interface InternshipSearchResult {
  added: SuggestedApplication[];
  nearMisses: SuggestedApplication[];
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

const HARDCODED_FILTERS_INSTRUCTION = `Every candidate MUST be classified with these structured fields, which are then enforced by code — be honest and conservative, don't round in the candidate's favor:
- role_type: "internship" or "co_op" only if that's genuinely what it is — "other" for full-time, new-grad, or associate roles (even if similarly named/titled). Full-time and new-grad roles are always rejected downstream, no exceptions.
- compensation: "paid" only if the posting confirms pay (stipend/hourly/salary) — "unpaid" if explicitly unpaid/volunteer, "unknown" if not stated. Unpaid and unknown are both rejected downstream.
- term: "fall", "winter", "spring", or "summer" based on when the internship runs — "unknown" if not stated.
- state: the two-letter US state the role is physically based in if determinable (e.g. "NJ"), null if remote-only/unclear/not in the US.
- eligible_class_years: array of class years the posting is open to, inferred from stated eligibility (e.g. ["sophomore","junior"], ["junior","senior"]) — best effort from what the posting actually says.
- relevance_score: 1-5 integer, how strong a fit this is for the candidate's resume/background — used only for ranking, not a hard filter.`;

const RESUME_FALLBACK_CONTEXT =
  "Biomedical Engineering major, Computer Science / Math minor, interests in AI/LLM applications, RAG engineering, computational biology / protein ML, biomedical data, and startup/deep-tech environments.";

function formatSearchResults(results: TinyFishSearchResult[]): string {
  if (results.length === 0) return "(no results)";
  return results
    .slice(0, 8)
    .map((r) => `- ${r.title} — ${r.url}\n  ${r.snippet}`)
    .join("\n");
}

/** Builds the real search queries to run via TinyFish, covering the named sources. */
function buildQueries(
  customQuery: string | undefined,
  targetCompaniesOnly: boolean,
  targetCompanies: TargetCompany[],
  fieldTerms: string[]
): string[] {
  if (targetCompaniesOnly) {
    return targetCompanies.map((c) => `${c.name} internship co-op apply 2026 2027`);
  }

  const topic = customQuery?.trim() || fieldTerms.slice(0, 2).join(" ") || RESUME_FALLBACK_CONTEXT;
  return [
    `${topic} internship`,
    `site:github.com SimplifyJobs Summer Internships ${customQuery?.trim() ?? ""}`.trim(),
    `site:github.com vanshb03 Summer Internships`,
    `site:ziprecruiter.com internship ${topic}`,
    `site:jobright.ai internship ${topic}`,
    `site:linkedin.com/jobs internship ${topic}`,
  ];
}

async function searchCandidates(
  customQuery: string | undefined,
  targetCompaniesOnly: boolean,
  maxResults: number
): Promise<{ results: RawResult[]; note: string }> {
  const preferences = getPreferences();
  const resume = getResume();
  const targetCompanies = listTargetCompanies();

  const industries = JSON.parse(preferences.industries) as string[];
  const roles = JSON.parse(preferences.roles) as string[];
  const resumeKeywords = resume ? (JSON.parse(resume.keywords) as string[]) : [];
  const fieldTerms = [...industries, ...roles];

  const queries = buildQueries(customQuery, targetCompaniesOnly, targetCompanies, fieldTerms);
  const searchBatches = await Promise.all(
    queries.map(async (q) => {
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

  const targetCompanyList = targetCompanies
    .map((c) => `${c.name} (${c.commute_tier}${c.location ? `, ${c.location}` : ""})`)
    .join("; ");

  const promptSections = [
    targetCompaniesOnly
      ? `Extract new internship/co-op postings from the search results below, but ONLY at these specific target companies: ${targetCompanyList || "none configured — say so in note and return no results"}. Discard anything from any other company.`
      : `Extract up to ${maxResults} internship/co-op postings from the search results below that best match this candidate's resume — rank by relevance_score, don't just take the first results found.`,
    `These are real search results, fetched just now, covering GitHub internship-tracking repos, ZipRecruiter, Jobright.ai, LinkedIn Jobs, and general web search:\n\n${searchSection}`,
    `Note on sources: LinkedIn results above may be thin or blocked (it aggressively blocks non-browser access) — if so, say that explicitly in note. Handshake is NOT searchable at all (school-login-gated, no public index) — if it would have been relevant, state that plainly in note.`,
    `Only extract postings actually present in the search results above, with a real URL — don't invent anything, and don't rely on prior knowledge beyond what's shown. Use null/"unknown" rather than guessing missing fields.`,
    HARDCODED_FILTERS_INSTRUCTION,
    industries.length || roles.length
      ? `Target industries/roles: ${[...industries, ...roles].join(", ")}.`
      : null,
    resumeKeywords.length
      ? `Resume keywords (use as match signal, don't require every one): ${resumeKeywords.slice(0, 40).join(", ")}.`
      : null,
    `Write a short, honest match_reasons grounded in the search result shown, and put the raw snippet in source_snippet. If nothing new and relevant turns up, return an empty results array and say so in note — that is a completely valid outcome, don't pad with weak matches.`,
  ].filter(Boolean);

  const content = await callOpenRouter({
    model: MODEL_HEAVY,
    content: promptSections.join("\n\n"),
    responseSchema: RESULTS_SCHEMA,
  });

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("Couldn't parse the search result.");
  }
}

async function runPipeline(
  customQuery: string | undefined,
  targetCompaniesOnly: boolean,
  maxResults: number
): Promise<InternshipSearchResult> {
  const existingApplications = listApplications();
  const allSuggestedKeys = listAllSuggestedApplicationKeys();
  const dedupKeys = new Set(
    [...existingApplications, ...allSuggestedKeys]
      .map((a) => [a.link?.toLowerCase(), `${a.company.toLowerCase()}::${a.role.toLowerCase()}`])
      .flat()
      .filter((k): k is string => Boolean(k))
  );

  const { results, note } = await searchCandidates(customQuery, targetCompaniesOnly, maxResults);

  const seenThisRun = new Set<string>();
  const dedupedCandidates: RawResult[] = [];
  for (const r of results) {
    if (!r.company?.trim() || !r.role?.trim()) continue;
    const key = `${r.company.toLowerCase()}::${r.role.toLowerCase()}`;
    const linkKey = r.link?.toLowerCase();
    if (dedupKeys.has(key) || (linkKey && dedupKeys.has(linkKey))) continue;
    if (seenThisRun.has(key)) continue;
    seenThisRun.add(key);
    dedupedCandidates.push(r);
  }

  const settings = getInternshipFilterSettings();

  const passed: RawResult[] = [];
  const nearMiss: (RawResult & { failedReasons: string[] })[] = [];
  for (const candidate of dedupedCandidates) {
    if (!candidate.link) continue; // nothing to verify or link the user to
    const { pass, failedReasons } = checkHardcodedFilters(candidate, settings);
    if (pass) {
      passed.push(candidate);
    } else {
      nearMiss.push({ ...candidate, failedReasons });
    }
  }

  const allLinked = [...passed, ...nearMiss].filter(
    (c): c is (typeof c) & { link: string } => Boolean(c.link)
  );
  const verification = await verifyPostings(
    allLinked.map((c) => ({ link: c.link!, company: c.company, role: c.role }))
  );

  const verifiedPassed = passed.filter((c) => c.link && verification.get(c.link) === "confirmed_open");
  const verifiedNearMiss = nearMiss.filter((c) => c.link && verification.get(c.link) === "confirmed_open");

  verifiedPassed.sort((a, b) => b.relevance_score - a.relevance_score);
  verifiedNearMiss.sort((a, b) => b.relevance_score - a.relevance_score);

  const added: SuggestedApplication[] = [];
  for (const candidate of verifiedPassed.slice(0, maxResults)) {
    added.push(
      insertSuggestedApplication({
        company: candidate.company.trim(),
        role: candidate.role.trim(),
        link: candidate.link,
        location: candidate.location,
        date_posted: candidate.date_posted,
        source_snippet: candidate.source_snippet,
        match_reasons: candidate.match_reasons,
        filter_failures: null,
      })
    );
  }

  const nearMisses: SuggestedApplication[] = [];
  for (const candidate of verifiedNearMiss.slice(0, MAX_NEAR_MISSES)) {
    nearMisses.push(
      insertSuggestedApplication({
        company: candidate.company.trim(),
        role: candidate.role.trim(),
        link: candidate.link,
        location: candidate.location,
        date_posted: candidate.date_posted,
        source_snippet: candidate.source_snippet,
        match_reasons: candidate.match_reasons,
        filter_failures: candidate.failedReasons,
      })
    );
  }

  const finalNote =
    added.length === 0 && nearMisses.length === 0
      ? results.length === 0
        ? note
        : `${dedupedCandidates.length} candidate(s) found, but none passed live verification.`
      : note;

  return { added, nearMisses, note: finalNote };
}

/**
 * Feature 1 — on-demand casual browsing ("find more to apply to"). Always broad, never
 * restricted to target companies. Unlimited runs/day; fixed at 3 results per run.
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
