"""Core sigma_P consistency relations.

This module centralizes the model's baseline identities:

    sigma_P = hbar * G / c^4
    l_P^2   = hbar * G / c^3 = sigma_P * c
    N_sigma = (R * t) / sigma_P
    alpha_s = sigma_P / (R * t)
    Lambda  = alpha_s / l_P^2 = 1 / (c * R * t)
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class FundamentalConstants:
    hbar: float = 1.054571817e-34
    G: float = 6.67430e-11
    c: float = 2.99792458e8
    light_year_m: float = 9.4607e15
    seconds_per_year: float = 365.25 * 24.0 * 3600.0


DEFAULT_CONSTANTS = FundamentalConstants()


def sigma_p(constants: FundamentalConstants = DEFAULT_CONSTANTS) -> float:
    return constants.hbar * constants.G / constants.c**4


def planck_length_squared(constants: FundamentalConstants = DEFAULT_CONSTANTS) -> float:
    return constants.hbar * constants.G / constants.c**3


def alpha_sigma(
    radius_m: float, time_s: float, constants: FundamentalConstants = DEFAULT_CONSTANTS
) -> float:
    _validate_window(radius_m, time_s)
    return sigma_p(constants) / (radius_m * time_s)


def n_sigma(
    radius_m: float, time_s: float, constants: FundamentalConstants = DEFAULT_CONSTANTS
) -> float:
    _validate_window(radius_m, time_s)
    return (radius_m * time_s) / sigma_p(constants)


def lambda_from_alpha(
    radius_m: float, time_s: float, constants: FundamentalConstants = DEFAULT_CONSTANTS
) -> float:
    alpha = alpha_sigma(radius_m, time_s, constants)
    return alpha / planck_length_squared(constants)


def lambda_from_window(
    radius_m: float, time_s: float, constants: FundamentalConstants = DEFAULT_CONSTANTS
) -> float:
    _validate_window(radius_m, time_s)
    return 1.0 / (constants.c * radius_m * time_s)


def cosmic_window_now(constants: FundamentalConstants = DEFAULT_CONSTANTS) -> tuple[float, float]:
    radius_m = 46.5e9 * constants.light_year_m
    age_s = 13.8e9 * constants.seconds_per_year
    return radius_m, age_s


def consistency_snapshot(
    radius_m: float, time_s: float, constants: FundamentalConstants = DEFAULT_CONSTANTS
) -> dict[str, float]:
    sp = sigma_p(constants)
    lp2 = planck_length_squared(constants)
    ns = n_sigma(radius_m, time_s, constants)
    alpha = alpha_sigma(radius_m, time_s, constants)
    lam_alpha = lambda_from_alpha(radius_m, time_s, constants)
    lam_window = lambda_from_window(radius_m, time_s, constants)
    invariant = 1.0 / (constants.c * sp)

    return {
        "sigma_p": sp,
        "lP2": lp2,
        "N_sigma": ns,
        "alpha_sigma": alpha,
        "lambda_from_alpha": lam_alpha,
        "lambda_from_window": lam_window,
        "lambda_times_N_sigma": lam_alpha * ns,
        "inverse_c_sigma_p": invariant,
    }


def run_consistency_checks(
    radius_m: float,
    time_s: float,
    rel_tol: float = 1e-12,
    abs_tol: float = 0.0,
    constants: FundamentalConstants = DEFAULT_CONSTANTS,
) -> dict[str, bool]:
    snap = consistency_snapshot(radius_m, time_s, constants)

    def rel_close(a: float, b: float) -> bool:
        scale = max(abs(a), abs(b))
        threshold = max(abs_tol, rel_tol * scale)
        return abs(a - b) <= threshold

    checks = {
        "sigma_p_equals_lP2_over_c": rel_close(
            snap["sigma_p"], snap["lP2"] / constants.c
        ),
        "alpha_times_nsigma_is_one": rel_close(
            snap["alpha_sigma"] * snap["N_sigma"], 1.0
        ),
        "lambda_definitions_match": rel_close(
            snap["lambda_from_alpha"], snap["lambda_from_window"]
        ),
        "lambda_nsigma_invariant": rel_close(
            snap["lambda_times_N_sigma"], snap["inverse_c_sigma_p"]
        ),
    }
    return checks


def _validate_window(radius_m: float, time_s: float) -> None:
    if radius_m <= 0.0:
        raise ValueError("radius_m must be positive.")
    if time_s <= 0.0:
        raise ValueError("time_s must be positive.")


if __name__ == "__main__":
    radius, age = cosmic_window_now()
    checks = run_consistency_checks(radius, age)
    snapshot = consistency_snapshot(radius, age)

    print("=== sigma_P core consistency ===")
    print(f"sigma_P              = {snapshot['sigma_p']:.6e} m*s")
    print(f"l_P^2                = {snapshot['lP2']:.6e} m^2")
    print(f"N_sigma              = {snapshot['N_sigma']:.6e}")
    print(f"alpha_sigma          = {snapshot['alpha_sigma']:.6e}")
    print(f"Lambda(alpha)        = {snapshot['lambda_from_alpha']:.6e} 1/m^2")
    print(f"Lambda(window)       = {snapshot['lambda_from_window']:.6e} 1/m^2")
    print()
    for name, ok in checks.items():
        status = "OK" if ok else "FAIL"
        print(f"[{status}] {name}")
