"""Tick utilities for sigma_P lab

Provides a Tick class and helper functions mirroring the project's JS helpers.
"""
from dataclasses import dataclass

# Constants (SI)
HBAR = 1.054e-34
G = 6.674e-11
C = 2.998e8
K_B = 1.381e-23

SIGMA_P = HBAR * G / C**4


@dataclass
class Tick:
    action: float = SIGMA_P

    def __add__(self, other: 'Tick') -> 'Tick':
        return Tick(self.action + other.action)

    def __mul__(self, n: float) -> 'Tick':
        return Tick(self.action * n)


def ticks(total_action: float, hbar: float = HBAR) -> float:
    return total_action / hbar


def chi(M: float, G_val: float = G, hbar: float = HBAR, c: float = C) -> float:
    return (G_val * M * M) / (hbar * c**3)


def hawking_rate(M: float, constants: dict | None = None) -> float:
    if constants is None:
        constants = {'G': G, 'hbar': HBAR, 'c': C}
    chi_m = chi(M, constants['G'], constants['hbar'], constants['c'])
    return 1.0 / (chi_m**0.5)


def alpha_G(M: float, G_val: float = G, hbar: float = HBAR, c: float = C) -> float:
    return (G_val * M) / (hbar * c)
