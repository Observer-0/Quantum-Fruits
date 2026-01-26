/**
 * Evaporation Engine based on the Zander sigmaP Framework.
 * Ports the Python logic to JavaScript for live interactive simulations.
 */

const Physics = {
    hbar: 1.054571817e-34,
    c: 2.99792458e8,
    G: 6.67430e-11,
    kB: 1.380649e-23,
    pi: Math.PI,

    get sigmaP() { return (this.hbar * this.G) / (this.c ** 4); },
    get lP() { return Math.sqrt(this.sigmaP * this.c); },
    get tP() { return Math.sqrt(this.sigmaP / this.c); },
    get MP() { return Math.sqrt((this.hbar * this.c) / this.G); },
    get Z_int() { return (this.hbar ** 2) / this.c; },

    schwarzschildRadius(M) {
        return (2.0 * this.G * M) / (this.c ** 2);
    },

    hawkingTemperature(M) {
        if (M <= 0) return Infinity;
        return (this.hbar * (this.c ** 3)) / (8.0 * this.pi * this.G * M * this.kB);
    },

    bhEntropy(M) {
        if (M <= 0) return 0;
        const rs = this.schwarzschildRadius(M);
        const A = 4.0 * this.pi * (rs ** 2);
        return (this.kB * (this.c ** 3) * A) / (4.0 * this.hbar * this.G);
    },

    lifetimeSemiclassical(M0) {
        return (5120.0 * this.pi * (this.G ** 2) * (M0 ** 3)) / (this.hbar * (this.c ** 4));
    },

    simulateSemiclassical(M0, nsteps = 200) {
        const tau = this.lifetimeSemiclassical(M0);
        const timePoints = [];
        const massPoints = [];
        const tempPoints = [];
        const sradPoints = [];

        for (let i = 0; i <= nsteps; i++) {
            const t = (i / nsteps) * tau;
            const M = M0 * Math.pow(Math.max(1.0 - t / tau, 0.0), 1.0 / 3.0);
            const Ms = Math.max(M, 1e-99);

            timePoints.push(t);
            massPoints.push(M);
            tempPoints.push(this.hawkingTemperature(Ms));
            // S_rad as linear proxy for "losing info"
            sradPoints.push(this.bhEntropy(M0) * (t / tau));
        }

        return { t: timePoints, M: massPoints, TH: tempPoints, Srad: sradPoints, tau };
    },

    simulateQuantized(M0, nsteps = 200, Mrem = null, alpha = 4.0) {
        const M_remnant = Mrem || this.MP;
        const tau0 = this.lifetimeSemiclassical(M0);
        const dt = tau0 / nsteps;

        const t = [];
        const M = [];
        const TH = [];
        const S_rad = [];

        const T_max = this.Z_int / (this.sigmaP * this.kB);
        let currM = M0;
        let tau_eff = tau0;

        // small RK4 helper
        function rk4_step(f, y, dt) {
            const k1 = f(y);
            const k2 = f(y + 0.5 * dt * k1);
            const k3 = f(y + 0.5 * dt * k2);
            const k4 = f(y + dt * k3);
            return y + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
        }

        for (let i = 0; i <= nsteps * 1.5; i++) {
            const currT = i * dt;
            t.push(currT);
            M.push(currM);

            const Ms = Math.max(currM, 1e-99);
            TH.push(Math.min(this.hawkingTemperature(Ms), T_max));

            if (currM > M_remnant) {
                // Incorporate Non-Thermality c0 into the decay rate
                // c0 creates a "back-reaction" or "smearing" that modulates the flux
                // We use simplified c0 logic here consistent with bh_kernel_c0_scaffold.py
                const rs = this.schwarzschildRadius(currM);
                const kappa_SI = (this.c ** 4) / (4.0 * this.G * currM); // Schwarzschild kappa
                const eps_t = (this.tP * kappa_SI) / this.c;
                const eps_s = this.lP / rs;
                const c0 = (Math.PI * Math.PI / 6.0) * (eps_t * eps_t) + 0.5 * (eps_s * eps_s) * 0.8;

                // Effective flux constant: standard C multiplied by (1 + c0)
                // c0 > 0 means better information escape, slightly altering the decay profile
                const C_base = - (this.hbar * (this.c ** 4)) / (15360.0 * this.pi * (this.G ** 2));
                const C_eff = C_base * (1.0 + c0 * 1e8); // Scaled for observable sim influence

                const denomConst = alpha * (this.MP ** 2);
                const f = (m) => {
                    return C_eff / ((m ** 2) + denomConst);
                };
                const M_new = rk4_step(f, currM, dt);
                currM = Math.max(M_new, M_remnant);
                tau_eff = currT;
            } else {
                currM = M_remnant;
            }

            if (i > nsteps && currM <= M_remnant) break;
        }

        // Page-curve logic
        const S0 = this.bhEntropy(M0);
        const Srem = this.bhEntropy(M_remnant);
        const t_page = 0.5 * tau_eff;

        for (let i = 0; i < t.length; i++) {
            const ti = t[i];
            let s;
            if (ti <= t_page) {
                s = 0.5 * S0 * (ti / t_page);
            } else if (ti <= tau_eff) {
                const span = tau_eff - t_page;
                const frac = (ti - t_page) / span;
                s = (1.0 - frac) * (0.5 * S0 - Srem) + Srem;
            } else {
                s = Srem;
            }
            S_rad.push(s);
        }

        return { t, M, TH, Srad: S_rad, tau_eff, Srem };
    }
};

window.EvaporationEngine = Physics;
