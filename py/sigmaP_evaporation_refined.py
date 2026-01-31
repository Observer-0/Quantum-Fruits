"""
py/sigmaP_evaporation_refined.py
---------------------------------
Refined simulation of black hole evaporation under the Zander sigmaP framework.
Includes:
- Semiclassical (Hawking) evaporation
- sigmaP-quantized evaporation with Planck remnant
- Singularity diagnostics (Kretschmann scalar)
- Interactive visualization and unit testing
"""

import math
import numpy as np
import argparse

# ============================================================
# Fundamental constants (SI)
# ============================================================

hbar = 1.054_571_817e-34      # J·s
c    = 2.997_924_58e8         # m/s
G    = 6.674_30e-11           # m^3 kg^-1 s^-2
kB   = 1.380_649e-23          # J/K
pi   = math.pi

# ============================================================
# Zander framework: spacetime grain σ_P and derived scales
# ============================================================

# Fundamental spacetime two-measure (your σ_P)
sigmaP = hbar * G / c**4             # [m·s]

# Planck scales derived from σ_P and c
lP = math.sqrt(sigmaP * c)           # Planck length [m]
tP = math.sqrt(sigmaP / c)           # Planck time [s]

# Planck mass
MP = math.sqrt(hbar * c / G)         # [kg]

# Interaction quantum Z_int = ħ² / c
Z_int = hbar**2 / c                  # [J²·s / m]

# Solar mass
M_sun = 1.989e30                     # [kg]


# ============================================================
# Basic GR quantities
# ============================================================

def schwarzschild_radius(M: float) -> float:
    """
    Schwarzschild radius r_s = 2GM / c^2.

    Parameters:
    M (float): Mass of the black hole in kilograms.

    Returns:
    float: Schwarzschild radius in meters.
    """
    if M <= 0:
        raise ValueError("Mass must be positive.")
    return 2.0 * G * M / c**2


def kretschmann_scalar(M: float, r: float) -> float:
    """
    Kretschmann scalar K for Schwarzschild:
    K = 48 G^2 M^2 / (c^4 r^6)  [1/m^4].

    Parameters:
    M (float): Mass of the black hole in kilograms.
    r (float): Distance from the black hole in meters.

    Returns:
    float: Kretschmann scalar in 1/m^4.
    """
    if M <= 0:
        raise ValueError("Mass must be positive.")
    if r <= 0:
        raise ValueError("Distance must be positive.")
    return 48.0 * G**2 * M**2 / (c**4 * r**6)


def planck_curvature_radius(M: float) -> float:
    """
    Radius r_Pl where curvature becomes Planckian:
    K * l_P^4 ~ 1  =>  r^6 = 48 G^2 M^2 l_P^4 / c^4
    """
    if M <= 0:
        raise ValueError("Mass must be positive.")
    num = 48.0 * G**2 * M**2 * lP**4
    return (num / c**4) ** (1.0 / 6.0)


# ============================================================
# Hawking quantities (standard formulas with π from geometry)
# ============================================================

def hawking_temperature(M: float) -> float:
    """
    Hawking temperature: T_H = ħ c^3 / (8 π G M k_B).

    Parameters:
    M (float): Mass of the black hole in kilograms.

    Returns:
    float: Hawking temperature in Kelvin.
    """
    if M <= 0:
        raise ValueError("Mass must be positive.")
    return hbar * c**3 / (8.0 * pi * G * M * kB)


def bh_entropy(M: float) -> float:
    """
    Bekenstein–Hawking entropy:
    S = k_B c^3 A / (4 ħ G), A = 4π r_s^2.
    """
    if M <= 0:
        return 0.0
    rs = schwarzschild_radius(M)
    A  = 4.0 * pi * rs**2
    return kB * c**3 * A / (4.0 * hbar * G)


def lifetime_semiclassical(M0: float) -> float:
    """Total evaporation time (Hawking, continuum spacetime):
       τ = 5120 π G^2 M^3 / (ħ c^4)
    """
    if M0 <= 0:
        raise ValueError("Mass must be positive.")
    return 5120.0 * pi * G**2 * M0**3 / (hbar * c**4)


# ============================================================
# Evaporation models
# ============================================================

def evaporate_semiclassical(M0: float, nsteps: int = 1000):
    """
    Continuum spacetime Hawking evaporation:
    dM/dt = - ħ c^4 / (15360 π G^2 M^2).
    Uses analytic solution M(t) = M0 (1 - t/τ)^(1/3).
    """
    tau = lifetime_semiclassical(M0)
    t   = np.linspace(0.0, tau, nsteps)   # [s]

    # Analytic mass curve in this approximation
    M = M0 * np.maximum(1.0 - t / tau, 0.0) ** (1.0 / 3.0)

    # Avoid zero-mass calls
    M_safe = np.maximum(M, 1e-99)

    TH = np.array([hawking_temperature(m) for m in M_safe])
    S  = np.array([bh_entropy(m) for m in M_safe])

    # Simple "information-losing" radiation entropy proxy:
    S_rad = S[0] * t / tau

    return t, M, TH, S, S_rad, tau


def evaporate_sigmaP_quantized(
    M0: float,
    nsteps: int = 1000,
    Mrem: float = MP,
    alpha: float = 4.0
):
    """
    σ_P-regularized evaporation with Planck remnant.
    Near M ~ M_P, mass loss is smoothly suppressed by (M^2 + α M_P^2) in the denominator.
    """
    # Baseline semiclassical timescale
    tau0 = lifetime_semiclassical(M0)
    # We expand the time range slightly to capture the slow-down
    t = np.linspace(0.0, tau0 * 1.5, nsteps)
    dt = t[1] - t[0]

    M  = np.empty_like(t)
    TH = np.empty_like(t)
    S  = np.empty_like(t)

    T_max = Z_int / (sigmaP * kB)
    M_curr = M0

    for i, ti in enumerate(t):
        M[i] = M_curr
        m_safe = max(M_curr, 1e-99)
        S[i] = bh_entropy(m_safe)

        # Standard Hawking temperature, then grain-cap
        TH_curr = hawking_temperature(m_safe)
        TH[i]   = min(TH_curr, T_max)

        if M_curr > Mrem:
            denom = M_curr**2 + alpha * MP**2
            dMdt  = - hbar * c**4 / (15360.0 * pi * G**2 * denom)
            M_curr = max(M_curr + dMdt * dt, Mrem)
        else:
            M_curr = Mrem

    # Effective time until remnant is reached
    idx_rem = np.argmax(M <= (Mrem + 1e-40))
    if idx_rem == 0 and M[0] > Mrem:
        idx_rem = len(t) - 1
    tau_eff = t[idx_rem] if idx_rem > 0 else t[-1]

    # Page-like radiation entropy (unitary scenario)
    S0   = bh_entropy(M0)
    Srem = bh_entropy(Mrem)
    S_rad = np.zeros_like(t)

    t_page = 0.5 * tau_eff
    for i, ti in enumerate(t):
        if ti <= t_page:
            S_rad[i] = 0.5 * S0 * (ti / t_page)
        elif ti <= tau_eff:
            span = max(tau_eff - t_page, 1e-99)
            frac = (ti - t_page) / span
            S_rad[i] = (1.0 - frac) * (0.5 * S0 - Srem) + Srem
        else:
            S_rad[i] = Srem

    return t, M, TH, S, S_rad, tau_eff, Srem


def singularity_diagnostics(M: float):
    rs   = schwarzschild_radius(M)
    r_pl = planck_curvature_radius(M)
    ratio = r_pl / rs if rs > 0 else float("inf")
    return rs, r_pl, ratio


# ============================================================
# Unit Tests
# ============================================================

import unittest

class TestBlackHolePhysics(unittest.TestCase):
    def test_schwarzschild_radius(self):
        self.assertAlmostEqual(schwarzschild_radius(MP), 2.0 * G * MP / c**2, places=5)

    def test_hawking_temperature(self):
        self.assertAlmostEqual(hawking_temperature(MP), hbar * c**3 / (8.0 * pi * G * MP * kB), places=5)

    def test_kretschmann_scalar(self):
        dist = 1.0 # 1 meter
        self.assertAlmostEqual(kretschmann_scalar(MP, dist), 48.0 * G**2 * MP**2 / (c**4 * (dist)**6), places=5)


# ============================================================
# Main Execution
# ============================================================

SAMPLES = [
    ("PBH (1e12)", 1e12),
    ("PBH (1e15)", 1e15),
    ("Stellar (5 M_sun)", 5 * M_sun)
]

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="BH evaporation: semi-classical vs σ_P-quantized")
    parser.add_argument("--plot", action="store_true", help="Plot extended matplotlib results")
    parser.add_argument("--interactive", action="store_true", help="Plot interactive plotly results")
    parser.add_argument("--test", action="store_true", help="Run unit tests")
    args = parser.parse_args()

    if args.test:
        suite = unittest.TestLoader().loadTestsFromTestCase(TestBlackHolePhysics)
        unittest.TextTestRunner().run(suite)

    print("=== Zander σ_P framework ===")
    print(f"σ_P = {sigmaP:.3e} [m·s] | l_P = {lP:.3e} [m] | M_P = {MP:.3e} [kg]")
    print("-" * 50)

    if args.plot:
        import matplotlib.pyplot as plt
        fig, axes = plt.subplots(len(SAMPLES), 3, figsize=(18, 12), constrained_layout=True)
        fig.suptitle("Black Hole Evaporation Comparison", fontsize=16)

        for i, (name, M0) in enumerate(SAMPLES):
            t_sc, M_sc, TH_sc, S_sc, Srad_sc, tau_sc = evaporate_semiclassical(M0)
            t_q, M_q, TH_q, S_q, Srad_q, tau_q, Srem = evaporate_sigmaP_quantized(M0)

            # Entropy Plot
            axes[i, 0].plot(t_sc/tau_sc, Srad_sc/max(Srad_sc), 'r--', label='Hawking (Classic)')
            axes[i, 0].plot(t_q/tau_q, Srad_q/max(Srad_q), 'b-', label='Zander (sigmaP)')
            axes[i, 0].set_title(f"{name} - Radiation Entropy")
            axes[i, 0].set_ylabel("norm S_rad")
            axes[i, 0].legend()

            # Temperature Plot
            axes[i, 1].plot(t_sc/tau_sc, TH_sc, 'r--', label='Hawking')
            axes[i, 1].plot(t_q/tau_q, TH_q, 'b-', label='Zander')
            axes[i, 1].set_title(f"{name} - Hawking Temp")
            axes[i, 1].set_ylabel("T [K]")

            # Mass Plot
            axes[i, 2].plot(t_sc/tau_sc, M_sc/M0, 'r--', label='Hawking')
            axes[i, 2].plot(t_q/tau_q, M_q/M0, 'b-', label='Zander')
            axes[i, 2].set_title(f"{name} - Mass Decay")
            axes[i, 2].set_ylabel("M/M0")

        plt.show()

    if args.interactive:
        import plotly.graph_objects as go
        from plotly.subplots import make_subplots

        fig = make_subplots(rows=1, cols=3, subplot_titles=("Radiation Entropy", "Temperature", "Mass Decay"))

        for name, M0 in SAMPLES:
            t_q, M_q, TH_q, S_q, Srad_q, tau_q, Srem = evaporate_sigmaP_quantized(M0)
            
            fig.add_trace(go.Scatter(x=t_q/tau_q, y=Srad_q/max(Srad_q), name=f"{name}-Srad"), row=1, col=1)
            fig.add_trace(go.Scatter(x=t_q/tau_q, y=TH_q, name=f"{name}-Temp"), row=1, col=2)
            fig.add_trace(go.Scatter(x=t_q/tau_q, y=M_q/M0, name=f"{name}-Mass"), row=1, col=3)

        fig.update_layout(title="Interactive BH Evaporation (sigmaP framework)", height=500)
        fig.show()

    if not any([args.plot, args.interactive, args.test]):
        # Default text summary
        for name, M0 in SAMPLES:
            rs, r_pl, ratio = singularity_diagnostics(M0)
            print(f"[{name}] Mass: {M0:.3e} kg | r_s: {rs:.3e} m | curvature ratio: {ratio:.3e}")
