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
            armSpread: 0.5,
            coreRadius: 40,
            galaxyRadius: 300,
            rotationSpeed: 0.005,
            tilt: 0.6,
            showFlow: true,
            showNetwork: false
        };

        this.time = 0;
        this.flowLines = [];
        this.numFlow = 30;

        this.resize();
        this.init();
        window.addEventListener('resize', () => this.resize());

        this.animate = this.animate.bind(this);
        this.animate();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = 400;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    init() {
        this.stars = [];
        for (let i = 0; i < this.numStars; i++) {
            this.stars.push(this.createStar());
        }

        this.flowLines = [];
        for (let i = 0; i < this.numFlow; i++) {
            this.flowLines.push({
                angle: (i / this.numFlow) * Math.PI * 2,
                points: [],
                speed: 0.01 + Math.random() * 0.02,
                offset: Math.random() * 100
            });
        }
    }

    createStar() {
        const r = Math.random() * this.params.galaxyRadius;
        const armIndex = Math.floor(Math.random() * this.params.armCount);
        const armAngle = (Math.PI * 2 * armIndex) / this.params.armCount;
        const spiralAngle = r * this.params.armSpread;
        const scatter = (Math.random() - 0.5) * (Math.PI / 1.5) * (1 - r / this.params.galaxyRadius);
        const angle = armAngle + spiralAngle + scatter;

        // Color logic
        let color;
        if (r < this.params.coreRadius) {
            color = `rgba(255, 230, 180, ${Math.random() * 0.8 + 0.2})`;
        } else {
            const h = 200 + Math.random() * 60;
            color = `hsla(${h}, 80%, 70%, ${Math.random() * 0.5 + 0.1})`;
        }

        // MOND-like / Zander-Flow Speed: Constant v instead of Keplerian 1/sqrt(r)
        // v = sqrt(G M a0)^(1/4) -> v is constant at large r 
        const speed = (0.015 / (1 + r * 0.001)) * (0.5 + Math.random() * 0.5);

        return {
            r: r,
            angle: angle,
            size: Math.random() * 1.5,
            speed: speed,
            color: color,
            z: (Math.random() - 0.5) * 20
        };
    }

    draw() {
        this.time += 1;
        this.ctx.fillStyle = 'rgba(2, 6, 23, 0.4)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw Zander-Flow (Logarithmic Vector Field)
        if (this.params.showFlow) {
            this.ctx.lineWidth = 1;
            this.flowLines.forEach(line => {
                this.ctx.beginPath();
                this.ctx.strokeStyle = `rgba(0, 242, 255, 0.05)`;
                const rMax = this.params.galaxyRadius * 1.2;
                for (let r = 10; r < rMax; r += 10) {
                    // Logarithmic spiral twist
                    const dynamicAngle = line.angle + Math.log(r) * 0.8 - this.time * line.speed * 0.1;
                    const x = this.centerX + Math.cos(dynamicAngle) * r;
                    const y = this.centerY + Math.sin(dynamicAngle) * r * this.params.tilt;
                    if (r === 10) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
                }
                this.ctx.stroke();
            });
        }

        // 2. Draw Stars and Network
        this.stars.forEach((star, i) => {
            star.angle += star.speed;
            const x = this.centerX + Math.cos(star.angle) * star.r;
            const y = this.centerY + Math.sin(star.angle) * star.r * this.params.tilt;

            // Draw Connection (Pull vs Hold)
            if (this.params.showNetwork && i % 40 === 0) {
                // Pull (Solid)
                this.ctx.beginPath();
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.moveTo(this.centerX, this.centerY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();

                // Hold (Dashed / Spiral)
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.15)';
                this.ctx.arc(this.centerX, this.centerY, star.r, star.angle - 0.5, star.angle, false);
                // Simple arc for hold
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }

            this.ctx.beginPath();
            this.ctx.fillStyle = star.color;
            this.ctx.arc(x, y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 3. Draw Core (Action Core)
        const gradient = this.ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, 30);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(0, 242, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 30, 0, Math.PI * 2);
        this.ctx.fill();

        // Core Ring
        this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.ellipse(this.centerX, this.centerY, this.params.coreRadius, this.params.coreRadius * this.params.tilt, 0, 0, Math.PI * 2);
        this.ctx.stroke();
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

    // Add extra controls if they exist or create them
    const simControls = document.querySelector('.simulation-controls');
    if (simControls) {
        const toggleNetwork = document.createElement('button');
        toggleNetwork.textContent = 'Pull-Hold Gitter an/aus';
        toggleNetwork.addEventListener('click', () => {
            window.galaxySim.params.showNetwork = !window.galaxySim.params.showNetwork;
        });
        simControls.appendChild(toggleNetwork);
    }
});

