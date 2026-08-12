/**
 * Stable CLI over the lib/db layer, for skills (and manual use) to read/write data
 * without writing ad hoc SQL. Every command prints a single JSON value to stdout.
 *
 * Usage: npx tsx scripts/db-cli.ts <resource> <action> [args...]
 *
 * contacts list [--status=] [--company=] [--seniority_tier=] [--connection_status=]
 *                [--is_recruiter=true|false] [--alma_mater=] [--industry_tag=] [--q=]
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
 * target-companies add '<json {name, location?, commute_tier, notes?, careers_url?}>'
 *
 * preferences get
 * preferences set '<json {industries?, roles?, seniority_focus?, notes?}>'
 *
 * suggested-contacts list [--discovered_at=YYYY-MM-DD]   # defaults to latest pending batch
 * suggested-contacts add '<json NewSuggestedContact>'
 * suggested-contacts promote <id> ['<json overrides>']
 * suggested-contacts dismiss <id>
 *
 * suggested-applications list [--discovered_at=YYYY-MM-DD]   # defaults to latest pending batch
 * suggested-applications list-keys                            # every company/role/link ever suggested, for dedup
 * suggested-applications add '<json NewSuggestedApplication>'  # verification_status: "confirmed" (default) | "plausible"
 * suggested-applications promote <id> ['<json overrides>']
 * suggested-applications dismiss <id>
 *
 * email-drafts list-for-contact <contactId>
 * email-drafts add '<json NewEmailDraft>'
 *
 * email-draft-chat list-for-contact <contactId>
 *
 * discovery-preferences get
 * discovery-preferences set '<json {target_schools?, require_connection?, exclude_recruiters?, notes?}>'
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
import { listTargetCompanies, upsertTargetCompany } from "../lib/db/targetCompanies";
import { getPreferences, updatePreferences } from "../lib/db/preferences";
import {
  listSuggestedContacts,
  insertSuggestedContact,
  promoteSuggestedContact,
  dismissSuggestedContact,
} from "../lib/db/suggestedContacts";
import { getDiscoveryPreferences, updateDiscoveryPreferences } from "../lib/db/discoveryPreferences";
import {
  listSuggestedApplications,
  listAllSuggestedApplicationKeys,
  insertSuggestedApplication,
  promoteSuggestedApplication,
  dismissSuggestedApplication,
} from "../lib/db/suggestedApplications";
import { listDraftsForContact, insertEmailDraft } from "../lib/db/emailDrafts";
import { listDraftChatMessages } from "../lib/db/emailDraftChat";
import type {
  ApplicationStatus,
  ConnectionStatus,
  ContactStatus,
  SeniorityTier,
} from "../lib/db/types";

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
    const isRecruiter = flag("is_recruiter");
    out(
      listContacts({
        status: flag("status") as ContactStatus | undefined,
        company: flag("company"),
        seniority_tier: flag("seniority_tier") as SeniorityTier | undefined,
        connection_status: flag("connection_status") as ConnectionStatus | undefined,
        is_recruiter: isRecruiter === undefined ? undefined : isRecruiter === "true",
        alma_mater: flag("alma_mater"),
        industry_tag: flag("industry_tag"),
        q: flag("q"),
      })
    );
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
  case "target-companies add": {
    const payload = JSON.parse(args[0] ?? "{}");
    if (!payload.name) fail("name is required");
    if (!payload.commute_tier) fail("commute_tier is required");
    upsertTargetCompany(payload);
    out(listTargetCompanies().find((c) => c.name.toLowerCase() === payload.name.toLowerCase()));
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

  case "suggested-contacts list": {
    out(listSuggestedContacts(flag("discovered_at")));
    break;
  }
  case "suggested-contacts add": {
    const payload = JSON.parse(args[0] ?? "{}");
    out(insertSuggestedContact(payload));
    break;
  }
  case "suggested-contacts promote": {
    const id = Number(args[0]);
    const overrides = args[1] ? JSON.parse(args[1]) : undefined;
    const result = promoteSuggestedContact(id, overrides);
    if (!result.ok) fail(result.reason);
    out(result.contact);
    break;
  }
  case "suggested-contacts dismiss": {
    out(dismissSuggestedContact(Number(args[0])));
    break;
  }

  case "suggested-applications list": {
    out(listSuggestedApplications(flag("discovered_at")));
    break;
  }
  case "suggested-applications list-keys": {
    out(listAllSuggestedApplicationKeys());
    break;
  }
  case "suggested-applications add": {
    const payload = JSON.parse(args[0] ?? "{}");
    out(insertSuggestedApplication(payload));
    break;
  }
  case "suggested-applications promote": {
    const id = Number(args[0]);
    const overrides = args[1] ? JSON.parse(args[1]) : undefined;
    const result = promoteSuggestedApplication(id, overrides);
    if (!result.ok) fail(result.reason);
    out(result.application);
    break;
  }
  case "suggested-applications dismiss": {
    out(dismissSuggestedApplication(Number(args[0])));
    break;
  }

  case "email-drafts list-for-contact": {
    out(listDraftsForContact(Number(args[0])));
    break;
  }
  case "email-drafts add": {
    const payload = JSON.parse(args[0] ?? "{}");
    out(insertEmailDraft(payload));
    break;
  }

  case "email-draft-chat list-for-contact": {
    out(listDraftChatMessages(Number(args[0])));
    break;
  }

  case "discovery-preferences get": {
    const p = getDiscoveryPreferences();
    out({ ...p, target_schools: JSON.parse(p.target_schools) });
    break;
  }
  case "discovery-preferences set": {
    const payload = JSON.parse(args[0] ?? "{}");
    const p = updateDiscoveryPreferences(payload);
    out({ ...p, target_schools: JSON.parse(p.target_schools) });
    break;
  }

  default:
    fail(`Unknown command: ${resource} ${action}`);
}
