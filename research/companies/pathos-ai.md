# Pathos AI

## Company Overview

- **Location**: New York, NY; founders also run Tempus AI, a Chicago precision-medicine data company.
- **Founded**: 2022 by **Eric Lefkofsky** and **Ryan Fukushima**, after seeing via Tempus how much cancer data exists but how rarely it speeds up drug development itself.
- **Stage**: Late-stage private biotech. **$365M Series D** (May 2025) at **~$1.6B valuation**, after a **$62M Series C** — **~$467M total raised**.
- **CEO**: **Iker Huerga** (joined 2025), ex-AstraZeneca chief data scientist for oncology R&D; a cancer survivor, which the company says shapes its mission.
- **Mission**: re-engineer drug development for oncology using AI plus large-scale patient data, rather than inventing new molecules from scratch.
- **Core problem**: most cancer drugs fail not from bad chemistry but from testing the wrong patients, wrong dose, or missing biomarkers. Pathos bets better data use beats more chemistry.
- **In one plain sentence**: Pathos is a cancer-drug company, not a software company — it does not sell an app or a diagnostic test to anyone. It acquires the rights to existing cancer drugs and uses AI to run smarter, cheaper clinical trials on them, hoping to get more of them approved than a typical biotech would.[^2026-08-06]

## Technology & Products

Platform: **PathOS**, built on a shared AI core **Foundry**, powering two products, **Scout** and **Sprint**.

- **Foundry** — runs **thousands of AI agents in parallel** on the **Pathos Oncology Foundation Model**, trained on genomics, imaging, clinical notes, and outcomes.
  - **Analogy**: similar to how a modern LLM agent framework routes sub-tasks to specialized tools instead of one forward pass.
  - **Scale**: Pathos claims **>200 petabytes** of multimodal oncology data tied to outcomes — ~50x TCGA, a proprietary data moat.
- **Scout** — ranks/prioritizes which drug candidates to bet on, like a search-ranking algorithm where the candidates are drug-patient combinations.
- **Sprint** — once an asset is chosen, designs the trial itself: eligible patients, dosing, biomarkers.
- **Real drugs**: Pathos mostly in-licenses existing molecules rather than discovering new ones:
  - **Pocenbrodib** — the first clinical-stage asset for Pathos; an oral CBP/p300 inhibitor licensed in 2023 from **Novo Nordisk**, already in a **Phase 1b/2a** trial for metastatic castration-resistant prostate cancer.[^2026-08-06]
  - **JSKN016** — bispecific ADC (TROP2 + HER3), licensed from Alphamab (China) for **$125M upfront, up to $2.1B milestones**; Pathos holds rights outside Greater China.
  - **AZD4241** — ER degrader with AstraZeneca under a co-exclusive licensing deal; Pathos runs early clinical development, AstraZeneca retains shared rights; terms undisclosed.[^2026-08-06]
- More: [pathos.com/platform](https://www.pathos.com/platform)

## Market & Competition

- Sells to/partners with pharma (AstraZeneca) and license-holders (Alphamab, Novo Nordisk) rather than end users — AI as internal infrastructure, not SaaS.
- **How Pathos actually makes money, in plain terms**: think of Pathos less like a tech startup and more like a specialized investment fund for cancer drugs.[^2026-08-06]
  - **Step 1 — buy in**: Pathos pays companies like Alphamab and Novo Nordisk upfront cash plus milestones to acquire rights to a drug they already have but have not fully developed. This is money going out, not revenue.
  - **Step 2 — improve the odds**: Pathos uses Foundry/Scout/Sprint to pick better patients, doses, and trial designs, betting this beats ordinary trial-and-error.
  - **Step 3 — cash in**: if a drug wins FDA approval, Pathos profits by selling it directly or via a partner deal (like AstraZeneca) that pays for early trial work and/or shares future royalties.
  - **Today**: no meaningful product-sales revenue yet — nothing in the pipeline is approved. Pathos runs on its ~$467M in venture funding while trials proceed, same as any pre-revenue clinical-stage biotech; the AI is the reasoning for why the bet should pay off faster and cheaper, not a separate revenue line.
- Differentiation: Recursion/Insitro design new molecules computationally; Pathos finds already-known/shelved molecules and uses AI on patient/trial-design instead.
- Tied to Tempus AI: the two, plus AstraZeneca, signed a **~$200M** data-licensing/model deal.
- Adjacent players: Tempus AI, Recursion, Insitro, PathAI, ConcertAI.
- Roadblocks: in-licensing needs large upfront cash before revenue; differentiation partly depends on data owned by Tempus.

## Financials

- **$365M Series D** (May 2025), **~$1.6B** valuation; investors include NEA, General Atlantic.
- **$62M Series C** ~7 months prior; **~$467M total raised** as of mid-2025.
- No traditional product revenue yet. Deal dollar figures mostly describe money Pathos pays out to acquire rights (e.g. $125M upfront to Alphamab), not money coming in; the AstraZeneca deal runs the other direction (AstraZeneca funding trial work by Pathos) but terms are undisclosed.[^2026-08-06]
- Bottom line: Pathos is funded like a late-stage venture-backed biotech, burning capital on trials, with payoff expected later from sales/royalties post-approval or better future deal terms.[^2026-08-06]

## Team, Leadership & Culture

- **Eric Lefkofsky** — Co-founder, also Tempus AI founder/CEO.
- **Ryan Fukushima** — Co-founder, also Tempus AI COO.
- **Iker Huerga** — CEO, ex-AstraZeneca oncology R&D data science lead.
- **Eric Schadt, Ph.D.** — Chief Science Officer, retains a faculty role at Icahn School of Medicine at Mount Sinai.
- **Matt De Silva** — COO; **Mark Fereshteh** — CSO; **Alex Dolan** — General Counsel; **Kipp Davis** — SVP Finance.
- **Board**: both co-founders plus Amit Mehta, Mohamad Makhzoumi, Tyrell Rivers.
- **Culture**: five stated values — integrity, innovation, collaboration, resilience, empathy. Company-sourced; independent employee-sentiment data not reliably verified here.
- **Networking add-on (Rutgers)**: a quick, capped search found no confirmed Rutgers BME alumni at Pathos.

## Careers & Personal Fit

- Actively hiring, including a **Machine Learning Engineer Intern** role: PyTorch, GPU infra exposure, possible publication co-authorship.
- General full-time hiring: apply via [pathos.com/careers](https://www.pathos.com/careers) or careers@pathos.com.
- **Fit**: strong for someone blending ML engineering with clinical-trial-design domain knowledge.

## General Notes & Personal Takeaways

- Distinct from most AI drug discovery hype: Pathos does not claim AI invents molecules, just that AI picks better patients/trial designs for molecules that already exist.
- Tight coupling to Tempus AI is both a strength (data access) and a watch-item (moat partly borrowed).
- Watch: how JSKN016 and pocenbrodib perform through later trial phases, whether more licensing deals follow, and whether AI-driven trial design shows up in faster regulatory outcomes.
- Leadership/culture claims are company-sourced; some details could not be independently verified.

[^2026-08-06]: Updated — added a plain-language how Pathos makes money explainer (Company Overview, Market & Competition, Financials) and the pocenbrodib pipeline asset (Technology & Products), clarifying Pathos pays out licensing fees to acquire drug rights and has no product revenue yet; it profits later from approvals/partnerships.
