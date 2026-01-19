const canvas = document.getElementById('motorCanvas');
const ctx = canvas.getContext('2d');
const spinSlider = document.getElementById('spinRate');
const massSlider = document.getElementById('massBurden');
const mergerBtn = document.getElementById('mergerBtn');

const netPotentialVal = document.getElementById('netPotential');
const tickDensityVal = document.getElementById('tickDensity');
const statusText = document.getElementById('statusText');
const pageCurvePlot = document.getElementById('pageCurvePlot');

canvas.width = 500;
canvas.height = 500;

let time = 0;
let mergerPulse = 0;
let entropyPoints = [];
const maxEntropyPoints = 100;

// Initialize Page Curve data
for (let i = 0; i < maxEntropyPoints; i++) entropyPoints.push(0);

function drawGrid(x, y, burden) {
    const spacing = 30;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    for (let i = -10; i < 10; i++) {
        // Vertical lines
        ctx.beginPath();
        for (let j = -10; j < 10; j++) {
            const gx = x + i * spacing;
            const gy = y + j * spacing;

            const dx = gx - x;
            const dy = gy - y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Lensing / Warping factor (Regularized by sigma_P)
            const sigmaP = 50;
            const warp = (burden * 2) / (1 + dist / sigmaP);

            const wx = gx - (dx / dist) * warp;
            const wy = gy - (dy / dist) * warp;

            if (j === -10) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
        }
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        for (let j = -10; j < 10; j++) {
            const gx = x + j * spacing;
            const gy = y + i * spacing;

            const dx = gx - x;
            const dy = gy - y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const sigmaP = 50;
            const warp = (burden * 2) / (1 + dist / sigmaP);

            const wx = gx - (dx / dist) * warp;
            const wy = gy - (dy / dist) * warp;

            if (j === -10) ctx.moveTo(wx, wy);
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

function updateStats() {
    const spin = parseFloat(spinSlider.value);
    const burden = parseFloat(massSlider.value);

    const iMax = 1.21e44;
    const net = iMax * (spin / 100) * (1 - (burden / 150));

    netPotentialVal.innerText = net.toExponential(2);
    tickDensityVal.innerText = burden > 70 ? "σ_P Saturated" : (spin > 80 ? "Quantum Max" : "Nominal");
    tickDensityVal.style.color = burden > 70 ? "#ef4444" : "#38bdf8";

    if (burden < 20) {
        statusText.innerText = 'Pure Action (ℏ) Phase';
        statusText.style.color = '#38bdf8';
    } else if (burden > 80) {
        statusText.innerText = 'Gravitational Braking Active';
        statusText.style.color = '#f43f5e';
    } else {
        statusText.innerText = 'Unitary Transformer Equilibrium';
        statusText.style.color = '#a855f7';
    }

    // Update Page Curve logic
    // Entropy rises with mass burden, then falls as information returns (spin matching)
    const targetEntropy = (burden / 100) * (1 - Math.abs(burden - spin) / 100);
    entropyPoints.push(Math.max(0, targetEntropy));
    if (entropyPoints.length > maxEntropyPoints) entropyPoints.shift();

    renderPageCurve();
}

function renderPageCurve() {
    pageCurvePlot.innerHTML = '';
    entropyPoints.forEach((val, i) => {
        const bar = document.createElement('div');
        bar.style.flex = "1";
        bar.style.height = (val * 100) + "%";
        bar.style.background = `linear-gradient(to top, #ef4444, #38bdf8)`;
        bar.style.opacity = i / maxEntropyPoints;
        pageCurvePlot.appendChild(bar);
    });
}

mergerBtn.onclick = () => {
    mergerPulse = 1.0;
};

function animate() {
    ctx.fillStyle = '#010105';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const spin = parseFloat(spinSlider.value);
    const burden = parseFloat(massSlider.value);
    const effectiveSpin = spin * (1 - burden / 200);

    drawGrid(250, 250, burden);
    drawAccretionDisk(250, 250, 60, effectiveSpin, burden);
    drawCore(250, 250, 40, effectiveSpin, burden);

    if (mergerPulse > 0) mergerPulse *= 0.95;

    updateStats(spin, burden);

    time++;
    requestAnimationFrame(animate);
}

animate();
