import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { listMarkdownDocs } from "@/lib/content";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const ATHENA_ROOT = path.join(process.cwd(), "vendor", "athena");

function listCorpusFiles(): { name: string; sizeKb: number }[] {
  const dir = path.join(ATHENA_ROOT, "corpus");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => !f.startsWith("."))
    .map((name) => ({
      name,
      sizeKb: Math.round(fs.statSync(path.join(dir, name)).size / 1024),
    }));
}

export default function NotesPage() {
  const docs = listMarkdownDocs(ATHENA_ROOT);
  const corpus = listCorpusFiles();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notes Bank</h1>
        <p className="text-muted-foreground mt-1">
          A RAG study assistant mirrored from{" "}
          <a
            href="https://github.com/PranavMunigala/Athena.V0"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Athena.V0
          </a>{" "}
          — query your own PDF lecture notes with citation-enforcing answers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run it locally</CardTitle>
          <CardDescription>Athena is a separate Python/Streamlit app.</CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 -mt-2">
          <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">
            <code>{`cd vendor/athena
pip install -r requirements.txt
# add your OPENAI_API_KEY to a .env file, then:
streamlit run v4/app.py`}</code>
          </pre>
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Docs</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {docs.map((doc) => (
            <Link key={doc.slug} href={`/notes/docs/${doc.slug}`}>
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
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Corpus</h2>
        {corpus.length === 0 ? (
          <p className="text-muted-foreground text-sm">No documents ingested yet.</p>
        ) : (
          <div className="rounded-lg border divide-y">
            {corpus.map((f) => (
              <div key={f.name} className="px-4 py-2.5 flex justify-between text-sm">
                <span>{f.name}</span>
                <span className="text-muted-foreground">{f.sizeKb} KB</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
