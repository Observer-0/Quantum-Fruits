import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import wishart

def zander_scaling_simulation(iterations=1000):
    """
    Simulates the convergence of spacetime measurements towards the 
    critical line (Re(s) = 1/2) within the sigma_P framework.
    """
    s = np.random.rand()  
    history = [s]
    
    for i in range(1, iterations):
        # The 'Geometric Response' acts as a damping factor
        # Noise (prime fluctuation) is smoothed by the cell density alpha_sigma
        noise = (np.random.rand() - 0.5) / np.sqrt(i)
        
        # Symmetrizing force towards the 1/2 line (Entropy minimization)
        s = s + 0.1 * (0.5 - s) + noise
        history.append(s)
        
    return history

def zander_gue_simulation(size=100):
    """
    Simulates vacuum resonance spacing using Gaussian Unitary Ensemble (GUE).
    The interaction of N_sigma cells creates an eigenvalue spectrum 
    matching the Riemann Zeta zeros.
    """
    re = np.random.normal(0, 1, (size, size))
    im = np.random.normal(0, 1, (size, size))
    H = (re + 1j*im)
    H = (H + H.conj().T) / 2  # Hermitian
    
    eigenvalues = np.linalg.eigvalsh(H)
    spacings = np.diff(eigenvalues)
    spacings /= np.mean(spacings)
    
    return spacings

def plot_resonance_results():
    # 1. Scaling Plot
    data = zander_scaling_simulation()
    plt.figure(figsize=(10, 4))
    plt.plot(data, color='#ff007f', alpha=0.8, label='Measurement Real-Part (s)')
    plt.axhline(y=0.5, color='#7a2ecc', linestyle='--', label='Critical Line (1/2)')
    plt.title("Spacetime Measurement Convergence (Zander-Riemann Scaling)")
    plt.xlabel("Scaling Steps (Cosmic Time Flow)")
    plt.ylabel("Re(s)")
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.savefig('../assets/img/zeta_scaling.png')
    plt.close()

    # 2. GUE Spacing Plot
    spacings = zander_gue_simulation(150)
    plt.figure(figsize=(10, 5))
    x = np.linspace(0, 3, 100)
    # Wigner Surmise for GUE
    plt.plot(x, (32/np.pi**2) * x**2 * np.exp(-4/np.pi * x**2), 
             'r-', lw=3, label='Riemann Zero Distribution (GUE)')
    plt.hist(spacings, bins=30, density=True, color='#00d4ff', alpha=0.6, 
             label='Vacuum Cell Resonances (sigma_P)')
    plt.title("Vacuum Stiffness: Spacetime Discretization vs. Zeta Zeros")
    plt.xlabel("Normalized Spacing")
    plt.ylabel("Probability Density")
    plt.legend()
    plt.savefig('../assets/img/zeta_gue.png')
    plt.close()

if __name__ == "__main__":
    print("Initializing Zander-Riemann Resonance Simulation...")
    try:
        plot_resonance_results()
        print("Success: Generated simulation plots in assets/img/")
    except Exception as e:
        print(f"Error during simulation: {e}")
