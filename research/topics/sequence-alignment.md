# Sequence Alignment

## Definition & Why It Matters

Sequence alignment is the process of lining up two or more DNA, RNA, or protein sequences to see where they match, mismatch, or have gaps — think of it as a diff for biological sequences. It is foundational to biomedical research because most of what we know about gene function, evolutionary relationships, and protein structure comes from comparing a new sequence against ones we already understand.

## Key Techniques & Approaches

- Dynamic programming (the exact but slow method)
  - Needleman-Wunsch: lines up the entire length of two sequences, end to end. Imagine filling in a giant grid where each cell asks what is the best way to match everything up to here — that is literally the same algorithm behind computing edit distance between two strings.
  - Smith-Waterman: same grid idea, but only looks for the best matching chunk, not the whole sequence — like finding the one paragraph two essays share instead of forcing the whole essay to align.
  - Both are guaranteed-optimal but O(n2) — fine for two sequences, way too slow to search a database of millions.

- Seed-and-extend (the fast and practical method) — BLAST
  - Instead of comparing everything to everything, first find short exact matches (seeds), then only do the expensive alignment around those seed hits.
  - Analogy: it is like a search engine index — instead of reading every book to find a phrase, you look up the phrase in a pre-built index, then check only the promising hits closely. This is why BLAST is the tool basically every biologist has used at some point.

- Multiple sequence alignment (MSA) — lining up many sequences at once
  - Doing this perfectly for many sequences is NP-hard (computationally intractable), so tools cheat smartly:
  - Progressive alignment (Clustal, MUSCLE): align the most-similar pair first, then add sequences one at a time, most-related to least-related — basically greedy hierarchical clustering.
  - Profile-HMMs (HMMER, MAFFT): build a statistical template of what each position in the family typically looks like, then fit new sequences against that template rather than against one specific sequence.

- Graph-based alignment (newer)
  - Instead of one reference genome, represent many genomes as one graph (a DAG) where branches are known variation, and align new data against the whole graph at once — like matching a string against a compressed trie of many possible strings instead of one.

- Where AI fits in
  - Alignment is not just a tool anymore — it also became training data. AlphaFold2 leaned heavily on MSAs: by looking at which positions in an alignment of related proteins mutate together across evolution, the model could infer which amino acids are physically close in 3D space (co-evolving residues are probably touching in the folded structure). That is the Evoformer piece of AlphaFold2.
  - Newer models (ESMFold, Evo 2) are trying to skip alignment entirely, learning patterns straight from huge amounts of single, unaligned sequences — trading a bit of accuracy for a lot of speed, though that gap is closing fast (see Landscape below).

## Landscape

- ESM Cambrian / ESMFold2 (Chan Zuckerberg Biohub) — published results showing an alignment-free protein language model beating AlphaFold3 (the current MSA-based gold standard) on predicting antibody-antigen complex structures (50% vs. 47% DockQ pass rate on the FoldBench benchmark), while also building a public atlas of 6.8 billion protein sequences, dwarfing AlphaFold existing structure database by 800M+ entries. Evidence the alignment-free camp is starting to actually win, not just catch up, on some tasks.[^2026-08-13]
- Reseek — a new structure-alignment algorithm shown to substantially beat existing tools (DALI, TMalign, Foldseek) at finding remote homologs (distantly related proteins that do not look alike on the surface but share a common ancestor), while running about as fast as the current fastest tool (Foldseek) — a meaningful jump in a historically hard-to-improve tradeoff between sensitivity and speed.[^2026-08-13]
- Both of the above are recent (mid-2026) and specific benchmark numbers are reported-but-not-independently-cross-checked beyond the cited sources.

## Open Problems & Bottlenecks

- Exact dynamic-programming alignment does not scale to database-scale search, forcing a tradeoff between speed (BLAST-style heuristics) and guaranteed optimality.
- True multiple sequence alignment is NP-hard, so all practical MSA tools are approximations with no guarantee of the truly best alignment.
- The field is in active tension between traditional alignment-based methods (which rely on evolutionary co-variation signal) and newer alignment-free approaches (which trade some accuracy for speed and simplicity) — it is not yet settled which will dominate for which tasks.

## Personal Takeaways

- Sequence alignment sits at the intersection of classic CS algorithms (edit distance, dynamic programming, graph search) and biology, which makes it an approachable entry point for someone with a CS/math background.
- Worth watching whether alignment-free models (ESM Cambrian, Evo 2) keep closing the accuracy gap with MSA-based methods like AlphaFold — if they do, it could meaningfully shift how much of the pipeline needs alignment at all.

[^2026-08-13]: Added — recent alignment-free vs. alignment-based benchmark results (ESM Cambrian, Reseek) via user Q&A incorporation.

Sources:
- ESM Cambrian: protein language model outperformed AlphaFold3 — https://neurohive.io/en/state-of-the-art/esm-cambrian-protein-language-model-outperformed-google-s-alphafold3-and-built-the-largest-atlas-of-the-protein-world/
- Move over, AlphaFold: open-source model predicts shape of 1 billion proteins (Nature) — https://www.nature.com/articles/d41586-026-01686-3
- Biohub Releases Protein Biology World Model to Address Disease — https://www.genengnews.com/topics/artificial-intelligence/biohub-releases-protein-biology-world-model-to-address-disease/
- Protein structure alignment by Reseek improves sensitivity to remote homologs (PMC) — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11601161/
