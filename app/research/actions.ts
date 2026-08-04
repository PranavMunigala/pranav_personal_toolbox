"use server";

import path from "node:path";
import { revalidatePath } from "next/cache";
import { runResearch } from "@/lib/research/runResearch";
import { runResearchChat } from "@/lib/research/runResearchChat";
import { readMarkdownDoc } from "@/lib/content";
import { listChatMessages, addChatMessage } from "@/lib/db/researchChat";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export interface RunResearchResult extends ActionResult {
  category?: string;
  slug?: string;
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
    revalidatePath("/research");
    revalidatePath(`/research/${result.category}/${result.slug}`);
    return {
      ok: true,
      message: `${result.created ? "Created" : "Updated"} "${result.title}". ${result.note}`,
      category: result.category,
      slug: result.slug,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Research failed." };
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

  try {
    const history = listChatMessages(category, slug).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await runResearchChat(category, slug, profileContent, history, message.trim());

    addChatMessage(category, slug, "user", message.trim());
    addChatMessage(category, slug, "assistant", result.reply);

    if (result.profileUpdated) {
      revalidatePath(`/research/${category}/${slug}`);
      revalidatePath("/research");
    }

    return { ok: true, reply: result.reply, profileUpdated: result.profileUpdated };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Chat failed." };
  }
}
