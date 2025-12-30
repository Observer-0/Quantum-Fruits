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
