---
name: linkedin-quick-add
description: Use when the user gives just a LinkedIn URL (found through their own manual search, not through contact-discovery/startup-discovery) and wants that person added to the Cold Email Tracker without pasting any profile text. Searches the web for enough public info to structure a contact; never fetches or scrapes LinkedIn directly.
---

# LinkedIn quick add

Turn a bare LinkedIn URL into a structured `contacts` row, using WebSearch to find
public info about the person instead of requiring pasted profile text like
`contact-intake` does. This skill only creates the contact — it does not draft an
email itself; the caller chains into `cold-email-draft` separately afterward (same
split responsibility as `promoteSuggestedContactAction` does for suggested contacts).

## Steps

1. **Check for an existing record first**:
   ```
   npx tsx scripts/db-cli.ts contacts find-by-linkedin "<url>"
   ```
   If it returns a non-null contact, report the existing contact (name, status) and
   stop — never create a duplicate row for the same LinkedIn URL.

2. **WebSearch for public info about this person**, same snippet-only approach as
   `contact-enrichment`/`contact-discovery`: never fetch or log into the LinkedIn URL
   itself, never scrape any page that requires authentication. Start with searches
   anchored on the URL (e.g. `"<url>"`, the URL's slug/handle) to surface the name and
   employer; once a name is confirmed, follow up with `"<name>" "<company>"`-style
   searches for title, background, and any bio text (press mentions, company team
   pages, conference bios, etc.).

3. **Extract fields from what search actually confirms**:
   - `name` — required; if search can't confirm even this, refuse (step 4).
   - `company` — current employer, if found.
   - `title` — current role/title, if found.
   - `seniority_tier` — infer using the same rubric as `contact-intake`:
     - `peer` — student, intern, <2 years out of school, individual early-career role.
     - `mid` — individual contributor/scientist/engineer with several years of
       experience, not yet in a senior/leadership title.
     - `senior` — Director+, VP, Founder, Chief/Head of, physician (MD), or a person
       notable enough in their field that a more formal tone is warranted.
     Default to `mid` if nothing in the search results signals otherwise.
   - `industry_tags` — cross-check against the user's current targeting preferences
     (`npx tsx scripts/db-cli.ts preferences get`); tag with whichever industries/roles
     actually apply based on what search found — don't force-fit tags with no basis.
   - `profile_text` — a short summary built only from confirmed search snippets (e.g.
     "Search-derived: ~2 years as an ML Engineer at Acme Bio per company team page and
     a 2025 funding-announcement press mention."). Prefix it as search-derived so
     `cold-email-draft` (which treats `profile_text` as ground truth) doesn't read it
     as pasted first-person detail — it's still real info, just thinner than a full
     pasted LinkedIn About section.

4. **Refuse rather than fabricate**: if search turns up nothing usable — can't even
   confirm a real name tied to that URL — stop without creating a contact.
   Interactively: tell the user this URL didn't turn up enough public info, and suggest
   using `contact-intake` with pasted profile text instead. Headlessly: return `ok:
   false` with a `refusal_reason` describing what was tried.

5. **Write the record** (skip the interactive confirmation step `contact-intake` uses —
   there's no text to double-check the extraction against, so just write what was
   found):
   ```
   npx tsx scripts/db-cli.ts contacts add '{"name": "...", "linkedin_url": "...", "company": "...", "title": "...", "seniority_tier": "mid", "industry_tags": ["..."], "profile_text": "..."}'
   ```
   New contacts default to status `not_contacted` — leave it that way; status changes
   happen later via drafting/sending, not here.

6. **Interactive only**: report what was found (name, company, title, and which fields
   came from confirmed search results vs. were left blank) and that the contact was
   added.

## Automated invocation

When invoked headlessly (`claude -p /linkedin-quick-add ...` from the app's
`quickAddContactFromLinkedIn()`, not an interactive session), the prompt gives you
`linkedin_url`. Follow steps 1-5 exactly as above (still write via `contacts add`), but
skip step 6's user-facing report — instead return only the final JSON result
`{"ok": <true if a contact was created, false if it already existed or nothing usable
was found>, "contactId": <the new contact's id, or null>, "refusal_reason": <null, or a
one-sentence reason if ok is false>, "note": "<one sentence on what was found and
used>"}`, no surrounding prose.

## Constraints

- WebSearch only — no scraping of LinkedIn, or any site requiring login, same
  constraint as `contact-discovery`/`contact-enrichment`/`startup-discovery`.
- Never invent a fact about the person beyond what a search result actually shows.
- Never write to `email_drafts` or change contact `status` beyond the default
  `not_contacted` — drafting is out of scope for this skill; the caller chains into
  `cold-email-draft` separately.
- On-demand only — run whenever the user gives a URL. There is no cron/scheduled
  invocation of this skill.
