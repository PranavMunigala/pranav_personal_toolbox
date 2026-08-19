# Flagler Health

## Company Overview

Flagler Health is a New York City-based healthtech startup building AI software for **musculoskeletal (MSK) care** — the corner of medicine covering orthopedics, interventional pain, physical therapy, sports medicine, podiatry, and neurology.

- **Founded**: 2023, by three co-founders with direct MSK-clinic operating experience rather than pure tech backgrounds.
- **Founders**: **Albert Katz** (CEO — former COO/CFO of a 120+ employee MSK clinic), **Dr. Leon Anijar** (CMO — double board-certified in interventional pain and anesthesiology, Rush residency/fellowship), **Will Hu** (CTO — approximately 10 years of AI/ML experience in disease detection and progression, previously at IQVIA on patient-targeting models).
- **Stage**: Series B (as of August 2026).
- **Mission/problem**: MSK conditions affect over half of U.S. adults and drive over USD 400 billion in annual U.S. healthcare spend, spread across 250,000+ outpatient providers — but most MSK practices are small businesses running on thin administrative staff, manual scheduling, and slow insurance paperwork. Flagler's pitch is "automate your practice without changing workflows": plug AI into the clinic's existing EMR rather than asking clinicians to adopt new software.
- Note on the name: there is an unrelated Florida hospital system called "Flagler Health+"/"Flagler Hospital" (which separately piloted AI care-pathway tools years ago) — not affiliated with this NYC AI startup. Worth being careful not to conflate the two when searching further.

## Technology & Products

Flagler doesn't sell one product — it's a modular platform that sits **inside a clinic's existing EMR** and automates the administrative/clinical busywork around a patient visit, rather than replacing the EMR itself. Think of it less like a new app clinicians have to learn, and more like a background service that watches the same data the EMR already has and takes actions on it — similar to how a scheduled job or event-driven pipeline in software engineering reacts to state changes without a human triggering each step.

- **Triage** — routes patients to the right provider or specialist automatically, using patterns learned from EMR records, radiology reports, billing codes, and physician practice patterns across "millions of patients and thousands of providers." Analogy: it's a **recommendation/ranking model** — like a search engine ranking results, except ranking which clinician or care pathway best fits a given patient's data.
- **AI Call Center** — a 24/7 automated front desk handling scheduling, intake, reminders, and outreach; Flagler cites up to a **25% reduction in call center costs** and **81% same-day booking growth** from automated scheduling.
- **Revenue Cycle Management (RCM)** — automates insurance eligibility checks, prior authorization, coding, billing, and denial handling end-to-end; the company claims prior-auth approval rates approaching 100% and "99% clean claims." This is the highest-friction, most rules-heavy part of running a clinic (a lot like a compliance/validation pipeline that has to match a claim against ever-changing payer rules before it's allowed through).
- **Care Management** — remote tracking of patient-reported pain/mobility/adherence between visits, with automated follow-up nudges; Flagler reports 87% of patients seeing improved outcomes and 93% satisfaction.

A useful way to think about the overall system: it's an **agentic AI layer** wrapping a legacy database (the EMR) that a human used to have to manually query and act on — the AI now does both the "read" (extract relevant patient state) and the "write" (take the scheduling/billing/outreach action) autonomously, with a human only in the loop for exceptions.

Further reading: [flaglerhealth.io](https://www.flaglerhealth.io/)

## Market & Competition

- **Customers**: outpatient MSK practices — orthopedic, interventional pain, physical therapy, sports medicine, podiatry, neurology clinics. Flagler reports **10,000+ providers** and **100+ partner organizations** across **36+ states**, up from a single triage tool two years prior.
- **Why MSK specifically**: it's a large (over USD 400 billion per year), highly fragmented market of small-to-mid practices that mostly lack in-house data/IT teams — a market segment big tech EMR vendors (Epic, athenahealth, etc.) serve at the infrastructure layer but don't optimize workflow-by-workflow the way Flagler claims to.
- **Differentiation claim**: "no workflow change" — integrates directly into whatever EMR the clinic already runs rather than requiring a rip-and-replace, which lowers the switching cost that usually kills healthtech sales cycles.
- **Roadblocks for the space generally**: healthcare AI vendors face long sales cycles with independently owned clinics, EMR integration complexity (every EMR vendor has different data access/APIs), and regulatory/liability sensitivity around anything touching billing or clinical recommendations. No named direct competitors were found in public coverage of the Series B — worth treating as an open research question rather than assuming Flagler is uncontested.

## Financials

- **Total funding**: USD 63 million to date.
- **Series B**: USD 50 million, announced August 2026, led by **Bessemer Venture Partners**, with SignalFire, Alumni Ventures, Streamlined, 186 Ventures, Proof VC, Tribeca Venture Partners, and Offscript participating.
- Reported unit economics: **approximately USD 164,000 in additional annual revenue per provider** on average, and roughly 4 days/month of admin time saved per practice — the kind of ROI-per-seat metric that's driving the raise's growth thesis (expanding MSK practice coverage across the U.S.).

## Team, Leadership & Culture

- **Albert Katz — CEO**: former COO/CFO of a 120+ employee MSK clinic; brings the operator's view of what actually breaks in a practice's back office.
- **Dr. Leon Anijar — CMO**: double board-certified physician (interventional pain, anesthesiology), residency/fellowship at Rush — grounds the product in real clinical practice rather than just software design.
- **Will Hu — CTO**: approximately 10 years in AI/ML for disease detection/progression, previously at IQVIA building patient-targeting models — directly applicable to Flagler's triage and outcomes-prediction work.
- Bessemer's investment thesis (per their announcement) frames the founding trio's combination of operational, clinical, and technical backgrounds as a key reason for backing the round — a "founders who lived the problem" story.
- **Culture**: no independently verifiable employee reviews (e.g. Glassdoor ratings/text) were found in public search — can't be stated as fact.
- **Rutgers networking add-on**: a quick, non-exhaustive search did not surface any Rutgers biomedical engineering alumni specifically working at Flagler Health or in the MSK-AI niche directly. Broader Rutgers BME alumni are visibly active in adjacent health-tech/AI-diagnostics startups (e.g. around medical imaging and self-driving-lab drug development), which could be worth following up on directly via LinkedIn search rather than general web search, but nothing specific enough to name here without risking a fabricated lead.

## Careers & Personal Fit

- Flagler's own site has a careers page but no specific internship program details were publicly listed at the time of this research; third-party job boards (Ashby, ZipRecruiter, Indeed) list a handful of open roles, though most indexed listings under "Flagler Health" are noise from the unrelated Florida hospital system — treat job-board results for this name with caution and verify against flaglerhealth.io directly.
- No confirmed internship/co-op program found — worth a direct, more targeted follow-up (e.g. checking their Ashby board again closer to when you'd apply) rather than assuming none exists.
- General full-time hiring appears active given the recent USD 50 million raise earmarked for expansion, but specific current openings weren't reliably enumerable from public search at research time.
- **Fit**: this is a small (Series B, ~2-year-old product), technically dense company building agentic AI + healthcare data pipelines — a good match for someone with BME + CS/ML interests who wants to see how AI gets applied to messy, real-world clinical/administrative data rather than pure research settings.

## General Notes & Personal Takeaways

- Interesting as a case study in **narrow-vertical healthcare AI**: rather than a general clinical-AI platform, Flagler picked one specialty (MSK) and went deep on the specific workflows (triage, billing, call center, care management) that specialty's practices struggle with — a good example of "vertical AI" strategy.
- The "zero workflow change" integration strategy is worth watching as a template — it's the same lesson a lot of enterprise software has learned: the technology being good matters less than not asking already-overloaded users to change how they work.
- Open questions: how defensible is the technology moat once other vertical-AI healthtech startups notice the same MSK opportunity; how much of the reported ROI numbers reflect selection bias (early adopter practices) vs. what a typical new customer would see; whether Flagler expands beyond MSK into other outpatient specialties long-term.
- Milestone to watch: how the platform scales past ~10,000 providers, and whether they publish any peer-reviewed or third-party validation of the clinical outcome claims (currently self-reported).