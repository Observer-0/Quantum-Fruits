/**
 * js/kerr-lab.js
 * ------------------------
 * Logic for the Kerr/Teukolsky Lab simulation.
 * Calculates horizon parameters, surface gravity, and the non-thermality coefficient c0.
 */

const KERR_CONST = {
    G: 6.67430e-11,
    c: 2.99792458e8,
    hbar: 1.054571817e-34,
    kB: 1.380649e-23,
    M_sun: 1.98847e30,
    sigmaP: (1.054571817e-34 * 6.67430e-11) / Math.pow(2.99792458e8, 4)
};

function updateKerrLab() {
    const M_ratio = parseFloat(document.getElementById('kerr-mass').value);
    const chi = parseFloat(document.getElementById('kerr-spin').value);
    const useSigmaP = document.getElementById('kerr-sigmap-toggle').checked;

    const M = M_ratio * KERR_CONST.M_sun;

    // If useSigmaP is on, L and tau are derived from sigmaP
    // Let's assume L = l_p and tau = t_p for the fundamental smearing
    const lp = Math.sqrt(KERR_CONST.hbar * KERR_CONST.G / Math.pow(KERR_CONST.c, 3));
    const tp = lp / KERR_CONST.c;

    const L = useSigmaP ? lp : 1.0; // Default 1m if not sigmap
    const tau = useSigmaP ? tp : 1e-4; // Default 0.1ms if not sigmap

    const results = calculateKerr(M, chi, tau, L);

    // Update UI
    document.getElementById('val-kerr-m').innerText = M_ratio.toFixed(1) + " M☉";
    document.getElementById('val-kerr-chi').innerText = chi.toFixed(2);
    document.getElementById('val-kerr-rp').innerText = (results.r_plus / 1000).toFixed(2) + " km";
    document.getElementById('val-kerr-th').innerText = results.T_H.toExponential(3) + " K";
    document.getElementById('val-kerr-c0t').innerText = results.c0_t.toExponential(4);
    document.getElementById('val-kerr-c0s').innerText = results.c0_s.toExponential(4);
    document.getElementById('val-kerr-c0').innerText = results.c0_tot.toExponential(4);
    document.getElementById('val-kerr-nsig').innerText = results.N_sigma.toExponential(3);
    document.getElementById('val-kerr-sz').innerText = results.S_Z.toExponential(3) + " J/K";

    // Relativity Visualization (Dimensionless offsets)
    const smear = (results.c0_tot * 100).toFixed(6);
    document.getElementById('kerr-smear-note').innerText = `Relativity Offset: ${smear}% shift from pure thermal state.`;

    updateKerrPlot(M, chi, tau, L);
}

function updateKerrPlot(M, currentChi, tau, L) {
    const chiValues = [];
    const c0Values = [];

    // Generate 50 points across spin range [0, 0.99]
    for (let c = 0; c <= 0.99; c += 0.02) {
        const res = calculateKerr(M, c, tau, L);
        chiValues.push(c);
        c0Values.push(res.c0_tot);
    }

    const trace = {
        x: chiValues,
        y: c0Values,
        type: 'scatter',
        mode: 'lines',
        name: 'Theory Curve',
        line: { color: '#bc00ff', width: 3 },
        fill: 'tozeroy',
        fillcolor: 'rgba(188, 0, 255, 0.1)'
    };

    const currentPoint = {
        x: [currentChi],
        y: [calculateKerr(M, currentChi, tau, L).c0_tot],
        type: 'scatter',
        mode: 'markers',
        name: 'Current State',
        marker: { color: '#fff', size: 10, line: { color: '#bc00ff', width: 2 } }
    };

    const layout = {
        title: { text: 'Non-Thermality (c₀) vs. Dimensionless Spin (χ)', font: { color: '#fff', size: 14 } },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { title: 'Spin χ', gridcolor: 'rgba(255,255,255,0.05)', tickfont: { color: '#94a3b8' }, titlefont: { color: '#94a3b8' } },
        yaxis: { title: 'c₀ Coefficient', gridcolor: 'rgba(255,255,255,0.05)', tickfont: { color: '#94a3b8' }, titlefont: { color: '#94a3b8' }, type: 'log' },
        showlegend: false,
        margin: { t: 40, b: 40, l: 60, r: 20 }
    };

    Plotly.newPlot('c0-plot', [trace, currentPoint], layout, { displayModeBar: false });
}

function calculateKerr(M, chi, tau, L) {
    const G = KERR_CONST.G;
    const c = KERR_CONST.c;
    const kB = KERR_CONST.kB;
    const sigmaP = KERR_CONST.sigmaP;

    const M_geo = G * M / (c * c);
    const a_geo = chi * M_geo;
    const s = Math.sqrt(Math.max(0, 1.0 - chi * chi));
    const r_plus = M_geo * (1.0 + s);
    const r_minus = M_geo * (1.0 - s);

    // N_sigma = Area / (sigmaP * c)
    // Area of Kerr horizon: 4*pi*(r_plus^2 + a^2)
    const area = 4.0 * Math.PI * (r_plus * r_plus + a_geo * a_geo);
    const N_sigma = area / (sigmaP * c);

    // S_Z = kB * N_sigma / 4
    const S_Z = kB * N_sigma / 4.0;

    // T_H (Zander Derivation): sigmaP * c^7 / (8*pi * G^2 * M * kB)
    const T_H = (sigmaP * Math.pow(c, 7)) / (8.0 * Math.PI * G * G * M * kB);

    const denom = 2.0 * (r_plus * r_plus + a_geo * a_geo);
    const kappa_geo = (r_plus - r_minus) / denom;
    const kappa_SI = c * c * kappa_geo;

    const eps_t = (tau * kappa_SI) / c;
    const eps_s = L / r_plus;

    const c0_t = (Math.PI * Math.PI / 6.0) * (eps_t * eps_t);

    const modes = [
        { slope: 0.8, weight: 0.5 },
        { slope: 0.4, weight: 0.3 },
        { slope: 0.2, weight: 0.2 }
    ];

    let weighted_slope2 = 0;
    modes.forEach(m => {
        weighted_slope2 += m.weight * (m.slope * m.slope);
    });

    const c0_s = 0.5 * (eps_s * eps_s) * weighted_slope2;

    return {
        r_plus, r_minus, kappa_SI, T_H, eps_t, eps_s, c0_t, c0_s, c0_tot: c0_t + c0_s, N_sigma, S_Z
    };
}

/**
 * BH Life Cycle Simulation
 * Hawking → Sternproduktion → Endzustand
 */
function initBHLifeCycle() {
    // ==== Setup Parameters ====
    const M0 = 10 * KERR_CONST.M_sun;  // initial stellar BH
    const tau_life = 1e12;             // normalized life time (s)
    const nSteps = 200;

    const chi = 0.8;                    // dimensionless spin
    const useSigmaP = document.getElementById('kerr-sigmap-toggle')?.checked ?? true;

    // ==== Arrays ====
    const tArr = Array.from({ length: nSteps }, (_, i) => i * tau_life / nSteps);
    const MArr = [];
    const SArr = [];
    const c0Arr = [];

    // ==== Simulation Loop ====
    tArr.forEach((t, i) => {
        // Mass evolution: simple evaporation + Sternbildung
        let M;
        if (t < 0.5 * tau_life) {
            // Early: Hawking
            M = M0 * Math.pow(1 - t / (0.5 * tau_life), 1 / 3);
        } else {
            // Mid/Late: Sternproduktion
            M = M0 * 0.5 + 0.5 * M0 * Math.sin(Math.PI * (t - 0.5 * tau_life) / (0.5 * tau_life)) ** 2;
        }
        MArr.push(M);

        // Entropy: Page-Kurve analog
        let S;
        if (t < 0.5 * tau_life) {
            S = 0.5 * M0 * t / (0.5 * tau_life);  // linear Hawking
        } else {
            // rise due to Sternproduktion + eventual remnant
            S = 0.5 * M0 + 0.5 * M0 * Math.sin(Math.PI * (t - 0.5 * tau_life) / (0.5 * tau_life)) ** 2;
        }
        SArr.push(S);

        // c0: from Kerr / Teukolsky
        // We use the user-provided scaling for tau and L here
        const res = calculateKerr(M, chi, useSigmaP ? 1e-44 : 1e-4, useSigmaP ? 1e-35 : 1);
        c0Arr.push(res.c0_tot);
    });

    // ==== Plot ====
    const traceM = {
        x: tArr, y: MArr,
        name: "Mass M(t)",
        yaxis: 'y1',
        mode: 'lines', line: { color: '#38bdf8', width: 3 }
    };
    const traceS = {
        x: tArr, y: SArr,
        name: "Entropy S(t)",
        yaxis: 'y2',
        mode: 'lines', line: { color: '#ef4444', width: 3 }
    };
    const traceC0 = {
        x: tArr, y: c0Arr,
        name: "Non-Thermality c0(t)",
        yaxis: 'y3',
        mode: 'lines', line: { color: '#bc00ff', width: 3 }
    };

    const layout = {
        title: { text: "BH Life Cycle: Hawking → Sternproduktion → Endzustand", font: { color: '#fff', size: 14 } },
        xaxis: { title: "t [s]", gridcolor: 'rgba(255,255,255,0.05)', tickfont: { color: '#94a3b8' }, titlefont: { color: '#94a3b8' } },
        yaxis: { title: "Mass [kg]", side: 'left', color: '#38bdf8', gridcolor: 'rgba(255,255,255,0.05)', tickfont: { color: '#38bdf8' } },
        yaxis2: { title: "Entropy S(t)", overlaying: 'y', side: 'right', color: '#ef4444', tickfont: { color: '#ef4444' } },
        yaxis3: {
            title: "c0 (Non-Thermality)",
            overlaying: 'y',
            side: 'right',
            anchor: 'free',
            position: 1.0,
            color: '#bc00ff',
            tickfont: { color: '#bc00ff' }
        },
        legend: { x: 0.05, y: 1.1, orientation: 'h', font: { color: '#fff', size: 10 } },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0.2)',
        margin: { t: 80, b: 50, l: 60, r: 120 }
    };

    Plotly.newPlot('bh-life-cycle', [traceM, traceS, traceC0], layout, { displayModeBar: false });
}

// Initialize listeners
document.addEventListener('DOMContentLoaded', () => {
    const mSlider = document.getElementById('kerr-mass');
    const sSlider = document.getElementById('kerr-spin');
    const tCheck = document.getElementById('kerr-sigmap-toggle');

    if (mSlider) mSlider.oninput = () => { updateKerrLab(); initBHLifeCycle(); };
    if (sSlider) sSlider.oninput = () => { updateKerrLab(); initBHLifeCycle(); };
    if (tCheck) tCheck.onchange = () => { updateKerrLab(); initBHLifeCycle(); };

    // Initial updates
    updateKerrLab();
    initBHLifeCycle();
});

/**
 * Monte Carlo Simulation for Inertia Braking
 * Simulates core spin decay through stochastic mass-interaction.
 */
function runBrakingMC() {
    const M_ratio = parseFloat(document.getElementById('kerr-mass').value);
    const M_core = M_ratio * KERR_CONST.M_sun;
    const n_particles = 1000; // Reduced for performance in browser

    const G = KERR_CONST.G;
    const c = KERR_CONST.c;
    const hbar = KERR_CONST.hbar;
    const i_max = Math.pow(c, 4) / G;
    const lp = Math.sqrt(hbar * G / Math.pow(c, 3));
    const rs = 2 * G * M_core / (c * c);

    const results_pot = [];
    let current_potential = i_max;
    let total_force = 0;

    // Normal distribution helper (Box-Muller transform)
    function randomNormal(mean, std) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    for (let i = 0; i < n_particles; i++) {
        // 1. Stochastic mass packet
        const m_p = randomNormal(M_core / n_particles, M_core / (n_particles * 10));

        // 2. Jitter (Quantenfluktuationen)
        const jitter = 0.95 + Math.random() * 0.1;

        // 3. Braking Force: G * m / r^2 (with lP-Regularisierung)
        const force = (G * m_p * jitter) / (rs * rs + lp * lp);

        current_potential -= force;
        results_pot.push(current_potential);
        total_force += force;

        // Break if potential is exhausted
        if (current_potential < 0) {
            current_potential = 0;
            break;
        }
    }

    // Update UI
    document.getElementById('braking-mc-results').style.display = 'block';
    document.getElementById('mc-pot-final').innerText = current_potential.toExponential(3) + " N";
    document.getElementById('mc-force-avg').innerText = (total_force / n_particles).toExponential(3) + " N";

    // Progress bar
    const percentage = (current_potential / i_max) * 100;
    document.getElementById('mc-braking-fill').style.width = Math.max(0, percentage) + "%";

    // User special check: "Logik-Check für das Frontend"
    const planck_mass = Math.sqrt(hbar * c / G);
    const statusEl = document.getElementById('mc-braking-status');
    if (M_core < planck_mass) {
        statusEl.innerText = "✓ Stable Remnant Reach | Unitary Restoration";
        statusEl.style.color = "#10b981";
    } else {
        statusEl.innerText = "Active Mass Core: Action Potential Dissipating";
        statusEl.style.color = "#bc00ff";
    }
}
