"use server";

import { revalidatePath } from "next/cache";
import { runResearch } from "@/lib/research/runResearch";

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
