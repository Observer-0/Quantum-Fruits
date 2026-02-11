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
    "spectrum",
    "dipole"
];

const VISUAL_DEFAULTS = {
    motor: { badge: "Extreme Geometry", accent: "#38bdf8", textColor: "#000" },
    galaxy: { badge: "Large Scale", accent: "#10b981", textColor: "#000" },
    hubble: { badge: "Cosmology", accent: "#fbbf24", textColor: "#000" },
    lattice: { badge: "Foundation", accent: "#a855f7", textColor: "#fff" },
    evaporation: { badge: "Decay Logic", accent: "#fbbf24", textColor: "#000" },
    entropy: { badge: "Holography", accent: "#f43f5e", textColor: "#fff" },
    spectrum: { badge: "Quantum Scaling", accent: "#fbbf24", textColor: "#000" },
    dipole: { badge: "Pillar 12", accent: "#818cf8", textColor: "#fff" }
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
        description: "Dark-matter-free rotation curves via Sigma-P coupling."
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

function withVisuals(key, entry) {
    const visual = VISUAL_DEFAULTS[key] || {};
    return {
        ...entry,
        badge: entry.badge || visual.badge || "Simulation",
        accent: entry.accent || visual.accent || "#38bdf8",
        textColor: entry.textColor || visual.textColor || "#000",
        icon: entry.icon || "•"
    };
}

function isLabEntry(entry) {
    if (!entry || typeof entry !== "object") return false;
    if (!entry.id || !String(entry.id).startsWith("LAB-")) return false;
    if (!entry.lab || String(entry.lab).includes("#")) return false;
    return true;
}

function normalizeLabs(raw) {
    const out = {};
    Object.keys(raw || {}).forEach((key) => {
        if (isLabEntry(raw[key])) {
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

function cardMarkup(entry) {
    const accent = entry.accent;
    const textColor = entry.textColor;
    const badge = entry.badge;
    const id = entry.id;
    const title = entry.title || "Lab";
    const desc = entry.description || "";
    const href = entry.lab;
    const icon = entry.icon;
    const badgeBg = hexToRgba(accent, 0.18);

    return `
    <div class="lab-deck" data-id="${id}">
      <div class="qg-card">
        <div class="lab-preview">
          <div style="font-size: 3.2rem; opacity: 0.85;">${icon}</div>
        </div>
        <div class="lab-card-content">
          <span class="lab-badge" style="color: ${accent}; background: ${badgeBg};">${badge}</span>
          <h3>${title}</h3>
          <p>${desc}</p>
          <a href="${href}" class="action-btn" style="background: ${accent}; color: ${textColor}; width: 100%; justify-content: center;">
            Access Simulation
          </a>
        </div>
      </div>
    </div>`;
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
        grid.innerHTML = `<div class="qg-card" style="padding:2rem; text-align:center; grid-column:1 / -1;">No lab configuration available.</div>`;
        return;
    }

    grid.innerHTML = orderedKeys.map((k) => cardMarkup(cfg[k])).join("");
}

document.addEventListener("DOMContentLoaded", () => {
    renderLabsPage();
});
