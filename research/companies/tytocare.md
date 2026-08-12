# TytoCare

**Researched:** August 9, 2026

## Company Overview

- **Location**: Dual headquarters — Netanya, Israel and New York City.
- **Founded**: 2012, by **Dedi Gilad** (CEO) and **Ofer Tzadik** (COO).
- **Stage**: Late-stage private company. **~$205.7M total raised** across 8 rounds from 26 investors, most recently a **Series D** (extended to $100M in March 2021, further Series D activity reported through 2023).
- **Core problem**: standard video-only telehealth can't actually examine a patient — a doctor on a video call can't listen to your lungs, look in your ears, or check your throat. That gap means a large share of "telehealth" visits end in "come into the clinic" anyway. TytoCare's bet: give the patient a handheld device that lets a remote doctor perform a real physical exam, not just a conversation.
- **In one plain sentence**: TytoCare sells a handheld exam device (with a companion app) that turns a video call into an actual physical exam — a doctor can remotely listen to your heart/lungs and look in your ears/throat through the device, guided step-by-step by the app.

## Technology & Products

- **TytoCare device** — a modular handheld unit with FDA-cleared attachments: a **digital stethoscope** (heart/lungs), **otoscope** (ears), and tools for throat/skin exams, all synced live to the **TytoApp**, which walks the patient through correct device placement in real time.
  - **Analogy**: think of the app's real-time exam guidance like **computer-vision-assisted calibration** — the software checks sensor placement/quality against known-good patterns before accepting a reading, similar to how a barcode scanner rejects a blurry read rather than passing bad data downstream — so the remote doctor gets a clinical-grade signal, not a shaky improvised one.
- **Tyto Insights** — TytoCare's **AI layer** on top of the raw device signal, FDA-cleared for:
  - **Wheeze detection** and **crackles detection** in lung sounds — trained on real-world recordings from the FDA-cleared Tyto Stethoscope.
  - **AI-powered eardrum analysis** (FDA De Novo clearance, 2026) — the **first AI otoscopy tool** cleared by the FDA, trained on a proprietary database of **1.6 million ear images**, detecting eardrum bulging (a key sign of Acute Otitis Media) to help avoid unnecessary antibiotic prescriptions.
  - **Analogy**: this is a straightforward **supervised classifier over sensor data** — audio waveforms in, "wheeze present/absent" out; images in, "bulging present/absent" out — the interesting engineering problem is less the model architecture and more getting a large enough labeled clinical dataset (1.6M ear images) to train it reliably.
- **Reported outcomes**: TytoCare claims **6x higher utilization** than standard video-only telehealth, **~5% lower total cost of care**, and an **11.3% reduction in ED visits** for partner health systems — company-reported figures, not independently verified here.
- Full product/regulation details: [tytocare.com](https://www.tytocare.com/) and [tytocare.com/tytocare-regulation](https://www.tytocare.com/tytocare-regulation/)

## Market & Competition

- Sells B2B to **health systems, payers, and employers** (180+ major healthcare-system partners), who distribute the device to patients/members — not a direct-to-consumer retail play, though TytoCare has also run retail partnerships (e.g. Best Buy) to drive consumer purchases that route back to partner health systems.
- **Differentiator**: TytoCare occupies a narrower niche than general video telehealth (Doxy.me, Amwell) — it competes on **hardware-enabled physical exam capability**, not just video-call infrastructure, which is a meaningfully different (and harder to replicate) product category.
- **Roadblock**: this is a hardware-plus-software business, which means real unit costs, device logistics/distribution, and patient willingness to use a physical device at home — all friction that pure video telehealth doesn't have. Reimbursement and provider adoption uncertainty (per general remote-diagnosis-market coverage) is a broader headwind across this whole device-based telehealth category, not unique to TytoCare.

## Financials

- **~$205.7M total raised** over 8 rounds from 26 investors.
- Key investors: **Insight Partners, Tiger Global Management, Qumra Capital, Qualcomm Ventures, Olive Tree Ventures, Shenzhen Capital Group**, and **Healthcare of Ontario Pension Plan (HOOPP)**.
- Notable round: Series D extended to a total of **$100M** in March 2021 (two $50M tranches, 10 months apart), led by Insight Partners.
- Private company; current valuation not publicly disclosed.

## Team, Leadership & Culture

- **Dedi Gilad** — CEO & Co-Founder; 18+ years across startups and larger companies in healthcare IT, enterprise systems, and SaaS.
- **Ofer Tzadik** — Chief Operating Officer & Co-Founder.
- **Tamir Gotfried** — Chief Commercial Officer.
- **Culture**: strong employee-review signal — Glassdoor rates TytoCare **4.3/5** (31 reviews), **92%** would recommend to a friend, **4.5/5** on work-life balance, **4.3/5** on culture/values, **3.9/5** on career opportunities — notably better than the other two profiles researched in this batch (Click Therapeutics, Kaia Health).
- **Rutgers networking add-on**: a quick, non-exhaustive search didn't surface a specific recent Rutgers BME graduate publicly tied to TytoCare or a close peer remote-exam-device startup — not independently verified; would need a more targeted LinkedIn search.

## Careers & Personal Fit

- No dedicated, documented internship/student program found in public sources; general open roles are posted on TytoCare's own careers page and Built In NYC rather than a structured student pipeline.
- General hiring: listings fluctuate (Glassdoor showed no open roles at time of writing; Built In NYC showed active listings) — check TytoCare's own [careers page](https://www.tytocare.com/careers/) directly for current openings.
- **Fit**: strong match for someone interested in **medical device engineering plus applied ML on sensor data** — TytoCare is a good concrete example of a company doing both hardware (device design, sensor calibration, FDA device clearance) and software (AI classifiers on audio/image data) in the same product, useful for a BME/CS student who wants exposure to both sides.

## General Notes & Personal Takeaways

- Appeals to someone interested in the **hardware+AI combination specifically** — unlike Click Therapeutics (pure software) or Kaia Health (camera-only, no hardware), TytoCare requires you to think about physical device engineering, FDA device (not just software) clearance pathways, and sensor-data ML together.
- The **AI otoscopy De Novo clearance (2026)** is a genuinely notable regulatory first worth understanding — it's a good example of how "first of its kind" AI clearances get established as a new FDA category, which matters for anyone interested in medtech regulatory strategy generally.
- **Watch**: whether device-based remote exam adoption keeps growing against pure video telehealth, especially as reimbursement policy evolves — the device's value proposition depends on health systems and payers actually valuing that gap enough to pay for it.
- Best employee-review signal of the three companies researched in this batch — worth weighing if culture/work environment is a real factor in your evaluation.
