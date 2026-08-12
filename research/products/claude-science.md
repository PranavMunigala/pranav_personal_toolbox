# Claude Science (Anthropic’s Drug Discovery Program)

**Researched:** August 11, 2026

## What It Does

Claude Science is Anthropic’s AI research workbench for scientists, launched in beta on June 30, 2026, alongside the announcement that Anthropic will run its own **internal preclinical drug discovery programs**. Together they mark Anthropic’s shift from just supplying general-purpose AI to pharma companies to also directly practicing drug discovery itself.

- **Problem it solves**: scientists (especially in computational biology and pharma) waste enormous effort stitching together dozens of disconnected databases, notebooks, and specialized tools (genomics, proteomics, cheminformatics) — Claude Science unifies that workflow into one AI-assisted workbench.
- **Who it’s for**: computational biologists, drug discovery researchers, and pharma R&D teams already using Claude, from academic labs up to enterprise pharma orgs.
- **The parallel drug-discovery angle**: Anthropic isn’t only building tools — it announced it will personally run **preclinical drug programs targeting “neglected diseases”**, i.e. disease areas major pharma companies avoid because the economics don’t pencil out (small patient populations, low profit potential, historically under-resourced — think tropical/rare diseases). Anthropic’s head of life sciences, Eric Kauderer-Abrams, framed this as necessary “dogfooding”: “there’s no substitute for having our own experiences alongside you all in the trenches trying to develop drugs.” No specific disease targets, funding commitments, or timelines have been disclosed yet.

## How It Works

- **Not a new model** — Claude Science explicitly runs on Anthropic’s existing frontier models (e.g., Claude Opus 4.8), not a specialized biology-tuned model. The bet is on **workflow and tool integration**, not raw model capability. Think of it like the difference between training a new specialized neural net vs. building a much better orchestration layer/IDE around an existing general-purpose model — the “intelligence” isn’t new, but what it’s wired up to is.
- **60+ integrated scientific databases and toolkits** in one workspace — PubMed, arXiv, UniProt, PDB (Protein Data Bank), GenBank, spanning genomics, single-cell biology, proteomics, structural biology, and cheminformatics.
- **40+ pre-installed scientific Python packages** (NumPy, SciPy, pandas, scikit-learn, BioPython, RDKit, etc.) so the agent can write and run real analysis code rather than just talk about it — similar to how a data scientist would use a pre-configured Jupyter environment, except an AI agent is doing the coding autonomously given a high-level instruction.
- **Reproducible, explainable outputs**: generated figures (e.g., 3D protein structure renders, chemistry structure drawings) ship with the exact code and environment that produced them, a plain-language description of the method, and the full message history — closer to a lab notebook with full provenance than a one-off chatbot answer.
- **Data stays local**: the app runs on the user’s own infrastructure; raw datasets and compute don’t leave it — only prompts/responses are processed by Anthropic under standard retention. This matters a lot for pharma companies protecting proprietary compound/patient data.
- **Coefficient Bio acquisition (~April 2026, $400M, all-stock)** — Anthropic’s first major acquisition, folding in a ~9-person team of ex-Genentech computational drug discovery researchers (co-founders Samuel Stanton and Nathan C. Frey came from Prescient Design, Genentech’s AI drug discovery unit). Coefficient’s platform — which handled tasks like drafting drug R&D plans and managing clinical/regulatory strategy — was folded into Claude/Claude Science as built-in capability rather than kept as a separate product.

## Company & Competing Products

Made by **Anthropic** (no existing company profile yet for Anthropic in this research set).

**How Anthropic’s approach differs from other AI drug discovery players:**
- Most competitors (Isomorphic Labs, Recursion, Insilico Medicine) built **purpose-specific drug-discovery models/platforms** from the ground up. Anthropic instead is repositioning a **general-purpose foundation model** (Claude) with a workflow/tooling layer on top — betting that orchestration and integration, not a specialized biology model, is the bottleneck for scientists today.
- Anthropic is also unusual in **running its own internal drug programs** aimed specifically at economically unattractive “neglected disease” areas, rather than chasing high-value indications the way most well-funded AI-drug-discovery startups do — positioned partly as a public-good/dogfooding move, not primarily a commercial pipeline play.
- One skeptical industry take (Dr. Noam Solomon, CEO of Immunai): drug *discovery* is “the lighter problem” in the pipeline — the real bottleneck is the **decade-long, ~$2.7B clinical trial process** where over 90% of candidates fail, largely gated by access to patient-level clinical data that pharma companies (not AI labs) control. By this view, Anthropic’s move mirrors what Google DeepMind (via Isomorphic Labs) did roughly a year earlier, and doesn’t yet address the harder downstream problem.

**Competing products/platforms:**
- **Isomorphic Labs** (Google DeepMind spinout) — leads on validation via ~$3B in pharma partnership deals with Eli Lilly and Novartis; had not disclosed a clinical candidate as of mid-2026, though a first-in-human trial for an IsoDDE-designed candidate was on track for end of 2026.
- **Insilico Medicine** (Hong Kong, ~$293M HKEX IPO Dec 2025) — currently the field’s clearest clinical proof point, with a positive Phase IIa result (INS018_055) published in *Nature Medicine*.
- **Recursion Pharmaceuticals** (post-Exscientia merger) — the most comprehensive end-to-end platform, though it trimmed its pipeline in 2025.
- Other clinical-stage players: **Schrödinger, XtalPi, Absci, Generate:Biomedicines, Iambic Therapeutics, Relay Therapeutics**.
- Sector-wide as of mid-2026: **no AI-discovered drug has reached full approval yet** — AI has sped up early discovery but hasn’t shortened Phase 2/3 trials or avoided the fundamental biology of efficacy/safety.

## Stage & Validation

- **Claude Science**: public **beta**, launched June 30, 2026. Included at no extra charge with any paid Claude subscription (Pro $20/mo, Max from $100/mo, Team from $25/user/mo, Enterprise) — no free-tier access, no separate price tag.
- Named enterprise/pharma users so far: **Novo Nordisk, Allen Institute**, with references to **Evinova and AbbVie** also using Claude for research/clinical development work — though this likely means these pharma orgs are working with multiple AI vendors simultaneously, not exclusively with Anthropic.
- Anthropic is funding external adoption too: up to **50 Claude Science research projects** with up to **$30,000 in Claude credits each**, applications closed July 15 2026, awards by July 31, projects running Sept 1–Dec 1, 2026 — an early academic/research seeding effort.
- **The internal drug programs are pre-clinical and very early** — no disclosed disease targets, funding levels, or timeline to human trials as of this writing. This is a company-stated multi-year bet, not a near-term product.

## Personal Takeaways

- Interesting as a case study in a **foundation-model company vertically integrating into a specific industry** — rather than staying a horizontal tools provider, Anthropic is testing its own product by becoming a drug-discovery customer of itself. Worth watching whether this becomes a repeatable playbook (AI labs practicing an industry to sell better tools into it) or stays a one-off.
- The “neglected diseases” framing is a genuinely different strategic angle vs. profit-maximizing drug-discovery startups — worth watching whether it produces real preclinical candidates or stays a PR/goodwill signal, especially since specifics (targets, budget, timeline) are still undisclosed.
- The Solomon critique is the most important open question for the whole field, not just Anthropic: if clinical trials (not discovery) are the real bottleneck, AI-accelerated discovery could just mean **more candidates entering the same slow, expensive, high-failure-rate pipeline** — worth tracking whether Anthropic (or any competitor) makes real headway on the clinical-data-access problem, since that’s what’s actually gating outcomes.
- Good comparison point for evaluating “AI + biology” career paths broadly: discovery-stage tooling (what Claude Science and most competitors focus on) is a very different skillset/problem than clinical-trial-stage data science, and the field’s bottleneck may increasingly shift toward the latter.