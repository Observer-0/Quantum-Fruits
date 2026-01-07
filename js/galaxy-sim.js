class GalaxySimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.numStars = 4000;
        this.centerX = 0;
        this.centerY = 0;
        this.animationId = null;
        this.isRunning = true;

        // Simulation parameters
        this.params = {
            armCount: 2,
            armSpread: 0.5, // How "tight" the spiral is
            coreRadius: 40,
            galaxyRadius: 300,
            rotationSpeed: 0.001,
            tilt: 0.6, // Tilt for 3D effect
            sigmaP: 0.5 // Default sigma_P coupling
        };

        this.resize();
        this.init();
        window.addEventListener('resize', () => this.resize());

        this.animate = this.animate.bind(this);
        this.animate();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = 500; // Increased height
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    init() {
        this.stars = [];
        for (let i = 0; i < this.numStars; i++) {
            this.stars.push(this.createStar());
        }
    }

    updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
        // Partially re-init speeds for existing stars to avoid jumpy transition
        this.stars.forEach(star => {
            star.speed = this.calculateSpeed(star.r);
        });
    }

    calculateSpeed(r) {
        // v_kepler = 1 / sqrt(r)
        // v_zander = flat at large r
        const kepler = 15 / (Math.sqrt(r) + 5);
        const zander = 0.5; // Constant flat speed

        // Linear interpolation based on sigmaP coupling:
        // 0 = Pure Keplerian (Galaxies fly apart/lag)
        // 1 = Pure Zander (Flat rotation curve / Stability)
        const combined = (1 - this.params.sigmaP) * kepler + (this.params.sigmaP * zander);

        return combined * this.params.rotationSpeed * 5;
    }

    createStar() {
        // Distance from center (exponential distribution for realistic density)
        const r = Math.random() * this.params.galaxyRadius;

        // Angle based on spiral arms
        const armIndex = Math.floor(Math.random() * this.params.armCount);
        const armAngle = (Math.PI * 2 * armIndex) / this.params.armCount;
        const spiralAngle = r * this.params.armSpread;

        // Random scatter
        const scatter = (Math.random() - 0.5) * (Math.PI / 1.5) * (1 - r / this.params.galaxyRadius);

        const angle = armAngle + spiralAngle + scatter;

        let color;
        if (r < this.params.coreRadius) {
            color = `rgba(255, 230, 180, ${Math.random() * 0.8 + 0.2})`; // Yellowish core
        } else {
            const hue = 190 + Math.random() * 50; // Cyan/Blue
            color = `hsla(${hue}, 90%, 75%, ${Math.random() * 0.7 + 0.3})`;
        }

        return {
            r: r,
            angle: angle,
            size: Math.random() * 1.8,
            speed: this.calculateSpeed(r),
            color: color,
            z: (Math.random() - 0.5) * 20
        };
    }

    draw() {
        // Clear with trail effect
        this.ctx.fillStyle = 'rgba(2, 6, 23, 0.15)'; // Slightly smoother trail
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.stars.forEach(star => {
            star.angle += star.speed;

            const x = this.centerX + Math.cos(star.angle) * star.r;
            const y = this.centerY + Math.sin(star.angle) * star.r * this.params.tilt;

            this.ctx.beginPath();
            this.ctx.fillStyle = star.color;
            this.ctx.arc(x, y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw Action Core (Black Hole source)
        const pulse = Math.sin(Date.now() * 0.002) * 2 + 15;
        const gradient = this.ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, pulse);
        gradient.addColorStop(0, 'rgba(0, 242, 255, 1)'); // Pulsing Cyan
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, pulse, 0, Math.PI * 2);
        this.ctx.fill();
    }

    animate() {
        if (!this.isRunning) return;
        this.draw();
        this.animationId = requestAnimationFrame(this.animate);
    }

    toggle() {
        this.isRunning = !this.isRunning;
        if (this.isRunning) this.animate();
        else cancelAnimationFrame(this.animationId);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.galaxySim = new GalaxySimulation('galaxyCanvas');

    const btn = document.getElementById('toggleGalaxy');
    if (btn) {
        btn.addEventListener('click', () => {
            window.galaxySim.toggle();
            btn.textContent = window.galaxySim.isRunning ? 'Simulation pausieren' : 'Simulation starten';
        });
    }

    const sigmaSlider = document.getElementById('sigma-coupling-slider');
    if (sigmaSlider) {
        sigmaSlider.addEventListener('input', (e) => {
            const coupling = parseFloat(e.target.value) / 100;
            window.galaxySim.updateParams({ sigmaP: coupling });
            document.getElementById('val-sigma-coupling').innerText = (coupling * 100).toFixed(0) + "%";
        });
    }
});

