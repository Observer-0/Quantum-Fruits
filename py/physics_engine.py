"""
Zander 2025 BH evaporation framework (sigma_P + GR + QM toys).

Philosophy:
- Only standard quantum mechanics and QFT in curved spacetime
  (effective field theory) are assumed.
- No string-theoretic or loop-quantum-gravity microstate models
  are used; the remnant is treated as an abstract finite 'memory core'.
"""

import math
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Optional

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
                "TH": TH,
                "S_rad_sigmaP": S_rad,
                "tau_eff": float(tau_eff),
                "Srem": float(Srem),
                "steps_qm": steps_qm,
                "S_rad_qm": S_qm,
            }
        )

        # Minimal cycle model: restart at memory-core scale unless a cycle
        # start mass is supplied explicitly (demo / higher-level reloading toy).
        M_start = cycle_start_safe if cycle_start_safe is not None else Mrem_safe

        # Keep references explicit for readability/debugging without changing API.
        _ = S

    return cycles


# ============================================================
# JSON export helpers (for browser cinema playback)
# ============================================================


def _arr_to_list(values: Any) -> list[float]:
    arr = np.asarray(values, dtype=float)
    return [float(x) for x in arr.tolist()]


def _maybe_arr_to_list(values: Any) -> list[float] | None:
    """
    Convert array-like values to a JSON-safe float list, or return None if absent.
    """
    if values is None:
        return None
    arr = np.asarray(values)
    if arr.size == 0:
        return None
    return _arr_to_list(arr)


def remnant_cycle_json_payload(
    cycles: list[dict[str, Any]],
    *,
    Mrem: float,
    n_cycles: int,
    nsteps: int,
    qm_steps: int,
    alpha: float,
    gamma: float,
    recycle: bool,
    recycle_start_frac: float,
    recycle_duration_frac: float,
    recycle_rate: float,
    cycle_start_mass: float | None,
    hero_mass: float | None = None,
) -> dict[str, Any]:
    """
    Build a JSON-serializable payload for BH Cinema Lab playback.

    The schema is intentionally simple and versioned for browser ingestion.
    """
    payload_cycles: list[dict[str, Any]] = []
    for cyc in cycles:
        cyc_json: dict[str, Any] = {
            "cycle_index": int(cyc.get("cycle_index", 0)),
            "t": _arr_to_list(cyc.get("t", [])),
            "M": _arr_to_list(cyc.get("M", [])),
            "TH": _arr_to_list(cyc.get("TH", [])),
            "S_rad_sigmaP": _arr_to_list(cyc.get("S_rad_sigmaP", [])),
            "tau_eff": float(cyc.get("tau_eff", 0.0)),
            "Srem": float(cyc.get("Srem", 0.0)),
            "steps_qm": _arr_to_list(cyc.get("steps_qm", [])),
            "S_rad_qm": _arr_to_list(cyc.get("S_rad_qm", [])),
        }

        # Optional traces used by the BH Cinema renderer (if available).
        a_star = _maybe_arr_to_list(cyc.get("a_star"))
        chi = _maybe_arr_to_list(cyc.get("chi"))
        flags = _maybe_arr_to_list(cyc.get("flags"))
        if a_star is not None:
            cyc_json["a_star"] = a_star
        if chi is not None:
            cyc_json["chi"] = chi
        if flags is not None:
            cyc_json["flags"] = [int(round(v)) for v in flags]

        # Optional diagnostics (exported if present; renderer currently ignores them).
        J_arr = _maybe_arr_to_list(cyc.get("J"))
        P_arr = _maybe_arr_to_list(cyc.get("P"))
        dotM_arr = _maybe_arr_to_list(cyc.get("dotM"))
        dotJ_arr = _maybe_arr_to_list(cyc.get("dotJ"))
        if J_arr is not None:
            cyc_json["J"] = J_arr
        if P_arr is not None:
            cyc_json["P"] = P_arr
        if dotM_arr is not None:
            cyc_json["dotM"] = dotM_arr
        if dotJ_arr is not None:
            cyc_json["dotJ"] = dotJ_arr

        payload_cycles.append(cyc_json)

    return {
        "format": "qf.bh_cinema.cycles.v1",
        "generator": "py/physics_engine.py",
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "config": {
            "Mrem": float(Mrem),
            "n_cycles": int(n_cycles),
            "nsteps": int(nsteps),
            "qm_steps": int(qm_steps),
            "alpha": float(alpha),
            "gamma": float(gamma),
            "recycle": bool(recycle),
            "recycle_start_frac": float(recycle_start_frac),
            "recycle_duration_frac": float(recycle_duration_frac),
            "recycle_rate": float(recycle_rate),
            "cycle_start_mass": (
                None if cycle_start_mass is None else float(cycle_start_mass)
            ),
            "hero_mass": None if hero_mass is None else float(hero_mass),
        },
        "constants": {
            "sigmaP": float(sigmaP),
            "lP": float(lP),
            "tP": float(tP),
            "MP": float(MP),
            "c": float(c),
            "G": float(G),
            "hbar": float(hbar),
            "kB": float(kB),
        },
        "cycles": payload_cycles,
    }


def bh_cinema_payload_from_evolution_trace(
    out: dict[str, Any],
    *,
    label: str,
    gamma: float | None = None,
    hero_mass: float | None = None,
    alpha: float | None = None,
) -> dict[str, Any]:
    """
    Wrap a single evolution trace (e.g. spin / hysteresis solver output) into the
    BH Cinema JSON schema as a single-cycle payload.

    The renderer primarily requires `t`, `M`, and optional `TH`, `a_star`, `chi`,
    `flags`. Missing entropy/QM channels are filled with benign placeholders.
    """
    t_arr = np.asarray(out.get("t", []), dtype=float)
    M_arr = np.asarray(out.get("M", []), dtype=float)
    n = int(min(t_arr.size, M_arr.size))
    if n < 2:
        raise ValueError("evolution trace must contain at least 2 points in t and M")

    t_arr = t_arr[:n]
    M_arr = np.maximum(np.abs(M_arr[:n]), 1e-99)
    TH_arr = np.asarray(out.get("TH", []), dtype=float)
    if TH_arr.size >= n:
        TH_arr = TH_arr[:n]
    else:
        TH_arr = np.array([hawking_temperature(float(m)) for m in M_arr], dtype=float)

    Srad_sigma = np.asarray(out.get("S_rad_sigmaP", []), dtype=float)
    if Srad_sigma.size < n:
        # Placeholder channel for the renderer (keeps visuals stable if absent).
        Srad_sigma = np.linspace(0.0, 1.0, n, dtype=float)
    else:
        Srad_sigma = Srad_sigma[:n]

    steps_qm = np.asarray(out.get("steps_qm", []), dtype=float)
    srad_qm = np.asarray(out.get("S_rad_qm", []), dtype=float)
    if steps_qm.size < 2 or srad_qm.size < 2:
        steps_qm = np.arange(64, dtype=float)
        x_qm = np.linspace(0.0, 1.0, 64)
        srad_qm = np.sin(np.pi * x_qm) ** 1.1

    tau_eff = float(out.get("tau_eff", out.get("t_eft", t_arr[-1])))
    if not math.isfinite(tau_eff) or tau_eff <= 0.0:
        tau_eff = float(t_arr[-1])

    m_min = float(np.min(M_arr))
    m_start = float(M_arr[0])
    mrem = min(m_min, m_start)

    cyc: dict[str, Any] = {
        "cycle_index": 0,
        "t": t_arr,
        "M": M_arr,
        "TH": TH_arr,
        "S_rad_sigmaP": Srad_sigma,
        "tau_eff": tau_eff,
        "Srem": float(bh_entropy(mrem)),
        "steps_qm": steps_qm,
        "S_rad_qm": srad_qm,
    }

    # Pass through optional spin/core traces if present.
    for k in ("a_star", "chi", "flags", "J", "P", "dotM", "dotJ"):
        if k in out:
            cyc[k] = out[k]

    cfg_gamma = (
        float(gamma)
        if gamma is not None
        else float(out.get("gamma", 1.0)) if "gamma" in out else 1.0
    )
    cfg_alpha = float(alpha) if alpha is not None else 4.0
    cfg_hero_mass = float(hero_mass) if hero_mass is not None else m_start

    payload = remnant_cycle_json_payload(
        [cyc],
        Mrem=mrem,
        n_cycles=1,
        nsteps=n,
        qm_steps=int(np.asarray(steps_qm).size),
        alpha=cfg_alpha,
        gamma=cfg_gamma,
        recycle=False,
        recycle_start_frac=0.0,
        recycle_duration_frac=0.0,
        recycle_rate=0.0,
        cycle_start_mass=m_start,
        hero_mass=cfg_hero_mass,
    )
    payload["config"]["source_model"] = str(label)
    payload["config"]["trace_wrapped_single_cycle"] = True

    # Forward selected metadata if available.
    for k in (
        "t_eft",
        "t_core_enter",
        "t_core_exit",
        "threshold_in",
        "threshold_out",
        "tau0",
        "eft_criterion",
    ):
        if k in out:
            v = out[k]
            if v is None:
                payload["config"][k] = None
            elif isinstance(v, (int, float, np.floating, np.integer)):
                payload["config"][k] = float(v)
            else:
                payload["config"][k] = v

    return payload


def save_remnant_cycle_json(path: str | Path, payload: dict[str, Any]) -> Path:
    """
    Save a BH Cinema Lab payload as UTF-8 JSON and return the resolved path.
    """
    out_path = Path(path).expanduser()
    if out_path.parent and not out_path.parent.exists():
        out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return out_path.resolve()


# ============================================================
# Experimental: EFT cutoff + Kerr-ish (minimal) + accretion
# ============================================================

# This section is intentionally a phenomenological extension layer.
# It is useful for exploratory simulations / visuals, but it does not replace
# the core sigma_P evaporation functions above.


# ---------- EFT cutoff criterion (Schwarzschild proxy) ----------


def kretschmann_at_horizon_schwarzschild_proxy(M: float) -> float:
    """
    Schwarzschild Kretschmann scalar evaluated at r = r_s(M).

    For Kerr runs this is used only as a conservative proxy criterion.
    """
    rs = schwarzschild_radius(M)
    return kretschmann_scalar(M, rs)


def eft_breakdown_by_curvature_schwarzschild_proxy(
    M: float,
    threshold: float = 1.0,
) -> bool:
    """
    Proxy EFT breakdown criterion using Schwarzschild horizon curvature:
      K(r_s) * lP^4 >= threshold

    threshold ~ O(1) is the canonical Planck-curvature proxy.
    """
    M_safe = max(abs(M), 1e-99)
    k_val = kretschmann_at_horizon_schwarzschild_proxy(M_safe)
    return (k_val * (lP**4)) >= float(threshold)


# Compatibility aliases (explicitly proxy-based).
def kretschmann_at_horizon(M: float) -> float:
    """Compatibility alias for the Schwarzschild horizon curvature proxy."""
    return kretschmann_at_horizon_schwarzschild_proxy(M)


def eft_breakdown_by_curvature(M: float, threshold: float = 1.0) -> bool:
    """Compatibility alias for the Schwarzschild-proxy EFT cutoff criterion."""
    return eft_breakdown_by_curvature_schwarzschild_proxy(M, threshold=threshold)


# ---------- Minimal Kerr-ish helpers ----------
# NOTE: Conservative hook model, not a precision Kerr flux model.


def clamp(x: float, lo: float, hi: float) -> float:
    """Clamp scalar x to [lo, hi]."""
    return max(lo, min(hi, x))


def horizon_radius_kerr(M: float, a_star: float) -> float:
    """
    Kerr outer horizon radius r_+ in SI:
      r_+ = r_g (1 + sqrt(1 - a_*^2)),  r_g = G M / c^2

    For a_* = 0 this reduces to the Schwarzschild radius r_s = 2GM/c^2.
    """
    M_safe = max(abs(M), 1e-99)
    a = clamp(float(a_star), 0.0, 0.999_999_999)
    r_g = G * M_safe / c**2
    return r_g * (1.0 + math.sqrt(1.0 - a * a))


def horizon_radius_kerr_inner(M: float, a_star: float) -> float:
    """Kerr inner horizon radius r_- in SI (minimal helper)."""
    M_safe = max(abs(M), 1e-99)
    a = clamp(float(a_star), 0.0, 0.999_999_999)
    r_g = G * M_safe / c**2
    return r_g * (1.0 - math.sqrt(1.0 - a * a))


def surface_gravity_kerr_geometric(M: float, a_star: float) -> float:
    """
    Kerr surface gravity in geometric form [1/m].

    We use the standard Kerr dependence in terms of r_+, r_- and a_*:
      kappa_geo = (r_+ - r_-) / (2 (r_+^2 + a_len^2))
    where a_len = a_* r_g and r_g = GM/c^2.

    Temperature then follows via:
      T_H = (hbar * c * kappa_geo) / (2 pi kB)
    """
    M_safe = max(abs(M), 1e-99)
    a = clamp(float(a_star), 0.0, 0.999_999_999)
    r_g = G * M_safe / c**2
    a_len = a * r_g
    rp = horizon_radius_kerr(M_safe, a)
    rm = horizon_radius_kerr_inner(M_safe, a)
    denom = 2.0 * (rp * rp + a_len * a_len)
    return (rp - rm) / max(denom, 1e-99)


def surface_gravity_kerr(M: float, a_star: float) -> float:
    """
    Compatibility wrapper: returns geometric Kerr surface gravity [1/m].

    (Not acceleration in m/s^2.)
    """
    return surface_gravity_kerr_geometric(M, a_star)


def hawking_temperature_kerr(M: float, a_star: float) -> float:
    """
    Minimal Kerr Hawking temperature using the exact Kerr surface-gravity dependence.

    Uses kappa_geo [1/m]:
      T_H = hbar * c * kappa_geo / (2 pi kB)
    """
    kappa_geo = surface_gravity_kerr_geometric(M, a_star)
    return hbar * c * kappa_geo / (2.0 * pi * kB)


def spin_parameter_from_J(M: float, J: float) -> float:
    """
    Dimensionless Kerr spin a_* = c J / (G M^2), clamped to [0, 0.999...].
    """
    M_safe = max(abs(M), 1e-99)
    a = (c * float(J)) / (G * M_safe**2)
    return clamp(a, 0.0, 0.999_999_999)


def J_from_spin_parameter(M: float, a_star: float) -> float:
    """Angular momentum from dimensionless Kerr spin: J = a_* G M^2 / c."""
    M_safe = max(abs(M), 1e-99)
    a = clamp(float(a_star), 0.0, 0.999_999_999)
    return a * G * M_safe**2 / c


# ---------- Power / flux model with conservative caps ----------


def hawking_power_schwarzschild(M: float, gamma: float = 1.0) -> float:
    """
    Baseline Schwarzschild power consistent with the dM/dt coefficient:

      dM/dt = -K0 / M^2
      K0 = gamma * hbar c^4 / (15360 pi G^2)
      P = c^2 |dM/dt| = c^2 K0 / M^2
    """
    M_safe = max(abs(M), 1e-99)
    gamma_eff = max(float(gamma), 0.0)
    k0 = gamma_eff * hbar * c**4 / (15360.0 * pi * G**2)
    return (c**2) * k0 / (M_safe**2)


def hawking_power_kerr_minimal(M: float, a_star: float, gamma: float = 1.0) -> float:
    """
    Minimal Kerr-ish power proxy:

    - start from Schwarzschild baseline
    - rescale by (T_kerr / T_schw)^4

    This is a toy closure (no greybody factors, no superradiance, no mode sum),
    but preserves the correct qualitative suppression as a_* -> 1.
    """
    M_safe = max(abs(M), 1e-99)
    a = clamp(float(a_star), 0.0, 0.999_999_999)

    t_s = hawking_temperature(M_safe)
    t_k = hawking_temperature_kerr(M_safe, a)
    ratio = (t_k / max(t_s, 1e-300)) ** 4

    return hawking_power_schwarzschild(M_safe, gamma=gamma) * float(ratio)


def apply_power_caps(
    P: float,
    T: float,
    cap_planck_power: bool = True,
    cap_planck_temp: bool = True,
) -> tuple[float, float]:
    """
    Apply conservative EFT-motivated caps:
    - Planck power scale ~ c^5 / G
    - Planck temperature scale ~ hbar / (kB tP)
    """
    p_eff = float(P)
    t_eff = float(T)

    if cap_planck_temp:
        t_max = hbar / (kB * tP)
        t_eff = min(t_eff, t_max)

    if cap_planck_power:
        p_max = c**5 / G
        p_eff = min(p_eff, p_max)

    return p_eff, t_eff


# ---------- Accretion models ----------


def accretion_constant(rate_kg_s: float) -> Callable[[float, float, float], float]:
    """Return dotM_acc(t, M, a*) = constant rate [kg/s]."""
    rate = float(rate_kg_s)

    def _fn(ti: float, Mi: float, ai: float) -> float:
        _ = ti, Mi, ai
        return rate

    return _fn


def accretion_eddington(
    eta: float = 0.1,
    f_edd: float = 1.0,
) -> Callable[[float, float, float], float]:
    """
    Eddington-limited mass accretion rate:
      L_Edd = 4 pi G M m_p c / sigma_T
      dotM = f_edd * L_Edd / (eta c^2)
    """
    m_p = 1.672_621_923_69e-27     # kg
    sigma_t = 6.652_458_732_1e-29  # m^2

    eta_eff = max(float(eta), 1e-9)
    f_eff = max(float(f_edd), 0.0)

    def _fn(ti: float, Mi: float, ai: float) -> float:
        _ = ti, ai
        M_safe = max(abs(Mi), 1e-99)
        l_edd = 4.0 * pi * G * M_safe * m_p * c / sigma_t
        return f_eff * l_edd / (eta_eff * c**2)

    return _fn


# ---------- Main evolution dataclass ----------


@dataclass
class EvoConfig:
    """
    Experimental Kerr-ish + EFT cutoff evolution config.

    This is an exploratory/phenomenological layer. It should not be interpreted
    as a precision Kerr evaporation solver.
    """

    nsteps: int = 4000
    t_end: Optional[float] = None  # if None: use semiclassical lifetime scale
    gamma: float = 1.0

    # EFT proxy criterion
    curvature_threshold: float = 1.0  # K lP^4 ~ 1 (Schwarzschild-horizon proxy)
    stop_on_eft_breakdown: bool = True

    # Caps
    cap_planck_power: bool = True
    cap_planck_temp: bool = True

    # Core-phase behavior after EFT proxy breakdown (if not stopping)
    freeze_hawking_in_core: bool = True
    allow_accretion_in_core: bool = True

    # Numerical safety (prevents pathological jumps during strong accretion)
    max_frac_mass_change_per_substep: float = 0.02
    max_substeps_per_step: int = 20000


def evolve_bh_kerr_eft(
    M0: float,
    a0_star: float = 0.0,
    dotM_acc: Optional[Callable[[float, float, float], float]] = None,
    cfg: Optional[EvoConfig] = None,
) -> dict[str, Any]:
    """
    Experimental BH evolution with minimal Kerr-ish evaporation + accretion + EFT proxy cutoff.

    Evolution equation:
      dM/dt = -P(M, a*) / c^2 + dotM_acc(t, M, a*)

    Notes
    -----
    - The EFT cutoff uses a Schwarzschild-horizon curvature proxy K(r_s) lP^4.
    - Kerr power is a minimal proxy based on (T_kerr/T_schw)^4 scaling.
    - Spin a_* is held constant in this minimal version (no dotJ model).

    Returns
    -------
    dict with arrays:
      t, M, a_star, TH, P, dotM_acc, dMdt, flags, t_eft, tau0
    """
    if cfg is None:
        cfg = EvoConfig()

    M0_safe = max(abs(float(M0)), 1e-99)
    a0 = clamp(float(a0_star), 0.0, 0.999_999_999)

    if dotM_acc is None:
        dotM_acc = accretion_constant(0.0)

    tau0 = lifetime_semiclassical(M0_safe)
    t_end = float(cfg.t_end) if cfg.t_end is not None else float(tau0)
    t_end = max(t_end, 1e-30)

    n = max(int(cfg.nsteps), 2)
    t = np.linspace(0.0, t_end, n, dtype=float)
    dt = float(t[1] - t[0])

    M = np.empty(n, dtype=float)
    a_star = np.empty(n, dtype=float)
    TH = np.empty(n, dtype=float)
    P = np.empty(n, dtype=float)
    dotM_acc_arr = np.empty(n, dtype=float)
    dMdt_arr = np.empty(n, dtype=float)
    flags = np.zeros(n, dtype=int)  # 0 = normal, 1 = EFT proxy breakdown/core-phase

    M_curr = M0_safe
    a_curr = a0
    t_eft: float | None = None
    in_core = False

    frac_limit = max(float(cfg.max_frac_mass_change_per_substep), 1e-9)
    max_sub = max(int(cfg.max_substeps_per_step), 1)

    for i, ti in enumerate(t):
        M[i] = M_curr
        a_star[i] = a_curr

        # Hawking temperature/power (Kerr-ish proxy), then conservative caps
        T_curr = hawking_temperature_kerr(M_curr, a_curr)
        P_curr = hawking_power_kerr_minimal(M_curr, a_curr, gamma=cfg.gamma)
        P_cap, T_cap = apply_power_caps(
            P_curr,
            T_curr,
            cap_planck_power=cfg.cap_planck_power,
            cap_planck_temp=cfg.cap_planck_temp,
        )

        # EFT proxy breakdown at the (Schwarzschild) horizon curvature scale
        eft_break = eft_breakdown_by_curvature_schwarzschild_proxy(
            M_curr,
            threshold=cfg.curvature_threshold,
        )
        if eft_break and t_eft is None:
            t_eft = float(ti)

        if eft_break:
            flags[i] = 1
            if cfg.stop_on_eft_breakdown:
                TH[i] = T_cap
                P[i] = P_cap
                dotM_acc_arr[i] = float(dotM_acc(float(ti), float(M_curr), float(a_curr)))
                dMdt_arr[i] = -P_cap / c**2 + dotM_acc_arr[i]
                cut = i + 1
                return {
                    "t": t[:cut],
                    "M": M[:cut],
                    "a_star": a_star[:cut],
                    "TH": TH[:cut],
                    "P": P[:cut],
                    "dotM_acc": dotM_acc_arr[:cut],
                    "dMdt": dMdt_arr[:cut],
                    "flags": flags[:cut],
                    "t_eft": t_eft,
                    "tau0": float(tau0),
                    "eft_criterion": "schwarzschild_horizon_kretschmann_proxy",
                }
            in_core = True

        if in_core and cfg.freeze_hawking_in_core:
            P_eff = 0.0
            TH[i] = T_cap
        else:
            P_eff = P_cap
            TH[i] = T_cap

        # Accretion can optionally continue through the core phase
        dotM_raw = float(dotM_acc(float(ti), float(M_curr), float(a_curr)))
        dotM_eff = dotM_raw if ((not in_core) or cfg.allow_accretion_in_core) else 0.0

        dMdt_now = -P_eff / c**2 + dotM_eff
        P[i] = P_eff
        dotM_acc_arr[i] = dotM_eff
        dMdt_arr[i] = dMdt_now

        if i >= n - 1:
            continue

        # Adaptive sub-stepping for numerical stability (especially with accretion bursts)
        remaining = dt
        substeps = 0
        while remaining > 0.0:
            if substeps >= max_sub:
                raise ValueError(
                    "evolve_bh_kerr_eft: time step too coarse for stable integration "
                    f"(ti={ti:.3e}s, M={M_curr:.3e}kg). Reduce t_end, increase nsteps, "
                    "or reduce accretion rate / max_frac_mass_change_per_substep."
                )

            T_sub = hawking_temperature_kerr(M_curr, a_curr)
            P_sub = hawking_power_kerr_minimal(M_curr, a_curr, gamma=cfg.gamma)
            P_sub_cap, _T_sub_cap = apply_power_caps(
                P_sub,
                T_sub,
                cap_planck_power=cfg.cap_planck_power,
                cap_planck_temp=cfg.cap_planck_temp,
            )

            eft_sub = eft_breakdown_by_curvature_schwarzschild_proxy(
                M_curr,
                threshold=cfg.curvature_threshold,
            )
            if eft_sub and t_eft is None:
                t_eft = float(ti + (dt - remaining))
            if eft_sub:
                in_core = True

            if in_core and cfg.freeze_hawking_in_core:
                P_use = 0.0
            else:
                P_use = P_sub_cap

            t_sub = float(ti + (dt - remaining))
            dotM_sub_raw = float(dotM_acc(t_sub, float(M_curr), float(a_curr)))
            dotM_sub = (
                dotM_sub_raw if ((not in_core) or cfg.allow_accretion_in_core) else 0.0
            )
            dMdt_sub = -P_use / c**2 + dotM_sub

            rate_abs = abs(dMdt_sub)
            if rate_abs <= 1e-300:
                dt_take = remaining
            else:
                dt_lim = frac_limit * max(M_curr, 1e-99) / rate_abs
                dt_take = min(remaining, dt_lim)

            if (not math.isfinite(dt_take)) or dt_take <= 0.0:
                raise ValueError(
                    "evolve_bh_kerr_eft: invalid adaptive sub-step encountered. "
                    "Check rates / configuration."
                )

            M_next = M_curr + dMdt_sub * dt_take
            M_curr = max(float(M_next), 1e-99)
            remaining -= dt_take
            if remaining < 1e-18 * max(dt, 1.0):
                remaining = 0.0

            # Minimal model: keep a_* fixed until a torque model is added
            a_curr = clamp(a_curr, 0.0, 0.999_999_999)
            substeps += 1

    return {
        "t": t,
        "M": M,
        "a_star": a_star,
        "TH": TH,
        "P": P,
        "dotM_acc": dotM_acc_arr,
        "dMdt": dMdt_arr,
        "flags": flags,
        "t_eft": t_eft,
        "tau0": float(tau0),
        "eft_criterion": "schwarzschild_horizon_kretschmann_proxy",
    }


def evolve_with_environment_bursts(
    M0: float,
    a0_star: float = 0.0,
    bursts: Optional[list[tuple[float, float]]] = None,
    cfg: Optional[EvoConfig] = None,
) -> dict[str, Any]:
    """
    Simple environment model: piecewise-constant accretion bursts.

    Parameters
    ----------
    bursts : list[(t_start_frac, rate_kg_s)]
        `t_start_frac` is a fraction of the integration window t_end.
        Example: [(0.0, 0.0), (0.2, 1e5), (0.6, 0.0)]
    """
    if cfg is None:
        cfg = EvoConfig()

    if bursts is None or len(bursts) == 0:
        dotM = accretion_constant(0.0)
    else:
        bursts_sorted = sorted(
            [(float(s), float(r)) for s, r in bursts],
            key=lambda x: x[0],
        )
        t_ref = (
            float(cfg.t_end)
            if cfg.t_end is not None
            else float(lifetime_semiclassical(max(abs(M0), 1e-99)))
        )
        t_ref = max(t_ref, 1e-30)

        def dotM(ti: float, Mi: float, ai: float) -> float:
            _ = Mi, ai
            x = ti / t_ref
            rate = bursts_sorted[0][1]
            for s, r in bursts_sorted:
                if x >= s:
                    rate = r
                else:
                    break
            return rate

    return evolve_bh_kerr_eft(M0, a0_star=a0_star, dotM_acc=dotM, cfg=cfg)


def demo_eft_feedback() -> dict[str, Any]:
    """
    Small demo for the experimental Kerr-ish EFT/accretion layer.

    Uses a PBH-scale mass but an intentionally short integration window (t_end)
    so the accretion burst is numerically and visually meaningful.
    """
    M0 = 1e12  # kg (PBH scale)
    cfg = EvoConfig(
        nsteps=6000,
        t_end=1.0e6,  # s; do not use tau0 here (too large for an environment burst demo)
        gamma=1.0,
        curvature_threshold=1.0,
        stop_on_eft_breakdown=False,  # allow a toy "core phase"
        freeze_hawking_in_core=True,
        allow_accretion_in_core=True,
        cap_planck_power=True,
        cap_planck_temp=True,
        max_frac_mass_change_per_substep=0.02,
    )

    out = evolve_with_environment_bursts(
        M0,
        a0_star=0.2,
        bursts=[(0.0, 0.0), (0.7, 1e6)],  # late accretion burst
        cfg=cfg,
    )

    t = np.asarray(out["t"], dtype=float)
    M = np.asarray(out["M"], dtype=float)
    flags = np.asarray(out["flags"], dtype=int)
    eft_idx = np.where(flags == 1)[0]

    if eft_idx.size:
        i0 = int(eft_idx[0])
        print(f"EFT proxy breakdown reached at t={t[i0]:.3e} s, M={M[i0]:.3e} kg")
    else:
        print("No EFT proxy breakdown within the integration window.")

    print("Experimental Kerr-ish + accretion demo (phenomenological layer)")
    print(f"Start mass: {M[0]:.3e} kg")
    print(f"End mass:   {M[-1]:.3e} kg")
    print(f"t_end:      {t[-1]:.3e} s")
    return out


# ============================================================
# Experimental extension: spin torque (ISCO) + core hysteresis
# ============================================================


def curvature_measure_horizon_schwarzschild_proxy(M: float) -> float:
    """
    Dimensionless curvature proxy at the Schwarzschild horizon:
      chi = K(r_s) * lP^4

    For Kerr runs this remains an explicit Schwarzschild-horizon proxy.
    """
    M_safe = max(abs(M), 1e-99)
    k_val = kretschmann_at_horizon_schwarzschild_proxy(M_safe)
    return float(k_val * (lP**4))


def curvature_measure_horizon(M: float) -> float:
    """Compatibility alias for the Schwarzschild-horizon curvature proxy."""
    return curvature_measure_horizon_schwarzschild_proxy(M)


def spin_parameter_from_J_signed(
    M: float,
    J: float,
    a_star_max: float = 0.999_999_999,
) -> float:
    """
    Signed dimensionless Kerr spin:
      a_* = c J / (G M^2), clamped to [-a_star_max, +a_star_max].
    """
    M_safe = max(abs(M), 1e-99)
    a_raw = (c * float(J)) / (G * M_safe**2)
    a_lim = clamp(abs(float(a_star_max)), 0.0, 0.999_999_999)
    return clamp(a_raw, -a_lim, a_lim)


def J_from_spin_parameter_signed(
    M: float,
    a_star: float,
    a_star_max: float = 0.999_999_999,
) -> float:
    """
    Signed angular momentum from signed dimensionless Kerr spin:
      J = a_* G M^2 / c
    """
    M_safe = max(abs(M), 1e-99)
    a_lim = clamp(abs(float(a_star_max)), 0.0, 0.999_999_999)
    a_signed = clamp(float(a_star), -a_lim, a_lim)
    return a_signed * G * M_safe**2 / c


def _clamp_J_to_kerr_bound(M: float, J: float, a_star_max: float) -> float:
    """
    Enforce the Kerr bound on |J|:
      |J| <= a_star_max * G M^2 / c
    """
    M_safe = max(abs(M), 1e-99)
    a_lim = clamp(abs(float(a_star_max)), 0.0, 0.999_999_999)
    J_lim = a_lim * G * M_safe**2 / c
    return clamp(float(J), -J_lim, J_lim)


def r_isco_kerr(M: float, a_star: float, prograde: bool = True) -> float:
    """
    Kerr ISCO radius in SI meters (analytic Bardeen formula).

    Parameters
    ----------
    a_star : float
        Dimensionless Kerr spin magnitude/sign; only |a_star| enters the radius.
    prograde : bool
        Orbit orientation relative to the BH spin axis.
    """
    M_safe = max(abs(M), 1e-99)
    a = clamp(abs(float(a_star)), 0.0, 0.999_999_999)
    sgn = +1.0 if prograde else -1.0
    r_g = G * M_safe / c**2

    z1 = 1.0 + (1.0 - a * a) ** (1.0 / 3.0) * (
        (1.0 + a) ** (1.0 / 3.0) + (1.0 - a) ** (1.0 / 3.0)
    )
    z2 = math.sqrt(3.0 * a * a + z1 * z1)
    r_isco_over_rg = 3.0 + z2 - sgn * math.sqrt(
        max((3.0 - z1) * (3.0 + z1 + 2.0 * z2), 0.0)
    )

    return float(r_isco_over_rg) * r_g


def specific_angular_momentum_isco(
    M: float,
    a_star: float,
    prograde: bool = True,
) -> float:
    """
    Signed specific angular momentum l = L/m at Kerr ISCO in SI [m^2/s].

    Sign convention:
    - positive: aligned with the BH spin axis
    - negative: anti-aligned with the BH spin axis

    The BH spin orientation is encoded by the sign of a_star. Internally the
    Kerr orbital expressions use |a_star| and the requested orbit orientation
    (prograde/retrograde) relative to the BH spin axis.
    """
    M_safe = max(abs(M), 1e-99)
    a_signed = float(a_star)
    a_mag = clamp(abs(a_signed), 0.0, 0.999_999_999)
    bh_sign = 1.0 if a_signed >= 0.0 else -1.0

    r_g = G * M_safe / c**2
    rbar = r_isco_kerr(M_safe, a_mag, prograde=prograde) / max(r_g, 1e-99)
    sqrt_r = math.sqrt(rbar)

    if prograde:
        num = rbar**2 - 2.0 * a_mag * sqrt_r + a_mag**2
        den_inside = rbar**2 - 3.0 * rbar + 2.0 * a_mag * sqrt_r
        orbit_sign_rel_to_bh = +1.0
    else:
        num = rbar**2 + 2.0 * a_mag * sqrt_r + a_mag**2
        den_inside = rbar**2 - 3.0 * rbar - 2.0 * a_mag * sqrt_r
        orbit_sign_rel_to_bh = -1.0

    den_inside = max(den_inside, 1e-30)
    den = sqrt_r * math.sqrt(den_inside)
    lbar_mag = abs(num / max(den, 1e-30))

    # Convert from geometric-units expression (in units of M) to SI:
    # l_SI = lbar * (G M / c)
    l_si_mag = float(lbar_mag) * (G * M_safe / c)

    # Map local "relative to BH spin axis" sign into a global axis sign.
    return bh_sign * orbit_sign_rel_to_bh * l_si_mag


def dotJ_accretion_from_dotM(
    t: float,
    M: float,
    a_star: float,
    dotM_acc: float,
    mode: str = "isco",
    l_manual: float = 0.0,
    prograde: bool = True,
) -> float:
    """
    Accretion torque:
      dotJ_acc = l * dotM_acc

    mode:
      - "isco": use Kerr ISCO specific angular momentum (signed)
      - "manual": use l_manual [m^2/s]
    """
    _ = t
    mdot = float(dotM_acc)
    if mdot <= 0.0:
        return 0.0

    if str(mode).lower() == "manual":
        l_val = float(l_manual)
    else:
        l_val = specific_angular_momentum_isco(M, a_star, prograde=prograde)

    return l_val * mdot


def dotJ_hawking_parametric(
    M: float,
    a_star: float,
    dotM_rad: float,
    xi: float = 1.0,
) -> float:
    """
    Parametric Hawking spin-down torque (phenomenological):
      dotJ_rad ~ - xi * sign(a_*) * |a_*| * (G/c) * M * |dotM_rad|

    where dotM_rad <= 0 is the Hawking mass-loss term.
    This drives J toward zero.
    """
    M_safe = max(abs(M), 1e-99)
    a_signed = float(a_star)
    a_mag = clamp(abs(a_signed), 0.0, 0.999_999_999)
    xi_eff = max(float(xi), 0.0)
    mdot = float(dotM_rad)

    if mdot >= 0.0 or a_mag <= 0.0:
        return 0.0

    spin_sign = 1.0 if a_signed >= 0.0 else -1.0
    return -xi_eff * spin_sign * a_mag * (G / c) * M_safe * abs(mdot)


@dataclass
class SpinEvoConfig(EvoConfig):
    """
    Experimental spin-enabled extension of `EvoConfig`.

    Still phenomenological:
    - Kerr-ish evaporation proxy
    - ISCO accretion torque
    - parametric Hawking spin-down
    """

    evolve_spin: bool = True
    accretion_torque_mode: str = "isco"  # "isco" | "manual"
    accretion_l_manual: float = 0.0      # SI [m^2/s], only if mode="manual"
    prograde: bool = True                # orbit orientation relative to BH spin axis

    hawking_spin_down: bool = True
    hawking_xi: float = 1.0              # O(1) phenomenological knob

    a_star_max: float = 0.999_999_999


@dataclass
class SpinEvoHysteresisConfig(SpinEvoConfig):
    """
    Spin-enabled config with core hysteresis thresholds on the curvature proxy.
    """

    curvature_threshold_in: float = 1.0
    curvature_threshold_out: float = 0.3
    enable_core_exit: bool = True


def _kerr_observables_capped(
    M: float,
    a_star: float,
    cfg: EvoConfig,
) -> tuple[float, float]:
    """Return (P_cap, T_cap) for the Kerr-ish phenomenological model."""
    T_curr = hawking_temperature_kerr(M, a_star)
    P_curr = hawking_power_kerr_minimal(M, a_star, gamma=cfg.gamma)
    return apply_power_caps(
        P_curr,
        T_curr,
        cap_planck_power=cfg.cap_planck_power,
        cap_planck_temp=cfg.cap_planck_temp,
    )


def _spin_rhs_kerr_eft(
    ti: float,
    M: float,
    J: float,
    in_core: bool,
    dotM_acc_fn: Callable[[float, float, float], float],
    cfg: SpinEvoConfig,
) -> dict[str, float]:
    """
    Compute instantaneous phenomenological RHS and observables at (t, M, J).

    Returns a dict with:
      a_star, TH, P_cap, P_eff, dotM_acc_raw, dotM_acc_eff, dotM_rad,
      dotM_total, dotJ_total
    """
    M_safe = max(abs(float(M)), 1e-99)
    a_lim = clamp(abs(float(cfg.a_star_max)), 0.0, 0.999_999_999)
    a_signed = spin_parameter_from_J_signed(M_safe, float(J), a_star_max=a_lim)

    P_cap, T_cap = _kerr_observables_capped(M_safe, a_signed, cfg)

    if in_core and cfg.freeze_hawking_in_core:
        P_eff = 0.0
        TH_eff = T_cap
    else:
        P_eff = P_cap
        TH_eff = T_cap

    dotM_acc_raw = float(dotM_acc_fn(float(ti), float(M_safe), float(a_signed)))
    dotM_acc_eff = dotM_acc_raw if ((not in_core) or cfg.allow_accretion_in_core) else 0.0

    dotM_rad = -P_eff / c**2  # <= 0
    dotM_total = dotM_rad + dotM_acc_eff

    dotJ_total = 0.0
    if cfg.evolve_spin:
        dotJ_total += dotJ_accretion_from_dotM(
            t=float(ti),
            M=float(M_safe),
            a_star=float(a_signed),
            dotM_acc=float(max(dotM_acc_eff, 0.0)),
            mode=str(cfg.accretion_torque_mode),
            l_manual=float(cfg.accretion_l_manual),
            prograde=bool(cfg.prograde),
        )
        if cfg.hawking_spin_down and dotM_rad < 0.0:
            dotJ_total += dotJ_hawking_parametric(
                M=float(M_safe),
                a_star=float(a_signed),
                dotM_rad=float(dotM_rad),
                xi=float(cfg.hawking_xi),
            )

    return {
        "a_star": float(a_signed),
        "TH": float(TH_eff),
        "P_cap": float(P_cap),
        "P_eff": float(P_eff),
        "dotM_acc_raw": float(dotM_acc_raw),
        "dotM_acc_eff": float(dotM_acc_eff),
        "dotM_rad": float(dotM_rad),
        "dotM_total": float(dotM_total),
        "dotJ_total": float(dotJ_total),
    }


def _advance_mass_J_adaptive(
    ti: float,
    dt: float,
    M_curr: float,
    J_curr: float,
    in_core: bool,
    dotM_acc_fn: Callable[[float, float, float], float],
    cfg: SpinEvoConfig,
    *,
    hysteresis: bool = False,
    threshold_in: float = 1.0,
    threshold_out: float = 0.3,
    enable_core_exit: bool = True,
    t_core_enter: float | None = None,
    t_core_exit: float | None = None,
) -> tuple[float, float, bool, float | None, float | None]:
    """
    Advance (M, J) over one sampled interval using adaptive substepping.

    The step limiter is driven by a maximum fractional mass change per substep
    (and a soft angular-momentum limiter when spin evolution is enabled).
    """
    frac_limit = max(float(cfg.max_frac_mass_change_per_substep), 1e-9)
    max_sub = max(int(cfg.max_substeps_per_step), 1)
    a_lim = clamp(abs(float(cfg.a_star_max)), 0.0, 0.999_999_999)

    remaining = max(float(dt), 0.0)
    substeps = 0

    while remaining > 0.0:
        if substeps >= max_sub:
            raise ValueError(
                "Adaptive spin solver exceeded max_substeps_per_step. "
                f"ti={ti:.3e}s, M={M_curr:.3e}kg, remaining_dt={remaining:.3e}s. "
                "Increase nsteps / decrease t_end / lower accretion rate / "
                "raise max_substeps_per_step."
            )

        t_sub = float(ti + (dt - remaining))
        chi_sub = curvature_measure_horizon_schwarzschild_proxy(M_curr)

        if hysteresis:
            if (not in_core) and (chi_sub >= float(threshold_in)):
                in_core = True
                if t_core_enter is None:
                    t_core_enter = t_sub
            if in_core and bool(enable_core_exit) and (chi_sub <= float(threshold_out)):
                in_core = False
                if t_core_exit is None:
                    t_core_exit = t_sub
        else:
            if chi_sub >= float(cfg.curvature_threshold):
                in_core = True

        rhs = _spin_rhs_kerr_eft(
            t_sub,
            M_curr,
            J_curr,
            in_core,
            dotM_acc_fn,
            cfg,
        )

        dotM_total = rhs["dotM_total"]
        dotJ_total = rhs["dotJ_total"]

        # Mass-based adaptive limiter
        rate_M_abs = abs(dotM_total)
        if rate_M_abs <= 1e-300:
            dt_take = remaining
        else:
            dt_lim_M = frac_limit * max(M_curr, 1e-99) / rate_M_abs
            dt_take = min(remaining, dt_lim_M)

        # Soft J-based limiter to avoid large spin jumps in one substep
        if cfg.evolve_spin:
            J_scale = max(abs(J_curr), (G * max(M_curr, 1e-99) ** 2 / c) * 1e-12)
            rate_J_abs = abs(dotJ_total)
            if rate_J_abs > 1e-300:
                dt_lim_J = frac_limit * J_scale / rate_J_abs
                dt_take = min(dt_take, dt_lim_J)

        if (not math.isfinite(dt_take)) or dt_take <= 0.0:
            raise ValueError(
                "Invalid adaptive substep in spin solver. "
                "Check rates and configuration."
            )

        M_next = max(M_curr + dotM_total * dt_take, 1e-99)
        J_next = J_curr + dotJ_total * dt_take
        J_next = _clamp_J_to_kerr_bound(M_next, J_next, a_star_max=a_lim)

        M_curr = float(M_next)
        J_curr = float(J_next)

        remaining -= dt_take
        if remaining < 1e-18 * max(dt, 1.0):
            remaining = 0.0

        substeps += 1

    return M_curr, J_curr, in_core, t_core_enter, t_core_exit


def evolve_bh_kerr_eft_with_spin(
    M0: float,
    a0_star: float = 0.0,
    dotM_acc_fn: Optional[Callable[[float, float, float], float]] = None,
    cfg: Optional[SpinEvoConfig] = None,
) -> dict[str, Any]:
    """
    Experimental coupled evolution of mass and Kerr spin (via J).

    Equations (phenomenological):
      dM/dt = -P(M,a*)/c^2 + dotM_acc
      dJ/dt = dotJ_acc(ISCO/manual) + dotJ_rad(parametric Hawking)
      a*    = c J / (G M^2)

    Uses:
    - Kerr-ish evaporation proxy
    - Schwarzschild-horizon curvature proxy for EFT/core entry
    - adaptive substepping for numerical stability
    """
    if cfg is None:
        cfg = SpinEvoConfig()

    a_lim = clamp(abs(float(cfg.a_star_max)), 0.0, 0.999_999_999)
    M0_safe = max(abs(float(M0)), 1e-99)
    a0_signed = clamp(float(a0_star), -a_lim, a_lim)
    J_curr = J_from_spin_parameter_signed(M0_safe, a0_signed, a_star_max=a_lim)

    if dotM_acc_fn is None:
        dotM_acc_fn = accretion_constant(0.0)

    tau0 = lifetime_semiclassical(M0_safe)
    t_end = float(cfg.t_end) if cfg.t_end is not None else float(tau0)
    t_end = max(t_end, 1e-30)

    n = max(int(cfg.nsteps), 2)
    t = np.linspace(0.0, t_end, n, dtype=float)
    dt = float(t[1] - t[0])

    M = np.empty(n, dtype=float)
    J = np.empty(n, dtype=float)
    a_star = np.empty(n, dtype=float)
    TH = np.empty(n, dtype=float)
    P = np.empty(n, dtype=float)
    dotM_arr = np.empty(n, dtype=float)
    dotJ_arr = np.empty(n, dtype=float)
    flags = np.zeros(n, dtype=int)  # 0 normal, 1 in core
    chi_arr = np.empty(n, dtype=float)

    M_curr = M0_safe
    in_core = False
    t_eft: float | None = None

    for i, ti in enumerate(t):
        M[i] = M_curr
        J[i] = J_curr
        a_curr = spin_parameter_from_J_signed(M_curr, J_curr, a_star_max=a_lim)
        a_star[i] = a_curr

        chi = curvature_measure_horizon_schwarzschild_proxy(M_curr)
        chi_arr[i] = chi

        eft_break = chi >= float(cfg.curvature_threshold)
        if eft_break and t_eft is None:
            t_eft = float(ti)

        if eft_break:
            in_core = True
            flags[i] = 1

            if cfg.stop_on_eft_breakdown:
                P_cap, T_cap = _kerr_observables_capped(M_curr, a_curr, cfg)
                TH[i] = T_cap
                P[i] = P_cap
                dotM_acc_raw = float(dotM_acc_fn(float(ti), float(M_curr), float(a_curr)))
                dotM_rad = -P_cap / c**2
                dotM_arr[i] = dotM_rad + dotM_acc_raw
                dotJ_stop = 0.0
                if cfg.evolve_spin:
                    dotJ_stop += dotJ_accretion_from_dotM(
                        t=float(ti),
                        M=float(M_curr),
                        a_star=float(a_curr),
                        dotM_acc=float(max(dotM_acc_raw, 0.0)),
                        mode=str(cfg.accretion_torque_mode),
                        l_manual=float(cfg.accretion_l_manual),
                        prograde=bool(cfg.prograde),
                    )
                    if cfg.hawking_spin_down and dotM_rad < 0.0:
                        dotJ_stop += dotJ_hawking_parametric(
                            M=float(M_curr),
                            a_star=float(a_curr),
                            dotM_rad=float(dotM_rad),
                            xi=float(cfg.hawking_xi),
                        )
                dotJ_arr[i] = dotJ_stop

                cut = i + 1
                return {
                    "t": t[:cut],
                    "M": M[:cut],
                    "J": J[:cut],
                    "a_star": a_star[:cut],
                    "TH": TH[:cut],
                    "P": P[:cut],
                    "dotM": dotM_arr[:cut],
                    "dotJ": dotJ_arr[:cut],
                    "flags": flags[:cut],
                    "chi": chi_arr[:cut],
                    "t_eft": t_eft,
                    "tau0": float(tau0),
                    "eft_criterion": "schwarzschild_horizon_kretschmann_proxy",
                }
        else:
            flags[i] = 1 if in_core else 0

        rhs = _spin_rhs_kerr_eft(
            float(ti),
            float(M_curr),
            float(J_curr),
            bool(in_core),
            dotM_acc_fn,
            cfg,
        )
        TH[i] = rhs["TH"]
        P[i] = rhs["P_eff"]
        dotM_arr[i] = rhs["dotM_total"]
        dotJ_arr[i] = rhs["dotJ_total"]

        if i >= n - 1:
            continue

        M_curr, J_curr, in_core, _t_in, _t_out = _advance_mass_J_adaptive(
            ti=float(ti),
            dt=dt,
            M_curr=float(M_curr),
            J_curr=float(J_curr),
            in_core=bool(in_core),
            dotM_acc_fn=dotM_acc_fn,
            cfg=cfg,
            hysteresis=False,
            t_core_enter=t_eft,
            t_core_exit=None,
        )
        if _t_in is not None and t_eft is None:
            t_eft = _t_in

    return {
        "t": t,
        "M": M,
        "J": J,
        "a_star": a_star,
        "TH": TH,
        "P": P,
        "dotM": dotM_arr,
        "dotJ": dotJ_arr,
        "flags": flags,
        "chi": chi_arr,
        "t_eft": t_eft,
        "tau0": float(tau0),
        "eft_criterion": "schwarzschild_horizon_kretschmann_proxy",
    }


def evolve_bh_kerr_eft_with_spin_hysteresis(
    M0: float,
    a0_star: float = 0.0,
    dotM_acc_fn: Optional[Callable[[float, float, float], float]] = None,
    cfg: Optional[SpinEvoHysteresisConfig] = None,
) -> dict[str, Any]:
    """
    Spin-enabled phenomenological solver with EFT-core hysteresis.

    Core entry:
      chi = K(r_s) lP^4 >= threshold_in
    Core exit:
      chi <= threshold_out  (if enable_core_exit=True)

    Uses the same adaptive substep mechanism as `evolve_bh_kerr_eft_with_spin`.
    """
    if cfg is None:
        cfg = SpinEvoHysteresisConfig()

    a_lim = clamp(abs(float(cfg.a_star_max)), 0.0, 0.999_999_999)
    thr_in = float(cfg.curvature_threshold_in)
    thr_out = float(cfg.curvature_threshold_out)
    if thr_out >= thr_in:
        thr_out = 0.5 * thr_in

    M0_safe = max(abs(float(M0)), 1e-99)
    a0_signed = clamp(float(a0_star), -a_lim, a_lim)
    J_curr = J_from_spin_parameter_signed(M0_safe, a0_signed, a_star_max=a_lim)

    if dotM_acc_fn is None:
        dotM_acc_fn = accretion_constant(0.0)

    tau0 = lifetime_semiclassical(M0_safe)
    t_end = float(cfg.t_end) if cfg.t_end is not None else float(tau0)
    t_end = max(t_end, 1e-30)

    n = max(int(cfg.nsteps), 2)
    t = np.linspace(0.0, t_end, n, dtype=float)
    dt = float(t[1] - t[0])

    M = np.empty(n, dtype=float)
    J = np.empty(n, dtype=float)
    a_star = np.empty(n, dtype=float)
    TH = np.empty(n, dtype=float)
    P = np.empty(n, dtype=float)
    dotM_arr = np.empty(n, dtype=float)
    dotJ_arr = np.empty(n, dtype=float)
    flags = np.zeros(n, dtype=int)  # 0 normal, 1 core
    chi_arr = np.empty(n, dtype=float)

    M_curr = M0_safe
    in_core = False
    t_core_enter: float | None = None
    t_core_exit: float | None = None

    for i, ti in enumerate(t):
        M[i] = M_curr
        J[i] = J_curr
        a_curr = spin_parameter_from_J_signed(M_curr, J_curr, a_star_max=a_lim)
        a_star[i] = a_curr

        chi = curvature_measure_horizon_schwarzschild_proxy(M_curr)
        chi_arr[i] = chi

        if (not in_core) and (chi >= thr_in):
            in_core = True
            if t_core_enter is None:
                t_core_enter = float(ti)

        if in_core and bool(cfg.enable_core_exit) and (chi <= thr_out):
            in_core = False
            if t_core_exit is None:
                t_core_exit = float(ti)

        flags[i] = 1 if in_core else 0

        if in_core and cfg.stop_on_eft_breakdown:
            P_cap, T_cap = _kerr_observables_capped(M_curr, a_curr, cfg)
            TH[i] = T_cap
            P[i] = P_cap
            dotM_arr[i] = 0.0
            dotJ_arr[i] = 0.0
            cut = i + 1
            return {
                "t": t[:cut],
                "M": M[:cut],
                "J": J[:cut],
                "a_star": a_star[:cut],
                "TH": TH[:cut],
                "P": P[:cut],
                "dotM": dotM_arr[:cut],
                "dotJ": dotJ_arr[:cut],
                "flags": flags[:cut],
                "chi": chi_arr[:cut],
                "t_core_enter": t_core_enter,
                "t_core_exit": t_core_exit,
                "tau0": float(tau0),
                "threshold_in": thr_in,
                "threshold_out": thr_out,
                "eft_criterion": "schwarzschild_horizon_kretschmann_proxy_hysteresis",
            }

        rhs = _spin_rhs_kerr_eft(
            float(ti),
            float(M_curr),
            float(J_curr),
            bool(in_core),
            dotM_acc_fn,
            cfg,
        )
        TH[i] = rhs["TH"]
        P[i] = rhs["P_eff"]
        dotM_arr[i] = rhs["dotM_total"]
        dotJ_arr[i] = rhs["dotJ_total"]

        if i >= n - 1:
            continue

        M_curr, J_curr, in_core, t_core_enter, t_core_exit = _advance_mass_J_adaptive(
            ti=float(ti),
            dt=dt,
            M_curr=float(M_curr),
            J_curr=float(J_curr),
            in_core=bool(in_core),
            dotM_acc_fn=dotM_acc_fn,
            cfg=cfg,
            hysteresis=True,
            threshold_in=thr_in,
            threshold_out=thr_out,
            enable_core_exit=bool(cfg.enable_core_exit),
            t_core_enter=t_core_enter,
            t_core_exit=t_core_exit,
        )

    return {
        "t": t,
        "M": M,
        "J": J,
        "a_star": a_star,
        "TH": TH,
        "P": P,
        "dotM": dotM_arr,
        "dotJ": dotJ_arr,
        "flags": flags,
        "chi": chi_arr,
        "t_core_enter": t_core_enter,
        "t_core_exit": t_core_exit,
        "tau0": float(tau0),
        "threshold_in": thr_in,
        "threshold_out": thr_out,
        "eft_criterion": "schwarzschild_horizon_kretschmann_proxy_hysteresis",
    }


def demo_spin_feedback() -> dict[str, Any]:
    """
    Demo for spin-enabled phenomenological solver (short t_end for meaningful bursts).
    """
    M0 = 1e12  # kg
    cfg = SpinEvoConfig(
        nsteps=4000,
        t_end=1.0e6,  # short window; tau0 is too large for burst demos
        gamma=1.0,
        stop_on_eft_breakdown=False,
        freeze_hawking_in_core=True,
        allow_accretion_in_core=True,
        evolve_spin=True,
        accretion_torque_mode="isco",
        prograde=True,
        hawking_spin_down=True,
        hawking_xi=1.0,
        max_frac_mass_change_per_substep=0.02,
    )

    def dotM_fn(ti: float, Mi: float, ai: float) -> float:
        _ = Mi, ai
        x = ti / max(float(cfg.t_end or 1.0), 1e-99)
        return 0.0 if x < 0.7 else 1e6

    out = evolve_bh_kerr_eft_with_spin(M0, a0_star=0.4, dotM_acc_fn=dotM_fn, cfg=cfg)

    print("Experimental spin demo (phenomenological layer)")
    print(f"Start mass: {out['M'][0]:.3e} kg, start a*: {out['a_star'][0]:.4f}")
    print(f"End mass:   {out['M'][-1]:.3e} kg, end a*:   {out['a_star'][-1]:.4f}")
    print(f"t_eft:      {out['t_eft']}")
    return out


def demo_spin_hysteresis_feedback() -> dict[str, Any]:
    """
    Demo for spin + hysteresis solver.

    Uses a PBH-scale mass (so Hawking is negligible over the chosen short window)
    and *toy hysteresis thresholds* centered around the initial curvature proxy.
    This makes the core enter/exit logic observable without stiff near-Planck
    dynamics dominating the demo.
    """
    M0 = 1.0e12  # kg
    chi0 = curvature_measure_horizon_schwarzschild_proxy(M0)
    thr_in = 0.95 * chi0
    thr_out = 0.70 * chi0

    cfg = SpinEvoHysteresisConfig(
        nsteps=5000,
        t_end=1.0e6,  # s
        gamma=1.0,
        stop_on_eft_breakdown=False,
        freeze_hawking_in_core=True,
        allow_accretion_in_core=True,
        evolve_spin=True,
        prograde=True,
        hawking_spin_down=True,
        hawking_xi=1.0,
        curvature_threshold_in=thr_in,
        curvature_threshold_out=thr_out,
        enable_core_exit=True,
        max_frac_mass_change_per_substep=0.02,
    )

    # Toy pulse: no accretion -> sustained burst -> no accretion.
    def dotM_fn(ti: float, Mi: float, ai: float) -> float:
        _ = Mi, ai
        x = ti / max(float(cfg.t_end or 1.0), 1e-99)
        if x < 0.30:
            return 0.0
        if x < 0.80:
            return 1.0e6  # kg/s
        return 0.0

    out = evolve_bh_kerr_eft_with_spin_hysteresis(
        M0,
        a0_star=0.3,
        dotM_acc_fn=dotM_fn,
        cfg=cfg,
    )

    print("Experimental spin+hysteresis demo (phenomenological layer)")
    print(f"Start a*: {out['a_star'][0]:.4f}, end a*: {out['a_star'][-1]:.4f}")
    print(f"chi0:         {chi0:.3e}")
    print(f"threshold_in: {thr_in:.3e}")
    print(f"threshold_out:{thr_out:.3e}")
    print(f"chi_end:      {float(out['chi'][-1]):.3e}")
    print(f"t_core_enter: {out['t_core_enter']}")
    print(f"t_core_exit:  {out['t_core_exit']}")
    return out


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
    parser.add_argument(
        "--cycles-json-out",
        type=str,
        default="",
        help="Write remnant_cycle output as JSON for html/bh_cinema_lab.html playback.",
    )
    parser.add_argument(
        "--demo-kerr-eft",
        action="store_true",
        help=(
            "Run the experimental phenomenological module "
            "(EFT cutoff proxy + minimal Kerr-ish evaporation + accretion bursts)."
        ),
    )
    parser.add_argument(
        "--demo-spin-kerr-eft",
        action="store_true",
        help=(
            "Run the experimental spin-enabled phenomenological module "
            "(ISCO accretion torque + parametric Hawking spin-down)."
        ),
    )
    parser.add_argument(
        "--demo-spin-kerr-json-out",
        type=str,
        default="",
        help="Write the spin-demo trace as BH Cinema JSON (single wrapped cycle with a_star/chi/flags if available).",
    )
    parser.add_argument(
        "--demo-spin-hysteresis",
        action="store_true",
        help=(
            "Run the experimental spin+hysteresis demo "
            "(EFT-core enter/exit thresholds on curvature proxy)."
        ),
    )
    parser.add_argument(
        "--demo-spin-hysteresis-json-out",
        type=str,
        default="",
        help="Write the spin+hysteresis demo trace as BH Cinema JSON (single wrapped cycle).",
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
    Mrem_demo: float | None = None
    cycle_start_mass_demo: float | None = None

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

    if args.cycles_json_out:
        if not cycles:
            print("Note: --cycles-json-out requested, but no cycles were computed. Use --cycles > 0.")
            print()
        else:
            payload = remnant_cycle_json_payload(
                cycles,
                Mrem=float(Mrem_demo if Mrem_demo is not None else MP),
                n_cycles=int(args.cycles),
                nsteps=int(len(cycles[0]["t"])) if cycles else 0,
                qm_steps=max(int(args.cycle_qm_steps), 2),
                alpha=4.0,
                gamma=float(gamma_cli),
                recycle=bool(args.recycle),
                recycle_start_frac=float(args.recycle_start_frac),
                recycle_duration_frac=float(args.recycle_duration_frac),
                recycle_rate=float(args.recycle_rate),
                cycle_start_mass=cycle_start_mass_demo,
                hero_mass=cycle_start_mass_demo,
            )
            out_path = save_remnant_cycle_json(args.cycles_json_out, payload)
            print(f"Saved cycle JSON: {out_path}")
            print()

    if args.demo_kerr_eft:
        print("=== Experimental Kerr-ish EFT + accretion demo (phenomenological) ===")
        try:
            demo_eft_feedback()
        except Exception as exc:
            print(f"Demo failed: {exc}")
        print()

    if args.demo_spin_kerr_eft or args.demo_spin_kerr_json_out:
        print("=== Experimental spin Kerr-ish EFT demo (phenomenological) ===")
        spin_demo_out: dict[str, Any] | None = None
        try:
            spin_demo_out = demo_spin_feedback()
            if args.demo_spin_kerr_json_out:
                payload = bh_cinema_payload_from_evolution_trace(
                    spin_demo_out,
                    label="demo_spin_kerr_eft",
                    gamma=1.0,
                    hero_mass=float(spin_demo_out["M"][0]) if "M" in spin_demo_out else None,
                )
                out_path = save_remnant_cycle_json(args.demo_spin_kerr_json_out, payload)
                print(f"Saved spin demo JSON: {out_path}")
        except Exception as exc:
            print(f"Demo failed: {exc}")
        print()

    if args.demo_spin_hysteresis or args.demo_spin_hysteresis_json_out:
        print("=== Experimental spin+hysteresis demo (phenomenological) ===")
        spin_hyst_out: dict[str, Any] | None = None
        try:
            spin_hyst_out = demo_spin_hysteresis_feedback()
            if args.demo_spin_hysteresis_json_out:
                payload = bh_cinema_payload_from_evolution_trace(
                    spin_hyst_out,
                    label="demo_spin_hysteresis",
                    gamma=1.0,
                    hero_mass=float(spin_hyst_out["M"][0]) if "M" in spin_hyst_out else None,
                )
                out_path = save_remnant_cycle_json(
                    args.demo_spin_hysteresis_json_out,
                    payload,
                )
                print(f"Saved spin+hysteresis demo JSON: {out_path}")
        except Exception as exc:
            print(f"Demo failed: {exc}")
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
