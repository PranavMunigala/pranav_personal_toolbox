import path from "node:path";
import Link from "next/link";
import { listMarkdownDocs } from "@/lib/content";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const RESEARCH_ROOT = path.join(process.cwd(), "vendor", "bme-research", "research");

export default function ResearchPage() {
  const companies = listMarkdownDocs(path.join(RESEARCH_ROOT, "companies"));
  const products = listMarkdownDocs(path.join(RESEARCH_ROOT, "products"));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Research Tools</h1>
        <p className="text-muted-foreground mt-1">
          Biomedical/biotech/health-AI scouting notes, mirrored from{" "}
          <a
            href="https://github.com/PranavMunigala/bme-research"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            bme-research
          </a>
          . Ask Claude Code to research a company, product, or topic and the{" "}
          <code>biomed-research</code> skill will write/update a profile here.
        </p>
      </div>

      <DocSection title="Companies" docs={companies} category="companies" />
      <DocSection title="Products" docs={products} category="products" />
    </div>
  );
}

function DocSection({
  title,
  docs,
  category,
}: {
  title: string;
  docs: ReturnType<typeof listMarkdownDocs>;
  category: string;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">{title}</h2>
      {docs.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nothing here yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {docs.map((doc) => (
            <Link key={doc.slug} href={`/research/${category}/${doc.slug}`}>
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">{doc.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {doc.excerpt}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
