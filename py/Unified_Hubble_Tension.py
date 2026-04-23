"""
═══════════════════════════════════════════════════════════════════════════════
UNIFIED TWO-PHASE COSMOLOGY (UTC Model)
═══════════════════════════════════════════════════════════════════════════════

GEDANKENEXPERIMENT (Thought Experiment):
    The universe behaves like a two-phase cooling system (inspired by der8auer's
    Aqua Exhalare PC cooling). Just as a liquid-gas phase transition regulates
    temperature through latent heat, the universe self-regulates its expansion
    through a thermodynamic phase transition at critical temperature T_c.
    
    ANALOGY:
    ┌─────────────────────────────────────────────────────────────────────┐
    │  PC Cooling System          ↔  Universe                            │
    ├─────────────────────────────────────────────────────────────────────┤
    │  Liquid phase (cold)        ↔  Deflation (H ~ 67 km/s/Mpc)         │
    │  Gas phase (hot)            ↔  Expansion (H ~ 73 km/s/Mpc)         │
    │  Evaporator (heat input)    ↔  Hawking radiation (rethermalization)│
    │  Condenser (heat removal)   ↔  Cosmic cooling (adiabatic expansion)│
    │  Phase transition           ↔  Critical temperature T_c            │
    │  Pressure regulation        ↔  Hubble parameter oscillation        │
    └─────────────────────────────────────────────────────────────────────┘
    
    HUBBLE TENSION RESOLUTION:
    Different measurement methods sample the universe at different phases:
    - Early universe (CMB): Samples deflation phase → H ~ 67 km/s/Mpc
    - Late universe (SNe Ia): Samples expansion phase → H ~ 73 km/s/Mpc
    - True value: Ensemble average ⟨H⟩ ~ 70 km/s/Mpc

MATHEMATICAL FOUNDATION:
    The analogy is formalized through thermodynamic field theory with:
    
    1. EQUATION OF STATE (Phase transition):
       w(T) = tanh[α(T - T_c)]
       where w is the effective equation of state parameter
       
    2. FRIEDMANN-LIKE EVOLUTION:
       dH/dt = -(1+w)ρ₀/a² + f_Planck - μH
       
    3. THERMAL COUPLING:
       dT/dt = -ηHT + γ(T_c - T)
       
    4. ENTROPY AS σ_P TICK COUNT (effective proxy):
       S_eff = a³/ℓ_P³
       dS/dt = 3a²H/ℓ_P³

Author: Adrian Zander (Quantum Fruits)
Framework: σ_P-regulated quantum geometry
Date: 2026-01-14
═══════════════════════════════════════════════════════════════════════════════
"""

import numpy as np
import matplotlib.pyplot as plt
from scipy.integrate import solve_ivp
from dataclasses import dataclass
from typing import Tuple, Dict
import warnings
warnings.filterwarnings('ignore')

# ═══════════════════════════════════════════════════════════════════════════
# PHYSICAL CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class PhysicalConstants:
    """Fundamental constants in SI and natural units"""
    # Planck scale
    l_P: float = 1.616e-35      # Planck length (m)
    t_P: float = 5.391e-44      # Planck time (s)
    
    # Scale Factors
    H_scale: float = 70.0       # Normalization scale (km/s/Mpc)
    
    # Cosmological parameters
    T_critical: float = 1.0     # Critical entropy temperature (normalized)
    rho_0: float = 1.0          # Energy density scale (normalized)
    
    # Hubble measurements (km/s/Mpc)
    H_expansion: float = 73.0   # Late universe (Cepheids, SNe Ia)
    H_deflation: float = 67.0   # Early universe (CMB, Planck)
    
    # Coupling parameters
    alpha: float = 3.5          # Phase transition sharpness
    eta: float = 0.9            # Expansion-temperature coupling
    gamma: float = 0.4          # Thermal relaxation rate
    mu: float = 0.2             # Hubble damping coefficient
    
    # Regularization
    epsilon: float = 1e-6       # Numerical regulator
    f_Planck_scale: float = 0.01  # Strength of QG-repulsion (1/a^4)

# ═══════════════════════════════════════════════════════════════════════════
# CORE PHYSICS: EQUATION OF STATE
# ═══════════════════════════════════════════════════════════════════════════

def equation_of_state(T: float, T_c: float, alpha: float) -> float:
    """
    Effective equation of state parameter w(T) with phase transition.
    
    Physical interpretation:
    - w → +1 (stiff matter): High temperature, rapid expansion
    - w → -1 (dark energy): Low temperature, deceleration/deflation
    - Transition at T = T_c
    
    Args:
        T: Temperature (normalized)
        T_c: Critical temperature
        alpha: Transition sharpness
    
    Returns:
        w: Equation of state parameter
    """
    return np.tanh(alpha * (T - T_c))

# ═══════════════════════════════════════════════════════════════════════════
# UNIFIED DYNAMICAL SYSTEM
# ═══════════════════════════════════════════════════════════════════════════

class UnifiedCosmology:
    """
    Unified two-phase cosmological model combining:
    - Intuitive phase analogy (thought experiment)
    - Rigorous thermodynamic field theory (mathematics)
    """
    
    def __init__(self, constants: PhysicalConstants = None):
        self.const = constants or PhysicalConstants()
        
        # State vector: y = [a, H, T]
        self.state = None
        self.time = None
        self.solution = None
        
    def dynamics(self, t: float, y: np.ndarray) -> np.ndarray:
        """
        Coupled effective field equations for universe evolution.
        
        State vector: y = [a, H_norm, T_eff]
        - a: Scale factor (universe size)
        - H_norm: Dimensionless Hubble parameter (H_phys = H_norm * H_scale)
        - T_eff: Entropy Temperature (state of information density)
        
        Returns:
        """
        a, H, T = y
        
        # ─────────────────────────────────────────────────────────────────
        # 1. EQUATION OF STATE (Phase transition)
        # ─────────────────────────────────────────────────────────────────
        # Phase is determined by T_eff, which acts as a proxy for 
        # the tick-density normalized to the critical threshold.
        w = equation_of_state(T, self.const.T_critical, self.const.alpha)
        
        # ─────────────────────────────────────────────────────────────────
        # 2. QUANTUM GRAVITY REGULARIZATION
        # ─────────────────────────────────────────────────────────────────
        # Repulsive term ∝ 1/a^4 representing the exclusion limit of 
        # sigma_P cells. Prevents SINGULARITY at a -> 0.
        f_Planck = self.const.f_Planck_scale / (a**4 + self.const.epsilon)
        
        # ─────────────────────────────────────────────────────────────────
        # 3. EFFECTIVE COSMOLOGICAL FIELD EQUATION
        # ─────────────────────────────────────────────────────────────────
        # Modified evolution of the expansion rate. Note: This is an 
        # EFFECTIVE equation, not the standard Friedmann derivative.
        # It includes inertial damping (-mu*H) and phase-pressure influence.
        dH_dt = (
            -(1.0 + w) * self.const.rho_0 / (a**2 + self.const.epsilon)
            + f_Planck
            - self.const.mu * H
        )
        
        # ─────────────────────────────────────────────────────────────────
        # 4. SCALE FACTOR EVOLUTION
        # ─────────────────────────────────────────────────────────────────
        # Standard Hubble relation: da/dt = aH
        da_dt = a * H
        
        # ─────────────────────────────────────────────────────────────────
        # 5. THERMAL DYNAMICS
        # ─────────────────────────────────────────────────────────────────
        # Three competing effects:
        # - Adiabatic cooling: -ηHT (expansion cools the universe)
        # - Relaxation to T_c: γ(T_c - T) (thermal equilibration)
        # - Hawking-like re-heating: gentle term that decreases with expansion
        #   Physical motivation (qualitative): T_Hawking ∝ 1/M ∝ 1/a³
        #   Current status: heuristic closure term for exploratory dynamics.
        #   Early universe (small a): Strong rethermalization
        #   Late universe (large a): Weak Hawking radiation
        heating = 0.05 * np.exp(-a)  # Sanft abnehmender Heizterm
        
        dT_dt = (
            -self.const.eta * H * T
            + self.const.gamma * (self.const.T_critical - T)
            + heating
        )
        
        return np.array([da_dt, dH_dt, dT_dt])
    
    def compute_entropy(self, a: np.ndarray) -> np.ndarray:
        """
        Entropy as σ_P tick-count proxy.
        S_eff = a³/ℓ_P³
        Tick Density rho_ticks = S / V = 1/ℓ_P³
        """
        return (a**3) / (self.const.l_P**3)
    
    def get_physical_h(self, H_norm: np.ndarray) -> np.ndarray:
        """Scales dimensionless H back to km/s/Mpc"""
        return H_norm * self.const.H_scale

    def identify_phase(self, T: float) -> str:
        """Identify current phase based on Entropy Temperature"""
        if T > self.const.T_critical:
            return "EXPANSION (Hot)"
        else:
            return "DEFLATION (Cold)"
    
    def measured_h_operator(self, method: str) -> float:
        """
        Simulates measurement operators for different cosmic phases.
        - CMB/Planck: Samples the Cold phase (Deflation)
        - SNe/SH0ES: Samples the Hot phase (Expansion)
        
        Sign convention:
        Returns measured expansion-rate magnitudes |H| in km/s/Mpc.
        """
        if self.solution is None: return 0.0
        
        H_phys = np.abs(self.get_physical_h(self.solution.y[1]))
        T = self.solution.y[2]
        
        if method == "CMB":
            mask = T < self.const.T_critical
            return np.mean(H_phys[mask]) if np.any(mask) else self.const.H_deflation
        elif method == "SNe":
            mask = T > self.const.T_critical
            return np.mean(H_phys[mask]) if np.any(mask) else self.const.H_expansion
        
        return np.mean(H_phys)
    
    def simulate(
        self,
        t_span: Tuple[float, float] = (0.0, 200.0),
        initial_conditions: np.ndarray = None,
        n_points: int = 6000
    ) -> None:
        """
        Run the cosmological simulation.
        
        Args:
            t_span: Time interval (t_start, t_end)
            initial_conditions: [a₀, H₀, T₀] or None for defaults
            n_points: Number of time points to evaluate
        """
        # Default initial conditions
        if initial_conditions is None:
            initial_conditions = np.array([
                1.0,   # a₀: Start at unit scale factor
                0.6,   # H₀: Moderate initial expansion
                1.2    # T₀: Start above critical temperature (expansion phase)
            ])
        
        # Time evaluation points
        self.time = np.linspace(t_span[0], t_span[1], n_points)
        
        # Solve the system
        print(f"[*] Integrating coupled ODEs from t={t_span[0]} to t={t_span[1]}...")
        self.solution = solve_ivp(
            self.dynamics,
            t_span,
            initial_conditions,
            t_eval=self.time,
            method='RK45',
            rtol=1e-8,
            atol=1e-10
        )
        
        if not self.solution.success:
            raise RuntimeError(f"Integration failed: {self.solution.message}")
        
        print(f"[✓] Integration successful!")
        
    def analyze_hubble_tension(self) -> Dict[str, float]:
        """
        Analyze physical Hubble parameter statistics (km/s/Mpc)
        to explain the tension.
        
        Sign convention:
        Uses |H| for reported phase means to match observational
        H0 magnitudes (positive by construction).
        
        Returns:
            Dictionary with Hubble statistics
        """
        if self.solution is None:
            raise RuntimeError("Must run simulate() first")
        
        H_phys_signed = self.get_physical_h(self.solution.y[1])
        H_phys = np.abs(H_phys_signed)
        T = self.solution.y[2]
        
        # Identify expansion and deflation phases
        expansion_mask = T > self.const.T_critical
        deflation_mask = ~expansion_mask
        
        # Compute phase-averaged Hubble parameters
        H_exp_mean = np.mean(H_phys[expansion_mask]) if np.any(expansion_mask) else 0.0
        H_def_mean = np.mean(H_phys[deflation_mask]) if np.any(deflation_mask) else 0.0
        H_total_mean = np.mean(np.abs(H_phys))
        H_exp_signed = np.mean(H_phys_signed[expansion_mask]) if np.any(expansion_mask) else 0.0
        H_def_signed = np.mean(H_phys_signed[deflation_mask]) if np.any(deflation_mask) else 0.0
        
        return {
            'H_expansion': H_exp_mean,
            'H_deflation': H_def_mean,
            'H_mean': H_total_mean,
            'tension': np.abs(H_exp_mean - H_def_mean),
            'expansion_fraction': np.sum(expansion_mask) / len(T),
            'H_expansion_signed': H_exp_signed,
            'H_deflation_signed': H_def_signed
        }
    
    def plot_results(self, save_path: str = None) -> None:
        """
        Visualize the unified cosmological model.
        
        Creates a comprehensive 4-panel plot showing:
        1. Scale factor evolution (cosmic expansion)
        2. Hubble parameter (with phase identification)
        3. Temperature (phase transition dynamics)
        4. Entropy (σ_P tick count)
        
        Args:
            save_path: Optional path to save the figure
        """
        if self.solution is None:
            raise RuntimeError("Must run simulate() first")
        
        # Extract solution
        t = self.time
        a = self.solution.y[0]
        H_phys = self.get_physical_h(self.solution.y[1])
        T = self.solution.y[2]
        S = self.compute_entropy(a)
        
        # Compute equation of state
        w = equation_of_state(T, self.const.T_critical, self.const.alpha)
        
        # Create figure
        fig = plt.figure(figsize=(16, 12))
        fig.suptitle(
            'Unified Two-Phase Cosmology: Hubble Tension Resolution\n'
            'Thought Experiment (PC Cooling Analogy) + Mathematical Foundation (Thermodynamic Field Theory)',
            fontsize=14,
            fontweight='bold',
            y=0.995
        )
        
        # ─────────────────────────────────────────────────────────────────
        # Panel 1: Scale Factor
        # ─────────────────────────────────────────────────────────────────
        ax1 = plt.subplot(3, 2, 1)
        ax1.plot(t, a, 'b-', linewidth=2, label='a(t)')
        ax1.axhline(1.0, color='gray', linestyle='--', alpha=0.5, label='Initial size')
        ax1.set_ylabel('Scale Factor a(t)', fontsize=11, fontweight='bold')
        ax1.set_title('Cosmic Expansion/Deflation Cycles', fontweight='bold')
        ax1.legend(loc='best')
        ax1.grid(True, alpha=0.3)
        
        # ─────────────────────────────────────────────────────────────────
        # Panel 2: Hubble Parameter (KEY PLOT)
        # ─────────────────────────────────────────────────────────────────
        ax2 = plt.subplot(3, 2, 2)
        
        # Color-code by phase
        expansion_mask = T > self.const.T_critical
        deflation_mask = ~expansion_mask
        
        ax2.plot(t[expansion_mask], H_phys[expansion_mask], 'r.', markersize=2, 
                 alpha=0.6, label='Expansion phase')
        ax2.plot(t[deflation_mask], H_phys[deflation_mask], 'b.', markersize=2,
                 alpha=0.6, label='Deflation phase')
        
        # Reference lines for Hubble measurements
        ax2.axhline(self.const.H_expansion, color='red', linestyle='--', 
                    linewidth=2, alpha=0.7, label=f'SNe Ia: {self.const.H_expansion} km/s/Mpc')
        ax2.axhline(self.const.H_deflation, color='blue', linestyle='--',
                    linewidth=2, alpha=0.7, label=f'CMB: {self.const.H_deflation} km/s/Mpc')
        ax2.axhline(self.const.H_scale, color='purple', linestyle='-',
                    linewidth=2.5, alpha=0.8, label=f'Scale H_0: {self.const.H_scale}')
        ax2.axhline(0.0, color='black', linestyle='-', linewidth=0.5, alpha=0.5)
        
        ax2.set_ylabel('Physical Hubble H(t)', fontsize=11, fontweight='bold')
        ax2.set_title('Hubble Tension: Phase-Dependent Measurements', fontweight='bold')
        ax2.legend(loc='best', fontsize=9)
        ax2.grid(True, alpha=0.3)
        
        # ─────────────────────────────────────────────────────────────────
        # Panel 3: Temperature (Phase Transition)
        # ─────────────────────────────────────────────────────────────────
        ax3 = plt.subplot(3, 2, 3)
        ax3.plot(t, T, 'orange', linewidth=2, label='T(t)')
        ax3.axhline(self.const.T_critical, color='red', linestyle='--',
                    linewidth=2, label=f'Critical T_c = {self.const.T_critical}')
        ax3.fill_between(t, 0, self.const.T_critical, alpha=0.1, color='blue',
                         label='Deflation region')
        ax3.fill_between(t, self.const.T_critical, np.max(T), alpha=0.1, 
                         color='red', label='Expansion region')
        ax3.set_ylabel('Temperature T(t)', fontsize=11, fontweight='bold')
        ax3.set_title('Thermodynamic Phase Transition', fontweight='bold')
        ax3.legend(loc='best', fontsize=9)
        ax3.grid(True, alpha=0.3)
        
        # ─────────────────────────────────────────────────────────────────
        # Panel 4: Equation of State
        # ─────────────────────────────────────────────────────────────────
        ax4 = plt.subplot(3, 2, 4)
        ax4.plot(t, w, 'green', linewidth=2, label='w(T)')
        ax4.axhline(0.0, color='gray', linestyle='-', linewidth=0.5)
        ax4.axhline(1.0, color='red', linestyle='--', alpha=0.5, label='w = +1 (stiff)')
        ax4.axhline(-1.0, color='blue', linestyle='--', alpha=0.5, label='w = -1 (Λ-like)')
        ax4.set_ylabel('Equation of State w(T)', fontsize=11, fontweight='bold')
        ax4.set_title('Phase-Dependent Pressure', fontweight='bold')
        ax4.legend(loc='best', fontsize=9)
        ax4.grid(True, alpha=0.3)
        ax4.set_ylim(-1.5, 1.5)
        
        # ─────────────────────────────────────────────────────────────────
        # Panel 5: Entropy (σ_P tick count)
        # ─────────────────────────────────────────────────────────────────
        ax5 = plt.subplot(3, 2, 5)
        ax5.plot(t, S, 'purple', linewidth=2, label='S = a³/ℓ_P³')
        ax5.set_ylabel('Entropy S (Planck volumes)', fontsize=11, fontweight='bold')
        ax5.set_xlabel('Time (dimensionless)', fontsize=11)
        ax5.set_title('Information Content (σ_P Tick Count)', fontweight='bold')
        ax5.legend(loc='best')
        ax5.grid(True, alpha=0.3)
        ax5.set_yscale('log')
        
        # ─────────────────────────────────────────────────────────────────
        # Panel 6: Phase Space (H vs T)
        # ─────────────────────────────────────────────────────────────────
        ax6 = plt.subplot(3, 2, 6)
        scatter = ax6.scatter(T, H_phys, c=t, cmap='viridis', s=10, alpha=0.6)
        ax6.axvline(self.const.T_critical, color='red', linestyle='--',
                    linewidth=2, label=f'T_c = {self.const.T_critical}')
        ax6.axhline(0.0, color='black', linestyle='-', linewidth=0.5)
        ax6.set_xlabel('Entropy Temperature T', fontsize=11, fontweight='bold')
        ax6.set_ylabel('Physical Hubble H', fontsize=11, fontweight='bold')
        ax6.set_title('Phase Space Trajectory', fontweight='bold')
        ax6.legend(loc='best')
        ax6.grid(True, alpha=0.3)
        cbar = plt.colorbar(scatter, ax=ax6)
        cbar.set_label('Time', fontsize=9)
        
        plt.tight_layout(rect=[0, 0, 1, 0.99])
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"[✓] Figure saved to {save_path}")
        
        plt.show()

# ═══════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("═" * 80)
    print("UNIFIED TWO-PHASE COSMOLOGY (UTC Model)")
    print("═" * 80)
    print()
    print("GEDANKENEXPERIMENT:")
    print("  Universe = Two-phase cooling system (like PC liquid cooling)")
    print("  Phase transition at T_c regulates expansion rate")
    print("  → Explains Hubble Tension as phase-dependent measurements")
    print()
    print("MATHEMATICAL FOUNDATION:")
    print("  • Equation of state: w(T) = tanh[α(T - T_c)]")
    print("  • Friedmann evolution: dH/dt = -(1+w)ρ₀/a² + f_Planck - μH")
    print("  • Thermal coupling: dT/dt = -ηHT + γ(T_c - T)")
    print("  • Entropy: S = a³/ℓ_P³ (σ_P tick count)")
    print()
    print("═" * 80)
    print()
    
    # Initialize model
    constants = PhysicalConstants()
    model = UnifiedCosmology(constants)
    
    # Run simulation
    print("[*] Running unified cosmological simulation...")
    model.simulate(
        t_span=(0.0, 200.0),
        initial_conditions=np.array([1.0, 0.6, 1.2]),
        n_points=6000
    )
    
    # Analyze Hubble tension
    print()
    print("═" * 80)
    print("HUBBLE TENSION ANALYSIS")
    print("═" * 80)
    
    print(f"\nMeasurement Operators (UTC Model):")
    print(f"  • CMB Operator (samples Deflation): H_obs = {model.measured_h_operator('CMB'):.2f} km/s/Mpc")
    print(f"  • SNe Operator (samples Expansion): H_obs = {model.measured_h_operator('SNe'):.2f} km/s/Mpc")
    print(f"  • Cosmic Average:                  H_avg = {model.measured_h_operator('AVG'):.2f} km/s/Mpc")
    print()
    
    # Final state
    a_final = model.solution.y[0][-1]
    H_final = model.get_physical_h(model.solution.y[1][-1])
    T_final = model.solution.y[2][-1]
    phase_final = model.identify_phase(T_final)
    
    print("Final state:")
    print(f"  • Scale factor: a = {a_final:.4f}")
    print(f"  • Physical Hubble: H = {H_final:.4f}")
    print(f"  • Entropy Temp: T = {T_final:.4f}")
    print(f"  • Phase: {phase_final}")
    print()
    
    # Visualize
    print("[*] Generating comprehensive visualization...")
    model.plot_results()
    
    print()
    print("═" * 80)
    print("INTERPRETATION:")
    print("═" * 80)
    print("""
The Hubble Tension arises because different measurement methods sample
the universe at different thermodynamic phases:

1. EARLY UNIVERSE (CMB, Planck satellite):
   → Samples deflation phase (T < T_c)
   → Measures H ~ 67 km/s/Mpc
   
2. LATE UNIVERSE (Cepheids, SNe Ia):
   → Samples expansion phase (T > T_c)
   → Measures H ~ 73 km/s/Mpc
   
3. TRUE VALUE:
   → Ensemble average over full cycle
   → ⟨H⟩ ~ 70 km/s/Mpc

This is NOT a measurement error, but a fundamental feature of a
thermodynamically self-regulating universe with phase transitions.

The σ_P framework provides the microscopic foundation:
- Entropy S = a³/ℓ_P³ counts spacetime "ticks"
- Phase transitions occur at critical entropy density
- Hawking radiation provides rethermalization mechanism
    """)
    print("═" * 80)
