# Quantum Fruits: The Σₚ Scaffold

## Project Vision (Beta)

Quantum Fruits is designed to grow into a fully HTML-based web simulation platform for quantum gravity and cosmology.
Core modules (TSF cycles, lattice universes, galaxy dynamics) are intended to run directly in the browser.

- Updates are frequent (except weekends) to keep theory, visualizations, and code aligned.
- Translation help, proofreading, and content feedback (DE/EN) are welcome via Pull Requests or Issues.

> "Entropy is the natural order of the Universe."
> Every event is binary: it happens, or it does not.
> The information lies not in what occurred,
> but in all the paths that were never taken.
> Reality defines itself through negation.
> S = 1.
>
> And yes, the 1/2 R in
>
> \( G_{\mu\nu} = R_{\mu\nu} - \tfrac{1}{2} R g_{\mu\nu} \)
>
> is just the trace.
> They did this with chalk — Minkowski, Schwarzschild, Lorentz, Planck, Einstein, etc.
> 109 years later we have Fugaku, JWST, Hubble and AI. What’s our excuse?
> 26 dimensions and 10^500 vacua?
>
> The answer was always hidden in plain sight, encoded in the units: σ_P = [L · T] = Space*Time.
> Space and time are not separate stages; they are the shared currency of causality.
> Whether I look East or West, North or South, up or down — space and time flow indistinguishably in the same direction:
> that of the observer.
> While physics lost itself in twenty‑six dimensions, the simplest truth remained uncounted:
> we never finished counting the four fundamental vectors of spacetime.
> We searched for the Theory of Everything in infinity, only to find it was just one line long.
>
> — Adrian Zander, Quantum Fruits

Σ_P Framework Overview
A minimal, parameter‑light scaffold for quantum‑gravity and cosmology experiments.

## The Planck Spacetime Cell (σₚ → Universe)

The project uses the concept of a fundamental spacetime action cell σ_P as a minimal grain of the universe’s causal weave.
It is defined as:

$$
\sigma_P = \ell_P \cdot t_P = \frac{\hbar G}{c^4}, \quad \text{with } \frac{\ell_P}{t_P} = c.
$$

Operational consequences in this codebase:

$$
N_{\sigma} = \frac{R \cdot t}{\sigma_P}
$$

where R and t are the cosmological radius and age (or scaled fractions thereof).

Holographic relationship (model note):
If one defines
$$\alpha_\sigma = \frac{\sigma_P}{R\,t},\qquad \Lambda = \frac{\alpha_\sigma}{\ell_P^2},$$
then algebraically
$$\sigma_P = \Lambda\,\ell_P^2\,R\,t.$$
Dimensional check: $[\Lambda]=L^{-2}$, $[\ell_P^2]=L^2$, $[R\,t]=L\cdot T \Rightarrow [\sigma_P]=L\cdot T$, consistent with $\sigma_P=\ell_P t_P$.

- Simulations in `js/main.js` and `py/quantum_fruits_sim.py` respect this cell by clamping the simulation step count when the
  available $N_{\sigma}$ ticks would otherwise be smaller than the requested resolution. This avoids sub‑cell numerical resolution
  and makes the Planck cell an effective lower bound for temporal/spatial sampling.

See `js/main.js` and `py/quantum_fruits_sim.py` for implementation details and example calculations (N_σ is reported in chart subtitles).

## Core Philosophical & Physical Pillars (Model Framing)

### 1. The Planck Spacetime Cell (σₚ → Universe)
The invariant two‑measure of spacetime:
$$\sigma_P = \ell_P \cdot t_P = \frac{\hbar G}{c^4}, \quad \text{with } \frac{\ell_P}{t_P} = c$$

Within this model, $c$ is treated as a structural consequence of the granularity.

### 2. The Canonical Energy Chain
$$E = mc^2 = hf,\qquad E_P = \sqrt{\frac{\hbar c^5}{G}} = \frac{\hbar}{t_P}.$$
Per‑grain convention:
$$E = n\,E_P = n\,\frac{\hbar}{t_P}.$$
This keeps dimensional bookkeeping explicit and avoids mixing σ_P (L·T) directly with energy units.

### 3. The Zander Scaling Function (Z(r))
$$Z(r) = \frac{\hbar^2}{c \cdot r}$$
A bridge between quantum action and geometry (model‑level interpretation).

### 4. Spacetime Action (W)
$$W = m_P T_P k_B = \frac{\hbar c^3}{G}$$
A structural thermal–inertial action density. Combined with σ_P: $W \cdot \sigma_P = \hbar^2/c$.

### 5. Zander‑Entropy & Arrow of Time (S_Z)
$$S_Z = k_B \ln \left( \frac{mc^2}{hf} \right)$$
In this model, the arrow of time is treated as a directed braking process. Entropy growth is the transition from pure quantum
oscillation (hf) into gravitational mass‑burden (mc^2). Time and entropy are treated as co‑emergent within the framework.

## Key Model Results (To Be Tested)

- Cosmology bridge: $\Lambda \sim \alpha_\sigma/\ell_P^2$ with $\alpha_\sigma = \sigma_P/(R\cdot t)$.
- Dark‑matter alternatives: rotation‑curve fits via sigma_P coupling in the provided galaxy lab.
- No singularities (model regularization) via Planck‑covariant averaging: $G_{\mu\nu} = \frac{8\pi G}{c^4} \langle T_{\mu\nu}\rangle_{\sigma_P}$.
- Hawking resolution (model): unitary evaporation with a Planck‑scale remnant.

## Current Evolution (2026 Update)

The project has evolved beyond static theory into dynamic simulation and a unified UI/UX.

### Roadmap
See `README_EVOLUTION.md` for the current module plan and milestones.

### New Modules
1. `html/tsf_sim.html` — Thermal Spacetime Feedback cycle visualization.
2. `html/theory.html` — expanded theory page with JWST and cosmic‑equation discussion.
3. `assets/Formulas and code/quantum_fruits_lab.py` — unified Python simulation suite.

## Future Roadmap (Next Steps)

1. Bilingual translation (EN/DE) for `theory.html` and `index.html`.
2. URME dashboard for the lattice simulation (export + presets).
3. Mobile optimization across TSF/Lattice/Galaxy labs.
4. Scientific peer‑review integration (ArXiv/Zenodo links).
5. Observer‑POV module (VR‑ready visualization of the “One‑Quantum Hypothesis”).

## Scientific Library
The ZIP archive includes full papers (with separate DOIs):
- Dark Matter Elimination
- The Schrödinger–Zander Equation
- Λ‑Problem & Vacuum Catastrophe Resolution
- Requiem for ΛCDM
- The Statistical Price of True Love

---

**Code of Conduct:** `CODE_OF_CONDUCT.md`

**Copyright © 2026 Adrian Zander**
Licensed under the **MIT License**. Feel free to use, modify, and resonate with this theory.
