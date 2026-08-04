"use server";

import { revalidatePath } from "next/cache";
import {
  insertApplication,
  updateApplicationStatus,
  updateApplication,
  findExistingApplication,
  deleteApplication,
  linkContactToApplication,
} from "@/lib/db/applications";
import {
  promoteSuggestedApplication,
  dismissSuggestedApplication,
} from "@/lib/db/suggestedApplications";
import { upsertTargetCompany, deleteTargetCompany } from "@/lib/db/targetCompanies";
import { runInternshipSearch, runDailyInternshipRefresh } from "@/lib/discovery/runInternshipSearch";
import { updateInternshipFilterSettings } from "@/lib/db/internshipFilterSettings";
import type { ApplicationStatus, CommuteTier } from "@/lib/db/types";

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

export async function updateApplicationAction(
  id: number,
  patch: {
    company?: string;
    role?: string;
    link?: string | null;
    location?: string | null;
    date_posted?: string | null;
    status?: ApplicationStatus;
    notes?: string | null;
    interview_contact_name?: string | null;
    interview_contact_email?: string | null;
  }
): Promise<ActionResult> {
  if (patch.company !== undefined && !patch.company.trim()) {
    return { ok: false, message: "Company is required." };
  }
  if (patch.role !== undefined && !patch.role.trim()) {
    return { ok: false, message: "Role is required." };
  }
  const app = updateApplication(id, patch);
  revalidatePath("/internships");
  revalidatePath(`/internships/${id}`);
  return { ok: true, message: `${app.company} — ${app.role} updated.` };
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

function formatSearchResultMessage(added: number, tiersSearched: number, note: string): string {
  const tierSuffix = tiersSearched > 0 ? ` (checked tier ${tiersSearched} of 3)` : "";
  if (added === 0) return (note || "No new matches found.") + tierSuffix;
  return `Found ${added} new posting${added === 1 ? "" : "s"}${tierSuffix}.`;
}

export async function runInternshipSearchAction(customQuery?: string): Promise<ActionResult> {
  try {
    const result = await runInternshipSearch(customQuery);
    revalidatePath("/internships");
    return {
      ok: true,
      message: formatSearchResultMessage(result.added.length, result.tiersSearched, result.note),
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Internship search failed." };
  }
}

export async function runDailyInternshipRefreshAction(): Promise<ActionResult> {
  try {
    const result = await runDailyInternshipRefresh();
    revalidatePath("/internships");
    return {
      ok: true,
      message: formatSearchResultMessage(result.added.length, result.tiersSearched, result.note),
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Daily refresh failed." };
  }
}

export async function updateInternshipFilterSettingsAction(patch: {
  role_type_enabled?: boolean;
  paid_only_enabled?: boolean;
  location_enabled?: boolean;
  location_state?: string;
  seniority_enabled?: boolean;
  eligible_class_years?: string[];
  relevance_enabled?: boolean;
  relevance_min_score?: number;
}): Promise<ActionResult> {
  updateInternshipFilterSettings(patch);
  revalidatePath("/internships");
  return { ok: true, message: "Filter settings saved." };
}

export async function promoteSuggestedApplicationAction(id: number): Promise<ActionResult> {
  const result = promoteSuggestedApplication(id);
  revalidatePath("/internships");
  if (!result.ok) return { ok: false, message: result.reason };
  return { ok: true, message: `${result.application.company} — ${result.application.role} added to the tracker.` };
}

export async function dismissSuggestedApplicationAction(id: number): Promise<ActionResult> {
  dismissSuggestedApplication(id);
  revalidatePath("/internships");
  return { ok: true, message: "Suggestion dismissed." };
}

export async function addTargetCompanyAction(input: {
  name: string;
  location?: string;
  commute_tier: CommuteTier;
}): Promise<ActionResult> {
  if (!input.name.trim()) return { ok: false, message: "Company name is required." };
  upsertTargetCompany({
    name: input.name.trim(),
    location: input.location || null,
    commute_tier: input.commute_tier,
  });
  revalidatePath("/internships");
  return { ok: true, message: `${input.name} added to target companies.` };
}

export async function removeTargetCompanyAction(id: number): Promise<ActionResult> {
  deleteTargetCompany(id);
  revalidatePath("/internships");
  return { ok: true, message: "Removed from target companies." };
}
