"""
Zander 2025 BH evaporation framework (sigma_P + GR + QM toys).

Philosophy:
- Only standard quantum mechanics and QFT in curved spacetime
  (effective field theory) are assumed.
- No string-theoretic or loop-quantum-gravity microstate models
  are used; the remnant is treated as an abstract finite 'memory core'.
"""

import math
from typing import Any

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

# Spin/action limits (framework-scale helpers)
omega_max = 1.0 / tP                  # [1/s]
E_core_max = hbar * omega_max         # [J]

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


def action_burden_balance(spin: float, burden: float) -> float:
    """
    Relative action potential vs. braking force.
    spin: 0..100 (slider-like)
    burden: 0..100 (mass load)
    """
    spin_frac = max(min(spin / 100.0, 1.0), 0.0)
    burden_frac = max(min(burden / 100.0, 1.0), 0.0)

    action_potential = spin_frac * E_core_max / hbar  # normalized to omega_max
    rs_sun = max(schwarzschild_radius(M_sun), 1e-99)
    brake_force = burden_frac * (G * M_sun / rs_sun**2)

    return action_potential / max(brake_force, 1e-99)


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
    recycle: bool = False,
    recycle_start_frac: float = 0.0,
    recycle_duration_frac: float = 0.25,
    recycle_rate: float = 0.0,
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
    - In the Zander 2025 picture, the remnant M_rem is interpreted as a
      finite "Memory Core" / "Pure Action Core", not as a terminal end state.
      This function treats the remnant only as the endpoint of the
      semi-classical evaporation stage.
    - Any cyclic dynamics (spin-up -> loading -> renewed evaporation) belongs
      to a higher-level layer and is not modeled here.
    - Optional recycling: if recycle=True and recycle_rate>0, mass can grow
      after the remnant at a fixed rate over a configured time window.
    """
    # Baseline semiclassical timescale for the time grid
    tau0 = lifetime_semiclassical(M0)
    t_end = tau0
    if recycle:
        t_end = tau0 * (1.0 + max(recycle_duration_frac, 0.0))
    t = np.linspace(0.0, t_end, nsteps)
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

            if recycle and recycle_rate > 0.0:
                # Optional recycling phase: accrete/restore after remnant.
                t0 = tau0 + max(recycle_start_frac, 0.0) * tau0
                t1 = t0 + max(recycle_duration_frac, 0.0) * tau0
                if t0 <= _ti <= t1:
                    M_curr = max(Mrem_safe, M_curr + recycle_rate * dt)

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
# QM toy helpers (unitary bookkeeping, not microstate physics)
# ============================================================


def partial_trace(
    rho: np.ndarray,
    keep: int = 0,
    dims: tuple[int, int] = (2, 2),
) -> np.ndarray:
    """
    Partial trace for a bipartite density matrix.

    Parameters
    ----------
    rho : np.ndarray
        Density matrix with shape (dA*dB, dA*dB).
    keep : int
        Which subsystem to keep (0 or 1).
    dims : tuple[int, int]
        Dimensions (dA, dB) of the two subsystems.
    """
    d_a, d_b = dims
    dim_tot = d_a * d_b

    rho_arr = np.asarray(rho, dtype=np.complex128)
    if rho_arr.shape != (dim_tot, dim_tot):
        raise ValueError(
            f"rho must have shape ({dim_tot}, {dim_tot}), got {rho_arr.shape}"
        )

    rho4 = rho_arr.reshape(d_a, d_b, d_a, d_b)
    if keep == 0:
        return np.trace(rho4, axis1=1, axis2=3)
    if keep == 1:
        return np.trace(rho4, axis1=0, axis2=2)
    raise ValueError("keep must be 0 or 1")


def von_neumann_entropy(rho: np.ndarray, eps: float = 1e-15) -> float:
    """
    Von Neumann entropy S = -Tr(rho log2 rho) for a density matrix.
    """
    rho_arr = np.asarray(rho, dtype=np.complex128)
    # Numerical hygiene for nearly-Hermitian matrices.
    rho_arr = 0.5 * (rho_arr + rho_arr.conj().T)
    evals = np.linalg.eigvalsh(rho_arr).real
    evals = np.clip(evals, 0.0, 1.0)
    evals = evals[evals > eps]
    if evals.size == 0:
        return 0.0
    return float(-np.sum(evals * np.log2(evals)))


def evaporate_qubit_model(n_steps: int = 128) -> tuple[np.ndarray, np.ndarray]:
    """
    Unitary 2-qubit toy evaporation / Page-like curve.

    This is a bookkeeping toy only. It builds a pure bipartite state
    |psi(theta)> = cos(theta)|00> + sin(theta)|11>, traces out one qubit,
    and records the reduced von Neumann entropy. theta is varied up and down
    to produce a Page-like rise-and-return profile within one cycle.
    """
    n_safe = max(int(n_steps), 2)
    steps = np.arange(n_safe, dtype=int)
    x = np.linspace(0.0, 1.0, n_safe)
    theta = np.where(x <= 0.5, 0.5 * np.pi * x, 0.5 * np.pi * (1.0 - x))

    s_rad = np.empty(n_safe, dtype=float)
    for i, th in enumerate(theta):
        psi = np.array(
            [np.cos(th), 0.0, 0.0, np.sin(th)],
            dtype=np.complex128,
        )
        rho = np.outer(psi, psi.conj())
        rho_rad = partial_trace(rho, keep=1, dims=(2, 2))
        s_rad[i] = von_neumann_entropy(rho_rad)

    return steps, s_rad


# ============================================================
# High-level cyclic remnant wrapper
# ============================================================


def remnant_cycle(
    Mrem: float,
    n_cycles: int = 3,
    nsteps: int = 2000,
    qm_steps: int = 128,
    alpha: float = 4.0,
    gamma: float = 1.0,
    recycle: bool = False,
    recycle_start_frac: float = 0.0,
    recycle_duration_frac: float = 0.25,
    recycle_rate: float = 0.0,
    cycle_start_mass: float | None = None,
) -> list[dict[str, Any]]:
    """
    High-level cyclic evaporation model in the Zander 2025 picture.

    Interprets the remnant mass Mrem as a finite 'memory core'
    (Pure Action Core). Each cycle:
    - starts from a black hole of mass M_start (initially Mrem),
    - runs sigma_P-regularized evaporation down to an effective remnant,
    - can optionally include recycling / accretion,
    - attaches a unitary QM toy model (qubit evaporation) to track
      von Neumann entanglement entropy S_rad^QM per cycle.
      The QM toy resolution is controlled by qm_steps.
    - If cycle_start_mass is provided (>0), each cycle begins from that mass
      (clamped to at least Mrem). Otherwise the minimal model restarts at Mrem.

    Returns a list of cycles, each entry:
        {
          "cycle_index": int,
          "t": np.ndarray,
          "M": np.ndarray,
          "S_rad_sigmaP": np.ndarray,
          "tau_eff": float,
          "steps_qm": np.ndarray,
          "S_rad_qm": np.ndarray,
        }
    """
    cycles: list[dict[str, Any]] = []
    Mrem_safe = max(abs(Mrem), 1e-99)
    cycle_start_safe = None
    if cycle_start_mass is not None and float(cycle_start_mass) > 0.0:
        cycle_start_safe = max(abs(float(cycle_start_mass)), Mrem_safe)

    M_start = cycle_start_safe if cycle_start_safe is not None else Mrem_safe

    for i in range(max(int(n_cycles), 0)):
        t, M, TH, S, S_rad, tau_eff, Srem = evaporate_sigmaP_quantized(
            M_start,
            nsteps=nsteps,
            Mrem=Mrem_safe,
            alpha=alpha,
            gamma=gamma,
            recycle=recycle,
            recycle_start_frac=recycle_start_frac,
            recycle_duration_frac=recycle_duration_frac,
            recycle_rate=recycle_rate,
        )

        steps_qm, S_qm = evaporate_qubit_model(n_steps=qm_steps)

        cycles.append(
            {
                "cycle_index": i,
                "t": t,
                "M": M,
                "S_rad_sigmaP": S_rad,
                "tau_eff": float(tau_eff),
                "steps_qm": steps_qm,
                "S_rad_qm": S_qm,
            }
        )

        # Minimal cycle model: restart at memory-core scale unless a cycle
        # start mass is supplied explicitly (demo / higher-level reloading toy).
        M_start = cycle_start_safe if cycle_start_safe is not None else Mrem_safe

        # Keep references explicit for readability/debugging without changing API.
        _ = TH, S, Srem

    return cycles


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


def main(argv=None):
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
        help="Show example Page-like curves for representative black holes",
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
    parser.add_argument(
        "--recycle",
        action="store_true",
        help="Enable post-remnant recycling (mass regrowth) in sigma_P-quantized mode",
    )
    parser.add_argument(
        "--recycle_rate",
        type=float,
        default=0.0,
        help="Recycle mass rate [kg/s] applied after remnant",
    )
    parser.add_argument(
        "--recycle_start_frac",
        type=float,
        default=0.0,
        help="Fraction of tau0 to delay before recycling starts",
    )
    parser.add_argument(
        "--recycle_duration_frac",
        type=float,
        default=0.25,
        help="Fraction of tau0 to keep recycling active",
    )
    parser.add_argument(
        "--spin",
        type=float,
        default=80.0,
        help="Spin slider value for action/burden balance (0..100)",
    )
    parser.add_argument(
        "--burden",
        type=float,
        default=10.0,
        help="Burden slider value for action/burden balance (0..100)",
    )
    parser.add_argument(
        "--cycles",
        type=int,
        default=0,
        help="If >0: run remnant_cycle with the given number of cycles (Zander 2025 cyclic picture).",
    )
    parser.add_argument(
        "--cycle-start-mass",
        type=float,
        default=0.0,
        help=(
            "Start mass [kg] for each cycle in remnant_cycle. "
            "If <=0 and --cycles>0, a nontrivial demo value 10*M_P is used."
        ),
    )
    parser.add_argument(
        "--cycle-qm-steps",
        type=int,
        default=128,
        help="Number of steps in the per-cycle QM toy Page-like curve.",
    )
    parser.add_argument(
        "--cycles-plot",
        action="store_true",
        help="Plot per-cycle mass decay and sigma_P/QM entropy curves (requires --cycles > 0).",
    )
    args = parser.parse_args(argv)
    gamma_cli = max(args.gamma, 0.0)
    balance = action_burden_balance(args.spin, args.burden)

    print("=== Zander sigma_P framework ===")
    print(f"sigma_P = {sigmaP:.3e}  [m·s]")
    print(f"l_P     = {lP:.3e}  [m]   (matches sqrt(ħG/c^3))")
    print(f"t_P     = {tP:.3e}  [s]   (matches sqrt(ħG/c^5))")
    print(f"M_P     = {MP:.3e}  [kg]")
    print(f"Z_int   = {Z_int:.3e}  [framework quantity]  (unused in this module)")
    print(f"gamma   = {gamma_cli:.3g}  [Hawking prefactor rescale]")
    print(
        f"balance = {balance:.3e}  [action/burden]  (spin={args.spin:g}, burden={args.burden:g})"
    )
    print()

    reps = [SAMPLES[0], SAMPLES[4], SAMPLES[9]]
    year = 365.25 * 24 * 3600

    for name, M0 in reps:
        rs, r_pl, ratio = singularity_diagnostics(M0)

        _t_sc, _M_sc, _TH_sc, _S_sc, _Srad_sc, tau_sc = evaporate_semiclassical(M0)
        _t_q, _M_q, _TH_q, _S_q, _Srad_q, tau_q, Srem = evaporate_sigmaP_quantized(
            M0,
            gamma=gamma_cli,
            recycle=args.recycle,
            recycle_rate=args.recycle_rate,
            recycle_start_frac=args.recycle_start_frac,
            recycle_duration_frac=args.recycle_duration_frac,
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

    cycles: list[dict[str, Any]] = []

    if args.cycles > 0:
        print("=== Zander 2025 cyclic remnant picture ===")
        # Use a representative remnant mass, e.g. Planck mass.
        Mrem_demo = MP
        cycle_start_mass_demo = (
            float(args.cycle_start_mass)
            if args.cycle_start_mass > 0.0
            else 10.0 * MP
        )
        cycles = remnant_cycle(
            Mrem=Mrem_demo,
            n_cycles=args.cycles,
            qm_steps=args.cycle_qm_steps,
            gamma=gamma_cli,
            recycle=args.recycle,
            recycle_rate=args.recycle_rate,
            recycle_start_frac=args.recycle_start_frac,
            recycle_duration_frac=args.recycle_duration_frac,
            cycle_start_mass=cycle_start_mass_demo,
        )
        print(
            f"cycle_start_mass = {cycle_start_mass_demo:.3e} kg "
            f"({cycle_start_mass_demo / MP:.3g} M_P)"
        )
        print(f"cycle_qm_steps   = {max(int(args.cycle_qm_steps), 2):d}")
        if cycle_start_mass_demo <= Mrem_demo:
            print("Note: cycle_start_mass <= Mrem, so tau_eff may be ~0 in this minimal model.")
        for cyc in cycles:
            idx = cyc["cycle_index"]
            tau_eff = cyc["tau_eff"]
            S_qm_max = float(np.max(cyc["S_rad_qm"]))
            print(
                f"cycle={idx:d}: tau_eff={tau_eff:.3e} s, "
                f"max S_rad^QM = {S_qm_max:.3f}"
            )
        print("Note: Each cycle treats the remnant as a finite 'memory core' and restarts.")
        print()

    if args.plot:
        import matplotlib.pyplot as plt

        fig, axes = plt.subplots(1, 3, figsize=(13, 4), constrained_layout=True)

        for ax, (name, M0) in zip(axes, reps):
            t_sc, _, _, _, Srad_sc, tau_sc = evaporate_semiclassical(M0)
            t_q, _, _, _, Srad_q, tau_q, _Srem = evaporate_sigmaP_quantized(
                M0,
                gamma=gamma_cli,
                recycle=args.recycle,
                recycle_rate=args.recycle_rate,
                recycle_start_frac=args.recycle_start_frac,
                recycle_duration_frac=args.recycle_duration_frac,
            )

            ax.plot(
                t_sc / max(tau_sc, 1e-99),
                Srad_sc / max(np.max(Srad_sc), 1e-99),
                label="Continuum (Hawking)",
                color="red",
            )

            ax.plot(
                t_q / max(t_q[-1], 1e-99),
                Srad_q / max(np.max(Srad_q), 1e-99),
                label=f"sigma_P-quantized (gamma={gamma_cli:g})",
                color="blue",
            )

            ax.set_title(f"{name} BH")
            ax.set_xlabel(r"$t/\tau$")
            ax.set_ylabel(r"$S_{\mathrm{rad}}/S_{0}$")
            ax.set_xlim(0, 1)
            ax.set_ylim(0, 1.05)
            if ax == axes[-1]:
                ax.legend(loc="lower left", fontsize="small")

        plt.show()

    if args.cycles_plot:
        if not cycles:
            print("Note: --cycles-plot requested, but no cycles were computed. Use --cycles > 0.")
            print()
        else:
            import matplotlib.pyplot as plt

            fig, axes = plt.subplots(1, 2, figsize=(12, 4), constrained_layout=True)
            cmap = plt.cm.get_cmap("tab10", max(len(cycles), 1))

            for j, cyc in enumerate(cycles):
                color = cmap(j)

                t_cyc = np.asarray(cyc["t"], dtype=float)
                m_cyc = np.asarray(cyc["M"], dtype=float)
                s_sigma = np.asarray(cyc["S_rad_sigmaP"], dtype=float)
                steps_qm = np.asarray(cyc["steps_qm"], dtype=float)
                s_qm = np.asarray(cyc["S_rad_qm"], dtype=float)
                idx = int(cyc["cycle_index"])

                t_norm = t_cyc / max(float(t_cyc[-1]), 1e-99)
                m_norm = m_cyc / max(float(m_cyc[0]), 1e-99)
                s_sigma_norm = s_sigma / max(float(np.max(s_sigma)), 1e-99)
                qm_x = steps_qm / max(float(steps_qm[-1]), 1.0)
                s_qm_norm = s_qm / max(float(np.max(s_qm)), 1e-99)

                axes[0].plot(t_norm, m_norm, color=color, lw=2, label=f"cycle {idx}")
                axes[1].plot(
                    t_norm,
                    s_sigma_norm,
                    color=color,
                    lw=2,
                    label=f"sigma_P cycle {idx}",
                )
                axes[1].plot(
                    qm_x,
                    s_qm_norm,
                    color=color,
                    lw=1.5,
                    ls="--",
                    label=f"QM toy cycle {idx}",
                )

            axes[0].set_title("Cycle Mass Decay")
            axes[0].set_xlabel(r"$t/\tau_{\rm cycle}$")
            axes[0].set_ylabel(r"$M/M_{\rm start}$")
            axes[0].set_xlim(0, 1)
            axes[0].set_ylim(0, 1.05)
            axes[0].legend(loc="best", fontsize="small")

            axes[1].set_title("Cycle Radiation Entropy (Normalized)")
            axes[1].set_xlabel("normalized cycle coordinate")
            axes[1].set_ylabel("normalized entropy")
            axes[1].set_xlim(0, 1)
            axes[1].set_ylim(0, 1.05)
            axes[1].legend(loc="best", fontsize="small", ncol=2)

            fig.suptitle("Zander 2025 Remnant-Cycle Diagnostics")
            plt.show()

    # Tiny cosmology demo link (optional sanity cross-ref)
    R_demo = 1.0e26  # m, placeholder cosmic scale
    t_demo = 4.3e17  # s, placeholder age scale
    print("=== Window-mapping demo (placeholders) ===")
    print(f"alpha_sigma(R,t) = {alpha_sigma(R_demo, t_demo):.3e}  [-]")
    print(f"Lambda_eff(R,t)  = {lambda_eff(R_demo, t_demo):.3e}  [1/m^2]")


if __name__ == "__main__":
    main()
