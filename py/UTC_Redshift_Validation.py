"""
py/UTC_Redshift_Validation.py
-----------------------------
Deep Validation of the Unified Thermodynamic Cosmology (UTC) model.
Implements redshift transformation, jerk analysis, and Zander-Index curvature diagnostics.
"""

import numpy as np
import matplotlib.pyplot as plt
from Unified_Hubble_Tension import UnifiedCosmology, PhysicalConstants

# Framework Values
hbar = 1.054571817e-34
G = 6.67430e-11
c = 2.99792458e8
MP = 2.176434e-8
sigma_P = hbar * G / (c**4)
l_P = np.sqrt(sigma_P * c)
t_P = np.sqrt(sigma_P / c)

def check_redshift_relation(model):
    """
    Transforms simulation data into observable z-values 
    and checks the H(z) Relation.
    """
    a = model.solution.y[0]
    H = model.solution.y[1]
    T = model.solution.y[2]
    
    # Define 'today' as a point in late expansion where H ~ 73
    target_H = 73.0
    idx_now = np.argmin(np.abs(H - target_H))
    a_now = a[idx_now]
    
    # Calculate redshift z
    z = (a_now / a) - 1
    
    # Filter for positive redshifts (looking into the past)
    mask = (z >= 0) & (z < 10)
    return z[mask], H[mask], T[mask]

def analyze_jerk_and_dynamics(z_sim, H_sim):
    """
    Numerical derivative of H with respect to z to check expansion dynamics.
    """
    # Gradient requires sorted x, but z_sim is looking back. 
    # Let's sort just for the gradient calculation if needed.
    idx_sort = np.argsort(z_sim)
    z_sorted = z_sim[idx_sort]
    H_sorted = H_sim[idx_sort]
    
    dH_dz = np.gradient(H_sorted, z_sorted)
    jerk = dH_dz / (H_sorted + 1e-9) 
    
    return z_sorted, dH_dz, jerk

def run_si_cross_check():
    """
    Scales cosmic density to Planck density and calculates Zander-Index.
    """
    rho_planck = MP / l_P**3
    K_crit = 1.0 / (l_P**4)
    
    H_73_si = 73.0 * (1e3 / 3.086e22) 
    H_67_si = 67.0 * (1e3 / 3.086e22) 
    
    chi_73 = ((H_73_si**2 / c**2)**2) * l_P**4
    chi_67 = ((H_67_si**2 / c**2)**2) * l_P**4
    
    return chi_73, chi_67, K_crit

if __name__ == "__main__":
    # 1. Run Base Simulation
    model = UnifiedCosmology()
    model.simulate(t_span=(0.0, 300.0), n_points=10000)
    
    # 2. Redshift Transformation
    z_vals, h_vals, t_vals = check_redshift_relation(model)
    
    # 3. Observational Comparison Plot
    plt.figure(figsize=(12, 7))
    plt.plot(z_vals, h_vals, color='#10b981', linewidth=3, label='UTC Model (Zander)')
    plt.errorbar(0.05, 73.2, yerr=1.3, fmt='ro', label='SH0ES (SNe Ia)', capsize=5)
    plt.errorbar(1.5, 69.5, yerr=2.5, fmt='mo', label='Quasars / BAO', capsize=5)
    plt.axhline(67.4, color='blue', linestyle='--', alpha=0.6, label='Planck CMB (ΛCDM Pred.)')
    
    plt.xlabel('Redshift $z$', fontsize=12)
    plt.ylabel('$H(z)$ [km/s/Mpc]', fontsize=12)
    plt.title('UTC Model vs. Observational Constraints', fontweight='bold')
    plt.grid(True, linestyle=':', alpha=0.7)
    plt.gca().invert_xaxis() 
    plt.legend()
    plt.show()
    
    # 4. Jerk Analysis
    z_sorted, dH_dz, jerk = analyze_jerk_and_dynamics(z_vals, h_vals)
    
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10), sharex=True)
    ax1.plot(z_sorted, dH_dz, color='darkorange', linewidth=2, label='dH/dz (Exp. Gradient)')
    ax1.set_ylabel('Rate $dH/dz$')
    ax1.set_title('Dynamics: Gradient Check')
    ax1.grid(True, alpha=0.3)
    ax2.plot(z_sorted, jerk, color='crimson', linewidth=2, label='Jerk Indicator')
    ax2.axhline(0, color='black', linestyle='--', alpha=0.5)
    ax2.set_xlabel('Redshift $z$')
    ax2.set_ylabel('Rel. Jerk')
    ax1.legend(); ax2.legend()
    plt.tight_layout()
    plt.show()
    
    # 5. SI Cross Check
    chi_73, chi_67, K_crit = run_si_cross_check()
    print(f"\n--- SI-Validation (Zander Framework) ---")
    print(f"Critical Curvature Limit (1/l_P^4): {K_crit:.3e} m^-4")
    print(f"Zander-Index today (H=73): {chi_73:.3e}")
    print(f"Zander-Index CMB (H=67):   {chi_67:.3e}")
    print("-" * 40)
    print("Interpretation: The Zander-Index measures the coupling between")
    print("the macroscopic Hubble flow and the micro-scale Planck curvature.")
