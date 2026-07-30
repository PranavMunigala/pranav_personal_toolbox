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
import type { ContactStatus, SeniorityTier } from "@/lib/db/types";

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

export async function updatePreferencesAction(input: {
  industries: string[];
  roles: string[];
  seniority_focus: string[];
}): Promise<ActionResult> {
  updatePreferences(input);
  revalidatePath("/cold-email");
  return { ok: true, message: "Preferences updated." };
}
