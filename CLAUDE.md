@AGENTS.md

# Pranav's Personal Toolbox

Private, single-user Next.js app (App Router, TypeScript, Tailwind, shadcn/ui) backed by
a local SQLite file (`data/toolbox.db`, gitignored). No auth — this only ever runs on
localhost for one person.

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
  truth for facts used in drafts).
- **email_drafts** — history of generated drafts per contact.
- **applications** — `status` (`applied`/`oa`/`interview`/`follow_up`/`offer`/`rejected`).
- **application_contacts** — many-to-many join between applications and contacts.
- **target_companies** — fixed list grouped by `commute_tier`
  (`under_30`/`30_45`/`45_60`/`60_75`).
- **preferences** — single row (id=1) storing targeting `industries`/`roles`/
  `seniority_focus`, editable from the Cold Email Tracker UI.

Access this data two ways:
- From the Next.js app: `lib/db/contacts.ts`, `lib/db/applications.ts`,
  `lib/db/targetCompanies.ts`, `lib/db/preferences.ts`.
- From a skill/script: `npx tsx scripts/db-cli.ts <resource> <action> [args]` — a thin
  CLI over the same functions, so skills never write raw SQL and always go through the
  dedup guard.

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
npm run dev     # start the app
npm run seed    # (re-)populate seed contacts + target companies
npm run lint
npx tsc --noEmit
```
