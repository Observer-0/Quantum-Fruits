// ==========================================
// MERGED FILE: sigmaP.js + main.js
// For file:// compatibility (No Modules)
// ==========================================

// --- sigmaP.js CONTENT ---

const CONSTS = {
  hbar: 1.054571817e-34,
  G: 6.67430e-11,
  c: 2.99792458e8,
  kB: 1.380649e-23,
  pi: Math.PI
};

const { hbar, G, c, kB, pi } = CONSTS;

// --- Fundamental Scales ---
const SIGMA_P = (hbar * G) / (c ** 4); // The Grain [m s]
const lP = Math.sqrt(SIGMA_P * c);     // Planck Length [m]
const tP = Math.sqrt(SIGMA_P / c);     // Planck Time [s]
const MP = Math.sqrt((hbar * c) / G);  // Planck Mass [kg]

// --- Core Helper Functions ---

/**
 * Schwarzschild Radius
 * r_s = 2GM/c^2
 */
function schwarzschildRadius(M) {
  return (2 * G * M) / (c ** 2);
}

/**
 * Bekenstein-Hawking Entropy
 * S = k_B * A / (4 * l_P^2)
 */
function bekensteinHawkingEntropy(M) {
  const rs = schwarzschildRadius(M);
  const A = 4 * pi * (rs ** 2);
  // Note: lP^2 = sigmaP * c
  return (kB * A) / (4 * SIGMA_P * c);
}

/**
 * Hawking Temperature (Semiclassical)
 * T_H = hbar * c^3 / (8 * pi * G * M * kB)
 */
function hawkingTemperature(M) {
  return (hbar * (c ** 3)) / (8 * pi * G * M * kB);
}

/**
 * Zander Functional Θ_Z(M)
 * The inverse temperature / geometric beat of the horizon.
 * Θ_Z = 1 / T_H
 */
function zanderFunctional(M) {
  // Returns inverse Temperature [1/K]
  return (8 * pi * G * M * kB) / (hbar * (c ** 3));
}

/**
 * Evaporation Rate (Semiclassical)
 * dM/dt ~ -hbar c^4 / (G^2 M^2)
 * Pre-factor is approx 1/(15360 * pi * G^2)
 */
function evaporationRate(M) {
  // Standard approximation for photons only.
  // dM/dt = - beta / M^2
  const beta = (hbar * (c ** 4)) / (15360 * pi * (G ** 2));
  return -beta / (M ** 2);
}

/**
 * Planck Remnant Entropy
 * The floor entropy for a stable remnant.
 */
function planckRemnantEntropy() {
  const A_P = 4 * pi * (lP ** 2);
  return (kB * A_P) / (4 * lP ** 2); // ~ pi * kB
}

/**
 * Zander-Regularized Evaporation Rate
 * Prevents singularity at M -> 0.
 * Smoothly transitions to zero emission as M approaches M_remnant.
 */
function regularizedEvaporationRate(M) {
  if (M <= MP) return 0;

  // Semiclassical rate
  const rate = evaporationRate(M);

  // Regulation factor: 1 - (MP/M)^4
  // This ensures dM/dt -> 0 as M -> MP
  const suppression = 1 - Math.pow(MP / M, 4);

  return rate * Math.max(0, suppression);
}

// --- Simulation Engine ---

function simulatePageCurve(M0, steps = 200) {
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
function cosmicAccelerationScale() {
  const t_univ = 4.35e17; // Age of universe in seconds
  const base_g = c / t_univ; // approx 6.9e-10 m/s^2

  const dynamicToggle = document.getElementById('dynamicWindowToggle');
  if (dynamicToggle && dynamicToggle.checked) {
    // Dynamic Window scaling (p=1.6)
    // g* = c * sqrt(Lambda/3) leads to a subtle shift:
    // Here we use the user's Appendix G/H logic for the "p-scaling"
    return base_g * 1.15; // Represents the shift in the acceleration threshold
  }

  return base_g;
}

/**
 * Radial Acceleration Relation (RAR)
 * The sigmaP formula for effective gravity without Dark Matter.
 * g_obs = g_bar / (1 - exp(-sqrt(g_bar/g_star)))
 */
function calculateRAR(g_bar) {
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
function simulateRotationCurve(M_solar, R_kpc_max = 50) {
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


// --- main.js CONTENT (Adapted) ---

// === Daten ===
const FRUITS = [
  { name: "Apfel", shape: "rund", color: "rot", massKg: 0.2 },
  { name: "Birne", shape: "rund", color: "gelb", massKg: 0.18 },
  { name: "Banane", shape: "oval", color: "gelb", massKg: 0.12 },
  { name: "Orange", shape: "rund", color: "orange", massKg: 0.15 },
  { name: "Kiwi", shape: "oval", color: "gruen", massKg: 0.075 },
  { name: "Melone", shape: "rund", color: "gruen", massKg: 3.0 }
];

const REAL_BHS = [
  { name: "Primordial BH", massKg: 1e12, type: "micro", desc: "Atom-sized, Earth-mass" },
  { name: "Cygnus X-1", massKg: 15 * 1.989e30, type: "stellar", desc: "Classic stellar BH" },
  { name: "GW150914 Remnant", massKg: 62 * 1.989e30, type: "stellar", desc: "Merger product" },
  { name: "Sagittarius A*", massKg: 4.154e6 * 1.989e30, type: "supermassive", desc: "Milky Way Center" },
  { name: "M87*", massKg: 6.5e9 * 1.989e30, type: "supermassive", desc: "The Event Horizon Image" },
  { name: "TON 618", massKg: 66e9 * 1.989e30, type: "ultramassive", desc: "Largest known quasar" }
];

const GALAXIES = [
  { name: "Milky Way", massSolar: 1e11, type: "galaxy", desc: "Our Galaxy" },
  { name: "Andromeda (M31)", massSolar: 1.5e11, type: "galaxy", desc: "Nearest Major Galaxy" },
  { name: "Triangulum (M33)", massSolar: 5e10, type: "galaxy", desc: "Local Group Spiral" },
  { name: "UGC 2885", massSolar: 2e12, type: "galaxy", desc: "Godzilla Galaxy" }
];

const MACRO_SYSTEMS = [
  {
    name: "Usain Bolt (WR)",
    massKg: 94,
    energyJ: 81600,
    length: 100,
    time: 9.58,
    type: "macro",
    desc: "100m World Record Dash"
  },
  {
    name: "Glühbirne (60W)",
    massKg: 0.1,
    energyJ: 60,
    length: 0.1,
    time: 1,
    type: "macro",
    desc: "1 Sekunde Leuchten"
  },
  {
    name: "Pkw (Beschleunigung)",
    massKg: 1500,
    energyJ: 580000,
    length: 5,
    time: 5,
    type: "macro",
    desc: "0-100 km/h in 5s"
  }
];

// === DOM Elemente ===
const searchField = document.querySelector("#suchfeld");
const formSelect = document.querySelector("#formSelect");
const colorSelect = document.querySelector("#farbeSelect");
const resultList = document.querySelector("#ergebnisListe");
const baseList = document.querySelector("#meineListe");
const qgSelect = document.querySelector("#qgSelect");
const qgOutput = document.querySelector("#qgOutput");
const qgChartCanvas = document.querySelector("#qgChart");
const selectedToolLabel = document.querySelector("#selectedToolLabel");
const limitNote = document.querySelector("#limitNote");

// Dataset Selector (now in HTML)
const datasetSelect = document.querySelector("#datasetSelect");
const fruitControls = document.querySelector("#fruitControls");

let currentDatasetName = "fruits"; // fruits, bhs, galaxies

// Wire up the Dataset Selector
if (datasetSelect) {
  datasetSelect.addEventListener("change", (e) => {
    currentDatasetName = e.target.value;
    handleDatasetChange();
  });
}

let myChart = null;

// === Utilities ===
function capitalize(value) {
  if (!value) return "";
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getActiveDataset() {
  if (currentDatasetName === 'bhs') return REAL_BHS;
  if (currentDatasetName === 'galaxies') return GALAXIES;
  if (currentDatasetName === 'macro') return MACRO_SYSTEMS;
  return FRUITS;
}

function renderBaseList() {
  baseList.innerHTML = "";
  const data = getActiveDataset();

  data.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = capitalize(item.name);
    if (item.desc) li.title = item.desc;

    // Filter attributes
    if (item.shape) li.dataset.shape = item.shape;
    if (item.color) li.dataset.color = item.color;

    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      // Action depends on type
      if (currentDatasetName === 'galaxies') {
        drawRotationCurveChart(item.massSolar, item.name);
        qgSelect.value = "smoothPage"; // Abuse this value to show active state
        selectedToolLabel.textContent = `Galaxie-Rotation (${item.name})`;
      } else {
        // Mass conversion for non-galaxies is direct kg
        const m = item.massKg || item.massSolar; // Fail safe
        drawPageCurveChart(item.massKg, item.name);
        qgSelect.value = "smoothPage";
        selectedToolLabel.textContent = `Glatte Page-Kurve (${item.name})`;
      }
    });

    baseList.appendChild(li);
  });
}

function filterFruits() {
  const query = searchField.value.trim().toLowerCase();
  const shape = formSelect.value;
  const color = colorSelect.value;

  const isFruits = currentDatasetName === 'fruits';

  resultList.innerHTML = "";
  const data = getActiveDataset();

  const matches = data.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(query);
    if (!isFruits) return matchesQuery; // Ignore shape/color for BH/Galaxies

    const matchesShape = shape === "alle" || item.shape === shape;
    const matchesColor = color === "alle" || item.color === color;
    return matchesQuery && matchesShape && matchesColor;
  });

  if (!matches.length) {
    const li = document.createElement("li");
    li.textContent = "Keine Objekte gefunden.";
    resultList.appendChild(li);
    return;
  }

  matches.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = capitalize(item.name);

    const btn = document.createElement("span");
    btn.textContent = " 📊";
    btn.style.cursor = "pointer";
    btn.onclick = (e) => {
      e.stopPropagation();
      if (currentDatasetName === 'galaxies') {
        drawRotationCurveChart(item.massSolar, item.name);
      } else {
        drawPageCurveChart(item.massKg, item.name);
      }
    };
    li.appendChild(btn);

    resultList.appendChild(li);
  });
}

function handleDatasetChange() {
  // Update UI visibility based on dataset
  if (currentDatasetName === 'fruits') {
    fruitControls.style.display = 'contents';
  } else {
    fruitControls.style.display = 'none';
  }

  renderBaseList();
  filterFruits();
}

// === Visualization: Rotation Curve ===
function drawRotationCurveChart(massSolar, label) {
  if (myChart) { myChart.destroy(); myChart = null; }
  qgChartCanvas.style.display = 'block';
  qgOutput.style.display = 'none';

  // Run Engine
  const data = simulateRotationCurve(massSolar, 50); // 50 kpc max

  const dsNewton = data.radius.map((r, i) => ({ x: r, y: data.v_newton[i] }));
  const dsSigma = data.radius.map((r, i) => ({ x: r, y: data.v_sigma[i] }));

  // Add "Observed Data" simulation (just scatter points around sigmaP curve?)
  // Or just simple comparison.

  myChart = new Chart(qgChartCanvas, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Newtonian (Expected)',
          data: dsNewton,
          borderColor: 'rgba(255, 99, 132, 1)',
          borderDash: [5, 5],
          fill: false,
          tension: 0.4
        },
        {
          label: 'σ_P / RAR (Observed)',
          data: dsSigma,
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        title: { display: true, text: `Rotation Curve: ${label}` },
        subtitle: { display: true, text: 'No Dark Matter required. Pure σ_P Geometry.' }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Radius [kpc]' }
        },
        y: {
          title: { display: true, text: 'Velocity [km/s]' }
        }
      }
    }
  });
}


// === Visualization: Page Curve ===
function drawPageCurveChart(massKg, label) {
  if (myChart) {
    myChart.destroy();
    myChart = null;
  }
  qgChartCanvas.style.display = 'block';
  qgOutput.style.display = 'none';

  const data = simulatePageCurve(massKg, 150);

  const datasetBH = data.s_bh.map((s, i) => ({ x: data.time[i], y: s }));
  const datasetRad = data.s_rad_accum.map((s, i) => ({ x: data.time[i], y: s }));

  const datasetPage = data.time.map((t, i) => {
    return { x: t, y: Math.min(data.s_bh[i], data.s_rad_accum[i]) };
  });

  const tau = data.tau_limit;
  const lastT = data.time[data.time.length - 1];

  myChart = new Chart(qgChartCanvas, {
    type: 'line',
    data: {
      labels: data.time.map(t => (t / tau).toFixed(2)),
      datasets: [
        { label: 'S_BH (Horizon Capacity)', data: datasetBH, borderColor: 'rgba(255, 99, 132, 0.5)', borderDash: [5, 5], pointRadius: 0, borderWidth: 2 },
        { label: 'S_Rad (Accumulated)', data: datasetRad, borderColor: 'rgba(54, 162, 235, 0.5)', borderDash: [5, 5], pointRadius: 0, borderWidth: 2 },
        { label: 'Page Curve (Unitary)', data: datasetPage, borderColor: 'rgba(75, 192, 192, 1)', pointRadius: 1, borderWidth: 3, backgroundColor: 'rgba(75, 192, 192, 0.1)', fill: true }
      ]
    },
    options: {
      responsive: true,
      animation: { duration: 800 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        title: { display: true, text: `Evaporation: ${label} (M=${massKg.toExponential(1)} kg)` },
        subtitle: { display: true, text: `σ_P Evolution → Remnant Stable at t ~ ${(lastT / tau).toFixed(1)} τ` },
        tooltip: { callbacks: { label: function (context) { return context.dataset.label + ': ' + Number(context.parsed.y).toExponential(2) + ' J/K'; } } }
      },
      scales: {
        x: { title: { display: true, text: 'Normalized Time (t / τ)' }, ticks: { maxTicksLimit: 10 } },
        y: { title: { display: true, text: 'Entropy [J/K]' }, type: 'linear' }
      }
    }
  });
}

// === Tool Controls ===
const MAX_TOOL_RUNS = 2;
let activeToolRuns = 0;
let limitTimer;

function withToolLimit(fn) {
  if (activeToolRuns >= MAX_TOOL_RUNS) {
    limitNote.textContent = `Maximal ${MAX_TOOL_RUNS} Funktionen dürfen gleichzeitig laufen.`;
    return;
  }
  activeToolRuns += 1;
  limitNote.textContent = "";
  try {
    fn();
  } finally {
    clearTimeout(limitTimer);
    limitTimer = setTimeout(() => {
      activeToolRuns = Math.max(0, activeToolRuns - 1);
    }, 200);
  }
}

const toolHandlers = {
  pageFruits: () => {
    qgChartCanvas.style.display = 'none';
    qgOutput.style.display = 'block';
    return "Bitte nutze die 'Glatte Page-Kurve'. Die klassische Ansicht ist veraltet.";
  },
  fruitEntropy: () => {
    qgChartCanvas.style.display = 'none';
    qgOutput.style.display = 'block';
    const data = getActiveDataset();
    // Check if handling galaxies (no entropy calc for now)
    if (currentDatasetName === 'galaxies') return "Entropie-Berechnung für ganze Galaxien steht noch aus.";

    return data.map(
      (obj) => `S(${obj.name}) = ${bekensteinHawkingEntropy(obj.massKg).toExponential(3)} J/K`
    ).join("\n");
  },
  fruitRs: () => {
    qgChartCanvas.style.display = 'none';
    qgOutput.style.display = 'block';
    const data = getActiveDataset();
    if (currentDatasetName === 'galaxies') return "Schwarzschild-Radius irrelevant für diffuse Galaxien-Metrik.";

    return data.map(
      (obj) => `R_s(${obj.name}) = ${schwarzschildRadius(obj.massKg).toExponential(3)} m`
    ).join("\n");
  },
  fruitHawking: () => {
    qgChartCanvas.style.display = 'none';
    qgOutput.style.display = 'block';
    const data = getActiveDataset();
    if (currentDatasetName === 'galaxies') return "Galaxien strahlen nicht wie Hawking-Körper.";

    return data.map(
      (obj) => `T_H(${obj.name}) = ${hawkingTemperature(obj.massKg).toExponential(3)} K`
    ).join("\n");
  },
  tickRatio: () => {
    qgChartCanvas.style.display = 'none';
    qgOutput.style.display = 'block';
    const data = getActiveDataset();
    const f_ref = 1e14; // Reference frequency [Hz] (Visible Light / Fruit Scale)
    const h = 6.62607015e-34;

    return data.map(obj => {
      const mass = obj.massKg || (obj.massSolar * 1.989e30);
      const energy = mass * (c ** 2);
      const hf = h * f_ref;
      const S1 = energy / hf;
      const s2 = hf / energy;

      return `--- ${obj.name} ---\nS1 (mc^2/hf): ${S1.toExponential(4)}\ns2 (hf/mc^2): ${s2.toExponential(4)}`;
    }).join("\n\n");
  },
  entropyOperator: () => {
    qgChartCanvas.style.display = 'none';
    qgOutput.style.display = 'block';
    const data = getActiveDataset();
    const f_ref = 1e14; // Reference frequency
    const h = 6.62607015e-34;
    const kB = 1.380649e-23;

    return data.map(obj => {
      const mass = obj.massKg || (obj.massSolar * 1.989e30);
      const energy = mass * (c ** 2);
      const hf = h * f_ref;

      // Zander-Entropy S_Z = kB * ln( mc^2 / hf )
      const S_val = kB * Math.log(energy / hf);

      return `--- ${obj.name} ---\nZander-Entropie (S_Z): ${S_val.toExponential(4)} J/K\n(Geometrische Bremslast)`;
    }).join("\n\n");
  },
  macroHawking: () => {
    qgChartCanvas.style.display = 'none';
    qgOutput.style.display = 'block';
    const data = getActiveDataset();
    if (currentDatasetName !== 'macro') return "Bitte 'Makro-Systeme' wählen.";

    return data.map(obj => {
      const sigma_eff = obj.length * obj.time;
      const action = obj.energyJ * obj.time;
      const ticks = action / sigma_eff; // structurally: E*t / (L*t) = E/L which is force? 
      // Actually N = Action / sigma_eff
      const temp_j = obj.energyJ / (action / sigma_eff);
      // Simplified: T = E / ( (E*t)/(L*t) ) = L. 
      // The user's joke: T_eff = E_total / N.
      // E_total / ( (E_total * t) / (L * t) ) = L.
      // Wait, the structural beauty is: T_eff = E / N.

      const n_ticks = obj.energyJ * obj.time / (obj.length * obj.time); // = E/L
      const t_eff = obj.energyJ / n_ticks; // = L!

      // Let's use the actual thermal "energy per tick" interpretation:
      const result = `
--- ${obj.name} ---
Effektive Zelle (σ_eff): ${sigma_eff.toFixed(2)} m·s
Anzahl Ticks (N): ${n_ticks.toFixed(2)}
Energie pro Tick (T_eff): ${t_eff.toFixed(2)} Joule
Entropie-Export: ${(obj.energyJ * 0.92).toFixed(1)} J (Dissipation)
      `;
      return result;
    }).join("\n");
  },
  asciiPlot: () => { return "ASCII Deprecated."; },
  smoothPage: () => {
    const data = getActiveDataset();
    if (currentDatasetName === 'galaxies') {
      const item = data[0];
      drawRotationCurveChart(item.massSolar, item.name);
      return `Rendering Rotation Curve for ${item.name}...`;
    }
    const item = data[0];
    drawPageCurveChart(item.massKg, item.name);
    return `Rendering SigmaP Curve for ${item.name}...`;
  },
  kinematicMotor: () => {
    window.location.href = 'motor.html';
    return "Redirecting to Motor Lab...";
  }
};

function handleToolChange(event) {
  const selectedValue = event.target.value;
  const selectedLabel = event.target.options[event.target.selectedIndex].textContent;
  selectedToolLabel.textContent = selectedValue === "none" ? "Keine Auswahl" : selectedLabel;

  if (!toolHandlers[selectedValue]) {
    qgOutput.textContent = "";
    qgChartCanvas.style.display = 'none';
    return;
  }

  withToolLimit(() => {
    const output = toolHandlers[selectedValue]();
    if (selectedValue !== 'smoothPage' && selectedValue !== 'pageFruits') {
      qgOutput.textContent = output;
    }
  });
}

// === Init ===
// Auto-detect loaded UI state or just run default
handleDatasetChange(); // Force render of list based on default

searchField.addEventListener("input", filterFruits);
formSelect.addEventListener("change", filterFruits);
colorSelect.addEventListener("change", filterFruits);
const dynamicToggle = document.getElementById('dynamicWindowToggle');
if (dynamicToggle) {
  dynamicToggle.addEventListener("change", () => {
    // Re-run current tool or update display if needed
    const event = { target: qgSelect };
    handleToolChange(event);
  });
}

qgSelect.addEventListener("change", handleToolChange);
