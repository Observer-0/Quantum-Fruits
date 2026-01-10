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
            tilt: 0.6 // Tilt for 3D effect
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
        this.canvas.height = 400; // Fixed height
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    init() {
        this.stars = [];
        for (let i = 0; i < this.numStars; i++) {
            this.stars.push(this.createStar());
        }
    }

    createStar() {
        // Distance from center (exponential distribution for realistic density)
        const r = Math.random() * this.params.galaxyRadius;

        // Angle based on spiral arms
        const armIndex = Math.floor(Math.random() * this.params.armCount);
        const armAngle = (Math.PI * 2 * armIndex) / this.params.armCount;
        const spiralAngle = r * this.params.armSpread;

        // Random scatter
        const scatter = (Math.random() - 0.5) * (Math.PI / 1.5) * (1 - r / this.params.galaxyRadius); // More scatter near center

        const angle = armAngle + spiralAngle + scatter;

        // Color based on distance (Blue hot outer, Yellow/Red cold inner for artistic effect, 
        // though physically often opposite in spirals, we go for aesthetic impact)
        // Actually, spirals have blue arms (young stars) and yellow cores (old stars).
        let color;
        if (r < this.params.coreRadius) {
            color = `rgba(255, 220, 150, ${Math.random() * 0.8 + 0.2})`; // Yellowish core
        } else {
            const hue = 200 + Math.random() * 60; // Blue/Purple range
            color = `hsla(${hue}, 80%, 70%, ${Math.random() * 0.8 + 0.2})`;
        }

        return {
            r: r,
            angle: angle,
            size: Math.random() * 1.5,
            speed: (this.params.rotationSpeed * 500) / (r + 10), // Keplerianish but flattened
            color: color,
            z: (Math.random() - 0.5) * 20 // Thickness
        };
    }

    draw() {
        // Clear with trail effect
        this.ctx.fillStyle = 'rgba(2, 6, 23, 0.2)'; // Dark slate trail
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.stars.forEach(star => {
            // Update position
            star.angle += star.speed;

            // Project 3D to 2D
            const x = this.centerX + Math.cos(star.angle) * star.r;
            const y = this.centerY + Math.sin(star.angle) * star.r * this.params.tilt;

            // Draw star
            this.ctx.beginPath();
            this.ctx.fillStyle = star.color;
            this.ctx.arc(x, y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw Black Hole / Core
        const gradient = this.ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, 20);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 215, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 20, 0, Math.PI * 2);
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

    // Add button listener
    const btn = document.getElementById('toggleGalaxy');
    if (btn) {
        btn.addEventListener('click', () => {
            window.galaxySim.toggle();
            btn.textContent = window.galaxySim.isRunning ? 'Simulation pausieren' : 'Simulation starten';
        });
    }
});
