class SigmaBackground {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);

        this.points = [];
        this.spacing = 50;
        this.mouse = { x: -1000, y: -1000 };

        this.init();
        this.resize();
        this.animate();

        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }

    init() {
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.background = '#020617';
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.points = [];
        for (let x = 0; x < this.canvas.width + this.spacing; x += this.spacing) {
            for (let y = 0; y < this.canvas.height + this.spacing; y += this.spacing) {
                this.points.push({ x, y, ox: x, oy: y });
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
        this.ctx.lineWidth = 1;

        this.points.forEach(p => {
            const dx = this.mouse.x - p.ox;
            const dy = this.mouse.y - p.oy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const maxDist = 200;
            if (dist < maxDist) {
                const angle = Math.atan2(dy, dx);
                const force = (maxDist - dist) / maxDist;
                p.x = p.ox - Math.cos(angle) * force * 20;
                p.y = p.oy - Math.sin(angle) * force * 20;
            } else {
                p.x += (p.ox - p.x) * 0.1;
                p.y += (p.oy - p.y) * 0.1;
            }

            // Draw small "quantum" dot
            this.ctx.fillStyle = dist < 200 ? `rgba(56, 189, 248, ${0.1 + (1 - dist / 200) * 0.2})` : 'rgba(56, 189, 248, 0.05)';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Subtle lines connecting dots
        this.ctx.beginPath();
        for (let x = 0; x < this.canvas.width + this.spacing; x += this.spacing) {
            // This is a bit expensive for every frame, simplified grid logic
        }

        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SigmaBackground();
});
