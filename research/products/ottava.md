# OTTAVA™ Robotic Surgical System

## What It Does

OTTAVA is Johnson & Johnson MedTech's soft-tissue robotic surgical system — a robot that assists surgeons performing minimally invasive general surgery through small abdominal incisions (soft-tissue work, as opposed to orthopedic/bone procedures).

- **Regulatory milestone**: received **FDA De Novo market authorization on July 22, 2026** — the first real challenger to Intuitive Surgical's **da Vinci** system in soft-tissue robotic surgery after roughly **two decades** of da Vinci having the category essentially to itself.
- **The actual problem it solves**: not "can a robot do surgery" (that's already established) but making robotic surgery **cheaper and more space-efficient to deploy**, so more hospitals — not just large, well-resourced ones — can offer it.

## How It Works

- **Physical layout**: four robotic arms are **built directly into a standard OR table** rather than mounted on a separate rolling cart or overhead boom — the design almost every competitor, including da Vinci, uses. Arms fold away under the table when not needed.
  - *Analogy*: like a kitchen island with a built-in stove versus wheeling a portable cooktop into the room each time.
- **Predefined poses**: at the push of a button, motors and software drive the arms into standard procedural setup positions, instead of a surgical tech manually positioning each arm.
  - *CS/engineering analogy*: like calling a saved configuration/preset rather than setting each parameter by hand each run — a lookup instead of manual re-derivation.
  - *Plain-language analogy*: similar to a car seat "memory" preset moving several motors to a saved position at once.
- **Twin-motion**: table and arms move together as one coordinated unit. In multi-quadrant surgeries (needing access to different parts of the abdomen mid-procedure), repositioning the patient normally forces re-adjusting every arm afterward — twin-motion keeps arms correctly aligned automatically when the table tilts or shifts.
  - *CS/engineering analogy*: like a closed-loop control system continuously correcting an output (arm position) to track a moving reference (table position), instead of an open-loop one-time calculation.
  - *Plain-language analogy*: like a phone gimbal keeping a camera stable as your hand moves.
- **Net effect**: **30-50% less floor space** than boom/cart-mounted competitors — which matters because OR space, not surgeon skill or willingness, is often the actual bottleneck to adding robotic capacity.

## Company & Competing Products

- **Maker**: **Johnson & Johnson MedTech** (a division of Johnson & Johnson). No company-level profile exists yet in `research/companies/` — worth a separate J&J MedTech research pass for the fuller picture (financials, leadership, etc.); this file is scoped to the product itself.
- **Competing systems** in soft-tissue robotic surgery:
  - **Intuitive Surgical — da Vinci**: the incumbent, **~71% market share**, **9,200+ installed systems**, unchallenged in this category for ~20 years until OTTAVA's clearance. da Vinci Xi costs **$2.5-3M**; the newer da Vinci 5 is **$2.8-3.5M**, and now has **nine new procedures cleared**, with Intuitive working with a limited number of U.S. sites this year to establish cardiac programs.[^2026-08-04]
  - **Medtronic — Hugo RAS**: the other major recent challenger; modular/portable arm design, priced around **$1.5-2M**, leverages Medtronic's existing presence in ~98% of US hospitals. First U.S. commercial cases were performed at the start of 2026, and Medtronic has since submitted 510(k)s for **general surgery/hernia repair** and **gynecologic surgery** indications, plus received 510(k) clearance for a **ProGrip Advanced mesh** for robotic-assisted ventral hernia repair — actively broadening its approved-use list.[^2026-08-04]
  - **CMR Surgical — Versius**: portable, modular, lower capital cost, per-procedure leasing model; more traction in UK/Europe/Asia than the US so far.
  - **Smaller/earlier-stage entrants**: Asensus Surgical (Senhance), Vicarious Surgical, Virtual Incision (MIRA).
- **Don't confuse with**: J&J also makes **VELYS**, a separate robotic-assisted system for orthopedic (joint replacement) surgery — a different category from OTTAVA's soft-tissue focus.

## Stage & Validation

- **Market stage**: just cleared. FDA De Novo authorization granted **July 22, 2026**, covering **ten general surgery procedure types**: Roux-en-Y gastric bypass, gastrectomy, cholecystectomy, splenectomy, gastric sleeve, small bowel resection, appendectomy, lysis of adhesions, fundoplication, and hiatal hernia repair.
  - J&J plans an **initial limited launch to "select customers"** rather than a broad rollout, "focusing on early customer success while working in parallel to advance into additional indications and regulatory jurisdictions over time" — confirmed on J&J's August 3, 2026 investor call.[^2026-08-04]
- **Clinical evidence**: backed by the **FORTE study** — a prospective, single-arm, open-label trial across **six U.S. hospital sites**, **30 patients** undergoing Roux-en-Y gastric bypass.
  - All primary safety/performance endpoints were met through **30 days post-procedure**, with **no conversions** to non-robotic (open) surgery.
  - That's a small trial by device-approval standards — reasonable for a De Novo pathway given da Vinci's long safety track record already established the underlying surgical approach — but worth weighing the sample size against da Vinci's decades of data when judging how "proven" OTTAVA is.
- **Regulatory path/timeline**:
  - **November 2024** — IDE (investigational device exemption) granted
  - **January 2026** — FDA De Novo submission
  - **July 2026** — authorization granted
  - A U.S. clinical trial for **inguinal hernia repair** is ongoing, suggesting J&J will keep expanding the approved procedure list over time.

## Personal Takeaways

- **Genuinely interesting inflection point**: the first time in ~20 years a company has cracked da Vinci's soft-tissue monopoly with FDA clearance in hand, not just a prototype demo — worth watching how fast hospital adoption actually moves given switching costs (surgeon retraining, existing da Vinci capital investment at most hospitals).
- **Architecture bet**: table-integrated design is a genuinely different wager than Medtronic/CMR's "make it portable/modular" approach — worth watching which philosophy wins on cost-per-OR and surgeon preference over the next couple years.
- **Small initial trial** (30 patients, one procedure type) means real-world safety data over the next 1-2 years of limited launch will matter a lot before drawing conclusions on how OTTAVA holds up against da Vinci at scale.
- **Milestones to watch**: results/uptake from the "select customers" limited launch, whether the inguinal hernia trial leads to an expanded indication, and how fast Medtronic's Hugo indication expansion (hernia, gynecologic) narrows the procedure-list gap with both OTTAVA and da Vinci.

Sources:
- [Johnson & Johnson Receives FDA Market Authorization in the U.S. for its OTTAVA™ Robotic Surgical System](https://www.jnj.com/media-center/press-releases/johnson-johnson-receives-fda-market-authorization-in-the-u-s-for-its-ottava-robotic-surgical-system)
- [J&J MedTech jumps into surgical robot game as OTTAVA secures FDA nod](https://www.medicaldevice-network.com/news/jj-medtech-jumps-into-surgical-robot-game-as-ottava-secures-fda-nod/)
- [J&J Ottava FDA Clearance Breaks da Vinci's Two-Decade Soft-Tissue Monopoly](https://www.techtimes.com/articles/321555/20260725/jj-ottava-fda-clearance-breaks-da-vincis-two-decade-soft-tissue-monopoly.htm)
- [FDA clears J&J's surgical robot for 'the next era in surgery'](https://www.fiercebiotech.com/medtech/fda-clears-johnson-johnsons-surgical-robot-next-era-surgery)
- [Overview | OTTAVA™ Robotic Surgical System | J&J MedTech US](https://www.jnjmedtech.com/en-US/products/robotics/ottava-robotic-surgical-system/overview/)
- [J&J's OTTAVA Robot Gets FDA Nod, Challenges Intuitive](https://www.mddionline.com/surgical/the-wait-is-over-j-j-s-ottava-surgical-robot-wins-fda-nod-challenging-intuitive-s-80-market-share)
- [Surgical Robotics in 2026: da Vinci 5, Hugo, Ottava, Mako, Versius](https://pdpspectra.com/blog/surgical-robotics-2026/)
- [Medtronic Beefs up Hugo RAS with Milestones & Submissions](https://www.mddionline.com/robotics/medtronic-takes-quality-quantity-stance-on-hugos-offerings)
- [5 robotic surgery trends to watch in 2026 | MedTech Dive](https://www.medtechdive.com/news/5-robotic-surgery-trends-to-watch-2026/810577/)

[^2026-08-04]: Updated — added da Vinci 5's nine newly cleared procedures and cardiac-program rollout, confirmed J&J's August 3, 2026 investor call framing of the limited launch, and added Medtronic Hugo's newly submitted general surgery/hernia and gynecologic indications plus its cleared ProGrip Advanced mesh, based on a light research-freshness check (reformatting pass).
