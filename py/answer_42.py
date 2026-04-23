import math


def force_ratio_em_to_gravity():
    """
    Compute the ratio between electric and gravitational interaction strengths
    for two electrons:

        F_em / F_g = (k_e * e^2) / (G * m_e^2)

    This script presents the result as a Douglas Adams themed easter egg.
    """
    # SI constants
    k_e = 8.9875517923e9
    e = 1.602176634e-19
    G = 6.67430e-11
    m_e = 9.10938356e-31

    numerator = k_e * (e ** 2)
    denominator = G * (m_e ** 2)
    ratio = numerator / denominator
    return ratio, numerator, denominator, k_e, e, G, m_e


def calculate_answer():
    print("\n" + "=" * 66)
    print("      THE ANSWER TO LIFE, THE UNIVERSE, AND EVERYTHING")
    print("=" * 66)
    print("\n[MODE] Douglas Adams meme mode (with real constants).")
    print("[NOTE] Do not panic.\n")

    print("[1] Loading fundamental constants (SI)...")
    ratio, numerator, denominator, k_e, e, G, m_e = force_ratio_em_to_gravity()
    log_val = math.log10(ratio)
    answer = math.floor(log_val)

    print(f"    - Coulomb constant (k_e):  {k_e:.6e}")
    print(f"    - Elementary charge (e):   {e:.6e}")
    print(f"    - Gravitational const (G): {G:.6e}")
    print(f"    - Electron mass (m_e):     {m_e:.6e}")

    print("\n[2] Comparing force scales...")
    print(f"    F_em ~ {numerator:.4e}")
    print(f"    F_g  ~ {denominator:.4e}")
    print("-" * 66)
    print(f"RATIO F_em/F_g:                {ratio:.3e}")
    print(f"log10(F_em/F_g):               {log_val:.6f}")
    print("-" * 66)
    print(f"\n>>> Deep Thought reports: 10^{answer} <<<")

    if answer == 42:
        print("\n" + "=" * 66)
        print("                      RESULT: 42 CONFIRMED")
        print("=" * 66)
        print("\nDeep Thought: 'The answer is 42.'")
        print("Zaphod: 'Finally, a result with style.'")
        print("Marvin: 'I suppose this was inevitable.'")
        print("\nReminder: bring your towel.")
        print("And yes: thanks for all the fish.")
        print("\nFormula:")
        print("          F_em       k_e * e^2")
        print("         ------  =  -----------  ~  4.2 x 10^42")
        print("          F_g        G * m_e^2")
    else:
        print("\nResult differs from the expected meme exponent.")
        print("Still: do not panic, and check constants/precision.")


if __name__ == "__main__":
    calculate_answer()
