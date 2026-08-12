import { runSkill } from "@/lib/claudeCode/runSkill";
import type { GapAnalysis } from "@/lib/db/types";

const GAP_ITEM_SCHEMA = {
  type: "object",
  properties: {
    requirement: { type: "string" },
    evidence_in_resume: { type: "boolean" },
    note: { type: "string" },
  },
  required: ["requirement", "evidence_in_resume", "note"],
  additionalProperties: false,
} as const;

const REFINE_RESUME_SCHEMA = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    refusal_reason: { type: ["string", "null"] },
    tailored_resume_markdown: { type: ["string", "null"] },
    gap_analysis: {
      type: ["object", "null"],
      properties: {
        must_haves: { type: "array", items: GAP_ITEM_SCHEMA },
        nice_to_haves: { type: "array", items: GAP_ITEM_SCHEMA },
      },
      required: ["must_haves", "nice_to_haves"],
      additionalProperties: false,
    },
    note: { type: ["string", "null"] },
  },
  required: ["ok", "refusal_reason", "tailored_resume_markdown", "gap_analysis", "note"],
  additionalProperties: false,
} as const;

export interface RefineResumeResult {
  ok: boolean;
  refusal_reason: string | null;
  tailored_resume_markdown: string | null;
  gap_analysis: GapAnalysis | null;
  note: string | null;
}

export interface ResumeDraftChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function refineResumeDraft(
  sessionId: number,
  currentResumeMarkdown: string,
  currentGapAnalysis: GapAnalysis,
  history: ResumeDraftChatTurn[],
  message: string
): Promise<RefineResumeResult> {
  const prompt = [
    "This is a headless/automated invocation.",
    "mode: chat.",
    `scout_session_id: ${sessionId}.`,
    `current_resume_markdown: ${JSON.stringify(currentResumeMarkdown)}.`,
    `current_gap_analysis: ${JSON.stringify(currentGapAnalysis)}.`,
    `history: ${JSON.stringify(history)}.`,
    `message: ${JSON.stringify(message)}.`,
  ].join(" ");

  return runSkill<RefineResumeResult>({
    skill: "resume-tailor",
    prompt,
    jsonSchema: REFINE_RESUME_SCHEMA,
    allowedTools: ["Bash(npx tsx scripts/db-cli.ts:*)", "WebSearch", "WebFetch"],
    timeoutMs: 180_000,
  });
}
