"use server";

import { revalidatePath } from "next/cache";
import {
  insertApplication,
  updateApplicationStatus,
  findExistingApplication,
  deleteApplication,
  linkContactToApplication,
} from "@/lib/db/applications";
import type { ApplicationStatus } from "@/lib/db/types";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function createApplicationAction(input: {
  company: string;
  role: string;
  link?: string;
  location?: string;
  date_posted?: string;
  notes?: string;
}): Promise<ActionResult> {
  if (!input.company.trim() || !input.role.trim()) {
    return { ok: false, message: "Company and role are required." };
  }

  const existing = findExistingApplication(input.company, input.role, input.link);
  if (existing) {
    return {
      ok: false,
      message: `Already tracked: ${existing.company} — ${existing.role} (status: ${existing.status}).`,
    };
  }

  insertApplication({
    company: input.company,
    role: input.role,
    link: input.link || null,
    location: input.location || null,
    date_posted: input.date_posted || null,
    notes: input.notes || null,
    source: "manual",
  });

  revalidatePath("/internships");
  return { ok: true, message: `${input.company} — ${input.role} added to the tracker.` };
}

export async function setApplicationStatusAction(
  id: number,
  status: ApplicationStatus
): Promise<ActionResult> {
  const app = updateApplicationStatus(id, status);
  revalidatePath("/internships");
  return { ok: true, message: `Updated ${app.company} — ${app.role} to ${status}.` };
}

export async function deleteApplicationAction(id: number): Promise<ActionResult> {
  deleteApplication(id);
  revalidatePath("/internships");
  return { ok: true, message: "Application removed." };
}

export async function linkContactAction(
  applicationId: number,
  contactId: number
): Promise<ActionResult> {
  linkContactToApplication(applicationId, contactId);
  revalidatePath("/internships");
  return { ok: true, message: "Contact linked." };
}
