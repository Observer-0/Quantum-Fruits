import math

# =========================
# Fundamental Constants
# =========================
hbar = 1.054571817e-34     # J·s
c    = 299792458.0         # m/s
G    = 6.67430e-11         # m^3 / (kg·s^2)
kB   = 1.380649e-23        # J/K
pi   = math.pi

# =========================
# Derived Planck Units
# =========================
def planck_length():
    return math.sqrt(hbar * G / c**3)

def planck_time():
    return math.sqrt(hbar * G / c**5)

def planck_mass():
    return math.sqrt(hbar * c / G)

def planck_energy():
    return planck_mass() * c**2

# =========================
# Your Core Quantities
# =========================
def sigma_P():
    """Planck-kovarianter Wirkungsblock [m·s]"""
    return hbar * G / c**4

def Z():
    """Quadratische Wirkungs-Skala [J²·s/m]"""
    return hbar**2 / c

def A_G():
    """Geometrische Kopplungs-Skala [G²/c⁴]"""
    return G**2 / c**4

def check_relation():
    """Z * A_G = sigma_P ?"""
    # Specifically: (hbar^2/c) * (G^2/c^4) = (hbar^2 G^2 / c^5)
    # sigma_P = hbar G / c^4.
    # So Z * A_G / sigma_P should be hbar G / c
    return Z() * A_G() / sigma_P()

# =========================
# Spin-2 Couplings
# =========================
def alpha_G(M):
    """Lineare Kopplung"""
    return G * M**2 / (hbar * c)

def chi(M):
    """Quadratische (Spin-2) Selbstkopplung"""
    ag = alpha_G(M)
    return ag**2

# =========================
# Hawking / Tick Mechanik
# =========================
def hawking_energy(M):
    """Hawking-Temperatur als Energiequant (vereinfachte Form)"""
    # T_H ~ (ħ c^3) / (8π G k_B M)
    return (hbar * c**3) / (8 * pi * G * M)

def hawking_time(M):
    """Hawking-Zeit (Skala)"""
    # t_H ~ ħ / E_H
    return hbar / hawking_energy(M)

def hawking_action(M):
    """Wirkungsquant pro Hawking-Quanten"""
    return hawking_energy(M) * hawking_time(M)

# =========================
# Entropy / Info-Index
# =========================
def bh_entropy(M):
    """Bekenstein-Hawking Entropie (ohne k_B)"""
    r_s = 2 * G * M / c**2
    A   = 4 * pi * r_s**2
    return A / (4 * planck_length()**2)

def info_index_from_action(delta_A):
    """Info-Index als Anzahl Planck-Wirkungszellen"""
    return delta_A / sigma_P()

# =========================
# Sanity Checks
# =========================
if __name__ == "__main__":
    print("=== SigmaP-Lab Formelsammlung ===\n")

    print(f"Planck length: {planck_length():.3e} m")
    print(f"Planck time:   {planck_time():.3e} s")
    print(f"Planck mass:   {planck_mass():.3e} kg")
    print(f"Planck energy: {planck_energy():.3e} J")

    print("\n--- Core SigmaP Metrics ---")
    print(f"Sigma_P: {sigma_P():.3e} m·s")
    print(f"1/Sigma_P (c^4/hbarG): {1/sigma_P():.3e} 1/(m·s)")
    print(f"Z: {Z():.3e}")
    print(f"A_G: {A_G():.3e}")
    
    # The Dimensional Aha!
    # Lambda ~ 1/(c * R * t)
    # Since [c * R * t] = [L/T * L * T] = [L^2]
    # And [c * sigma_P] = [L/T * L * T] = [L^2]
    
    print("\n--- Dimensional Consistency ---")
    print(f"[c * sigma_P] = {c * sigma_P():.3e} m^2 (Curvature Scale)")

    M_test = planck_mass()
    print("\nTestmass M = M_P")
    print(f"alpha_G(M): {alpha_G(M_test):.3e}")
    print(f"chi(M): {chi(M_test):.3e}")

    print(f"\nHawking action check: {hawking_action(M_test):.3e}")
    print(f"Should be ~ ħ: {hawking_action(M_test) / hbar:.3e}")

    print(f"\nBH entropy for M_P: {bh_entropy(M_test):.3e}")
