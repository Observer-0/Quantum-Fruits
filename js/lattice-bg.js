/**
 * js/lattice-bg.js
 * ------------------------
 * Implementation of the "The Final Axiom" Lattice.
 * Animates a subtle grid of sigma_P points that "breath" with the universe.
 */

class LatticeBackground {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.opacity = '0.08'; // Very subtle
        document.body.prepend(this.canvas);

        this.points = [];
        this.gridSize = 60;
        this.resize();
        this.init();

        window.addEventListener('resize', () => this.resize());
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        this.points = [];
        for (let x = 0; x < this.canvas.width; x += this.gridSize) {
            for (let y = 0; y < this.canvas.height; y += this.gridSize) {
                this.points.push({
                    x: x,
                    y: y,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#00f2ff';

        const time = Date.now() * 0.001;

        this.points.forEach(p => {
            // "Breath" cycle - TSF Sync
            const breathing = Math.sin(time + p.phase) * 2;
            const size = 1 + breathing;

            this.ctx.beginPath();
            this.ctx.arc(p.x + breathing, p.y + breathing, size, 0, Math.PI * 2);
            this.ctx.fill();

            // Subtle lines for the "Code" feel
            if (p.x % 180 === 0 && p.y % 180 === 0) {
                this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.1)';
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(p.x + 20, p.y + 20);
                this.ctx.stroke();
            }
        });

        requestAnimationFrame(this.animate);
    }
}

// Secret Code Peek Logic
function initCodePeek() {
    const tagline = document.querySelector('.tagline');
    if (!tagline) return;

    tagline.style.cursor = 'help';
    tagline.title = "Explore Source Code";

    tagline.addEventListener('click', () => {
        document.body.classList.add('source-peek');
        setTimeout(() => {
            document.body.classList.remove('source-peek');
        }, 3000);
    });
}

// Real-time Status Footer
function initStatusMonitor() {
    const footer = document.createElement('footer');
    footer.style.position = 'fixed';
    footer.style.bottom = '10px';
    footer.style.right = '20px';
    footer.style.fontSize = '0.7rem';
    footer.style.fontFamily = 'monospace';
    footer.style.color = 'rgba(0, 242, 255, 0.4)';
    footer.style.textAlign = 'right';
    footer.style.pointerEvents = 'none';
    footer.id = 'cosmic-status';

    document.body.appendChild(footer);

    setInterval(() => {
        const ticks = Math.floor(performance.now() * 1000);
        footer.innerHTML = `
            LATTICE SYNC: OK <br>
            GEOMETRY [σₚ]: ${(1e-123).toExponential(0)} <br>
            LOCAL_TICKS: ${ticks.toLocaleString()}
        `;
    }, 100);
}

document.addEventListener('DOMContentLoaded', () => {
    new LatticeBackground();
    initCodePeek();
    initStatusMonitor();
});
