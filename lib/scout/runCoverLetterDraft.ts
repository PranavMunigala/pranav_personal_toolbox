import { getScoutSession } from "@/lib/db/scoutSessions";
import { insertCoverLetterDraft } from "@/lib/db/coverLetterDrafts";
import { runSkill } from "@/lib/claudeCode/runSkill";
import type { CoverLetterDraft, CoverLetterResearchSource } from "@/lib/db/types";

const RESEARCH_SOURCE_SCHEMA = {
  type: "object",
  properties: {
    url: { type: "string" },
    note: { type: "string" },
  },
  required: ["url", "note"],
  additionalProperties: false,
} as const;

const COVER_LETTER_SCHEMA = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    refusal_reason: { type: ["string", "null"] },
    cover_letter_markdown: { type: ["string", "null"] },
    research_sources: { type: ["array", "null"], items: RESEARCH_SOURCE_SCHEMA },
    word_count: { type: ["number", "null"] },
  },
  required: ["ok", "refusal_reason", "cover_letter_markdown", "research_sources", "word_count"],
  additionalProperties: false,
} as const;

interface CoverLetterResult {
  ok: boolean;
  refusal_reason: string | null;
  cover_letter_markdown: string | null;
  research_sources: CoverLetterResearchSource[] | null;
  word_count: number | null;
}

export async function draftCoverLetterForSession(
  sessionId: number,
  researchEnabled: boolean,
  extraContext?: string
): Promise<CoverLetterDraft> {
  const session = getScoutSession(sessionId);
  if (!session) throw new Error(`Scout session ${sessionId} not found`);

  const prompt = [
    "This is a headless/automated invocation.",
    `scout_session_id: ${sessionId}.`,
    `research_enabled: ${researchEnabled}.`,
    extraContext ? `extra_context: ${JSON.stringify(extraContext)}.` : "",
    'Look up the session yourself per the "Automated invocation" section, then write a cover letter per the Voice rules and the three-phase Steps.',
  ]
    .filter(Boolean)
    .join(" ");

  const parsed = await runSkill<CoverLetterResult>({
    skill: "cover-letter-draft",
    prompt,
    jsonSchema: COVER_LETTER_SCHEMA,
    allowedTools: researchEnabled
      ? ["Bash(npx tsx scripts/db-cli.ts:*)", "WebSearch", "WebFetch"]
      : ["Bash(npx tsx scripts/db-cli.ts:*)"],
    timeoutMs: 180_000,
  });

  if (!parsed.ok || !parsed.cover_letter_markdown || parsed.word_count == null) {
    throw new Error(parsed.refusal_reason ?? "Couldn't draft a cover letter for this session.");
  }

  return insertCoverLetterDraft({
    scout_session_id: sessionId,
    cover_letter_markdown: parsed.cover_letter_markdown,
    research_sources: JSON.stringify(parsed.research_sources ?? []),
    word_count: parsed.word_count,
  });
}
