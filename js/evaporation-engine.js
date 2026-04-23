/**
 * Evaporation Engine based on the sigma_P framework.
 * Keeps JS simulation logic aligned with current Python kernels.
 */

const EvaporationPhysics = {
    hbar: 1.054_571_817e-34,
    c: 2.997_924_58e8,
    G: 6.674_30e-11,
    kB: 1.380_649e-23,
    pi: Math.PI,

    get sigmaP() { return (this.hbar * this.G) / (this.c ** 4); },
    get lP() { return Math.sqrt(this.sigmaP * this.c); },
    get tP() { return Math.sqrt(this.sigmaP / this.c); },
    get MP() { return Math.sqrt((this.hbar * this.c) / this.G); },
    get Z_int() { return (this.hbar ** 2) / this.c; },
    get year() { return 365.25 * 24 * 3600; },

    clampPositive(v, floor = 1e-99) {
        if (!Number.isFinite(v)) return floor;
        return Math.max(Math.abs(v), floor);
    },

    linspace(start, end, count) {
        const n = Math.max(2, Math.floor(count));
        const values = new Array(n);
        const span = end - start;
        for (let i = 0; i < n; i += 1) {
            values[i] = start + (span * i) / (n - 1);
        }
        return values;
    },

    schwarzschildRadius(M) {
        const Ms = this.clampPositive(M);
        return (2.0 * this.G * Ms) / (this.c ** 2);
    },

    kretschmannScalar(M, r) {
        const Ms = this.clampPositive(M);
        const rs = this.clampPositive(r);
        return (48.0 * this.G ** 2 * Ms ** 2) / ((this.c ** 4) * (rs ** 6));
    },

    planckCurvatureRadius(M) {
        const Ms = this.clampPositive(M);
        const num = 48.0 * this.G ** 2 * Ms ** 2 * this.lP ** 4;
        return (num / this.c ** 4) ** (1.0 / 6.0);
    },

    singularityDiagnostics(M) {
        const rs = this.schwarzschildRadius(M);
        const rPl = this.planckCurvatureRadius(M);
        const ratio = rs > 0.0 ? rPl / rs : Infinity;
        return { rs, rPl, ratio };
    },

    hawkingTemperature(M) {
        const Ms = this.clampPositive(M);
        return (this.hbar * this.c ** 3) / (8.0 * this.pi * this.G * Ms * this.kB);
    },

    bhEntropy(M) {
        const Ms = this.clampPositive(M);
        const rs = this.schwarzschildRadius(Ms);
        const area = 4.0 * this.pi * (rs ** 2);
        return (this.kB * this.c ** 3 * area) / (4.0 * this.hbar * this.G);
    },

    lifetimeSemiclassical(M0) {
        const M0s = this.clampPositive(M0);
        return (5120.0 * this.pi * this.G ** 2 * M0s ** 3) / (this.hbar * this.c ** 4);
    },

    simulateSemiclassical(M0, nsteps = 2000) {
        const M0s = this.clampPositive(M0);
        const tau = this.lifetimeSemiclassical(M0s);
        const t = this.linspace(0.0, tau, nsteps);
        const M = new Array(t.length);
        const TH = new Array(t.length);
        const S = new Array(t.length);
        const Srad = new Array(t.length);

        const S0 = this.bhEntropy(M0s);
        const tauSafe = Math.max(tau, 1e-99);

        for (let i = 0; i < t.length; i += 1) {
            const frac = Math.max(1.0 - t[i] / tauSafe, 0.0);
            const Mi = M0s * Math.pow(frac, 1.0 / 3.0);
            const Ms = this.clampPositive(Mi);

            M[i] = Mi;
            TH[i] = this.hawkingTemperature(Ms);
            S[i] = this.bhEntropy(Ms);
            Srad[i] = S0 * (t[i] / tauSafe);
        }

        return { t, M, TH, S, Srad, tau };
    },

    simulateQuantized(M0, nsteps = 2000, Mrem = null, alpha = 4.0, gamma = 1.0) {
        const M0s = this.clampPositive(M0);
        const MremEff = Math.max(
            this.clampPositive(Mrem == null ? this.MP : Number(Mrem)),
            1e-99
        );
        const alphaEff = Number.isFinite(alpha) ? alpha : 4.0;
        const gammaEff = Math.max(Number.isFinite(gamma) ? gamma : 1.0, 0.0);

        const tau0 = this.lifetimeSemiclassical(M0s);
        const t = this.linspace(0.0, tau0, nsteps);
        const dt = t.length > 1 ? t[1] - t[0] : tau0;

        const M = new Array(t.length);
        const TH = new Array(t.length);
        const S = new Array(t.length);
        const Srad = new Array(t.length);

        const T_max = this.hbar / (this.kB * this.tP);
        const K0 = gammaEff * this.hbar * this.c ** 4 / (15360.0 * this.pi * this.G ** 2);

        let currM = Math.max(M0s, MremEff);

        for (let i = 0; i < t.length; i += 1) {
            const Ms = this.clampPositive(currM);
            M[i] = currM;
            S[i] = this.bhEntropy(Ms);
            TH[i] = Math.min(this.hawkingTemperature(Ms), T_max);

            if (currM > MremEff) {
                const denom = currM ** 2 + alphaEff * this.MP ** 2;
                const dMdt = -K0 / Math.max(denom, 1e-99);
                currM = Math.max(currM + dMdt * dt, MremEff);
            } else {
                currM = MremEff;
            }
        }

        let idxRem = t.length - 1;
        for (let i = 0; i < M.length; i += 1) {
            if (M[i] <= (MremEff + 1e-40)) {
                idxRem = i;
                break;
            }
        }
        const tau_eff = t[idxRem];

        const S0 = this.bhEntropy(M0s);
        const Srem = this.bhEntropy(MremEff);
        const tPage = Math.max(0.5 * tau_eff, 1e-99);

        for (let i = 0; i < t.length; i += 1) {
            const ti = t[i];
            let s;

            if (ti <= tPage) {
                s = 0.5 * S0 * (ti / tPage);
            } else {
                const span = Math.max(tau_eff - tPage, 1e-99);
                const frac = (ti - tPage) / span;
                s = (1.0 - frac) * (0.5 * S0 - Srem) + Srem;
            }

            if (ti >= tau_eff) s = Srem;
            Srad[i] = s;
        }

        const cut = idxRem + 1;

        return {
            t: t.slice(0, cut),
            M: M.slice(0, cut),
            TH: TH.slice(0, cut),
            S: S.slice(0, cut),
            Srad: Srad.slice(0, cut),
            tau_eff,
            Srem,
            T_max,
            K0
        };
    }
};

window.EvaporationEngine = EvaporationPhysics;
