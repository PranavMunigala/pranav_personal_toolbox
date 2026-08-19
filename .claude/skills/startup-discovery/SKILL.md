---
name: startup-discovery
description: Use when the user wants to find new potential outreach contacts by starting from startups (not people directly) in their target fields — searches for early-stage/emerging companies matching their targeting criteria, then finds people who actually work there, cross-checking Rutgers-alumni status as one signal among several. On demand only, never scheduled. Writes candidates to the same review queue as contact-discovery.
---

# Startup discovery

Finds new people to reach out to, but company-first: searches for startups in the
user's target fields, then searches for people who work at those startups. Rutgers
alumni status is checked as one extra signal, never a requirement. Writes suggestions
to the same review queue `contact-discovery` uses (`suggested_contacts`) — never
directly into `contacts`. The user reviews and adds them from the "Suggested contacts"
card on `/cold-email`, or via `suggested-contacts promote` below.

## Steps

1. **Load context first**:
   ```
   npx tsx scripts/db-cli.ts preferences get
   npx tsx scripts/db-cli.ts discovery-preferences get
   npx tsx scripts/db-cli.ts contacts list
   npx tsx scripts/db-cli.ts suggested-contacts list
   ```
   Use `preferences.industries`/`roles` for subject-matter targeting and
   `discovery-preferences.notes`/`target_schools` for standing context (the same
   fields `contact-discovery` reads). Build the dedup set from `contacts list` +
   `suggested-contacts list`, by `linkedin_url`, case-insensitively — never re-suggest
   someone already tracked or queued. Also scan existing contacts' `company` field to
   avoid re-picking startups already heavily represented in the tracker.

2. **WebSearch for startups** matching the user's target fields — computational
   biology, health tech, medical devices, biomedical engineering, health informatics,
   bioinformatics, lab/research-adjacent tooling, and anything else
   `discovery-preferences.notes` calls out. Favor genuinely early-stage/emerging
   companies (seed/Series A-ish, small teams) over large established players — this is
   what distinguishes this skill from just searching people directly. Good query
   shapes: `"biomedical AI startup" funding`, `"computational biology startup" seed`,
   `"medical device startup" 2025 OR 2026`, `site:crunchbase.com biomedical AI startup`.
   Pick **3-5 distinct, promising startups** for this run — not an exhaustive list,
   just enough to keep the people-search in step 3 bounded. Skip any startup that's
   clearly already well-represented among existing `contacts`/pending suggestions
   (from step 1's signal) unless it's a genuinely new team/role there.

3. **For each chosen startup, WebSearch for people who work there** — team/about
   pages, published bios, funding-announcement press (which often names founders/early
   hires), and public LinkedIn snippets. Same constraint as `contact-discovery`: rely
   on public web-search snippets only, never fetch or log into LinkedIn directly, never
   scrape a page that requires authentication.
   - Alongside the general people-search for each startup, also run one targeted
     search for Rutgers alumni there if `target_schools` includes it (e.g. `"Rutgers"
     "<Startup Name>" LinkedIn`). This is a cross-check signal to fold into
     `match_reasons` when it hits — **not** a filter. A startup with no confirmed
     Rutgers alumni is still fully in play; don't skip a startup or a person just
     because that search comes up empty.
   - If `require_connection` is `connected_only` or `not_connected_only`: say plainly
     that WebSearch cannot determine actual LinkedIn connection status, and skip that
     filter rather than guessing.

4. **Filter** the raw results:
   - Drop anyone already in the dedup set from step 1.
   - If `exclude_recruiters` is set, skip anyone whose title clearly reads as a
     recruiting/talent-acquisition role.
   - Only keep people with enough real information (name + at least company or title)
     to be useful — don't invent missing fields.

5. **Cap at 5 new suggestions per run**, spread across the startups searched rather
   than all from one company if avoidable. For each, write a short, honest
   `match_reasons` string naming the startup and why it's a fit (e.g. "Early-stage
   computational biology startup (Series A, ~15 people); title matches target role
   'ML Engineer'; Rutgers alum" or, when no Rutgers signal applies, "Early-stage
   medical device startup; bio mentions biomedical engineering background" — never pad
   in a Rutgers mention that wasn't actually confirmed) and `source_snippet` with
   whatever text the search actually surfaced.

6. **Write each suggestion via the CLI, never raw SQL** — same table and call shape as
   `contact-discovery`:
   ```
   npx tsx scripts/db-cli.ts suggested-contacts add '{"name": "...", "company": "...", "title": "...", "linkedin_url": "...", "source_snippet": "...", "match_reasons": "..."}'
   ```
   Omit `linkedin_url` if you couldn't confirm one — don't guess a URL.

7. **Report results to the user**: list the startups searched and, per startup, who
   was found and why (name, title, whether the Rutgers signal applied). Remind them
   these are suggestions only — review and use "Add to tracker" on `/cold-email`, or
   `suggested-contacts promote <id>` here. If a startup search turned up promising
   companies but no reachable people, say so rather than stretching to report someone
   thin. If nothing new was found at all, say so plainly.

## Automated invocation

When invoked headlessly (`claude -p /startup-discovery ...` from the app's
`runStartupDiscovery()`, not an interactive session), the prompt gives you
`max_candidates` (cap for step 5) and optionally a `custom_query` string to fold into
the startup search in step 2 alongside preferences/contact-history signal. Follow steps
1-6 exactly as above (still write via `suggested-contacts add`), but skip step 7's
user-facing report — instead return only the final JSON result `{"addedCount": <number
of suggestions you wrote>, "note": "<one sentence on which startups were searched and
how it went>"}`, no surrounding prose.

## Constraints

- WebSearch only — no scraping of LinkedIn, Crunchbase, or any site requiring login,
  same constraint as `contact-discovery`/`internship-search`/`contact-intake`.
- Never write directly to `contacts` — always land in `suggested_contacts` for human
  review, exactly like `contact-discovery`.
- Rutgers-alumni status is a cross-check signal only, never a filter — a strong
  candidate at a strong-fit startup is still worth suggesting with no Rutgers
  connection at all.
- Don't invent a startup that didn't actually turn up in search results, and don't
  invent a person's role/background beyond what a search result actually shows.
- On-demand only — run whenever the user asks. There is no cron/scheduled invocation
  of this skill.
