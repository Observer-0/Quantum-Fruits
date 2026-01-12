class GCEMorphologySimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.mode = 'dm'; // 'dm', 'sigmap', or 'flow'
        this.stars = [];
        this.gammaParticles = [];
        this.flowLines = [];
        this.numStars = 1500;
        this.numGamma = 1000;
        this.numFlow = 40;

        this.params = {
            bulgeA: 120,    // Semi-major axis (horizontal)
            bulgeB: 85,     // Semi-minor axis (vertical) -> b/a ~ 0.7
            haloRadius: 100,
            sigmaRel: 1.054e-34 * 6.674e-11 / Math.pow(2.997e8, 2) // Rough sigmaP * c^2
        };

        this.time = 0;
        this.init();
        this.setupControls();
        this.animate = this.animate.bind(this);
        this.animate();
    }

    init() {
        this.stars = [];
        this.gammaParticles = [];
        this.flowLines = [];

        // Create baryonic bulge stars
        for (let i = 0; i < this.numStars; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.pow(Math.random(), 0.5);
            this.stars.push({
                x: Math.cos(angle) * r * this.params.bulgeA,
                y: Math.sin(angle) * r * this.params.bulgeB,
                size: Math.random() * 1.2 + 0.5,
                alpha: Math.random() * 0.5 + 0.2
            });
        }

        // Create volumetric flow lines
        for (let i = 0; i < this.numFlow; i++) {
            const angle = (i / this.numFlow) * Math.PI * 2;
            this.flowLines.push({
                angle: angle,
                points: [],
                speed: 0.1 + Math.random() * 0.2,
                offset: Math.random() * 100
            });
        }

        this.updateGamma();
    }

    updateGamma() {
        this.gammaParticles = [];
        const count = this.numGamma;

        if (this.mode === 'dm') {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.pow(Math.random(), 0.5) * this.params.haloRadius * 1.2;
                this.gammaParticles.push({
                    x: Math.cos(angle) * r,
                    y: Math.sin(angle) * r,
                    intensity: Math.random() * 0.5 + 0.5
                });
            }
        } else {
            // Sigma_P / Flow mode: Scaling with baryonic density + flow constraints
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.pow(Math.random(), 0.5);
                this.gammaParticles.push({
                    x: Math.cos(angle) * r * this.params.bulgeA,
                    y: Math.sin(angle) * r * this.params.bulgeB,
                    intensity: Math.random() * 0.8 + 0.2
                });
            }
        }
    }

    setupControls() {
        const btnDM = document.getElementById('mode-dm');
        const btnSigma = document.getElementById('mode-sigmap');
        const btnFlow = document.getElementById('mode-flow'); // New button support
        const label = document.getElementById('gce-label');
        const stats = document.getElementById('gce-stats');

        const resetButtons = () => {
            [btnDM, btnSigma, btnFlow].forEach(b => b && b.classList.remove('active'));
        };

        if (btnDM) {
            btnDM.addEventListener('click', () => {
                this.mode = 'dm';
                resetButtons(); btnDM.classList.add('active');
                label.innerText = "MODE: DARK MATTER (STOCHASTIC)";
                label.style.borderColor = "#ef4444"; label.style.color = "#ef4444";
                stats.innerHTML = `Achsenverhältnis: 1.0<br>Status: Statistisch maskiert<br>Problem: Widerspricht stellarer Verteilung`;
                this.updateGamma();
            });
        }

        if (btnSigma) {
            btnSigma.addEventListener('click', () => {
                this.mode = 'sigmap';
                resetButtons(); btnSigma.classList.add('active');
                label.innerText = "MODE: σP GEOMETRY (CHROME TAB)";
                label.style.borderColor = "#3b82f6"; label.style.color = "#3b82f6";
                stats.innerHTML = `Achsenverhältnis: 0.7<br>Status: Identisch mit Sternen (Baryonen)<br>Lösung: Geometrische Kopplung`;
                this.updateGamma();
            });
        }

        if (btnFlow) {
            btnFlow.addEventListener('click', () => {
                this.mode = 'flow';
                resetButtons(); btnFlow.classList.add('active');
                label.innerText = "MODE: ZANDER-FLOW (σP c²)";
                label.style.borderColor = "#10b981"; label.style.color = "#10b981";
                stats.innerHTML = `Flussrate: ~10⁻⁶² m³/s<br>Vektor: Radial konvergierend<br>Status: Dynamisches Gleichgewicht`;
                this.updateGamma();
            });
        }
    }

    draw() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, w, h);

        // 0. Draw Volumetric Flow Lines (Underlay)
        if (this.mode === 'flow') {
            this.ctx.lineWidth = 1;
            this.flowLines.forEach(line => {
                const rMax = 200;
                const rStep = 2;
                this.ctx.beginPath();
                this.ctx.strokeStyle = `rgba(16, 185, 129, 0.15)`;

                for (let r = 0; r < rMax; r += rStep) {
                    const dynamicAngle = line.angle + Math.sin(r * 0.05 - this.time * line.speed) * 0.2;
                    const x = Math.cos(dynamicAngle) * r;
                    const y = Math.sin(dynamicAngle) * r;
                    if (r === 0) this.ctx.moveTo(cx + x, cy + y);
                    else this.ctx.lineTo(cx + x, cy + y);
                }
                this.ctx.stroke();

                // Draw flow particle
                const pPos = (this.time * line.speed * 20 + line.offset) % rMax;
                const pAngle = line.angle + Math.sin(pPos * 0.05 - this.time * line.speed) * 0.2;
                this.ctx.fillStyle = '#10b981';
                this.ctx.beginPath();
                this.ctx.arc(cx + Math.cos(pAngle) * pPos, cy + Math.sin(pAngle) * pPos, 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }

        // 1. Draw Gamma Ray Heatmap (Background Glow)
        this.ctx.globalCompositeOperation = 'screen';
        this.gammaParticles.forEach(p => {
            const grad = this.ctx.createRadialGradient(cx + p.x, cy + p.y, 0, cx + p.x, cy + p.y, 15);
            let color = 'rgba(59, 130, 246,';
            if (this.mode === 'dm') color = 'rgba(239, 68, 68,';
            if (this.mode === 'flow') color = 'rgba(16, 185, 129,';

            grad.addColorStop(0, `${color} ${p.intensity * 0.3})`);
            grad.addColorStop(1, `${color} 0)`);
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(cx + p.x, cy + p.y, 15, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 2. Draw Stars (Bulge)
        this.ctx.globalCompositeOperation = 'lighter';
        this.stars.forEach(s => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(cx + s.x, cy + s.y, s.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Reset
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.globalAlpha = 1.0;

        // Black Hole Core
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = this.mode === 'flow' ? '#10b981' : '#fff';
        this.ctx.stroke();
    }

    animate() {
        this.time += 1;
        this.draw();
        requestAnimationFrame(this.animate);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GCEMorphologySimulation('gceCanvas');
});
