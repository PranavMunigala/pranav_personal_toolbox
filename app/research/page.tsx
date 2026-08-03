import path from "node:path";
import { listMarkdownDocs } from "@/lib/content";
import { RunResearchCard } from "@/components/research/run-research-card";
import { ResearchDocSections } from "@/components/research/doc-sections";

export const dynamic = "force-dynamic";

const RESEARCH_ROOT = path.join(process.cwd(), "research");

export default function ResearchPage() {
  const companies = listMarkdownDocs(path.join(RESEARCH_ROOT, "companies"));
  const products = listMarkdownDocs(path.join(RESEARCH_ROOT, "products"));
  const topics = listMarkdownDocs(path.join(RESEARCH_ROOT, "topics"));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Research Tools</h1>
        <p className="text-muted-foreground mt-1">
          Biomedical/biotech/health-AI scouting notes. Enter a company, product, or topic
          below and the <code>biomed-research</code> skill will research it and write/update
          a profile here.
        </p>
      </div>

      <RunResearchCard />

      <ResearchDocSections companies={companies} products={products} topics={topics} />
    </div>
  );
}
