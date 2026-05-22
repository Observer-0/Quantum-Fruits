/**
 * BH Evaporation Physics Engine
 * JavaScript port of py/physics_engine.py (Zander 2025 sigma_P framework)
 */

const PHYS = (() => {
    const HBAR    = 1.054571817e-34;
    const C       = 2.99792458e8;
    const G       = 6.67430e-11;
    const KB      = 1.380649e-23;
    const PI      = Math.PI;
    const SIGMA_P = HBAR * G / Math.pow(C, 4);
    const LP      = Math.sqrt(SIGMA_P * C);
    const TP      = Math.sqrt(SIGMA_P / C);
    const MP      = Math.sqrt(HBAR * C / G);
    const T_MAX   = HBAR / (KB * TP);   // Planck temperature cap

    function linspace(a, b, n) {
        const arr = new Array(n);
        const step = (b - a) / (n - 1);
        for (let i = 0; i < n; i++) arr[i] = a + i * step;
        return arr;
    }

    function schwarzschild_radius(M) {
        return 2 * G * Math.max(Math.abs(M), 1e-99) / (C * C);
    }

    function hawking_temperature(M) {
        return HBAR * Math.pow(C, 3) / (8 * PI * G * Math.max(Math.abs(M), 1e-99) * KB);
    }

    function bh_entropy(M) {
        const rs = schwarzschild_radius(M);
        return KB * Math.pow(C, 3) * 4 * PI * rs * rs / (4 * HBAR * G);
    }

    function lifetime_semiclassical(M0) {
        const M = Math.max(Math.abs(M0), 1e-99);
        return 5120 * PI * G * G * Math.pow(M, 3) / (HBAR * Math.pow(C, 4));
    }

    function evaporate_semiclassical(M0, nsteps = 1200) {
        const M0s = Math.max(Math.abs(M0), 1e-99);
        const tau = lifetime_semiclassical(M0s);
        const t   = linspace(0, tau, nsteps);
        const M   = t.map(ti => M0s * Math.pow(Math.max(1 - ti / tau, 0), 1 / 3));
        const TH  = M.map(m => Math.min(hawking_temperature(Math.max(m, 1e-99)), T_MAX));
        const S   = M.map(m => bh_entropy(Math.max(m, 1e-99)));
        const S0  = bh_entropy(M0s);
        const S_rad = t.map(ti => S0 * ti / tau);
        return { t, M, TH, S, S_rad, tau };
    }

    function evaporate_sigmaP_quantized(M0, nsteps = 1500, Mrem = MP, alpha = 4.0, gamma = 1.0) {
        const M0s       = Math.max(Math.abs(M0), 1e-99);
        const Mrem_s    = Math.max(Math.abs(Mrem), 1e-99);
        const alpha_eff = Math.max(alpha, 0);
        const gamma_eff = Math.max(gamma, 0);
        const tau0      = lifetime_semiclassical(M0s);
        const t         = linspace(0, tau0, nsteps);
        const dt        = t[1] - t[0];
        const K0        = gamma_eff * HBAR * Math.pow(C, 4) / (15360 * PI * G * G);

        const M_arr  = [];
        const TH_arr = [];
        const S_arr  = [];
        let M_curr   = M0s;
        let idx_rem  = null;

        for (let i = 0; i < nsteps; i++) {
            M_arr.push(M_curr);
            S_arr.push(bh_entropy(M_curr));
            TH_arr.push(Math.min(hawking_temperature(M_curr), T_MAX));

            if (M_curr > Mrem_s) {
                const denom  = M_curr * M_curr + alpha_eff * MP * MP;
                const M_next = M_curr - K0 / denom * dt;
                if (M_next <= Mrem_s) {
                    M_curr = Mrem_s;
                    if (idx_rem === null) idx_rem = i;
                } else {
                    M_curr = M_next;
                }
            } else {
                M_curr = Mrem_s;
                if (idx_rem === null) idx_rem = i;
            }
        }

        if (idx_rem === null) idx_rem = nsteps - 1;
        const tau_eff = t[idx_rem];
        const S0      = bh_entropy(M0s);
        const Srem    = bh_entropy(Mrem_s);
        const t_page  = Math.max(0.5 * tau_eff, 1e-99);

        const S_rad = [];
        for (let i = 0; i < nsteps; i++) {
            const ti = t[i];
            let s;
            if (ti <= t_page) {
                s = 0.5 * S0 * (ti / t_page);
            } else {
                const span = Math.max(tau_eff - t_page, 1e-99);
                const frac = Math.min((ti - t_page) / span, 1);
                s = (1 - frac) * (0.5 * S0 - Srem) + Srem;
            }
            if (ti >= tau_eff) s = Srem;
            S_rad.push(s);
        }

        const cut = idx_rem + 1;
        return {
            t:        t.slice(0, cut),
            M:        M_arr.slice(0, cut),
            TH:       TH_arr.slice(0, cut),
            S:        S_arr.slice(0, cut),
            S_rad:    S_rad.slice(0, cut),
            tau_eff,
            tau0,
            Srem,
        };
    }

    function evaporate_qubit_model(n_steps = 120) {
        const steps = [];
        const s_rad = [];
        for (let i = 0; i < n_steps; i++) {
            const x     = i / (n_steps - 1);
            const theta = x <= 0.5 ? 0.5 * PI * x : 0.5 * PI * (1 - x);
            const p1    = Math.cos(theta) ** 2;
            const p2    = Math.sin(theta) ** 2;
            const eps   = 1e-15;
            let s       = 0;
            if (p1 > eps) s -= p1 * Math.log2(p1);
            if (p2 > eps) s -= p2 * Math.log2(p2);
            steps.push(x);
            s_rad.push(s);
        }
        return { steps, s_rad };
    }

    return {
        HBAR, C, G, KB, PI,
        SIGMA_P, LP, TP, MP, T_MAX,
        schwarzschild_radius,
        hawking_temperature,
        bh_entropy,
        lifetime_semiclassical,
        evaporate_semiclassical,
        evaporate_sigmaP_quantized,
        evaporate_qubit_model,
    };
})();
