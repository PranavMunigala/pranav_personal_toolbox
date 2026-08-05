---
name: cold-email-draft
description: Use when the user wants to draft (or re-draft) a cold outreach email to a specific contact in the Cold Email Tracker, or asks "who should I reach out to next" for cold email purposes. Enforces the dedup guard so an already-sent or coffee-chatted contact never gets re-emailed.
---

# Cold email draft

Drafts a short, tone-calibrated outreach email for one contact, and never lets the same
person get emailed twice.

## Steps

1. **Look up the contact**:
   ```
   npx tsx scripts/db-cli.ts contacts find-by-linkedin "<url>"
   ```
   or search by name via `npx tsx scripts/db-cli.ts contacts list` and filter client-side.

2. **Refuse up front if already contacted.** If `status` is `sent` or `coffee_chatted`,
   stop and tell the user — do not draft a new email. (The dedup guard in
   `set-status` would also block marking it sent again, but catch it earlier so you
   don't waste a draft.)

3. **Draft using the fixed structure below**, calibrated by `seniority_tier`. Pull real
   details only from the contact's `profile_text`/`notes`/`title`/`company` fields —
   never invent facts about the person.

   - **`peer`** (fellow student, early-career, <2 yrs): casual, first name, ask
     directly for a coffee chat. Shortest of the three.
   - **`mid`** (individual contributor/scientist/engineer): reference one specific
     detail from their background, ask one sharp question about their path, then ask
     for 15–20 minutes.
   - **`senior`** (Director+, VP, Founder, MD, notable figure): more formal address if
     appropriate ("Mr./Ms. Last Name"), shortest version, one respectful ask, softer
     close ("if you have any time").

   All drafts:
   - Stay under ~120 words.
   - Use the fixed sign-off block below, verbatim.
   - Never fabricate shared connections, achievements, or details not present in the
     contact's stored profile text/notes.

   ### Subject line

   Write a short subject line too (research on cold/networking outreach: 2–4 word
   subjects get meaningfully higher open rates than longer ones, and a subject specific
   to the recipient's role/company/topic roughly doubles reply rate vs a generic one).
   - 2–4 words, specific to their role, company, or the topic — never a bare generic
     phrase like "Quick question" or "Would love to connect".
   - Good examples: "Your path into medtech", "Question about Stryker R&D", "BME grad,
     quick chat?".

   ### Sign-off block (always use exactly this)
   ```
   Best,
   Pranav Kumar Munigala
   BSc in Biomedical Engineering
   Rutgers University - New Brunswick
   P: (862)-684-3583
   E: pranav.munigala@gmail.com / pkm71@scarletmail.rutgers.edu
   L: www.linkedin.com/in/pranavm26
   ```

   ### Voice/structure reference (match tone and length, don't copy verbatim)

   **Mid-tier example (specific detail + question + ask):**
   > Hi Rajvi, I hope you are doing well. My name is Pranav Munigala and I'm a student
   > studying Biomedical Engineering and Computer Science. I came across your background
   > and would love to learn more about your experience at Merck and your path into
   > bioinformatics. I'm also currently working on projects in the biomedical/computer
   > science field and would appreciate hearing your perspective. If you're available I
   > would love to set up a quick chat to speak. Thank you so much and I look forward to
   > connecting.

   **Mid-tier example (sharp specific question):**
   > Hi Akshada, I saw your Rutgers senior design project on a laparoscopic biomaterial
   > delivery tool won first place, and that you later worked in robotics regulatory
   > affairs at Stryker before moving to device-based therapies regulatory at Medtronic.
   > Curious how different the regulatory work actually is for robotics-based devices
   > versus more traditional device therapies, is it a totally different playbook or more
   > similar than people assume? I'm also from Rutgers and just curious how people build a
   > career on the regulatory side of medical devices, would love 15-20 minutes if you're
   > open to it.

   **Senior-tier example (formal address, shortest):**
   > Hi Mr. O'Brien, I hope you are doing well. My name is Pranav Munigala and I'm a
   > student studying Biomedical Engineering and Computer Science. I came across your
   > background and would love to learn more about your experience at Anthropic and your
   > path into healthcare. I'm also currently working on projects in the biomedical/
   > computer science field and would appreciate hearing your perspective. If you're
   > available I would love to set up a quick chat to speak.

4. **Show the draft to the user** and ask if they want changes. Optionally save it:
   ```
   npx tsx scripts/db-cli.ts contacts set-status <id> drafted
   ```

5. **This skill never sends email.** Once the user has copied the draft into Gmail and
   actually sent it, they (or you, on their explicit confirmation) mark it sent:
   ```
   npx tsx scripts/db-cli.ts contacts set-status <id> sent
   ```
   This command routes through the dedup guard — it will refuse and explain why if the
   contact (or another record with the same LinkedIn URL) is already `sent` or
   `coffee_chatted`. If it refuses, surface that message to the user as-is; don't try to
   work around it.

## Automated invocation

When invoked headlessly (`claude -p /cold-email-draft ...` from the app's
`draftEmailForContact()`, not an interactive session), the prompt gives you a
`contact_id` instead of a name/URL to search for:

1. Look up the contact via `npx tsx scripts/db-cli.ts contacts get <contact_id>`.
2. Still enforce step 2 above (refuse if `status` is `sent`/`coffee_chatted`). If
   refusing, return `{"ok": false, "refusal_reason": "<why>", "subject": null, "body":
   null}` — do not fabricate a draft to satisfy the schema.
3. Otherwise, draft per step 3 above and return `{"ok": true, "refusal_reason": null,
   "subject": "...", "body": "..."}`.
4. Skip steps 4–5 entirely (no interactive user to show the draft to, and this
   invocation never persists to `email_drafts` or changes contact status — the caller
   does that itself with the returned fields).
5. Return only the final JSON result — no surrounding prose.

## Automated invocation — chat (refine an existing draft)

When invoked headlessly with `mode: chat` (from `refineEmailDraft()`, backing the
"Refine this draft" chat box under a contact's drafts on `/cold-email/[id]`), the
prompt gives you `contact_id`, the `current_subject`/`current_body` of the contact's
most recent draft, prior `history` (an array of `{role, content}` chat turns for this
contact), and a new `message` from the user.

1. Look up the contact via `npx tsx scripts/db-cli.ts contacts get <contact_id>` to
   re-confirm current `status` and pull profile fields. Still enforce the dedup guard:
   if `status` is `sent` or `coffee_chatted`, refuse — return `{"ok": false,
   "refusal_reason": "<why>", "subject": null, "body": null, "note": null}` — rather
   than producing a "refined" draft for someone already contacted since the page
   loaded.

2. Interpret `message` as one of:
   - **Added context** ("she went to Rutgers too", "mention I saw her podcast
     appearance") — fold the new fact into the existing draft, don't restart from
     scratch.
   - **An edit request** ("make it shorter", "less formal", "ask for a referral
     instead of a coffee chat") — apply the edit directly to
     `current_subject`/`current_body`.
   - **A pasted reference email** (the user pasted an example email's text into
     `message`) — restyle voice/structure/length to resemble it while keeping the
     sign-off block, factual-grounding rules, and per-tier tone constraints from the
     main drafting steps above.
   - **A pasted URL** (a bare URL, or a URL alongside text, in `message`) — WebFetch it
     (e.g. a company "about" page, the recipient's team page, a blog post) and use only
     verifiable facts from the fetched content to adjust framing — never fabricate
     beyond what's fetched. Use WebSearch only if the fetch fails or more context is
     needed to understand the fetched page.

3. Regardless of which case, still honor every rule from the main drafting steps: stay
   under ~120 words, keep the tone-by-seniority-tier calibration for this contact's
   `seniority_tier`, end with the exact sign-off block verbatim, never fabricate facts,
   plain ASCII punctuation only.

4. This mode never touches contact `status` and never sends anything. It only produces
   revised `subject`/`body` text for the caller to persist as a new `email_drafts` row
   — do not call `set-status` or any send-related tool.

5. Return exactly:
   `{"ok": true, "refusal_reason": null, "subject": "...", "body": "...", "note": "one
   short sentence describing what changed, e.g. 'Shortened it and added a mention of
   her Rutgers background.'"}`
   or, if refusing per step 1:
   `{"ok": false, "refusal_reason": "<why>", "subject": null, "body": null, "note":
   null}`

6. Return only the final JSON result — no surrounding prose.

## "Who should I reach out to next" mode

If asked for suggestions rather than a specific contact, run:
```
npx tsx scripts/db-cli.ts contacts list --status=not_contacted
```
and cross-check against current targeting preferences (`npx tsx scripts/db-cli.ts
preferences get`) to suggest which `not_contacted` contacts best match, in priority
order. Don't auto-draft for all of them — ask which one(s) to draft first.
