const canvas = document.getElementById('motorCanvas');
const ctx = canvas.getContext('2d');
const spinSlider = document.getElementById('spinRate');
const massSlider = document.getElementById('massBurden');
const mergerBtn = document.getElementById('mergerBtn');

const netPotentialVal = document.getElementById('netPotential');
const tickDensityVal = document.getElementById('tickDensity');
const statusText = document.getElementById('statusText');
const pageCurvePlot = document.getElementById('pageCurvePlot');

canvas.width = 700;
canvas.height = 700;

// Fundamental Constants for Physics Engine
const PHYSICS = {
    hbar: 1.054571817e-34,
    c: 2.99792458e8,
    G: 6.67430e-11,
    kB: 1.380649e-23,
    sigmaP: (1.054571817e-34 * 6.67430e-11) / Math.pow(2.99792458e8, 4),
    MP: Math.sqrt((1.054571817e-34 * 2.99792458e8) / 6.67430e-11),
    iMax: Math.pow(2.99792458e8, 4) / 6.67430e-11
};

let time = 0;
let mergerPulse = 0;
let entropyPoints = [];
let naiveEntropyPoints = []; // Hawking data
const maxEntropyPoints = 120;
let creationsSparks = [];

// Initialize Page Curve data
for (let i = 0; i < maxEntropyPoints; i++) {
    entropyPoints.push(0);
    naiveEntropyPoints.push(0);
}
function drawGrid(x, y, burden) {
    const spacing = 30;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    for (let i = -14; i < 14; i++) {
        // Vertical lines
        ctx.beginPath();
        for (let j = -14; j < 14; j++) {
            const gx = x + i * spacing;
            const gy = y + j * spacing;

            const dx = gx - x;
            const dy = gy - y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Bug fix: stop center singularity
            if (dist < 0.001) continue;

            // Lensing / Warping factor (Regularized by visual sigma_P)
            const sigmaP_vis = 50;
            const warp = (burden * 2) / (1 + dist / sigmaP_vis);

            const wx = gx - (dx / dist) * warp;
            const wy = gy - (dy / dist) * warp;

            if (j === -14) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
        }
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        for (let j = -14; j < 14; j++) {
            const gx = x + j * spacing;
            const gy = y + i * spacing;

            const dx = gx - x;
            const dy = gy - y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.001) continue;

            const sigmaP_vis = 50;
            const warp = (burden * 2) / (1 + dist / sigmaP_vis);

            const wx = gx - (dx / dist) * warp;
            const wy = gy - (dy / dist) * warp;

            if (j === -14) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
        }
        ctx.stroke();
    }
}

function drawCore(x, y, radius, spin, burden) {
    const pulse = 1 + Math.sin(time * 0.1) * 0.02 + mergerPulse;
    const coreColor = burden > 50 ? '#ff4d00' : '#38bdf8';

    // Event Horizon (The "Shadow")
    ctx.shadowBlur = 30 + mergerPulse * 100;
    ctx.shadowColor = coreColor;

    ctx.fillStyle = '#010105';
    ctx.beginPath();
    ctx.arc(x, y, radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // The Action Glow (ℏ Window)
    const grade = ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * pulse * 1.2);
    grade.addColorStop(0, 'rgba(0,0,0,0)');
    grade.addColorStop(0.5, coreColor);
    grade.addColorStop(1, 'transparent');

    ctx.fillStyle = grade;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Magnetic Ticks (σ_P resolution lines)
    if (spin > 20) {
        ctx.strokeStyle = coreColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI / 6) + (time * 0.02 * (spin / 100));
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * (radius * 0.9), y + Math.sin(angle) * (radius * 0.9));
            ctx.lineTo(x + Math.cos(angle) * (radius * 1.1), y + Math.sin(angle) * (radius * 1.1));
            ctx.stroke();
        }
    }
    ctx.globalAlpha = 1.0;
}

function drawAccretionDisk(x, y, radius, spin, burden) {
    const particleCount = Math.floor(burden * 10);
    const speed = (spin / 50) + 0.1;

    for (let i = 0; i < particleCount; i++) {
        const distance = radius * 1.2 + (i * 0.8);
        const angle = (time * 0.02 * speed) + (i * Math.PI * 2 / particleCount);

        // Relativistic Beaming (brighter on one side)
        const beam = Math.cos(angle) > 0 ? 1 : 0.3;
        ctx.fillStyle = burden > 60 ? `rgba(255, 100, 0, ${beam})` : `rgba(255, 200, 50, ${beam})`;

        const px = x + Math.cos(angle) * distance;
        const py = y + Math.sin(angle) * distance * 0.25;

        ctx.fillRect(px, py, 2, 2);
    }
}

function drawSparks(x, y, radius, intensity) {
    if (intensity < 0.1) return;

    // Add new sparks based on luminosity intensity
    if (Math.random() < intensity) {
        creationsSparks.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            life: 1.0,
            color: intensity > 0.6 ? '#f59e0b' : '#fff'
        });
    }

    // Draw and update sparks
    creationsSparks.forEach((s, i) => {
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.life;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fill();

        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.02;
    });
    creationsSparks = creationsSparks.filter(s => s.life > 0);
    ctx.globalAlpha = 1.0;
}

function updateStats() {
    const spin = parseFloat(spinSlider.value);
    const burden = parseFloat(massSlider.value);

    // 1. Action Potential (Planck Force based)
    const net = PHYSICS.iMax * (spin / 100) * (1 - (burden / 150));
    netPotentialVal.innerText = net.toExponential(2);

    // 2. Singularity Diagnostic: r_Pl / r_s ratio
    // Near 1.0 means quantum curvature dominates (The "Quantum Core")
    const r_s = (burden + 1) * 2; // Schematic radius
    const r_pl = 50; // Reference Planckian curvature scale for visual demo
    const diagRatio = r_pl / r_s;

    // 3. Non-Thermality Coefficient (c0)
    const epsilon = (101 - spin) / 1000;
    const s_slope = burden / 100;
    const c0 = (Math.PI ** 2 / 6) * (epsilon ** 2) + 0.5 * (s_slope ** 2) * (epsilon ** 2);
    const nonThermality = Math.min(100, c0 * 2e7);
    const c0Bar = document.getElementById('c0Bar');
    if (c0Bar) c0Bar.style.width = nonThermality + "%";

    // 4. Spin Luminosity L_spin ∝ ħ * |dω/dt|
    const m_total = burden / 100;
    const omega = spin / 100;
    const lSpinValue = (m_total * m_total) * omega * 2.0;
    document.getElementById('val-lspin').innerText = lSpinValue.toFixed(4);

    tickDensityVal.innerText = burden > 70 ? "σ_P Saturated" : (diagRatio > 1.5 ? "Pure Action Core" : "Mass Loaded");
    tickDensityVal.style.color = diagRatio > 1.5 ? "#38bdf8" : "#f43f5e";



    if (burden < 20) {
        statusText.innerText = 'Phase: Pure Action (ℏ-Stator)';
        statusText.style.color = '#38bdf8';
    } else if (burden > 80) {
        statusText.innerText = 'Phase: Gravitational Braking (Mass Rotor)';
        statusText.style.color = '#f43f5e';
    } else {
        statusText.innerText = 'Phase: Unitary Transformer Equilibrium';
        statusText.style.color = '#a855f7';
    }

    // Update Return Profile logic (Unitary vs Naive)
    // S_naive grows with burden (Impedance blockage)
    const sNaive = (burden / 100) * (1 + time * 0.001);

    // S_unitary (Zander Return): Follows (1-exp(-7x))*exp(-4x) shape
    const progress = (burden / 100);
    const sUnitary = (1 - Math.exp(-7 * progress)) * Math.exp(-4 * progress) * 2.8;

    entropyPoints.push(Math.max(0, sUnitary));
    naiveEntropyPoints.push(Math.max(0, sNaive));

    if (entropyPoints.length > maxEntropyPoints) {
        entropyPoints.shift();
        naiveEntropyPoints.shift();
    }

    renderPageCurve();

    return lSpinValue;
}

function renderPageCurve() {
    pageCurvePlot.innerHTML = '';
    entropyPoints.forEach((val, i) => {
        const barContainer = document.createElement('div');
        barContainer.style.flex = "1";
        barContainer.style.height = "100%";
        barContainer.style.display = "flex";
        barContainer.style.flexDirection = "column";
        barContainer.style.justifyContent = "flex-end";
        barContainer.style.position = "relative";

        // Unitary Bar (Zander)
        const barU = document.createElement('div');
        barU.style.width = "100%";
        barU.style.height = (val * 80) + "%";
        barU.style.background = `linear-gradient(to top, #38bdf8, #818cf8)`;
        barU.style.opacity = i / maxEntropyPoints;
        barU.style.zIndex = "2";

        // Naive Bar (Hawking - Phantom)
        const barN = document.createElement('div');
        barN.style.width = "100%";
        barN.style.height = (naiveEntropyPoints[i] * 80) + "%";
        barN.style.background = `rgba(239, 68, 68, 0.3)`;
        barN.style.position = "absolute";
        barN.style.bottom = "0";
        barN.style.zIndex = "1";

        barContainer.appendChild(barN);
        barContainer.appendChild(barU);
        pageCurvePlot.appendChild(barContainer);
    });
}

mergerBtn.onclick = () => {
    mergerPulse = 1.0;
    statusText.innerText = "Sequential Relaxation Initiated...";
    setTimeout(() => {
        statusText.innerText = '"Once spacetime is quantised, a black hole can never merge just once."';
        statusText.style.color = 'var(--accent-emerald)';
    }, 2000);
};

function animate() {
    ctx.fillStyle = '#010105';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const spin = parseFloat(spinSlider.value);
    const burden = parseFloat(massSlider.value);
    const effectiveSpin = spin * (1 - burden / 200);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    drawGrid(centerX, centerY, burden);
    drawAccretionDisk(centerX, centerY, 80, effectiveSpin, burden);
    drawCore(centerX, centerY, 50, effectiveSpin, burden);

    if (mergerPulse > 0) mergerPulse *= 0.95;

    const lIntensity = updateStats(spin, burden);
    drawSparks(centerX, centerY, 50, lIntensity);

    time++;
    requestAnimationFrame(animate);
}

animate();
