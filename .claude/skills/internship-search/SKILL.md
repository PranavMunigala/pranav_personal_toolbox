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
   target company. Note each target company's `careers_url` if set — see the
   target-company search bullet below. Build the "already tracked" dedup set from
   `applications list` (by `link`, and by `company`+`role` as a fallback) AND
   `suggested-applications list-keys` (every suggestion ever made, not just the current
   pending batch — so a dismissed/older-batch posting never resurfaces).

2. **Search two ways with WebSearch**:
   - **Broad criteria search**: newly posted internships/co-ops in AI applied to
     healthcare, biomedical engineering, computational biology, health-tech, and
     anything adjacent to the user's stated roles — posted recently (favor "posted
     today/this week" signals when the source shows them). Run this as a **tiered,
     budgeted sweep** rather than searching every source every time — see "Tiered
     broad search" below.
   - **Target-company search**: for each company in the target-companies list, if it
     has a `careers_url` set, fetch that URL directly first (its own job board is the
     authoritative, freshest source, and unlike guessed generic career-page URLs it's
     already known to work). Only fall back to a WebSearch for that company if
     `careers_url` is absent or the fetch fails. For companies without a
     `careers_url`, search specifically for current internship/entry-level postings at
     that company as before.
   - Handshake is NOT searchable at all (school-login-gated, no public index) — if it
     would have been relevant, say so plainly rather than silently omitting it.
     LinkedIn results may be thin or blocked (it aggressively blocks non-browser
     access) — say so if that happens.

### Tiered broad search (cost/time control)

The broad criteria search covers a lot of ground — search it in escalating tiers
with an early-stop rule, so a typical run (where the first tier already turns up
enough good postings) stays cheap and fast, and only a genuinely thin day pays the
cost of a full sweep across every source.

- **Tier 1 (always search)**: the highest-signal, cheapest sources —
  `site:github.com SimplifyJobs Summer Internships`,
  `site:github.com vanshb03 Summer Internships`,
  `site:github.com Ouckah Summer2026-Internships`, plus one general WebSearch for
  the query terms + "internship" + the current term/year. Issue all of these as one
  batch of parallel WebSearch calls, not one-by-one with reasoning in between. Treat
  these tracker-repo listings as leads to verify, not as evidence of current status —
  they're known to lag real posting status (a role indexed there may already be
  closed), so live-verification (step 6) matters more for this tier than any other.
- **Tier 1b (always search, alongside Tier 1)**: direct-ATS-platform search —
  `site:boards.greenhouse.io internship` + query terms,
  `site:jobs.lever.co internship` + query terms,
  `site:myworkdayjobs.com internship` + query terms — run generally and, for target
  companies without a known `careers_url`, per-company (`"<Company>" site:
  boards.greenhouse.io` etc.). These ATS platforms host the employer's actual live
  job board with no login wall, so they're typically fetchable and are the
  authoritative source — prefer a Tier 1b/direct-ATS result over a Tier 1
  tracker-repo result when both surface the same role. Candidates from this tier
  count toward the same stop-rule total as Tier 1.
- **Tier 2 (only if Tier 1+1b fell short — see stop rule)**: broader job boards —
  ZipRecruiter, Jobright.ai, `site:linkedin.com/jobs`, `site:indeed.com`, and
  `site:wayup.com`. Also batched as parallel calls.
- **Tier 3 (only if Tier 1+1b+2 fell short)**: niche/biomedical-specific sources,
  matching this user's actual field focus rather than generic breadth for its own
  sake — BioSpace Jobs (`site:biospace.com jobs`) and a general "biomedical
  engineering internship" / "health-tech internship" web search.

**Stop rule**: after completing a tier's searches (Tier 1 and Tier 1b count as one
combined step since they always run together), run that tier's new candidates
through steps 3-6 below (classify, dedup, hardcoded filter, live-verify) before
deciding whether to escalate. Count both `confirmed_open` and `plausible_open`
candidates (see step 6) toward the running total against `max_results` — stop once
that combined total is reached, do not search the next tier. Only escalate when
still short after a tier completes. In the worst case (still short after Tier 3),
stop anyway and surface whatever verified/plausible candidates were found — never
keep searching indefinitely.

Steps 3-6 below run once per tier (on that tier's new candidates, plus the
target-company search results alongside Tier 1/1b), not once at the very end —
that's what makes the stop rule possible. Track how many tiers of the broad search
you actually searched (1, 2, or 3 — Tier 1b doesn't add to this count, it's bundled
with Tier 1) as `tiersSearched`, needed for the final result.

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
   non-toggleable gate (the *bar for evidence* is fixed; what counts as sufficient
   evidence is a bit richer than before, see below). For candidates whose `link`
   domain is one of the **known-blocked sources** (`linkedin.com`, `glassdoor.com`,
   Handshake — these systematically 403/login-wall WebFetch), skip straight to the
   `plausible_open` corroboration check below instead of spending a fetch attempt
   that's known to fail.

   For everything else, WebFetch the link. If the fetch fails or is blocked
   (403/access-denied/error), retry **once** with a normalized variant of the URL
   (strip tracking query params, try `https://` if `http://` failed, drop a trailing
   slash/redirect fragment) before giving up on a direct fetch.

   Classify the result:
   - **`confirmed_closed`**: the fetched page *explicitly* says "closed," "no longer
     accepting applications," "position filled"; is a genuine 404; or is a generic
     careers/search homepage instead of the specific posting. A 403/access-denied/
     blocked response is **not** `confirmed_closed` — that's a failed fetch, not
     evidence the role is gone; route it to the check below.
   - **`confirmed_open`**: the specific posting's content is present with a working
     "Apply" flow described, from a fetch that actually succeeded (first or retried).
   - **`plausible_open`**: the direct fetch was blocked/403'd, hit a login wall, or is
     from a known-blocked source, **and** a fresh, separate WebSearch for that exact
     company + role + term returns a snippet that still describes the role as
     open/active — not stale-looking, no "closed"/"filled"/"no longer accepting"
     language in the snippet. This is corroboration from independent evidence, not a
     guess: if there's no such corroborating snippet, this does not apply — fall
     through to `unconfirmed` instead.
   - **`unconfirmed`**: no real evidence either way — empty/JS shell with no content,
     or a blocked fetch with no corroborating search evidence either. Never guess
     `confirmed_open` or `plausible_open` without real evidence backing it.

   `confirmed_open` and `plausible_open` candidates both survive into the next step;
   `confirmed_closed` and `unconfirmed` are discarded. Track which of the two
   surviving classifications each candidate got — it becomes `verification_status` in
   step 8.

7. **Cap and rank**: once escalation stops (per the stop rule above), sort all
   surviving candidates across every tier searched by `relevance_score` descending
   (break ties in favor of `confirmed_open` over `plausible_open`), then cap at the
   run's requested max.

8. **Write each survivor via the CLI, never raw SQL**:
   ```
   npx tsx scripts/db-cli.ts suggested-applications add '{"company": "...", "role": "...", "link": "...", "location": "...", "date_posted": "...", "source_snippet": "...", "match_reasons": "...", "filter_failures": null, "verification_status": "confirmed"}'
   ```
   `filter_failures` is always `null` — only fully-passing, live-verified/plausible
   postings ever get written. `verification_status` is `"confirmed"` for
   `confirmed_open` survivors or `"plausible"` for `plausible_open` survivors (from
   step 6) — always set it explicitly, don't rely on the default. Each call defaults
   `discovered_at` to today.

9. **Report results to the user**: what was added (grouped: target-company matches
   first by commute tier, then broad matches), and call out how many were `plausible`
   (blocked fetch, corroborated by search) vs `confirmed` so the user knows which ones
   are worth double-checking themselves before applying. If nothing new turned up, say
   so plainly — that's a completely valid outcome, don't pad with weak/unconfirmed
   matches. For adding one to the real tracker, hand off to the `internship-intake`
   skill's flow (or `suggested-applications promote <id>`) rather than duplicating that
   logic here.

## Automated invocation

When invoked headlessly (`claude -p /internship-search ...` from the app's
`runInternshipSearch()`/`runDailyInternshipRefresh()`, not an interactive session), the
prompt gives you: `custom_query` (optional), `target_companies_only` (boolean — if true,
step 2's broad search is skipped entirely and only the target-company search runs,
covering every company in the target-companies list regardless of commute tier), and
`max_results` (cap from step 7). If `target_companies_only` is true, the tiered broad
search (and `tiersSearched`) doesn't apply — only the target-company search runs, and
`tiersSearched` should be `0`. Follow steps 1–8 exactly as above (still write via
`suggested-applications add`), but skip step 9's user-facing report — instead return
only the final JSON result `{"addedCount": <candidates written>, "tiersSearched": <0-3,
per the tiered broad search's stop rule>, "note": "<one or two sentences on how the
search went, including any source issues like LinkedIn blocking or Handshake being
unsearchable, and roughly how many results were plausible vs confirmed>"}`, no
surrounding prose. `addedCount` includes both `confirmed` and `plausible` rows written.

## Constraints

- WebSearch/WebFetch only — no scraping of LinkedIn or any site requiring login beyond
  what WebFetch naturally renders; never attempt to log in anywhere.
- Never write directly to `applications` — always land in `suggested_applications` for
  human review.
- Live-verification (step 6) is never skippable or toggle-controlled — the hardcoded
  filters (step 5) are the only user-configurable part, and a candidate that fails any
  enabled filter is discarded, never surfaced for override. The evidence bar for
  survival is fixed (`confirmed_open` or a genuinely corroborated `plausible_open`,
  per step 6) — it never gets softer than that, even under time pressure.
- **Known-blocked sources** (systematically 403/login-wall WebFetch — don't spend a
  fetch attempt on these, go straight to the step-6 corroboration check): LinkedIn,
  Glassdoor, Handshake. If new sources turn out to reliably block fetches, treat them
  the same way and mention it in the run's `note`/report.
- Only extract postings actually present in the search/fetch results, with a real URL —
  never invent a posting or rely on prior knowledge beyond what's shown. This applies
  equally to the `plausible_open` corroborating snippet — it must be real search
  output, never inferred or assumed.
