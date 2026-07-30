---
name: internship-search
description: Use when the user wants to search for newly posted internships/roles that match their targeting criteria, either on demand or as a daily check. Searches both broad AI/biomedical/health-tech/comp-bio postings and the fixed target-company list, and only surfaces postings not already in the tracker.
---

# Internship search

Finds newly posted internships matching the user's criteria and their fixed
target-company list, deduped against what's already tracked.

## Steps

1. **Load context first**:
   ```
   npx tsx scripts/db-cli.ts preferences get
   npx tsx scripts/db-cli.ts target-companies list
   npx tsx scripts/db-cli.ts applications list
   ```
   Use the `industries`/`roles` from preferences and the `name`/`location` from each
   target company. Build the "already tracked" set from `applications list` (by
   `link`, and by `company`+`role` as a fallback) so you never re-surface a posting
   already in the tracker.

2. **Search two ways with WebSearch**:
   - **Broad criteria search**: newly posted internships/co-ops in AI applied to
     healthcare, biomedical engineering, computational biology, health-tech, and
     anything adjacent to the user's stated roles — posted recently (favor "posted
     today/this week" signals when the source shows them).
   - **Target-company search**: for each company in the target-companies list, search
     specifically for current internship/entry-level postings at that company. Group
     results by the company's `commute_tier` when you report back.

3. **Filter out anything already tracked** using the dedup set built in step 1. Only
   surface genuinely new postings.

4. **Report results grouped clearly**: target-company matches first (grouped by commute
   tier, closest first), then broad-criteria matches. For each: company, role, location,
   link, and why it matched (which target company / which industry tag).

5. **Offer to add any of them** — for ones the user wants tracked, hand off to the
   `internship-intake` skill's flow (or call the same `applications add` command
   directly) rather than duplicating that logic here.

## Notes

- This is on-demand: the user runs it whenever they want (e.g. once a day). There's no
  scraping of LinkedIn or any site that requires login — WebSearch only.
- If nothing new is found, say so plainly rather than stretching to report stale or
  already-tracked postings.
