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
    function update() {
    const dt = 0.05;

    // UI Elements
    const kRange = document.getElementById('urmKRange');
        // Prepare arrays
        let newX = Array.from({ length: N }, () => new Float32Array(N));
        let newV = Array.from({ length: N }, () => new Float32Array(N));
        let accel = Array.from({ length: N }, () => new Float32Array(N));

        // URME Coefficients
        const beta = 0.005;  // phi^5 term
        const xi = 0.02;    // Stochastic intensity
        const eta = 0.01;   // Topological coupling
        
        // Entropy-based cooling factor: 1 / e^(S/kB)
        const S_cool = Math.exp(-entropy / 10.0);

        // Read integrator selection
        const integratorSelect = document.getElementById('urmIntegratorSelect');
        const integratorMode = integratorSelect ? integratorSelect.value : 'verlet';

        // 1) First pass: compute accelerations and provisional positions using Velocity-Verlet
        if (integratorMode === 'verlet') {
            for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                const iPrev = (i - 1 + N) % N;
                const iNext = (i + 1) % N;
                const jPrev = (j - 1 + N) % N;
                const jNext = (j + 1) % N;

                const laplacian = x[iNext][j] + x[iPrev][j] + x[i][jNext] + x[i][jPrev] - 4 * x[i][j];

                const potential = (alpha * Math.pow(x[i][j], 3) + beta * Math.pow(x[i][j], 5)) * S_cool;
                const zeta = (Math.random() - 0.5) * xi;
                const topo = eta * laplacian * Math.abs(x[i][j]);

                const force = k * laplacian - c * v[i][j] - potential + zeta + topo;
                const a = force / m;
                accel[i][j] = a;

                // provisional position
                newX[i][j] = x[i][j] + v[i][j] * dt + 0.5 * a * dt * dt;
            }
            }
        } else {
            // Euler integrator (legacy) - simpler but less stable
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                    const iPrev = (i - 1 + N) % N;
                    const iNext = (i + 1) % N;
                    const jPrev = (j - 1 + N) % N;
                    const jNext = (j + 1) % N;

                    const laplacian = x[iNext][j] + x[iPrev][j] + x[i][jNext] + x[i][jPrev] - 4 * x[i][j];
                    const potential = (alpha * Math.pow(x[i][j], 3) + beta * Math.pow(x[i][j], 5)) * S_cool;
                    const zeta = (Math.random() - 0.5) * xi;
                    const topo = eta * laplacian * Math.abs(x[i][j]);
                    const force = k * laplacian - c * v[i][j] - potential + zeta + topo;

                    newV[i][j] = v[i][j] + (force / m) * dt;
                    newX[i][j] = x[i][j] + newV[i][j] * dt;
                }
            }
        }

        // 2) Second pass: compute accelerations at new positions and update velocities
        let sumSin = 0;
        let sumCos = 0;
        let totalEnergy = 0;

        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                const iPrev = (i - 1 + N) % N;
                const iNext = (i + 1) % N;
                const jPrev = (j - 1 + N) % N;
                const jNext = (j + 1) % N;

                const lap_new = newX[iNext][j] + newX[iPrev][j] + newX[i][jNext] + newX[i][jPrev] - 4 * newX[i][j];
                const potential_new = (alpha * Math.pow(newX[i][j], 3) + beta * Math.pow(newX[i][j], 5)) * S_cool;
                const zeta_new = (Math.random() - 0.5) * xi;
                const topo_new = eta * lap_new * Math.abs(newX[i][j]);

                const force_new = k * lap_new - c * v[i][j] - potential_new + zeta_new + topo_new;
                const a_new = force_new / m;

                // velocity update (Velocity Verlet)
                newV[i][j] = v[i][j] + 0.5 * (accel[i][j] + a_new) * dt;

                // Metrics on new state
                const phase = (newX[i][j] % (2 * Math.PI));
                sumSin += Math.sin(phase);
                sumCos += Math.cos(phase);
                totalEnergy += 0.5 * m * newV[i][j]**2 + 0.5 * k * lap_new**2;
            }
        }

        // Entropy growth as a function of activity/dissipation
        entropy += (totalEnergy / (N * N)) * 0.01;
        if (entropy > 50) entropy *= 0.99; // Natural saturation

        x = newX;
        v = newV;
        t += dt;

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
