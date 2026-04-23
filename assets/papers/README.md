# Papers Catalog

Curated inventory for `assets/papers` after duplicate cleanup.
See also `assets/papers/FORMULA_INDEX.md` for a cross-paper symbol/formula jump list.
See also `assets/papers/PAPER_STATUS.md` for document type and claim-level labeling.

## What This Catalog Tracks

- File size and line count (rough scope)
- Formula density (`equation`, `align`, display math `\[`)
- Macro count (`\newcommand`)
- First `\title` line (quick identification)
- Basic mojibake signal count (UTF-8 mojibake markers) for encoding triage

## Canonical / Formula-Heavy Priority

Use these first when checking recurring definitions and notation consistency:

- `die natürliche Struktur der Raumzeit.tex`: formulas=212 (eq=20, align=2, display=190), mojibake=10
- `The Paradox Paper.tex`: formulas=116 (eq=1, align=6, display=109), mojibake=22
- `QFT,GR und SRT.tex`: formulas=99 (eq=1, align=1, display=97), mojibake=6
- `The Problem of Time.tex`: formulas=97 (eq=24, align=0, display=73), mojibake=0
- `A Requiem for LCDM.tex`: formulas=73 (eq=6, align=6, display=61), mojibake=20
- `The Memory of Spacetime.tex`: formulas=50 (eq=0, align=0, display=50), mojibake=10
- `The Dimensional Structure of Reality.tex`: formulas=41 (eq=0, align=0, display=41), mojibake=0
- `Zander_2025_Dimensional_Foundations.tex`: formulas=39 (eq=0, align=0, display=39), mojibake=0
- `Zander_2025_Price_of_Love.tex`: formulas=35 (eq=0, align=1, display=34), mojibake=52
- `Quantum Gravity aus erster Geometrie.tex`: formulas=34 (eq=0, align=0, display=34), mojibake=2
- `Rediscovering Geometry without SuperMUC.tex`: formulas=32 (eq=3, align=0, display=29), mojibake=0
- `Formelsammlung.tex`: formulas=18 (eq=17, align=0, display=1), mojibake=0

## Files

| File | Lines | Size (bytes) | Formulas | Macros | Mojibake | Title |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `die natürliche Struktur der Raumzeit.tex` | 3510 | 154666 | 212 | 13 | 10 | \title{\textbf{Eine parameterfreie Vereinigung von\\ |
| `The Paradox Paper.tex` | 2723 | 91871 | 116 | 10 | 22 | \title{\begin{center} |
| `QFT,GR und SRT.tex` | 1482 | 72211 | 99 | 10 | 6 | \title{\textbf{Das Quantenfeld der Raumzeit,\\die allgemeine und spezielle Relativität\\(QFT,GR und SRT)}} |
| `The Problem of Time.tex` | 1987 | 72316 | 97 | 14 | 0 | \title{\textbf{The Problem of Time}\\ |
| `A Requiem for LCDM.tex` | 1367 | 57649 | 73 | 10 | 20 | \title{ |
| `The Memory of Spacetime.tex` | 1711 | 69106 | 50 | 14 | 10 | \title{ |
| `The Dimensional Structure of Reality.tex` | 433 | 15631 | 41 | 0 | 0 | \title{\textbf{Quantum Gravity}\\[0.8em] |
| `Zander_2025_Dimensional_Foundations.tex` | 398 | 14676 | 39 | 0 | 0 | \title{Dimensional Foundations of Relativistic Gravity} |
| `Zander_2025_Price_of_Love.tex` | 422 | 21097 | 35 | 0 | 52 | \title{\textbf{The Statistical Price of True Love:\\ |
| `Quantum Gravity aus erster Geometrie.tex` | 552 | 18066 | 34 | 0 | 2 | \title{Quantum Gravity aus erster Geometrie\\ |
| `Rediscovering Geometry without SuperMUC.tex` | 358 | 14216 | 32 | 0 | 0 | \title{\textbf{Rediscovering Geometry without SuperMUC}\\ |
| `Formelsammlung.tex` | 130 | 4153 | 18 | 0 | 0 | \title{Formelsammlung — Quantum Fruits} |
| `Formula_Collection_URM.tex` | 179 | 6483 | 13 | 0 | 2 | \title{SigmaP-Lab: Formelsammlung \& Struktur} |
| `QSTF_Hierarchical_Mergers.tex` | 275 | 14088 | 14 | 0 | 0 | \title{\textbf{QSTF and Hierarchical Black-Hole Mergers:\\ |
| `Universal_Resonance_Model.tex` | 247 | 11362 | 14 | 0 | 0 | \title{Universale Principles - Core Formulas} |
| `Zander_2025_Time_Entropy.tex` | 145 | 10927 | 13 | 0 | 0 | \title{Zeit und Entropie als emergente Phänomene der diskreten Raumzeit} |
| `Zander_2025_Natural_Structure.tex` | 315 | 14516 | 11 | 9 | 0 | \title{\textbf{The Natural Structure of Spacetime:\\ |
| `Anthony_Thesis.tex` | 346 | 12971 | 7 | 0 | 30 | (no title line found) |
| `MOND_from_Smeared_GR.tex` | 214 | 10286 | 7 | 10 | 0 | \title{\textbf{MOND-like Law from Source-Smeared GR \\(Einstein Unchanged)}\\ |
| `Spin_Dynamics.tex` | 46 | 2817 | 2 | 0 | 0 | \title{Action vs. Gravity: The Spin-Mass Feedback Loop} |

## Exact Duplicate Check (current state)

- No exact duplicate `.tex` files detected.

## Recent Cleanup (manual actions in this pass)

- Removed exact duplicate: `QSTF and Hierarchical Black-Hole Mergers.tex` (kept `QSTF_Hierarchical_Mergers.tex`, referenced by `html/theory.html`).
- Removed near-duplicate: Unicode-titled `Formelsammlung` copy after merging its only material difference (fixed `\chi(M)` typo) into `Formelsammlung.tex` (referenced by `html/papers.html`).

## Follow-Up Suggestions

- Run a dedicated encoding-normalization pass on files with non-zero mojibake counts.
- Decide canonical symbol names across papers (`alpha_G` vs proxy names, `sigma_P` variants, etc.).
- Split strict formula appendices from narrative papers where review speed matters.
