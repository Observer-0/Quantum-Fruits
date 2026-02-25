"""Symbolic scratchpad for Schwarzschild metric terms and Sigma_P checks."""

import sympy as sp

# Symbols and constants
hbar, G, c, sigma_P = sp.symbols("hbar G c sigma_P", positive=True)
t, r, theta, phi = sp.symbols("t r theta phi")
M = sp.symbols("M", positive=True)

v2 = hbar * c**3 / (G * M**2)
expr_from_sigma = hbar * G / v2
expr_reference = G**2 * M**2 / c**3

print("v^2 =", v2)
print("expr_from_sigma =", expr_from_sigma)
print("expr_reference =", expr_reference)
print("Expressions equal?", sp.simplify(expr_from_sigma - expr_reference) == 0)

# Metric components (Schwarzschild ansatz)
f = 1 - 2 * G * M / (c**2 * r)
g_tt = -f
g_rr = 1 / f
g_thth = r**2
g_phph = r**2 * sp.sin(theta) ** 2

# Metric tensor
g = sp.Matrix(
    [
        [g_tt, 0, 0, 0],
        [0, g_rr, 0, 0],
        [0, 0, g_thth, 0],
        [0, 0, 0, g_phph],
    ]
)

# Symbolic curvature placeholders
R = sp.symbols("R")  # Ricci scalar
G_mn = sp.symbols("G_mn")  # Einstein tensor
T_mn = sp.symbols("T_mn")

# Modified field equation (symbolic)
lhs = (hbar / (sigma_P * c**2)) * G_mn + (1 / (4 * c)) * g
rhs = (sigma_P * c**2 / hbar) * T_mn

print("Modified field equation:")
sp.pprint(lhs, use_unicode=True)
print("=")
sp.pprint(rhs, use_unicode=True)

# Spin-2 operator (symbolic)
h_mn = sp.symbols("h_mn")
dalembert = sp.symbols("Box")
spin2_eq = dalembert * h_mn - (1 / (4 * c)) * h_mn

print("\nSpin-2 field equation (symbolic):")
sp.pprint(spin2_eq, use_unicode=True)
