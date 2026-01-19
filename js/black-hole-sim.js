class BlackHoleSimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.centerX = 0;
        this.centerY = 0;

        this.particles = [];
        this.fieldLines = [];
        this.time = 0;
        this.isRunning = true;

        this.params = {
            coreRadius: 15,
            eventHorizonRadius: 40,
            diskInnerRadius: 60,
            diskOuterRadius: 180,
            particleCount: 800,
            fieldLineCount: 12,
            rotationSpeed: 0.02,
            tilt: 0.5
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
        this.canvas.height = Math.min(rect.width * 0.6, 500);
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }

    init() {
        // Init Accretion Disk Particles
        this.particles = [];
        for (let i = 0; i < this.params.particleCount; i++) {
            const r = this.params.diskInnerRadius + Math.random() * (this.params.diskOuterRadius - this.params.diskInnerRadius);
            const angle = Math.random() * Math.PI * 2;
            const speed = (0.5 / Math.sqrt(r)) * 5; // Closer = faster
            this.particles.push({
                r,
                angle,
                speed,
                size: Math.random() * 2 + 0.5,
                color: `hsla(${15 + Math.random() * 30}, 100%, ${50 + Math.random() * 30}%, ${0.3 + Math.random() * 0.7})` // Orange/Gold
            });
        }

        // Init Magnetic Field Lines
        this.fieldLines = [];
        for (let i = 0; i < this.params.fieldLineCount; i++) {
            this.fieldLines.push({
                baseAngle: (i / this.params.fieldLineCount) * Math.PI * 2,
                phase: Math.random() * Math.PI * 2,
                amplitude: 50 + Math.random() * 50,
                length: 150 + Math.random() * 100
            });
        }
    }

    drawActionCore() {
        const pulse = Math.sin(this.time * 5) * 2;
        const radius = this.params.coreRadius + pulse;

        // Glow effect
        const gradient = this.ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, radius * 4);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(0, 242, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(0, 100, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, radius * 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Core
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawEventHorizon() {
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.params.eventHorizonRadius, 0, Math.PI * 2);
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 1)';
        this.ctx.fillStyle = '#020617';
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Subtle ring
        this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    drawAccretionDisk() {
        this.particles.forEach(p => {
            p.angle += p.speed * this.params.rotationSpeed;

            const x = this.centerX + Math.cos(p.angle) * p.r;
            const y = this.centerY + Math.sin(p.angle) * p.r * this.params.tilt;

            // Simple depth check (stars behind black hole are darker/smaller)
            const isBehind = Math.sin(p.angle) < 0;

            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, p.size * (isBehind ? 0.7 : 1), 0, Math.PI * 2);
            this.ctx.fill();

            // Add a little streak/motion blur
            this.ctx.strokeStyle = p.color;
            this.ctx.lineWidth = p.size;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x - Math.sin(p.angle) * 10, y + Math.cos(p.angle) * 10 * this.params.tilt);
            this.ctx.stroke();
        });
    }

    drawMagneticField() {
        this.ctx.lineWidth = 1.2;
        this.fieldLines.forEach((line, i) => {
            const angle = line.baseAngle + Math.sin(this.time * 0.3 + line.phase);

            // Draw multiple loops per "line" for volume
            for (let j = 0; j < 3; j++) {
                const shift = j * 0.1;
                this.ctx.strokeStyle = `hsla(185, 100%, 70%, ${0.1 + Math.sin(this.time + line.phase + shift) * 0.1})`;

                this.ctx.beginPath();
                const startX = this.centerX;
                const startY = this.centerY;

                // Loops coming out of poles
                const cp1x = this.centerX + Math.cos(angle - 1 + shift) * line.length * 1.5;
                const cp1y = this.centerY + Math.sin(angle - 1 + shift) * line.length * 1.2;

                const cp2x = this.centerX + Math.cos(angle + 1 - shift) * line.length * 1.5;
                const cp2y = this.centerY + Math.sin(angle + 1 - shift) * line.length * 1.2;

                this.ctx.moveTo(startX, startY);
                this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, startX, startY);
                this.ctx.stroke();
            }
        });
    }

    calculateSZ() {
        // Mock mass for visual purposes: 10 Solar Masses
        const mass = 10 * 1.989e30;
        const c = 2.99792458e8;
        const h = 6.62607015e-34;
        const kB = 1.380649e-23;
        const f_ref = 1e14; // Visible light ref

        // S_Z = kB * ln( mc^2 / hf )
        return kB * Math.log((mass * c * c) / (h * f_ref));
    }

    drawLabels() {
        this.ctx.font = '700 12px "Inter", sans-serif';
        this.ctx.fillStyle = 'rgba(0, 242, 255, 0.9)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(0, 242, 255, 0.8)';
        this.ctx.textAlign = 'center';

        const Sz = this.calculateSZ();

        // TOP LEFT INFO: Zander-Stats
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.fillText(`ZANDER-ENTROPY (S_Z): ${Sz.toExponential(4)} J/K`, 20, 30);
        this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
        this.ctx.font = '500 10px monospace';
        this.ctx.fillText(`STATE: MAX_BRAKING (Z_LIMIT)`, 20, 45);

        // Action Core
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = 'rgba(0, 242, 255, 0.9)';
        this.ctx.font = '700 12px "Inter", sans-serif';
        this.ctx.fillText('ACTION CORE', this.centerX, this.centerY - 25);
        this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY - 20);
        this.ctx.lineTo(this.centerX, this.centerY - 10);
        this.ctx.stroke();

        // Event Horizon
        this.ctx.textAlign = 'left';
        this.ctx.fillText('EVENT HORIZON', this.centerX + 120, this.centerY - 80);
        this.ctx.font = 'italic 10px "Inter"';
        this.ctx.fillText('Frozen Frequency Zone', this.centerX + 120, this.centerY - 65);
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX + 115, this.centerY - 85);
        this.ctx.lineTo(this.centerX + 35, this.centerY - 25);
        this.ctx.stroke();

        // Accretion Disk
        this.ctx.font = '700 12px "Inter", sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('ACCRETION DISK', this.centerX - 240, this.centerY + 100);
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX - 150, this.centerY + 105);
        this.ctx.lineTo(this.centerX - 120, this.centerY + 60);
        this.ctx.stroke();

        this.ctx.shadowBlur = 0;
    }

    draw() {
        this.ctx.fillStyle = '#020617';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.time += 0.01;

        // Visual feedback based on entropy state
        const pulse = Math.sin(this.time * 2) * 0.05;
        this.params.rotationSpeed = 0.02 + pulse;

        this.drawAccretionDisk();
        this.drawEventHorizon();
        this.drawMagneticField();
        this.drawActionCore();
        this.drawLabels();
    }

    animate() {
        if (!this.isRunning) return;
        this.draw();
        requestAnimationFrame(this.animate);
    }

    toggle() {
        this.isRunning = !this.isRunning;
        if (this.isRunning) this.animate();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.bhSim = new BlackHoleSimulation('bhCanvas');

    const btn = document.getElementById('toggleBH');
    if (btn) {
        btn.addEventListener('click', () => {
            window.bhSim.toggle();
            btn.textContent = window.bhSim.isRunning ? 'Pause Simulation' : 'Resume Simulation';
        });
    }
});
