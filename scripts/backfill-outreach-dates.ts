/**
 * One-time backfill of `date_last_contacted` from the informal date mentions buried in
 * the Google Sheet's free-text "response" cells (e.g. "Set up for june 12/ done call
 * went amazing", "June 9th/ done call went well"). import-sheet.ts never parsed these —
 * it always stamps date_last_contacted as "now" (import run time) via markSent/
 * markCoffeeChatted. This corrects the date on contacts already in the tracker.
 *
 * Only touches date_last_contacted directly via updateContact — never status, and never
 * goes through markSent (that guard is for status transitions, not date corrections).
 * Rows whose response text has no confidently-parseable date are skipped and reported.
 *
 * Run with: npm run backfill-dates
 */
import { findContactByLinkedInUrl, updateContact } from "../lib/db/contacts";
import sheetRows from "./fixtures/cold-email-sheet.json";

interface SheetRow {
  name: string;
  linkedin_url: string;
  response: string;
}

function normalizeLinkedInUrl(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed);
    url.search = "";
    return url.toString();
  } catch {
    return trimmed;
  }
}

const MONTHS: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

const MONTH_DAY_RE = new RegExp(
  `\\b(${Object.keys(MONTHS).join("|")})\\.?\\s+(\\d{1,2})(st|nd|rd|th)?\\b`,
  "i"
);

/** Resolves a bare month/day mention to the most recent non-future occurrence. */
function resolveDate(month: number, day: number): Date | null {
  const now = new Date();
  for (const yearOffset of [0, -1]) {
    const candidate = new Date(now.getFullYear() + yearOffset, month, day);
    if (candidate.getMonth() !== month) continue; // invalid day for that month
    if (candidate.getTime() <= now.getTime()) return candidate;
  }
  return null;
}

function parseDateFromResponse(response: string): Date | null {
  const match = response.match(MONTH_DAY_RE);
  if (!match) return null;
  const month = MONTHS[match[1].toLowerCase()];
  const day = Number(match[2]);
  if (day < 1 || day > 31) return null;
  return resolveDate(month, day);
}

function main() {
  const rows = sheetRows as SheetRow[];
  let updated = 0;
  let skippedNoMatch = 0;
  let skippedUnparseable = 0;
  const details: string[] = [];

  for (const row of rows) {
    const normalizedUrl = normalizeLinkedInUrl(row.linkedin_url ?? "");
    if (!normalizedUrl) continue;
    const contact = findContactByLinkedInUrl(normalizedUrl);
    if (!contact) {
      skippedNoMatch++;
      continue;
    }

    const parsed = parseDateFromResponse(row.response ?? "");
    if (!parsed) {
      if (row.response?.trim()) skippedUnparseable++;
      continue;
    }

    updateContact(contact.id, { date_last_contacted: parsed.toISOString() });
    updated++;
    details.push(`${row.name} (id ${contact.id}) -> ${parsed.toDateString()} (from "${row.response.trim()}")`);
  }

  console.log(`Backfill complete: ${updated} contacts updated with a parsed outreach date.`);
  if (details.length) {
    console.log(`\nUpdated:`);
    details.forEach((d) => console.log(`  ${d}`));
  }
  console.log(
    `\nSkipped: ${skippedNoMatch} rows with no matching contact, ${skippedUnparseable} rows with unparseable/no date in the response text.`
  );
}

main();
