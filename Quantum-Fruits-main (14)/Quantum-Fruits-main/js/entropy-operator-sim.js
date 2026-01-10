/**
 * Toy Model: Entropy Operator Simulation
 * Concept: S_hat = kB * ln( H_hf * H_m^-1 )
 * Evolution from Pure Action (High Entropy/Flow) to Mass Burden.
 */

class EntropyToySim {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.kB = 1.380649e-23;
        this.h = 6.626e-34;
        this.c = 2.9979e8;

        // Simulation parameters
        this.time = 0;
        this.running = true;

        // Two-level system properties
        // State 0: Pure Action (hf dominant)
        // State 1: Mass Burden (mc^2 dominant)
        this.E_hf_0 = 1.0e-18; // High
        this.E_m_0 = 1.0e-21; // Low

        this.E_hf_1 = 1.0e-21; // Low
        this.E_m_1 = 1.0e-18; // High

        // Probabilities (Density matrix diagonal)
        this.p0 = 1.0;
        this.p1 = 0.0;

        this.transitionRate = 0.02; // Action -> Mass transition

        this.history = [];
        this.maxHistory = 200;

        this.animate();
    }

    calculateS() {
        // S_MB = p0 * kB * ln(E_m0 / E_hf0) + p1 * kB * ln(E_m1 / E_hf1)
        const s0 = this.kB * Math.log(this.E_m_0 / this.E_hf_0);
        const s1 = this.kB * Math.log(this.E_m_1 / this.E_hf_1);
        return (this.p0 * s0) + (this.p1 * s1);
    }

    update() {
        if (!this.running) return;

        this.time += 0.1;

        // Transition dynamics: Action -> Mass
        const dp = this.p0 * this.transitionRate;
        this.p0 -= dp;
        this.p1 += dp;

        // BOUNCE MECHANISM
        // If p1 (Mass Burden) is nearly 1, trigger a feedback bounce back to action
        if (this.p1 > 0.99) {
            this.p0 = 1.0;
            this.p1 = 0.0;
            // Optionally flash the canvas or add a 'bounce' marker
            this.history.push({ t: this.time, S: NaN, p0: 0, p1: 0 }); // Visual break
        }

        const S = this.calculateS();
        this.history.push({ t: this.time, S: S, p0: this.p0, p1: this.p1 });
        if (this.history.length > this.maxHistory) this.history.shift();
    }

    draw() {
        const { ctx, canvas, history } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const w = canvas.width;
        const h = canvas.height;
        const margin = 40;

        // Draw Axis
        ctx.strokeStyle = '#444';
        ctx.beginPath();
        ctx.moveTo(margin, h - margin);
        ctx.lineTo(w - margin, h - margin);
        ctx.moveTo(margin, margin);
        ctx.lineTo(margin, h - margin);
        ctx.stroke();

        if (history.length < 2) return;

        // Find min/max for scaling
        const sVals = history.map(d => d.S);
        const minS = Math.min(...sVals);
        const maxS = Math.max(...sVals);
        const rangeS = Math.max(1e-25, maxS - minS);

        // Draw S(t) Curve
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        history.forEach((d, i) => {
            const x = margin + (i / this.maxHistory) * (w - 2 * margin);
            const y = h - margin - ((d.S - minS) / rangeS) * (h - 2 * margin);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#fff';
        ctx.font = '12px Inter';
        ctx.fillText('Zander-Entropie <S_Z>', margin, margin - 10);
        ctx.fillText('Zeit (Action -> Mass)', w / 2, h - margin / 4);

        // Draw Legend / Info
        ctx.fillStyle = '#rgba(59, 130, 246, 0.8)';
        ctx.fillText(`Aktuelle S_Z: ${this.calculateS().toExponential(2)} J/K`, margin + 10, margin + 20);
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`Action-State P(hf): ${(this.p0 * 100).toFixed(1)}%`, margin + 10, margin + 40);
        ctx.fillStyle = '#ef4444';
        ctx.fillText(`Mass-State P(mc2): ${(this.p1 * 100).toFixed(1)}%`, margin + 10, margin + 60);
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    toggle() {
        this.running = !this.running;
    }

    reset() {
        this.p0 = 1.0;
        this.p1 = 0.0;
        this.time = 0;
        this.history = [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const sim = new EntropyToySim('entropyToyCanvas');
    const toggleBtn = document.getElementById('toggleEntropyToy');
    const resetBtn = document.getElementById('resetEntropyToy');

    if (toggleBtn) {
        toggleBtn.onclick = () => {
            sim.toggle();
            toggleBtn.textContent = sim.running ? 'Simulation pausieren' : 'Simulation starten';
        };
    }

    if (resetBtn) {
        resetBtn.onclick = () => sim.reset();
    }
});
