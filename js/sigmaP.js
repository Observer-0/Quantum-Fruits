// sigmaP.js
// The Core Physics Engine for Quantum Fruits
// Based on the σ_P Universal Language Protocol
// "Kein Bullshit" - Pure Physics.

export const CONSTS = {
  hbar: 1.054571817e-34,
  G: 6.67430e-11,
  c: 2.99792458e8,
  kB: 1.380649e-23,
  pi: Math.PI
};

const { hbar, G, c, kB, pi } = CONSTS;

// --- Fundamental Scales ---
export const SIGMA_P = (hbar * G) / (c ** 4); // The Grain [m s]
export const lP = Math.sqrt(SIGMA_P * c);     // Planck Length [m]
export const tP = Math.sqrt(SIGMA_P / c);     // Planck Time [s]
export const MP = Math.sqrt((hbar * c) / G);  // Planck Mass [kg]

// --- Core Helper Functions ---

/**
 * Schwarzschild Radius
 * r_s = 2GM/c^2
 */
export function schwarzschildRadius(M) {
  return (2 * G * M) / (c ** 2);
}

/**
 * Bekenstein-Hawking Entropy
 * S = k_B * A / (4 * l_P^2)
 */
export function bekensteinHawkingEntropy(M) {
  const rs = schwarzschildRadius(M);
  const A = 4 * pi * (rs ** 2);
  // Note: lP^2 = sigmaP * c
  return (kB * A) / (4 * SIGMA_P * c);
}

/**
 * Hawking Temperature (Semiclassical)
 * T_H = hbar * c^3 / (8 * pi * G * M * kB)
 */
export function hawkingTemperature(M) {
  return (hbar * (c ** 3)) / (8 * pi * G * M * kB);
}

/**
 * Zander Functional Θ_Z(M)
 * The inverse temperature / geometric beat of the horizon.
 * Θ_Z = 1 / T_H
 */
export function zanderFunctional(M) {
  // Returns inverse Temperature [1/K]
  return (8 * pi * G * M * kB) / (hbar * (c ** 3));
}

/**
 * Evaporation Rate (Semiclassical)
 * dM/dt ~ -hbar c^4 / (G^2 M^2)
 * Pre-factor is approx 1/(15360 * pi * G^2)
 */
export function evaporationRate(M) {
  // Standard approximation for photons only.
  // dM/dt = - beta / M^2
  const beta = (hbar * (c ** 4)) / (15360 * pi * (G ** 2));
  return -beta / (M ** 2);
}

/**
 * Planck Remnant Entropy
 * The floor entropy for a stable remnant.
 */
export function planckRemnantEntropy() {
  const A_P = 4 * pi * (lP ** 2);
  return (kB * A_P) / (4 * lP ** 2); // ~ pi * kB
}

/**
 * Zander-Regularized Evaporation Rate
 * Prevents singularity at M -> 0.
 * Smoothly transitions to zero emission as M approaches M_remnant.
 */
export function regularizedEvaporationRate(M) {
  if (M <= MP) return 0;

  // Semiclassical rate
  const rate = evaporationRate(M);

  // Regulation factor: 1 - (MP/M)^4
  // This ensures dM/dt -> 0 as M -> MP
  const suppression = 1 - Math.pow(MP / M, 4);

  return rate * Math.max(0, suppression);
}

// --- Simulation Engine ---

export function simulatePageCurve(M0, steps = 200) {
  const timePoints = [];
  const massPoints = [];
  const sbhPoints = [];
  const sradPoints = [];

  // Time estimate: tau ~ M^3
  const tau = (5120 * pi * (G ** 2) * (M0 ** 3)) / (hbar * (c ** 4));
  const dt = tau / steps;

  let t = 0;
  let M = M0;
  let S_rad_accum = 0;

  // Initial Entropy
  const S0 = bekensteinHawkingEntropy(M0);

  for (let i = 0; i <= steps * 1.5; i++) {
    timePoints.push(t);
    massPoints.push(M);

    // Current BH Entropy
    const S_BH = bekensteinHawkingEntropy(M);
    sbhPoints.push(S_BH);

    // Remnant check
    if (M <= MP * 1.01) {
      M = MP; // Stabilize in Remnant state

      // Radiation entropy stops growing (energy emission stops)
      sradPoints.push(S_rad_accum);
    } else {
      // Evolve
      const dMdt = regularizedEvaporationRate(M);
      const dM = dMdt * dt; // dM is negative

      // Energy radiated
      const dE = -dM * (c ** 2);

      // Entropy increase dS = dE / T_H
      const T = hawkingTemperature(M);
      const dS = dE / T;

      // Irreversibility factor approx 1.0 for simplicity or >1 for realism
      S_rad_accum += dS;

      sradPoints.push(S_rad_accum);

      M += dM;
      t += dt;
    }

    // Safety break if simulation runs too long
    if (timePoints.length > steps * 2) break;
  }

  return {
    time: timePoints,
    mass: massPoints,
    s_bh: sbhPoints,
    s_rad_accum: sradPoints,
    tau_limit: tau
  };
}

// --- Galactic Dynamics (The Dark Matter Illusion) ---

/**
 * Cosmic Acceleration Scale (g_dagger / a_0)
 * Derived from SigmaP limits: a_0 ~ c / t_age ~ c * H
 * 
 * t_univ approx 4.35e17 s
 */
export function cosmicAccelerationScale() {
  const t_univ = 4.35e17; // Age of universe in seconds
  // Ideally this comes from H(t) derived from sigmaP, but linear approx is fine.
  return c / t_univ; // approx 6.9e-10 m/s^2 
  // Wait, standard a0 is 1.2e-10. 
  // c = 3e8. t~4e17. c/t ~ 0.75e-9. 
  // User's python used: c / t_univ.
}

/**
 * Radial Acceleration Relation (RAR)
 * The sigmaP formula for effective gravity without Dark Matter.
 * g_obs = g_bar / (1 - exp(-sqrt(g_bar/g_star)))
 */
export function calculateRAR(g_bar) {
  const g_star = cosmicAccelerationScale(); // Or 1.2e-10 for empirical match
  // Use the theoretical value for "Pure Physics" mode, or tune to 1.2e-10?
  // User's script implies using the calculated one: g_sigmaP

  // Refined formula from user script:
  const sqrt_term = Math.sqrt(g_bar / g_star);

  if (sqrt_term < 1e-9) {
    // Linear limit (Deep MOND)
    // g_obs = sqrt(g_bar * g_star)
    return Math.sqrt(g_bar * g_star);
  }

  return g_bar / (1 - Math.exp(-sqrt_term));
}

/**
 * Simulate Galaxy Rotation Curve
 * @param {number} M_solar - Mass in Solar Masses
 * @param {number} R_kpc_max - Max radius in kpc
 */
export function simulateRotationCurve(M_solar, R_kpc_max = 50) {
  const M_kg = M_solar * 1.989e30;
  const kpc_to_m = 3.086e19;

  const radiuss = [];
  const v_newton = [];
  const v_observed = []; // The RAR prediction

  // Step size
  const steps = 50;
  const dr = R_kpc_max / steps;

  for (let i = 1; i <= steps; i++) {
    const r_kpc = i * dr;
    const r_m = r_kpc * kpc_to_m;

    radiuss.push(r_kpc);

    // 1. Baryonic Newtonian Gravity
    // g_bar = G * M / r^2
    // Assuming point mass approximation for simplicity in this demo.
    // Real RAR uses disk integration, but point mass shows the divergence perfectly.

    const g_bar = (G * M_kg) / (r_m ** 2);

    // Newton Velocity
    const v_N = Math.sqrt(g_bar * r_m);
    v_newton.push(v_N / 1000); // km/s

    // 2. SigmaP / RAR Gravity
    const g_obs = calculateRAR(g_bar);
    const v_O = Math.sqrt(g_obs * r_m);
    v_observed.push(v_O / 1000); // km/s
  }

  return {
    radius: radiuss,
    v_newton,
    v_sigma: v_observed
  };
}
