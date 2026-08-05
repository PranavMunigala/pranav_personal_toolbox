import { runSkill } from "@/lib/claudeCode/runSkill";

const REFINE_SCHEMA = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    refusal_reason: { type: ["string", "null"] },
    subject: { type: ["string", "null"] },
    body: { type: ["string", "null"] },
    note: { type: ["string", "null"] },
  },
  required: ["ok", "refusal_reason", "subject", "body", "note"],
  additionalProperties: false,
} as const;

export interface RefineDraftResult {
  ok: boolean;
  refusal_reason: string | null;
  subject: string | null;
  body: string | null;
  note: string | null;
}

export interface EmailDraftChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function refineEmailDraft(
  contactId: number,
  currentSubject: string | null,
  currentBody: string,
  history: EmailDraftChatTurn[],
  message: string
): Promise<RefineDraftResult> {
  const prompt = [
    "This is a headless/automated invocation.",
    "mode: chat.",
    `contact_id: ${contactId}.`,
    `current_subject: ${JSON.stringify(currentSubject)}.`,
    `current_body: ${JSON.stringify(currentBody)}.`,
    `history: ${JSON.stringify(history)}.`,
    `message: ${JSON.stringify(message)}.`,
  ].join(" ");

  return runSkill<RefineDraftResult>({
    skill: "cold-email-draft",
    prompt,
    jsonSchema: REFINE_SCHEMA,
    allowedTools: ["Bash(npx tsx scripts/db-cli.ts:*)", "WebSearch", "WebFetch"],
    timeoutMs: 180_000,
  });
}
