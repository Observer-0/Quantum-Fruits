import sys
import numpy as np
import matplotlib.pyplot as plt
from scipy.integrate import solve_ivp

# ============================================================
# Central Constant Definitions (Zander Framework)
# ============================================================
hbar = 1.0545718e-34
G = 6.67430e-11
c = 2.99792458e8
sigma_P = (hbar * G) / (c**4)  # The fundamental LT-Quant
kB = 1.380649e-23
M_sun = 1.989e30

def print_header():
    print("========================================================")
    print("   QUANTUM FRUITS LAB - ADVANCED SIMULATION SUITE")
    print("   Framework: Zander (S = Relativity)")
    print(f"   Sigma_P: {sigma_P:.4e} m*s")
    print("========================================================\n")

# ============================================================
# 1. Particle Trajectory in Sigma_P Field
# ============================================================
def sim_particle_trajectory():
    print(">>> Simulating Particle Trajectory (sigma_P modified)...")
    
    M_bh = 10 * M_sun # 10 Solar Masses
    rs = (2 * G * M_bh) / (c**2)
    r0_rs = 3.0
    v_phi_factor = 0.6
    
    # Initial: [r, phi, vr, vphi]
    y0 = [r0_rs * rs, 0, 0, v_phi_factor * 0.5 * c]

    def zander_ode(t, state):
        r, phi, vr, vphi = state
        
        # Effective potential including sigma_P smoothing
        # Prevents r=0 singularity by adding scale in denominator
        eff_r = np.sqrt(r**2 + (sigma_P*c)**2) 
        
        # Dynamics
        dr_dt = vr
        dphi_dt = vphi / r
        # Modified acceleration: Standard Newtonian + Centrifugal + Zander Correction implied by potential
        dvr_dt = - (G * M_bh) / eff_r**2 + (vphi**2 / r)
        dvphi_dt = - (vr * vphi) / r
        
        return [dr_dt, dphi_dt, dvr_dt, dvphi_dt]

    t_span = (0, 0.001) 
    t_eval = np.linspace(0, 0.001, 10000)
    
    sol = solve_ivp(zander_ode, t_span, y0, t_eval=t_eval, method='RK45')
    
    # Plotting
    r = sol.y[0]
    phi = sol.y[1]
    x = r * np.cos(phi)
    y = r * np.sin(phi)

    plt.figure(figsize=(8,8))
    plt.plot(x, y, label=r'Particle Trajectory ($\sigma_P$-corrected)', color='cyan')
    circle = plt.Circle((0, 0), rs, color='black', label='Event Horizon ($r_S$)')
    plt.gca().add_patch(circle)

    plt.title(r"S = Relativity: Geodesic in $\sigma_P$-Field")
    plt.xlabel("Distance [m]")
    plt.ylabel("Distance [m]")
    plt.legend()
    plt.axis('equal')
    plt.grid(True, alpha=0.3)
    plt.show()
    print("Plot generated.\n")


# ============================================================
# 2. Photon Deflection (Lensing)
# ============================================================
def sim_photon_deflection():
    print(">>> Simulating Photon Deflection...")
    
    M_obj = M_sun
    rs = (2 * G * M_obj) / (c**2)
    impact_parameter_rs = 2.5
    b = impact_parameter_rs * rs
    
    # Start far away: x = -20*rs, y = b
    y0 = [-20 * rs, b, c, 0] # [x, y, vx, vy]

    def photon_ode(t, state):
        x, y, vx, vy = state
        r = np.sqrt(x**2 + y**2)
        
        # Regularization via sigma_P
        r_eff = np.sqrt(r**2 + (sigma_P*c)**2)
        
        # Acceleration (Geodesic Curvature)
        mag_a = (2 * G * M_obj) / r_eff**3  # Factor 2 for GR light bending
        
        # Zander Term: Quantum Dispersion Effect
        # For very small r, sigma_P counteracts curvature slightly
        zander_corr = 1 - (sigma_P * c / r_eff)
        
        ax = -mag_a * x * zander_corr
        ay = -mag_a * y * zander_corr
        
        return [vx, vy, ax, ay]

    t_span = (0, 1e-3)
    t_eval = np.linspace(0, 1e-3, 5000)
    
    sol = solve_ivp(photon_ode, t_span, y0, t_eval=t_eval, rtol=1e-9)
    
    # Plotting
    plt.figure(figsize=(10, 5))
    plt.plot(sol.y[0]/rs, sol.y[1]/rs, label=r'Photon Path ($\sigma_P$-corrected)', color='gold', lw=2)
    plt.gca().add_patch(plt.Circle((0, 0), 1.0, color='black', label='Black Hole ($r_S$)'))

    plt.title("Photon Lensing: Gravity as Tick-Interaction")
    plt.xlabel("x / $r_S$")
    plt.ylabel("y / $r_S$")
    plt.axhline(sol.y[1][0]/rs, color='gray', linestyle='--', alpha=0.3, label='Original Path')
    plt.legend()
    plt.grid(True, alpha=0.1)
    plt.axis('equal')
    plt.show()
    print("Plot generated.\n")


# ============================================================
# 3. Orbital Precession
# ============================================================
def sim_precession():
    print(">>> Simulating Orbital Precession (Mercury-like)...")

    M_star = 2e30 
    rs = (2 * G * M_star) / (c**2)
    r0_factor = 4.0
    e = 0.3
    num_orbits = 5 # Reduced for speed in demo

    a = r0_factor * rs 
    r0 = a * (1 + e)
    v0 = np.sqrt(G * M_star * (1 - e) / (a * (1 + e)))
    y0 = [r0, 0, 0, v0] # r, phi, vr, vphi

    def zander_precession_ode(t, state):
        r, phi, vr, vphi = state
        r_eff = np.sqrt(r**2 + (sigma_P*c)**2)
        
        # 1. GR Effect term (modified 1/r^2 force)
        # 1 + 3(L/c r)^2 correction
        a_art = - (G * M_star) / r_eff**2 * (1 + 3 * (vphi * r)**2 / (c**2 * r_eff**2))
        
        # 2. Zander Correction
        f_sigma = 1 + (sigma_P * c / r_eff)**2
        
        dr_dt = vr
        dphi_dt = vphi / r
        dvr_dt = a_art * f_sigma + (vphi**2 / r)
        dvphi_dt = - (vr * vphi) / r
        
        return [dr_dt, dphi_dt, dvr_dt, dvphi_dt]

    T_orbit = 2 * np.pi * np.sqrt(a**3 / (G * M_star))
    t_span = (0, T_orbit * num_orbits)
    t_eval = np.linspace(0, t_span[1], 20000)
    
    sol = solve_ivp(zander_precession_ode, t_span, y0, t_eval=t_eval, rtol=1e-10)
    
    # Plotting
    r = sol.y[0]
    phi = sol.y[1]
    x = r * np.cos(phi)
    y = r * np.sin(phi)

    plt.figure(figsize=(8,8))
    plt.plot(x/rs, y/rs, lw=0.5, color='cyan', label='Precessing Orbit')
    plt.plot(x[-100:]/rs, y[-100:]/rs, lw=2, color='red', label='Last Orbit segment')
    plt.gca().add_patch(plt.Circle((0, 0), 1.0, color='black', label='Mass ($r_S$)'))

    plt.title(f"Perihelion Precession in Zander-Framework ($S = Relativity$)")
    plt.xlabel("x / $r_S$")
    plt.ylabel("y / $r_S$")
    plt.legend()
    plt.axis('equal')
    plt.grid(True, alpha=0.2)
    plt.show()
    print("Plot generated.\n")


# ============================================================
# 4. Page Curve (Spin vs Brake)
# ============================================================
def sim_page_curve_model():
    print(">>> Simulating Page Curve (Information Return)...")
    
    M0_kg = 1e30
    t = np.linspace(0, 100, 1000)
    
    # 1. Thermodynamische Entropie (Bekenstein-Hawking)
    # S_bh drops as mass evaporates
    S_bh = (1 - t/100)**2 
    
    # 2. Radiation Entropy (S_rad)
    # Rises during entanglement phase, Falls during return phase
    S_rad = np.zeros_like(t)
    page_point = 50 
    
    for i in range(len(t)):
        if i < page_point:
            # Phase 1: Entanglement builds up
            S_rad[i] = (t[i]/page_point) * 1.0 # Normalized
        else:
            # Phase 2: Information returns (S=Relativity)
            # Curve follows the remaining BH entropy
            S_rad[i] = S_bh[i]
            
    # Plotting
    plt.figure(figsize=(10, 6))
    plt.plot(t, S_bh, 'k--', label='Black Hole Entropy ($S_{BH}$)')
    plt.plot(t, S_rad, 'r-', lw=2, label='Radiation Entropy (Page Curve)')

    plt.axvline(50, color='gray', linestyle=':', label='Page Time (Information Return)')
    plt.fill_between(t, 0, S_rad, color='red', alpha=0.1)

    plt.title(r"The Zander-Page-Curve: Information Conservation via $\sigma_P$")
    plt.xlabel("Time (Evaporation %)")
    plt.ylabel("Entropy $S / k_B$ (Normalized)")
    plt.legend()
    plt.grid(True, alpha=0.2)
    plt.show()
    print("Plot generated.\n")


# ============================================================
# Main Menu
# ============================================================
def main():
    while True:
        print_header()
        print("Select Simulation:")
        print("1. Particle Trajectory (Geodesic)")
        print("2. Photon Deflection (Lensing)")
        print("3. Orbital Precession (Mercury)")
        print("4. Page Curve (Information Return)")
        print("q. Quit")
        
        choice = input("\nChoice > ")
        
        if choice == '1':
            sim_particle_trajectory()
        elif choice == '2':
            sim_photon_deflection()
        elif choice == '3':
            sim_precession()
        elif choice == '4':
            sim_page_curve_model()
        elif choice.lower() == 'q':
            print("Exiting.")
            sys.exit()
        else:
            print("Invalid choice.")
        
        input("Press Enter to continue...")
        print("\n\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted.")
