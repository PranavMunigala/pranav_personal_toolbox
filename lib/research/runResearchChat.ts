import { runSkill } from "@/lib/claudeCode/runSkill";

const CHAT_RESULT_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    profileUpdated: { type: "boolean" },
    note: { type: ["string", "null"] },
  },
  required: ["reply", "profileUpdated", "note"],
  additionalProperties: false,
} as const;

export interface RunResearchChatResult {
  reply: string;
  profileUpdated: boolean;
  note: string | null;
}

export interface ResearchChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function runResearchChat(
  category: string,
  slug: string,
  profileContent: string,
  history: ResearchChatTurn[],
  message: string
): Promise<RunResearchChatResult> {
  const prompt = [
    "This is a headless/automated invocation.",
    "mode: chat.",
    `category: ${category}.`,
    `slug: ${slug}.`,
    `content: ${JSON.stringify(profileContent)}.`,
    `history: ${JSON.stringify(history)}.`,
    `message: ${JSON.stringify(message)}.`,
  ].join(" ");

  return runSkill<RunResearchChatResult>({
    skill: "biomed-research",
    prompt,
    jsonSchema: CHAT_RESULT_SCHEMA,
    allowedTools: ["Bash(npx tsx scripts/research-cli.ts:*)", "WebSearch", "WebFetch"],
    timeoutMs: 480_000,
  });
}
