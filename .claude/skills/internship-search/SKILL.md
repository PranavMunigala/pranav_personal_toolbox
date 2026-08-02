---
name: internship-search
description: Use when the user wants to search for newly posted internships/roles that match their targeting criteria, either on demand or as a daily check. Searches both broad AI/biomedical/health-tech/comp-bio postings and the fixed target-company list, and only surfaces postings not already in the tracker.
---

# Internship search

Finds newly posted internships matching the user's criteria and their fixed
target-company list, deduped against what's already tracked, scores each against
hardcoded eligibility rules, live-verifies each surviving posting is still actually
open, and writes results to a review queue (`suggested_applications`) — never directly
into `applications`.

## Interactive mode (user asking directly, e.g. "find me more internships")

1. **Load context first**:
   ```
   npx tsx scripts/db-cli.ts preferences get
   npx tsx scripts/db-cli.ts target-companies list
   npx tsx scripts/db-cli.ts applications list
   npx tsx scripts/db-cli.ts suggested-applications list-keys
   ```
   Use the `industries`/`roles` from preferences and the `name`/`location` from each
   target company. Build the "already tracked" dedup set from `applications list` (by
   `link`, and by `company`+`role` as a fallback) AND `suggested-applications list-keys`
   (every suggestion ever made, not just the current pending batch — so a
   dismissed/older-batch posting never resurfaces).

2. **Search two ways with WebSearch**:
   - **Broad criteria search**: newly posted internships/co-ops in AI applied to
     healthcare, biomedical engineering, computational biology, health-tech, and
     anything adjacent to the user's stated roles — posted recently (favor "posted
     today/this week" signals when the source shows them). Cover named sources: GitHub
     internship-tracking repos (`site:github.com SimplifyJobs Summer Internships`,
     `site:github.com vanshb03 Summer Internships`), ZipRecruiter, Jobright.ai,
     `site:linkedin.com/jobs`, and general web search.
   - **Target-company search**: for each company in the target-companies list, search
     specifically for current internship/entry-level postings at that company.
   - Handshake is NOT searchable at all (school-login-gated, no public index) — if it
     would have been relevant, say so plainly rather than silently omitting it.
     LinkedIn results may be thin or blocked (it aggressively blocks non-browser
     access) — say so if that happens.

3. **Classify every candidate with these structured fields** (used for filtering below —
   be honest and conservative, don't round in the candidate's favor):
   - `role_type`: `"internship"` or `"co_op"` only if that's genuinely what it is —
     `"other"` for full-time/new-grad/associate roles (even if similarly titled).
   - `compensation`: `"paid"` only if the posting confirms pay — `"unpaid"` if
     explicitly unpaid/volunteer, `"unknown"` if not stated.
   - `term`: `"fall"`, `"winter"`, `"spring"`, or `"summer"` — `"unknown"` if not stated.
   - `state`: two-letter US state the role is physically based in if determinable, null
     if remote-only/unclear/not in the US.
   - `eligible_class_years`: array inferred from stated eligibility (e.g.
     `["sophomore","junior"]`), best effort from what the posting actually says.
   - `relevance_score`: 1-5 integer, fit for the candidate's resume/background — ranking
     only, not itself a hard filter.

4. **Filter out anything already tracked** using the dedup set built in step 1. Only
   consider genuinely new postings from here on.

5. **Run the hardcoded eligibility filter** — real code, not prose judgment — on every
   deduped candidate that has a link:
   ```
   npx tsx scripts/internship-filter-cli.ts check '<json array of the structured fields from step 3, in candidate order>'
   ```
   This returns `[{candidate_index, pass, failedReasons}]` per candidate, respecting
   whatever filters are currently enabled/configured in the app's Filters settings.
   Candidates that `pass` continue to the next step; candidates that fail ≥1 filter are
   **discarded** — only postings that meet every currently-enabled filter are ever
   surfaced.

6. **Live-verify every passed candidate's link** with WebFetch — this is a hard,
   non-toggleable gate. For each posting's actual fetched page content, classify:
   - **`confirmed_closed`**: content says "closed," "no longer accepting applications,"
     "position filled"; a 404/error page; or a generic careers/search homepage instead
     of the specific posting.
   - **`confirmed_open`**: the specific posting's content is present with a working
     "Apply" flow described.
   - **`unconfirmed`**: login wall, empty/JS shell with no real posting content, or you
     genuinely can't tell either way — never guess `confirmed_open` without real
     evidence in the fetched content.
   Only `confirmed_open` candidates survive into the next step.

7. **Cap and rank**: sort survivors by `relevance_score` descending, then cap at the
   run's requested max.

8. **Write each survivor via the CLI, never raw SQL**:
   ```
   npx tsx scripts/db-cli.ts suggested-applications add '{"company": "...", "role": "...", "link": "...", "location": "...", "date_posted": "...", "source_snippet": "...", "match_reasons": "...", "filter_failures": null}'
   ```
   `filter_failures` is always `null` — only fully-passing, live-verified postings ever
   get written. Each call defaults `discovered_at` to today.

9. **Report results to the user**: what was added (grouped: target-company matches
   first by commute tier, then broad matches). If nothing new/verified turned up, say so
   plainly — that's a completely valid outcome, don't pad with weak or unverified
   matches. For adding one to the real tracker, hand off to the `internship-intake`
   skill's flow (or `suggested-applications promote <id>`) rather than duplicating that
   logic here.

## Automated invocation

When invoked headlessly (`claude -p /internship-search ...` from the app's
`runInternshipSearch()`/`runDailyInternshipRefresh()`, not an interactive session), the
prompt gives you: `custom_query` (optional), `target_companies_only` (boolean — if true,
step 2's broad search is skipped entirely and only the target-company search runs,
covering every company in the target-companies list regardless of commute tier), and
`max_results` (cap from step 7). Follow steps 1–8 exactly as above (still write via
`suggested-applications add`), but skip step 9's user-facing report — instead return
only the final JSON result `{"addedCount": <candidates written>, "note": "<one or two
sentences on how the search went, including any source issues like LinkedIn blocking or
Handshake being unsearchable>"}`, no surrounding prose.

## Constraints

- WebSearch/WebFetch only — no scraping of LinkedIn or any site requiring login beyond
  what WebFetch naturally renders; never attempt to log in anywhere.
- Never write directly to `applications` — always land in `suggested_applications` for
  human review.
- Live-verification (step 6) is never skippable or toggle-controlled — the hardcoded
  filters (step 5) are the only user-configurable part, and a candidate that fails any
  enabled filter is discarded, never surfaced for override.
- Only extract postings actually present in the search/fetch results, with a real URL —
  never invent a posting or rely on prior knowledge beyond what's shown.
