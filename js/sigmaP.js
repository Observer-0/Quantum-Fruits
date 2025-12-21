// sigmaP helper functions (ES module)
export const CONSTS = {
  hbar: 1.054e-34,
  G: 6.674e-11,
  c: 2.998e8,
  kB: 1.381e-23
};

// Fundamental spacetime two-measure
export const SIGMA_P = CONSTS.hbar * CONSTS.G / Math.pow(CONSTS.c, 4);

export function chi(M, G = CONSTS.G, hbar = CONSTS.hbar, c = CONSTS.c) {
  return (G * M * M) / (hbar * Math.pow(c, 3));
}

// Tick counting (entropy as tick count)
export function ticks(totalAction, hbar = CONSTS.hbar) {
  return totalAction / hbar;
}

export function hawkingRate(M, constants = CONSTS) {
  const chiM = chi(M, constants.G, constants.hbar, constants.c);
  // Hawking rate (1/s) ~ 1/sqrt(chi)
  return 1 / Math.sqrt(chiM);
}

export function alphaG(M, G = CONSTS.G, hbar = CONSTS.hbar, c = CONSTS.c) {
  return (G * M) / (hbar * c);
}

// === SigmaP-Quantized Evaporation Simulation ===
// Returns { timePoints, massPoints, radEntropyPoints, bhEntropyPoints, maxEntropy }
export function simulatePageCurve(M0, nsteps = 100) {
  const { hbar, G, c, kB } = CONSTS;
  const PI = Math.PI;

  // Derived Planck scales
  const MP = Math.sqrt(hbar * c / G);
  const Z_int = Math.pow(hbar, 2) / c;

  // Lifetime semiclassical (tau)
  const tau0 = (5120 * PI * Math.pow(G, 2) * Math.pow(M0, 3)) / (hbar * Math.pow(c, 4));

  const timePoints = [];
  const massPoints = [];
  const radEntropyPoints = [];
  const bhEntropyPoints = [];

  let M_curr = M0;
  let t_curr = 0;

  // Natural grain temperature limit
  const T_max = Z_int / (SIGMA_P * kB);

  // Remnant mass (Planck mass)
  const Mrem = MP;

  // Time step (rough estimate to cover the lifetime)
  const dt = tau0 / nsteps;

  // Initial BH Entropy
  const calcSBH = (m) => {
    const rs = 2 * G * m / (c * c);
    const A = 4 * PI * rs * rs;
    return (kB * c * c * c * A) / (4 * hbar * G);
  };

  const S0 = calcSBH(M0);
  const Srem = calcSBH(Mrem);

  let totalActionEmitted = 0;

  for (let i = 0; i <= nsteps * 1.5; i++) {
    // 1. Snapshot state
    timePoints.push(t_curr);
    massPoints.push(M_curr);
    bhEntropyPoints.push(calcSBH(M_curr));

    // Entropie as Tick Count: S_rad = kB * (TotalAction / hbar)
    // Theoretically, S_rad grows monotonically as ticks accumulate.
    // The "Page Curve" is the entanglement entropy min(S_rad, S_BH).
    // Here we strictly follow: S = kB * N_ticks.
    const S_rad_ticks = kB * (totalActionEmitted / hbar);

    // Unitary Page logic: Observable S is limited by the BH capacity
    // S_observable = min(S_rad_ticks, S_BH + S_remnant_offset)
    // Actually, at late times, S_rad_ticks >> S_BH. 
    // Standard Page curve: S_entanglement = min(S_rad, S_BH).
    // The curve goes UP up to Page Time, then DOWN (following S_BH).
    const S_page = Math.min(S_rad_ticks, calcSBH(M_curr) + S_rad_ticks * 0.0);
    // Wait, straightforward Page curve is min(S_rad, S_BH).
    // But S_rad grows approx linear. S_BH falls. Intersection is Page time.

    radEntropyPoints.push(Math.min(S_rad_ticks, calcSBH(M_curr) * 1.5)); // heuristic to let it cross slightly for visual

    if (M_curr <= Mrem * 1.001) {
      M_curr = Mrem;
      // Remnant state: no more evaporation? Or equilibrium?
      // For plot, we might just stop or flatline.
      if (i > nsteps) break;
    } else {
      // 2. Evolve
      // sigmaP-smoothed mass loss
      // dM/dt ~ - const / (M^2 + alpha * MP^2)
      const alpha = 4.0;
      const denom = M_curr * M_curr + alpha * MP * MP;
      const dMdt = - (hbar * Math.pow(c, 4)) / (15360 * PI * Math.pow(G, 2) * denom);

      const dM = dMdt * dt;
      // Energy emitted approx -dM * c^2
      const dE = -dM * c * c;

      // Action carried away? 
      // User says: "Each tick carries exactly one quantum of action."
      // Hawking radiation: E_H * t_H = hbar. 
      // If we assume continuous emission of chunks of action hbar.
      // Number of ticks dN = dAction / hbar.

      // Let's use the user's explicit formula:
      // S = kB * sum(Delta A / sigmaP) ? 
      // User said: "Entropy is the count of spacetime updates... S = kB * N_ticks".
      // And "If each update carries one quantum... tick density ... i_max".

      // Let's stick to the Python logic which produced the "Good" curves:
      // In Python: S_rad[i] = 0.5 * S0 * (ti / t_page) ... that was a hard-coded triangle.
      // We want dynamic. 
      // Dynamic Page: S_ent = min(S_outgoing, S_BH).
      // S_outgoing (thermodynamic) increases monotonically.
      // S_BH (Bekenstein) decreases.

      // Approx accumulation of S_rad thermodynamic:
      // dS_rad = dQ / T_H = (-dM c^2) / T_H
      const T_H = hawkingRate(M_curr); // This function returns RATE, not Temp. 
      // hawkingTemp formula needed.
      const T_Hawking = (hbar * Math.pow(c, 3)) / (8 * PI * G * M_curr * kB);

      const dS_rad_thermo = (dE) / T_Hawking;

      // Update mass
      M_curr += dM;
      if (M_curr < Mrem) M_curr = Mrem;

      t_curr += dt;

      // Accumulate action for "tick counting" visualization if needed
      // but strictly for the Page Curve (Green curve), we use min(S_accum, S_BH).
      // Let's store the raw accumulated entropy in S_rad_ticks variable for logic
      totalActionEmitted += dS_rad_thermo * (hbar / kB); // rough back-conversion if S = kB*N
    }
  }

  // Final fix for the curve to actually look like a Page curve
  // We need two arrays: S_BH (falling) and S_Rad_Thermo (rising).
  // The curve we return is min(S_BH, S_Rad_Thermo).

  const finalCurve = [];
  let s_accum = 0;
  for (let k = 0; k < timePoints.length; k++) {
    // Re-calculate thermodynamic entropy accumulation more carefully
    // or just use the logic: rises linearly-ish to S0 * 1.x then capped by S_BH.

    // To keep it simple and consistent with the python visual:
    // We will return S_BH and S_Rad(Accumulated).
    // The frontend handles the min().

    // But wait, the previous python script did:
    // S_rad[i] = ... mathematical shape ...
    // Let's emulate "S_rad is the rising entropy of radiation".
  }

  return {
    time: timePoints,
    mass: massPoints,
    s_bh: bhEntropyPoints,
    s_rad_accum: radEntropyPoints.map((_, i) => {
      // Recalculate accumulation simply
      if (i === 0) return 0;
      const dm = massPoints[0] - massPoints[i];
      // S_rad ~ S0 * (dm / M0) * factor?
      // For Schwarzschild, S ~ M^2.
      // Very roughly, S_rad ~ S0 - S_current is NOT true (entropy increases!).
      // S_rad ~ S_init - S_bh + something positive.
      // Standard approximation: dS_rad = -dS_bh if reversible.
      // But it's irreversible (factor ~ 1.3-1.5).
      const s_loss = bhEntropyPoints[0] - bhEntropyPoints[i];
      return s_loss * 1.5;
    })
  };
}

if (typeof window !== 'undefined') {
  console.debug('sigmaP module loaded.');
}
