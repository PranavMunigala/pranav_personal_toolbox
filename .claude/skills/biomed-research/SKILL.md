---
name: biomed-research
description: Use when the user wants to research a biomedical/biotech/bioinformatics/health-AI company, a specific product/drug/pipeline asset/platform, or a topic/technology area — for scouting and personal learning purposes. Triggers on things like "research Acme Bio", "look into [drug/platform name]", "what's the landscape on CRISPR base editing", or a bare company/product name or topic phrase dropped in a biomedical/AI context. Produces or updates a markdown profile file under research/.
---

# Biomedical Research & Scouting

Builds structured, learning-level research profiles on biomedical/biotech/bioinformatics/health-AI **companies**, **products**, or **topics**, and keeps them updated over time as markdown files.

## Step 1: Detect the mode from the input

- **Company mode**: input is a specific organization name ("Acme Bio", "look into Recursion Pharmaceuticals").
- **Product mode**: input names a specific product, drug, pipeline asset, or platform — whether standalone or belonging to a company already profiled ("their mRNA delivery platform", "Moderna's mRNA-1273").
- **Topic mode**: input is a technology/research area in a few words, not a named entity ("CRISPR base editing", "AI protein folding", "target validation platforms").

If genuinely ambiguous, ask the user which they mean rather than guessing. The user may also paste a link or background text alongside the name/topic — treat that as a seed source, not a replacement for independent research.

## Step 1b: Document-mode input (link or PDF instead of a name)

Used only when invoked with `mode: "document"` (see "Automated invocation —
document" below) — the user gave a link or uploaded a PDF instead of typing a
name/topic, e.g. dropping in a research paper to analyze.

- If `pdf_path` was given: `Read` the PDF directly. Pull out whatever's
  relevant to the doc type — title, authors, abstract, key
  findings/methodology for a paper; product/company details for a spec sheet
  or pitch deck. Stay generic since the document type varies.
- If `source_url` was given instead: `WebFetch` it, same as Step 3.
- Use the extracted content to decide the mode (Company/Product/Topic, per
  Step 1's detection logic above) and treat it as the **primary seed
  source** — same "seed, not a replacement for independent research"
  principle as pasted background text, but weighted more heavily here since
  the document *is* the subject, not just color on a named entity. For
  topic-mode papers specifically, do lighter supplementary web research —
  enough to confirm/contextualize the paper's claims and place it in the
  landscape, not a full from-scratch literature review, since the document
  itself already carries most of the substance — a handful (3-5) of
  supplementary queries is enough.
- If a `focus` blurb was also supplied, note your interpretation of it now
  (whether it means "zoom in on these specific points within the document" or
  "use this as context for how to frame the broader research") but don't act
  on it yet — the dedicated extra research for it happens in Step 4c, after
  the baseline checkpoint, per the time-budget approach described there.
- Continue with Step 2 onward exactly as normal — same file path/write path
  as a query-mode run.

## Step 2: Determine the file path

All files live under `research/` at the project root, using a lowercase-hyphenated slug of the name/topic:

- Company → `research/companies/<slug>.md`
- Product → `research/products/<slug>.md`
- Topic → `research/topics/<slug>.md`

**Before writing, check if the file already exists**:
```
npx tsx scripts/research-cli.ts check-exists '{"category":"<companies|products|topics>","slug":"<slug>"}'
```
If `exists` is `true`, this is an update run (see Step 5), not a fresh write.

## Step 3: Baseline research

Use WebSearch/WebFetch to gather information for the standard template
sections only (Step 4's per-mode list) — this is the baseline pass; any
`focus` blurb's dedicated extra research happens later, in Step 4c, after a
safe checkpoint is saved. This two-phase split exists so a single headless run
never loses all its work to a timeout — see Step 4b.

This is **research-level depth**: written for someone learning about the biomedical/AI space and evaluating personal interest and career fit — not an expert technical teardown, not a surface-level blurb either. Enough depth that a reader genuinely understands the mechanism/market/team, explained clearly.

**Time budget**: aim for roughly 2-4 WebSearch/WebFetch calls per standard
section — a rough ceiling of ~15-18 total calls for company mode's 7
sections, ~10-12 for product/topic mode's 5. Prefer a small number of
authoritative sources per fact over exhaustively cross-verifying everything;
move on once a section has enough to write confidently rather than continuing
to search for completeness's sake. This budget exists so a run reliably
finishes inside the headless invocation's time limit.

Some things (LinkedIn team details behind login, private financials behind paywalls) are not reliably fetchable. Do your best with public sources; where you can't verify something, say so plainly in the text (e.g. "leadership bios not independently verified — LinkedIn requires login") rather than guessing or omitting silently.

If the user supplied a link or background text, incorporate it but still verify/expand with independent search — don't just restate what they gave you.

## Step 4: Build the baseline profile content using the matching template

**Who you're writing for**: a college student studying biomedical engineering,
computer science, and math — comfortable with technical/quantitative thinking
(algorithms, data structures, statistics, systems) but still learning the
biomedical-domain specifics. When you reach for an analogy, prefer one that maps
to a CS/math/engineering concept they already know over a generic real-world
object — e.g. a target-ranking pipeline is like a search/ranking algorithm scoring
candidates; a generative chemistry model is like sampling from a learned
probability distribution instead of hand-designing each output; a trial-outcome
predictor is like a classifier trained on historical labeled examples. Still keep
one plain-language line so the section stands on its own for a non-CS reader.

**Purpose**: an optional `purpose` may be supplied (`personal_research`,
`learning`, or `linkedin_post` — defaults to `personal_research` when absent).
It only changes emphasis and length, never the file structure — every mode's
sections are always written, in the same order. `personal_research`: no
change, write the standard-depth template as described throughout this step.
`learning`: keep the full template, but lean harder into the
analogy/explanation style above — spend more words making mechanisms click
for the reader rather than cataloging facts. `linkedin_post`: still write the
full profile with every section, but keep each section tighter and foreground
the single most shareable/interesting 1-2 facts per section first — denser
and less exhaustive than a full scouting writeup, but still real depth, not a
skeleton.

**Formatting**: every section below is bullets-and-bold first, paragraphs second.
Open with at most 1-2 sentences of framing, then deliver the actual facts as
bullet points with **bolded key terms/names/numbers**. This applies to *every*
section — Market & Competition, Financials, Team, Careers, Takeaways — not just
the technology section. A paragraph should only ever be short connective framing;
it should never be the primary vehicle for delivering multiple facts.

### Company mode

1. **Company Overview** — location, founding date/story, stage (seed/Series X/public/etc.), core mission, the problem they're fundamentally trying to solve in healthcare or tech.
2. **Technology & Products** — breakdown of their tech stack, platform architecture, or drug pipeline. Include 2-3 analogies (per the CS/math framing above) and real-world examples of how the technology works in practice (e.g. target validation, molecular docking, data orchestration) — written like a learning companion explaining it, not a spec sheet. Pick a small, representative set of products/pipeline assets to go deep on (roughly 2-4) rather than listing every drug or product a large company has — enough to illustrate the technology well without becoming an overwhelming catalog. End the section with a link (company site, pipeline page, etc.) where the user can dig further on their own if they want the full list.
3. **Market & Competition** — who they sell to, what differentiates them from competitors, roadblocks that make their market hard to enter.
4. **Financials** — brief overview only, not an in-depth analysis. For public companies, a couple sentences on revenue/market cap/recent notable filing news. For startups, funding rounds, total raised, investors, and valuation if known — high level, not exhaustive.
5. **Team, Leadership & Culture** — executive leadership, advisory board, key scientists (this drives the actual analysis — always do this thoroughly). Include 2 sentences on company culture (work environment, values, what employees/reviews say) if findable. Then, as a separate add-on: identify 2-3 recent Rutgers graduates (biomedical engineering majors preferred) who could plausibly be good networking contacts — these don't need to work at the company being profiled; they're general networking leads in the same space/field, found via LinkedIn-style search. This add-on gets **one quick, non-exhaustive search** — not an open-ended hunt — and is capped by design. Keep this clearly separated as a networking add-on — never let its presence or absence affect how thoroughly the rest of the company is researched.
6. **Careers & Personal Fit** — focus mainly on internships and student/early-career opportunities (does the company run an internship program, take co-ops, recruit at career fairs, etc.). One sentence is enough on general full-time hiring info — don't go deep into browsing current job listings, but if there are any openings visible right now, briefly name 1-2 of them. Close with how the company's stage/focus matches an engineering/science skillset.
7. **General Notes & Personal Takeaways** — why the company appeals to a scouting engineer/scientist, potential drawbacks, key milestones to watch.

### Product mode

1. **What It Does** — the problem it solves and for whom.
2. **How It Works** — technical explanation with analogies, same style as company mode's tech section.
3. **Company & Competing Products** — which company/companies make it; if that company already has a file in `research/companies/`, cross-link to it (`See also: ../companies/<slug>.md`); note competing products.
4. **Stage & Validation** — research/preclinical/clinical/market-launched, and what evidence/validation exists at that stage.
5. **Personal Takeaways** — why it's interesting, open questions, what to watch.

### Topic mode

1. **Definition & Why It Matters** — plain-language framing of the topic and its significance.
2. **Key Techniques & Approaches** — the main methods/approaches in the space, explained with analogies, same style as above.
3. **Landscape** — companies and academic groups actively working on it.
4. **Open Problems & Bottlenecks** — what's unsolved or hard about this area right now.
5. **Personal Takeaways** — why it's interesting, what to watch.

## Step 4b: Checkpoint write

Before doing any focus-driven or document-driven deep-dive enrichment, write
the current baseline profile now via `research-cli.ts write` (same command as
Step 7). This baseline is already a complete, presentable profile — every
template section is present at standard depth — so if the run gets killed
during the enrichment/QA phase below, a real, usable profile is already saved
on disk rather than nothing. Follow the same check-exists-based
create-vs-update handling as Step 5 for this write too. Don't skip this step
even if a `focus` blurb or document source means more content is still coming
— that content gets folded in via the final write in Step 7.

## Step 4c: Enrichment (focus blurb / document deep-dive)

Only relevant if a `focus` blurb was supplied and/or this is a document-mode
run (Step 1b). Now do the dedicated extra research promised earlier:

- Run a small, fixed budget of **3-5 targeted WebSearch/WebFetch queries**
  aimed specifically at what the `focus` blurb describes (or, for
  document-mode without an explicit focus, at anything in the source document
  that seemed to need external confirmation/context). This is intentionally
  capped, not open-ended — the goal is meaningfully deeper coverage of the
  requested subject, not exhaustive research.
- Figure out which standard section(s) the findings most naturally belong to
  — it can span more than one (e.g. "their internship program" belongs in
  Careers & Personal Fit; "how their platform compares to X" belongs in both
  Technology & Products and Market & Competition). Weave the findings
  directly into those sections, expanding them with real additional
  bullets-and-bold content — don't tack on a separate section or an
  unlabeled paragraph for it, and don't just add a passing mention.
- The rest of the template's sections stay as written in the Step 4b
  checkpoint — this step only expands the section(s) the focus/document
  content is actually relevant to.

## Step 5: Handle updates (file already exists)

Re-fetch current information and merge it into the existing file rather than starting over:

- Keep the existing structure and any content that's still accurate.
- Where a fact changed (e.g. new funding round, new leadership hire, stage change), update it inline and attach a footnote marker noting when and what changed, e.g.:
  `Raised a $40M Series B in early 2026.[^2026-07-28]`
  with a footnote definition at the bottom of the file:
  `[^2026-07-28]: Updated — added Series B funding details.`
- Add new footnote entries for each update run; don't delete prior footnotes.
- If a whole new subsection is added that didn't exist before, mark it the same way.

## Step 6: Silent quality pass

Before presenting the final file to the user, do an internal pass (don't show this as a separate output). This is a **fast reread-and-reformat pass over content you already have** — it should not trigger new WebSearch/WebFetch calls; if something looks wrong or unverifiable, flag/remove it in the text rather than going to re-research it:

- Check that claims are internally consistent and dated where relevant (funding amounts, stage, headcount).
- Remove or flag anything that seems stale, contradictory, or unverifiable rather than leaving it stated as fact.
- Make sure the Rutgers networking add-on and other add-ons didn't creep into or dilute the core analysis sections.
- Confirm footnotes (on update runs) are correctly placed and dated.
- Confirm every section is bullets-and-bold first, not an unbroken paragraph block — reformat any section that's degraded into a blurb.
- Confirm analogies map to CS/math/engineering concepts where a natural mapping exists, per the framing at the top of Step 4.
- If a `focus` blurb was given, confirm its subject matter is visibly and
  substantively reflected in the file (per Step 4c) — not silently dropped —
  and that it reads as integrated bullets/prose woven into the relevant
  section(s), not a conspicuous bolted-on addendum.

## Step 7: Write the file via the CLI

Never use the Write/Edit tools directly for profile files — always go through the
script, so interactive and automated runs write profiles the exact same way:
```
npx tsx scripts/research-cli.ts write '{"category":"<companies|products|topics>","slug":"<slug>","title":"<the profile H1 title, without the leading #>","content":"<the full markdown file content, starting with the # Title line>"}'
```
This returns `{"ok": true, "path": "...", "created": <bool>}`. Then tell the user
briefly what was written or what changed.

This is the **second** write of the run (Step 4b did the checkpoint write) —
that's expected, not a bug: this final write overwrites the checkpoint with
the enriched/QA-passed version. Both writes go through the same `check-exists`
→ create-or-update handling; the second write's "update" footnoting (Step 5)
applies naturally against the file the first write just created.

## Step 8: Follow-up chat mode

Used by the profile page's sidebar chat, where the user can ask follow-up
questions about a company/product/topic they already researched, or tell you to
fold new information into the saved file. Input is: the profile's existing
`content`, the prior conversation as `{role, content}` turns, and the latest user
`message`.

- You may use WebSearch/WebFetch to answer things not already in the file — same
  constraints as Step 3 (no login-gated scraping; say plainly when something can't
  be verified rather than guessing).
- **Time budget**: a chat turn gets a small, fixed research budget — **3-5
  WebSearch/WebFetch calls, max**, mirroring Step 4c's enrichment cap. This
  exists so a single chat turn reliably finishes inside the headless
  invocation's time limit, the same reason Step 3/4c are budgeted.
- **Ask instead of grinding**: if the request is broad or ambiguous enough
  that it can't be reasonably satisfied within that budget — e.g. "add
  everything you can find about their pipeline" instead of a specific fact —
  don't attempt it anyway. Instead, reply asking the user to name the
  specific fact, section, or source they want added (`profileUpdated:
  false`), the same way you'd ask a clarifying question in Step 1 for a
  genuinely ambiguous name/topic. There is no way to pause mid-run and ask
  interactively here (this is a one-shot headless call) — asking in the
  `reply` and waiting for the user's next message is the only mechanism
  available, so prefer it over a best-effort guess that risks running out of
  budget with nothing saved.
- Reply in the same style as the profile itself: simple, bullets-and-bold first,
  analogies mapped to CS/math/engineering concepts where natural (per Step 4).
- If the message asks you to add/save/update something in the profile,
  regenerate the **entire** file content (whole-file, same merge-and-footnote
  behavior as Step 5) and write it via `research-cli.ts write`, then say plainly
  in your reply what was added and where. If nothing needs saving, just reply —
  don't write the file on every turn.
- Return only structured JSON, no surrounding prose:
  `{"reply": "<markdown reply>", "profileUpdated": <bool>, "note": "<null or a short note on any source limitation>"}`.

## Step 8b: Incorporate mode (explicit answer placement, no new research)

Used by the "Incorporate" button in the profile page's chat sidebar — a
one-click shortcut for "fold that answer you just gave into the profile,"
without the user having to re-phrase their message as a save request. Input
is: the profile's existing `content`, and the specific `question`/`answer`
pair to fold in (the `answer` was already produced by a prior chat turn — it
is not a message from you to research anew).

- **No WebSearch/WebFetch in this mode** — the tool isn't even made available
  for this invocation (see "Automated invocation — incorporate" below). Treat
  `answer` as already-verified content.
- **First, classify the `question`/`answer` pair** as one of two kinds, before
  deciding placement:
  - **Rewrite/clarification** — the question is asking to re-explain,
    simplify, rephrase, clarify, or otherwise restate something the file
    already covers (signals: language like "simpler", "explain again", "in
    plain terms", "rephrase", "clarify, or "say that differently", or the
    `answer` is substantially restating a fact/explanation already present
    rather than introducing new information).
  - **New information** — the `answer` introduces a fact, detail, or update
    not already reflected in the file, including one that supersedes an
    existing fact (e.g. a newer funding number or date).
- **If it's a rewrite/clarification**: find the existing passage the answer is
  re-explaining and **replace that prose in place** with the clearer version
  (adjust surrounding sentences as needed so it still reads naturally). Don't
  leave the original explanation sitting alongside the new one — the point is
  a swap, not an addition. Don't add a footnote for a pure rewording;
  footnotes are reserved for facts that changed (Step 5), not phrasing
  changes.
- **If it's new information**: your job is *placement* — which existing
  section(s) does this belong in, and how do you integrate it cleanly — the
  same "figure out which section(s) it belongs to, weave it in directly,
  don't tack on a separate section or an unlabeled paragraph, and don't just
  add a passing mention" approach as Step 4c's focus/document enrichment. If
  it conflicts with or supersedes an existing fact (e.g. it's more recent),
  follow Step 5's update convention — update inline and attach a dated
  footnote — rather than appending a second, contradictory statement next to
  the old one.
- Regenerate the **entire** file content (whole-file write, reflecting
  whichever of the two behaviors above applies) and write it via
  `research-cli.ts write` — same single-write pattern as Step 8's save path,
  just with no research phase in front of it.
- Always re-read the *current* on-disk content (via `check-exists` +
  incorporating what's already there, same as any update run) before
  deciding what to change. **The "don't duplicate it" idempotency check is
  intent-specific — don't apply one rule to both kinds:**
  - For a **rewrite/clarification**: the underlying fact being "already in
    the file" is NOT a reason to skip — that's true of every rewrite by
    definition, since you're re-explaining something that already exists.
    Only skip (`profileUpdated: false`) if the file's *current wording* for
    that passage is already essentially identical to the answer — i.e.
    incorporating it again would swap in text that's already there,
    word-for-word or near enough. A genuine rewrite/clarification Incorporate
    click should almost always produce `profileUpdated: true` the *first*
    time it's clicked on a given answer, since the wording you're placing is
    by construction different from what's currently in the file. This is
    what makes clicking Incorporate twice on the *same* answer safe (the
    second click sees its own already-swapped-in wording and skips) without
    also making the *first* click a no-op.
  - For **new information**: skip only if that specific fact/detail is
    already present anywhere in the file — the original rule, unchanged.
- Return only structured JSON, no surrounding prose:
  `{"profileUpdated": <bool>, "note": "<short note saying whether this was a replacement (and of what) or an addition (and where), or why nothing changed>"}`.

## Automated invocation

When invoked headlessly (`claude -p /biomed-research ...` from the app's
`runResearch()`, not an interactive session) with `mode: "query"` (the
default — omitted entirely for a normal query-mode run), the prompt gives
you: `query` (the company/product/topic string), `category_hint`
(`"companies"`, `"products"`, `"topics"`, or `null` — `null` means you decide
the mode yourself per Step 1), and an optional `focus` (a short note on
specific things the user wants researched in more depth — handled in Step 4c,
after the baseline checkpoint). Follow Steps 1 through 7 in order as above
(baseline research/build → checkpoint write → enrichment → QA → final write),
but skip the interactive final report — instead return only the final JSON
result
`{"category": "<companies|products|topics>", "slug": "<slug>", "title": "<title>",
"created": <bool>, "note": "<one or two sentences on how the research went,
including any source limitations>"}`, no surrounding prose.

## Automated invocation — document

When invoked headlessly from the app's `runDocumentResearch()` with
`mode: "document"`, the prompt gives you: either `pdf_path` (absolute path to
an uploaded PDF) or `source_url` (a pasted link) — exactly one will be
present — plus `category_hint` (same semantics as above), an optional
`focus`, and `purpose` (`"personal_research"`, `"learning"`, or
`"linkedin_post"` — see the Purpose framing in Step 4). Follow Step 1b first
to extract the source and decide the mode, then continue with Steps 2 through
7 exactly as a query-mode run (checkpoint write in 4b, enrichment in 4c, final
write in 7), applying the `purpose` framing throughout Step 4. Return the same
final JSON result shape as the query-mode invocation above, no surrounding
prose.

## Automated invocation — chat

When invoked headlessly for Step 8 (`claude -p /biomed-research ...` from the
app's `runResearchChat()`, not an interactive session), the prompt gives you:
`mode: "chat"`, `category`, `slug`, the profile's current `content`, the prior
`history` (array of `{role, content}`), and the latest `message`. Follow Step 8
exactly as above (still write via `research-cli.ts write` only if something needs
saving), and return only the final JSON result
`{"reply": "<markdown reply>", "profileUpdated": <bool>, "note": "<null or a short
note on any source limitation>"}`, no surrounding prose.

## Automated invocation — incorporate

When invoked headlessly for Step 8b (`claude -p /biomed-research ...` from the
app's `incorporateResearchAnswer()`, not an interactive session), the prompt
gives you: `mode: "incorporate"`, `category`, `slug`, the profile's current
`content`, `question`, and `answer`. This invocation is granted **no
WebSearch/WebFetch tools at all** — follow Step 8b exactly as above (write via
`research-cli.ts write` only if something changed), and return only the final
JSON result `{"profileUpdated": <bool>, "note": "<short note on where it went,
or why nothing changed>"}`, no surrounding prose.

## Constraints

- WebSearch/WebFetch only — no scraping of LinkedIn or any site requiring login
  beyond what WebFetch naturally renders; never attempt to log in anywhere.
- `Read` is only ever used to open an uploaded PDF at the `pdf_path` given in a
  document-mode invocation (Step 1b) — never used for profile files (see below).
- Never use the Write/Edit tools for profile files — always write via
  `research-cli.ts write`, so there's exactly one path a profile can end up on disk
  through, in both interactive and automated runs.
- Always call `research-cli.ts check-exists` before writing, so create-vs-update
  framing (Step 5's footnote/merge behavior) is based on the real file state, not a
  guess.
- `category` must be one of `companies`, `products`, `topics` — never invent a new
  category directory.
- Only state facts actually found via search/fetch — where something can't be
  verified, say so plainly in the text rather than guessing or silently omitting it.
