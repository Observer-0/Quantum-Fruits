class GCEMorphologySimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.mode = 'dm'; // 'dm' or 'sigmap'
        this.stars = [];
        this.gammaParticles = [];
        this.numStars = 1500;
        this.numGamma = 1000;

        this.params = {
            bulgeA: 120,    // Semi-major axis (horizontal)
            bulgeB: 85,     // Semi-minor axis (vertical) -> b/a ~ 0.7
            haloRadius: 100
        };

        this.init();
        this.setupControls();
        this.animate = this.animate.bind(this);
        this.animate();
    }

    init() {
        this.stars = [];
        this.gammaParticles = [];

        // Create baryonic bulge stars
        for (let i = 0; i < this.numStars; i++) {
            // Boxy/Elliptical distribution
            const angle = Math.random() * Math.PI * 2;
            const r = Math.pow(Math.random(), 0.5); // Density gradient
            this.stars.push({
                x: Math.cos(angle) * r * this.params.bulgeA,
                y: Math.sin(angle) * r * this.params.bulgeB,
                size: Math.random() * 1.2 + 0.5,
                alpha: Math.random() * 0.5 + 0.2
            });
        }

        this.updateGamma();
    }

    updateGamma() {
        this.gammaParticles = [];
        const count = this.numGamma;

        if (this.mode === 'dm') {
            // Spherical/Isotropic distribution for Dark Matter
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
            // Sigma_P mode: Scaling with baryonic density squared (n^2)
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
        const label = document.getElementById('gce-label');
        const stats = document.getElementById('gce-stats');

        if (btnDM && btnSigma) {
            btnDM.addEventListener('click', () => {
                this.mode = 'dm';
                btnDM.classList.add('active');
                btnSigma.classList.remove('active');
                label.innerText = "MODE: DARK MATTER (HESTIA)";
                label.style.borderColor = "#ef4444";
                label.style.color = "#ef4444";
                stats.innerHTML = `Achsenverhältnis b/a: 1.0 (Sphärisch)<br>Parameter: 57 freie Fits<br>Kosten: Milliarden (für den Steuerzahler)`;
                this.updateGamma();
            });

            btnSigma.addEventListener('click', () => {
                this.mode = 'sigmap';
                btnSigma.classList.add('active');
                btnDM.classList.remove('active');
                label.innerText = "MODE: σP GEOMETRY (CHROME TAB)";
                label.style.borderColor = "#3b82f6";
                label.style.color = "#3b82f6";
                stats.innerHTML = `Achsenverhältnis b/a: 0.7 (Elliptisch)<br>Parameter: 0 (Baryonisch)<br>Kosten: 1 Kaffee (für den User)`;
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

        // 1. Draw Gamma Ray Heatmap (Background Glow)
        this.ctx.globalCompositeOperation = 'screen';
        this.gammaParticles.forEach(p => {
            const grad = this.ctx.createRadialGradient(cx + p.x, cy + p.y, 0, cx + p.x, cy + p.y, 15);
            const color = this.mode === 'dm' ? 'rgba(239, 68, 68,' : 'rgba(59, 130, 246,';
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

        // Add subtle coordinate system
        this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, cy); this.ctx.lineTo(w, cy);
        this.ctx.moveTo(cx, 0); this.ctx.lineTo(cx, h);
        this.ctx.stroke();
    }

    animate() {
        this.draw();
        requestAnimationFrame(this.animate);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GCEMorphologySimulation('gceCanvas');
});
