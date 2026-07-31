"use server";

import { revalidatePath } from "next/cache";
import {
  insertContact,
  markSent,
  markCoffeeChatted,
  updateContact,
  deleteContact,
  findContactByLinkedInUrl,
} from "@/lib/db/contacts";
import { updatePreferences } from "@/lib/db/preferences";
import { updateDiscoveryPreferences } from "@/lib/db/discoveryPreferences";
import { setResume } from "@/lib/db/resume";
import { promoteSuggestedContact, dismissSuggestedContact } from "@/lib/db/suggestedContacts";
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

  insertContact({
    name: input.name,
    linkedin_url: input.linkedin_url || null,
    company: input.company || null,
    title: input.title || null,
    seniority_tier: input.seniority_tier,
    industry_tags: input.industry_tags,
    profile_text: input.profile_text || null,
    notes: input.notes || null,
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
}): Promise<ActionResult> {
  updateDiscoveryPreferences(input);
  revalidatePath("/cold-email");
  return { ok: true, message: "Discovery preferences updated." };
}

export async function uploadResumeAction(input: {
  raw_text: string;
  filename?: string;
}): Promise<ActionResult> {
  if (!input.raw_text.trim()) return { ok: false, message: "Resume text is empty." };
  const resume = setResume(input);
  revalidatePath("/cold-email");
  const keywordCount = (JSON.parse(resume.keywords) as string[]).length;
  return { ok: true, message: `Resume saved (${keywordCount} keywords extracted).` };
}

export async function promoteSuggestedContactAction(id: number): Promise<ActionResult> {
  const result = promoteSuggestedContact(id);
  revalidatePath("/cold-email");
  if (!result.ok) return { ok: false, message: result.reason };
  return { ok: true, message: `${result.contact.name} added to the tracker.` };
}

export async function dismissSuggestedContactAction(id: number): Promise<ActionResult> {
  dismissSuggestedContact(id);
  revalidatePath("/cold-email");
  return { ok: true, message: "Suggestion dismissed." };
}
