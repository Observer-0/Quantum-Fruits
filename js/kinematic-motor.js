const canvas = document.getElementById('motorCanvas');
const ctx = canvas.getContext('2d');

const spinSlider = document.getElementById('spinRate');
const massSlider = document.getElementById('massBurden');

const netPotentialVal = document.getElementById('netPotential');
const magneticFluxVal = document.getElementById('magneticFlux');
const statusText = document.getElementById('statusText');

canvas.width = 600;
canvas.height = 600;

let time = 0;

function drawCore(x, y, radius, spin, burden) {
    const pulse = 1 + Math.sin(time * 0.1 * spin) * 0.05;
    const coreColor = burden > 50 ? '#ff4d00' : '#00f2ff';

    // Core Glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * pulse);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.2, coreColor);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Magnetic Field Lines (reactive to spin)
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.2 + (spin / 200);

    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        const angle = (i * Math.PI / 4) + (time * 0.005 * spin);
        const rx = Math.cos(angle) * radius * 2.5;
        const ry = Math.sin(angle) * radius * 0.8;

        ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), angle, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
}

function drawAccretionDisk(x, y, radius, spin, burden) {
    const particleCount = Math.floor(burden * 5);
    ctx.fillStyle = '#ffcc00';

    for (let i = 0; i < particleCount; i++) {
        const distance = radius * 1.5 + (i * 0.5);
        const angle = (time * 0.01 * (spin / burden || 1)) + (i * 0.1);

        const px = x + Math.cos(angle) * distance;
        const py = y + Math.sin(angle) * distance * 0.3;

        const size = Math.random() * 2;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(px, py, size, size);
    }
    ctx.globalAlpha = 1.0;
}

function updateStats() {
    const spin = parseFloat(spinSlider.value);
    const burden = parseFloat(massSlider.value);

    // Simulation logic corresponding to Python
    const iMax = 1.21e44;
    const net = iMax * (spin / 100) * (1 - (burden / 150));

    netPotentialVal.innerText = net.toExponential(2);
    magneticFluxVal.innerText = burden > 60 ? "Regulated" : (spin > 70 ? "Intense" : "Stable");

    if (burden < 20) {
        statusText.innerText = '"Naked Action Core"';
        statusText.style.color = '#00f2ff';
    } else if (burden > 80) {
        statusText.innerText = '"Braked / Mass Loaded"';
        statusText.style.color = '#ff4d00';
    } else {
        statusText.innerText = '"Dynamic Transformer"';
        statusText.style.color = '#bc00ff';
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const spin = parseFloat(spinSlider.value);
    const burden = parseFloat(massSlider.value);

    // Effective animation spin is slowed down by burden
    const effectiveSpin = spin * (1 - burden / 120);

    drawAccretionDisk(300, 300, 80, effectiveSpin, burden);
    drawCore(300, 300, 50, effectiveSpin, burden);

    updateStats();

    time++;
    requestAnimationFrame(animate);
}

animate();
