import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readMarkdownDoc } from "@/lib/content";
import { MarkdownView } from "@/components/markdown-view";
import { ArrowLeft } from "lucide-react";

const ATHENA_ROOT = path.join(process.cwd(), "vendor", "athena");

export default async function NotesDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const filePath = path.join(ATHENA_ROOT, `${slug}.md`);
  const content = readMarkdownDoc(filePath);
  if (!content) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <Link
        href="/notes"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <ArrowLeft className="size-3.5" />
        Back to Notes
      </Link>
      <MarkdownView content={content} />
    </div>
  );
}
