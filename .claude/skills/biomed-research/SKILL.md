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

## Step 3: Research

Use WebSearch/WebFetch to gather information. This is **research-level depth**: written for someone learning about the biomedical/AI space and evaluating personal interest and career fit — not an expert technical teardown, not a surface-level blurb either. Enough depth that a reader genuinely understands the mechanism/market/team, explained clearly.

Some things (LinkedIn team details behind login, private financials behind paywalls) are not reliably fetchable. Do your best with public sources; where you can't verify something, say so plainly in the text (e.g. "leadership bios not independently verified — LinkedIn requires login") rather than guessing or omitting silently.

If the user supplied a link or background text, incorporate it but still verify/expand with independent search — don't just restate what they gave you.

## Step 4: Build the profile content using the matching template

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
5. **Team, Leadership & Culture** — executive leadership, advisory board, key scientists (this drives the actual analysis — always do this thoroughly). Include 2 sentences on company culture (work environment, values, what employees/reviews say) if findable. Then, as a separate add-on: identify 2-3 recent Rutgers graduates (biomedical engineering majors preferred) who could plausibly be good networking contacts — these don't need to work at the company being profiled; they're general networking leads in the same space/field, found via LinkedIn-style search. Keep this clearly separated as a networking add-on — never let its presence or absence affect how thoroughly the rest of the company is researched.
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

Before presenting the final file to the user, do an internal pass (don't show this as a separate output):

- Check that claims are internally consistent and dated where relevant (funding amounts, stage, headcount).
- Remove or flag anything that seems stale, contradictory, or unverifiable rather than leaving it stated as fact.
- Make sure the Rutgers networking add-on and other add-ons didn't creep into or dilute the core analysis sections.
- Confirm footnotes (on update runs) are correctly placed and dated.
- Confirm every section is bullets-and-bold first, not an unbroken paragraph block — reformat any section that's degraded into a blurb.
- Confirm analogies map to CS/math/engineering concepts where a natural mapping exists, per the framing at the top of Step 4.

## Step 7: Write the file via the CLI

Never use the Write/Edit tools directly for profile files — always go through the
script, so interactive and automated runs write profiles the exact same way:
```
npx tsx scripts/research-cli.ts write '{"category":"<companies|products|topics>","slug":"<slug>","title":"<the profile H1 title, without the leading #>","content":"<the full markdown file content, starting with the # Title line>"}'
```
This returns `{"ok": true, "path": "...", "created": <bool>}`. Then tell the user
briefly what was written or what changed.

## Step 8: Follow-up chat mode

Used by the profile page's sidebar chat, where the user can ask follow-up
questions about a company/product/topic they already researched, or tell you to
fold new information into the saved file. Input is: the profile's existing
`content`, the prior conversation as `{role, content}` turns, and the latest user
`message`.

- You may use WebSearch/WebFetch to answer things not already in the file — same
  constraints as Step 3 (no login-gated scraping; say plainly when something can't
  be verified rather than guessing).
- Reply in the same style as the profile itself: simple, bullets-and-bold first,
  analogies mapped to CS/math/engineering concepts where natural (per Step 4).
- If the message asks you to add/save/update something in the profile,
  regenerate the **entire** file content (whole-file, same merge-and-footnote
  behavior as Step 5) and write it via `research-cli.ts write`, then say plainly
  in your reply what was added and where. If nothing needs saving, just reply —
  don't write the file on every turn.
- Return only structured JSON, no surrounding prose:
  `{"reply": "<markdown reply>", "profileUpdated": <bool>, "note": "<null or a short note on any source limitation>"}`.

## Automated invocation

When invoked headlessly (`claude -p /biomed-research ...` from the app's
`runResearch()`, not an interactive session), the prompt gives you: `query` (the
company/product/topic string), `category_hint` (`"companies"`, `"products"`,
`"topics"`, or `null` — `null` means you decide the mode yourself per Step 1), and
an optional `focus` (a short note on what the user cares about most — weight the
research toward that without dropping the standard template sections). Follow Steps
1–7 exactly as above (still write via `research-cli.ts write`), but skip the
interactive final report — instead return only the final JSON result
`{"category": "<companies|products|topics>", "slug": "<slug>", "title": "<title>",
"created": <bool>, "note": "<one or two sentences on how the research went,
including any source limitations>"}`, no surrounding prose.

## Automated invocation — chat

When invoked headlessly for Step 8 (`claude -p /biomed-research ...` from the
app's `runResearchChat()`, not an interactive session), the prompt gives you:
`mode: "chat"`, `category`, `slug`, the profile's current `content`, the prior
`history` (array of `{role, content}`), and the latest `message`. Follow Step 8
exactly as above (still write via `research-cli.ts write` only if something needs
saving), and return only the final JSON result
`{"reply": "<markdown reply>", "profileUpdated": <bool>, "note": "<null or a short
note on any source limitation>"}`, no surrounding prose.

## Constraints

- WebSearch/WebFetch only — no scraping of LinkedIn or any site requiring login
  beyond what WebFetch naturally renders; never attempt to log in anywhere.
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
