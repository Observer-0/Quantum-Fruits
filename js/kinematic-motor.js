const canvas = document.getElementById('motorCanvas');
const ctx = canvas.getContext('2d');
const spinSlider = document.getElementById('spinRate');
const massSlider = document.getElementById('massBurden');
const mergerBtn = document.getElementById('mergerBtn');

const netPotentialVal = document.getElementById('netPotential');
const tickDensityVal = document.getElementById('tickDensity');
const statusText = document.getElementById('statusText');
const pageCurvePlot = document.getElementById('pageCurvePlot');
const autoCycleBtn = document.getElementById('autoCycleBtn');

let canvasCssWidth = 700;
let canvasCssHeight = 700;

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvasCssWidth = Math.max(1, rect.width || 700);
    canvasCssHeight = Math.max(1, rect.height || canvasCssWidth);
    canvas.width = Math.max(1, Math.floor(canvasCssWidth * dpr));
    canvas.height = Math.max(1, Math.floor(canvasCssHeight * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/*
Assumption labels (see docs/Assumption_Register.md):
- Axiom: fundamental constants and sigmaP definition.
- Derived: planck-force scaling and algebraic monitor channels.
- Heuristic: cycle profile, return-profile shaping, and visual closures.
- Prediction: relative trend differences between naive and unitary channels.
*/

// Fundamental Constants for Physics Engine
const PHYSICS = {
    hbar: 1.054571817e-34,
    c: 2.99792458e8,
    G: 6.67430e-11,
    kB: 1.380649e-23,
    sigmaP: (1.054571817e-34 * 6.67430e-11) / Math.pow(2.99792458e8, 4),
    MP: Math.sqrt((1.054571817e-34 * 2.99792458e8) / 6.67430e-11),
    planckForce: Math.pow(2.99792458e8, 4) / 6.67430e-11
};
PHYSICS.lP = Math.sqrt(PHYSICS.sigmaP * PHYSICS.c);
PHYSICS.tP = Math.sqrt(PHYSICS.sigmaP / PHYSICS.c);
PHYSICS.Ksigma = 1.0 / PHYSICS.sigmaP;

let time = 0;
let mergerPulse = 0;
let entropyPoints = [];
let naiveEntropyPoints = []; // Hawking data
const maxEntropyPoints = 120;
const barsUnitary = [];
const barsNaive = [];
let creationsSparks = [];
let isAutoCycle = false;
let cycleProgress = 0; // 0 to 1

// Initialize Page Curve data
for (let i = 0; i < maxEntropyPoints; i++) {
    entropyPoints.push(0);
    naiveEntropyPoints.push(0);
}

function initPageCurve() {
    pageCurvePlot.innerHTML = '';
    barsUnitary.length = 0;
    barsNaive.length = 0;

    for (let i = 0; i < maxEntropyPoints; i++) {
        const barContainer = document.createElement('div');
        barContainer.style.flex = '1';
        barContainer.style.height = '100%';
        barContainer.style.display = 'flex';
        barContainer.style.flexDirection = 'column';
        barContainer.style.justifyContent = 'flex-end';
        barContainer.style.position = 'relative';

        const barN = document.createElement('div');
        barN.style.width = '100%';
        barN.style.height = '0%';
        barN.style.background = 'rgba(239, 68, 68, 0.3)';
        barN.style.position = 'absolute';
        barN.style.bottom = '0';
        barN.style.zIndex = '1';

        const barU = document.createElement('div');
        barU.style.width = '100%';
        barU.style.height = '0%';
        barU.style.background = 'linear-gradient(to top, #38bdf8, #818cf8)';
        barU.style.opacity = i / maxEntropyPoints;
        barU.style.zIndex = '2';

        barContainer.appendChild(barN);
        barContainer.appendChild(barU);
        pageCurvePlot.appendChild(barContainer);

        barsNaive.push(barN);
        barsUnitary.push(barU);
    }
}

initPageCurve();
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

    // The Action Glow (hbar window)
    const grade = ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * pulse * 1.2);
    grade.addColorStop(0, 'rgba(0,0,0,0)');
    grade.addColorStop(0.5, coreColor);
    grade.addColorStop(1, 'transparent');

    ctx.fillStyle = grade;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Magnetic ticks (sigma_P resolution lines)
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

function updateStats(spin, burden) {
    // 1. Coupling-utilization index (Derived):
    // i = F_eff / F_P, with F_eff = E_core / r_eff and E_core ~= hbar * omega
    // => i = (hbar * omega / r_eff) / (c^4/G) = (sigmaP * omega) / r_eff
    const spinFrac = spin / 100;
    const burdenFrac = burden / 100;
    const omega = spinFrac / Math.max(PHYSICS.tP, 1e-99); // slider as fraction of Planck frequency
    const rEff = PHYSICS.lP * (1 + 9 * burdenFrac); // heuristic horizon-scale loading radius
    const eCore = PHYSICS.hbar * omega;
    const fEff = eCore / Math.max(rEff, 1e-99);
    const iUtil = Math.max(0, Math.min(1, fEff / PHYSICS.planckForce));
    netPotentialVal.innerText = iUtil.toFixed(4);

    // 2. Singularity Diagnostic: r_Pl / r_s ratio
    // Near 1.0 means quantum curvature dominates (The "Quantum Core")
    const r_s = (burden + 1) * 2; // Schematic radius
    const r_pl = 50; // Reference Planckian curvature scale for visual demo
    const diagRatio = r_pl / r_s;

    // 3. Non-Thermality Coefficient (Heuristic closure in this lab layer)
    const epsilon = (101 - spin) / 1000;
    const s_slope = burden / 100;
    const c0 = (Math.PI ** 2 / 6) * (epsilon ** 2) + 0.5 * (s_slope ** 2) * (epsilon ** 2);
    const nonThermality = Math.min(100, c0 * 2e7);
    const c0Bar = document.getElementById('c0Bar');
    if (c0Bar) c0Bar.style.width = nonThermality + "%";

    // 4. Spin Luminosity L_spin (heuristic monitor proxy)
    const m_total = burden / 100;
    const omegaSpin = spin / 100;
    const lSpinValue = (m_total * m_total) * omegaSpin * 2.0;
    document.getElementById('val-lspin').innerText = lSpinValue.toFixed(4);

    tickDensityVal.innerText = burden > 70 ? "sigma_P Saturated" : (diagRatio > 1.5 ? "Pure Action Core" : "Mass Loaded");
    tickDensityVal.style.color = diagRatio > 1.5 ? "#38bdf8" : "#f43f5e";



    if (burden < 20) {
        statusText.innerText = 'Phase: Pure Action (hbar-Stator)';
        statusText.style.color = '#38bdf8';
    } else if (burden > 80) {
        statusText.innerText = 'Phase: Gravitational Braking (Mass Rotor)';
        statusText.style.color = '#f43f5e';
    } else {
        statusText.innerText = 'Phase: Unitary Transformer Equilibrium';
        statusText.style.color = '#a855f7';
    }

    // Update return-profile logic (Heuristic visualization closure)
    // S_naive saturates with time (Impedance blockage proxy)
    const sNaive = (burden / 100) * (1 - Math.exp(-time * 0.002));

    // S_unitary (Zander return proxy): shaped as (1-exp(-7x))*exp(-4x)
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

function handleAutoCycle() {
    if (!isAutoCycle) return;

    cycleProgress += 0.002; // Control speed of cycle
    if (cycleProgress >= 1.0) cycleProgress = 0;

    // Heuristic cycle segmentation:
    // Phase 1: Spin-up (Low burden, high internal action)
    // Phase 2: Peak (Burden ~ 50, maximum interaction)
    // Phase 3: Decline (High burden, braking dominates)

    // Heuristic M_ext growth proxy
    const burden = cycleProgress * 100;
    massSlider.value = burden;

    // Heuristic Spin(t) profile linked to burden
    // Initially high, maybe peaks slightly as it compacts, then falls due to braking force
    const spin = 100 * Math.exp(-cycleProgress * 2) * (1 + Math.sin(cycleProgress * Math.PI) * 0.5);
    spinSlider.value = Math.max(5, spin);

    if (cycleProgress < 0.3) {
        statusText.innerText = "LIFE CYCLE: Phase 1 - Pure Action Spin-up";
        statusText.style.color = "var(--accent-blue)";
    } else if (cycleProgress < 0.6) {
        statusText.innerText = "LIFE CYCLE: Phase 2 - Peak Coupling (Burden Balance)";
        statusText.style.color = "var(--accent-amber)";
    } else {
        statusText.innerText = "LIFE CYCLE: Phase 3 - Gravitational Braking (Decline)";
        statusText.style.color = "var(--accent-rose)";
    }
}

function renderPageCurve() {
    for (let i = 0; i < maxEntropyPoints; i++) {
        if (barsUnitary[i]) {
            barsUnitary[i].style.height = (entropyPoints[i] * 80) + '%';
        }
        if (barsNaive[i]) {
            barsNaive[i].style.height = (naiveEntropyPoints[i] * 80) + '%';
        }
    }
}

mergerBtn.onclick = () => {
    mergerPulse = 1.0;
    statusText.innerText = "Sequential Relaxation Initiated...";
    setTimeout(() => {
        statusText.innerText = '"Once spacetime is quantised, a black hole can never merge just once."';
        statusText.style.color = 'var(--accent-emerald)';
    }, 2000);
};

autoCycleBtn.onclick = () => {
    isAutoCycle = !isAutoCycle;
    autoCycleBtn.innerText = isAutoCycle ? "Stop Life Cycle" : "Start Life Cycle";
    if (isAutoCycle) cycleProgress = 0;
};

function animate() {
    ctx.fillStyle = '#010105';
    ctx.fillRect(0, 0, canvasCssWidth, canvasCssHeight);

    if (isAutoCycle) handleAutoCycle();

    const spin = parseFloat(spinSlider.value);
    const burden = parseFloat(massSlider.value);
    const effectiveSpin = spin * (1 - burden / 200);

    const centerX = canvasCssWidth / 2;
    const centerY = canvasCssHeight / 2;
    const coreRadius = Math.max(28, Math.min(canvasCssWidth, canvasCssHeight) * 0.07);
    const diskRadius = coreRadius * 1.6;

    drawGrid(centerX, centerY, burden);
    drawAccretionDisk(centerX, centerY, diskRadius, effectiveSpin, burden);
    drawCore(centerX, centerY, coreRadius, effectiveSpin, burden);

    if (mergerPulse > 0) mergerPulse *= 0.95;

    const lIntensity = updateStats(spin, burden);
    drawSparks(centerX, centerY, coreRadius, lIntensity);

    time++;
    requestAnimationFrame(animate);
}

animate();
