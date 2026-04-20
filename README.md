# Quantum Fruits — The σₚ Scaffold

> **Disclaimer:** This repository is primarily a programming exercise.
> It serves as a sandbox for learning HTML, JS, Python, CSS, and C++
> through the lens of personal theoretical research.
> The models presented make no claim to scientific correctness or completeness.
> They are visualizations of the author's own frameworks, based on dimensional
> analysis and primary source study (Boltzmann, Einstein, Planck, Minkowski,
> Schwarzschild et al.).

---

## What is a Quantum?

> *quantum (noun): the smallest discrete unit of any physical quantity;*
> *that which cannot be further divided without losing its defining property.*

Consider a family.
A family can be divided — into people.
But a person cannot be divided further without losing what makes them a person.
A person is a quantum of a family.

The same logic applies to the fundamental dimensions of nature.

Space can be divided — until it cannot be divided further without ceasing to be space (L).
Time can be divided — until it cannot be divided further without ceasing to be time (T).
Mass can be divided — until it cannot be divided further without ceasing to be mass (M).

This is what Planck did.
He calculated the natural structure of each dimension —
the smallest unit that still carries its defining property:

$$\ell_P = \sqrt{\frac{\hbar G}{c^3}}, \quad
t_P = \sqrt{\frac{\hbar G}{c^5}}, \quad
m_P = \sqrt{\frac{\hbar c}{G}}, \quad
T_P = \sqrt{\frac{\hbar c^5}{G k_B^2}}$$

Four quanta. Four dimensions. Each irreducible.

But Minkowski showed that space and time are not separate stages —
they are one: **spacetime**.

So where is the quantum of spacetime?

$$\sigma_P = \ell_P \cdot t_P
= \sqrt{\frac{\hbar G}{c^3}} \cdot \sqrt{\frac{\hbar G}{c^5}}
= \frac{\hbar G}{c^4} \quad \text{— a quantum of spacetime?}$$

Planck gave us the natural structure.
Minkowski showed they belong together.
Nobody thought to multiply them.

---

## The Missing Structure of Spacetime

Minkowski gave spacetime its mathematical definition — the geometric foundation
of General Relativity. Planck defined the natural scales: mass, length, time,
temperature. From these, countless derived Planck units were constructed,
each tailored to the needs of the next theoretical framework.

But spacetime itself — the thing every framework is built on — was never given
a natural quantum structure from those same scales.

QFT places fields on a continuous spacetime manifold and inherits its divergences
from that continuum. String theory propagates on a pre-existing background.
LQG quantizes geometry — but does not arrive at a parameter-free unit of
spacetime from first principles.

Everyone speaks of spacetime. Everyone works with it.
If Minkowski's mathematical description is insufficient —
why do you keep using it in your theories?

The σₚ framework closes this gap:

$$\sigma_P = \ell_P \cdot t_P = \frac{\hbar G}{c^4}$$

Not a new postulate. Not a new constant.
The natural unit of spacetime — assembled from the scales Planck already defined,
structured by the geometry Minkowski already described.
The question was never answered because nobody thought to quantify
the two natural scales that were always there.

---

## The Einstein Connection

Einstein's field equations already contain the geometric coupling constant:

$$\kappa = \frac{8\pi G}{c^4}$$

This factor couples spacetime geometry to the energy-momentum tensor $T_{\mu\nu}$.
Its correctness is not in question — it works.

But notice: $G/c^4$ is already present in σₚ:

$$\sigma_P = \underbrace{\ell_P \cdot t_P}_{\text{Space} \cdot \text{Time}}
= \sqrt{\frac{\hbar G}{c^3}} \cdot \sqrt{\frac{\hbar G}{c^5}}
= \sqrt{\frac{\hbar^2 G^2}{c^8}}
= \frac{\hbar G}{c^4}$$

*A quantum of spacetime? Maybe.*

The geometric bridge between curvature and matter was always there.
What was missing was the quantum — ħ.
Einstein coupled geometry to energy. σₚ extends this:
it couples geometry to quantum action.

The resemblance is not coincidental.

---

## Axiom of Finite Divisibility of Spacetime

**Postulate (A. Zander):** No physical system can be divided without bound.
Space and time possess a fundamental, finite resolution — the spacetime quantum
$\sigma_P = \ell_P \cdot t_P = \hbar G / c^4$.

This unit defines the smallest interval in which cause and effect remain distinct.
Below this limit, the continuum assumption collapses, and with it the classical
notion of separability.

**Consequences:**

1. Every physical process occurs in discrete spacetime volumes.
   Resolving beyond $\sigma_P$ requires infinite energy.
2. Singularities, infinite densities, and point-like particles are mathematical
   artifacts. Nature enforces a cutoff.
3. Spacetime is atomic: $\sigma_P$ sets the minimum geometric extent.

---

## The Λ-Problem — A Parameter-Free Solution

The cosmological constant problem is often called the worst prediction in physics:
quantum field theory predicts a vacuum energy ~10¹²³ times larger than observed.

Within the σₚ framework, Λ emerges naturally from the ratio of the Planck
spacetime cell to the observable universe:

$$\alpha_\sigma = \frac{\sigma_P}{R \cdot t}, \qquad \alpha_\sigma \approx 4.60 \times 10^{-123}$$

$$\Lambda_{\text{eff}} = \frac{\alpha_\sigma}{\ell_P^2} \approx 10^{-52} \, \text{m}^{-2}$$

No free parameters. No fine-tuning. The vacuum catastrophe dissolves:

$$\Lambda_{\text{cell}} = \frac{3}{\ell_P^2}, \qquad
\Lambda_{\text{macro}} = \frac{\Lambda_{\text{cell}}}{N_\sigma}, \qquad
N_\sigma = \frac{R \cdot t}{\sigma_P}$$

The local quantum prediction is correct. The cosmological observation is correct.
The error was the missing scale factor $N_\sigma$.

---

## Key Equations

**Planck spacetime cell:**
$$\sigma_P = \ell_P \cdot t_P = \frac{\hbar G}{c^4}, \qquad [\sigma_P] = L \cdot T$$

**Zander scaling:**
$$Z(r) = \frac{\hbar^2}{c \cdot r}$$
A dimensional bridge between quantum action and gravitational geometry.

**Modified field equation (classical):**
$$G_{\mu\nu} + \Lambda_{\text{eff}} \, g_{\mu\nu} = \frac{8\pi G}{c^4} \, \bar{T}_{\mu\nu}$$

**Full quantum form:**
$$\left\langle \hat{G}[\sigma_P] + \Lambda_{\text{eff}} \, g \right\rangle_{\sigma_P}
= \frac{8\pi G}{c^4} \left\langle \hat{T} \right\rangle_{\sigma_P}$$

where the Planck-covariant averaging operator integrates over a kernel of
width $\sigma_P$, replacing the classical point evaluation and eliminating
UV divergences at the Planck scale.

---

## Simulations

All modules run in-browser. No installation required.

| Module | Description |
|--------|-------------|
| `html/tsf_sim.html` | Thermal Spacetime Feedback cycle |
| `html/theory.html` | Theory overview with cosmological equations |
| `js/main.js` | Core σₚ simulation engine |
| `py/quantum_fruits_sim.py` | Python suite (N_σ calculations) |

---

## License

**Copyright © 2026 Adrian Zander**  
Licensed under the MIT License.