import fs from "node:fs";
import path from "node:path";

export interface ContentDoc {
  slug: string;
  title: string;
  excerpt: string;
  filePath: string; // absolute path
}

function firstHeadingAndParagraph(markdown: string): { title: string; excerpt: string } {
  const lines = markdown.split("\n");
  const headingLine = lines.find((l) => l.startsWith("# "));
  const title = headingLine ? headingLine.replace(/^#\s+/, "").trim() : "Untitled";

  const headingIdx = headingLine ? lines.indexOf(headingLine) : -1;
  const rest = lines.slice(headingIdx + 1);
  const excerptLine = rest.find((l) => l.trim().length > 0 && !l.startsWith("#"));
  const excerpt = excerptLine ? excerptLine.trim().slice(0, 220) : "";

  return { title, excerpt };
}

export function listMarkdownDocs(dirAbsPath: string): ContentDoc[] {
  if (!fs.existsSync(dirAbsPath)) return [];
  return fs
    .readdirSync(dirAbsPath)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const filePath = path.join(dirAbsPath, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const { title, excerpt } = firstHeadingAndParagraph(content);
      return { slug: file.replace(/\.md$/, ""), title, excerpt, filePath };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function readMarkdownDoc(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}
