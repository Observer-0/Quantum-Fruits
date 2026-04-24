/**
 * Particle Spectrum Lab Logic
 * Physics: m(n) = M_Planck * q^n
 * q = 0.222 (geometric ratio)
 */

const PARTICLE_DATA = [
    { name: "Planck Mass", n: 0, mass: 2.176e-8 },
    { name: "Top Quark", n: 25.62, mass: 3.078e-25 },
    { name: "Bottom Quark", n: 28.3, mass: 7.5e-27 },
    { name: "Proton", n: 29.07, mass: 1.672e-27 },
    { name: "Electron", n: 34.03, mass: 9.109e-31 },
    { name: "Neutrino Scale", n: 58, mass: 1e-45 } // Schematic
];

const CONSTANTS = {
    MP: 2.176e-8,
    q: 0.2222
};

const slider = document.getElementById('mass-slider');
const nLabel = document.getElementById('current-n');
const activeLine = document.getElementById('active-line');
const vis = document.getElementById('staircase-vis');
const snapBox = document.getElementById('snap-info');
const particleName = document.getElementById('particle-name');

function initStaircase() {
    PARTICLE_DATA.forEach(p => {
        const marker = document.createElement('div');
        marker.className = 'particle-marker';
        const topPercent = (p.n / 60) * 100;
        marker.style.top = topPercent + "%";
        marker.innerHTML = `<span>${p.name} (n=${p.n.toFixed(1)})</span>`;
        vis.appendChild(marker);
    });
}

function updateSpectrum() {
    const n = parseFloat(slider.value);
    nLabel.innerText = n.toFixed(2);

    const topPercent = (n / 60) * 100;
    activeLine.style.top = topPercent + "%";

    // Check for "Snap" (proximity to known particle)
    let found = null;
    PARTICLE_DATA.forEach(p => {
        if (Math.abs(n - p.n) < 0.8) {
            found = p;
        }
    });

    if (found) {
        snapBox.style.display = 'block';
        particleName.innerText = found.name;
        // Subtle haptic feel/glow
        activeLine.style.background = "#10b981";
        activeLine.style.boxShadow = "0 0 30px #10b981";
    } else {
        snapBox.style.display = 'none';
        activeLine.style.background = "#fff";
        activeLine.style.boxShadow = "0 0 20px #fbbf24";
    }
}

slider.oninput = updateSpectrum;

// Initial
initStaircase();
updateSpectrum();
