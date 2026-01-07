"""
bh_kernel_c0_scaffold.py
------------------------
Scaffold utilities to evaluate Kerr horizon quantities and the temporal/spatial
pieces entering the non-thermality coefficient c0 in the Planck-covariant
smearing framework.

Usage (example):
    from bh_kernel_c0_scaffold import *
    M = 10 * M_sun        # 10 solar-mass BH (kg)
    chi = 0.7             # dimensionless spin a/M in [0,1)
    tau = 1e-3            # kernel time scale (s)
    L   = 1.0             # kernel length scale (m)
    params = kerr_horizon_params(M, chi)
    eps_t, eps_s = epsilon_terms(M, chi, tau, L)
    c0_t = c0_temporal(M, chi, tau)
    
    # For spatial term you need greybody slopes and weights at the spectral peak:
    slopes_weights = [
        # {'slope_pk': d ln Gamma_lm / d ln (omega r_+) at the peak, 'weight': w_lm}
        {'slope_pk': 0.8, 'weight': 0.5},
        {'slope_pk': 0.4, 'weight': 0.3},
        {'slope_pk': 0.2, 'weight': 0.2},
    ]
    c0_total = c0_full(M, chi, tau, L, slopes_weights)
"""

from __future__ import annotations
from dataclasses import dataclass
from math import sqrt, pi
from typing import Iterable, Dict

# ---- Physical constants (SI) ----
G   = 6.67430e-11          # m^3 kg^-1 s^-2
c   = 2.99792458e8         # m s^-1
hbar= 1.054571817e-34      # J s
kB  = 1.380649e-23         # J K^-1
M_sun = 1.98847e30         # kg

@dataclass(frozen=True)
class KerrParams:
    M: float           # mass (kg)
    chi: float         # dimensionless spin a/M in [0,1)
    M_geo: float       # GM/c^2 (m)
    a_geo: float       # chi * M_geo (m)
    r_plus: float      # outer horizon radius (m)
    r_minus: float     # inner horizon radius (m)
    kappa_geo: float   # surface gravity in geometric units (1/m)
    kappa_SI: float    # surface gravity in SI (m/s^2)
    T_H: float         # Hawking temperature (K)

def kerr_horizon_params(M: float, chi: float) -> KerrParams:
    """
    Compute Kerr horizon radii, surface gravity, and Hawking temperature.
    Inputs:
        M   : mass in kg
        chi : dimensionless spin in [0,1)
    Returns:
        KerrParams dataclass.
    Notes:
        - M_geo = GM/c^2 (meters)
        - a_geo = chi * M_geo (meters)
        - r_±   = M_geo (1 ± sqrt(1-chi^2))
        - kappa_geo = (r_+ - r_-)/(2 (r_+^2 + a_geo^2))  [1/m]
        - kappa_SI  = c^2 * kappa_geo                    [m/s^2]
        - T_H = hbar * c * kappa_geo / (2π kB) = hbar * kappa_SI / (2π kB c)
    """
    if not (0.0 <= chi < 1.0):
        # In a robust code, handle chi -> 1 carefully or allow up to 1-epsilon
        raise ValueError("chi must satisfy 0 <= chi < 1")
    M_geo = G * M / c**2
    a_geo = chi * M_geo
    s = sqrt(1.0 - chi**2)
    r_plus  = M_geo * (1.0 + s)
    r_minus = M_geo * (1.0 - s)
    # The standard formula for surface gravity kappa of a Kerr BH:
    # kappa = (r_+ - r_-) / (2 (r_+^2 + a^2))
    # Check dimensions: [L] / [L^2] = [1/L]. Correct for geometric units.
    denom = 2.0 * (r_plus**2 + a_geo**2)
    kappa_geo = (r_plus - r_minus) / denom    # 1/m
    kappa_SI  = c**2 * kappa_geo               # m/s^2
    
    T_H = hbar * c * kappa_geo / (2.0 * pi * kB)
    
    return KerrParams(M, chi, M_geo, a_geo, r_plus, r_minus, kappa_geo, kappa_SI, T_H)

def epsilon_terms(M: float, chi: float, tau: float, L: float) -> tuple[float, float]:
    """
    Return (eps_t, eps_s) where:
        eps_t = (tau * kappa_SI / c)  -- temporal piece, dimensionless
        eps_s = (L / r_plus)          -- spatial piece, dimensionless
    """
    p = kerr_horizon_params(M, chi)
    eps_t = tau * p.kappa_SI / c
    eps_s = L / p.r_plus
    return eps_t, eps_s

def c0_temporal(M: float, chi: float, tau: float) -> float:
    """
    Temporal contribution to c0:
        c0_t = (π^2 / 6) * (tau * kappa_SI / c)^2
    """
    # Just need kappa_SI
    p = kerr_horizon_params(M, chi)
    eps_t = tau * p.kappa_SI / c
    return (pi**2 / 6.0) * (eps_t**2)

def c0_spatial(M: float, chi: float, L: float, slopes_weights: Iterable[Dict[str, float]]) -> float:
    """
    Spatial contribution to c0:
        c0_s = 0.5 * (L / r_+)^2 * sum_{lm} w_{lm} * (slope_{lm})^2
    where slope_{lm} = [∂_{ln(ω r_+)} ln Γ_{lm}] evaluated at ω = ω_pk,
    and weights w_{lm} are normalized (sum to 1) contributions of each mode to dN/dω dt at the peak.
    """
    p = kerr_horizon_params(M, chi)
    eps_s = L / p.r_plus
    
    # Normalize weights in case the user does not pre-normalize
    sw = list(slopes_weights)
    wsum = sum(item['weight'] for item in sw) if sw else 0.0
    if wsum <= 0.0:
        return 0.0
    
    norm = 1.0 / wsum
    # slope_pk is dimensionless (log-log derivative)
    weighted_slope2 = sum((item['weight'] * norm) * (item['slope_pk'] ** 2) for item in sw)
    
    return 0.5 * (eps_s ** 2) * weighted_slope2

def c0_full(M: float, chi: float, tau: float, L: float, slopes_weights: Iterable[Dict[str, float]]) -> float:
    """
    Total c0 = c0_temporal + c0_spatial + O(ε^3). The O(ε^3) terms are beyond this scaffold.
    """
    return c0_temporal(M, chi, tau) + c0_spatial(M, chi, L, slopes_weights)


# ---- Demo if run as a script ----
if __name__ == "__main__":
    # Example: 10 M_sun, chi=0.7, tau=1e-3 s, L=1 m
    # Note: tau and L should be related to sigma_P scales in the full theory,
    # but here act as effective smearing parameters.
    print("=== BH Kernel c0 Scaffold Demo ===")
    
    M = 10.0 * M_sun
    chi = 0.7
    tau = 1e-3
    L = 1.0
    
    print(f"M = {M:.3e} kg, chi = {chi:.2f}")
    
    params = kerr_horizon_params(M, chi)
    print("Kerr Params Object:", params)
    print(f"T_H = {params.T_H:.3e} K")
    
    eps_t, eps_s = epsilon_terms(M, chi, tau, L)
    print(f"eps_t = {eps_t:.3e}")
    print(f"eps_s = {eps_s:.3e}")
    
    c0_t = c0_temporal(M, chi, tau)
    print(f"c0_temporal = {c0_t:.3e}")
    
    # Placeholder mode slopes/weights (user should replace with Teukolsky results)
    slopes_weights = [
        {'slope_pk': 0.8, 'weight': 0.5},
        {'slope_pk': 0.4, 'weight': 0.3},
        {'slope_pk': 0.2, 'weight': 0.2},
    ]
    c0_s = c0_spatial(M, chi, L, slopes_weights)
    print(f"c0_spatial  = {c0_s:.3e}")
    
    c0_tot = c0_full(M, chi, tau, L, slopes_weights)
    print(f"c0_total    = {c0_tot:.3e}")
    print("Done.")
