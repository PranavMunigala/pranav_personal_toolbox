# Liquid Biopsy

## Definition & Why It Matters

Liquid biopsy detects and analyzes cancer-derived material -- fragments of tumor DNA, whole tumor cells, tumor-derived vesicles, proteins, or RNA -- from a blood draw instead of a surgical tissue biopsy. Tumors constantly shed material into the bloodstream, so a blood draw can act as a repeatable, low-risk proxy sample. This matters because it turns a one-time invasive snapshot into something repeatable often and cheaply -- enabling earlier detection before symptoms appear, real-time tracking of treatment response, and detection of recurrence months before it would show on a CT scan. It is a case of biology becoming a monitorable data stream.

## Key Techniques & Approaches

- **Circulating tumor DNA (ctDNA), mutation analysis.** Tumors release DNA fragments (cell-free DNA) into blood; sequencing this pool for cancer mutations is the most mature technique, used for drug-selection in late-stage cancer and minimal residual disease (MRD) detection after surgery. Natera Signatera builds a personalized panel from a patient own tumor, then re-tests blood over time for those exact mutations -- like fingerprinting a specific suspect first, then checking for that print later, rather than any print.
- **ctDNA methylation profiling.** Looks at chemical modification patterns rather than sequence, revealing tissue of origin and cancer-like behavior even without a known driver mutation. Basis of multi-cancer early detection (MCED) tests like GRAIL Galleri.
- **Fragmentomics.** Examines physical characteristics of cfDNA fragments (length, cut sites); tumor fragments look physically different from normal. Increasingly combined with methylation and deep learning to extract signal from very low tumor DNA concentrations.
- **Circulating tumor cells (CTCs).** Captures whole intact tumor cells, richer data than fragments, but extremely rare in early-stage disease -- mostly used in research and advanced-disease monitoring.
- **Extracellular vesicles / exosomes.** Membrane-bound packages carrying proteins and RNA, more stable in blood than free RNA, but the field is younger and less standardized than ctDNA.
- **Multimodal / AI-integrated approaches.** Combines mutation, methylation, and fragmentomic signals via machine learning, since any single marker alone is often too weak for reliable early detection.

## Landscape

- **Guardant Health** -- blood-based genomic panels for treatment selection and monitoring; FDA-approved a 740+ gene panel in 2026 (up from 74).
- **GRAIL** -- Galleri MCED test (methylation-based); raised $110M from Samsung affiliates in June 2026 for regulatory approval and international expansion, showing MCED is still capital-intensive and pre-full-commercialization.
- **Exact Sciences** -- known for stool-based Cologuard, now licensing a blood-based colorectal test from Freenome (~$75M upfront) to compete with Guardant.
- **Natera** -- Signatera, tumor-informed ctDNA MRD test, validated in academic studies (e.g. Aarhus University Hospital, stage III colorectal cancer, over 90 percent recurrence-detection).
- Broader academic and clinical research is spread across major cancer centers via trial-driven validation (e.g. registered MRD trials in gastric and lung cancer) rather than concentrated in a few labs.

Market-size estimates vary by source (roughly $9.5B global in 2026 per one estimate; ~$7.85B for U.S. early-detection liquid biopsy alone by 2035 per another) -- these are vendor market-research figures, not independently verified, and should be read as directional.

Note on source limitations: drawn from web search summaries of 2025-2026 reviews, market reports, and press coverage; company financial/regulatory specifics were not cross-checked against primary SEC/FDA sources.

## Open Problems & Bottlenecks

- **Sensitivity at low tumor fraction** -- finding a handful of tumor DNA molecules amid thousands of normal ones is the central unsolved problem, driving the push toward fragmentomics, methylation, and AI signal integration.
- **CTC scalability** -- too rare and technically hard to capture for population-level screening, limiting CTCs mostly to research and late-stage monitoring.
- **Standardization** -- differing assay chemistries and pipelines across companies make cross-test comparison and pooled validation difficult.
- **False positives / overdiagnosis** -- screening healthy populations raises the bar for what counts as a clinically useful positive result, an active tension in the MCED space.
- **Regulatory and reimbursement pathway** -- companies like GRAIL are still raising capital for regulatory approval rather than scaling an approved product.

## Personal Takeaways

Liquid biopsy is fundamentally a signal-processing problem -- extracting a faint tumor DNA signal from a noisy normal-DNA background -- which is why the field leans so heavily on computational and AI tools, making it an appealing niche for an engineering or data background. The MCED story (GRAIL/Galleri) is the most ambitious piece but also the least solved, still navigating regulatory approval and the overdiagnosis tension inherent to screening healthy people. MRD/recurrence monitoring (Natera Signatera, Guardant) feels more clinically mature since it tests known cancer patients rather than the general population. Worth watching: whether multimodal panels close the early-detection sensitivity gap, and how the Exact Sciences/Freenome versus Guardant colorectal screening competition plays out.
