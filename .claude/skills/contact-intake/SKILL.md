---
name: contact-intake
description: Use when the user gives a LinkedIn URL plus pasted profile text (About/Experience sections) and wants it added to the Cold Email Tracker as a structured contact. Also use when the user just gives a LinkedIn URL with no text and wants a placeholder contact created.
---

# Contact intake

Turn a pasted LinkedIn URL + profile text into a structured row in the contacts table,
via `scripts/db-cli.ts` (never write raw SQL — it enforces the dedup guard and schema).

## Steps

1. **Check for an existing record first**:
   ```
   npx tsx scripts/db-cli.ts contacts find-by-linkedin "<url>"
   ```
   If it returns a non-null contact, tell the user this person is already tracked
   (show their current status) and ask whether they want to update the existing
   record instead of creating a duplicate. Do not create a second row for the same
   LinkedIn URL.

2. **Extract fields from the pasted text**:
   - `name` — from the profile or ask the user if not given.
   - `company` — current employer.
   - `title` — current role/title.
   - `seniority_tier` — infer from the profile using this rubric, but always show your
     inference to the user and let them override it:
     - `peer` — student, intern, <2 years out of school, individual early-career role.
     - `mid` — individual contributor/scientist/engineer with several years of
       experience, not yet in a senior/leadership title.
     - `senior` — Director+, VP, Founder, Chief/Head of, physician (MD), or a person
       notable enough in their field that a more formal tone is warranted.
   - `industry_tags` — pick from (or extend) the user's current targeting preferences:
     ```
     npx tsx scripts/db-cli.ts preferences get
     ```
     Tag with whichever of those industries/roles actually apply based on the profile
     text (e.g. "AI in healthcare", "biomedical engineering", "computational biology",
     "medical devices", "bioinformatics") — don't force-fit tags that don't apply.
   - `profile_text` — store the raw pasted text verbatim (this is what the
     `cold-email-draft` skill will pull real, non-invented details from later).

3. **Confirm with the user** before writing: show the structured fields (especially
   `seniority_tier` and `industry_tags`) and let them correct anything.

4. **Write the record**:
   ```
   npx tsx scripts/db-cli.ts contacts add '{"name": "...", "linkedin_url": "...", "company": "...", "title": "...", "seniority_tier": "mid", "industry_tags": ["..."], "profile_text": "..."}'
   ```
   New contacts default to status `not_contacted` — leave it that way here; status only
   changes via the `cold-email-draft` skill or the UI, once a draft actually goes out.

## Constraints

- Never invent facts about the person that aren't in the pasted text or explicitly
  given by the user.
- Never scrape or fetch LinkedIn directly — this skill only structures text the user
  has already pasted in.
