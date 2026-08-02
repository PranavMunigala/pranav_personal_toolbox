@AGENTS.md

# Pranav's Personal Toolbox

Private, single-user Next.js app (App Router, TypeScript, Tailwind, shadcn/ui) backed by
a local SQLite file (`data/toolbox.db`, gitignored). No auth — this only ever runs on
localhost for one person.

## ⚠️ HARD RULE: never send an email without explicit human approval

This applies everywhere in this repo, in every skill, script, and agent session — no
exceptions, no "just this once." No mail-provider integration (Gmail or otherwise) is
connected to this project, and none should be added without the user explicitly asking
for it in that moment.

- The app is **draft-only**. `email_drafts` stores generated drafts; nothing in this
  codebase (app, skill, or script) is permitted to call a send-email API or MCP tool.
  The user copies a draft into Gmail and sends it themselves.
- Marking a contact `sent` in the tracker (via `markSent()`) only records that the user
  already sent something themselves — it never triggers an actual send.
- If you (an agent) are ever unsure whether an action would send an email, stop and ask
  first rather than proceeding.

## LLM / search provider (in-app AI features)

The app's own AI-powered features (contact discovery, internship search, posting
verification, contact enrichment, email drafting — everything under `lib/discovery/`
and `lib/email/`) run on **OpenRouter + TinyFish**, not the Anthropic API directly, even
though this whole toolbox is built and maintained via Claude Code:

- **Text generation/reasoning** — `lib/openrouter/client.ts::callOpenRouter()`, a thin
  `fetch` wrapper around `https://openrouter.ai/api/v1/chat/completions`
  (`OPENROUTER_API_KEY`). Two presets: `MODEL_LIGHT` (`@preset/pranav`, DeepSeek v4
  Flash) for filtering/classification/verification, `MODEL_HEAVY`
  (`@preset/pranav-high`, Kimi K3) for relevance ranking/reasoning and writing. Uses
  `response_format: json_schema` for structured output — no tool-calling, since custom
  OpenRouter presets aren't confirmed to support it reliably.
- **Web search/fetch** — `lib/tinyfish/client.ts` (`TINYFISH_API_KEY`, free, no
  credits). `searchWeb()` hits `api.search.tinyfish.ai`; `fetchUrls()` posts to
  `api.fetch.tinyfish.ai` (renders in a real Chromium browser, so it works on JS-heavy
  boards like LinkedIn/Handshake that a plain HTTP fetch can't read — up to 10 URLs per
  request, chunked automatically for more). Search/fetch is done in plain code, then the
  real results are handed to OpenRouter as context to reason over — this decouples
  "can we get live web data" from "does this LLM preset support tools," which is more
  reliable than delegating browsing to the model itself.
- Every discovery/search module follows the same shape: gather real material via
  TinyFish → one `callOpenRouter()` call with a JSON-schema-constrained prompt to
  extract/classify/rank → app-layer filtering/dedup on the structured result → write to
  the DB. See `lib/discovery/verifyPosting.ts` for the simplest example of this pattern.

## Modules / routes

- `/cold-email` — outreach contact tracker (`app/cold-email/`)
- `/internships` — application tracker + target-company list (`app/internships/`)
- `/research` — biomedical/biotech scouting notes, mirrored from the `vendor/bme-research`
  submodule (`app/research/`)
- `/notes` — RAG study assistant, mirrored from the `vendor/athena` submodule
  (`app/notes/`) — Athena itself is a separate Python/Streamlit app; this route only
  surfaces its docs/corpus, it doesn't run it in-process.

## Data model (`lib/db/schema.sql`, applied idempotently on every connection)

- **contacts** — `seniority_tier` (`peer`/`mid`/`senior`), `status`
  (`not_contacted`/`drafted`/`sent`/`coffee_chatted`/`no_response`), `industry_tags`
  (JSON array), `profile_text` (raw pasted LinkedIn About/Experience — the only source of
  truth for facts used in drafts). Also `phone`, `is_recruiter`, `connection_status`
  (`not_connected`/`pending`/`connected` — a separate axis from outreach `status`),
  `alma_mater`, and `is_close_connection`/`relation` (personal-network signal — "am I
  close with this person" + free text like "Theta Tau"/"friend"/"mom's friend"; surfaced
  on `/internships` when the contact's company matches a tracked application, not shown
  as its own section on `/cold-email`) — all added via a `PRAGMA table_info`-based
  migration guard in `lib/db/index.ts` (SQLite has no
  `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).
- **email_drafts** — history of generated drafts per contact.
- **applications** — `status` (`applied`/`oa`/`interview`/`follow_up`/`offer`/`rejected`),
  plus `interview_contact_name`/`interview_contact_email` (whoever reaches out to
  schedule an interview — plain fields, not linked to `contacts`).
- **application_contacts** — many-to-many join between applications and contacts
  (`linkContactToApplication`/`getContactsForApplication` exist in
  `lib/db/applications.ts` but currently have no UI — available for future use).
- **target_companies** — fixed list grouped by `commute_tier`
  (`under_30`/`30_45`/`45_60`/`60_75`); hidden by default on `/internships` behind a
  toggle, with add/remove UI (`addTargetCompanyAction`/`removeTargetCompanyAction` in
  `app/internships/actions.ts`, backed by `upsertTargetCompany`/`deleteTargetCompany` in
  `lib/db/targetCompanies.ts`). Weights internship search results toward these companies
  without restricting to them, unless the search's "only target companies" option is on.
- **preferences** — single row (id=1) storing targeting `industries`/`roles`/
  `seniority_focus`, editable from the Cold Email Tracker UI, plus
  `last_internship_refresh_at` (shared cross-module singleton — also read by internship
  search).
- **suggested_contacts** — candidates found by contact discovery, pending human review
  (`status`: `pending`/`added`/`dismissed`); promoting one always goes through
  `insertContact`, never a raw insert.
- **discovery_preferences** — single row (id=1): `target_schools`, `require_connection`
  (`any`/`connected_only`/`not_connected_only`), `exclude_recruiters`, `notes` (standing
  context), `last_discovery_run_at` — narrows/rate-limits what discovery searches for.
  Two run modes from `lib/discovery/runContactDiscovery.ts`: `runContactDiscovery()` is
  the specific/ad-hoc search (unlimited runs/day, caps at 3 results) and
  `runDailyDiscovery()` is the general sweep off resume+preferences alone (once per day,
  caps at 5 results, gated by `last_discovery_run_at`).
- **suggested_applications** — postings found by internship search, pending human review
  (same `pending`/`added`/`dismissed` shape as `suggested_contacts`), plus a
  `filter_failures` column (JSON array of reason strings, null if it passed every
  enabled filter); promoting one always goes through `insertApplication` (via
  `findExistingApplication` dedup), never a raw insert — this is unchanged whether the
  suggestion fully matched or is a near-miss. Two entry points in
  `lib/discovery/runInternshipSearch.ts`, sharing one internal pipeline:
  `runInternshipSearch(customQuery?)` is Feature 1 — on-demand casual browsing,
  unlimited runs/day, always broad (never restricted to target companies), up to 5
  fully-passing results/run; `runDailyInternshipRefresh()` is Feature 2 — passive
  refresh, rate-limited once/24h (gated by `preferences.last_internship_refresh_at`),
  always restricted to the `target_companies` list only, "however many are new" up to a
  generous sanity cap (20) — returns zero rather than backfilling with non-target
  postings. Both search across named sources (GitHub internship-tracking repos as the
  most reliable, plus ZipRecruiter, Jobright.ai, and site-restricted LinkedIn/general
  web queries) via real TinyFish `searchWeb()` calls built in code
  (`buildQueries()`), not model-directed browsing — no Handshake/LinkedIn/ZipRecruiter
  credentials exist or are needed; Handshake specifically cannot be searched at all
  (school-login-gated, no public index) and the prompt tells the model to flag that when
  relevant rather than silently omit it. Every candidate from either entry point is
  scored against the same **hardcoded filters** module
  (`lib/discovery/internshipFilters.ts::checkHardcodedFilters` — role type, paid-only,
  location/term, seniority/class-year, resume relevance — enforced in code against
  structured fields the model must emit, not just prompted). Each filter returns a
  pass/fail *and* a human-readable reason on failure, not just a boolean, so failures
  aren't silently dropped: a candidate that fails ≥1 enabled filter but still has a link
  is kept as a **near-miss** rather than discarded. Both fully-passing and near-miss
  candidates then go through the same **live verification** gate
  (`lib/discovery/verifyPosting.ts::verifyPostings` — fetches each candidate's actual URL
  via TinyFish and asks OpenRouter to classify the real fetched content; only
  `confirmed_open` survives from either group — postings with no link, or that can't be
  confirmed either way, are excluded rather than shown). Verification is a hard,
  non-toggleable gate; only the 5 hardcoded eligibility rules are soft/visible/
  overridable. Verified near-misses are capped separately (5/run) and inserted with
  `filter_failures` populated; the UI (`suggested-applications-card.tsx`) shows them in
  a separate "Didn't fully match — review" section with the specific reasons as badges,
  and Add/Dismiss work identically to full matches (Add = override, Dismiss = reject).
  Dedup (`lib/db/suggestedApplications.ts::listAllSuggestedApplicationKeys`) checks every
  suggestion ever made, not just the current pending batch, so a dismissed or
  older-batch posting never resurfaces. Zero results is a valid, expected outcome for
  both features — do not add fallback padding.
- **internship_filter_settings** — single row (id=1): enable flag + editable value per
  hardcoded filter (`role_type_enabled`, `paid_only_enabled`, `location_enabled` +
  `location_state`, `seniority_enabled` + `eligible_class_years`, `relevance_enabled` +
  `relevance_min_score`). Defaults match the originally-specified always-on rules
  (all enabled, `location_state = "NJ"`, `eligible_class_years =
  ["sophomore","junior"]`, `relevance_min_score = 3`). Read fresh on every search run
  (`lib/db/internshipFilterSettings.ts::getInternshipFilterSettings`), so edits made on
  the `/internships` "Filters" tab apply live with no restart. Live posting verification
  is never part of this table — it's not a toggleable rule.
- **resume** — single row (id=1): `raw_text` + locally-extracted `keywords` (no LLM
  call), used as a match signal for both contact discovery and internship search.

Access this data two ways:
- From the Next.js app: `lib/db/contacts.ts`, `lib/db/applications.ts`,
  `lib/db/targetCompanies.ts`, `lib/db/preferences.ts`, `lib/db/suggestedContacts.ts`,
  `lib/db/suggestedApplications.ts`, `lib/db/discoveryPreferences.ts`,
  `lib/db/internshipFilterSettings.ts`, `lib/db/resume.ts`.
- From a skill/script: `npx tsx scripts/db-cli.ts <resource> <action> [args]` — a thin
  CLI over the same functions, so skills never write raw SQL and always go through the
  dedup guard. Resources: `contacts`, `applications`, `target-companies`, `preferences`,
  `suggested-contacts`, `discovery-preferences`, `resume`.

## The dedup guard (critical — do not bypass)

`lib/db/contacts.ts::markSent()` is the **only** path that transitions a contact to
`sent`. It checks the contact's own current status and any other contact record sharing
the same `linkedin_url`, and refuses if either is already `sent` or `coffee_chatted`. The
`cold-email-draft` skill and the UI's status dropdown both route through this — never add
a second way to set `status = 'sent'` that skips it.

## Skills (`.claude/skills/`)

- `contact-intake` — structures a pasted LinkedIn URL + profile text into a contact row.
- `cold-email-draft` — drafts seniority-tiered outreach emails; enforces the dedup guard;
  never sends (draft-only, user copies into Gmail themselves).
- `internship-intake` — parses a pasted job posting URL (via WebFetch) into an
  application row.
- `internship-search` — searches (via WebSearch) for new postings matching targeting
  preferences and the fixed target-company list; dedups against the tracker.
- `outreach-recommender` — cross-references applications against contacts to suggest who
  to reach out to or follow up with next.
- `contact-discovery` — WebSearches for new people (biomedical AI/medical
  devices/informatics) matching resume + targeting/discovery preferences; writes
  candidates to `suggested_contacts` for review on `/cold-email`, never directly into
  `contacts`. On-demand only, no scraping/enrichment API.
- `biomed-research` — symlinked from `vendor/bme-research/.claude/skills/biomed-research`
  (kept in sync automatically since it's a symlink into the submodule's working tree).
  Writes profiles under `research/` relative to wherever it's invoked from — when working
  in this toolbox, point it at `vendor/bme-research/research/` so content stays in the
  submodule rather than forking a second copy at the toolbox root.

## Conventions

- Server actions live in `app/<module>/actions.ts`; client components call them and
  surface results via `sonner` toasts.
- This shadcn/ui setup is on **base-ui**, not Radix — trigger components take a `render`
  prop (`<DialogTrigger render={<Button>...</Button>} />`), not `asChild`.
- Submodules: `git submodule update --init --recursive` after cloning. Don't edit files
  inside `vendor/` from this repo's history — commit changes there and update the
  submodule pointer, since they're independent repos.

## Common commands

```bash
npm run dev          # start the app
npm run seed         # (re-)populate seed contacts + target companies
npm run import-sheet # one-time import of scripts/fixtures/cold-email-sheet.json
npm run lint
npx tsc --noEmit
```
