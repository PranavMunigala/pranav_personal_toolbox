import { runSkill } from "@/lib/claudeCode/runSkill";

const RESULT_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string" },
    slug: { type: "string" },
    title: { type: "string" },
    created: { type: "boolean" },
    note: { type: "string" },
  },
  required: ["category", "slug", "title", "created", "note"],
  additionalProperties: false,
} as const;

export interface RunResearchResult {
  category: string;
  slug: string;
  title: string;
  created: boolean;
  note: string;
}

export async function runResearch(
  query: string,
  categoryHint?: string,
  focus?: string
): Promise<RunResearchResult> {
  const prompt = [
    "This is a headless/automated invocation.",
    `query: ${query}.`,
    `category_hint: ${categoryHint ?? "null"}.`,
    focus ? `focus: ${focus}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return runSkill<RunResearchResult>({
    skill: "biomed-research",
    prompt,
    jsonSchema: RESULT_SCHEMA,
    allowedTools: ["Bash(npx tsx scripts/research-cli.ts:*)", "WebSearch", "WebFetch"],
    timeoutMs: 480_000,
  });
}
