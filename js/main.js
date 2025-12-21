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

function renderBaseList() {
  baseList.innerHTML = "";
  FRUITS.forEach((fruit) => {
    const li = document.createElement("li");
    li.textContent = capitalize(fruit.name);
    li.dataset.shape = fruit.shape;
    li.dataset.color = fruit.color;
    baseList.appendChild(li);
  });
}

function filterFruits() {
  const query = searchField.value.trim().toLowerCase();
  const shape = formSelect.value;
  const color = colorSelect.value;

  resultList.innerHTML = "";

  const matches = FRUITS.filter((fruit) => {
    const matchesQuery = fruit.name.toLowerCase().includes(query);
    const matchesShape = shape === "alle" || fruit.shape === shape;
    const matchesColor = color === "alle" || fruit.color === color;
    return matchesQuery && matchesShape && matchesColor;
  });

  if (!matches.length) {
    const li = document.createElement("li");
    li.textContent = "Keine passenden Früchte gefunden.";
    resultList.appendChild(li);
    return;
  }

  matches.forEach((fruit) => {
    const li = document.createElement("li");
    li.textContent = capitalize(fruit.name);
    resultList.appendChild(li);
  });
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

  // Perform Simulation
  // Use Melone mass strictly for demo curve regardless of passed mass for visibility
  // If mass is too small, lifetime is nanoseconds. If too big, infinite.
  // We simulate a small black hole (e.g. 1e6 kg) to show the curve nicely,
  // or use the actual fruit mass if scaling works (lifetime of fruit BH is tiny tiny).
  // Simulate 1e10 kg for visible plot scale, or use realistic time scaling.
  // Let's use 1e6 kg for the demo curve to represent "Fruit Logic".
  const simMass = 1e9;
  const data = simulatePageCurve(simMass, 100);

  // Prepare datasets:
  // 1. BH Entropy (falling)
  // 2. Radiation Entropy (rising)
  // 3. Page Curve (min of both)

  const datasetBH = data.s_bh.map((s, i) => ({ x: data.time[i], y: s }));
  const datasetRad = data.s_rad_accum.map((s, i) => ({ x: data.time[i], y: s }));
  const datasetPage = data.time.map((t, i) => {
    return { x: t, y: Math.min(data.s_bh[i], data.s_rad_accum[i]) };
  });

  // Scale time relative to lifetime for easier reading
  const tau = data.time[data.time.length - 1];

  myChart = new Chart(qgChartCanvas, {
    type: 'line',
    data: {
      labels: data.time.map(t => (t / tau).toFixed(2)),
      datasets: [
        {
          label: 'S_BH (Remaining Capacity)',
          data: datasetBH,
          borderColor: 'rgba(255, 99, 132, 0.5)',
          borderDash: [5, 5],
          pointRadius: 0,
          borderWidth: 2
        },
        {
          label: 'S_Rad (Accumulated Ticks)',
          data: datasetRad,
          borderColor: 'rgba(54, 162, 235, 0.5)',
          borderDash: [5, 5],
          pointRadius: 0,
          borderWidth: 2
        },
        {
          label: 'Page Curve (Unitary)',
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
        duration: 1000
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        title: {
          display: true,
          text: `Unitary Evaporation: ${label} (Simulated as M ~ 10^9 kg for visual)`
        },
        subtitle: {
          display: true,
          text: 'Entropy is count of spacetime updates (Ticks). Remnant stabilizes.'
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.dataset.label + ': ' + Number(context.parsed.y).toExponential(2);
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Time / Lifetime' },
          ticks: { maxTicksLimit: 10 }
        },
        y: {
          title: { display: true, text: 'Entropy [J/K] (S = kB * N_ticks)' },
          type: 'linear'
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
    return FRUITS.map((fruit) => `${fruit.name}: Klassische Page-Kurve nicht verfügbar (Nutze Glatte Kurve).`).join("\n");
  },
  fruitEntropy: () => {
    qgChartCanvas.style.display = 'none';
    qgOutput.style.display = 'block';
    return FRUITS.map(
      (fruit) => `S_F(${fruit.name}) = ${fruchtEntropie(fruit.massKg).toExponential(3)} J/K`
    ).join("\n");
  },
  fruitRs: () => {
    qgChartCanvas.style.display = 'none';
    qgOutput.style.display = 'block';
    return FRUITS.map(
      (fruit) => `R_s(${fruit.name}) = ${schwarzschildRadius(fruit.massKg).toExponential(3)} m`
    ).join("\n");
  },
  fruitHawking: () => {
    qgChartCanvas.style.display = 'none';
    qgOutput.style.display = 'block';
    return FRUITS.map(
      (fruit) => `T_H(${fruit.name}) = ${hawkingTemp(fruit.massKg).toExponential(3)} K`
    ).join("\n");
  },
  asciiPlot: () => {
    qgChartCanvas.style.display = 'none';
    qgOutput.style.display = 'block';
    return "ASCII Plot deprecated. Use 'Glatte Page-Kurve' for visuals.";
  },
  smoothPage: () => {
    // Select the "Melone" by default for the demo
    const fruit = FRUITS.find(f => f.name === "Melone");
    drawPageCurveChart(fruit.massKg, fruit.name);
    return "Rendering Chart...";
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
renderBaseList();
filterFruits();

searchField.addEventListener("input", filterFruits);
formSelect.addEventListener("change", filterFruits);
colorSelect.addEventListener("change", filterFruits);
qgSelect.addEventListener("change", handleToolChange);
