---
name: outreach-recommender
description: Use when the user wants suggestions on who to reach out to next, given their internship applications and existing cold-email contacts — e.g. "who should I follow up with" or after adding a new application, to check if there's already a contact at that company.
---

# Outreach recommender

Cross-references the Internship Tracker against the Cold Email Tracker to suggest who to
reach out to (or follow up with) next.

## Steps

1. **Pull both trackers**:
   ```
   npx tsx scripts/db-cli.ts applications list
   npx tsx scripts/db-cli.ts contacts list
   ```

2. **Match by company** (case-insensitive). For each application, check if any contact
   shares that company. Classify each match:
   - Contact status `coffee_chatted` at that company → "you already coffee-chatted
     `<name>` here — consider a follow-up now that you've applied."
   - Contact status `sent` with no response yet → "you emailed `<name>` here but haven't
     heard back — could be worth a gentle follow-up."
   - Contact status `not_contacted` → "you have `<name>` at this company in your tracker
     but haven't reached out yet — consider drafting an email" (hand off to the
     `cold-email-draft` skill rather than drafting here).

3. **Prioritize** applications with active status (`applied`, `oa`, `interview`,
   `follow_up`) over `rejected`/`offer` ones — the point is to help with applications
   still in play.

4. **Report as a short prioritized list**, not an exhaustive dump — lead with the
   strongest opportunities (e.g. an active application at a company where you've already
   coffee-chatted someone).

## Constraints

- This skill only reads and cross-references; it never changes contact/application
  status itself. If the user wants to act on a suggestion (draft an email, mark a
  follow-up), hand off to the `cold-email-draft` skill or the relevant `db-cli.ts`
  command.
