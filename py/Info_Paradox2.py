import math
import numpy as np


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
    """Schwarzschild radius r_s = 2GM / c^2."""
    return 2.0 * G * M / c**2



def kretschmann_scalar(M: float, r: float) -> float:
    """
    Kretschmann scalar K for Schwarzschild:
    K = 48 G^2 M^2 / (c^4 r^6)  [1/m^4].
    """
    r_safe = max(abs(r), 1e-99)
    return 48.0 * G**2 * M**2 / (c**4 * r_safe**6)



def planck_curvature_radius(M: float) -> float:
    """
    Radius r_Pl where curvature becomes Planckian:
    K * l_P^4 ~ 1  =>  r^6 = 48 G^2 M^2 l_P^4 / c^4
    """
    M_safe = max(abs(M), 1e-99)
    num = 48.0 * G**2 * M_safe**2 * lP**4
    return (num / c**4) ** (1.0 / 6.0)



# ============================================================
# Hawking quantities (standard formulas with π from geometry)
# ============================================================


def hawking_temperature(M: float) -> float:
    """Hawking temperature: T_H = ħ c^3 / (8 π G M k_B)."""
    return hbar * c**3 / (8.0 * pi * G * M * kB)



def bh_entropy(M: float) -> float:
    """
    Bekenstein–Hawking entropy:
    S = k_B c^3 A / (4 ħ G), A = 4π r_s^2.
    """
    rs = schwarzschild_radius(M)
    A  = 4.0 * pi * rs**2
    return kB * c**3 * A / (4.0 * hbar * G)



def lifetime_semiclassical(M0: float) -> float:
    """Total evaporation time (Hawking, continuum spacetime):
       τ = 5120 π G^2 M^3 / (ħ c^4)
    """
    return 5120.0 * pi * G**2 * M0**3 / (hbar * c**4)



# ============================================================
# Evaporation models
# ============================================================


def evaporate_semiclassical(M0: float, nsteps: int = 2000):
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


    TH = hawking_temperature(M_safe)
    S  = bh_entropy(M_safe)


    # Simple "information-losing" radiation entropy proxy:
    S_rad = S[0] * t / tau


    return t, M, TH, S, S_rad, tau



def evaporate_sigmaP_quantized(
    M0: float,
    nsteps: int = 2000,
    Mrem: float = MP,
    alpha: float = 4.0,
    gamma: float = 1.0
):
    """
    σ_P-regularized evaporation with Planck remnant.


    - Uses Hawking-like dM/dt for M >> M_P.
    - Near M ~ M_P, mass loss is smoothly suppressed by (M^2 + α M_P^2) in the denominator.
    - Temperature is capped by a grain-scale limit derived from Z_int and σ_P.
    - gamma rescales the Hawking prefactor (hook for greybody/dof effects).
    - Page-like entropy curve: rises, then returns to a finite S_rem (information not lost).
    """
    # Baseline semiclassical timescale
    # Assumption labels (see docs/Assumption_Register.md):
    # - Axiom: sigmaP, lP, tP from ħ, G, c.
    # - Heuristic closure: default Mrem=MP, smoothing alpha, and Page-profile below.
    tau0 = lifetime_semiclassical(M0)
    t = np.linspace(0.0, tau0, nsteps)
    dt = t[1] - t[0]


    M  = np.empty_like(t)
    TH = np.empty_like(t)
    S  = np.empty_like(t)


    # Planck-scale temperature cap from t_P
    T_max = hbar / (kB * tP)
    gamma_eff = max(gamma, 0.0)
    K0 = gamma_eff * hbar * c**4 / (15360.0 * pi * G**2)


    M_curr = M0


    for i, ti in enumerate(t):
        M[i] = M_curr
        S[i] = bh_entropy(max(M_curr, 1e-99))


        # Standard Hawking temperature, then grain-cap
        TH_curr = hawking_temperature(max(M_curr, 1e-99))
        TH[i]   = min(TH_curr, T_max)


        if M_curr > Mrem:
            # σ_P-smoothed Hawking mass loss:
            # dM/dt ~ - const / (M^2 + α M_P^2)
            denom = M_curr**2 + alpha * MP**2
            dMdt  = -K0 / denom
            M_curr = max(M_curr + dMdt * dt, Mrem)
        else:
            M_curr = Mrem


    # Effective time until remnant is reached
    mask = (M <= (Mrem + 1e-40))
    idxs = np.where(mask)[0]
    idx_rem = int(idxs[0]) if len(idxs) else (len(t) - 1)
    tau_eff = t[idx_rem]


    # Heuristic Page-like radiation entropy closure (unitary scenario)
    S0   = bh_entropy(M0)
    Srem = bh_entropy(Mrem)
    S_rad = np.zeros_like(t)


    t_page = max(0.5 * tau_eff, 1e-99)  # Heuristic page-time placement
    for i, ti in enumerate(t):
        if ti <= t_page:
            # Rise to ~ S0/2
            S_rad[i] = 0.5 * S0 * (ti / t_page)
        else:
            # Return from ~S0/2 down to Srem
            span = max(tau_eff - t_page, 1e-99)
            frac = (ti - t_page) / span
            S_rad[i] = (1.0 - frac) * (0.5 * S0 - Srem) + Srem


        if ti >= tau_eff:
            S_rad[i] = Srem

    cut = idx_rem + 1
    t = t[:cut]
    M = M[:cut]
    TH = TH[:cut]
    S = S[:cut]
    S_rad = S_rad[:cut]


    return t, M, TH, S, S_rad, tau_eff, Srem



# ============================================================
# Singularitätsdiagnostik
# ============================================================


def singularity_diagnostics(M: float):
    """
    Returns some diagnostic data for the Schwarzschild geometry of mass M:
    - r_s: Schwarzschild radius
    - r_Pl: radius where curvature becomes Planckian (K l_P^4 ~ 1)
    - ratio: r_Pl / r_s
    """
    rs   = schwarzschild_radius(M)
    r_pl = planck_curvature_radius(M)
    ratio = r_pl / rs if rs > 0 else float("inf")
    return rs, r_pl, ratio



# ============================================================
# Sample set (10 black holes)
# ============================================================


SAMPLES = [
    ("PBH",          1e12),
    ("PBH",          1e15),
    ("PBH",          1e18),
    ("stellar",      5 * M_sun),
    ("stellar",      10 * M_sun),
    ("stellar",      30 * M_sun),
    ("intermediate", 1e3 * M_sun),
    ("intermediate", 1e4 * M_sun),
    ("supermassive", 1e6 * M_sun),
    ("supermassive", 1e9 * M_sun),
]




if __name__ == "__main__":
    import argparse
    import sys
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
            sys.stderr.reconfigure(encoding="utf-8")
        except Exception:
            pass
    parser = argparse.ArgumentParser(
        description="BH evaporation: semi-classical vs σ_P-quantized"
    )
    parser.add_argument(
        "--plot", action="store_true",
        help="Show example Page-like curves for representative black holes"
    )
    parser.add_argument(
        "--gamma", type=float, default=1.0,
        help="Rescaling factor for the Hawking prefactor (greybody/dof hook)"
    )
    args = parser.parse_args()
    gamma_cli = max(args.gamma, 0.0)


    print("=== Zander σ_P framework ===")
    print(f"σ_P   = {sigmaP:.3e}  [m·s]")
    print(f"l_P   = {lP:.3e}  [m]")
    print(f"t_P   = {tP:.3e}  [s]")
    print(f"M_P   = {MP:.3e}  [kg]")
    print(f"Z_int = {Z_int:.3e}  [J²·s/m]")
    print(f"gamma = {gamma_cli:.3g}  [Hawking prefactor rescale]")
    print()


    # Representative objects: PBH, stellar, supermassive
    reps = [SAMPLES[0], SAMPLES[4], SAMPLES[9]]
    year = 365.25 * 24 * 3600


    for name, M0 in reps:
        rs, r_pl, ratio = singularity_diagnostics(M0)


        t_sc, M_sc, TH_sc, S_sc, Srad_sc, tau_sc = evaporate_semiclassical(M0)
        t_q,  M_q,  TH_q,  S_q,  Srad_q,  tau_q, Srem = evaporate_sigmaP_quantized(
            M0, gamma=gamma_cli
        )


        print(f"[{name}]  M0 = {M0:.3e} kg")
        print(f"  r_s      = {rs:.3e} m")
        print(f"  r_Pl     = {r_pl:.3e} m  (K l_P^4 ~ 1)")
        print(f"  r_Pl/r_s = {ratio:.3e}")
        print(
            f"  Semi-classical: tau = {tau_sc:.3e} s ({tau_sc/year:.3e} years),"
            f"  T_H(M0) = {hawking_temperature(M0):.3e} K"
        )
        print(
            f"  σ_P-quantized:  tau_eff = {tau_q:.3e} s ({tau_q/year:.3e} years),"
            f"  S_rem / k_B ≈ {Srem/kB:.3e}"
        )
        print()


    if args.plot:
        import matplotlib.pyplot as plt


        fig, axes = plt.subplots(1, 3, figsize=(13, 4), constrained_layout=True)


        for ax, (name, M0) in zip(axes, reps):
            t_sc, _, _, _, Srad_sc, tau_sc = evaporate_semiclassical(M0)
            t_q,  _, _, _, Srad_q,  tau_q, Srem = evaporate_sigmaP_quantized(
                M0, gamma=gamma_cli
            )


            # Normalized radiation entropy over time
            ax.plot(t_sc / tau_sc,
                    Srad_sc / max(np.max(Srad_sc), 1e-99),
                    label='Continuum (Hawking)')


            ax.plot(t_q / max(t_q[-1], 1e-99),
                    Srad_q / max(np.max(Srad_q), 1e-99),
                    label=f'σ_P-quantized (γ={gamma_cli:g})')


            ax.set_title(f"{name} BH")
            ax.set_xlabel(r"$t/\tau$")
            ax.set_ylabel(r"$S_{\mathrm{rad}}/S_{\max}$")
            ax.set_xlim(0, 1)
            ax.set_ylim(0, 1.05)


        handles, labels = axes[-1].get_legend_handles_labels()
        fig.legend(handles, labels, loc="lower center", ncol=2)
        plt.show()
