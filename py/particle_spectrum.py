"""
py/particle_spectrum.py
-----------------------
Empirical particle-mass staircase model:
    m = M_P * q^n

Important:
- This is a phenomenological fit tool, not a first-principles derivation.
- q=0.22221 is treated as a reference value and compared to a best-fit q.
"""

import math

# Constants
MP = 2.176434e-8  # Planck mass [kg]
Q_REF = 0.22221   # Reference geometric ratio from prior project notes
STEP = 0.5        # Half-step quantization for n

PARTICLES = {
    "Top Quark": 3.078e-25,
    "Bottom Quark": 7.48e-27,
    "Proton": 1.6726e-27,
    "Electron": 9.109e-31,
    "Neutrino (Upper Bound)": 2.0e-37,
}


def calculate_n(mass_kg: float, q: float) -> float:
    return math.log(mass_kg / MP) / math.log(q)


def quantize_n(n_value: float, step: float = STEP) -> float:
    return round(n_value / step) * step


def predict_mass(n_value: float, q: float) -> float:
    return MP * (q ** n_value)


def percent_error(obs: float, pred: float) -> float:
    return abs(obs - pred) / max(obs, 1e-300) * 100.0


def fit_q_grid(q_min: float = 0.15, q_max: float = 0.35, points: int = 8000) -> float:
    """Grid-search q minimizing RMS log-error for quantized n values."""
    best_q = Q_REF
    best_loss = float("inf")

    for i in range(points):
        q = q_min + (q_max - q_min) * i / (points - 1)
        if q <= 0.0 or abs(q - 1.0) < 1e-12:
            continue

        sq = 0.0
        k = 0
        for m_obs in PARTICLES.values():
            n_raw = calculate_n(m_obs, q)
            n_q = quantize_n(n_raw, STEP)
            m_pred = predict_mass(n_q, q)
            # Log-space residual is more stable across many decades.
            r = math.log(m_pred / m_obs)
            sq += r * r
            k += 1

        loss = math.sqrt(sq / max(k, 1))
        if loss < best_loss:
            best_loss = loss
            best_q = q

    return best_q


def print_table(title: str, q: float) -> float:
    print(f"\n{title} (q = {q:.6f})")
    print(f"{'Particle':<25} | {'Observed (kg)':<15} | {'Predicted (kg)':<15} | {'n(raw)':<8} | {'n(q)':<8} | {'Error %':<9}")
    print("-" * 102)

    errs = []
    for name, m_obs in PARTICLES.items():
        n_raw = calculate_n(m_obs, q)
        n_q = quantize_n(n_raw, STEP)
        m_pred = predict_mass(n_q, q)
        err = percent_error(m_obs, m_pred)
        errs.append(err)
        print(f"{name:<25} | {m_obs:.3e} | {m_pred:.3e} | {n_raw:7.2f} | {n_q:7.2f} | {err:7.2f}%")

    mean_err = sum(errs) / len(errs)
    print(f"Mean absolute percent error: {mean_err:.3f}%")
    return mean_err


if __name__ == "__main__":
    print("Particle Spectrum Staircase (Empirical Fit Tool)")
    print("Model: m = M_P * q^n, with half-step quantization in n.")
    print("Note: This is a phenomenological calibration, not a first-principles proof.")

    q_fit = fit_q_grid()

    err_ref = print_table("Reference ratio", Q_REF)
    err_fit = print_table("Best-fit ratio", q_fit)

    print("\nSummary")
    print(f"- q_ref = {Q_REF:.6f}, mean error = {err_ref:.3f}%")
    print(f"- q_fit = {q_fit:.6f}, mean error = {err_fit:.3f}%")
