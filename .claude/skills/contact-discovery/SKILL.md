---
name: contact-discovery
description: Use when the user wants to find new potential outreach contacts (people, not companies/internships) in biomedical AI/medical devices/informatics matching their targeting criteria — on demand only, never scheduled. Writes candidates to a review queue for the user to approve before they become tracked contacts.
---

# Contact discovery

Finds new people to reach out to, matching the user's preferences, discovery filters,
and the mix of companies/people already in their tracker, via WebSearch only. Writes
suggestions to a review queue
(`suggested_contacts`) — never directly into `contacts`. The user reviews and adds them
from the "Suggested contacts" card on `/cold-email`, or via `suggested-contacts promote`
below.

## Steps

1. **Load context first**:
   ```
   npx tsx scripts/db-cli.ts preferences get
   npx tsx scripts/db-cli.ts discovery-preferences get
   npx tsx scripts/db-cli.ts contacts list
   npx tsx scripts/db-cli.ts suggested-contacts list
   ```
   Use `preferences.industries`/`roles` for subject-matter targeting and
   `discovery-preferences` for narrowing (`target_schools`, `require_connection`,
   `exclude_recruiters`, `notes`).

   `contacts list` serves two purposes here, not just dedup:
   - **Dedup set**: build it by `linkedin_url`, case-insensitively, combined with
     `suggested-contacts list` (recent pending/added suggestions, also by
     `linkedin_url`) so you never re-suggest someone already tracked or queued.
   - **Signal**: scan the existing contacts' `company`, `title`, `industry_tags`, and
     `profile_text` to get a rough read on the mix already being pursued — e.g. mostly
     large pharma vs. mostly startups, mostly one school vs. a spread. Use this to steer
     toward a broader, more varied batch rather than repeating whatever pattern already
     dominates the tracker.

2. **Search with WebSearch** for people — not companies or job postings — at the
   intersection of the user's target industries/roles (e.g. AI applied to healthcare,
   biomedical engineering, medical devices, health informatics, bioinformatics) and the
   mix inferred in step 1. Rely on public web-search snippets only (e.g. what a search
   engine surfaces about a public LinkedIn profile, company team pages, published
   author bios) — never fetch or log into LinkedIn directly, and never attempt to
   scrape a page that requires authentication.
   - Deliberately search across several categories in the same run rather than letting
     one dominate: people at **healthcare AI companies**, people at **biomedical/
     health-tech startups**, people at **established medtech/pharma companies**, and —
     if `target_schools` is set — alumni of those schools working in the target field
     (e.g. `"Rutgers" biomedical AI LinkedIn`). School alumni are one useful signal
     among several, not the default bias; mix categories across the batch of results
     instead of returning an all-alumni or all-one-company-type list.
   - If `require_connection` is `connected_only` or `not_connected_only`: say plainly
     that WebSearch cannot determine actual LinkedIn connection status, and skip that
     filter rather than guessing — do not mark anyone `connected` without evidence.

3. **Filter** the raw results:
   - Drop anyone already in the dedup set from step 1.
   - If `exclude_recruiters` is set, skip anyone whose title clearly reads as a
     recruiting/talent-acquisition role.
   - Only keep people with enough real information (name + at least company or title)
     to be useful — don't invent missing fields.

4. **Cap at 5 new suggestions per run.** For each, write a short, honest
   `match_reasons` string grounded in what you actually found (e.g. "Rutgers alum,
   title matches target role 'ML Engineer', bio mentions computational biology") and
   `source_snippet` with whatever text the search actually surfaced — never fabricate
   details not present in the search results.

5. **Write each suggestion via the CLI, never raw SQL**:
   ```
   npx tsx scripts/db-cli.ts suggested-contacts add '{"name": "...", "company": "...", "title": "...", "linkedin_url": "...", "source_snippet": "...", "match_reasons": "..."}'
   ```
   Omit `linkedin_url` if you couldn't confirm one — don't guess a URL. Each call
   defaults `discovered_at` to today, grouping this run into one batch that the
   "Suggested contacts" card on `/cold-email` will display.

6. **Report results to the user**: list what was added (name, company/title, why it
   matched) and remind them these are suggestions only — review and use "Add to
   tracker" on `/cold-email`, or `suggested-contacts promote <id>` here, to actually
   create a contact record. If nothing new was found, say so plainly rather than
   stretching to report stale or already-tracked people.

## Automated invocation

When invoked headlessly (`claude -p /contact-discovery ...` from the app's
`runContactDiscovery()`/`runDailyDiscovery()`, not an interactive session), the prompt
gives you `max_candidates` (cap for step 4) and optionally a `custom_query` string to
fold into your search terms alongside preferences/contact-history signal. Follow steps 1–5
exactly as above (still write via `suggested-contacts add`), but skip step 6's
user-facing report — instead return only the final JSON result `{"addedCount": <number
of suggestions you wrote>, "note": "<one sentence on how the search went>"}`, no
surrounding prose.

## Constraints

- WebSearch only — no scraping of LinkedIn or any site requiring login, same
  constraint as `internship-search` and `contact-intake`.
- Never write directly to `contacts` — always land in `suggested_contacts` for human
  review. Only the user's own "Add to tracker" action (which calls
  `suggested-contacts promote`, itself routed through `insertContact`'s existing
  `linkedin_url` dedup check) creates a real contact row.
- No deep enrichment step — snippet-level info only, matching what a plain web search
  actually returns. Don't invent work history, education, or skills beyond what a
  search result actually shows.
- On-demand only — run whenever the user asks. There is no cron/scheduled invocation
  of this skill.
