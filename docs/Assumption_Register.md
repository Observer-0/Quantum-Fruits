# Assumption Register (Sigma_P Framework)

This register separates foundational identities from exploratory closures.
Use these labels consistently in docs, code comments, and papers.

## Labels

- `Axiom`: Baseline definition used as a starting postulate.
- `Heuristic`: Exploratory closure/ansatz, not yet first-principles derived.
- `Derived`: Algebraic or dimensional consequence of axioms.
- `Prediction`: Falsifiable output linked to a measurable dataset.

## Entries

| ID | Label | Statement | Current Use | Primary References |
|----|-------|-----------|-------------|--------------------|
| `AS-001` | `Axiom` | `sigma_P = l_P t_P = hbar G / c^4` | Core spacetime two-measure definition | `docs/dimensional_table.md`, `py/sigma_p_consistency.py` |
| `AS-002` | `Derived` | `l_P^2 = sigma_P c`, `t_P^2 = sigma_P/c` | Projection identities for scale conversions | `docs/dimensional_table.md`, `py/sigma_p_consistency.py` |
| `AS-003` | `Derived` | `N_sigma=(R t)/sigma_P`, `alpha_sigma=sigma_P/(R t)`, `Lambda=alpha_sigma/l_P^2=1/(cRt)` | Cosmological consistency checks | `py/sigma_p_consistency.py` |
| `AS-004` | `Heuristic` | `heating(a)=0.05*exp(-a)` in thermal ODE | Exploratory re-heating closure in two-phase cosmology | `py/Unified_Hubble_Tension.py`, `docs/Hubble_Tension_Explanation.md` |
| `AS-005` | `Heuristic` | `S_eff=a^3/l_P^3` as entropy proxy in toy model layer | Practical state variable for simulation/plots | `py/Unified_Hubble_Tension.py`, `docs/Hubble_Tension_Explanation.md` |
| `AS-006` | `Heuristic` | Fixed remnant closure (`Mrem~=M_P`, fixed `alpha`, prescribed Page-profile) | Current sigma_P BH evaporation prototypes | `py/sigmaP_bh_sim.py`, `py/Info_Paradox2.py`, `py/physics_engine.py` |
| `AS-007` | `Prediction` | Phase-sampled Hubble split near `67/73 km/s/Mpc` | Compare against CMB vs late-distance ladders | `docs/Hubble_Tension_README.md`, `py/Unified_Hubble_Tension.py` |
| `AS-008` | `Prediction` | Lambda-scale consistency `Lambda~1/(cRt)` around `~10^-53 1/m^2` at present window | Numeric self-check for internal coherence | `py/sigma_p_consistency.py` |
| `AS-009` | `Heuristic` | Motor return profile `s_unitary=(1-exp(-7x))*exp(-4x)*2.8` and companion `s_naive` channel | Exploratory closure in web lab and toy simulation | `js/kinematic-motor.js`, `py/kinematic_motor_sim.py` |
| `AS-010` | `Prediction` | For increasing burden, unitary channel exhibits rise-then-fall while naive channel remains monotonic | Qualitative trend test in motor dashboard/profile plots | `html/motor.html`, `js/kinematic-motor.js`, `py/kinematic_motor_sim.py` |
| `AS-011` | `Derived` | `Lambda_cell = 3/l_P^2`, `Lambda_eff(W)=Lambda_cell/N_sigma(W)=3/(cRt)` | Vacuum-catastrophe window mapping (cell scale vs cosmological window) | `docs/Vacuum_Catastrophe_SigmaP.md`, `assets/papers/die natürliche Struktur der Raumzeit.tex` |

## Update Rule

When a heuristic gets a first-principles derivation, move it to `Derived` and
link the exact equation path (paper section + implementation reference).
