---
name: internship-intake
description: Use when the user pastes a job/internship posting URL and wants it added to the Internship Tracker. Fetches and parses the posting to auto-fill company/role/location/date, confirms with the user, then saves it.
---

# Internship intake

Turn a pasted job posting URL into a row in the applications table.

## Steps

1. **Fetch the posting** with WebFetch on the URL the user gave you. Extract:
   - `company`
   - `role` (job title as posted)
   - `location`
   - `date_posted` (if shown on the page; otherwise leave null)

   If WebFetch can't extract clean data (JS-rendered page, blocked, etc.), tell the user
   and ask them to paste the key details (company/role/location) manually instead of
   guessing.

2. **Check for an existing entry** before inserting:
   ```
   npx tsx scripts/db-cli.ts applications find-existing "<company>" "<role>" "<link>"
   ```
   If it already exists, tell the user its current status instead of creating a
   duplicate — ask if they want to update the status instead.

3. **Confirm the extracted fields with the user**, then save:
   ```
   npx tsx scripts/db-cli.ts applications add '{"company": "...", "role": "...", "link": "...", "location": "...", "date_posted": "...", "source": "manual"}'
   ```

4. **Check for a contact at that company** in the Cold Email Tracker:
   ```
   npx tsx scripts/db-cli.ts contacts find-by-company "<company>"
   ```
   If any exist, mention them and offer to link them to this application:
   ```
   npx tsx scripts/db-cli.ts applications link-contact <applicationId> <contactId>
   ```

## Constraints

- Never mark an application beyond `applied` on intake — status changes (OA, interview,
  follow_up, offer, rejected) happen later via a separate request or the UI:
  ```
  npx tsx scripts/db-cli.ts applications set-status <id> <status>
  ```
