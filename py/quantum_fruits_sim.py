import math
import random

# ============================================================
# 1. Fundamental Constants
# ============================================================
hbar = 1.054571817e-34
c    = 2.99792458e8
G    = 6.67430e-11
kB   = 1.380649e-23
pi   = math.pi
tP   = math.sqrt(hbar * G / c**5)
# Fundamental Planck spacetime cell (sigma_P = ħ G / c^4) [m·s]
SIGMA_P = (hbar * G) / (c**4)
# Cosmological window (shared default)
COSMO_AGE_NOW = 13.8e9 * 365.25 * 24 * 3600
LY = 9.4607e15
COSMO_RADIUS_NOW = 46.5e9 * LY

# ============================================================
# 2. Simulation Logic (Spin-Brake)
# ============================================================
def simulate_page_curve_mechanic(duration=10.0, steps=200):
    t_list = []
    spin_list = []
    mass_list = []
    entropy_list = []
    
    # Respect fundamental spacetime cell: compute available ticks
    # N_sigma = c * R * duration / SIGMA_P
    try:
        ticks = (c * COSMO_RADIUS_NOW * duration) / SIGMA_P
    except Exception:
        ticks = float('inf')

    # If ticks smaller than steps, reduce steps to avoid sub-cell resolution
    if math.isfinite(ticks) and ticks > 0 and ticks < steps:
        steps = max(10, int(min(10000, ticks)))

    dt = duration / steps
    
    # Initial State
    curr_t = 0.0
    curr_spin = 0.0
    curr_mass = 0.0
    curr_entropy = 0.0
    
    # Parameters
    accretion_rate = 0.8
    brake_efficiency = 1.2
    
    for _ in range(steps):
        # 1. Spin Up (Conservation of Momentum for low mass)
        # Force drives Spin up when mass is low
        drive = (1.0 / (curr_mass + 0.1)) * 0.1
        
        # 2. Accretion
        # Logarithmic growth of mass
        dM = accretion_rate * dt * math.exp(-0.3 * curr_t)
        curr_mass += dM
        
        # 3. Brake (Gravity)
        brake = brake_efficiency * (curr_mass**2)
        
        # 4. Integrate Spin
        dSpin = (drive - brake) * dt
        curr_spin += dSpin
        if curr_spin < 0: curr_spin = 0
        
        # 5. Page Curve (Entanglement tracks Activity)
        # Rising Action vs Falling Brake
        if curr_spin > 0.05:
            # Active phase: Entanglement grows
            curr_entropy += curr_spin * dt
        else:
            # Cooled phase: Information returns
            curr_entropy -= 0.5 * dt
            if curr_entropy < 0: curr_entropy = 0
            
        t_list.append(curr_t)
        spin_list.append(curr_spin)
        mass_list.append(curr_mass)
        entropy_list.append(curr_entropy)
        
        curr_t += dt
        
    return t_list, spin_list, mass_list, entropy_list

# ============================================================
# 3. Micro-SVG Engine (No Libraries Needed)
# ============================================================
def create_svg_plot(filename, t, data_series, title, xlabel, ylabel):
    width = 800
    height = 400
    margin = 60
    
    # Find ranges
    min_t, max_t = min(t), max(t)
    min_y, max_y = 0, 0
    
    # Analyze multiple series if provided
    for _, y_vals, _ in data_series:
        local_max = max(y_vals) if y_vals else 1
        if local_max > max_y: max_y = local_max
    
    # Safety
    if max_y == 0: max_y = 1
    
    # Scaling functions
    def x_scale(val):
        return margin + (val - min_t) / (max_t - min_t) * (width - 2*margin)
    
    def y_scale(val):
        return height - margin - (val / max_y) * (height - 2*margin)
    
    svg = [f'<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg" style="background:#fff; font-family:sans-serif;">']
    
    # Title
    svg.append(f'<text x="{width/2}" y="30" text-anchor="middle" font-size="16" font-weight="bold">{title}</text>')
    
    # Axes
    svg.append(f'<line x1="{margin}" y1="{height-margin}" x2="{width-margin}" y2="{height-margin}" stroke="black" stroke-width="2"/>') # X
    svg.append(f'<line x1="{margin}" y1="{margin}" x2="{margin}" y2="{height-margin}" stroke="black" stroke-width="2"/>') # Y
    
    # Labels
    svg.append(f'<text x="{width/2}" y="{height-20}" text-anchor="middle">{xlabel}</text>')
    svg.append(f'<text x="20" y="{height/2}" text-anchor="middle" transform="rotate(-90 20 {height/2})">{ylabel}</text>')
    
    # Plot Data
    for label, y_vals, color in data_series:
        points = []
        for i in range(len(t)):
            px = x_scale(t[i])
            py = y_scale(y_vals[i])
            points.append(f"{px},{py}")
        
        polyline = f'<polyline points="{" ".join(points)}" fill="none" stroke="{color}" stroke-width="3"/>'
        svg.append(polyline)
        
        # Legend (simple placement)
        offset = data_series.index((label, y_vals, color)) * 20
        svg.append(f'<rect x="{width-200}" y="{50 + offset}" width="10" height="10" fill="{color}"/>')
        svg.append(f'<text x="{width-185}" y="{60 + offset}" font-size="12">{label}</text>')
        
    svg.append('</svg>')
    
    with open(filename, 'w') as f:
        f.write('\n'.join(svg))
    print(f"Generated {filename}")

# ============================================================
# 4. Main Execution
# ============================================================
if __name__ == "__main__":
    print("Running Quantum Fruits Simulation (Dependency-Free)...")
    
    t, spin, mass, entropy = simulate_page_curve_mechanic()
    
    # Plot 1: Spin vs Mass
    create_svg_plot(
        "simulation_mechanic.svg",
        t, 
        [("Quanten-Spin (Action)", spin, "#3b82f6"), ("Masse (Bremse)", mass, "#ef4444")],
        "Das Duell: Spin vs. Masse",
        "Zeit",
        "Intensitaet"
    )
    
    # Plot 2: Page Curve
    create_svg_plot(
        "simulation_page_curve.svg",
        t,
        [("Page-Kurve (Entropie)", entropy, "#10b981")],
        "Die Page-Kurve: Resultat",
        "Zeit",
        "Information / Entropie"
    )
    
    print("Done.")
