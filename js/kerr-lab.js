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

    // Smearing Visualization (Dimensionless offsets)
    const smear = (results.c0_tot * 100).toFixed(6);
    document.getElementById('kerr-smear-note').innerText = `Horizon Smearing: ${smear}% shift from pure thermal state.`;
}

function calculateKerr(M, chi, tau, L) {
    const M_geo = KERR_CONST.G * M / (KERR_CONST.c * KERR_CONST.c);
    const a_geo = chi * M_geo;
    const s = Math.sqrt(Math.max(0, 1.0 - chi * chi));
    const r_plus = M_geo * (1.0 + s);
    const r_minus = M_geo * (1.0 - s);
    const denom = 2.0 * (r_plus * r_plus + a_geo * a_geo);
    const kappa_geo = (r_plus - r_minus) / denom;
    const kappa_SI = KERR_CONST.c * KERR_CONST.c * kappa_geo;
    const T_H = (KERR_CONST.hbar * KERR_CONST.c * kappa_geo) / (2.0 * Math.PI * KERR_CONST.kB);

    const eps_t = (tau * kappa_SI) / KERR_CONST.c;
    const eps_s = L / r_plus;

    // c0_temporal: (pi^2 / 6) * eps_t^2
    const c0_t = (Math.PI * Math.PI / 6.0) * (eps_t * eps_t);

    // c0_spatial: 0.5 * eps_s^2 * sum(w_lm * slope_lm^2)
    // Placeholder for Teukolsky weights (using demo values from scaffold)
    const weighted_slope2 = 0.8;
    const c0_s = 0.5 * (eps_s * eps_s) * weighted_slope2;

    return {
        r_plus, r_minus, kappa_SI, T_H, eps_t, eps_s, c0_t, c0_s, c0_tot: c0_t + c0_s
    };
}
// Initialize listeners
document.addEventListener('DOMContentLoaded', () => {
    const mSlider = document.getElementById('kerr-mass');
    const sSlider = document.getElementById('kerr-spin');
    const tCheck = document.getElementById('kerr-sigmap-toggle');

    if (mSlider) mSlider.oninput = updateKerrLab;
    if (sSlider) sSlider.oninput = updateKerrLab;
    if (tCheck) tCheck.onchange = updateKerrLab;

    // Initial update
    updateKerrLab();
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
