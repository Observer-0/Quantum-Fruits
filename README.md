# Quantum Fruits — The σₚ Scaffold

> **Disclaimer:** This repository is primarily a programming exercise.
> It serves as a sandbox for learning HTML, JS, Python, CSS, and C++
> through the lens of personal theoretical research.
> The models presented make no claim to scientific correctness or completeness.
> They are visualizations of the author's own frameworks, based on dimensional analysis
> and primary source study (Boltzmann, Einstein, Planck, Minkowski, Schwarzschild et al.).

---

## What is this?

Physics lost itself in 26 dimensions and 10⁵⁰⁰ vacua.
Minkowski, Schwarzschild, Lorentz, Planck, and Einstein built the foundations with chalk.
109 years later we have Fugaku, JWST, and AI — and we still haven't finished counting
the four fundamental vectors of spacetime.

This project explores a simple question:
**What if spacetime itself has a smallest unit — and that unit solves the cosmological constant problem?**

All simulations run directly in the browser. No installation required.

---

## Core Idea: The Planck Spacetime Cell

Space and time are not separate stages. They are the shared currency of causality.
The σₚ framework defines a fundamental two-measure of spacetime:

$$
\sigma_P = \ell_P \cdot t_P = \frac{\hbar G}{c^4}, \qquad \frac{\ell_P}{t_P} = c
$$

This is not a new constant — it is a structural consequence of combining the constants
we already have. Its dimension is $[L \cdot T]$: a quantum of spacetime action.

---

## Axiom of Finite Divisibility of Spacetime

**Postulate:** No physical system can be divided without bound.
Space and time possess a fundamental, finite resolution — the spacetime quantum $\sigma_P$.

This geometric action unit defines the smallest interval in which cause and effect remain distinct.
Below this limit, the continuum assumption collapses, and with it the classical notion of separability.

**Consequences:**

1. Every physical process occurs in discrete spacetime volumes.
   Resolving beyond $\sigma_P$ requires infinite energy.
2. Singularities, infinite densities, and point-like particles are mathematical artifacts.
   Nature enforces a cutoff.
3. Spacetime is atomic: $\sigma_P$ sets the minimum geometric extent.

---

## The Λ-Problem — and a Parameter-Free Solution

The cosmological constant problem is often called the worst prediction in physics:
quantum field theory predicts a vacuum energy density ~10¹²³ times larger than observed.

Within the σₚ framework, the cosmological constant emerges naturally:

$$
\alpha_\sigma = \frac{\sigma_P}{R \cdot t}, \qquad \alpha_\sigma \approx 4.60 \times 10^{-123}
$$

$$
\Lambda_{\text{eff}} = \frac{\alpha_\sigma}{\ell_P^2} \approx 10^{-52} \, \text{m}^{-2}
$$

No free parameters. No fine-tuning. The observed value of Λ follows directly
from the ratio of the Planck spacetime cell to the observable universe.

The "vacuum catastrophe" dissolves:

$$
\Lambda_{\text{cell}} = \frac{3}{\ell_P^2}, \qquad
\Lambda_{\text{macro}} = \frac{\Lambda_{\text{cell}}}{N_\sigma}, \qquad
N_\sigma = \frac{R \cdot t}{\sigma_P}
$$

---

## Key Equations

**Scaling function (Zander scaling):**
$$Z(r) = \frac{\hbar^2}{c \cdot r}$$
A dimensional bridge between quantum action and gravitational geometry.

**Modified field equation (classical expectation value):**
$$G_{\mu\nu} + \Lambda_{\text{eff}} \, g_{\mu\nu} = \frac{8\pi G}{c^4} \, \bar{T}_{\mu\nu}$$

**Full quantum form:**
$$\langle \hat{G}[\sigma_P] + \Lambda_{\text{eff}} \, g \rangle_{\sigma_P}
= \frac{8\pi G}{c^4} \langle \hat{T} \rangle_{\sigma_P}$$

where the Planck-covariant averaging operator $A_{\sigma_P}$ integrates
over a kernel $K_{\sigma_P}(x,y)$ of width $\sigma_P$, replacing the classical point evaluation.

---

## Simulations

All modules run in-browser (HTML/JS). No installation required.

| Module | Description |
|--------|-------------|
| `html/tsf_sim.html` | Thermal Spacetime Feedback cycle visualization |
| `html/theory.html` | Theory overview with cosmological equations |
| `js/main.js` | Core σₚ simulation engine |
| `py/quantum_fruits_sim.py` | Python simulation suite (N_σ calculations) |

---

## License

**Copyright © 2026 Adrian Zander**
Licensed under the MIT License.

## The Missing Structure of Spacetime

Minkowski gave spacetime its mathematical definition — the geometric foundation
of General Relativity. Planck defined the natural scales: mass, length, time,
temperature. From these, countless derived Planck units were constructed,
each tailored to the needs of the next theoretical framework.

But spacetime itself — the thing every framework is built on — was never given
a natural quantum structure from those same scales.

QFT places fields on a continuous spacetime manifold and inherits its divergences
from that continuum. String theory propagates on a pre-existing background.
LQG quantizes geometry — but does not arrive at a parameter-free unit of spacetime
from first principles. Everyone speaks of spacetime. Everyone works with it.

If Minkowski's mathematical description is insufficient —
why do you keep using it in your theories?

The σₚ framework closes this gap:

$$\sigma_P = \ell_P \cdot t_P = \frac{\hbar G}{c^4}$$

Not a new postulate. Not a new constant.
The natural unit of spacetime — assembled from the scales Planck already defined,
structured by the geometry Minkowski already described.
The question was never answered because nobody thought to multiply
the two scales that were always there.

Einstein's field equations already contain the geometric coupling constant:

$$\kappa = \frac{8\pi G}{c^4}$$

This factor couples spacetime geometry(!) to the energy-momentum tensor T_μν.
Its correctness is not in question — it works.

But notice: $G/c^4$ is already present in σₚ:

$$\sigma_P = \frac{\hbar G}{c^4}$$

The geometric bridge between curvature and matter was always there.
What was missing was the quantum — h/2pi.
Einstein coupled geometry to energy. Planck quantized action.
σₚ extends this:
it couples geometry to quantum action.

The resemblance is not coincidental.
