
import math

def calculate_answer():
    """
    Calculates the "Deep Thoughts" answer to the Universe:
    The ratio between Electromagnetic Force (Information/Life) and Gravity (Inertia/Geometry).
    
    The Formula to 42 (Zander):
         F_em       k_e * e^2
        ------  =  -----------  ≈  4.2 * 10^42
         F_g        G * m_e^2
    """

    print("\n" + "="*60)
    print("      THE ANSWER TO LIFE, THE UNIVERSE AND EVERYTHING")
    print("="*60)
    print("\n[QUESTION]: Why doesn't a thought collapse into a black hole?")
    print("[HYPOTHESIS]: Because Information is lighter than Geometry.\n")

    print("[1] Loading Fundamental Constants (SI Units)...")
    # Fundamental Constants
    k_e  = 8.9875517923e9      # Coulomb Constant (N·m²/C²) -> Strength of Electric Fields
    e    = 1.602176634e-19     # Elementary Charge (C)        -> The carrier of information
    G    = 6.67430e-11         # Gravitational Constant       -> Strength of Geometry/Curvature
    m_e  = 9.10938356e-31      # Electron Mass (kg)           -> The carrier of reality

    print(f"    - Coulomb Constant (k_e): {k_e:.2e}")
    print(f"    - Gravitational Const (G): {G:.2e}")
    print(f"    - Electron Mass (m_e):     {m_e:.2e}")
    
    print("\n[2] Calculating Forces between two fundamental particles...")
    # The math:
    # Ratio = (Electric Force) / (Gravitational Force)
    # Distance cancels out because both forces scale with 1/r^2
    
    numerator   = k_e * (e**2)      # Strength of Information (EM)
    denominator = G * (m_e**2)      # Strength of Geometry (Gravity)
    
    ratio = numerator / denominator
    log_val = math.log10(ratio)

    print(f"\n    F_em (Information Force) ~ {numerator:.4e}")
    print(f"    F_g  (Geometric Force)   ~ {denominator:.4e}")
    
    print("-" * 60)
    print(f"RATIO (Strength Difference): {ratio:.3e}")
    print(f"LOG10 (Orders of Magnitude): {log_val:.4f}")
    print("-" * 60)
    
    # We use int() to get the base order of magnitude (10^42 range)
    answer = int(log_val)
    
    print(f"\n>>> THE ANSWER IS 10^{answer} <<<")
    
    if answer == 42:
        print("\n" + "="*60)
        print("                 VERIFICATION SUCCESSFUL")
        print("="*60)
        print(f"\nWe confirmed that 10^{answer} is the 'Safety Margin' of reality.")
        print("\nPHILOSOPHICAL INTERPRETATION:")
        print("1. Electromagnetic forces (Chemistry, Biology, Neurons) are")
        print("   42 orders of magnitude stronger than Gravity.")
        print("2. This allows complex structures (Life) to exist against the")
        print("   crushing pull of spacetime curvature.")
        print("3. Without this '42', every thought would instantly collapse")
        print("   under its own weight into a singularity.")
        print("\nConclusion: The Universe is optimized for Information.")
        print("\n The Formula to 42 (Zander):")
        print("          F_em       k_e * e^2")
        print("         ------  =  -----------  ≈  4.2 * 10^42")
        print("          F_g        G * m_e^2")
    
    else:
        print("\n[CRITICAL ERROR] The universe parameters are incorrect.")
        print("Please reboot the simulation.")

if __name__ == "__main__":
    calculate_answer()
