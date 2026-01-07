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
    age_now: 13.8e9 * 365.25 * 24 * 3600, // Universe age in seconds
    radius_now: 46.5e9 * 9.4607e15, // Comoving radius in meters
    rho_lcdm: 6e-27 // Standard LCDM critical density approx kg/m^3
};

function updateCosmoMonitor() {
    // Sliders for age (t) and radius (R)
    const agePercent = parseFloat(document.getElementById('cosmo-age-slider').value);

    // Scale current age and radius
    const t = (agePercent / 100) * COSMO_CONST.age_now;
    const R = (agePercent / 100) * COSMO_CONST.radius_now;

    // Energy Density Formula: epsilon = 3c^3 / (8 * pi * G * R * t)
    const epsilon = (3 * Math.pow(COSMO_CONST.c, 3)) / (8 * Math.PI * COSMO_CONST.G * R * t);

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

document.addEventListener('DOMContentLoaded', () => {
    const ageSlider = document.getElementById('cosmo-age-slider');
    if (ageSlider) {
        ageSlider.oninput = updateCosmoMonitor;
        updateCosmoMonitor();
    }
});
