import { getScoutSession } from "@/lib/db/scoutSessions";
import { insertResumeDraft } from "@/lib/db/resumeDrafts";
import { runSkill } from "@/lib/claudeCode/runSkill";
import type { GapAnalysis, ResumeDraft } from "@/lib/db/types";

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

const RESUME_SCHEMA = {
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
  },
  required: ["ok", "refusal_reason", "tailored_resume_markdown", "gap_analysis"],
  additionalProperties: false,
} as const;

interface ResumeTailorResult {
  ok: boolean;
  refusal_reason: string | null;
  tailored_resume_markdown: string | null;
  gap_analysis: GapAnalysis | null;
}

export async function tailorResumeForSession(sessionId: number): Promise<ResumeDraft> {
  const session = getScoutSession(sessionId);
  if (!session) throw new Error(`Scout session ${sessionId} not found`);

  const prompt = `This is a headless/automated invocation. scout_session_id: ${sessionId}. Look up the session yourself per the "Automated invocation" section, then tailor the resume to this job posting with an honest gap analysis, per the main Steps.`;

  const parsed = await runSkill<ResumeTailorResult>({
    skill: "resume-tailor",
    prompt,
    jsonSchema: RESUME_SCHEMA,
    allowedTools: ["Bash(npx tsx scripts/db-cli.ts:*)", "WebFetch"],
    timeoutMs: 150_000,
  });

  if (!parsed.ok || !parsed.tailored_resume_markdown || !parsed.gap_analysis) {
    throw new Error(parsed.refusal_reason ?? "Couldn't tailor a resume for this session.");
  }

  return insertResumeDraft({
    scout_session_id: sessionId,
    tailored_resume_markdown: parsed.tailored_resume_markdown,
    gap_analysis: JSON.stringify(parsed.gap_analysis),
  });
}
