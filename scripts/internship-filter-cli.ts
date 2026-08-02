/**
 * Deterministic eligibility filter check, exposed to skills invoked headlessly (see
 * .claude/skills/internship-search) so hardcoded rules stay real code — not something
 * the model reimplements in prose. Prints a single JSON value to stdout.
 *
 * Usage: npx tsx scripts/internship-filter-cli.ts check '<json array of FilterableCandidate>'
 *   -> [{candidate_index, pass, failedReasons}]
 */
import { checkHardcodedFilters, type FilterableCandidate } from "../lib/discovery/internshipFilters";
import { getInternshipFilterSettings } from "../lib/db/internshipFilterSettings";

function out(value: unknown) {
  console.log(JSON.stringify(value, null, 2));
}

function fail(message: string): never {
  console.error(JSON.stringify({ error: message }, null, 2));
  process.exit(1);
}

const [action, ...args] = process.argv.slice(2);

switch (action) {
  case "check": {
    let candidates: FilterableCandidate[];
    try {
      candidates = JSON.parse(args[0] ?? "[]");
    } catch {
      fail("First arg must be a JSON array of FilterableCandidate.");
    }
    const settings = getInternshipFilterSettings();
    out(
      candidates.map((c, candidate_index) => ({
        candidate_index,
        ...checkHardcodedFilters(c, settings),
      }))
    );
    break;
  }
  default:
    fail(`Unknown command: ${action}`);
}
