/**
 * Quantum Fruits Unity Layer
 * Connects Theory, Labs, and Python source code.
 */

const PROJECT_ROOT = '/'; // Adjust if hosted in a subdirectory

const SIM_MAP = {
    hubble: {
        id: "LAB-011",
        title: "Cosmic Breathing",
        lab: "hubble_flow_lab.html",
        theory: "theory.html#cosmology",
        python: "py/Unified_Hubble_Tension.py",
        description: "Resolving the Hubble Tension through thermodynamic phase transitions.",
        icon: "🪐"
    },
    evaporation: {
        id: "LAB-006",
        title: "Evaporation Lab",
        lab: "evaporation_lab.html",
        theory: "theory.html#blackholes",
        python: "py/sigmaP_evaporation_refined.py",
        description: "Unitary decay of black holes and the resolution of the Information Paradox.",
        icon: "🕳️"
    },
    lattice: {
        id: "LAB-004",
        title: "URM Lattice",
        lab: "lattice_lab.html",
        theory: "theory.html#quantum",
        python: "py/quantum_fruits_sim.py",
        description: "The fundamental fabric of discrete spacetime action.",
        icon: "🕸️"
    },
    galaxy: {
        id: "LAB-002",
        title: "Galaxy Rotation",
        lab: "galaxy_lab.html",
        theory: "theory.html#galaxies",
        python: "py/physics_engine.py",
        description: "Dark Matter-free rotation curves via Sigma-P coupling.",
        icon: "🌀"
    },
    entropy: {
        id: "LAB-008",
        title: "Entropy Holo-Lab",
        lab: "entropy_lab.html",
        theory: "theory.html#blackholes",
        python: "py/Info_Paradox2.py",
        description: "Visualizing holographic entropy and information density.",
        icon: "📊"
    },
    motor: {
        id: "LAB-001",
        title: "Kinematic Motor",
        lab: "motor.html",
        theory: "theory.html#quantum",
        python: "py/kinematic_motor_sim.py",
        description: "The mechanical coupling between quantum action and classical gravity.",
        icon: "⚙️"
    },
    answer42: {
        id: "INF-042",
        title: "The Answer is 42",
        lab: "theory.html#library",
        theory: "theory.html#library",
        python: "py/answer_42.py",
        description: "The numerical signature of the cosmic scale ratio.",
        icon: "🌌"
    }
};

/**
 * Injects a unified navigation bar into the page.
 */
function injectNavigation() {
    const nav = document.createElement('nav');
    nav.className = 'unity-nav';

    // Determine relative path depth
    const path = window.location.pathname;
    const prefix = path.includes('/html/') ? '../' : '';
    const htmlPrefix = path.includes('/html/') ? '' : 'html/';

    nav.innerHTML = `
        <div class="nav-content">
            <a href="${prefix}index.html" class="nav-logo">QUANTUM FRUITS</a>
            <div class="nav-links">
                <a href="${prefix}${htmlPrefix}theory.html">Theory</a>
                <a href="${prefix}${htmlPrefix}labs.html">Labs</a>
                <a href="${prefix}${htmlPrefix}papers.html">Papers</a>
                <a href="https://github.com/Quantum-Fruits" target="_blank" class="nav-github">
                    <svg height="20" viewBox="0 0 16 16" width="20"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
                    Source
                </a>
            </div>
        </div>
    `;

    document.body.prepend(nav);

    // Add CSS if not present
    if (!document.getElementById('unity-styles')) {
        const style = document.createElement('style');
        style.id = 'unity-styles';
        style.textContent = `
            .unity-nav {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 60px;
                background: rgba(10, 15, 28, 0.8);
                backdrop-filter: blur(12px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                z-index: 9999;
                display: flex;
                align-items: center;
                padding: 0 2rem;
            }
            .nav-content {
                max-width: 1400px;
                width: 100%;
                margin: 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .nav-logo {
                font-family: 'Outfit', sans-serif;
                font-weight: 800;
                letter-spacing: 4px;
                color: #fff;
                text-decoration: none;
                font-size: 1.2rem;
            }
            .nav-links {
                display: flex;
                gap: 2rem;
                align-items: center;
            }
            .nav-links a {
                color: rgba(255, 255, 255, 0.7);
                text-decoration: none;
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.8rem;
                text-transform: uppercase;
                transition: all 0.2s;
            }
            .nav-links a:hover {
                color: var(--accent-primary, #38bdf8);
            }
            .nav-github {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.4rem 0.8rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            padding-top-unity { padding-top: 60px; }
        `;
        document.head.appendChild(style);
    }
    document.body.classList.add('padding-top-unity');
}

/**
 * Injects reference links into Lab pages.
 */
function injectLabUnity() {
    const filename = window.location.pathname.split('/').pop();
    const simEntry = Object.values(SIM_MAP).find(s => s.lab === filename);

    if (simEntry) {
        const unityPanel = document.createElement('div');
        unityPanel.className = 'unity-panel';

        // Find relative path for python
        const prefix = '../';

        unityPanel.innerHTML = `
            <div class="unity-badge">
                <span class="unity-icon">${simEntry.icon}</span>
                <div class="unity-info">
                    <strong>INTEGRATED VIEW</strong>
                    <div class="unity-links">
                        <a href="${simEntry.theory}">Theory Reference</a>
                        <a href="${prefix}${simEntry.python}" target="_blank">Python Source</a>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(unityPanel);

        const style = document.createElement('style');
        style.textContent = `
            .unity-panel {
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                z-index: 1000;
                pointer-events: none;
            }
            .unity-badge {
                pointer-events: auto;
                background: rgba(15, 23, 42, 0.9);
                border: 1px solid rgba(56, 189, 248, 0.3);
                border-radius: 12px;
                padding: 1rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                backdrop-filter: blur(8px);
                transition: transform 0.3s;
            }
            .unity-badge:hover {
                transform: translateY(-5px);
            }
            .unity-icon {
                font-size: 2rem;
            }
            .unity-info strong {
                display: block;
                font-size: 0.6rem;
                color: var(--accent-primary, #38bdf8);
                letter-spacing: 1px;
                margin-bottom: 0.25rem;
            }
            .unity-links {
                display: flex;
                gap: 1rem;
            }
            .unity-links a {
                font-size: 0.75rem;
                color: #fff;
                text-decoration: none;
                border-bottom: 1px solid rgba(255,255,255,0.2);
            }
            .unity-links a:hover {
                border-color: #fff;
            }
        `;
        document.head.appendChild(style);
    }
}

// Auto-run on load
document.addEventListener('DOMContentLoaded', () => {
    injectNavigation();
    if (window.location.pathname.includes('_lab') ||
        window.location.pathname.includes('sim') ||
        window.location.pathname.includes('motor.html')) {
        injectLabUnity();
    }
});
