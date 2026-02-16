import numpy as np
import matplotlib.pyplot as plt

# =============================================================================
# KINEMATIC BLACK HOLE MOTOR - PHYSICS SIMULATION
# Reference: Quantum Fruits Framework (Zander Model)
# 
# This script simulates the "Kinematic Motor" analogy where:
# - The Stator: Pure Action Core (hbar spin)
# - The Rotor: Mass Burden (Gravitational Braking)
# - The Goal: Unitary Information Return (The Page Curve)
#
# Assumption labels (see docs/Assumption_Register.md):
# - Axiom: fundamental constants and sigma_P definition
# - Derived: iMax scaling channel
# - Heuristic: return-profile shaping and non-thermality closure terms
# - Prediction: relative trend split between naive and unitary channels
# =============================================================================

# Fundamental Constants
CONSTANTS = {
    'hbar': 1.054571817e-34,
    'c': 2.99792458e8,
    'G': 6.67430e-11,
    'kB': 1.380649e-23
}

# Derived Planck Scale Values
# iMax is the Planck Force (~ c^4 / G), the theoretical limit of action flow
iMax = (CONSTANTS['c']**4) / CONSTANTS['G']
# sigma_P: The quantization factor of spacetime
sigmaP = (CONSTANTS['hbar'] * CONSTANTS['G']) / (CONSTANTS['c']**4)

def simulate_kinematic_motor(spin_rate=80, burden_range=(0, 1.5), steps=200):
    """
    Simulates the transition from a Pure Action Core to a Mass Loaded system.
    
    Args:
        spin_rate (float): The internal action frequency (0-100 scale).
        burden_range (tuple): Range of 'Mass Burden' (normalized to typical BH mass).
        steps (int): Number of steps in the simulation.
    """
    burdens = np.linspace(burden_range[0], burden_range[1], steps)
    
    # 1. Action Potential (Derived monitor: Planck-force scaling)
    # The pure stator potential is reduced as 'mechanical' mass load increases
    # Net = iMax * (SpinFactor) * (1 - BrakingFactor)
    net_potentials = iMax * (spin_rate / 100.0) * (1.0 - (burdens / 2.0))
    
    # 2. Entropy Evolution (Heuristic closure for exploratory plotting)
    # Naive: Hawking's monotonically rising entropy (Information Paradox)
    # Unitary: Zander-Page proxy showing return-like behavior
    s_naive = burdens * 1.5
    s_unitary = (1 - np.exp(-7 * burdens)) * np.exp(-4 * burdens) * 2.8
    
    # 3. Non-Thermality (Heuristic closure term c0)
    # Measures the departure from purely random 'heat' (thermal noise)
    # Higher c0 means more ordered information in the radiation
    epsilon = (101 - spin_rate) / 1000.0
    s_slope = burdens
    c0 = (np.pi**2 / 6.0) * (epsilon**2) + 0.5 * (s_slope**2) * (epsilon**2)
    
    return burdens, net_potentials, s_naive, s_unitary, c0

def plot_results(burdens, net_potentials, s_naive, s_unitary, c0):
    fig, axs = plt.subplots(3, 1, figsize=(10, 12), sharex=True)
    plt.subplots_adjust(hspace=0.3)
    
    # Plot 1: The Page Curve (Entropy)
    axs[0].plot(burdens, s_naive, color='#ef4444', linestyle='--', label='Naive (Information Loss)')
    axs[0].plot(burdens, s_unitary, color='#38bdf8', linewidth=3, label='Unitary (Zander-Page)')
    axs[0].fill_between(burdens, 0, s_unitary, color='#38bdf8', alpha=0.1)
    axs[0].set_ylabel('Information Entropy (S)')
    axs[0].set_title('Live Information Paradox Resolve (The Page Curve)')
    axs[0].legend()
    axs[0].grid(alpha=0.2)
    
    # Plot 2: Action Potential
    axs[1].plot(burdens, net_potentials, color='#a855f7', linewidth=2)
    axs[1].set_ylabel('Action Potential (i_max / N)')
    axs[1].set_title('Kinematic Transformer: Stator Output vs Rotor Load')
    axs[1].grid(alpha=0.2)
    
    # Plot 3: Non-Thermality Coefficient
    axs[2].plot(burdens, c0, color='#818cf8', linewidth=2)
    axs[2].set_ylabel('Non-Thermality (c0)')
    axs[2].set_xlabel('Mass Rotor Burden (Normalized Load)')
    axs[2].set_title('Information Departure from Thermal Noise')
    axs[2].grid(alpha=0.2)
    
    # Annotate Phases
    # 0.0 - 0.2: Pure Action
    # > 0.8: Gravitational Braking
    axs[0].axvspan(0, 0.2, color='#38bdf8', alpha=0.05)
    axs[0].text(0.02, 0.1, "Pure Action Core", color='#38bdf8', fontsize=9, fontweight='bold')
    
    axs[0].axvspan(0.8, 1.5, color='#ef4444', alpha=0.05)
    axs[0].text(0.9, 0.1, "Mass Loading / Braking", color='#ef4444', fontsize=9, fontweight='bold')

    plt.suptitle(r"Kinematic Motor Physics: The $\hbar$-Spin vs Mass Burden", fontsize=16, fontweight='bold')
    print("Simulation complete. Plotting results...")
    plt.show()

if __name__ == "__main__":
    # Parameters matching the Web Lab defaults
    DEFAULT_SPIN = 80
    
    data = simulate_kinematic_motor(spin_rate=DEFAULT_SPIN)
    plot_results(*data)
    
    print("-" * 50)
    print("PHYSICS SUMMARY:")
    print(f"Planck Force Capability (iMax): {iMax:.4e} N")
    print(f"Spacetime Quantization (sigma_P): {sigmaP:.4e} m*s")
    print("-" * 50)
    print("ANALYSIS:")
    print("The 'Motor' operates in the Unitary regime.")
    print("When Burden -> 0, we have a Pure Action Stator (Maximum Information Flow).")
    print("When Burden increases, the rotor brakes the spin, creating classical 'heat' (Hawking Radiation)")
    print("and coupling energy into the local gravitational field.")
    print("-" * 50)
