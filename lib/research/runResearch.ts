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
    timeoutMs: 600_000,
  });
}

export type ResearchPurpose = "personal_research" | "learning" | "linkedin_post";

export async function runDocumentResearch(input: {
  pdfPath?: string;
  sourceUrl?: string;
  focus?: string;
  purpose: ResearchPurpose;
  categoryHint?: string;
}): Promise<RunResearchResult> {
  const { pdfPath, sourceUrl, focus, purpose, categoryHint } = input;
  if (!pdfPath && !sourceUrl) {
    throw new Error("Provide either a PDF or a link to research.");
  }

  const prompt = [
    "This is a headless/automated invocation.",
    "mode: document.",
    pdfPath ? `pdf_path: ${pdfPath}` : null,
    sourceUrl ? `source_url: ${sourceUrl}` : null,
    `category_hint: ${categoryHint ?? "null"}.`,
    `purpose: ${purpose}.`,
    focus ? `focus: ${focus}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return runSkill<RunResearchResult>({
    skill: "biomed-research",
    prompt,
    jsonSchema: RESULT_SCHEMA,
    allowedTools: [
      "Bash(npx tsx scripts/research-cli.ts:*)",
      "WebSearch",
      "WebFetch",
      "Read",
    ],
    timeoutMs: 600_000,
  });
}
