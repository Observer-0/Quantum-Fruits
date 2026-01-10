/**
 * Universal Resonance Model (URM) - 2D Lattice Simulation
 * Based on Zander (2025)
 */

const urmLatticeCanvas = document.getElementById('urmLatticeCanvas');
if (urmLatticeCanvas) {
    const ctx = urmLatticeCanvas.getContext('2d');
    const N = 40; // Lattice size
    const cellSize = urmLatticeCanvas.width / N;

    // Simulation Parameters from UI
    let k = 1.0;      // Coupling
    let alpha = 0.01; // Nonlinearity
    let c = 0.1;      // Damping
    const m = 1.0;    // Mass
    const dt = 0.05;

    // UI Elements
    const kRange = document.getElementById('urmKRange');
    const alphaRange = document.getElementById('urmAlphaRange');
    const cRange = document.getElementById('urmCRange');
    const statusText = document.getElementById('urmStatus');
    const coherenceText = document.getElementById('urmCoherence');

    // State
    let x = Array.from({ length: N }, () => new Float32Array(N).fill(0));
    let v = Array.from({ length: N }, () => new Float32Array(N).fill(0));
    let t = 0;

    function initLattice() {
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                x[i][j] = (Math.random() - 0.5) * 0.1;
                v[i][j] = 0;
            }
        }
    }

    window.resetURMLattice = function () {
        const mid = Math.floor(N / 2);
        x[mid][mid] = 5.0; // Strong central impulse
        statusText.innerText = "Impulse Triggered!";
        setTimeout(() => { statusText.innerText = "Resonating..."; }, 1000);
    };

    function update() {
        // Read UI
        if (kRange) k = parseFloat(kRange.value);
        if (alphaRange) alpha = parseFloat(alphaRange.value);
        if (cRange) c = parseFloat(cRange.value);

        let newX = Array.from({ length: N }, () => new Float32Array(N));
        let newV = Array.from({ length: N }, () => new Float32Array(N));

        let sumSin = 0;
        let sumCos = 0;

        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                // Laplacian (4-neighbor)
                const iPrev = (i - 1 + N) % N;
                const iNext = (i + 1) % N;
                const jPrev = (j - 1 + N) % N;
                const jNext = (j + 1) % N;

                const laplacian = x[iNext][j] + x[iPrev][j] + x[i][jNext] + x[i][jPrev] - 4 * x[i][j];

                // Force equation: k * Laplacian - c * v - alpha * x^3
                const force = k * laplacian - c * v[i][j] - alpha * Math.pow(x[i][j], 3);

                // Euler Integration
                newV[i][j] = v[i][j] + (force / m) * dt;
                newX[i][j] = x[i][j] + newV[i][j] * dt;

                // Sync Metrics (Mocking phase via normalization)
                const phase = (x[i][j] % (2 * Math.PI));
                sumSin += Math.sin(phase);
                sumCos += Math.cos(phase);
            }
        }

        x = newX;
        v = newV;
        t += dt;

        // Calculate R (Coherence)
        const R = Math.sqrt(sumSin ** 2 + sumCos ** 2) / (N * N);
        if (coherenceText) coherenceText.innerText = R.toFixed(4);
    }

    function draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, urmLatticeCanvas.width, urmLatticeCanvas.height);

        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                const amp = Math.abs(x[i][j]);
                const intensity = Math.min(255, amp * 50);

                // Heatmap logic (Purple to White)
                ctx.fillStyle = `rgb(${intensity * 0.8 + 50}, ${intensity * 0.5}, ${intensity + 100})`;
                ctx.fillRect(i * cellSize, j * cellSize, cellSize - 0.5, cellSize - 0.5);

                // Glow effect for high amplitude
                if (amp > 1.0) {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#8b5cf6';
                } else {
                    ctx.shadowBlur = 0;
                }
            }
        }
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }

    initLattice();
    loop();
}
