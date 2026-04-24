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

        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 3000);
        this.camera.position.set(0, 0, 0.1);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableZoom = false;
        this.controls.enablePan = false;
        this.controls.rotateSpeed = 0.4;
    }

    initObjects() {
        // 1. Galaxies (Glow Points)
        const galaxyCount = 3000;
        const positions = new Float32Array(galaxyCount * 3);
        const colors = new Float32Array(galaxyCount * 3);
        const sizes = new Float32Array(galaxyCount);
        const comovingPositions = new Float32Array(galaxyCount * 3);
        const range = 800;

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

            // Variation in color based on "curvature" (distance from center)
            const dist = Math.sqrt(x * x + y * y + z * z);
            const r = 0.5 + 0.5 * Math.sin(dist * 0.05);
            const g = 0.7 + 0.3 * Math.cos(dist * 0.03);
            const b = 1.0;

            colors[i * 3] = r;
            colors[i * 3 + 1] = g;
            colors[i * 3 + 2] = b;

            sizes[i] = Math.random() * 2.0 + 0.5;
        }

        const galaxyGeo = new THREE.BufferGeometry();
        galaxyGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        galaxyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        galaxyGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        this.comovingPositions = comovingPositions;

        const galaxyMat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                a_t: { value: 1.0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                uniform float a_t;
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    // Subtle breathing effect
                    pos += 0.1 * sin(time * 0.5 + position.x) * normalize(position);
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0/a_t);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    float r = distance(gl_PointCoord, vec2(0.5));
                    if (r > 0.5) discard;
                    float glow = exp(-r * 4.0);
                    gl_FragColor = vec4(vColor, glow);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.galaxies = new THREE.Points(galaxyGeo, galaxyMat);
        this.scene.add(this.galaxies);

        // 2. CMB Sphere (Improved Shader)
        const cmbGeo = new THREE.SphereGeometry(150, 128, 128);

        this.cmbMaterial = new THREE.ShaderMaterial({
            uniforms: {
                beta: { value: this.beta },
                dipoleOn: { value: this.showDipole ? 1.0 : 0.0 },
                vDir: { value: new THREE.Vector3(0, 0, 1).normalize() },
                time: { value: 0.0 },
                ricciMode: { value: 0.0 } // New mode for Ricci visualization
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vWorldPosition;
                varying vec2 vUv;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float beta;
                uniform float dipoleOn;
                uniform vec3 vDir;
                uniform float time;
                uniform float ricciMode;
                varying vec3 vNormal;
                varying vec3 vWorldPosition;
                varying vec2 vUv;

                // Better Noise (FBM)
                float hash(vec3 p) {
                    p = fract(p * 0.3183099 + 0.1);
                    p *= 17.0;
                    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
                }

                float noise(vec3 x) {
                    vec3 i = floor(x);
                    vec3 f = fract(x);
                    f = f*f*(3.0-2.0*f);
                    return mix(mix(mix(hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)),f.x),
                                   mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)),f.x),f.y),
                               mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)),f.x),
                                   mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)),f.x),f.y),f.z);
                }

                float fbm(vec3 p) {
                    float v = 0.0;
                    float a = 0.5;
                    for (int i = 0; i < 4; i++) {
                        v += a * noise(p);
                        p *= 2.0;
                        a *= 0.5;
                    }
                    return v;
                }

                void main() {
                    vec3 normPos = normalize(vWorldPosition);
                    float mu = dot(normPos, vDir);
                    
                    float T = 1.0 + beta * mu * dipoleOn;
                    
                    // Base Colors
                    vec3 cool = vec3(0.05, 0.2, 0.5); 
                    vec3 hot = vec3(0.8, 0.2, 0.1);
                    vec3 neutral = vec3(0.1, 0.15, 0.3);

                    vec3 color;
                    if (ricciMode > 0.5) {
                        // Ricci Visualization: Local Curvature Spikes
                        float r = fbm(normPos * 20.0 + time * 0.2);
                        color = mix(vec3(0, 0.1, 0.2), vec3(0, 0.8, 1.0), pow(r, 4.0));
                        color += 0.1; // Baseline
                    } else {
                        // Standard CMB with Dipole
                        if (mu > 0.0) {
                            color = mix(neutral, hot, clamp(mu * beta * 80.0 * dipoleOn, 0.0, 1.0));
                        } else {
                            color = mix(neutral, cool, clamp(-mu * beta * 80.0 * dipoleOn, 0.0, 1.0));
                        }
                        
                        // Add CMB Micro-fluctuations
                        float n = fbm(normPos * 100.0);
                        color = mix(color, color * 1.5, n * 0.15);
                    }

                    // Edge Fade
                    float edge = 1.0 - max(0.0, dot(vNormal, vec3(0,0,1)));
                    
                    gl_FragColor = vec4(color, 0.6 + 0.2 * edge);
                }
            `,
            side: THREE.BackSide,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        this.cmbSphere = new THREE.Mesh(cmbGeo, this.cmbMaterial);
        this.scene.add(this.cmbSphere);

        // 3. Observer (Sun-like glow)
        const obsGeo = new THREE.SphereGeometry(0.3, 32, 32);
        const obsMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.9
        });
        this.observer = new THREE.Mesh(obsGeo, obsMat);
        this.scene.add(this.observer);
    }

    setupControls() {
        const sliderA = document.getElementById('slider-a');
        const sliderBeta = document.getElementById('slider-beta');
        const toggleExp = document.getElementById('toggle-expansion');
        const toggleDipole = document.getElementById('toggle-dipole');
        const toggleRicci = document.getElementById('toggle-ricci');

        if (sliderA) {
            sliderA.addEventListener('input', (e) => {
                this.a_t = parseFloat(e.target.value);
                this.galaxies.material.uniforms.a_t.value = this.a_t;
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

        if (toggleRicci) {
            toggleRicci.addEventListener('change', (e) => {
                this.cmbMaterial.uniforms.ricciMode.value = e.target.checked ? 1.0 : 0.0;
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

        // Update CMB Radius (Physical Horizon)
        const R_phys = (this.c * (this.t_now - this.t_dec)) / this.a_t;
        this.cmbSphere.scale.set(R_phys, R_phys, R_phys);

        // Keep camera centered but slightly offset for OrbitControls to not freak out
        // We handle rotation via OrbitControls on a tiny radius
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

        const time = performance.now() * 0.001;
        this.cmbMaterial.uniforms.time.value = time;
        this.galaxies.material.uniforms.time.value = time;

        this.updatePhysics();
        this.controls.update();

        // Update Invariant Display
        const sDisplay = document.getElementById('label-entropy');
        if (sDisplay) {
            const jitter = (Math.random() - 0.5) * 0.0001;
            sDisplay.textContent = (1.0 + jitter).toFixed(4);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const sim = new CMBSimulation('canvas-container');
    window.cmbSim = sim;
});
