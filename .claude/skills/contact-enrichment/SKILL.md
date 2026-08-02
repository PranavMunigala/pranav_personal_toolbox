---
name: contact-enrichment
description: Use when the user wants to fill in missing details (LinkedIn URL, alma mater, industry tags) for one or more existing contacts already in the Cold Email Tracker, by name. Never creates new contacts and never overwrites a field that's already set.
---

# Contact enrichment

Given a list of contact names already in the tracker, looks each one up via WebSearch
and fills in only the fields that are currently missing (`linkedin_url`, `alma_mater`,
`industry_tags`) — never overwrites an existing value, never fabricates a detail it
can't confirm from real search results, and never creates a new contact.

## Steps

1. **Look up each name** via `npx tsx scripts/db-cli.ts contacts list --q=<name>` (or
   `contacts list` and filter client-side) to get each contact's `id`, current
   `linkedin_url`/`alma_mater`/`industry_tags`, `title`, and `company`. If a name doesn't
   match any contact, note it and skip — don't guess which contact was meant.

2. **WebSearch each matched contact** using their name plus whatever's already known
   (title, company) to disambiguate, e.g. `"<name>" "<company>" LinkedIn`. Use only the
   real search snippets returned — never rely on prior knowledge of the person beyond
   what the search actually shows.

3. **Extract only missing fields** from the search results:
   - `linkedin_url` — only if the contact doesn't already have one and you can confirm
     it from the search results. Never guess a URL.
   - `alma_mater` — only if not already set and confirmable from search snippets.
   - `industry_tags` — only if currently empty; up to 3 short tags grounded in what you
     found (e.g. "medical devices", "biomedical engineering", "AI in healthcare").
   If a field is already set on the contact, leave it alone — don't try to overwrite or
   "improve" it, even if the search suggests something different.

4. **Write updates via the CLI, never raw SQL**, one call per contact with anything new:
   ```
   npx tsx scripts/db-cli.ts contacts update <id> '{"linkedin_url": "...", "alma_mater": "...", "industry_tags": ["..."]}'
   ```
   Only include the fields you actually found and that were previously missing — omit
   fields you found nothing new for. Skip the update call entirely for a contact if you
   found nothing new.

5. **Report to the user**: which contacts were updated (and what was added), which
   names didn't match any contact, and which matched contacts had nothing new found.

## Automated invocation

When invoked headlessly (`claude -p /contact-enrichment ...` from the app's
`enrichContacts()`), the prompt gives you a JSON array of contacts to enrich, each
`{contact_id, name, title, company, linkedin_url}` (already looked up by the caller —
skip step 1's lookup-by-name, use the ids given directly) and `linkedin_url` reflects
what's already known (may be `null`). Follow steps 2–4 exactly, then skip step 5's
user-facing report — instead return only the final JSON result `{"updatedIds": [<ids of
contacts you actually wrote an update for>], "note": "<one sentence on how it went>"}`,
no surrounding prose.

## Constraints

- WebSearch only — no scraping of LinkedIn or any site requiring login.
- Never creates a new contact — only updates existing ones via `contacts update`.
- Never overwrites an already-set field.
- On-demand only, at most 15 names per run (enforced by the caller).
