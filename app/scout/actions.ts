"use server";

import { revalidatePath } from "next/cache";
import { getScoutSession, insertScoutSession } from "@/lib/db/scoutSessions";
import { listResumeDraftsForSession, insertResumeDraft } from "@/lib/db/resumeDrafts";
import {
  listResumeDraftChatMessages,
  addResumeDraftChatMessage,
} from "@/lib/db/resumeDraftChat";
import {
  listCoverLetterDraftsForSession,
  insertCoverLetterDraft,
} from "@/lib/db/coverLetterDrafts";
import {
  listCoverLetterChatMessages,
  addCoverLetterChatMessage,
} from "@/lib/db/coverLetterChat";
import { tailorResumeForSession } from "@/lib/scout/runResumeTailor";
import { refineResumeDraft } from "@/lib/scout/refineResumeDraft";
import { draftCoverLetterForSession } from "@/lib/scout/runCoverLetterDraft";
import { refineCoverLetterDraft } from "@/lib/scout/refineCoverLetterDraft";
import type { GapAnalysis, CoverLetterResearchSource } from "@/lib/db/types";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function createScoutSessionAction(input: {
  application_id?: number | null;
  company: string;
  role: string;
  job_posting_url?: string;
  job_posting_text: string;
  resume_source_text: string;
  extra_context_text?: string;
}): Promise<ActionResult & { sessionId?: number }> {
  if (!input.company.trim() || !input.role.trim()) {
    return { ok: false, message: "Company and role are required." };
  }
  if (!input.job_posting_text.trim()) {
    return { ok: false, message: "Paste the job posting text (or a URL) first." };
  }
  if (!input.resume_source_text.trim()) {
    return { ok: false, message: "Paste your resume/experience bank text." };
  }

  const session = insertScoutSession({
    application_id: input.application_id ?? null,
    company: input.company,
    role: input.role,
    job_posting_url: input.job_posting_url || null,
    job_posting_text: input.job_posting_text,
    resume_source_text: input.resume_source_text,
    extra_context_text: input.extra_context_text || null,
  });

  revalidatePath("/scout");
  return { ok: true, message: "Scout session created.", sessionId: session.id };
}

export async function tailorResumeAction(sessionId: number): Promise<ActionResult> {
  try {
    await tailorResumeForSession(sessionId);
    revalidatePath(`/scout/${sessionId}`);
    return { ok: true, message: "Tailored resume ready." };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Tailoring failed." };
  }
}

export interface RefineResumeDraftResult {
  ok: boolean;
  note?: string;
  error?: string;
}

export async function refineResumeDraftAction(
  sessionId: number,
  message: string
): Promise<RefineResumeDraftResult> {
  const trimmed = message.trim();
  if (!trimmed) return { ok: false, error: "Enter a message first." };

  const session = getScoutSession(sessionId);
  if (!session) return { ok: false, error: "Session not found." };

  const drafts = listResumeDraftsForSession(sessionId);
  const latest = drafts[0];
  if (!latest) return { ok: false, error: "Tailor the resume first, then refine it." };

  try {
    const history = listResumeDraftChatMessages(sessionId).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await refineResumeDraft(
      sessionId,
      latest.tailored_resume_markdown,
      JSON.parse(latest.gap_analysis) as GapAnalysis,
      history,
      trimmed
    );

    addResumeDraftChatMessage(sessionId, "user", trimmed);

    if (!result.ok || !result.tailored_resume_markdown || !result.gap_analysis) {
      const error = result.refusal_reason ?? "Couldn't refine the resume.";
      addResumeDraftChatMessage(sessionId, "assistant", error);
      return { ok: false, error };
    }

    const newDraft = insertResumeDraft({
      scout_session_id: sessionId,
      tailored_resume_markdown: result.tailored_resume_markdown,
      gap_analysis: JSON.stringify(result.gap_analysis),
    });

    const note = result.note ?? "Resume updated.";
    addResumeDraftChatMessage(sessionId, "assistant", note, newDraft.id);

    revalidatePath(`/scout/${sessionId}`);
    return { ok: true, note };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Refine failed.";
    addResumeDraftChatMessage(sessionId, "assistant", error);
    return { ok: false, error };
  }
}

export async function draftCoverLetterAction(
  sessionId: number,
  researchEnabled: boolean,
  extraContext?: string
): Promise<ActionResult> {
  try {
    await draftCoverLetterForSession(sessionId, researchEnabled, extraContext);
    revalidatePath(`/scout/${sessionId}`);
    return { ok: true, message: "Cover letter ready." };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Drafting failed." };
  }
}

export interface RefineCoverLetterDraftResult {
  ok: boolean;
  note?: string;
  error?: string;
}

export async function refineCoverLetterDraftAction(
  sessionId: number,
  message: string
): Promise<RefineCoverLetterDraftResult> {
  const trimmed = message.trim();
  if (!trimmed) return { ok: false, error: "Enter a message first." };

  const session = getScoutSession(sessionId);
  if (!session) return { ok: false, error: "Session not found." };

  const drafts = listCoverLetterDraftsForSession(sessionId);
  const latest = drafts[0];
  if (!latest) return { ok: false, error: "Write the cover letter first, then refine it." };

  try {
    const history = listCoverLetterChatMessages(sessionId).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await refineCoverLetterDraft(
      sessionId,
      latest.cover_letter_markdown,
      JSON.parse(latest.research_sources) as CoverLetterResearchSource[],
      history,
      trimmed
    );

    addCoverLetterChatMessage(sessionId, "user", trimmed);

    if (!result.ok || !result.cover_letter_markdown || result.word_count == null) {
      const error = result.refusal_reason ?? "Couldn't refine the cover letter.";
      addCoverLetterChatMessage(sessionId, "assistant", error);
      return { ok: false, error };
    }

    const newDraft = insertCoverLetterDraft({
      scout_session_id: sessionId,
      cover_letter_markdown: result.cover_letter_markdown,
      research_sources: JSON.stringify(result.research_sources ?? []),
      word_count: result.word_count,
    });

    const note = result.note ?? "Cover letter updated.";
    addCoverLetterChatMessage(sessionId, "assistant", note, newDraft.id);

    revalidatePath(`/scout/${sessionId}`);
    return { ok: true, note };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Refine failed.";
    addCoverLetterChatMessage(sessionId, "assistant", error);
    return { ok: false, error };
  }
}
