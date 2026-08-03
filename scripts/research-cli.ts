/**
 * Stable CLI over lib/research/profiles.ts, for the biomed-research skill (interactive
 * and headless) to read/write profile files without using the Write/Edit tools
 * directly. Every command prints a single JSON value to stdout.
 *
 * Usage: npx tsx scripts/research-cli.ts <action> [args...]
 *
 * check-exists '<json {category, slug}>'
 * write '<json {category, slug, title, content}>'
 */
import { checkResearchProfileExists, writeResearchProfile } from "../lib/research/profiles";

function out(value: unknown) {
  console.log(JSON.stringify(value, null, 2));
}

function fail(message: string): never {
  console.error(JSON.stringify({ error: message }, null, 2));
  process.exit(1);
}

const [action, ...args] = process.argv.slice(2);

function parseJsonArg(raw: string | undefined): Record<string, unknown> {
  if (!raw) fail("Missing JSON argument.");
  try {
    return JSON.parse(raw);
  } catch {
    fail(`Invalid JSON argument: ${raw}`);
  }
}

switch (action) {
  case "check-exists": {
    const { category, slug } = parseJsonArg(args[0]);
    if (typeof category !== "string" || typeof slug !== "string") {
      fail("check-exists requires {category, slug} as strings.");
    }
    try {
      out({ exists: checkResearchProfileExists(category as string, slug as string) });
    } catch (err) {
      fail(err instanceof Error ? err.message : "check-exists failed.");
    }
    break;
  }

  case "write": {
    const { category, slug, title, content } = parseJsonArg(args[0]);
    if (
      typeof category !== "string" ||
      typeof slug !== "string" ||
      typeof title !== "string" ||
      typeof content !== "string"
    ) {
      fail("write requires {category, slug, title, content} as strings.");
    }
    try {
      const result = writeResearchProfile({
        category: category as string,
        slug: slug as string,
        title: title as string,
        content: content as string,
      });
      out({ ok: true, path: result.path, created: result.created });
    } catch (err) {
      fail(err instanceof Error ? err.message : "write failed.");
    }
    break;
  }

  default:
    fail(`Unknown command: ${action}`);
}
