/**
 * Stable CLI over the lib/db layer, for skills (and manual use) to read/write data
 * without writing ad hoc SQL. Every command prints a single JSON value to stdout.
 *
 * Usage: npx tsx scripts/db-cli.ts <resource> <action> [args...]
 *
 * contacts list [--status=STATUS] [--company=NAME]
 * contacts get <id>
 * contacts find-by-linkedin <url>
 * contacts find-by-company <company>
 * contacts add '<json NewContact>'
 * contacts update <id> '<json partial NewContact>'
 * contacts set-status <id> <status>      # routes "sent" through the dedup guard
 *
 * applications list
 * applications get <id>
 * applications find-existing <company> <role> [link]
 * applications add '<json NewApplication>'
 * applications set-status <id> <status>
 * applications link-contact <applicationId> <contactId>
 * applications contacts <applicationId>
 *
 * target-companies list
 *
 * preferences get
 * preferences set '<json {industries?, roles?, seniority_focus?, notes?}>'
 */
import {
  listContacts,
  getContact,
  findContactByLinkedInUrl,
  findContactsByCompany,
  insertContact,
  updateContact,
  markSent,
  markCoffeeChatted,
} from "../lib/db/contacts";
import {
  listApplications,
  getApplication,
  findExistingApplication,
  insertApplication,
  updateApplicationStatus,
  linkContactToApplication,
  getContactsForApplication,
} from "../lib/db/applications";
import { listTargetCompanies } from "../lib/db/targetCompanies";
import { getPreferences, updatePreferences } from "../lib/db/preferences";
import type { ApplicationStatus, ContactStatus } from "../lib/db/types";

function out(value: unknown) {
  console.log(JSON.stringify(value, null, 2));
}

function fail(message: string): never {
  console.error(JSON.stringify({ error: message }, null, 2));
  process.exit(1);
}

const [resource, action, ...args] = process.argv.slice(2);

function flag(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = args.find((a) => a.startsWith(prefix));
  return found?.slice(prefix.length);
}

switch (`${resource} ${action}`) {
  case "contacts list": {
    let contacts = listContacts();
    const status = flag("status");
    const company = flag("company");
    if (status) contacts = contacts.filter((c) => c.status === status);
    if (company)
      contacts = contacts.filter(
        (c) => c.company?.toLowerCase() === company.toLowerCase()
      );
    out(contacts);
    break;
  }
  case "contacts get": {
    const id = Number(args[0]);
    out(getContact(id) ?? null);
    break;
  }
  case "contacts find-by-linkedin": {
    out(findContactByLinkedInUrl(args[0]) ?? null);
    break;
  }
  case "contacts find-by-company": {
    out(findContactsByCompany(args[0]));
    break;
  }
  case "contacts add": {
    const payload = JSON.parse(args[0] ?? "{}");
    if (payload.linkedin_url) {
      const existing = findContactByLinkedInUrl(payload.linkedin_url);
      if (existing) fail(`Contact already exists (id ${existing.id}, status ${existing.status}) for this LinkedIn URL.`);
    }
    out(insertContact(payload));
    break;
  }
  case "contacts update": {
    const id = Number(args[0]);
    const payload = JSON.parse(args[1] ?? "{}");
    out(updateContact(id, payload));
    break;
  }
  case "contacts set-status": {
    const id = Number(args[0]);
    const status = args[1] as ContactStatus;
    if (status === "sent") {
      const result = markSent(id);
      if (!result.ok) fail(result.reason);
      out(result.contact);
    } else if (status === "coffee_chatted") {
      out(markCoffeeChatted(id));
    } else {
      out(updateContact(id, { status }));
    }
    break;
  }

  case "applications list": {
    out(listApplications());
    break;
  }
  case "applications get": {
    out(getApplication(Number(args[0])) ?? null);
    break;
  }
  case "applications find-existing": {
    const [company, role, link] = args;
    out(findExistingApplication(company, role, link) ?? null);
    break;
  }
  case "applications add": {
    const payload = JSON.parse(args[0] ?? "{}");
    const existing = findExistingApplication(payload.company, payload.role, payload.link);
    if (existing) fail(`Application already tracked (id ${existing.id}, status ${existing.status}).`);
    out(insertApplication(payload));
    break;
  }
  case "applications set-status": {
    out(updateApplicationStatus(Number(args[0]), args[1] as ApplicationStatus));
    break;
  }
  case "applications link-contact": {
    linkContactToApplication(Number(args[0]), Number(args[1]));
    out({ ok: true });
    break;
  }
  case "applications contacts": {
    out(getContactsForApplication(Number(args[0])));
    break;
  }

  case "target-companies list": {
    out(listTargetCompanies());
    break;
  }

  case "preferences get": {
    const p = getPreferences();
    out({
      ...p,
      industries: JSON.parse(p.industries),
      roles: JSON.parse(p.roles),
      seniority_focus: JSON.parse(p.seniority_focus),
    });
    break;
  }
  case "preferences set": {
    const payload = JSON.parse(args[0] ?? "{}");
    const p = updatePreferences(payload);
    out({
      ...p,
      industries: JSON.parse(p.industries),
      roles: JSON.parse(p.roles),
      seniority_focus: JSON.parse(p.seniority_focus),
    });
    break;
  }

  default:
    fail(`Unknown command: ${resource} ${action}`);
}
