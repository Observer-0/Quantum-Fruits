# Formulas and Code Catalog

Curated inventory for `assets/Formulas and code`.

## Active Files

- `formulas2.tex`
  - Canonical LaTeX formula/narrative document in this folder.
  - Cleaned to avoid the `alpha_G` naming conflict by using `\beta_G(M)=GM/(\hbar c)` for the linear (dimensionful) proxy.
  - Still contains some encoding artifacts in prose (mojibake) that can be normalized in a follow-up pass.

- `bh_kernel_c0_scaffold.py`
  - Usable Python scaffold for Kerr horizon and `c0` helper calculations.
  - Intended as a numerical/template utility, not a full solver.

- `quantum_fruits_lab.py`
  - Interactive simulation demo (Matplotlib + SciPy).
  - Python escape-sequence warnings for LaTeX labels were fixed.

- `symbolic_metric_scratch.py`
  - SymPy scratchpad (renamed from a `.txt` file).
  - Cleaned duplicate symbol declarations and made the purpose explicit.

- `boot_universe_pseudocode.md`
  - Conceptual pseudocode note derived from the removed non-compilable `boot_universe.cpp`.

## Removed Files (Cleanup)

- `formulas1`
  - Raw, extensionless formula dump with malformed LaTeX fragments and duplicated/conflicting entries.

- `formulas1.tex`
  - Duplicate/conflicted formula collection (including inconsistent symbol definitions and transcription errors).
  - `formulas2.tex` is kept as the canonical LaTeX source in this folder.

- `boot_universe.cpp`
  - Conceptual prose disguised as compilable C++ (missing headers/types and placeholder APIs).
  - Replaced by `boot_universe_pseudocode.md`.

## Validation Notes

- `python -m py_compile assets/Formulas and code/bh_kernel_c0_scaffold.py`
  - Pass

- `python -m py_compile assets/Formulas and code/quantum_fruits_lab.py`
  - Pass (warnings fixed in this cleanup)

## Remaining Manual Review (Physics/Notation)

- Verify which symbols should be reserved for dimensionless couplings vs. dimensionful proxies across all papers in `assets/papers`.
- Normalize text encoding in legacy LaTeX prose/comments (German umlauts and punctuation mojibake).
- If needed, split `formulas2.tex` into:
  - a strict formula registry (definitions only)
  - a narrative/interpretation document
