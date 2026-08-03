import fs from "node:fs";
import path from "node:path";

const CATEGORIES = ["companies", "products", "topics"] as const;
export type ResearchCategory = (typeof CATEGORIES)[number];

const RESEARCH_ROOT = path.join(process.cwd(), "research");
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function assertCategory(category: string): asserts category is ResearchCategory {
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    throw new Error(`Invalid category "${category}" — must be one of ${CATEGORIES.join(", ")}.`);
  }
}

function assertSlug(slug: string): void {
  if (!SLUG_RE.test(slug)) {
    throw new Error(`Invalid slug "${slug}" — must be lowercase-kebab-case (e.g. "acme-bio").`);
  }
}

function profilePath(category: string, slug: string): string {
  assertCategory(category);
  assertSlug(slug);
  return path.join(RESEARCH_ROOT, category, `${slug}.md`);
}

export function checkResearchProfileExists(category: string, slug: string): boolean {
  return fs.existsSync(profilePath(category, slug));
}

export function writeResearchProfile(input: {
  category: string;
  slug: string;
  title: string;
  content: string;
}): { path: string; created: boolean } {
  const filePath = profilePath(input.category, input.slug);
  const created = !fs.existsSync(filePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, input.content, "utf-8");
  return { path: filePath, created };
}
