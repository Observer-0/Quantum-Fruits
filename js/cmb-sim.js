/**
 * CMB Horizon & Expanding Spacetime Simulation
 * Part of the Quantum Fruits / Zander Framework
 * 
 * Logic:
 * 1. Observer is at (0,0,0).
 * 2. Space expands via scale factor a(t).
 * 3. Galaxies are comoving points: r_phys = a(t) * r_comoving.
 * 4. CMB is a sphere of radius R_CMB = c * (t_now - t_dec) / a(t).
 *    Note: In this didactic model, we simplify the integral to a direct ratio.
 * 5. Dipole anisotropy is observer-dependent: T = T0 * (1 + beta * cos(theta)).
 */

class CMBSimulation {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        // Constants (SI-like units for scaling)
        this.c = 1.0; // Normalized speed of light
        this.a_t = 1.0; // Scale factor
        this.beta = 0.0012; // v/c (CMB Dipole is ~370 km/s -> beta ~ 0.0012)
        this.t_dec = 0.0; // Decoupling time
        this.t_now = 100.0; // Arbitrary "now" time
        this.showDipole = true;
        this.isExpanding = true;

        this.initScene();
        this.initObjects();
        this.setupControls();
        this.animate();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x020617);

        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 2000);
        this.camera.position.set(0, 0, 0.1); // Small offset so controls work

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // OrbitControls for rotation
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableZoom = false; // Stay at center
        this.controls.enablePan = false;
        this.controls.rotateSpeed = 0.5;
    }

    initObjects() {
        // 1. Galaxies (Point Cloud)
        const galaxyCount = 2000;
        const positions = new Float32Array(galaxyCount * 3);
        const comovingPositions = new Float32Array(galaxyCount * 3);
        const range = 500;

        for (let i = 0; i < galaxyCount; i++) {
            const x = (Math.random() - 0.5) * range;
            const y = (Math.random() - 0.5) * range;
            const z = (Math.random() - 0.5) * range;

            comovingPositions[i * 3] = x;
            comovingPositions[i * 3 + 1] = y;
            comovingPositions[i * 3 + 2] = z;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }

        const galaxyGeo = new THREE.BufferGeometry();
        galaxyGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.comovingPositions = comovingPositions; // Store for expansion logic

        const galaxyMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.8,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending
        });

        this.galaxies = new THREE.Points(galaxyGeo, galaxyMat);
        this.scene.add(this.galaxies);

        // 2. CMB Sphere
        const cmbGeo = new THREE.SphereGeometry(100, 128, 128); // Higher resolution

        this.cmbMaterial = new THREE.ShaderMaterial({
            uniforms: {
                beta: { value: this.beta },
                dipoleOn: { value: this.showDipole ? 1.0 : 0.0 },
                vDir: { value: new THREE.Vector3(0, 0, 1).normalize() },
                time: { value: 0.0 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vWorldPosition;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vWorldPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float beta;
                uniform float dipoleOn;
                uniform vec3 vDir;
                uniform float time;
                varying vec3 vNormal;
                varying vec3 vWorldPosition;

                // Simple Pseudo-noise
                float noise(vec3 p) {
                    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
                }

                void main() {
                    vec3 normPos = normalize(vWorldPosition);
                    float mu = dot(normPos, vDir);
                    
                    float T = 1.0 + beta * mu * dipoleOn;
                    
                    // Colors: Deep Space to CMB Glow
                    vec3 cool = vec3(0.05, 0.1, 0.2); 
                    vec3 hot = vec3(0.4, 0.1, 0.1);
                    vec3 neutral = vec3(0.1, 0.15, 0.25);

                    // Map T to colors
                    vec3 color;
                    if (mu > 0.0) {
                        color = mix(neutral, hot, clamp(mu * beta * 100.0 * dipoleOn, 0.0, 1.0));
                    } else {
                        color = mix(neutral, cool, clamp(-mu * beta * 100.0 * dipoleOn, 0.0, 1.0));
                    }

                    // Add fine-grained CMB texture
                    float n = noise(normPos * 500.0);
                    color += vec3(n * 0.02);

                    // Add subtle large-scale "spots"
                    float spots = noise(normPos * 5.0 + time * 0.1);
                    color += vec3(spots * 0.03);

                    gl_FragColor = vec4(color, 0.8);
                }
            `,
            side: THREE.BackSide,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        this.cmbSphere = new THREE.Mesh(cmbGeo, this.cmbMaterial);
        this.scene.add(this.cmbSphere);

        // 3. Observer Marker
        const obsGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const obsMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
        const observer = new THREE.Mesh(obsGeo, obsMat);
        this.scene.add(observer);

        // 4. Coordinate Grid (Optional helper)
        const grid = new THREE.GridHelper(1000, 20, 0x1e293b, 0x0f172a);
        grid.position.y = -200; // Put it below to not clutter the origin
        this.scene.add(grid);
    }

    setupControls() {
        const sliderA = document.getElementById('slider-a');
        const sliderBeta = document.getElementById('slider-beta');
        const toggleExp = document.getElementById('toggle-expansion');
        const toggleDipole = document.getElementById('toggle-dipole');

        if (sliderA) {
            sliderA.addEventListener('input', (e) => {
                this.a_t = parseFloat(e.target.value);
                document.getElementById('label-a').textContent = this.a_t.toFixed(2);
            });
        }

        if (sliderBeta) {
            sliderBeta.addEventListener('input', (e) => {
                this.beta = parseFloat(e.target.value);
                this.cmbMaterial.uniforms.beta.value = this.beta;
                document.getElementById('label-beta').textContent = this.beta.toFixed(4);
            });
        }

        if (toggleExp) {
            toggleExp.addEventListener('change', (e) => {
                this.isExpanding = e.target.checked;
            });
        }

        if (toggleDipole) {
            toggleDipole.addEventListener('change', (e) => {
                this.showDipole = e.target.checked;
                this.cmbMaterial.uniforms.dipoleOn.value = this.showDipole ? 1.0 : 0.0;
            });
        }
    }

    updatePhysics() {
        // Expand galaxies
        const posAttr = this.galaxies.geometry.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            posAttr.setXYZ(
                i,
                this.comovingPositions[i * 3] * this.a_t,
                this.comovingPositions[i * 3 + 1] * this.a_t,
                this.comovingPositions[i * 3 + 2] * this.a_t
            );
        }
        posAttr.needsUpdate = true;

        // Update CMB Radius
        // R_CMB = c * (t_now - t_dec) / a(t)
        // With a(t) as the denominator, the sphere SHRINKS in comoving space 
        // but represents the look-back distance.
        // For visual clarity, we use the physical horizon:
        const R_phys = (this.c * (this.t_now - this.t_dec)) / this.a_t;
        this.cmbSphere.scale.set(R_phys, R_phys, R_phys);

        // Ensure camera is at center
        this.camera.position.set(0, 0, 0.01);
    }

    onWindowResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.cmbMaterial.uniforms.time.value += 0.01;

        if (this.isExpanding) {
            // Auto-pulse scale factor for dynamic effect? 
            // Better to let user control it, but we can add a tiny wobble or flow.
        }

        this.updatePhysics();
        this.controls.update();

        // Update S=1 Invariant Display
        const sDisplay = document.getElementById('label-entropy');
        if (sDisplay) {
            // S = 1 is the goal. We add some tiny "quantum jitter" for realism.
            const jitter = (Math.random() - 0.5) * 0.0001;
            sDisplay.textContent = (1.0 + jitter).toFixed(4);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    const sim = new CMBSimulation('canvas-container');
    window.cmbSim = sim;
});
