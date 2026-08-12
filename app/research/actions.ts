"use server";

import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { revalidatePath } from "next/cache";
import {
  runResearch,
  runDocumentResearch,
  type ResearchPurpose,
} from "@/lib/research/runResearch";
import { runResearchChat, incorporateResearchAnswer } from "@/lib/research/runResearchChat";
import { readMarkdownDoc } from "@/lib/content";
import { listChatMessages, addChatMessage } from "@/lib/db/researchChat";
import { addProfileHistoryEntry } from "@/lib/db/researchProfileHistory";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export interface RunResearchResult extends ActionResult {
  category?: string;
  slug?: string;
}

function researchErrorResult(err: unknown): RunResearchResult {
  const message = err instanceof Error ? err.message : "Research failed.";
  if (message.includes("timed out")) {
    revalidatePath("/research");
    return {
      ok: false,
      message:
        "Research timed out before finishing, but a checkpointed profile may have already been saved — check the research list below.",
    };
  }
  return { ok: false, message };
}

export async function runResearchAction(
  query: string,
  categoryHint?: string,
  focus?: string
): Promise<RunResearchResult> {
  if (!query.trim()) {
    return { ok: false, message: "Enter a company, product, or topic to research." };
  }

  try {
    const result = await runResearch(query.trim(), categoryHint, focus?.trim() || undefined);
    addProfileHistoryEntry(result.category, result.slug, result.note, "research");
    revalidatePath("/research");
    revalidatePath(`/research/${result.category}/${result.slug}`);
    return {
      ok: true,
      message: `${result.created ? "Created" : "Updated"} "${result.title}". ${result.note}`,
      category: result.category,
      slug: result.slug,
    };
  } catch (err) {
    return researchErrorResult(err);
  }
}

const UPLOADS_ROOT = path.join(process.cwd(), "data", "uploads");

export async function runDocumentResearchAction(
  formData: FormData
): Promise<RunResearchResult> {
  const sourceUrl = (formData.get("sourceUrl") as string | null)?.trim() || undefined;
  const sourceFile = formData.get("sourceFile") as File | null;
  const focus = (formData.get("focus") as string | null)?.trim() || undefined;
  const purpose = (formData.get("purpose") as ResearchPurpose | null) ?? "personal_research";
  const categoryHintRaw = formData.get("categoryHint") as string | null;
  const categoryHint = categoryHintRaw && categoryHintRaw !== "auto" ? categoryHintRaw : undefined;

  const hasFile = Boolean(sourceFile && sourceFile.size > 0);
  if (!hasFile && !sourceUrl) {
    return { ok: false, message: "Paste a link or upload a PDF to research." };
  }

  let pdfPath: string | undefined;
  try {
    if (hasFile && sourceFile) {
      await mkdir(UPLOADS_ROOT, { recursive: true });
      pdfPath = path.join(UPLOADS_ROOT, `${randomUUID()}.pdf`);
      const buffer = Buffer.from(await sourceFile.arrayBuffer());
      await writeFile(pdfPath, buffer);
    }

    const result = await runDocumentResearch({
      pdfPath,
      sourceUrl: hasFile ? undefined : sourceUrl,
      focus,
      purpose,
      categoryHint,
    });
    addProfileHistoryEntry(result.category, result.slug, result.note, "document");
    revalidatePath("/research");
    revalidatePath(`/research/${result.category}/${result.slug}`);
    return {
      ok: true,
      message: `${result.created ? "Created" : "Updated"} "${result.title}". ${result.note}`,
      category: result.category,
      slug: result.slug,
    };
  } catch (err) {
    return researchErrorResult(err);
  } finally {
    if (pdfPath) {
      await unlink(pdfPath).catch(() => {});
    }
  }
}

const RESEARCH_ROOT = path.join(process.cwd(), "research");

export interface SendResearchChatMessageResult {
  ok: boolean;
  reply?: string;
  profileUpdated?: boolean;
  error?: string;
}

export async function sendResearchChatMessageAction(
  category: string,
  slug: string,
  message: string
): Promise<SendResearchChatMessageResult> {
  if (!message.trim()) {
    return { ok: false, error: "Enter a message first." };
  }

  const filePath = path.join(RESEARCH_ROOT, category, `${slug}.md`);
  const profileContent = readMarkdownDoc(filePath);
  if (!profileContent) {
    return { ok: false, error: "Couldn't find this profile on disk." };
  }

  const history = listChatMessages(category, slug).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Persisted before the (potentially slow) skill call, so the user's own
  // message survives a timeout/failure instead of vanishing on next load.
  addChatMessage(category, slug, "user", message.trim());

  try {
    const result = await runResearchChat(category, slug, profileContent, history, message.trim());

    addChatMessage(category, slug, "assistant", result.reply);

    if (result.profileUpdated) {
      addProfileHistoryEntry(category, slug, result.note ?? "Updated via chat.", "chat");
      revalidatePath(`/research/${category}/${slug}`);
      revalidatePath("/research");
    }

    return { ok: true, reply: result.reply, profileUpdated: result.profileUpdated };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed.";
    if (message.includes("timed out")) {
      return {
        ok: false,
        error:
          "This took too long to finish — it may need more specific direction. Try asking for one concrete thing at a time (e.g. a specific fact, section, or source) rather than a broad update. Your message was saved, so you can just try again below.",
      };
    }
    return { ok: false, error: message };
  }
}

export interface IncorporateResearchAnswerResult {
  ok: boolean;
  profileUpdated?: boolean;
  note?: string;
  error?: string;
}

export async function incorporateResearchAnswerAction(
  category: string,
  slug: string,
  question: string,
  answer: string
): Promise<IncorporateResearchAnswerResult> {
  const filePath = path.join(RESEARCH_ROOT, category, `${slug}.md`);
  const profileContent = readMarkdownDoc(filePath);
  if (!profileContent) {
    return { ok: false, error: "Couldn't find this profile on disk." };
  }

  try {
    const result = await incorporateResearchAnswer(category, slug, profileContent, question, answer);

    if (result.profileUpdated) {
      addProfileHistoryEntry(category, slug, result.note, "incorporate");
      revalidatePath(`/research/${category}/${slug}`);
      revalidatePath("/research");
    }

    return { ok: true, profileUpdated: result.profileUpdated, note: result.note };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Incorporate failed.";
    if (message.includes("timed out")) {
      return {
        ok: false,
        error: "This took too long to finish — try again in a moment.",
      };
    }
    return { ok: false, error: message };
  }
}
