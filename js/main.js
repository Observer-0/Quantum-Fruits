// === Imports ===
import {
  simulatePageCurve,
  CONSTS,
  schwarzschildRadius,
  hawkingTemperature,
  bekensteinHawkingEntropy,
  simulateRotationCurve // Imported Galaxy Engine
} from './sigmaP.js';

// === Naturkonstanten ===
const { hbar, G, c, kB } = CONSTS;

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
qgSelect.addEventListener("change", handleToolChange);
