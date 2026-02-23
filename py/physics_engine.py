import math
import numpy as np

# ============================================================
# Fundamental constants (SI)
# ============================================================

hbar = 1.054_571_817e-34      # J·s
c = 2.997_924_58e8            # m/s
G = 6.674_30e-11              # m^3 kg^-1 s^-2
kB = 1.380_649e-23            # J/K
pi = math.pi

# ============================================================
# Zander framework: spacetime grain sigma_P and derived scales
# ============================================================

# Fundamental spacetime two-measure (sigma_P)
sigmaP = hbar * G / c**4              # [m·s]

# Derived Planck scales (match standard Planck length/time)
lP = math.sqrt(sigmaP * c)            # [m]
tP = math.sqrt(sigmaP / c)            # [s]

# Planck mass (standard)
MP = math.sqrt(hbar * c / G)          # [kg]

# Interaction quantum (kept for cross-module compatibility; unused here by default)
Z_int = hbar**2 / c                   # [framework quantity]

# Solar mass
M_sun = 1.989e30                      # [kg]

# ============================================================
# Cosmology window mapping helpers (ties BH module to Lambda_eff docs)
# ============================================================


def alpha_sigma(R: float, t: float) -> float:
    """alpha_sigma(W) = sigma_P / (R t), dimensionless."""
    R_safe = max(abs(R), 1e-99)
    t_safe = max(abs(t), 1e-99)
    return sigmaP / (R_safe * t_safe)


def lambda_eff(R: float, t: float) -> float:
    """Lambda_eff(W) = 3 / (c R t), [1/m^2]."""
    R_safe = max(abs(R), 1e-99)
    t_safe = max(abs(t), 1e-99)
    return 3.0 / (c * R_safe * t_safe)


# ============================================================
# Basic GR quantities
# ============================================================


def schwarzschild_radius(M: float) -> float:
    """Schwarzschild radius r_s = 2GM / c^2."""
    M_safe = max(abs(M), 1e-99)
    return 2.0 * G * M_safe / c**2


def kretschmann_scalar(M: float, r: float) -> float:
    """
    Kretschmann scalar K for Schwarzschild:
    K = 48 G^2 M^2 / (c^4 r^6)  [1/m^4].
    """
    M_safe = max(abs(M), 1e-99)
    r_safe = max(abs(r), 1e-99)
    return 48.0 * G**2 * M_safe**2 / (c**4 * r_safe**6)


def planck_curvature_radius(M: float) -> float:
    """
    Radius r_Pl where curvature becomes Planckian:
    K * l_P^4 ~ 1  =>  r^6 = 48 G^2 M^2 l_P^4 / c^4
    """
    M_safe = max(abs(M), 1e-99)
    num = 48.0 * G**2 * M_safe**2 * lP**4
    return (num / c**4) ** (1.0 / 6.0)


# ============================================================
# Hawking quantities (standard formulas; pi from geometry)
# ============================================================


def hawking_temperature(M: float) -> float:
    """Hawking temperature: T_H = ħ c^3 / (8 π G M k_B)."""
    M_safe = max(abs(M), 1e-99)
    return hbar * c**3 / (8.0 * pi * G * M_safe * kB)


def bh_entropy(M: float) -> float:
    """
    Bekenstein-Hawking entropy:
    S = k_B c^3 A / (4 ħ G),  A = 4π r_s^2.
    """
    rs = schwarzschild_radius(M)
    A = 4.0 * pi * rs**2
    return kB * c**3 * A / (4.0 * hbar * G)


def lifetime_semiclassical(M0: float) -> float:
    """Total evaporation time (Hawking, continuum spacetime):
       tau = 5120 π G^2 M^3 / (ħ c^4)
    """
    M0_safe = max(abs(M0), 1e-99)
    return 5120.0 * pi * G**2 * M0_safe**3 / (hbar * c**4)


# ============================================================
# Evaporation models
# ============================================================


def evaporate_semiclassical(M0: float, nsteps: int = 2000):
    """
    Continuum spacetime Hawking evaporation:
    dM/dt = - ħ c^4 / (15360 π G^2 M^2).

    Uses analytic solution M(t) = M0 (1 - t/tau)^(1/3).
    """
    tau = lifetime_semiclassical(M0)
    t = np.linspace(0.0, tau, nsteps)   # [s]

    # Analytic mass curve in this approximation
    M = M0 * np.maximum(1.0 - t / tau, 0.0) ** (1.0 / 3.0)

    # Avoid zero-mass calls
    M_safe = np.maximum(M, 1e-99)

    TH = np.array([hawking_temperature(float(m)) for m in M_safe])
    S = np.array([bh_entropy(float(m)) for m in M_safe])

    # Simple "information-losing" radiation entropy proxy
    S_rad = S[0] * t / tau

    return t, M, TH, S, S_rad, tau


def evaporate_sigmaP_quantized(
    M0: float,
    nsteps: int = 2000,
    Mrem: float = MP,
    alpha: float = 4.0,
    gamma: float = 1.0,
):
    """
    sigma_P-regularized evaporation with a Planck remnant (heuristic closure).

    Model choices:
    - For M >> M_P: Hawking-like dM/dt with standard prefactor.
    - Near M ~ M_P: mass loss is smoothly suppressed via (M^2 + α M_P^2).
    - Temperature is capped at a Planck-scale limit from t_P: T_max ~ ħ/(kB tP).
    - gamma rescales the Hawking prefactor (hook for greybody/dof effects).
    - Radiation entropy S_rad is a heuristic Page-like closure (unitary scenario),
      not derived from microstate counting in this module.
    """
    # Baseline semiclassical timescale for the time grid
    tau0 = lifetime_semiclassical(M0)
    t = np.linspace(0.0, tau0, nsteps)
    dt = t[1] - t[0]

    M = np.empty_like(t)
    TH = np.empty_like(t)
    S = np.empty_like(t)

    # Planck-scale temperature cap from t_P
    T_max = hbar / (kB * tP)

    gamma_eff = max(float(gamma), 0.0)
    # Hawking prefactor for dM/dt = -K0 / M^2 (continuum)
    K0 = gamma_eff * hbar * c**4 / (15360.0 * pi * G**2)

    M0_safe = max(abs(M0), 1e-99)
    Mrem_safe = max(abs(Mrem), 1e-99)
    alpha_eff = max(float(alpha), 0.0)

    M_curr = M0_safe
    idx_rem = None

    for i, _ti in enumerate(t):
        M[i] = M_curr
        S[i] = bh_entropy(M_curr)

        # Standard Hawking temperature, then grain-cap
        TH_curr = hawking_temperature(M_curr)
        TH[i] = min(TH_curr, T_max)

        if M_curr > Mrem_safe:
            # sigma_P-smoothed Hawking mass loss:
            # dM/dt ~ -K0 / (M^2 + α M_P^2)
            denom = M_curr**2 + alpha_eff * MP**2
            dMdt = -K0 / denom
            M_next = M_curr + dMdt * dt

            if M_next <= Mrem_safe:
                M_curr = Mrem_safe
                idx_rem = i  # first index where remnant is reached (robust)
            else:
                M_curr = M_next
        else:
            M_curr = Mrem_safe
            if idx_rem is None:
                idx_rem = i

    if idx_rem is None:
        idx_rem = len(t) - 1

    tau_eff = float(t[idx_rem])

    # Heuristic Page-like radiation entropy closure (unitary scenario)
    S0 = bh_entropy(M0_safe)
    Srem = bh_entropy(Mrem_safe)
    S_rad = np.zeros_like(t)

    # Heuristic page-time placement
    t_page = max(0.5 * tau_eff, 1e-99)

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

    # Cut arrays at remnant time
    cut = idx_rem + 1
    t = t[:cut]
    M = M[:cut]
    TH = TH[:cut]
    S = S[:cut]
    S_rad = S_rad[:cut]

    return t, M, TH, S, S_rad, tau_eff, Srem


def evaporate_sigmaP_alpha_sweep(
    M0: float,
    alphas=(1.0, 2.0, 4.0, 8.0),
    nsteps: int = 2000,
    Mrem: float = MP,
    gamma: float = 1.0,
):
    """
    Convenience sweep over alpha to test robustness of qualitative conclusions.
    Returns a dict alpha -> (t, M, TH, S, S_rad, tau_eff, Srem).
    """
    out = {}
    for a in alphas:
        out[float(a)] = evaporate_sigmaP_quantized(
            M0=M0, nsteps=nsteps, Mrem=Mrem, alpha=float(a), gamma=gamma
        )
    return out


# ============================================================
# Singularity diagnostics
# ============================================================


def singularity_diagnostics(M: float):
    """
    Returns diagnostic data for the Schwarzschild geometry of mass M:
    - r_s: Schwarzschild radius
    - r_Pl: radius where curvature becomes Planckian (K l_P^4 ~ 1)
    - ratio: r_Pl / r_s
    """
    rs = schwarzschild_radius(M)
    r_pl = planck_curvature_radius(M)
    ratio = r_pl / rs if rs > 0 else float("inf")
    return rs, r_pl, ratio


# ============================================================
# Sample set (10 black holes)
# ============================================================

SAMPLES = [
    ("PBH", 1e12),
    ("PBH", 1e15),
    ("PBH", 1e18),
    ("stellar", 5 * M_sun),
    ("stellar", 10 * M_sun),
    ("stellar", 30 * M_sun),
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
        description="BH evaporation: semi-classical vs sigma_P-quantized (with robustness hooks)"
    )
    parser.add_argument(
        "--plot",
        action="store_true",
        help="(unused in this module) Show example Page-like curves for representative black holes",
    )
    parser.add_argument(
        "--gamma",
        type=float,
        default=1.0,
        help="Rescaling factor for the Hawking prefactor (greybody/dof hook)",
    )
    parser.add_argument(
        "--alpha_sweep",
        action="store_true",
        help="Print a small robustness sweep over alpha for sigma_P-quantized evaporation",
    )
    args = parser.parse_args()
    gamma_cli = max(args.gamma, 0.0)

    print("=== Zander sigma_P framework ===")
    print(f"sigma_P = {sigmaP:.3e}  [m·s]")
    print(f"l_P     = {lP:.3e}  [m]   (matches sqrt(ħG/c^3))")
    print(f"t_P     = {tP:.3e}  [s]   (matches sqrt(ħG/c^5))")
    print(f"M_P     = {MP:.3e}  [kg]")
    print(f"Z_int   = {Z_int:.3e}  [framework quantity]  (unused in this module)")
    print(f"gamma   = {gamma_cli:.3g}  [Hawking prefactor rescale]")
    print()

    reps = [SAMPLES[0], SAMPLES[4], SAMPLES[9]]
    year = 365.25 * 24 * 3600

    for name, M0 in reps:
        rs, r_pl, ratio = singularity_diagnostics(M0)

        _t_sc, _M_sc, _TH_sc, _S_sc, _Srad_sc, tau_sc = evaporate_semiclassical(M0)
        _t_q, _M_q, _TH_q, _S_q, _Srad_q, tau_q, Srem = evaporate_sigmaP_quantized(
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
            f"  sigma_P-quantized: tau_eff = {tau_q:.3e} s ({tau_q/year:.3e} years),"
            f"  S_rem / k_B ~= {Srem/kB:.3e}"
        )
        print("  Note: S_rad(Page) is a heuristic unitary closure in this module.")
        print()

        if args.alpha_sweep:
            sweep = evaporate_sigmaP_alpha_sweep(M0, gamma=gamma_cli)
            print("  alpha-sweep (robustness check):")
            for a, (_t, _M, _TH, _S, _Srad, _tau_eff, _Srem) in sweep.items():
                print(
                    f"    alpha={a:g}: tau_eff={_tau_eff:.3e} s ({_tau_eff/year:.3e} years), "
                    f"S_rem/k_B={_Srem/kB:.3e}"
                )
            print()

    # Tiny cosmology demo link (optional sanity cross-ref)
    R_demo = 1.0e26  # m, placeholder cosmic scale
    t_demo = 4.3e17  # s, placeholder age scale
    print("=== Window-mapping demo (placeholders) ===")
    print(f"alpha_sigma(R,t) = {alpha_sigma(R_demo, t_demo):.3e}  [-]")
    print(f"Lambda_eff(R,t)  = {lambda_eff(R_demo, t_demo):.3e}  [1/m^2]")
