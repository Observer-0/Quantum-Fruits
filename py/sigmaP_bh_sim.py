import math
import numpy as np
import matplotlib.pyplot as plt

# ============================================================
# Fundamental constants (precise CODATA 2018/2019)
# ============================================================
hbar = 1.054571817e-34      # J·s
c    = 2.99792458e8          # m/s
G    = 6.67430e-11           # m³ kg⁻¹ s⁻²
kB   = 1.380649e-23          # J/K
pi   = math.pi

# ============================================================
# Zander σ_P framework – Quanta of Action-Area
# ============================================================
sigmaP = hbar * G / c**4                 # fundamental quantum of action-area [m·s]
lP = math.sqrt(sigmaP * c)                # Planck length [m]
tP = math.sqrt(sigmaP / c)                # Planck time [s]
MP = math.sqrt(hbar * c / G)              # Planck mass [kg]
Z_int = hbar**2 / c                       # interaction quantum [J²·s / m]
M_sun = 1.989e30                          # solar mass [kg]

# Maximal update rate of spacetime
planck_frequency = 1.0 / tP               # ~1.86e43 Hz

# ============================================================
# Core Framework Functions (from Formelsammlung)
# ============================================================
def alpha_G(M: float) -> float:
    """Gravitationskopplung (Massenskala): G * M / (hbar * c)"""
    return (G * M) / (hbar * c)

def chi(M: float) -> float:
    """Dimensionloser Parameter chi: G * M^2 / (hbar * c^3)"""
    return (G * M**2) / (hbar * c**3)

def tick_index(energy: float, time: float) -> float:
    """Tick-Index i = (E * t) / sigma_P."""
    return (energy * time) / sigmaP

def i_max_constant() -> float:
    """i_max = hbar / sigma_P = c^4 / G (Planck Force)."""
    return c**4 / G

def bh_tick_count(M: float) -> float:
    """N_ticks for a BH: 4 * pi * chi(M)"""
    return 4.0 * pi * chi(M)

# ============================================================
# Basic GR / Hawking quantities
# ============================================================
def schwarzschild_radius(M: float) -> float:
    return 2.0 * G * M / c**2

def hawking_temperature(M: float) -> float:
    M_safe = np.maximum(M, 1e-99)
    return hbar * c**3 / (8.0 * pi * G * M_safe * kB)

def bh_entropy(M: float) -> float:
    rs = schwarzschild_radius(M)
    A = 4.0 * pi * rs**2
    return kB * c**3 * A / (4.0 * hbar * G)

def lifetime_semiclassical(M0: float) -> float:
    return 5120.0 * pi * G**2 * M0**3 / (hbar * c**4)

# ============================================================
# Evaporation models
# ============================================================
def evaporate_semiclassical(M0: float, nsteps: int = 2000):
    """Standard continuum Hawking evaporation (non-unitary)."""
    tau = lifetime_semiclassical(M0)
    t = np.linspace(0.0, tau, nsteps)
    M = M0 * np.maximum(1.0 - t / tau, 0.0) ** (1.0 / 3.0)
    M_safe = np.maximum(M, 1e-99)
    TH = hawking_temperature(M_safe)
    S = bh_entropy(M_safe)
    S_rad = S[0] * t / tau                       # simple lost entropy proxy
    return t, M, TH, S, S_rad, tau

# ============================================================
# Zander Alternative: Spin-Mass Interplay (Action vs. Gravity)
# ============================================================

def simulate_spin_mass_interplay(M0: float, nsteps: int = 2000):
    """
    Alternative model: Interaction between core action (hbar) 
    and external mass burden (G).
    - Initial phase: High spin, low load -> High 'Action Potential'.
    - Accretion phase: Mass builds up, 'brakes' the core spin.
    - Result: A peak in 'Pure Attraction' followed by a decline.
    """
    t = np.linspace(0.0, 10.0, nsteps) # Arbitrary time scale for demo
    
    # Core potential starts at max action i_max
    potential_action = np.ones_like(t) * i_max_constant()
    
    # Mass burden grows (accretion / 'last' from outside)
    mass_load = M0 * (1.0 - np.exp(-0.5 * t))
    
    # Braking effect: Mass reibs against the core rotation
    braking_force = (G * mass_load) / (schwarzschild_radius(M0)**2 + lP**2)
    
    # Net Effective Attraction (Potential)
    # The 'Spin-up' is represented by the initial gap where mass_load is low
    potential_net = potential_action - braking_force
    
    # Page-like return: Transformation of this stress into 'Radiation' (Ticks)
    # When braking wins, the system 'cools' or transforms into stars/radiation
    transformation_rate = np.maximum(braking_force / potential_action, 0.0)
    
    return t, potential_net, mass_load, transformation_rate


def evaporate_full_quantum(M0: float, nsteps: int = 3000):
    """
    Full quantum σ_P-regularized model (Unitary).
    """
    tau0 = 5120.0 * pi * G**2 * M0**3 / (hbar * c**4)
    t = np.linspace(0.0, tau0 * 1.3, nsteps)
    dt = t[1] - t[0]

    Mrem = MP
    T_max = Z_int / (sigmaP * kB)
    
    M = np.empty_like(t)
    TH = np.empty_like(t)
    S = np.empty_like(t)
    
    M_curr = M0
    for i, ti in enumerate(t):
        M[i] = M_curr
        S[i] = bh_entropy(max(M_curr, 1e-99))
        TH[i] = min(hawking_temperature(max(M_curr, 1e-99)), T_max)
        
        if M_curr > Mrem:
            alpha = 4.0
            denom = M_curr**2 + alpha * MP**2
            dMdt = -hbar * c**4 / (15360.0 * pi * G**2 * denom)
            M_curr = max(M_curr + dMdt * dt, Mrem)
        else:
            M_curr = Mrem
            
    idx_rem = np.argmax(M <= Mrem * 1.01)
    idx_rem = len(t)-1 if idx_rem == 0 else idx_rem
    tau_eff = t[idx_rem]
    
    S0 = bh_entropy(M0)
    Srem = bh_entropy(Mrem)
    S_rad = np.zeros_like(t)
    t_page = 0.5 * tau_eff
    
    for i, ti in enumerate(t):
        if ti <= t_page:
            S_rad[i] = 0.5 * S0 * (ti / t_page)
        else:
            span = max(tau_eff - t_page, 1e-99)
            frac = min((ti - t_page) / span, 1.0)
            S_rad[i] = Srem + (0.5 * S0 - Srem) * math.exp(-4.0 * frac)
        if ti > tau_eff:
            S_rad[i] = Srem
            
    return t, M, TH, S, S_rad, tau_eff, Srem

# ============================================================
# Main demo
# ============================================================
if __name__ == "__main__":
    print("=== Zander σ_P Framework – Quanta of Action-Area ===")
    print(f"σ_P (quantum of action-area) = {sigmaP:.3e} m·s")
    print(f"Planck time t_P = {tP:.3e} s  →  maximal spacetime update rate ≈ {planck_frequency:.3e} Hz")
    print(f"i_max (Planck Force) = {i_max_constant():.3e}")
    
    # Example BH Tick checks
    m_test = 1e12 # PBH
    print(f"BH (M={m_test:.1e}kg) Tick Count: {bh_tick_count(m_test):.3e}")

    # Glühbirne analogy
    power = 60.0
    char_time = 1.0
    n_ticks_bulb = tick_index(power, char_time)
    print(f"60 W Glühbirne (1s): ≈ {n_ticks_bulb:.3e} ticks")
    print(f"→ extremely quiet compared to i_max {i_max_constant():.3e}\n")

    # 3. Zander Alternative: Spin-Mass Interplay (Action vs Gravity)
    print("--- Alternative: Spin-Mass Interplay (Action vs Gravity) ---")
    m_test_spin = 1e30 # ~1 solar mass core
    t_sm, pot_net, m_load, trans_rate = simulate_spin_mass_interplay(m_test_spin)
    
    print(f"Testing Core (M={m_test_spin:.1e}kg):")
    print(f"  Initial Action Potential: {pot_net[0]:.3e} Newtons (Planck-Force limit)")
    idx_peak = np.argmin(pot_net) # Technically for this model it's a decline, 
                                 # but let's check the braking impact
    print(f"  Max Mass Load reached: {m_load[-1]:.3e} kg")
    print(f"  Final Net Potential (after braking): {pot_net[-1]:.3e} Newtons")
    print(f"  Transformation Rate (Braking win): {trans_rate[-1]*100:.1f}%")
    print("-" * 40)
    print("Fazit: Der Kern wird durch die Masse 'belastet', was die Krümmung stabilisiert.")
    print()

    # 4. Example BHs
    samples = [
        ("Primordial BH", 1e12),
        ("Stellar BH", 10 * M_sun),
        ("Supermassive BH", 1e9 * M_sun),
    ]

    for name, M0 in samples:
        t_sc, _, _, _, _, tau_sc = evaporate_semiclassical(M0)
        t_q, _, _, _, _, tau_q, Srem = evaporate_full_quantum(M0)

        print(f"[{name}] M0 = {M0:.3e} kg")
        print(f"  Semiclassical lifetime: {tau_sc:.3e} s → evaporates to nothing")
        print(f"  Full quantum lifetime : {tau_q:.3e} s → stable remnant (S_rem/k_B ≈ {Srem/kB:.3e})")
        print()
