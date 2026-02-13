/**
 * Labs Page Renderer
 * Single-source config: prefers js/labs.json, falls back to unity defaults.
 */

const LAB_ORDER = [
    "motor",
    "galaxy",
    "hubble",
    "lattice",
    "evaporation",
    "entropy",
    "answer42",
    "dipole"
];

const VISUAL_DEFAULTS = {
    motor: { badge: "Kinematic Model", accent: "#38bdf8", textColor: "#000" },
    galaxy: { badge: "Rotation Fit", accent: "#10b981", textColor: "#000" },
    hubble: { badge: "Cosmology Diagnostic", accent: "#fbbf24", textColor: "#000" },
    lattice: { badge: "Lattice Model", accent: "#a855f7", textColor: "#fff" },
    evaporation: { badge: "Evaporation Model", accent: "#fbbf24", textColor: "#000" },
    entropy: { badge: "Entropy Diagnostic", accent: "#f43f5e", textColor: "#fff" },
    answer42: { badge: "Douglas Adams Meme", accent: "#38bdf8", textColor: "#000" },
    dipole: { badge: "Dipole Hypothesis", accent: "#818cf8", textColor: "#fff" }
};

const MINIMAL_FALLBACK = {
    motor: {
        id: "LAB-001",
        title: "Kinematic Motor",
        lab: "motor.html",
        description: "Action ticks (N=E*t/hbar) and gravitational braking."
    },
    galaxy: {
        id: "LAB-002",
        title: "Galaxy Rotation",
        lab: "galaxy_lab.html",
        description: "Galaxy-rotation fits in a sigma_P coupling model."
    },
    hubble: {
        id: "LAB-011",
        title: "Cosmic Breathing",
        lab: "hubble_flow_lab.html",
        description: "Phase-sampled Hubble magnitudes and tension diagnostics."
    }
};

function cfgPath() {
    return "../js/labs.json";
}

function getUnityFallback() {
    if (typeof window !== "undefined" && window.QF_DEFAULT_SIM_MAP && typeof window.QF_DEFAULT_SIM_MAP === "object") {
        return window.QF_DEFAULT_SIM_MAP;
    }
    return null;
}

function classifyEntry(entry) {
    const id = String((entry && entry.id) || "");
    if (id.startsWith("LAB-")) return "lab";
    if (id.startsWith("INF-")) return "reference";
    return "unknown";
}

function safeHref(raw) {
    const href = String(raw || "").trim();
    if (!href) return null;
    const lower = href.toLowerCase();
    if (lower.startsWith("javascript:") || lower.startsWith("data:")) return null;
    return href;
}

function withVisuals(key, entry) {
    const visual = VISUAL_DEFAULTS[key] || {};
    const kind = classifyEntry(entry);
    return {
        ...entry,
        kind,
        badge: entry.badge || visual.badge || (kind === "reference" ? "Reference" : "Simulation"),
        description: entry.description || "Interactive module from fallback configuration.",
        accent: entry.accent || visual.accent || "#38bdf8",
        textColor: entry.textColor || visual.textColor || "#000",
        icon: entry.icon || "*"
    };
}

function isRenderableEntry(entry) {
    if (!entry || typeof entry !== "object") return false;
    if (!entry.id || !entry.lab) return false;
    if (!safeHref(entry.lab)) return false;

    const kind = classifyEntry(entry);
    if (kind === "lab") return !String(entry.lab).includes("#");
    if (kind === "reference") return true;
    return false;
}

function normalizeLabs(raw) {
    const out = {};
    Object.keys(raw || {}).forEach((key) => {
        if (isRenderableEntry(raw[key])) {
            out[key] = withVisuals(key, raw[key]);
        }
    });
    return out;
}

async function loadLabs() {
    try {
        const r = await fetch(cfgPath(), { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const parsed = await r.json();
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const normalized = normalizeLabs(parsed);
            if (Object.keys(normalized).length > 0) return normalized;
        }
    } catch (_) {
        // fallback below
    }

    const unityFallback = getUnityFallback();
    if (unityFallback) {
        const normalized = normalizeLabs(unityFallback);
        if (Object.keys(normalized).length > 0) return normalized;
    }

    return normalizeLabs(MINIMAL_FALLBACK);
}

function createLabCard(entry) {
    const accent = entry.accent;
    const textColor = entry.textColor;
    const badge = entry.badge;
    const id = entry.id;
    const title = entry.title || "Lab";
    const desc = entry.description || "";
    const href = safeHref(entry.lab) || "#";
    const icon = entry.icon;
    const badgeBg = hexToRgba(accent, 0.18);
    const actionText = entry.kind === "reference" ? "Open Reference" : "Access Simulation";

    const deck = document.createElement("div");
    deck.className = "lab-deck";
    deck.dataset.id = id;

    const card = document.createElement("div");
    card.className = "qg-card";

    const preview = document.createElement("div");
    preview.className = "lab-preview";
    const iconBox = document.createElement("div");
    iconBox.style.fontSize = "3.2rem";
    iconBox.style.opacity = "0.85";
    iconBox.textContent = icon;
    preview.appendChild(iconBox);

    const content = document.createElement("div");
    content.className = "lab-card-content";

    const badgeEl = document.createElement("span");
    badgeEl.className = "lab-badge";
    badgeEl.style.color = accent;
    badgeEl.style.background = badgeBg;
    badgeEl.textContent = badge;

    const titleEl = document.createElement("h3");
    titleEl.textContent = title;

    const descEl = document.createElement("p");
    descEl.textContent = desc;

    const action = document.createElement("a");
    action.href = href;
    action.className = "action-btn";
    action.style.background = accent;
    action.style.color = textColor;
    action.style.width = "100%";
    action.style.justifyContent = "center";
    action.textContent = actionText;

    content.appendChild(badgeEl);
    content.appendChild(titleEl);
    content.appendChild(descEl);
    content.appendChild(action);

    card.appendChild(preview);
    card.appendChild(content);
    deck.appendChild(card);
    return deck;
}

function hexToRgba(hex, alpha) {
    if (typeof hex !== "string") return `rgba(56,189,248,${alpha})`;
    const s = hex.trim().replace("#", "");
    if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(s)) {
        return `rgba(56,189,248,${alpha})`;
    }
    const full = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

async function renderLabsPage() {
    const grid = document.getElementById("labsGrid");
    if (!grid) return;

    const cfg = await loadLabs();
    const orderedKeys = LAB_ORDER.filter((k) => cfg[k]).concat(
        Object.keys(cfg).filter((k) => !LAB_ORDER.includes(k))
    );

    if (orderedKeys.length === 0) {
        const empty = document.createElement("div");
        empty.className = "qg-card";
        empty.style.padding = "2rem";
        empty.style.textAlign = "center";
        empty.style.gridColumn = "1 / -1";
        empty.textContent = "No lab configuration available.";
        grid.replaceChildren(empty);
        return;
    }

    const frag = document.createDocumentFragment();
    orderedKeys.forEach((k) => {
        frag.appendChild(createLabCard(cfg[k]));
    });
    grid.replaceChildren(frag);
}

document.addEventListener("DOMContentLoaded", () => {
    renderLabsPage();
});
