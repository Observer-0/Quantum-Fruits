// === Imports ===
import { simulatePageCurve, CONSTS, SIGMA_P } from './sigmaP.js';

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

const SPECIAL_MASSES = {
  pbh: 1e12, // primordial
  stellar: 5e30,
  smbh: 1e34
};

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
const modeSelect = document.querySelector("#modeSelect");
const fruitControls = document.querySelector("#fruitControls");

let myChart = null;
let currentMode = "fruits"; // 'fruits' or 'real'

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
  return currentMode === 'real' ? REAL_BHS : FRUITS;
}

function renderBaseList() {
  baseList.innerHTML = "";
  const data = getActiveDataset();

  data.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = currentMode === 'real'
      ? `${item.name} (${item.type})`
      : capitalize(item.name);

    // Store metadata for filtering if needed
    if (item.shape) li.dataset.shape = item.shape;
    if (item.color) li.dataset.color = item.color;

    // Add click handler to simulate selecting this object
    li.style.cursor = "pointer";
    li.title = `Mass: ${item.massKg.toExponential(1)} kg`;
    li.addEventListener("click", () => {
      // Quick visual check
      drawPageCurveChart(item.massKg, item.name);
      qgSelect.value = "smoothPage"; // fake update UI
      selectedToolLabel.textContent = `Glatte Page-Kurve (${item.name})`;
    });

    baseList.appendChild(li);
  });
}

function filterFruits() {
  const query = searchField.value.trim().toLowerCase();
  const shape = formSelect.value;
  const color = colorSelect.value;

  // In Real mode, shape/color are ignored or hidden
  const isReal = currentMode === 'real';

  resultList.innerHTML = "";
  const data = getActiveDataset();

  const matches = data.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(query);
    if (isReal) return matchesQuery;

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
    li.textContent = isReal ? item.name : capitalize(item.name);

    // Add quick action button
    const btn = document.createElement("span");
    btn.textContent = " 📊";
    btn.style.cursor = "pointer";
    btn.onclick = (e) => {
      e.stopPropagation();
      drawPageCurveChart(item.massKg, item.name);
    };
    li.appendChild(btn);

    resultList.appendChild(li);
  });
}

function handleModeChange() {
  currentMode = modeSelect.value;
  if (currentMode === 'real') {
    fruitControls.style.display = 'none'; // Hide colors/shapes
  } else {
    fruitControls.style.display = 'contents';
  }
  renderBaseList();
  filterFruits();
}

// === Physikfunktionen ===
function schwarzschildRadius(mass) {
  return (2 * G * mass) / (c * c);
}

function hawkingTemp(mass) {
  return (hbar * c ** 3) / (8 * Math.PI * G * mass * kB);
}

function fruchtEntropie(mass) {
  const lp2 = (hbar * G) / c ** 3;
  const area = 4 * Math.PI * schwarzschildRadius(mass) ** 2;
  return (kB * area) / (4 * lp2);
}

// === Visualization ===
function drawPageCurveChart(massKg, label) {
  if (myChart) {
    myChart.destroy();
    myChart = null;
  }
  qgChartCanvas.style.display = 'block';
  qgOutput.style.display = 'none';

  // For visualization, we need to handle extreme time scales.
  // Real BHs live for 10^60+ years. Javascript floats can handle 1e308.
  // But Chart.js labels might be tricky. We normalize time to t/tau (lifetime).
  // The simulation function handles this, returning abstract time steps.

  const data = simulatePageCurve(massKg, 100);

  const datasetBH = data.s_bh.map((s, i) => ({ x: data.time[i], y: s }));
  const datasetRad = data.s_rad_accum.map((s, i) => ({ x: data.time[i], y: s }));
  const datasetPage = data.time.map((t, i) => {
    return { x: t, y: Math.min(data.s_bh[i], data.s_rad_accum[i]) };
  });

  const tau = data.time[data.time.length - 1];

  myChart = new Chart(qgChartCanvas, {
    type: 'line',
    data: {
      labels: data.time.map(t => (t / tau).toFixed(2)),
      datasets: [
        {
          label: 'S_BH (Kapazität)',
          data: datasetBH,
          borderColor: 'rgba(255, 99, 132, 0.5)',
          borderDash: [5, 5],
          pointRadius: 0,
          borderWidth: 2
        },
        {
          label: 'S_Rad (Ticks)',
          data: datasetRad,
          borderColor: 'rgba(54, 162, 235, 0.5)',
          borderDash: [5, 5],
          pointRadius: 0,
          borderWidth: 2
        },
        {
          label: 'Page Curve (Unitär)',
          data: datasetPage,
          borderColor: 'rgba(75, 192, 192, 1)',
          pointRadius: 1,
          borderWidth: 3,
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      animation: {
        duration: 800
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        title: {
          display: true,
          text: `Evaporation: ${label} (M=${massKg.toExponential(1)} kg)`
        },
        subtitle: {
          display: true,
          text: 'Unitary tick evolution via σ_P = ħG/c^4. Remnant stable.'
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.dataset.label + ': ' + Number(context.parsed.y).toExponential(2) + ' J/K';
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Normierte Zeit (t / τ)' },
          ticks: { maxTicksLimit: 10 }
        },
        y: {
          title: { display: true, text: 'Entropie [J/K]' },
          type: 'linear' // Log scale breaks 0
        }
      }
    }
  });
}


// === Tool-Begrenzung ===
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

// === QG Tools ===
const toolHandlers = {
  pageFruits: () => {
    qgChartCanvas.style.display = 'none';
    qgOutput.style.display = 'block';
    return "Bitte nutze die glatte Kurve für korrekte unitäre Physik.";
  },
  fruitEntropy: () => {
    qgChartCanvas.style.display = 'none';
    qgOutput.style.display = 'block';
    const data = getActiveDataset();
    return data.map(
      (obj) => `S(${obj.name}) = ${fruchtEntropie(obj.massKg).toExponential(3)} J/K`
    ).join("\n");
  },
  fruitRs: () => {
    qgChartCanvas.style.display = 'none';
    qgOutput.style.display = 'block';
    const data = getActiveDataset();
    return data.map(
      (obj) => `R_s(${obj.name}) = ${schwarzschildRadius(obj.massKg).toExponential(3)} m`
    ).join("\n");
  },
  fruitHawking: () => {
    qgChartCanvas.style.display = 'none';
    qgOutput.style.display = 'block';
    const data = getActiveDataset();
    return data.map(
      (obj) => `T_H(${obj.name}) = ${hawkingTemp(obj.massKg).toExponential(3)} K`
    ).join("\n");
  },
  asciiPlot: () => {
    qgChartCanvas.style.display = 'none';
    qgOutput.style.display = 'block';
    return "ASCII deprecated. View graph.";
  },
  smoothPage: () => {
    const data = getActiveDataset();
    // Default to first item
    const item = data[0];
    drawPageCurveChart(item.massKg, item.name);
    return `Rendering Curve for ${item.name}...`;
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
    if (selectedValue !== 'smoothPage') {
      qgOutput.textContent = output;
    } else {
      qgOutput.textContent = "Grafik wird generiert...";
    }
  });
}

// === Init ===
modeSelect.addEventListener("change", handleModeChange);
renderBaseList();
filterFruits();

searchField.addEventListener("input", filterFruits);
formSelect.addEventListener("change", filterFruits);
colorSelect.addEventListener("change", filterFruits);
qgSelect.addEventListener("change", handleToolChange);
