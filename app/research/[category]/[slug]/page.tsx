import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readMarkdownDoc, getMarkdownTitle } from "@/lib/content";
import { MarkdownView } from "@/components/markdown-view";
import { RefreshProfileButton } from "@/components/research/refresh-profile-button";
import { ResearchHistoryButton } from "@/components/research/research-history-button";
import { ResearchChatSidebar } from "@/components/research/research-chat-sidebar";
import { listChatMessages } from "@/lib/db/researchChat";
import { listProfileHistory } from "@/lib/db/researchProfileHistory";
import { ArrowLeft } from "lucide-react";

const RESEARCH_ROOT = path.join(process.cwd(), "research");

export default async function ResearchDocPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const filePath = path.join(RESEARCH_ROOT, category, `${slug}.md`);
  const content = readMarkdownDoc(filePath);
  if (!content) notFound();

  const title = getMarkdownTitle(content);
  const lastModified = fs.statSync(filePath).mtime;
  const chatMessages = listChatMessages(category, slug).map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const history = listProfileHistory(category, slug);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <Link
        href="/research"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <ArrowLeft className="size-3.5" />
        Back to Research
      </Link>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Last updated{" "}
          {lastModified.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
        <div className="flex items-center gap-2">
          <ResearchHistoryButton history={history} />
          <RefreshProfileButton title={title} category={category} />
        </div>
      </div>

      <MarkdownView content={content} />

      <ResearchChatSidebar category={category} slug={slug} initialMessages={chatMessages} />
    </div>
  );
}
