/**
 * Universal Resonance Model (URM) - Zander Processor Simulation
 * Visualizes the 4-Vector Write-Head logic and Spacetime Grains.
 */

const urmLatticeCanvas = document.getElementById('urmLatticeCanvas');
if (urmLatticeCanvas) {
    const ctx = urmLatticeCanvas.getContext('2d');
    const N = 40; // Lattice size
    const cellSize = urmLatticeCanvas.width / N;

    // Physical Constants
    const hbar = 1.054571817e-34;
    const G_const = 6.67430e-11;
    const c_const = 2.99792458e8;
    const sigmaP = (hbar * G_const) / Math.pow(c_const, 4);

    // State Variables
    let x = Array.from({ length: N }, () => new Float32Array(N).map(() => (Math.random() - 0.5) * 0.5));
    let v = Array.from({ length: N }, () => new Float32Array(N));
    let entropy = 0;
    let time_acc = 0;

    // Simulation Parameters
    let k = 1.0;      // Coupling (The "Bus" Bandwidth)
    let alpha = 0.01; // Nonlinearity
    let c_damping = 0.1;

    function initLattice() {
        x = Array.from({ length: N }, () => new Float32Array(N).map(() => (Math.random() - 0.5) * 0.5));
        v = Array.from({ length: N }, () => new Float32Array(N));
        entropy = 0;
        time_acc = 0;
    }

    function update() {
        const dt = 0.05;
        let newX = Array.from({ length: N }, () => new Float32Array(N));
        let newV = Array.from({ length: N }, () => new Float32Array(N));

        // Coefficients
        const beta = 0.005;
        const xi = 0.02;     // Stochastic noise (The Fruit Ripening)
        const eta = 0.05;    // Topological coupling (The Tree Structure)

        let sumSin = 0;
        let sumCos = 0;
        let totalEnergy = 0;

        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                const iPrev = (i - 1 + N) % N;
                const iNext = (i + 1) % N;
                const jPrev = (j - 1 + N) % N;
                const jNext = (j + 1) % N;

                const laplacian = x[iNext][j] + x[iPrev][j] + x[i][jNext] + x[i][jPrev] - 4 * x[i][j];

                // Potential using information-density scaling
                const potential = (alpha * Math.pow(x[i][j], 3) + beta * Math.pow(x[i][j], 5));
                const jitter = (Math.random() - 0.5) * xi;
                const topo = eta * laplacian * Math.abs(x[i][j]);

                // Force: Coupling - Damping - Potential + Ripening + Topology
                const force = k * laplacian - c_damping * v[i][j] - potential + jitter + topo;

                newV[i][j] = v[i][j] + force * dt;
                newX[i][j] = x[i][j] + newV[i][j] * dt;

                // Sync Metrics
                const phase = (x[i][j] % (2 * Math.PI));
                sumSin += Math.sin(phase);
                sumCos += Math.cos(phase);
                totalEnergy += 0.5 * newV[i][j] ** 2 + 0.5 * k * laplacian ** 2;
            }
        }

        entropy += (totalEnergy / (N * N)) * 0.01;
        if (entropy > 100) entropy *= 0.95;

        x = newX;
        v = newV;
        time_acc += dt;

        // UI Updates
        const R = Math.sqrt(sumSin ** 2 + sumCos ** 2) / (N * N);
        const coherenceText = document.getElementById('urmCoherence');
        if (coherenceText) coherenceText.innerText = R.toFixed(4);

        const eText = document.getElementById('urmEntropyDisplay');
        if (eText) eText.innerText = (entropy).toFixed(2);
    }

    function draw() {
        ctx.fillStyle = '#020202';
        ctx.fillRect(0, 0, urmLatticeCanvas.width, urmLatticeCanvas.height);

        // Background Network (The 4-Vector Bus)
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < N; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, urmLatticeCanvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(urmLatticeCanvas.width, i * cellSize);
            ctx.stroke();
        }

        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                const amp = Math.abs(x[i][j]);
                const intensity = Math.min(255, amp * 100);

                // Information Density Color Mapping
                // Blue = Free Action (Quantum), Red = Frozen Mass (Classical)
                const r = Math.min(255, intensity * 0.2 + (entropy * 1.5));
                const g = Math.min(255, intensity * 0.5);
                const b = Math.min(255, intensity * 1.2 + 50);

                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(i * cellSize + 1, j * cellSize + 1, cellSize - 2, cellSize - 2);

                // The "Write-Head" Indicator (Vector t)
                if (amp > 2.0) {
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);

                    if (Math.random() > 0.99) {
                        const label = document.getElementById('write-head-label');
                        if (label) {
                            label.style.display = 'block';
                            label.style.top = (j * cellSize) + 'px';
                            label.style.left = (i * cellSize + 40) + 'px';
                            setTimeout(() => label.style.display = 'none', 1000);
                        }
                    }
                }
            }
        }
    }

    function initScalingTable() {
        const body = document.getElementById('scaling-table-body');
        if (!body) return;

        const objects = [
            { name: "Electron", r: 2.8e-15, m: 9.1e-31, type: "quantum" },
            { name: "Planck Scale", r: 1.6e-35, m: 2.1e-8, type: "fundamental" },
            { name: "Usain Bolt (Dash)", r: 1.95, m: 94, action: 7.82e5, type: "macro" },
            { name: "Pkw (Accel)", r: 4.5, m: 1500, action: 2.9e6, type: "macro" },
            { name: "Earth", r: 6.3e6, m: 5.9e24, type: "cosmo" },
            { name: "Sun", r: 6.9e8, m: 1.9e30, type: "cosmo" },
            { name: "Sgr A* (Black Hole)", r: 1.2e10, m: 8.2e36, type: "extreme" }
        ];

        body.innerHTML = '';
        objects.forEach(obj => {
            let actionDensity;

            if (obj.action) {
                // For macro events: density derived from total macro action
                actionDensity = (sigmaP * (obj.action / hbar)).toExponential(3);
            } else {
                // For steady states: scaling ratio = mc^2 / hf
                const mc2 = obj.m * Math.pow(c_const, 2);
                const hf = hbar * (c_const / obj.r);
                const ratio = mc2 / hf;
                actionDensity = (sigmaP * ratio).toExponential(3);
            }

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            const color = obj.type === 'macro' ? '#fbbf24' : (obj.type === 'extreme' ? '#ef4444' : '#3b82f6');

            tr.innerHTML = `
                <td style="padding: 10px; color: white; font-weight: bold;">${obj.name} <span style="font-size: 0.6rem; color: ${color}; text-transform: uppercase;">[${obj.type}]</span></td>
                <td style="padding: 10px;">${obj.r.toExponential(2)} m</td>
                <td style="padding: 10px;">${obj.m.toExponential(2)} kg</td>
                <td style="padding: 10px; color: ${color}; font-family: 'JetBrains Mono';">${actionDensity} m²s</td>
            `;
            body.appendChild(tr);
        });
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }

    initScalingTable();
    loop();

    // Event Listeners for UI
    const kSlider = document.getElementById('urmKRange');
    if (kSlider) kSlider.oninput = (e) => k = parseFloat(e.target.value);

    const aSlider = document.getElementById('urmalphRange');
    if (aSlider) aSlider.oninput = (e) => alpha = parseFloat(e.target.value);
}
