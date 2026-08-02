import { findContactsByName } from "@/lib/db/contacts";
import { runSkill } from "@/lib/claudeCode/runSkill";
import type { Contact } from "@/lib/db/types";

// Enrichment is named-contact-only (never a bulk auto-sweep) to keep API cost bounded
// and user-controlled — see CLAUDE.md for the reasoning.
const MAX_NAMES_PER_RUN = 15;

const RESULT_SCHEMA = {
  type: "object",
  properties: {
    updatedIds: { type: "array", items: { type: "integer" } },
    note: { type: "string" },
  },
  required: ["updatedIds", "note"],
  additionalProperties: false,
} as const;

export interface EnrichResult {
  updated: number;
  notFoundNames: string[];
  note: string;
}

export async function enrichContacts(names: string[]): Promise<EnrichResult> {
  const cleanNames = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  if (cleanNames.length === 0) {
    throw new Error("Type at least one contact name.");
  }
  if (cleanNames.length > MAX_NAMES_PER_RUN) {
    throw new Error(`Too many names at once — enrich at most ${MAX_NAMES_PER_RUN} per run.`);
  }

  const contacts: Contact[] = [];
  const notFoundNames: string[] = [];
  for (const name of cleanNames) {
    const matches = findContactsByName(name);
    if (matches.length === 0) notFoundNames.push(name);
    else contacts.push(...matches);
  }

  if (contacts.length === 0) {
    return {
      updated: 0,
      notFoundNames,
      note: "None of those names matched a contact in the tracker.",
    };
  }

  const targets = contacts.map((c) => ({
    contact_id: c.id,
    name: c.name,
    title: c.title,
    company: c.company,
    linkedin_url: c.linkedin_url,
  }));

  const prompt = `This is a headless/automated invocation. Contacts to enrich (already looked up, use these ids directly):\n${JSON.stringify(targets, null, 2)}`;

  const result = await runSkill<{ updatedIds: number[]; note: string }>({
    skill: "contact-enrichment",
    prompt,
    jsonSchema: RESULT_SCHEMA,
    allowedTools: ["Bash(npx tsx scripts/db-cli.ts:*)", "WebSearch"],
    timeoutMs: 120_000,
  });

  // Trust the skill's reported ids for the count (writes already happened via db-cli),
  // but only count ones that genuinely correspond to a contact we asked it to enrich.
  const requestedIds = new Set(contacts.map((c) => c.id));
  const updated = result.updatedIds.filter((id) => requestedIds.has(id)).length;

  return { updated, notFoundNames, note: result.note };
}
