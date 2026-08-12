---
name: resume-tailor
description: Use when the user wants a resume tailored to a specific job posting, with an honest gap analysis against that posting's requirements. Never fabricates experience — every claim in the tailored resume must trace back to the original resume text or the extra-context text the user provided.
---

# Resume tailor

Produces a tailored version of the user's resume for one specific job posting, in the
same format/structure as the original, plus an honest gap analysis.

## The single most important rule

The gap analysis exists to tell the user the truth about their fit, not to flatter
them. When in doubt about whether a requirement is met, mark it unmet. Never invent a
company, project, title, date, metric, or skill that isn't in the resume or extra
context text the user actually gave you. If the JD wants something neither input
supports, leave the gap showing and say so plainly — don't paper over it with a
plausible-sounding bullet.

## Steps

1. **Look up the scout session**:
   ```
   npx tsx scripts/db-cli.ts scout-sessions get <id>
   ```
   This returns `job_posting_text`, `resume_source_text`, and `extra_context_text` —
   all pasted directly by the user, the source of truth for everything below.

2. **If `job_posting_url` is set and `job_posting_text` looks thin** (roughly under
   200 characters — a sign the user only pasted a link, not the posting itself),
   WebFetch the URL to get the full posting text. If the fetch fails or returns
   unusable content (JS-rendered page, login wall, blocked), proceed with whatever
   `job_posting_text` is stored and note the limitation in the gap analysis rather
   than guessing at requirements you can't actually see.

3. **Extract requirements from the JD** into two buckets:
   - `must_haves`: hard requirements stated as required/must/minimum/essential (e.g.
     "5+ years Python", "PE license", "BS in Mechanical Engineering", "must be
     authorized to work in the US"). Do not include something here just because it's
     implied by the role title — only what the posting actually states as required.
   - `nice_to_haves`: items explicitly marked preferred/bonus/nice-to-have/ideally, or
     soft/generic traits ("strong communicator", "self-starter") that aren't hard
     gates.

4. **For each requirement, conservatively determine `evidence_in_resume` (boolean)**,
   checking `resume_source_text` and `extra_context_text` together:
   - `true` only if there's a specific, concrete match — a named project, role, tool,
     metric, or credential that plainly satisfies the requirement.
   - `false` if the input is silent on it, only tangentially related, or you'd have to
     infer/stretch to call it a match. When in doubt, `false`.
   - Include a one-sentence `note`: if `true`, cite the specific detail that supports
     it; if `false`, say plainly what's missing ("resume doesn't mention any cloud
     infrastructure experience").
   - Run the same pass for nice-to-haves, lighter touch — track them, but they never
     block the tailoring and never get fabricated evidence.

5. **Write the tailored resume**:
   - **Preserve the original's structure**: same section order, same section names,
     same overall format (bullet-heavy vs. prose, chronological order, header style)
     as `resume_source_text`. This is a re-emphasis and rewording pass, not a
     redesign.
   - You may: reorder bullets within a section to foreground JD-relevant experience,
     reword bullets using the JD's own terminology where the resume already honestly
     supports it, and trim or de-emphasize less relevant content.
   - For must-haves with `evidence_in_resume: false`: check `extra_context_text` for
     anything that closes the gap — a project or experience the user has but didn't
     already put on their resume. If something closes it, work it in as a new bullet
     or by replacing a lower-relevance existing bullet, in the resume's own format.
     If nothing in either input closes the gap, leave it out — do not invent a bullet
     to cover it.
   - Never invent companies, dates, titles, metrics, or skills not present in either
     input. Every sentence in the tailored resume must be traceable to something the
     user actually wrote.
   - Output as markdown (`#`/`##` headings for sections, `-` for bullets) so it
     renders cleanly through the app's `MarkdownView` component.

6. **Show the gap analysis and tailored resume together**, and ask if the user wants
   changes.

## Automated invocation

When invoked headlessly (`claude -p /resume-tailor ...` from
`lib/scout/runResumeTailor.ts`), the prompt gives a `scout_session_id` instead of
interactive context:

1. Look up the session fresh via `npx tsx scripts/db-cli.ts scout-sessions get
   <scout_session_id>` — never trust any resume/JD text passed inline in the prompt,
   always re-read current DB state.
2. Run steps 2–5 above.
3. Return only:
   ```json
   {"ok": true, "refusal_reason": null, "tailored_resume_markdown": "...", "gap_analysis": {"must_haves": [{"requirement": "...", "evidence_in_resume": true, "note": "..."}], "nice_to_haves": [{"requirement": "...", "evidence_in_resume": false, "note": "..."}]}}
   ```
4. If the session can't be found, or both `job_posting_text` and `resume_source_text`
   are unusable/empty, return:
   ```json
   {"ok": false, "refusal_reason": "<why>", "tailored_resume_markdown": null, "gap_analysis": null}
   ```
   Do not fabricate a resume or a gap analysis to satisfy the schema.
5. Skip step 6 — there is no interactive user, and this invocation never persists to
   `resume_drafts` itself; the caller inserts the row using the returned fields.
6. Return only the final JSON result — no surrounding prose.

## Automated invocation — chat (refine an existing tailored resume)

When invoked headlessly with `mode: chat` (from `lib/scout/refineResumeDraft.ts`,
backing the "Refine this draft" chat box under a session's resume drafts), the prompt
gives `scout_session_id`, the `current_resume_markdown` and `current_gap_analysis` of
the latest resume draft, prior `history` (array of `{role, content}` turns), and a new
`message`.

1. Look up the session via `npx tsx scripts/db-cli.ts scout-sessions get
   <scout_session_id>` to re-confirm `job_posting_text`/`resume_source_text`/
   `extra_context_text`.
2. Interpret `message` as one of:
   - **Added context** ("I also led a 3-person team on that project") — the user is
     the source of truth about their own experience, unlike a third party in the
     cold-email case, so fold this in as long as it reads like a genuine recollection
     rather than a request to invent something. Update the tailored resume and, if it
     flips a verdict, update the gap analysis too.
   - **An edit request** ("tighten the summary", "cut the older internship", "lead
     with the ML project") — apply directly.
   - **A pasted reference resume or format** — restyle formatting/structure to
     resemble it while keeping every fact traceable to the original resume/extra
     context content.
   - **A pasted URL** (e.g. a more detailed JD page, a "what we look for" careers
     page) — WebFetch it and use only verifiable fetched facts to adjust which
     experience to foreground — never fabricate beyond what's fetched.
3. Regardless of case, still honor every rule from the main steps: preserve the
   original's structure/format, never invent facts, keep the conservative
   `evidence_in_resume` bar. If the user explicitly asks for something unsupported by
   either input ("just say I led the team"), don't comply — push back in the `note`
   field instead and leave the claim out.
4. This mode never touches `scout_sessions` and never writes anything itself — it only
   returns text for the caller to persist as a new `resume_drafts` row.
5. Return exactly:
   ```json
   {"ok": true, "refusal_reason": null, "tailored_resume_markdown": "...", "gap_analysis": {...}, "note": "one short sentence describing what changed"}
   ```
   or, on refusal:
   ```json
   {"ok": false, "refusal_reason": "<why>", "tailored_resume_markdown": null, "gap_analysis": null, "note": null}
   ```
6. Return only the final JSON result — no surrounding prose.
