/**
 * js/dipole-sim.js
 * ------------------------
 * Simulates motion through the discrete sigmaP grid.
 * Illustrates the "Friction" (Tick-Rate) increase with velocity.
 */

const canvas = document.getElementById('dipoleCanvas');
const ctx = canvas.getContext('2d');
const vSlider = document.getElementById('v-slider');
const tickRateLabel = document.getElementById('tick-rate');
const frictionFill = document.getElementById('friction-fill');
const toggleGridBtn = document.getElementById('toggle-grid');

let time = 0;
let showGrid = true;

// Grid settings
const gridSize = 40;
let offset = 0;

function drawGrid(v) {
    const w = canvas.width;
    const h = canvas.height;

    ctx.strokeStyle = `rgba(99, 102, 241, ${showGrid ? 0.2 : 0})`;
    ctx.lineWidth = 1;

    offset = (time * v * 1000) % gridSize;

    for (let x = -gridSize; x < w + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x - offset, 0);
        ctx.lineTo(x - offset, h);
        ctx.stroke();
    }

    for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
}

function drawObserver(v) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Movement "Shockwave" or Friction glow
    const friction = v * 50;
    const glow = 20 + friction * 50;

    // Outer Friction Glow
    const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, glow);
    gradient.addColorStop(0, `rgba(244, 63, 94, ${v * 5})`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, glow, 0, Math.PI * 2);
    ctx.fill();

    // The Observer
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#6366f1';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function updateStats(v) {
    // Arbitrary calculation to show the 3.7x effect
    const baseRate = v * 1e12;
    const excessRate = baseRate * 3.7;
    tickRateLabel.innerText = excessRate.toExponential(2) + " ticks/s";

    const frictionPercent = Math.min(100, v * 1500); // Scale slider v=0.1 to 100%
    frictionFill.style.width = frictionPercent + "%";
}

function animate() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const v = parseFloat(vSlider.value);

    drawGrid(v);
    drawObserver(v);
    updateStats(v);

    time++;
    requestAnimationFrame(animate);
}

toggleGridBtn.onclick = () => {
    showGrid = !showGrid;
    toggleGridBtn.innerText = showGrid ? "Hide Spacetime Grid" : "Show Spacetime Grid";
};

animate();
