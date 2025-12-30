// === Imports ===
import {
  simulatePageCurve,
  CONSTS,
  schwarzschildRadius,
  hawkingTemperature,
  bekensteinHawkingEntropy
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

    if (item.shape) li.dataset.shape = item.shape;
    if (item.color) li.dataset.color = item.color;

    li.style.cursor = "pointer";
    li.title = `Mass: ${item.massKg.toExponential(1)} kg`;
    li.addEventListener("click", () => {
      drawPageCurveChart(item.massKg, item.name);
      qgSelect.value = "smoothPage";
      selectedToolLabel.textContent = `Glatte Page-Kurve (${item.name})`;
    });

    baseList.appendChild(li);
  });
}

function filterFruits() {
  const query = searchField.value.trim().toLowerCase();
  const shape = formSelect.value;
  const color = colorSelect.value;
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
  currentMode = bindingModeSelect();
  if (currentMode === 'real') {
    fruitControls.style.display = 'none';
  } else {
    fruitControls.style.display = 'contents';
  }
  renderBaseList();
  filterFruits();
}

function bindingModeSelect() {
  if (modeSelect) return modeSelect.value;
  return "fruits";
}

// === Visualization ===
function drawPageCurveChart(massKg, label) {
  if (myChart) {
    myChart.destroy();
    myChart = null;
  }
  qgChartCanvas.style.display = 'block';
  qgOutput.style.display = 'none';

  // Use the new SigmaP engine
  const data = simulatePageCurve(massKg, 150);

  const datasetBH = data.s_bh.map((s, i) => ({ x: data.time[i], y: s }));
  const datasetRad = data.s_rad_accum.map((s, i) => ({ x: data.time[i], y: s }));

  // Page Curve Logic: Min(S_BH, S_Rad)
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
      animation: { duration: 800 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        title: {
          display: true,
          text: `Evaporation: ${label} (M=${massKg.toExponential(1)} kg)`
        },
        subtitle: {
          display: true,
          text: `σ_P Evolution → Remnant Stable at t ~ ${(lastT / tau).toFixed(1)} τ`
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
          type: 'linear'
        }
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
    return data.map(
      (obj) => `S(${obj.name}) = ${bekensteinHawkingEntropy(obj.massKg).toExponential(3)} J/K`
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
      (obj) => `T_H(${obj.name}) = ${hawkingTemperature(obj.massKg).toExponential(3)} K`
    ).join("\n");
  },
  asciiPlot: () => {
    // Deprecated
    return "ASCII Deprecated.";
  },
  smoothPage: () => {
    const data = getActiveDataset();
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
if (modeSelect) modeSelect.addEventListener("change", handleModeChange);
renderBaseList();
filterFruits();

searchField.addEventListener("input", filterFruits);
formSelect.addEventListener("change", filterFruits);
colorSelect.addEventListener("change", filterFruits);
qgSelect.addEventListener("change", handleToolChange);
