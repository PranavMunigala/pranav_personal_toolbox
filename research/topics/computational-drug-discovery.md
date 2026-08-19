# Computational Drug Discovery

## Definition & Why It Matters

- Computational drug discovery (also called in silico drug discovery or AI-driven drug design) is the use of algorithms, simulations, and machine learning models to identify, design, and optimize drug candidates before, or instead of, expensive wet-lab experiments.
- Think of it like a search/optimization problem over an enormous discrete space: the space of drug-like small molecules is estimated at 10^33 to 10^60 possible compounds, far too large to synthesize and test physically, so computation is used to prune and rank candidates the same way a search algorithm prunes a huge state space with a heuristic.
- Why it matters right now: as of mid-2026, more than 173 AI-discovered drug programs are in clinical development globally, with 15-20 expected to reach pivotal Phase III trials this year -- this is converting into an actual industry with real clinical pipelines, not just research.
- The Insilico Medicine drug rentosertib (AI-discovered and AI-designed, for idiopathic pulmonary fibrosis) posted a positive Phase IIa result in 2025 -- the first peer-reviewed clinical proof point in the field that an end-to-end AI-designed drug can work in humans.
- Traditional drug discovery takes 10-15 years and roughly $1-2 billion per approved drug, mostly from late-stage failures. The core pitch here is compressing the early stages (target identification, hit finding, lead optimization) from years to months, and failing faster/cheaper when a candidate will not work.

## Key Techniques & Approaches

- Protein structure prediction (AlphaFold and successors) predicts the 3D shape of a protein directly from its amino acid sequence using deep learning, instead of slow/expensive X-ray crystallography or cryo-EM. Analogy: predicting a compiled binary runtime behavior directly from source code, skipping build-and-run. AlphaFold 3 (2024) extended this to protein interactions with other molecules (ligands, DNA), which matters more for drug design since effect depends on how a drug binds a specific pocket.
- Molecular docking: given a binding pocket and a candidate molecule, predict how well it fits. Classically a search problem (fitting a puzzle piece by trying orientations); newer tools like DiffDock (MIT) reframe it as generative -- the model directly generates a plausible 3D binding pose via diffusion, with a confidence score.
- Diffusion models for molecule generation: the same math behind AI image generators (add noise, learn to reverse it) applied to 3D atomic coordinates instead of pixels -- sampling from a learned probability distribution over molecules that would bind well, instead of hand-designing candidates. DiffSBDD generates molecules directly inside a pocket, conditioned on its shape.
- QSAR (Quantitative Structure-Activity Relationship) modeling: the classical/foundational technique -- represent a molecule as a fixed-length numeric vector (a fingerprint, analogous to feature engineering before deep learning), then train a regression/classification model (random forest, SVM, gradient boosting, or neural nets) to predict a property like binding affinity or toxicity. Usually the first hands-on technique people learn, via RDKit (open-source Python cheminformatics library).
- Protein language models (e.g., ESM-2): transformers trained on hundreds of millions of protein sequences -- same self-supervised pretraining idea as text LLMs, but the vocabulary is amino acids. Learn structural/functional properties without ever seeing a 3D structure; used in protein engineering and as building blocks in larger pipelines.
- ADMET prediction (Absorption, Distribution, Metabolism, Excretion, Toxicity): multi-task models (e.g., ADMETlab 2.0) predicting whether a molecule that binds well is also safe and usable as a drug -- often the actual bottleneck, since a molecule can bind perfectly and still fail as a drug for unrelated reasons.

## Landscape

- Insilico Medicine: furthest along clinically; rentosertib Phase IIa success drove Eli Lilly to commit $2.75B to expand their partnership (March 2026).
- Isomorphic Labs (spun out of Google DeepMind, built on the AlphaFold lineage): most well-funded, raised a $2.1B Series B and a $1.75B Eli Lilly partnership, but as of mid-2026 has no disclosed clinical candidate; expects to file its first IND by end of 2026.
- Recursion Pharmaceuticals (merged with Exscientia): pipeline-with-platform model advancing programs like REC-394 and REC-1245; runs one of the largest phenomics (cell imaging) datasets in the industry.
- Schrodinger: tools-as-software model -- licenses physics-based simulation and ML software to pharma partners, while also advancing its own candidate (zasocitinib) toward late-stage trials.
- Roughly three business models in the industry: tools-as-software (Schrodinger), pipeline-with-platform (Recursion, Insilico, Isomorphic), and partnership-only (most smaller platforms) -- explains why some companies never intend to own a drug through approval while others bet the whole company on it.
- Academic anchor: MIT (DiffDock and related generative docking work), plus growing open-source benchmarking efforts for generative molecular design.

## Open Problems & Bottlenecks

- Data scarcity, not algorithms, is the real constraint -- high-quality labeled experimental data is scarce, noisy, and unevenly distributed, closer to a small-data problem than big-data. Described as the fundamental 2026 bottleneck, unlikely to be fully solved this year.
- The wet-lab validation gap: a molecule can score well computationally and still fail in a real assay (colloidal aggregation, unwanted reactivity, or acting as a PAIN -- a Pan-Assay Interference Compound producing false positives across unrelated assays). Strong benchmark performance does not reliably predict performance on a genuinely new target -- the model-looks-great-in-notebook-breaks-in-production problem.
- Synthetic accessibility: generative models produce millions of chemically valid molecules that are impossible or absurdly expensive to actually synthesize -- valid does not mean buildable.
- Federated learning as a partial answer: since no single company has enough proprietary data alone, training across organizations without data leaving their servers is emerging as a way to pool signal -- still early and unproven at scale.
- Translation to clinical/regulatory outcomes: most of the 173+ AI-discovered programs are still early; 2026 is being called the year these pipelines meet clinical reality, tested against real trial data rather than benchmarks.

## Personal Takeaways

- Why interesting for a BME/CS/math background: this field sits at the intersection of algorithms/ML (docking-as-search, diffusion, transformers), applied math/statistics (QSAR regression, benchmarking, uncertainty), and biology domain knowledge (protein structure, pharmacology, assay design) -- a CS-strong/bio-learning background is a genuine advantage, not a gap.
- How to start learning this, in rough order:
  1. Learn RDKit in Python -- the standard on-ramp. Represent molecules as SMILES strings, compute descriptors/fingerprints, build a basic QSAR model (linear regression or random forest) on public data. A doable first weekend project.
  2. Practice on public datasets: ChEMBL (bioactive molecules), PubChem BioAssay (assay results), Tox21/ToxCast (toxicity), ZINC (purchasable drug-like molecules for screening) -- the standard datasets nearly every course/paper uses.
  3. Understand AlphaFold conceptually before touching code: what problem it solves (sequence to 3D structure) and why that matters for docking is a prerequisite for structure-based drug design.
  4. Move to structure-based methods: try DiffDock or similar on a known protein-ligand pair to see the generative/geometric side, distinct from 2D-molecule QSAR.
  5. Read, not just code: the Awesome-SBDD GitHub list and review articles (e.g., AI-Driven Drug Discovery: A Comprehensive Review, PMC) show the shape of the field without chasing every arXiv paper.
  6. What to prioritize given where the field is going: generative 3D modeling (diffusion/flow-matching -- where the active research energy is, not classical QSAR), protein language models (ESM-family, increasingly a pipeline building block), and ADMET/toxicity prediction (underinvested relative to binding-affinity work, yet the actual reason many promising molecules fail as real drugs -- a good differentiated focus versus already-crowded docking accuracy work).
- Open question: whether federated learning or another data-sharing mechanism meaningfully closes the data-scarcity bottleneck, since the fundamental limiter is not model architecture but the same limited pool of expensive wet-lab data everyone draws from.
- Caveat: financial/funding figures above (Lilly partnership amounts, Series B size) come from 2026 industry press coverage and were not independently cross-verified against primary company filings.
