class MirrorThesisSimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.nodes = [];
        this.paths = [];
        this.numNodes = 80;
        this.time = 0;
        this.observedTimeline = [];

        this.params = {
            unitarity: 1.0,
            negationRate: 0.1,
            resolution: 40
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
        this.canvas.height = 400;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    init() {
        this.nodes = [];
        for (let i = 0; i < this.numNodes; i++) {
            this.nodes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                p: Math.random(), // Probability amplitude
                isObserved: false
            });
        }
    }

    draw() {
        this.time += 0.01;
        this.ctx.fillStyle = 'rgba(2, 6, 23, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw the background "Information Sea" (Non-realities)
        this.ctx.lineWidth = 0.5;
        this.nodes.forEach((node, i) => {
            node.x += node.vx;
            node.y += node.vy;

            if (node.x < 0 || node.x > this.canvas.width) node.vx *= -1;
            if (node.y < 0 || node.y > this.canvas.height) node.vy *= -1;

            // Draw noise / potential paths
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(251, 191, 36, ${node.p * 0.1})`;
            this.ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
            this.ctx.stroke();

            // Negation Principle: Selection of paths
            const next = this.nodes[(i + 1) % this.numNodes];
            const dist = Math.hypot(node.x - next.x, node.y - next.y);

            if (dist < 150) {
                const alpha = (1 - dist / 150) * 0.2;
                this.ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.moveTo(node.x, node.y);
                this.ctx.lineTo(next.x, next.y);
                this.ctx.stroke();
            }
        });

        // Draw the "Observed Reality" (The Mirror)
        const timelineX = (this.time * 50) % this.canvas.width;
        this.observedTimeline.push({
            x: timelineX,
            y: this.centerY + Math.sin(this.time * 2) * 50 + (Math.random() - 0.5) * 10
        });

        if (this.observedTimeline.length > 200) this.observedTimeline.shift();

        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#fbbf24';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#fbbf24';
        this.ctx.beginPath();
        this.observedTimeline.forEach((pt, i) => {
            if (i === 0) this.ctx.moveTo(pt.x, pt.y);
            else {
                // Handle wrap around
                if (Math.abs(pt.x - this.observedTimeline[i - 1].x) < 50) {
                    this.ctx.lineTo(pt.x, pt.y);
                } else {
                    this.ctx.moveTo(pt.x, pt.y);
                }
            }
        });
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // Draw the "Mirror" label
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.font = '700 12px "JetBrains Mono"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("OBSERVED TIMELINE (S=1)", timelineX, this.centerY + 80);
    }

    animate() {
        this.draw();
        requestAnimationFrame(this.animate);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MirrorThesisSimulation('mirrorCanvas');
});
