import { findContactByLinkedInUrl, getContact } from "@/lib/db/contacts";
import { runSkill } from "@/lib/claudeCode/runSkill";
import { draftEmailForContact } from "@/lib/email/draftEmail";
import type { Contact } from "@/lib/db/types";

const RESULT_SCHEMA = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    contactId: { type: ["integer", "null"] },
    refusal_reason: { type: ["string", "null"] },
    note: { type: "string" },
  },
  required: ["ok", "contactId", "refusal_reason", "note"],
  additionalProperties: false,
} as const;

interface QuickAddSkillResult {
  ok: boolean;
  contactId: number | null;
  refusal_reason: string | null;
  note: string;
}

export interface QuickAddResult {
  contact: Contact;
  draftReady: boolean;
  note: string;
}

/**
 * Given a LinkedIn URL the user found manually, WebSearches for enough public info to
 * create a contact (via the linkedin-quick-add skill), then best-effort auto-drafts an
 * email for it — same create-then-draft shape as promoteSuggestedContactAction, since
 * the user already vetted this person by finding and submitting the URL themselves.
 */
export async function quickAddContactFromLinkedIn(linkedinUrl: string): Promise<QuickAddResult> {
  const existing = findContactByLinkedInUrl(linkedinUrl);
  if (existing) {
    throw new Error(
      `${existing.name} is already in the tracker with this LinkedIn URL (status: ${existing.status}).`
    );
  }

  const result = await runSkill<QuickAddSkillResult>({
    skill: "linkedin-quick-add",
    prompt: `This is a headless/automated invocation. linkedin_url: ${linkedinUrl}`,
    jsonSchema: RESULT_SCHEMA,
    allowedTools: ["Bash(npx tsx scripts/db-cli.ts:*)", "WebSearch"],
    timeoutMs: 120_000,
  });

  if (!result.ok || !result.contactId) {
    throw new Error(
      result.refusal_reason ?? "Couldn't find enough public info for this LinkedIn URL."
    );
  }

  // DB is the source of truth for what was actually written, not the model's self-report.
  const contact = getContact(result.contactId);
  if (!contact) {
    throw new Error("Contact was reported as created but couldn't be found afterward.");
  }

  let draftReady = false;
  try {
    await draftEmailForContact(contact.id);
    draftReady = true;
  } catch (err) {
    // Best-effort: a drafting failure must never undo a successful Add.
    console.error(`Auto-draft failed for contact ${contact.id}:`, err);
  }

  return { contact, draftReady, note: result.note };
}
