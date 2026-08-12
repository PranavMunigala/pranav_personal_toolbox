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

const MAX_HISTORY_TURNS = 10;

export async function runResearchChat(
  category: string,
  slug: string,
  profileContent: string,
  history: ResearchChatTurn[],
  message: string
): Promise<RunResearchChatResult> {
  const recentHistory = history.slice(-MAX_HISTORY_TURNS);

  const prompt = [
    "This is a headless/automated invocation.",
    "mode: chat.",
    `category: ${category}.`,
    `slug: ${slug}.`,
    `content: ${JSON.stringify(profileContent)}.`,
    `history: ${JSON.stringify(recentHistory)}.`,
    `message: ${JSON.stringify(message)}.`,
  ].join(" ");

  return runSkill<RunResearchChatResult>({
    skill: "biomed-research",
    prompt,
    jsonSchema: CHAT_RESULT_SCHEMA,
    allowedTools: ["Bash(npx tsx scripts/research-cli.ts:*)", "WebSearch", "WebFetch"],
    timeoutMs: 600_000,
  });
}

const INCORPORATE_RESULT_SCHEMA = {
  type: "object",
  properties: {
    profileUpdated: { type: "boolean" },
    note: { type: "string" },
  },
  required: ["profileUpdated", "note"],
  additionalProperties: false,
} as const;

export interface RunIncorporateResult {
  profileUpdated: boolean;
  note: string;
}

// No WebSearch/WebFetch on purpose — the answer was already produced by a
// prior chat turn, so this call is pure placement (which section it belongs
// in), never open-ended research. That keeps it structurally immune to the
// timeout failure mode regular chat mode can still hit.
export async function incorporateResearchAnswer(
  category: string,
  slug: string,
  profileContent: string,
  question: string,
  answer: string
): Promise<RunIncorporateResult> {
  const prompt = [
    "This is a headless/automated invocation.",
    "mode: incorporate.",
    `category: ${category}.`,
    `slug: ${slug}.`,
    `content: ${JSON.stringify(profileContent)}.`,
    `question: ${JSON.stringify(question)}.`,
    `answer: ${JSON.stringify(answer)}.`,
  ].join(" ");

  return runSkill<RunIncorporateResult>({
    skill: "biomed-research",
    prompt,
    jsonSchema: INCORPORATE_RESULT_SCHEMA,
    allowedTools: ["Bash(npx tsx scripts/research-cli.ts:*)"],
    timeoutMs: 180_000,
  });
}
