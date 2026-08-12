---
name: cover-letter-draft
description: Use when the user wants a cover letter for a specific job posting, grounded in real sourced research about the company, in a natural non-corporate voice. Never fabricates company facts or personal claims.
---

# Cover letter draft

Writes a short, specific, human-sounding cover letter for one job posting, grounded in
real research about the company — never generic template filler.

## Voice rules (read this before writing anything)

The whole point of this skill is to *not* sound like a template generator. Every draft
should read like it was written by a genuinely excited college student who did their
homework on this specific company and role, not by a corporate boilerplate machine.

- **Ban list** — never use these words/phrases: "passionate", "leverage", "synergy",
  "dynamic", "fast-paced environment", "team player", "detail-oriented", "go-getter",
  "results-driven", "thrilled", "excited to apply", "I am writing to express my
  interest", "cutting-edge", "innovative solutions", "wear many hats", "I believe I
  would be a great fit", "proven track record", "I am confident that my skills align
  perfectly". If a sentence could be copy-pasted into a cover letter for any other
  company, rewrite it until it couldn't be.
- **Ground every claim** in what was actually typed in or sourced. No invented metrics
  ("increased efficiency by 40%") unless that number came from the user's own resume
  text. Vague-but-honest beats specific-but-fabricated, always.
- **Be specific about *why this company*.** Reference something real and current from
  the research brief (a product, a recent announcement, a stated mission, an actual
  detail about the team) — not "your company's innovative culture."
- **Let real interest show.** A college student applying because they're genuinely
  curious about the intersection of two fields, or excited about a specific technical
  problem, should sound like that on the page — plainspoken, a little informal, direct
  about what draws them in, not stiff or over-polished.
- **Keep sentences short and plain.** No em dashes. Accuracy over approximation.
  Contractions are fine and encouraged.
- **Length: 250–350 words** by default — long enough to be specific, short enough
  that a recruiter reads the whole thing.
- Before showing a draft, re-read it once and ask: *would a real person actually
  write this sentence, or does it sound generated?* Rewrite anything that fails
  that test.

## Steps

Work through three phases in order, in your own reasoning — don't skip straight to
writing.

### Phase 1 — Researcher

1. Look up the scout session: `npx tsx scripts/db-cli.ts scout-sessions get <id>` for
   `company`, `role`, `job_posting_text`, and the resume text (use the latest tailored
   resume for this session if one exists via `npx tsx scripts/db-cli.ts resume-drafts
   list-for-session <id>`, otherwise `resume_source_text` from the session).
2. WebSearch/WebFetch to find 2–4 concrete, sourced facts about the company that are
   genuinely relevant to this role — recent product launches, engineering blog/
   technical posts, mission/values statements *in the company's own words*, a specific
   team's stated focus. Record the source URL for each fact you plan to use. Any claim
   you can't back with a URL gets dropped, never invented.
3. If research turns up nothing usable (obscure company, search blocked), don't
   fabricate — fall back to grounding the letter in the job posting text itself
   (specific responsibilities/requirements it names) and say so plainly rather than
   inventing "why this company" filler.

### Phase 2 — Writer

4. Draft the letter using **only**: (a) facts from Phase 1 with their sources, (b)
   facts from the resume text about the user's own background, (c) the job posting's
   own stated requirements/responsibilities, (d) any extra context/instructions the
   user typed in. Never invent a company fact, personal achievement, or shared
   connection.
5. Structure: opening that names a specific, real reason for interest in *this*
   company/role (not "I am excited to apply"); one to two paragraphs connecting
   specific resume experience to specific JD requirements; a closing that's confident
   but not presumptuous.
6. Follow the length target in Voice rules above: 250–350 words unless the user's
   extra context says otherwise.

### Phase 3 — Editor

7. Re-read the draft and cut every instance of corporate-speak from the ban list
   above. Read it out loud mentally and ask: **would a real person actually write
   this sentence?** If not, rewrite it plainly.
8. Verify every factual claim in the letter traces to a Phase-1 source, the resume, or
   the JD — delete or soften anything that doesn't.
9. Show the letter and its sourced research (facts + URLs) to the user, and ask for
   changes.

## Automated invocation

When invoked headlessly (`claude -p /cover-letter-draft ...` from
`lib/scout/runCoverLetterDraft.ts`), the prompt gives `scout_session_id` and
`research_enabled` (boolean):

1. Look up the session fresh via `npx tsx scripts/db-cli.ts scout-sessions get
   <scout_session_id>` — never trust inline JD/resume text passed in the prompt.
2. If `research_enabled` is `false`, skip Phase 1's WebSearch/WebFetch entirely and
   draft from the resume/JD/extra context alone — return an empty `research_sources`
   array rather than padding it.
3. Otherwise run all three phases above (skip step 9's "show to a user").
4. Return only:
   ```json
   {"ok": true, "refusal_reason": null, "cover_letter_markdown": "...", "research_sources": [{"url": "...", "note": "what fact this supports"}], "word_count": 0}
   ```
   with `word_count` set to the actual word count of `cover_letter_markdown`.
5. If no grounded letter can be produced at all (company can't be identified, no
   usable resume or JD content), return:
   ```json
   {"ok": false, "refusal_reason": "<why>", "cover_letter_markdown": null, "research_sources": null, "word_count": null}
   ```
   rather than writing filler to satisfy the schema.
6. Return only the final JSON result — no surrounding prose.

## Automated invocation — chat (refine an existing cover letter)

When invoked headlessly with `mode: chat` (from
`lib/scout/refineCoverLetterDraft.ts`), the prompt gives `scout_session_id`,
`current_cover_letter_markdown`, `current_research_sources`, prior `history` (array of
`{role, content}`), and a new `message`.

1. Re-fetch the session via `scout-sessions get <scout_session_id>`.
2. Interpret `message` as one of:
   - **Added context** — fold it in as new material for the Writer phase.
   - **An edit request** ("more concise", "less formal", "cut the second paragraph")
     — apply directly.
   - **A pasted reference letter** — restyle voice/structure only, keep every fact
     traceable to research/resume/JD.
   - **A pasted URL** — WebFetch it as new Phase-1 research and add it to
     `research_sources` if a fact from it is actually used.
3. Re-run the Editor pass (steps 7–8 above) on the result regardless of which case.
   "Make it more formal" is fine to honor; if a request would push the letter toward
   generic corporate boilerplate, comply with the literal ask but keep it as
   un-robotic as the request allows, and say so in the `note`.
4. Never touches `scout_sessions`; only returns text for the caller to persist as a
   new `cover_letter_drafts` row.
5. Return exactly:
   ```json
   {"ok": true, "refusal_reason": null, "cover_letter_markdown": "...", "research_sources": [...], "word_count": 0, "note": "one short sentence describing what changed"}
   ```
   or, on refusal:
   ```json
   {"ok": false, "refusal_reason": "<why>", "cover_letter_markdown": null, "research_sources": null, "word_count": null, "note": null}
   ```
6. Return only the final JSON result — no surrounding prose.

## Guardrails

- Never fabricate a company fact, personal achievement, or shared connection.
- Every company research claim needs a source URL — no URL, no claim.
- This skill never submits or sends anything; it only produces text the user copies
  out themselves.
- Versioned, never edited in place — every refinement is a new `cover_letter_drafts`
  row, never an update to an existing one.
- WebSearch/WebFetch failures degrade gracefully — proceed with an honestly thin or
  empty research brief and say so, never invent content to fill the gap.
