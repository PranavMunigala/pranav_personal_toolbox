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

## AI provider (in-app AI features)

The app's own AI-powered features (contact discovery, internship search, posting
verification, contact enrichment, email drafting — everything under `lib/discovery/`
and `lib/email/`) run by shelling out to the **Claude Code CLI itself**
(`lib/claudeCode/runSkill.ts::runSkill()`), invoking the same interactive skills under
`.claude/skills/` headlessly — not a direct OpenRouter/TinyFish API integration. There
is no more separate/parallel AI stack: the app and an interactive Claude Code session
now go through the exact same skill instructions.

- `runSkill({ skill, prompt, jsonSchema, allowedTools, timeoutMs })` spawns `claude -p
  "/<skill> <prompt>" --output-format json --json-schema <schema> --allowedTools
  <scoped list> --disallowedTools "Edit Write NotebookEdit" --no-session-persistence
  --strict-mcp-config --permission-mode manual` as a child process rooted at the repo,
  parses the `structured_output` field of the JSON envelope, and kills the process on
  timeout. Tool access is always scoped per-call to exactly what that flow needs (e.g.
  `Bash(npx tsx scripts/db-cli.ts:*)`, `WebSearch`, `WebFetch`) — **never** a blanket
  `--dangerously-skip-permissions`, since this runs unattended from a server action.
- Each skill invoked this way does its own real work — WebSearch/WebFetch and reasoning
  natively as Claude, plus persistence via `scripts/db-cli.ts` — and returns one final
  JSON result matching a small schema (e.g. `{addedCount, note}`). The calling
  `lib/discovery/*`/`lib/email/*` function then re-queries the DB directly (by
  before/after id snapshot) to build its return value, so the DB — not the model's
  self-report — is always the source of truth for what actually got written.
- Deterministic, non-negotiable business logic stays real TypeScript that skills shell
  out to rather than being reimplemented in prose: `lib/discovery/internshipFilters.ts`
  (hardcoded eligibility rules) is exposed to the `internship-search` skill via `npx tsx
  scripts/internship-filter-cli.ts check`. Rate limiting/cooldown gating
  (`getDiscoveryRateLimitStatus`, `getInternshipRateLimitStatus`, the `MAX_NAMES_PER_RUN`
  cap on enrichment) also stays pure TypeScript in the `lib/discovery/*`/`lib/email/*`
  wrappers — it decides *whether* to spend a `claude -p` invocation at all, not
  something delegated to the model. Each headless invocation costs real API money, so
  these pre-flight guards matter for cost control, not just correctness.
- Eight skills participate: `cold-email-draft`, `contact-discovery`, `internship-search`,
  `biomed-research` (each gaining an "Automated invocation" section in their SKILL.md
  describing the headless prompt/result contract), plus `contact-enrichment` and
  `startup-discovery` skills (there was previously no skill equivalent to
  `enrichContacts()`, and `startup-discovery` is new — see "Skills" below).
  `internship-intake` and `contact-intake` remain
  interactive-only — no server action shells out to them.

## Modules / routes

- `/cold-email` — outreach contact tracker (`app/cold-email/`)
- `/internships` — application tracker + target-company list (`app/internships/`)
- `/research` — biomedical/biotech scouting notes (`app/research/`), backed by markdown
  profiles under `research/{companies,products,topics}/` at the project root. The
  `biomed-research` skill (interactive and headless, via
  `lib/research/runResearch.ts::runResearch()`) writes/updates these files through
  `scripts/research-cli.ts` rather than the Write tool directly, so both modes persist
  profiles the same way. No DB table backs this — the files on disk are the source of
  truth.
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
- **email_drafts** — append-only version history of generated drafts per contact; each
  refinement via the "Refine this draft" chat box on a contact's detail page creates a
  new row rather than editing in place.
- **email_draft_chat_messages** — chat turns for the refine box, scoped by `contact_id`
  (`lib/db/emailDraftChat.ts`); `resulting_draft_id` links an assistant turn to the
  `email_drafts` row it produced, null on refusal. The skill never writes either table
  directly — `app/cold-email/actions.ts::refineEmailDraftAction` persists both sides.
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
- **suggested_contacts** — candidates found by contact discovery or startup discovery,
  pending human review (`status`: `pending`/`added`/`dismissed`); promoting one always
  goes through `insertContact`, never a raw insert. `startup-discovery` writes into this
  same table (via `lib/discovery/runStartupDiscovery.ts::runStartupDiscovery()`) rather
  than a separate one — it's company-first (searches for early-stage startups in the
  target fields, then people at those startups, cross-checking Rutgers alumni as one
  signal, never a filter) but the output is still a person suggestion.
- **discovery_preferences** — single row (id=1): `target_schools`, `require_connection`
  (`any`/`connected_only`/`not_connected_only`), `exclude_recruiters`, `notes` (standing
  context), `last_discovery_run_at` — narrows/rate-limits what discovery searches for.
  Two run modes from `lib/discovery/runContactDiscovery.ts`: `runContactDiscovery()` is
  the specific/ad-hoc search (unlimited runs/day, caps at 3 results) and
  `runDailyDiscovery()` is the general sweep off preferences and existing contacts alone
  (once per day, caps at 5 results, gated by `last_discovery_run_at`).
- **suggested_applications** — postings found by internship search, pending human review
  (same `pending`/`added`/`dismissed` shape as `suggested_contacts`), plus a
  `filter_failures` column (JSON array of reason strings; always null today — see below,
  kept only for schema compatibility with any pre-existing rows); promoting one always
  goes through `insertApplication` (via `findExistingApplication` dedup), never a raw
  insert. Two entry points in `lib/discovery/runInternshipSearch.ts`, sharing one
  internal pipeline:
  `runInternshipSearch(customQuery?)` is Feature 1 — on-demand casual browsing,
  unlimited runs/day, always broad (never restricted to target companies), up to 5
  fully-passing results/run; `runDailyInternshipRefresh()` is Feature 2 — passive
  refresh, rate-limited once/24h (gated by `preferences.last_internship_refresh_at`),
  always restricted to the `target_companies` list only, "however many are new" up to a
  generous sanity cap (20) — returns zero rather than backfilling with non-target
  postings. Both delegate the actual search/reasoning/persistence to the
  `internship-search` skill via `runSkill()` (see "AI provider" above) — the skill
  covers named sources (GitHub internship-tracking repos as the most reliable, plus
  ZipRecruiter, Jobright.ai, and site-restricted LinkedIn/general web queries) via its
  own native WebSearch calls, not TypeScript-built queries — no Handshake/LinkedIn/
  ZipRecruiter credentials exist or are needed; Handshake specifically cannot be
  searched at all (school-login-gated, no public index) and the skill's instructions
  say to flag that when relevant rather than silently omit it. Every candidate is scored
  against the same **hardcoded filters** module
  (`lib/discovery/internshipFilters.ts::checkHardcodedFilters` — role type, paid-only,
  location/term, seniority/class-year, resume relevance — enforced in code, called by
  the skill via `npx tsx scripts/internship-filter-cli.ts check` against structured
  fields the skill must emit per candidate, not just prompted). Each filter returns a
  pass/fail *and* a human-readable reason on failure, not just a boolean, but a candidate
  that fails ≥1 enabled filter is discarded outright — only postings that pass every
  currently-enabled filter are ever surfaced (no near-miss/override bucket). Passing
  candidates then go through a **live verification** gate — the skill WebFetches each
  candidate's actual URL and classifies the real fetched content itself (the rules live
  in `internship-search`'s SKILL.md, previously in the now-deleted
  `lib/discovery/verifyPosting.ts`); only `confirmed_open` survives — postings with no
  link, that fail a filter, or that can't be confirmed either way, are excluded rather
  than shown. Verification is a hard, non-toggleable gate; the 5 hardcoded eligibility
  rules are the only user-configurable part (via the Filters tab), and they gate
  inclusion outright rather than being soft/overridable. The skill writes survivors
  directly via `npx tsx scripts/db-cli.ts suggested-applications add`; the TS wrapper in
  `runInternshipSearch.ts` re-queries the DB by before/after id snapshot afterward to
  build its return value (source of truth, not the model's self-report), defensively
  filtering out any row with `filter_failures` set. Dedup
  (`lib/db/suggestedApplications.ts::listAllSuggestedApplicationKeys`) checks every
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

Access this data two ways:
- From the Next.js app: `lib/db/contacts.ts`, `lib/db/applications.ts`,
  `lib/db/targetCompanies.ts`, `lib/db/preferences.ts`, `lib/db/suggestedContacts.ts`,
  `lib/db/suggestedApplications.ts`, `lib/db/discoveryPreferences.ts`,
  `lib/db/internshipFilterSettings.ts`.
- From a skill/script: `npx tsx scripts/db-cli.ts <resource> <action> [args]` — a thin
  CLI over the same functions, so skills never write raw SQL and always go through the
  dedup guard. Resources: `contacts`, `applications`, `target-companies`, `preferences`,
  `suggested-contacts`, `suggested-applications`, `email-drafts`, `discovery-preferences`.
  This is also how headlessly-invoked skills (via `runSkill()`) persist everything they
  find/draft — see "AI provider" above.

## The dedup guard (critical — do not bypass)

`lib/db/contacts.ts::markSent()` is the **only** path that transitions a contact to
`sent`. It checks the contact's own current status and any other contact record sharing
the same `linkedin_url`, and refuses if either is already `sent` or `coffee_chatted`. The
`cold-email-draft` skill and the UI's status dropdown both route through this — never add
a second way to set `status = 'sent'` that skips it.

## Skills (`.claude/skills/`)

- `contact-intake` — structures a pasted LinkedIn URL + profile text into a contact row.
  Interactive-only, not invoked headlessly by the app.
- `cold-email-draft` — drafts seniority-tiered outreach emails; enforces the dedup guard;
  never sends (draft-only, user copies into Gmail themselves). Invoked both
  interactively and headlessly by `lib/email/draftEmail.ts::draftEmailForContact()` (see
  its "Automated invocation" section).
- `internship-intake` — parses a pasted job posting URL (via WebFetch) into an
  application row. Interactive-only, not invoked headlessly by the app.
- `internship-search` — searches (via WebSearch/WebFetch) for new postings matching
  targeting preferences and the fixed target-company list; scores against hardcoded
  filters, live-verifies, dedups against the tracker, writes to `suggested_applications`.
  Invoked both interactively and headlessly by
  `lib/discovery/runInternshipSearch.ts::runInternshipSearch()`/
  `runDailyInternshipRefresh()`.
- `outreach-recommender` — cross-references applications against contacts to suggest who
  to reach out to or follow up with next. Interactive-only, not invoked headlessly by
  the app.
- `contact-discovery` — WebSearches for new people (biomedical AI/medical
  devices/informatics) matching targeting/discovery preferences and the mix of
  companies/people already in the tracker (existing `contacts` as a steering signal, not
  just dedup — deliberately spread across healthcare AI companies, biomedical/health-tech
  startups, established medtech/pharma, and school alumni, rather than biasing toward any
  one category); writes candidates to `suggested_contacts` for review on `/cold-email`,
  never directly into `contacts`. On-demand only, no scraping/enrichment API. Invoked both
  interactively and headlessly by
  `lib/discovery/runContactDiscovery.ts::runContactDiscovery()`/`runDailyDiscovery()`.
- `startup-discovery` — company-first counterpart to `contact-discovery`: WebSearches for
  early-stage startups in the target fields, then for people who work at those startups,
  cross-checking Rutgers-alumni status (`discovery-preferences.target_schools`) as one
  signal, never a filter. Writes into the same `suggested_contacts` review queue as
  `contact-discovery`, never directly into `contacts`. On-demand only. Invoked both
  interactively and headlessly by
  `lib/discovery/runStartupDiscovery.ts::runStartupDiscovery()`.
- `contact-enrichment` — given a list of existing contact names, WebSearches each and
  fills only missing `linkedin_url`/`alma_mater`/`industry_tags` fields, never
  overwrites or creates. Invoked headlessly by
  `lib/discovery/enrichContacts.ts::enrichContacts()`.
- `biomed-research` — lives natively at `.claude/skills/biomed-research/` (no longer a
  submodule — `bme-research` was folded into this repo's own history). Writes profiles
  under `research/{companies,products,topics}/` at the project root via
  `scripts/research-cli.ts`, never the Write tool directly, in both interactive and
  headless runs. Invoked both interactively and headlessly by
  `lib/research/runResearch.ts::runResearch()` (see "AI provider" above).

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
