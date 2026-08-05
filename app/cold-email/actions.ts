"use server";

import { revalidatePath } from "next/cache";
import {
  insertContact,
  markSent,
  markCoffeeChatted,
  updateContact,
  deleteContact,
  findContactByLinkedInUrl,
  findPotentialDuplicates,
  getContact,
} from "@/lib/db/contacts";
import { updatePreferences } from "@/lib/db/preferences";
import { updateDiscoveryPreferences } from "@/lib/db/discoveryPreferences";
import { promoteSuggestedContact, dismissSuggestedContact } from "@/lib/db/suggestedContacts";
import { runContactDiscovery, runDailyDiscovery } from "@/lib/discovery/runContactDiscovery";
import { enrichContacts } from "@/lib/discovery/enrichContacts";
import { draftEmailForContact } from "@/lib/email/draftEmail";
import { refineEmailDraft } from "@/lib/email/refineEmailDraft";
import { listDraftsForContact, insertEmailDraft } from "@/lib/db/emailDrafts";
import { listDraftChatMessages, addDraftChatMessage } from "@/lib/db/emailDraftChat";
import type { ConnectionStatus, ContactStatus, RequireConnection, SeniorityTier } from "@/lib/db/types";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function createContactAction(input: {
  name: string;
  linkedin_url?: string;
  company?: string;
  title?: string;
  seniority_tier: SeniorityTier;
  industry_tags: string[];
  profile_text?: string;
  notes?: string;
  is_close_connection?: boolean;
  relation?: string;
}): Promise<ActionResult> {
  if (!input.name.trim()) return { ok: false, message: "Name is required." };

  if (input.linkedin_url) {
    const existing = findContactByLinkedInUrl(input.linkedin_url);
    if (existing) {
      return {
        ok: false,
        message: `${existing.name} is already in the tracker with this LinkedIn URL (status: ${existing.status}).`,
      };
    }
  }

  const dupe = findPotentialDuplicates(input.name, input.linkedin_url)[0];
  if (dupe) {
    return {
      ok: false,
      message: `${dupe.name} already exists with status "${dupe.status}"${dupe.company ? ` at ${dupe.company}` : ""} — refusing to add a likely duplicate.`,
    };
  }

  insertContact({
    name: input.name,
    linkedin_url: input.linkedin_url || null,
    company: input.company || null,
    title: input.title || null,
    seniority_tier: input.seniority_tier,
    industry_tags: input.industry_tags,
    profile_text: input.profile_text || null,
    notes: input.notes || null,
    is_close_connection: input.is_close_connection,
    relation: input.relation || null,
  });

  revalidatePath("/cold-email");
  return { ok: true, message: `${input.name} added to the tracker.` };
}

/**
 * The only path that transitions a contact to "sent" goes through markSent(),
 * which enforces the dedup guard — so this action can never be used to
 * silently re-email someone already sent/coffee_chatted.
 */
export async function setContactStatusAction(
  id: number,
  status: ContactStatus
): Promise<ActionResult> {
  if (status === "sent") {
    const result = markSent(id);
    revalidatePath("/cold-email");
    if (!result.ok) return { ok: false, message: result.reason };
    return { ok: true, message: `Marked ${result.contact.name} as sent.` };
  }

  if (status === "coffee_chatted") {
    const contact = markCoffeeChatted(id);
    revalidatePath("/cold-email");
    return { ok: true, message: `Marked ${contact.name} as coffee chatted.` };
  }

  const contact = updateContact(id, { status });
  revalidatePath("/cold-email");
  return { ok: true, message: `Updated ${contact.name} to ${status}.` };
}

export async function deleteContactAction(id: number): Promise<ActionResult> {
  deleteContact(id);
  revalidatePath("/cold-email");
  return { ok: true, message: "Contact removed." };
}

export async function updateContactAction(
  id: number,
  patch: {
    name?: string;
    linkedin_url?: string | null;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    title?: string | null;
    seniority_tier?: SeniorityTier;
    industry_tags?: string[];
    profile_text?: string | null;
    notes?: string | null;
    is_recruiter?: boolean;
    connection_status?: ConnectionStatus;
    alma_mater?: string | null;
    is_close_connection?: boolean;
    relation?: string | null;
  }
): Promise<ActionResult> {
  if (patch.name !== undefined && !patch.name.trim()) {
    return { ok: false, message: "Name is required." };
  }
  const contact = updateContact(id, patch);
  revalidatePath("/cold-email");
  revalidatePath(`/cold-email/${id}`);
  return { ok: true, message: `${contact.name} updated.` };
}

export async function updatePreferencesAction(input: {
  industries: string[];
  roles: string[];
  seniority_focus: string[];
}): Promise<ActionResult> {
  updatePreferences(input);
  revalidatePath("/cold-email");
  return { ok: true, message: "Preferences updated." };
}

export async function updateDiscoveryPreferencesAction(input: {
  target_schools: string[];
  require_connection: RequireConnection;
  exclude_recruiters: boolean;
  notes?: string | null;
}): Promise<ActionResult> {
  updateDiscoveryPreferences(input);
  revalidatePath("/cold-email");
  return { ok: true, message: "Discovery preferences updated." };
}

export async function runContactDiscoveryAction(customQuery?: string): Promise<ActionResult> {
  try {
    const result = await runContactDiscovery(customQuery);
    revalidatePath("/cold-email");
    if (result.added.length === 0) {
      return { ok: true, message: result.note || "No new matches found." };
    }
    return {
      ok: true,
      message: `Found ${result.added.length} new suggested contact${result.added.length === 1 ? "" : "s"}.`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Discovery run failed." };
  }
}

export async function runDailyDiscoveryAction(): Promise<ActionResult> {
  try {
    const result = await runDailyDiscovery();
    revalidatePath("/cold-email");
    if (result.added.length === 0) {
      return { ok: true, message: result.note || "No new matches found." };
    }
    return {
      ok: true,
      message: `Found ${result.added.length} new suggested contact${result.added.length === 1 ? "" : "s"}.`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Daily discovery run failed." };
  }
}

export async function promoteSuggestedContactAction(id: number): Promise<ActionResult> {
  const result = promoteSuggestedContact(id);
  if (!result.ok) return { ok: false, message: result.reason };

  let draftReady = false;
  try {
    await draftEmailForContact(result.contact.id);
    draftReady = true;
  } catch (err) {
    // Best-effort: a drafting failure must never undo a successful Add.
    console.error(`Auto-draft failed for contact ${result.contact.id}:`, err);
  }

  revalidatePath("/cold-email");
  revalidatePath(`/cold-email/${result.contact.id}`);
  return {
    ok: true,
    message: draftReady
      ? `${result.contact.name} added to the tracker — draft ready.`
      : `${result.contact.name} added to the tracker.`,
  };
}

export async function dismissSuggestedContactAction(id: number): Promise<ActionResult> {
  dismissSuggestedContact(id);
  revalidatePath("/cold-email");
  return { ok: true, message: "Suggestion dismissed." };
}

export async function enrichContactsAction(namesInput: string): Promise<ActionResult> {
  try {
    const names = namesInput.split(",").map((n) => n.trim()).filter(Boolean);
    const result = await enrichContacts(names);
    revalidatePath("/cold-email");
    const parts: string[] = [];
    if (result.updated > 0) {
      parts.push(`Filled in missing info for ${result.updated} contact${result.updated === 1 ? "" : "s"}.`);
    } else {
      parts.push(result.note);
    }
    if (result.notFoundNames.length > 0) {
      parts.push(`Not found: ${result.notFoundNames.join(", ")}.`);
    }
    return { ok: true, message: parts.join(" ") };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Enrichment failed." };
  }
}

export async function draftEmailAction(contactId: number): Promise<ActionResult> {
  try {
    await draftEmailForContact(contactId);
    revalidatePath(`/cold-email/${contactId}`);
    return { ok: true, message: "Draft ready." };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Drafting failed." };
  }
}

export interface RefineEmailDraftResult {
  ok: boolean;
  note?: string;
  error?: string;
}

export async function refineEmailDraftAction(
  contactId: number,
  message: string
): Promise<RefineEmailDraftResult> {
  const trimmed = message.trim();
  if (!trimmed) return { ok: false, error: "Enter a message first." };

  const contact = getContact(contactId);
  if (!contact) return { ok: false, error: "Contact not found." };

  const drafts = listDraftsForContact(contactId);
  const latest = drafts[0];
  if (!latest) return { ok: false, error: "Draft this email first, then refine it." };

  try {
    const history = listDraftChatMessages(contactId).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await refineEmailDraft(
      contactId,
      latest.subject,
      latest.body,
      history,
      trimmed
    );

    addDraftChatMessage(contactId, "user", trimmed);

    if (!result.ok || !result.subject || !result.body) {
      const error = result.refusal_reason ?? "Couldn't refine the draft.";
      addDraftChatMessage(contactId, "assistant", error);
      return { ok: false, error };
    }

    const newDraft = insertEmailDraft({
      contact_id: contactId,
      subject: result.subject,
      body: result.body,
      seniority_tier_used: latest.seniority_tier_used,
    });

    const note = result.note ?? "Draft updated.";
    addDraftChatMessage(contactId, "assistant", note, newDraft.id);

    revalidatePath(`/cold-email/${contactId}`);
    return { ok: true, note };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Refine failed.";
    addDraftChatMessage(contactId, "assistant", error);
    return { ok: false, error };
  }
}
