/**
 * One-time import of the cold-email Google Sheet into the tracker.
 *
 * Reads scripts/fixtures/cold-email-sheet.json (checked into git so the import is
 * replayable from a fresh clone) and maps each row to a contact. Many rows already
 * exist in the DB (seeded via scripts/seed.ts from the same underlying outreach
 * history) — those are matched by linkedin_url and enriched with any new fields
 * (phone/email/recruiter/connection_status) rather than duplicated. New rows are
 * inserted at status 'not_contacted' and then promoted through markSent/
 * markCoffeeChatted (never written directly), so the dedup guard stays the single
 * path to status='sent' for imported data too.
 *
 * Run with: npm run import-sheet
 */
import {
  listContacts,
  insertContact,
  updateContact,
  findContactByLinkedInUrl,
  markSent,
  markCoffeeChatted,
} from "../lib/db/contacts";
import type { ContactStatus, ConnectionStatus } from "../lib/db/types";
import sheetRows from "./fixtures/cold-email-sheet.json";

interface SheetRow {
  name: string;
  recruiter: string;
  company: string;
  role: string;
  reached_out: string;
  call: string;
  response: string;
  linkedin_url: string;
  email: string;
  phone: string;
}

const COMPANY_NORMALIZE: Record<string, string> = {
  bd: "BD",
  bms: "BMS",
  merck: "Merck",
  openai: "OpenAI",
  claude: "Anthropic",
  claued: "Anthropic",
};

function normalizeCompany(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const key = trimmed.toLowerCase();
  return COMPANY_NORMALIZE[key] ?? trimmed;
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

interface StatusInference {
  status: ContactStatus;
  connection_status?: ConnectionStatus;
}

const STATUS_RULES: { test: (s: string) => boolean; result: StatusInference }[] = [
  {
    test: (s) => /done call|went amazing|went well|great call|had a call|scheduled chat/.test(s),
    result: { status: "coffee_chatted" },
  },
  {
    test: (s) => /set up for|need to set up call|message need to/.test(s),
    result: { status: "drafted" },
  },
  {
    test: (s) => /just connected/.test(s),
    result: { status: "not_contacted", connection_status: "connected" },
  },
  {
    test: (s) => /emailed|sent email|sent message|^sent$/.test(s),
    result: { status: "sent" },
  },
  {
    test: (s) => /reach out still|have to email|need to reach|through linkedin/.test(s),
    result: { status: "not_contacted" },
  },
];

function inferStatus(raw: string): StatusInference {
  const s = raw.trim().toLowerCase();
  if (!s) return { status: "not_contacted" };
  for (const rule of STATUS_RULES) {
    if (rule.test(s)) return rule.result;
  }
  return { status: "not_contacted" };
}

function buildNote(row: SheetRow): string | undefined {
  const parts: string[] = [];
  if (row.response.trim()) parts.push(row.response.trim());
  const context: string[] = [];
  if (row.reached_out.trim()) context.push(`reached via ${row.reached_out.trim()}`);
  if (row.call.trim()) context.push(`call: ${row.call.trim()}`);
  if (context.length) parts.push(`(${context.join("; ")})`);
  if (!parts.length) return undefined;
  return `Sheet import: ${parts.join(" ")}`;
}

function main() {
  const rows = sheetRows as SheetRow[];
  let inserted = 0;
  let updated = 0;
  const skippedDuplicate: string[] = [];
  const possibleDuplicate: string[] = [];

  for (const row of rows) {
    const linkedin_url = normalizeLinkedInUrl(row.linkedin_url);
    const company = normalizeCompany(row.company);
    const inference = inferStatus(row.response);
    const note = buildNote(row);
    const is_recruiter = row.recruiter.trim().toLowerCase() === "yes";

    const existingByLinkedIn = linkedin_url ? findContactByLinkedInUrl(linkedin_url) : undefined;

    if (existingByLinkedIn) {
      // Already tracked (likely from seed.ts) — enrich, never touch status here.
      const mergedNotes = note
        ? existingByLinkedIn.notes && !existingByLinkedIn.notes.includes(note)
          ? `${existingByLinkedIn.notes}\n${note}`
          : existingByLinkedIn.notes ?? note
        : existingByLinkedIn.notes ?? undefined;
      updateContact(existingByLinkedIn.id, {
        company: company ?? existingByLinkedIn.company,
        title: row.role.trim() || existingByLinkedIn.title,
        email: row.email.trim() || existingByLinkedIn.email,
        phone: row.phone.trim() || existingByLinkedIn.phone,
        is_recruiter: is_recruiter || Boolean(existingByLinkedIn.is_recruiter),
        connection_status:
          inference.connection_status ?? (existingByLinkedIn.connection_status as ConnectionStatus),
        notes: mergedNotes,
      });
      updated++;
      skippedDuplicate.push(`${row.name} (id ${existingByLinkedIn.id}, updated)`);
      continue;
    }

    if (!linkedin_url) {
      // No LinkedIn URL to dedup on — check for a plausible existing match by name+company.
      const candidates = listContacts().filter(
        (c) => c.name.trim().toLowerCase() === row.name.trim().toLowerCase()
      );
      if (candidates.length) {
        possibleDuplicate.push(`${row.name} — possible match with existing id(s) ${candidates.map((c) => c.id).join(",")}`);
      }
    }

    const contact = insertContact({
      name: row.name.trim(),
      linkedin_url: linkedin_url ?? null,
      email: row.email.trim() || null,
      phone: row.phone.trim() || null,
      company: company ?? null,
      title: row.role.trim() || null,
      is_recruiter,
      connection_status: inference.connection_status ?? "not_connected",
      status: "not_contacted",
      notes: note ?? null,
    });

    if (inference.status === "sent") {
      const result = markSent(contact.id);
      if (!result.ok) console.warn(`[WARN] ${row.name}: ${result.reason}`);
    } else if (inference.status === "coffee_chatted") {
      markCoffeeChatted(contact.id);
    } else if (inference.status === "drafted") {
      updateContact(contact.id, { status: "drafted" });
    }

    inserted++;
  }

  console.log(
    `Import complete: ${inserted} new contacts inserted, ${updated} existing contacts enriched.`
  );
  if (skippedDuplicate.length) {
    console.log(`\nMatched to existing contacts (by linkedin_url):`);
    skippedDuplicate.forEach((s) => console.log(`  [ENRICHED] ${s}`));
  }
  if (possibleDuplicate.length) {
    console.log(`\nPossible duplicates (no linkedin_url to dedup on — review manually):`);
    possibleDuplicate.forEach((s) => console.log(`  [POSSIBLE-DUPLICATE] ${s}`));
  }
}

main();
