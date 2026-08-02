import { findContactsByName, updateContact } from "@/lib/db/contacts";
import { searchWeb } from "@/lib/tinyfish/client";
import { callOpenRouter, MODEL_LIGHT } from "@/lib/openrouter/client";
import type { Contact } from "@/lib/db/types";

// Enrichment is named-contact-only (never a bulk auto-sweep) to keep API cost bounded
// and user-controlled — see CLAUDE.md for the reasoning.
const MAX_NAMES_PER_RUN = 15;

const ENRICHMENT_SCHEMA = {
  name: "contact_enrichment",
  schema: {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            contact_id: { type: "integer" },
            linkedin_url: { type: ["string", "null"] },
            alma_mater: { type: ["string", "null"] },
            industry_tags: { type: "array", items: { type: "string" } },
          },
          required: ["contact_id", "linkedin_url", "alma_mater", "industry_tags"],
          additionalProperties: false,
        },
      },
      note: { type: "string" },
    },
    required: ["results", "note"],
    additionalProperties: false,
  },
} as const;

interface RawResult {
  contact_id: number;
  linkedin_url: string | null;
  alma_mater: string | null;
  industry_tags: string[];
}

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

  // Gather real search results per contact first, then hand all of it to the model in
  // one call for extraction — search is decoupled from the LLM so it works regardless
  // of tool-calling support on whichever preset/model is in play.
  const searchResultsByContact = await Promise.all(
    contacts.map(async (c) => {
      const query = [c.name, c.title, c.company, "LinkedIn"].filter(Boolean).join(" ");
      try {
        return { contact: c, results: await searchWeb(query) };
      } catch {
        return { contact: c, results: [] };
      }
    })
  );

  const contactSections = searchResultsByContact
    .map(({ contact: c, results }) => {
      const known = c.linkedin_url ? ` — LinkedIn already known: ${c.linkedin_url}` : "";
      const header = `id ${c.id}: ${c.name}${c.title || c.company ? ` (${[c.title, c.company].filter(Boolean).join(" @ ")})` : ""}${known}`;
      const snippets = results.length
        ? results
            .slice(0, 5)
            .map((r) => `  - ${r.title} — ${r.url}\n    ${r.snippet}`)
            .join("\n")
        : "  (no search results found)";
      return `${header}\n${snippets}`;
    })
    .join("\n\n");

  const prompt = `For each of these people, real web search results (fetched just now) are included below. Use ONLY these search results to fill in fields they're missing — never overwrite or guess a field. If you can't confirm something with reasonable confidence from the search results shown, leave it null (or an empty array for industry_tags).

People and their search results:
${contactSections}

For each contact_id, return:
- linkedin_url: their LinkedIn profile URL if confirmable from the search results (null if not found or already known — don't bother re-finding it if "LinkedIn already known" is shown, just echo it back or null).
- alma_mater: their undergraduate/graduate university if confirmable from the search snippets (null if not found).
- industry_tags: up to 3 short industry/field tags grounded in what you found (e.g. "medical devices", "biomedical engineering", "AI in healthcare") — empty array if nothing confident.

Never fabricate. Only include a contact_id in results if you found at least one new piece of information for them; skip ones you found nothing new for entirely.`;

  const content = await callOpenRouter({
    model: MODEL_LIGHT,
    content: prompt,
    responseSchema: ENRICHMENT_SCHEMA,
  });

  let parsed: { results: RawResult[]; note: string };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Couldn't parse the enrichment result.");
  }

  const byId = new Map(contacts.map((c) => [c.id, c]));
  let updated = 0;
  for (const result of parsed.results) {
    const existing = byId.get(result.contact_id);
    if (!existing) continue;

    const patch: { linkedin_url?: string; alma_mater?: string; industry_tags?: string[] } = {};
    if (!existing.linkedin_url && result.linkedin_url) patch.linkedin_url = result.linkedin_url;
    if (!existing.alma_mater && result.alma_mater) patch.alma_mater = result.alma_mater;
    if (JSON.parse(existing.industry_tags).length === 0 && result.industry_tags?.length) {
      patch.industry_tags = result.industry_tags;
    }

    if (Object.keys(patch).length > 0) {
      try {
        updateContact(existing.id, patch);
        updated++;
      } catch {
        // e.g. linkedin_url collides with another contact's unique constraint — skip, don't fail the batch.
      }
    }
  }

  return { updated, notFoundNames, note: parsed.note };
}
