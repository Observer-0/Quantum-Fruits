// === Naturkonstanten ===
const hbar = 1.054e-34;
const G = 6.674e-11;
const c = 2.998e8;
const kB = 1.381e-23;

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
const selectedToolLabel = document.querySelector("#selectedToolLabel");
const limitNote = document.querySelector("#limitNote");

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

function hawkingEvap(mass) {
  return (5120 * Math.PI * G ** 2 * mass ** 3) / (hbar * c ** 4);
}

function pageTime(mass) {
  return hawkingEvap(mass) * 0.5;
}

function fruchtEntropie(mass) {
  const lp2 = (hbar * G) / c ** 3;
  const area = 4 * Math.PI * schwarzschildRadius(mass) ** 2;
  return (kB * area) / (4 * lp2);
}

function asciiPageCurve(label, mass) {
  const tPage = pageTime(mass);
  const width = 50;
  const height = 12;

  const canvas = Array.from({ length: height }, () => Array(width).fill(" "));

  for (let x = 0; x < width; x += 1) {
    const t = x / (width - 1);
    const S = t <= 0.5 ? 2 * t : 2 * (1 - t);
    const y = height - 1 - Math.floor(S * (height - 1));
    canvas[y][x] = "*";
  }

  const plot = canvas.map((row) => row.join("")).join("\n");
  return `${label} (${mass} kg)\nEntropy\n${plot}\nt_Page ~ ${tPage.toExponential(2)} s\n`;
}

function smoothPageCurve(mass) {
  const SMax = fruchtEntropie(mass);
  const SRemnant = Math.PI * kB;
  const steps = 60;
  const curve = [];

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const entropy = 2 * t * (1 - t) * SMax + SRemnant;
    curve.push(entropy);
  }
  return curve;
}

function asciiSmoothPage(label, mass) {
  const curve = smoothPageCurve(mass);
  const width = curve.length;
  const height = 15;
  const SMax = Math.max(...curve);

  const canvas = Array.from({ length: height }, () => Array(width).fill(" "));

  curve.forEach((entropy, x) => {
    const y = height - 1 - Math.floor((entropy / SMax) * (height - 1));
    if (canvas[y] && canvas[y][x] !== undefined) {
      canvas[y][x] = "*";
    }
  });

  const plot = canvas.map((row) => row.join("")).join("\n");
  return `${label} — Glatte Page-Kurve (unitar)\nEntropy\n${plot}\nPeak: ${SMax.toExponential(2)}\nRemnant: ${(Math.PI * kB).toExponential(2)}\n`;
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
  pageFruits: () =>
    FRUITS.map((fruit) => asciiPageCurve(fruit.name, fruit.massKg)).join("\n"),
  fruitEntropy: () =>
    FRUITS.map(
      (fruit) => `S_F(${fruit.name}) = ${fruchtEntropie(fruit.massKg).toExponential(3)} J/K`
    ).join("\n"),
  fruitRs: () =>
    FRUITS.map(
      (fruit) => `R_s(${fruit.name}) = ${schwarzschildRadius(fruit.massKg).toExponential(3)} m`
    ).join("\n"),
  fruitHawking: () =>
    FRUITS.map(
      (fruit) => `T_H(${fruit.name}) = ${hawkingTemp(fruit.massKg).toExponential(3)} K`
    ).join("\n"),
  asciiPlot: () =>
    [
      asciiPageCurve("Melone", FRUITS.find((f) => f.name === "Melone").massKg),
      asciiPageCurve("Apfel", FRUITS.find((f) => f.name === "Apfel").massKg)
    ].join("\n"),
  smoothPage: () =>
    [
      asciiSmoothPage("Melone", FRUITS.find((f) => f.name === "Melone").massKg),
      asciiSmoothPage("Apfel", FRUITS.find((f) => f.name === "Apfel").massKg)
    ].join("\n")
};

function handleToolChange(event) {
  const selectedValue = event.target.value;
  const selectedLabel = event.target.options[event.target.selectedIndex].textContent;
  selectedToolLabel.textContent = selectedValue === "none" ? "Keine Auswahl" : selectedLabel;

  if (!toolHandlers[selectedValue]) {
    qgOutput.textContent = "";
    return;
  }

  withToolLimit(() => {
    const output = toolHandlers[selectedValue]();
    qgOutput.textContent = output;
  });
}

// === Init ===
renderBaseList();
filterFruits();

searchField.addEventListener("input", filterFruits);
formSelect.addEventListener("change", filterFruits);
colorSelect.addEventListener("change", filterFruits);
qgSelect.addEventListener("change", handleToolChange);
