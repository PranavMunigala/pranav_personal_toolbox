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

## "Who should I reach out to next" mode

If asked for suggestions rather than a specific contact, run:
```
npx tsx scripts/db-cli.ts contacts list --status=not_contacted
```
and cross-check against current targeting preferences (`npx tsx scripts/db-cli.ts
preferences get`) to suggest which `not_contacted` contacts best match, in priority
order. Don't auto-draft for all of them — ask which one(s) to draft first.
