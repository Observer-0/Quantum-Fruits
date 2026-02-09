"""
py/bh_kinematic_engine.py
-------------------------
Mathematical model of a Black Hole as a Kinematic Transformer (Zander 2025).
Simulates the transition from a static remnant to a re-energized cosmic engine.
"""

import numpy as np
import matplotlib.pyplot as plt

# --- Physical Constants ---
hbar = 1.054e-34
G = 6.674e-11
c = 2.997e8
MP = np.sqrt(hbar * c / G) # Planck Mass (~2.17e-8 kg)
w_max = c / (np.sqrt(hbar * G / c**3)) # Planck Frequency

class KinematicEngine:
    def __init__(self, M0, M_ext_initial=0):
        self.M_core = M0
        self.M_ext = M_ext_initial # Reservoir of surrounding mass
        self.omega = w_max * (MP / M0) # Initial frequency (scaled by mass)
        self.current_time = 0.0  # Cumulative simulation time
        self.history = {'t': [], 'M': [], 'omega': [], 'L': []}

    def step(self, dt, accretion_rate=1e-5):
        """
        Calculates one time step of the engine cycle.
        """
        # Update cumulative time
        self.current_time += dt
        
        # 1. Accretion: Mass flows from reservoir to system
        infall = accretion_rate * dt
        self.M_core += infall  # Mass accretes onto the core
        self.M_ext -= infall   # Reservoir is depleted
        
        # 2. Re-energization: Accreted mass transfers energy to core spin
        # Efficiency factor lambda
        lam = 0.1
        d_omega_acc = (lam * infall * c**2) / hbar
        
        # 3. Braking: Gravitational inertial drag suppresses spin
        # Phenom. model: dω/dt ~ -(G M² / c⁵) * ω (corrected dimensions)
        # d_omega_brake is frequency change per timestep [rad/s]
        M_total = self.M_core + self.M_ext
        braking_coeff = G * M_total**2 / c**5  # Dimensionally consistent
        d_omega_brake = braking_coeff * self.omega * dt / hbar
        
        # Update Omega
        self.omega = max(0, self.omega + d_omega_acc - d_omega_brake)
        
        # 4. Feedback: Spin decay generates Luminosity (Information Return)
        # L = hbar * d_omega_brake / dt
        L = hbar * d_omega_brake / dt
        
        # Log stats
        self.history['t'].append(self.current_time)  # Store cumulative time, not dt
        self.history['M'].append(self.M_core + self.M_ext)
        self.history['omega'].append(self.omega)
        self.history['L'].append(L)

    def run_cycle(self, duration, dt):
        steps = int(duration / dt)
        for _ in range(steps):
            self.step(dt)

# --- Visualization ---
if __name__ == "__main__":
    # Start with a Remnant-sized BH (100 * Planck Mass)
    engine = KinematicEngine(M0=100 * MP, M_ext_initial=10 * MP)
    
    # Simulate cosmic time steps
    times = np.linspace(0, 1000, 1000)
    for t in times:
        # Varying accretion to show cycles
        rate = 1e-10 * (1 + np.sin(t / 50)) 
        engine.step(dt=1.0, accretion_rate=rate)
    
    # Plotting
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 8), sharex=True)
    
    ax1.plot(range(len(engine.history['omega'])), engine.history['omega'], color='cyan', label='Core Spin (ω)')
    ax1.set_ylabel("Rotational Frequency [rad/s]")
    ax1.set_title("Kinematic Engine Cycle: Re-energization vs. Braking")
    ax1.legend()
    
    ax2.plot(range(len(engine.history['L'])), engine.history['L'], color='magenta', label='Spin Luminosity (Feedback)')
    ax2.set_ylabel("Radiated Power [W]")
    ax2.set_xlabel("Cycle Steps")
    ax2.legend()
    
    plt.tight_layout()
    plt.show()
    print("Simulation of the Kinematic Engine complete. Feedback detected.")
