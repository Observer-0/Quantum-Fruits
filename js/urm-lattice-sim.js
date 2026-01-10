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
    let entropy = 0; // Represents the global Delta S
    let t = 0;

    function initLattice() {
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                x[i][j] = (Math.random() - 0.5) * 0.1;
                v[i][j] = 0;
            }
        }
        entropy = 0;
    }

    window.resetURMLattice = function () {
        const mid = Math.floor(N / 2);
        x[mid][mid] = 8.0; // Strong central impulse
        entropy = Math.max(0, entropy - 2.0); // Shock reduces local entropy (re-ordering)
        statusText.innerText = "Quantum Impulse!";
        setTimeout(() => { statusText.innerText = "Resonating..."; }, 1000);
    };

    function update() {
        // Read UI
        if (kRange) k = parseFloat(kRange.value);
        if (alphaRange) alpha = parseFloat(alphaRange.value);
        if (cRange) c = parseFloat(cRange.value);

        let newX = Array.from({ length: N }, () => new Float32Array(N));
        let newV = Array.from({ length: N }, () => new Float32Array(N));

        // URME Coefficients
        const beta = 0.005;  // phi^5 term
        const xi = 0.02;    // Stochastic intensity
        const eta = 0.01;   // Topological coupling
        
        // Entropy-based cooling factor: 1 / e^(S/kB)
        const S_cool = Math.exp(-entropy / 10.0);

        let sumSin = 0;
        let sumCos = 0;
        let totalEnergy = 0;

        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                // Laplacian (4-neighbor)
                const iPrev = (i - 1 + N) % N;
                const iNext = (i + 1) % N;
                const jPrev = (j - 1 + N) % N;
                const jNext = (j + 1) % N;

                const laplacian = x[iNext][j] + x[iPrev][j] + x[i][jNext] + x[i][jPrev] - 4 * x[i][j];

                // URME Potential: (alpha*phi^3 + beta*phi^5) * S_cool
                const potential = (alpha * Math.pow(x[i][j], 3) + beta * Math.pow(x[i][j], 5)) * S_cool;
                
                // Stochastic Component (xi * zeta)
                const zeta = (Math.random() - 0.5) * xi;

                // Simple Topological Feedback (eta * laplacian of curvature proxy)
                const topo = eta * laplacian * Math.abs(x[i][j]);

                // Force equation: k * Laplacian - c * v - Potential + Stochastic + Topo
                const force = k * laplacian - c * v[i][j] - potential + zeta + topo;

                // Euler Integration
                newV[i][j] = v[i][j] + (force / m) * dt;
                newX[i][j] = x[i][j] + newV[i][j] * dt;

                // Metrics
                const phase = (x[i][j] % (2 * Math.PI));
                sumSin += Math.sin(phase);
                sumCos += Math.cos(phase);
                totalEnergy += 0.5 * m * v[i][j]**2 + 0.5 * k * laplacian**2;
            }
        }

        // Entropy growth as a function of activity/dissipation
        entropy += (totalEnergy / (N * N)) * 0.01;
        if (entropy > 50) entropy *= 0.99; // Natural saturation

        x = newX;
        v = newV;
        t += dt;

        // Calculate R (Coherence)
        const R = Math.sqrt(sumSin ** 2 + sumCos ** 2) / (N * N);
        if (coherenceText) coherenceText.innerText = R.toFixed(4);
        
        // Update Entropy UI if exists
        const eText = document.getElementById('urmEntropyDisplay');
        if (eText) eText.innerText = (entropy).toFixed(2);
    }

    function draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, urmLatticeCanvas.width, urmLatticeCanvas.height);

        // Global Entropy Vignette (Reddish glow as S increases)
        const eIntensity = Math.min(0.2, entropy / 100);
        ctx.fillStyle = `rgba(239, 68, 68, ${eIntensity})`;
        ctx.fillRect(0, 0, urmLatticeCanvas.width, urmLatticeCanvas.height);

        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                const amp = Math.abs(x[i][j]);
                const intensity = Math.min(255, amp * 60);

                // URME Color Palette: Electric Blue (Quantum) to Amber (Entropy)
                const r = intensity * 0.4 + (entropy * 2);
                const g = intensity * 0.6;
                const b = intensity * 1.0 + 100;

                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(i * cellSize, j * cellSize, cellSize - 0.5, cellSize - 0.5);

                // Topological "Nodes" highlight
                if (amp > 2.0) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, amp - 2)})`;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
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
