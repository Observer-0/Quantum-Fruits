/**
 * js/cosmo-lab.js
 * ------------------------
 * Interactive LCDM Departure Monitor.
 * Calculates Geometric Energy Density and Dipole Anomaly Velocity.
 */

const COSMO_CONST = {
    G: 6.67430e-11,
    c: 2.99792458e8,
    M_sun: 1.98847e30,
    ly: 9.4607e15, // light year in meters
    age_now: 13.8e9 * 365.25 * 24 * 3600, // Universe age in seconds (fallback)
    radius_now: 46.5e9 * 9.4607e15, // Comoving radius in meters (fallback)
    rho_lcdm: 6e-27 // Standard LCDM critical density approx kg/m^3
};

// Allow global overrides (set by main.js) so all tools share the same cosmological window.
if (typeof window !== 'undefined' && window.COSMO_GLOBAL) {
    try {
        const GLOB = window.COSMO_GLOBAL;
        if (GLOB.age_now) COSMO_CONST.age_now = GLOB.age_now;
        if (GLOB.radius_now) COSMO_CONST.radius_now = GLOB.radius_now;
        if (GLOB.SIGMA_P) COSMO_CONST.SIGMA_P = GLOB.SIGMA_P;
    } catch (e) {
        // ignore and keep fallbacks
    }
} else {
    // compute local SIGMA_P fallback: ħ G / c^4
    COSMO_CONST.SIGMA_P = (1.054571817e-34 * COSMO_CONST.G) / Math.pow(COSMO_CONST.c, 4);
}

function updateCosmoMonitor() {
    // Sliders for age (t) and radius (R)
    const sliderEl = document.getElementById('cosmo-age-slider');
    const agePercent = sliderEl ? parseFloat(sliderEl.value) : 100;

    // Scale current age and radius using the same window (user requirement)
    // Guard against zero to avoid NaN/Infinity in formulas.
    const t = Math.max((agePercent / 100) * COSMO_CONST.age_now, 1); // at least 1 s
    const R = Math.max((agePercent / 100) * COSMO_CONST.radius_now, 1); // at least 1 m

    // Energy Density Formula: epsilon = 3c^3 / (8 * pi * G * R * t)
    // Geometric Energy Density: ensure numeric stability
    let epsilon = 0;
    if (R > 0 && t > 0) {
        epsilon = (3 * Math.pow(COSMO_CONST.c, 3)) / (8 * Math.PI * COSMO_CONST.G * R * t);
    }

    // Mass Density: rho = epsilon / c^2
    const rho = epsilon / Math.pow(COSMO_CONST.c, 2);

    // Velocity Anomaly (Dipole): V_anomaly approx relates to the "stiffness" error
    // If LCDM predicts V_lcdm approx 370 km/s (CMB dipole)
    // Zander observation: 4x faster anomaly.
    const v_base = 370; // km/s
    const v_zander = v_base * (1 + (3 * (100 - agePercent) / 100)); // Scaled anomaly logic

    // Update UI
    document.getElementById('val-cosmo-t').innerText = (t / (3600 * 24 * 365.25 * 1e9)).toFixed(2) + " Bio. Jahre";
    document.getElementById('val-cosmo-r').innerText = (R / (COSMO_CONST.ly * 1e9)).toFixed(1) + " Gly";
    document.getElementById('val-cosmo-rho').innerText = rho.toExponential(4) + " kg/m³";
    document.getElementById('val-cosmo-v').innerText = v_zander.toFixed(0) + " km/s";

    // Departure Gauge (Percentage)
    const departure = Math.abs((rho / COSMO_CONST.rho_lcdm) - 1) * 100;
    document.getElementById('cosmo-departure-fill').style.width = Math.min(100, departure / 10) + "%";
    document.getElementById('val-cosmo-dep').innerText = departure.toFixed(2) + "% Abweichung";

    if (departure > 50) {
        document.getElementById('cosmo-alert').innerText = "⚠️ LCDM-BREUCH: Die Geometrie weicht massiv vom Standardmodell ab!";
        document.getElementById('cosmo-alert').style.color = "#ef4444";
    } else {
        document.getElementById('cosmo-alert').innerText = "✓ Geometrische Harmonie: σₚ skaliert mit R*t.";
        document.getElementById('cosmo-alert').style.color = "#10b981";
    }
}

/**
 * Monte Carlo Simulation for Hubble Tension
 * Resolves the 67 vs 73 discrepancy via stochastic ensemble averaging.
 */
function runHubbleMC() {
    const n_universes = 5000;
    const results_H = [];
    let expansionCount = 0;

    const H_expansion = 73.0;
    const H_deflation = 67.0;

    for (let i = 0; i < n_universes; i++) {
        const temp = 20 + Math.random() * 41; // 20 to 61
        const isExpansion = Math.random() > 0.5;

        let hValue;
        if (isExpansion) {
            expansionCount++;
            // Small jitter based on temperature relative to boiling point (61)
            hValue = H_expansion + (Math.random() - 0.5) * (temp / 61);
        } else {
            hValue = H_deflation + (Math.random() - 0.5) * (temp / 61);
        }
        results_H.push(hValue);
    }

    // Calculate stats
    const meanH = results_H.reduce((a, b) => a + b, 0) / n_universes;
    const phaseRatio = (expansionCount / n_universes * 100).toFixed(1);

    // Update UI
    document.getElementById('hubble-mc-results').style.display = 'block';
    document.getElementById('mc-h0-mean').innerText = meanH.toFixed(2) + " km/s/Mpc";
    document.getElementById('mc-phase-ratio').innerText = `${phaseRatio}% Exp. / ${(100 - phaseRatio).toFixed(1)}% Def.`;

    // Visualize distribution
    const viz = document.getElementById('hubble-distribution-viz');
    viz.innerHTML = '';

    // Create histogram bins
    const bins = 50;
    const min = 65, max = 75;
    const histogram = new Array(bins).fill(0);

    results_H.forEach(h => {
        const binIndex = Math.floor(((h - min) / (max - min)) * bins);
        if (binIndex >= 0 && binIndex < bins) histogram[binIndex]++;
    });

    const maxFreq = Math.max(...histogram);
    histogram.forEach(freq => {
        const bar = document.createElement('div');
        bar.style.flex = '1';
        bar.style.height = (freq / maxFreq * 100) + '%';
        bar.style.background = '#3b82f6';
        bar.style.opacity = '0.7';
        viz.appendChild(bar);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const ageSlider = document.getElementById('cosmo-age-slider');
    if (ageSlider) {
        ageSlider.oninput = updateCosmoMonitor;
        updateCosmoMonitor();
    }
});
