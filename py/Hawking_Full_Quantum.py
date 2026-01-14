import numpy as np
import matplotlib.pyplot as plt

def simulation_einstein_zander():
    # 1. Parameter-Setup
    t_evap = 1.0  # Normierte Verdampfungszeit
    t = np.linspace(0, t_evap, 500)
    
    # Konstanten für die Page-Kurve
    # S_naive: Wächst linear ( Hawking's ursprüngliches Problem)
    s_naive = t * 1.0 
    
    # S_unitary (EZ-Framework): Folgt der Kurve aus deinem Figure 1
    # Ein glatter Übergang, der bei t_evap wieder bei Null landet
    # Modelliert durch: (1 - exp(-7x)) * exp(-4x) * Skalierung
    s_unitary = (1 - np.exp(-7 * t/t_evap)) * np.exp(-4 * t/t_evap) * 2.8
    
    # 2. Berechnung von c0(epsilon) - Scaling (Figure 2)
    epsilon = np.linspace(0, 0.6, 100)
    def calculate_c0(eps, slope_S):
        term_temporal = (np.pi**2 / 6) * (eps**2)
        term_spatial = 0.5 * (slope_S**2) * (eps**2)
        return term_temporal + term_spatial

    # Plots erstellen
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Plot 1: Page Curve
    ax1.plot(t, s_naive, '--', label='Naive Hawking (Informationsverlust)', color='gray')
    ax1.plot(t, s_unitary, '-', label='Unitäre Page-Kurve (EZ-Framework)', linewidth=2, color='blue')
    ax1.set_title("Unitäre Page-Kurve (Schematisch)")
    ax1.set_xlabel("Zeit t / t_evap")
    ax1.set_ylabel("Entropie S_rad")
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    # Plot 2: c0 Scaling
    ax2.plot(epsilon, calculate_c0(epsilon, 0), label='S = 0 (Rein temporal)')
    ax2.plot(epsilon, calculate_c0(epsilon, 0.5), label='S = 0.5')
    ax2.plot(epsilon, calculate_c0(epsilon, 1.0), label='S = 1.0 (Greybody-Einfluss)')
    ax2.set_title("Nicht-Thermality Koeffizient $c_0(\epsilon)$")
    ax2.set_xlabel("$\epsilon$ (Planck-Skalierung)")
    ax2.set_ylabel("$c_0$")
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.show()

    # Beispielhafte Ausgabe für die Tabelle
    print("--- EZ-Framework Kennzahlen (Beispiel Stellar BH) ---")
    eps_t = 4.2e-19
    c0_t = (np.pi**2 / 6) * (eps_t**2)
    print(f"Epsilon_t: {eps_t:.2e}")
    print(f"Berechnetes c0 (temporal): {c0_t:.2e}")

if __name__ == "__main__":
    simulation_einstein_zander()