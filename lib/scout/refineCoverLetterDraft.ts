import { runSkill } from "@/lib/claudeCode/runSkill";
import type { CoverLetterResearchSource } from "@/lib/db/types";

const RESEARCH_SOURCE_SCHEMA = {
  type: "object",
  properties: {
    url: { type: "string" },
    note: { type: "string" },
  },
  required: ["url", "note"],
  additionalProperties: false,
} as const;

const REFINE_COVER_LETTER_SCHEMA = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    refusal_reason: { type: ["string", "null"] },
    cover_letter_markdown: { type: ["string", "null"] },
    research_sources: { type: ["array", "null"], items: RESEARCH_SOURCE_SCHEMA },
    word_count: { type: ["number", "null"] },
    note: { type: ["string", "null"] },
  },
  required: [
    "ok",
    "refusal_reason",
    "cover_letter_markdown",
    "research_sources",
    "word_count",
    "note",
  ],
  additionalProperties: false,
} as const;

export interface RefineCoverLetterResult {
  ok: boolean;
  refusal_reason: string | null;
  cover_letter_markdown: string | null;
  research_sources: CoverLetterResearchSource[] | null;
  word_count: number | null;
  note: string | null;
}

export interface CoverLetterChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function refineCoverLetterDraft(
  sessionId: number,
  currentCoverLetterMarkdown: string,
  currentResearchSources: CoverLetterResearchSource[],
  history: CoverLetterChatTurn[],
  message: string
): Promise<RefineCoverLetterResult> {
  const prompt = [
    "This is a headless/automated invocation.",
    "mode: chat.",
    `scout_session_id: ${sessionId}.`,
    `current_cover_letter_markdown: ${JSON.stringify(currentCoverLetterMarkdown)}.`,
    `current_research_sources: ${JSON.stringify(currentResearchSources)}.`,
    `history: ${JSON.stringify(history)}.`,
    `message: ${JSON.stringify(message)}.`,
  ].join(" ");

  return runSkill<RefineCoverLetterResult>({
    skill: "cover-letter-draft",
    prompt,
    jsonSchema: REFINE_COVER_LETTER_SCHEMA,
    allowedTools: ["Bash(npx tsx scripts/db-cli.ts:*)", "WebSearch", "WebFetch"],
    timeoutMs: 180_000,
  });
}
