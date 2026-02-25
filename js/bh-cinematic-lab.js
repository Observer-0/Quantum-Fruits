(function () {
    "use strict";

    const engine = window.EvaporationEngine;
    const dom = {
        canvas: document.getElementById("bhCinemaCanvas"),
        massPreset: document.getElementById("massPreset"),
        customMassField: document.getElementById("customMassField"),
        customMassInput: document.getElementById("customMassInput"),
        cyclesInput: document.getElementById("cyclesInput"),
        cycleStartFactorInput: document.getElementById("cycleStartFactorInput"),
        remnantFactorInput: document.getElementById("remnantFactorInput"),
        alphaInput: document.getElementById("alphaInput"),
        gammaInput: document.getElementById("gammaInput"),
        evapStepsInput: document.getElementById("evapStepsInput"),
        qmStepsInput: document.getElementById("qmStepsInput"),
        playbackSpeedInput: document.getElementById("playbackSpeedInput"),
        lensingInput: document.getElementById("lensingInput"),
        turbulenceInput: document.getElementById("turbulenceInput"),
        autoRebuildToggle: document.getElementById("autoRebuildToggle"),
        playPauseBtn: document.getElementById("playPauseBtn"),
        stepBtn: document.getElementById("stepBtn"),
        rebuildBtn: document.getElementById("rebuildBtn"),
        saveFrameBtn: document.getElementById("saveFrameBtn"),
        jsonImportInput: document.getElementById("jsonImportInput"),
        loadJsonBtn: document.getElementById("loadJsonBtn"),
        useBrowserModelBtn: document.getElementById("useBrowserModelBtn"),
        dataSourceStatus: document.getElementById("dataSourceStatus"),
        timelineSlider: document.getElementById("timelineSlider"),
        timelineReadout: document.getElementById("timelineReadout"),
        storyCaption: document.getElementById("storyCaption"),
        hudCycle: document.getElementById("hudCycle"),
        hudPhase: document.getElementById("hudPhase"),
        hudFrame: document.getElementById("hudFrame"),
        hudMass: document.getElementById("hudMass"),
        hudMassSub: document.getElementById("hudMassSub"),
        hudTemp: document.getElementById("hudTemp"),
        hudTempSub: document.getElementById("hudTempSub"),
        hudRs: document.getElementById("hudRs"),
        hudSigmaEntropy: document.getElementById("hudSigmaEntropy"),
        hudQmEntropy: document.getElementById("hudQmEntropy"),
        hudTau: document.getElementById("hudTau"),
        cyclesVal: document.getElementById("cyclesVal"),
        cycleStartFactorVal: document.getElementById("cycleStartFactorVal"),
        remnantFactorVal: document.getElementById("remnantFactorVal"),
        alphaVal: document.getElementById("alphaVal"),
        gammaVal: document.getElementById("gammaVal"),
        evapStepsVal: document.getElementById("evapStepsVal"),
        qmStepsVal: document.getElementById("qmStepsVal"),
        playbackSpeedVal: document.getElementById("playbackSpeedVal"),
        lensingVal: document.getElementById("lensingVal"),
        turbulenceVal: document.getElementById("turbulenceVal")
    };

    if (!engine || !dom.canvas) return;

    const ctx = dom.canvas.getContext("2d");
    if (!ctx) return;

    const PRESET_MASSES = {
        pbh: 1e12,
        stellar: 10.0 * 1.98847e30,
        supermassive: 1e6 * 1.98847e30
    };

    const PRESET_LABELS = {
        pbh: "Primordial",
        stellar: "Stellar",
        supermassive: "Supermassive",
        custom: "Custom"
    };

    const state = {
        width: 0,
        height: 0,
        dpr: 1,
        time: 0,
        playing: true,
        rafId: 0,
        lastTs: 0,
        playheadFloat: 0,
        frameIndex: 0,
        autoRebuildTimer: 0,
        story: null,
        sourceMode: "browser",
        importedPayload: null,
        importedFileName: "",
        stars: [],
        disk: []
    };

    function clamp(v, min, max) {
        return Math.min(max, Math.max(min, v));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function smoothstep(edge0, edge1, x) {
        const t = clamp((x - edge0) / Math.max(edge1 - edge0, 1e-9), 0, 1);
        return t * t * (3 - 2 * t);
    }

    function easeInOutCubic(t) {
        const x = clamp(t, 0, 1);
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    function parseFinite(value, fallback) {
        const parsed = Number.parseFloat(String(value).replace(",", "."));
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function parsePositive(value, fallback) {
        const parsed = parseFinite(value, fallback);
        return parsed > 0 ? parsed : fallback;
    }

    function toFiniteArray(value) {
        if (!Array.isArray(value)) return [];
        const out = [];
        for (let i = 0; i < value.length; i += 1) {
            const n = Number(value[i]);
            if (Number.isFinite(n)) out.push(n);
        }
        return out;
    }

    function setDataSourceStatus(text, tone) {
        if (!dom.dataSourceStatus) return;
        dom.dataSourceStatus.textContent = text;
        dom.dataSourceStatus.style.borderColor = tone === "error"
            ? "rgba(244,63,94,0.35)"
            : tone === "import"
                ? "rgba(56,189,248,0.32)"
                : "rgba(255,255,255,0.07)";
        dom.dataSourceStatus.style.color = tone === "error"
            ? "#fecdd3"
            : tone === "import"
                ? "#dbeafe"
                : "#cbd5e1";
        dom.dataSourceStatus.style.background = tone === "error"
            ? "rgba(127,29,29,0.18)"
            : tone === "import"
                ? "rgba(8,47,73,0.22)"
                : "rgba(15,23,42,0.45)";
    }

    function fmtExp(value, digits) {
        if (!Number.isFinite(value)) return "n/a";
        return value.toExponential(digits == null ? 2 : digits).replace("e+", "e");
    }

    function fmtScalar(value, unit, digits) {
        if (!Number.isFinite(value)) return "n/a";
        const av = Math.abs(value);
        if (av >= 1e4 || (av > 0 && av < 1e-3)) return fmtExp(value, digits == null ? 2 : digits) + (unit ? " " + unit : "");
        const d = digits == null ? 3 : digits;
        return value.toFixed(d) + (unit ? " " + unit : "");
    }

    function fmtSeconds(seconds) {
        if (!Number.isFinite(seconds)) return "n/a";
        const s = Math.abs(seconds);
        if (s < 1e-6) return fmtExp(seconds, 2) + " s";
        if (s < 1) return seconds.toFixed(6) + " s";
        if (s < 60) return seconds.toFixed(3) + " s";
        if (s < 3600) return (seconds / 60).toFixed(2) + " min";
        if (s < 86400) return (seconds / 3600).toFixed(2) + " h";
        if (s < engine.year) return (seconds / 86400).toFixed(2) + " d";
        return (seconds / engine.year).toFixed(3) + " y";
    }

    function rgbaFromRgb(rgb, alpha) {
        return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + alpha.toFixed(3) + ")";
    }

    function mixRgb(a, b, t) {
        const u = clamp(t, 0, 1);
        return [
            Math.round(lerp(a[0], b[0], u)),
            Math.round(lerp(a[1], b[1], u)),
            Math.round(lerp(a[2], b[2], u))
        ];
    }

    function log10Safe(v) {
        return Math.log10(Math.max(Math.abs(v), 1e-300));
    }

    function hashNoise(i) {
        const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453123;
        return x - Math.floor(x);
    }

    function heroMassFromControls(preset, customMass) {
        if (preset === "custom") return parsePositive(customMass, PRESET_MASSES.pbh);
        return PRESET_MASSES[preset] || PRESET_MASSES.stellar;
    }

    function readControls() {
        const preset = dom.massPreset ? dom.massPreset.value : "stellar";
        const heroMass = heroMassFromControls(preset, dom.customMassInput ? dom.customMassInput.value : "1e12");
        const cycles = Math.max(1, Math.round(parsePositive(dom.cyclesInput.value, 3)));
        const cycleStartFactor = clamp(parsePositive(dom.cycleStartFactorInput.value, 10), 1, 1e6);
        const remnantFactor = clamp(parsePositive(dom.remnantFactorInput.value, 1), 1e-6, 1e6);
        const alpha = clamp(parsePositive(dom.alphaInput.value, 4), 0.01, 1e6);
        const gamma = clamp(parseFinite(dom.gammaInput.value, 1), 0, 1e6);
        const evapSteps = Math.max(64, Math.round(parsePositive(dom.evapStepsInput.value, 900)));
        const qmSteps = Math.max(8, Math.round(parsePositive(dom.qmStepsInput.value, 128)));
        const playbackSpeed = clamp(parsePositive(dom.playbackSpeedInput.value, 1), 0.05, 20);
        const lensingStrength = clamp(parseFinite(dom.lensingInput.value, 1), 0, 5);
        const turbulence = clamp(parseFinite(dom.turbulenceInput.value, 0.6), 0, 5);
        const Mrem = Math.max(remnantFactor * engine.MP, 1e-99);
        const cycleStartMass = Math.max(cycleStartFactor * engine.MP, Mrem * (1 + 1e-9));

        return {
            preset,
            heroMass,
            cycles,
            cycleStartFactor,
            remnantFactor,
            alpha,
            gamma,
            evapSteps,
            qmSteps,
            playbackSpeed,
            lensingStrength,
            turbulence,
            Mrem,
            cycleStartMass,
            reloadFrames: 44,
            memoryHoldFrames: 22
        };
    }

    function updateReadouts() {
        if (dom.cyclesVal) dom.cyclesVal.textContent = String(Math.round(parsePositive(dom.cyclesInput.value, 3)));
        if (dom.cycleStartFactorVal) dom.cycleStartFactorVal.textContent = parsePositive(dom.cycleStartFactorInput.value, 10).toFixed(1) + " M_P";
        if (dom.remnantFactorVal) dom.remnantFactorVal.textContent = parsePositive(dom.remnantFactorInput.value, 1).toFixed(2) + " M_P";
        if (dom.alphaVal) dom.alphaVal.textContent = parsePositive(dom.alphaInput.value, 4).toFixed(2);
        if (dom.gammaVal) dom.gammaVal.textContent = Math.max(parseFinite(dom.gammaInput.value, 1), 0).toFixed(2);
        if (dom.evapStepsVal) dom.evapStepsVal.textContent = String(Math.round(parsePositive(dom.evapStepsInput.value, 900)));
        if (dom.qmStepsVal) dom.qmStepsVal.textContent = String(Math.round(parsePositive(dom.qmStepsInput.value, 128)));
        if (dom.playbackSpeedVal) dom.playbackSpeedVal.textContent = parsePositive(dom.playbackSpeedInput.value, 1).toFixed(2) + "x";
        if (dom.lensingVal) dom.lensingVal.textContent = parseFinite(dom.lensingInput.value, 1).toFixed(2);
        if (dom.turbulenceVal) dom.turbulenceVal.textContent = parseFinite(dom.turbulenceInput.value, 0.6).toFixed(2);
    }

    function updateCustomMassVisibility() {
        if (!dom.customMassField || !dom.massPreset) return;
        dom.customMassField.hidden = dom.massPreset.value !== "custom";
    }

    function makeQmToyCurve(steps) {
        const n = Math.max(8, Math.round(steps));
        const t = new Array(n);
        const S = new Array(n);
        let peak = 1e-99;

        for (let i = 0; i < n; i += 1) {
            const u = n > 1 ? i / (n - 1) : 0;
            const pageLike = Math.pow(Math.sin(Math.PI * u), 0.92);
            const asym = 0.08 * Math.sin(2 * Math.PI * u + 0.4);
            const v = clamp(pageLike * (1 + asym), 0, 1);
            t[i] = i;
            S[i] = v;
            peak = Math.max(peak, v);
        }

        if (peak > 0) {
            for (let i = 0; i < S.length; i += 1) {
                S[i] /= peak;
            }
            peak = 1;
        }

        return { steps: t, S, peak };
    }

    function normalizeQmCurve(stepsRaw, sRaw, fallbackSteps) {
        const steps = toFiniteArray(stepsRaw);
        const sIn = toFiniteArray(sRaw);
        const n = Math.min(steps.length, sIn.length);
        if (n < 2) return makeQmToyCurve(fallbackSteps);

        const outSteps = steps.slice(0, n);
        const outS = sIn.slice(0, n);
        let peak = 1e-99;
        for (let i = 0; i < outS.length; i += 1) {
            peak = Math.max(peak, Math.abs(outS[i]));
        }
        if (peak > 0) {
            for (let i = 0; i < outS.length; i += 1) {
                outS[i] = clamp(outS[i] / peak, 0, 1);
            }
        }
        return { steps: outSteps, S: outS, peak: 1 };
    }

    function toySpinCurve(nSteps, cycleIndex) {
        const n = Math.max(2, Math.round(nSteps));
        const out = new Array(n);
        const signSeed = Math.sin((cycleIndex + 1) * 1.37 + 0.25);
        const sign = signSeed >= 0 ? 1 : -1;
        const startMag = clamp(0.22 + 0.58 * (0.5 + 0.5 * Math.sin(cycleIndex * 0.91 + 0.3)), 0.15, 0.9);
        const endMag = clamp(0.08 + 0.16 * (0.5 + 0.5 * Math.cos(cycleIndex * 1.17 + 0.7)), 0.03, startMag);

        for (let i = 0; i < n; i += 1) {
            const u = n > 1 ? i / (n - 1) : 1;
            const slowSpinDown = lerp(startMag, endMag, Math.pow(u, 0.85));
            const ripple = 0.025 * Math.sin(2 * Math.PI * u + cycleIndex * 0.8);
            out[i] = sign * clamp(slowSpinDown + ripple, 0.0, 0.95);
        }
        return out;
    }

    function normalizeSpinCurve(aStarRaw, fallbackSteps, cycleIndex) {
        const src = toFiniteArray(aStarRaw);
        if (src.length >= 2) {
            const out = new Array(src.length);
            let maxAbs = 1e-99;
            for (let i = 0; i < src.length; i += 1) {
                const v = clamp(src[i], -0.999, 0.999);
                out[i] = v;
                maxAbs = Math.max(maxAbs, Math.abs(v));
            }
            return {
                values: out,
                source: "imported",
                maxAbs
            };
        }

        const toy = toySpinCurve(fallbackSteps, cycleIndex);
        let maxAbs = 1e-99;
        for (let i = 0; i < toy.length; i += 1) {
            maxAbs = Math.max(maxAbs, Math.abs(toy[i]));
        }
        return {
            values: toy,
            source: "toy",
            maxAbs
        };
    }

    function cycleSpinEndpoints(cycle, cfg, cycleIndex, nextCycleIndex) {
        const spin = normalizeSpinCurve(cycle.aStar, cycle.M.length || cfg.evapSteps, cycleIndex);
        const start = spin.values[0] || 0;
        const end = spin.values[spin.values.length - 1] || start;

        let nextStart;
        if (Array.isArray(cycle.nextCycleAStartHint) && cycle.nextCycleAStartHint.length) {
            nextStart = Number(cycle.nextCycleAStartHint[0]);
        } else if (Number.isFinite(cycle.nextCycleAStartHint)) {
            nextStart = Number(cycle.nextCycleAStartHint);
        } else {
            const toyNext = toySpinCurve(Math.max(2, cfg.evapSteps || 128), nextCycleIndex == null ? (cycleIndex + 1) : nextCycleIndex);
            nextStart = toyNext[0];
        }
        nextStart = clamp(Number.isFinite(nextStart) ? nextStart : start, -0.999, 0.999);

        return {
            values: spin.values,
            source: spin.source,
            maxAbs: spin.maxAbs,
            start,
            end,
            nextStart
        };
    }

    function cycleSummary(cycle, cfg, index) {
        const th = cycle.TH || [];
        let thMin = Infinity;
        let thMax = 0;
        let sigmaMax = 1e-99;
        for (let i = 0; i < th.length; i += 1) {
            const v = th[i];
            if (Number.isFinite(v)) {
                thMin = Math.min(thMin, v);
                thMax = Math.max(thMax, v);
            }
        }
        for (let i = 0; i < cycle.Srad.length; i += 1) {
            sigmaMax = Math.max(sigmaMax, Math.abs(cycle.Srad[i]));
        }
        const logMrem = log10Safe(cfg.Mrem);
        const logMstart = log10Safe(cycle.M[0] || cfg.cycleStartMass);
        const massSpanLog = Math.max(logMstart - logMrem, 1e-9);
        const spinMeta = cycleSpinEndpoints(cycle, cfg, index, index + 1);
        const chiArr = Array.isArray(cycle.chi) ? cycle.chi : [];
        let chiMax = 1e-99;
        for (let i = 0; i < chiArr.length; i += 1) {
            const cv = Number(chiArr[i]);
            if (Number.isFinite(cv)) chiMax = Math.max(chiMax, Math.abs(cv));
        }

        return {
            cycleIndex: index,
            tauEff: cycle.tau_eff,
            sigmaMax,
            thMin: Number.isFinite(thMin) ? thMin : 0,
            thMax: thMax > 0 ? thMax : 1,
            logMrem,
            massSpanLog,
            qm: normalizeQmCurve(cycle.steps_qm, cycle.S_rad_qm, cfg.qmSteps),
            spin: spinMeta,
            chiMax
        };
    }

    function buildEvapFrame(cycleIndex, stepIndex, cycle, meta, cfg) {
        const n = Math.max(cycle.M.length, 1);
        const u = n > 1 ? stepIndex / (n - 1) : 1;
        const qmIdx = Math.round(u * (meta.qm.S.length - 1));
        const M = cycle.M[stepIndex];
        const TH = cycle.TH[stepIndex];
        const rs = engine.schwarzschildRadius(M);
        const sigmaRaw = cycle.Srad[stepIndex] || 0;
        const sigmaNorm = clamp(Math.abs(sigmaRaw) / Math.max(meta.sigmaMax, 1e-99), 0, 1);
        const qmRaw = meta.qm.S[qmIdx] || 0;
        const massNorm = clamp((log10Safe(M) - meta.logMrem) / meta.massSpanLog, 0, 1);
        const thLogMin = log10Safe(meta.thMin || 1e-99);
        const thLogMax = log10Safe(meta.thMax || 1);
        const tempNorm = clamp((log10Safe(TH) - thLogMin) / Math.max(thLogMax - thLogMin, 1e-9), 0, 1);
        const spinArr = meta.spin && Array.isArray(meta.spin.values) ? meta.spin.values : [0];
        const spinIdx = Math.min(stepIndex, Math.max(spinArr.length - 1, 0));
        const aStar = clamp(Number(spinArr[spinIdx] || 0), -0.999, 0.999);
        const flagsArr = Array.isArray(cycle.flags) ? cycle.flags : [];
        const flagVal = Number(flagsArr[Math.min(stepIndex, Math.max(flagsArr.length - 1, 0))] || 0);
        const chiArr = Array.isArray(cycle.chi) ? cycle.chi : [];
        const chiVal = Number(chiArr[Math.min(stepIndex, Math.max(chiArr.length - 1, 0))] || 0);
        const chiNorm = clamp(Math.abs(chiVal) / Math.max(meta.chiMax || 1e-99, 1e-99), 0, 1);

        return {
            cycleIndex,
            phase: stepIndex >= n - 1 ? "memory_core" : "evaporation",
            phaseProgress: stepIndex >= n - 1 ? 1 : u,
            cycleProgress: u,
            M,
            TH,
            rs,
            SradSigma: sigmaRaw,
            sigmaNorm,
            SradQm: qmRaw,
            qmNorm: clamp(qmRaw, 0, 1),
            aStar,
            spinNorm: Math.abs(aStar),
            spinSign: aStar >= 0 ? 1 : -1,
            spinSource: (meta.spin && meta.spin.source) || "toy",
            coreFlag: flagVal > 0 ? 1 : 0,
            chi: chiVal,
            chiNorm,
            tauEff: cycle.tau_eff,
            Mstart: cycle.M[0] || cfg.cycleStartMass,
            Mrem: cfg.Mrem,
            heroMass: cfg.heroMass,
            preset: cfg.preset,
            cycleCount: cfg.cycles,
            remnantFactor: cfg.remnantFactor,
            cycleStartFactor: cfg.cycleStartFactor,
            alpha: cfg.alpha,
            gamma: cfg.gamma,
            lensingStrength: cfg.lensingStrength,
            turbulence: cfg.turbulence,
            tempNorm,
            massNorm
        };
    }

    function buildMemoryHoldFrames(cycleIndex, cycle, meta, cfg, count) {
        const frames = [];
        if (!cycle.M.length) return frames;
        const last = buildEvapFrame(cycleIndex, cycle.M.length - 1, cycle, meta, cfg);
        for (let i = 0; i < count; i += 1) {
            const u = count > 1 ? i / (count - 1) : 1;
            frames.push({
                ...last,
                phase: "memory_core",
                phaseProgress: u,
                cycleProgress: 1,
                qmNorm: 0,
                SradQm: 0,
                coreFlag: 1
            });
        }
        return frames;
    }

    function buildReloadFrames(cycleIndex, nextCycleIndex, cycle, meta, cfg, count) {
        const frames = [];
        const M0 = cfg.Mrem;
        const M1 = cfg.cycleStartMass;
        const TH0 = cycle.TH[cycle.TH.length - 1] || engine.hawkingTemperature(M0);
        const TH1 = engine.hawkingTemperature(M1);
        const rs0 = engine.schwarzschildRadius(M0);
        const rs1 = engine.schwarzschildRadius(M1);
        const spinMeta = meta.spin || { end: 0, nextStart: 0, source: "toy", maxAbs: 1 };
        const a0 = clamp(Number(spinMeta.end || 0), -0.999, 0.999);
        const a1 = clamp(Number(spinMeta.nextStart || a0), -0.999, 0.999);
        const chi0 = 0;

        for (let i = 0; i < count; i += 1) {
            const u = count > 1 ? i / (count - 1) : 1;
            const e = easeInOutCubic(u);
            const M = lerp(M0, M1, e);
            const TH = lerp(TH0, TH1, e);
            const rs = lerp(rs0, rs1, e);
            const aStar = lerp(a0, a1, e);
            const massNorm = clamp((log10Safe(M) - meta.logMrem) / meta.massSpanLog, 0, 1);
            const thLogMin = log10Safe(meta.thMin || 1e-99);
            const thLogMax = log10Safe(meta.thMax || 1);
            const tempNorm = clamp((log10Safe(TH) - thLogMin) / Math.max(thLogMax - thLogMin, 1e-9), 0, 1);

            frames.push({
                cycleIndex,
                nextCycleIndex,
                phase: "reload",
                phaseProgress: u,
                cycleProgress: 1,
                M,
                TH,
                rs,
                SradSigma: lerp(cycle.Srem || 0, 0, e),
                sigmaNorm: lerp(0.18, 0.02, e),
                SradQm: 0,
                qmNorm: 0,
                aStar,
                spinNorm: Math.abs(aStar),
                spinSign: aStar >= 0 ? 1 : -1,
                spinSource: spinMeta.source || "toy",
                coreFlag: 1,
                chi: chi0,
                chiNorm: 0,
                tauEff: cycle.tau_eff,
                Mstart: cfg.cycleStartMass,
                Mrem: cfg.Mrem,
                heroMass: cfg.heroMass,
                preset: cfg.preset,
                cycleCount: cfg.cycles,
                remnantFactor: cfg.remnantFactor,
                cycleStartFactor: cfg.cycleStartFactor,
                alpha: cfg.alpha,
                gamma: cfg.gamma,
                lensingStrength: cfg.lensingStrength,
                turbulence: cfg.turbulence,
                tempNorm,
                massNorm
            });
        }
        return frames;
    }

    function finalizeStory(cfg, cycles, frames) {
        for (let i = 0; i < frames.length; i += 1) {
            frames[i].frameIndex = i;
            frames[i].frameCount = frames.length;
        }

        let tauMean = 0;
        for (let i = 0; i < cycles.length; i += 1) {
            tauMean += cycles[i].tau_eff || 0;
        }
        tauMean /= Math.max(cycles.length, 1);

        return {
            cfg,
            cycles,
            frames,
            tauMean,
            heroMass: cfg.heroMass,
            remnantMass: cfg.Mrem,
            cycleStartMass: cfg.cycleStartMass
        };
    }

    function buildCyclicStory(cfg) {
        const cycles = [];
        const frames = [];

        for (let i = 0; i < cfg.cycles; i += 1) {
            const q = engine.simulateQuantized(
                cfg.cycleStartMass,
                cfg.evapSteps,
                cfg.Mrem,
                cfg.alpha,
                cfg.gamma
            );
            q.aStar = toySpinCurve(q.M.length || cfg.evapSteps, i);
            const meta = cycleSummary(q, cfg, i);
            const cycleEntry = { ...q, meta };
            cycles.push(cycleEntry);

            for (let j = 0; j < q.M.length; j += 1) {
                frames.push(buildEvapFrame(i, j, q, meta, cfg));
            }

            const holdFrames = buildMemoryHoldFrames(i, q, meta, cfg, cfg.memoryHoldFrames);
            for (let h = 0; h < holdFrames.length; h += 1) {
                frames.push(holdFrames[h]);
            }

            if (i < cfg.cycles - 1) {
                const reloadFrames = buildReloadFrames(i, i + 1, q, meta, cfg, cfg.reloadFrames);
                for (let r = 0; r < reloadFrames.length; r += 1) {
                    frames.push(reloadFrames[r]);
                }
            }
        }

        return finalizeStory(cfg, cycles, frames);
    }

    function normalizeImportedCycle(rawCycle, fallbackCfg, index) {
        const t = toFiniteArray(rawCycle && rawCycle.t);
        const M = toFiniteArray(rawCycle && rawCycle.M);
        const n = Math.min(t.length, M.length);
        if (n < 2) {
            throw new Error("Cycle " + index + " is missing valid t/M arrays.");
        }

        const tN = t.slice(0, n);
        const mN = M.slice(0, n).map(function (v) { return Math.max(Math.abs(v), 1e-99); });

        let thN = toFiniteArray(rawCycle && rawCycle.TH);
        if (thN.length < n) {
            thN = mN.map(function (m) { return engine.hawkingTemperature(m); });
        } else {
            thN = thN.slice(0, n);
        }

        let sradN = toFiniteArray(rawCycle && (rawCycle.S_rad_sigmaP != null ? rawCycle.S_rad_sigmaP : rawCycle.Srad));
        if (sradN.length < n) {
            const last = sradN.length ? sradN[sradN.length - 1] : 0;
            while (sradN.length < n) sradN.push(last);
        } else {
            sradN = sradN.slice(0, n);
        }

        const tauEffRaw = Number(rawCycle && rawCycle.tau_eff);
        const tauEff = Number.isFinite(tauEffRaw) ? tauEffRaw : tN[n - 1];

        const sremRaw = Number(rawCycle && rawCycle.Srem);
        const srem = Number.isFinite(sremRaw) ? sremRaw : (sradN[n - 1] || 0);

        const stepsQm = toFiniteArray(rawCycle && rawCycle.steps_qm);
        const sQm = toFiniteArray(rawCycle && (rawCycle.S_rad_qm != null ? rawCycle.S_rad_qm : rawCycle.SradQm));
        const aStar = toFiniteArray(rawCycle && (rawCycle.a_star != null ? rawCycle.a_star : rawCycle.aStar));
        const chi = toFiniteArray(rawCycle && rawCycle.chi);
        const flagsRaw = Array.isArray(rawCycle && rawCycle.flags) ? rawCycle.flags : [];
        const flags = new Array(Math.min(flagsRaw.length, n));
        for (let i = 0; i < flags.length; i += 1) {
            const fv = Number(flagsRaw[i]);
            flags[i] = Number.isFinite(fv) && fv > 0 ? 1 : 0;
        }

        return {
            t: tN,
            M: mN,
            TH: thN,
            Srad: sradN,
            tau_eff: tauEff,
            Srem: srem,
            steps_qm: stepsQm,
            S_rad_qm: sQm,
            aStar,
            chi,
            flags
        };
    }

    function buildStoryFromImportedPayload(payload, cfg) {
        if (!payload || typeof payload !== "object") {
            throw new Error("JSON payload must be an object.");
        }
        if (!Array.isArray(payload.cycles) || payload.cycles.length === 0) {
            throw new Error("JSON payload has no cycles array.");
        }

        const fileCfg = payload.config && typeof payload.config === "object" ? payload.config : {};
        const constants = payload.constants && typeof payload.constants === "object" ? payload.constants : {};
        const importedMrem = Number(fileCfg.Mrem);
        const importedStartMass = Number(fileCfg.cycle_start_mass);
        const importedCycles = Number(fileCfg.n_cycles);
        const importedHeroMass = Number(fileCfg.hero_mass);

        const cfgMerged = {
            ...cfg,
            Mrem: Number.isFinite(importedMrem) && importedMrem > 0 ? importedMrem : cfg.Mrem,
            cycleStartMass: Number.isFinite(importedStartMass) && importedStartMass > 0 ? importedStartMass : cfg.cycleStartMass,
            cycles: Number.isFinite(importedCycles) && importedCycles > 0 ? Math.round(importedCycles) : payload.cycles.length,
            heroMass: Number.isFinite(importedHeroMass) && importedHeroMass > 0
                ? importedHeroMass
                : Number.isFinite(Number(constants.hero_mass)) && Number(constants.hero_mass) > 0
                    ? Number(constants.hero_mass)
                    : cfg.heroMass,
            preset: "custom"
        };

        const cycles = [];
        const frames = [];
        const srcCycles = payload.cycles;
        cfgMerged.cycles = Math.max(srcCycles.length, 1);

        for (let i = 0; i < srcCycles.length; i += 1) {
            const q = normalizeImportedCycle(srcCycles[i], cfgMerged, i);
            if (i + 1 < srcCycles.length) {
                const nextRaw = srcCycles[i + 1];
                const nextSpinRaw = toFiniteArray(nextRaw && (nextRaw.a_star != null ? nextRaw.a_star : nextRaw.aStar));
                if (nextSpinRaw.length > 0) {
                    q.nextCycleAStartHint = nextSpinRaw[0];
                }
            }
            const meta = cycleSummary(q, cfgMerged, i);
            const cycleEntry = { ...q, meta };
            cycles.push(cycleEntry);

            for (let j = 0; j < q.M.length; j += 1) {
                frames.push(buildEvapFrame(i, j, q, meta, cfgMerged));
            }

            const holdFrames = buildMemoryHoldFrames(i, q, meta, cfgMerged, cfgMerged.memoryHoldFrames);
            for (let h = 0; h < holdFrames.length; h += 1) {
                frames.push(holdFrames[h]);
            }

            if (i < srcCycles.length - 1) {
                const reloadFrames = buildReloadFrames(i, i + 1, q, meta, cfgMerged, cfgMerged.reloadFrames);
                for (let r = 0; r < reloadFrames.length; r += 1) {
                    frames.push(reloadFrames[r]);
                }
            }
        }

        return finalizeStory(cfgMerged, cycles, frames);
    }

    function resizeCanvas() {
        const rect = dom.canvas.getBoundingClientRect();
        const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
        const w = Math.max(320, Math.round(rect.width));
        const h = Math.max(240, Math.round(rect.height));

        if (w === state.width && h === state.height && dpr === state.dpr) return;

        state.width = w;
        state.height = h;
        state.dpr = dpr;
        dom.canvas.width = Math.round(w * dpr);
        dom.canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        rebuildVisualSeeds();
    }

    function rebuildVisualSeeds() {
        const w = Math.max(state.width, 1);
        const h = Math.max(state.height, 1);

        state.stars = [];
        const starCount = Math.round(clamp((w * h) / 1800, 140, 600));
        for (let i = 0; i < starCount; i += 1) {
            state.stars.push({
                x: hashNoise(i * 3 + 1),
                y: hashNoise(i * 3 + 2),
                size: lerp(0.35, 2.2, hashNoise(i * 3 + 3)),
                alpha: lerp(0.18, 0.95, hashNoise(i * 5 + 7)),
                hue: lerp(190, 235, hashNoise(i * 5 + 11)),
                twinkle: lerp(0.3, 1.8, hashNoise(i * 7 + 13)),
                drift: lerp(-1, 1, hashNoise(i * 7 + 17)),
                depth: lerp(0.6, 1.8, hashNoise(i * 11 + 19))
            });
        }

        state.disk = [];
        const particleCount = Math.round(clamp((w * h) / 1400, 260, 900));
        for (let i = 0; i < particleCount; i += 1) {
            state.disk.push({
                rNorm: lerp(0.12, 1.0, Math.pow(hashNoise(i * 13 + 1), 0.65)),
                lane: hashNoise(i * 13 + 2) > 0.5 ? 1 : -1,
                angle0: hashNoise(i * 13 + 3) * Math.PI * 2,
                speed: lerp(0.3, 1.6, hashNoise(i * 13 + 4)),
                thickness: lerp(-1, 1, hashNoise(i * 13 + 5)),
                hot: lerp(0.1, 1.0, hashNoise(i * 13 + 6)),
                alpha: lerp(0.1, 0.65, hashNoise(i * 13 + 7)),
                size: lerp(0.6, 2.2, hashNoise(i * 13 + 8))
            });
        }
    }

    function getCurrentFrame() {
        if (!state.story || !state.story.frames.length) return null;
        const idx = clamp(Math.round(state.frameIndex), 0, state.story.frames.length - 1);
        return state.story.frames[idx];
    }

    function getLiveLensingStrength(fallback) {
        const base = Number.isFinite(fallback) ? fallback : 1;
        return clamp(parseFinite(dom.lensingInput ? dom.lensingInput.value : base, base), 0, 3);
    }

    function getLiveTurbulence(fallback) {
        const base = Number.isFinite(fallback) ? fallback : 0.6;
        return clamp(parseFinite(dom.turbulenceInput ? dom.turbulenceInput.value : base, base), 0, 3);
    }

    function applyLensingWarp(x, y, cx, cy, shadowR, lensingStrength) {
        const dx = x - cx;
        const dy = y - cy;
        const r = Math.hypot(dx, dy);
        if (r < 1e-6) return { x, y, r };

        const lensR = shadowR * (2.0 + 0.9 * lensingStrength);
        let nx = x;
        let ny = y;

        if (r > shadowR * 0.98 && r < lensR * 2.2) {
            const falloff = smoothstep(lensR * 2.2, shadowR * 1.02, r);
            const radialBoost = (10 + 22 * lensingStrength) * falloff / (1 + 0.018 * r);
            nx += (dx / r) * radialBoost;
            ny += (dy / r) * radialBoost;

            const swirl = (lensingStrength * 7.5 * falloff) / (1 + 0.015 * r);
            nx += (-dy / r) * swirl;
            ny += (dx / r) * swirl;
        }

        return { x: nx, y: ny, r };
    }

    function visualParams(frame) {
        const w = state.width;
        const h = state.height;
        const cx = w * 0.5;
        const cy = h * 0.5;
        const massNorm = clamp(frame.massNorm, 0, 1);
        const tempNorm = clamp(frame.tempNorm, 0, 1);
        const mood = clamp(log10Safe(frame.heroMass) / 40, 0, 1);
        const lensingStrength = getLiveLensingStrength(frame.lensingStrength);
        const turbulence = getLiveTurbulence(frame.turbulence);
        const spinSigned = clamp(Number(frame.aStar || 0), -0.999, 0.999);
        const spinMag = clamp(Math.abs(spinSigned), 0, 0.999);
        const spinDir = spinSigned >= 0 ? 1 : -1;
        const spinPulse = 0.5 + 0.5 * Math.sin(state.time * 0.0011 + frame.cycleIndex * 0.9);

        const shadowR = lerp(22, Math.min(w, h) * 0.16, Math.pow(massNorm, 0.72));
        const photonR = shadowR * lerp(1.22, 1.48, 0.5 + 0.5 * lensingStrength);
        const diskInner = shadowR * lerp(1.65, 1.95, 0.4 + 0.6 * tempNorm);
        const diskOuter = shadowR * (3.6 + 1.8 * turbulence + 0.7 * mood);
        const diskTilt = lerp(0.22, 0.44, 0.45 + 0.35 * Math.sin(state.time * 0.07));
        const glow = lerp(0.35, 1.15, tempNorm);
        const jetAxisAngle = spinDir * lerp(0.02, 0.22, spinMag) * (0.7 + 0.3 * spinPulse);
        const beamingBias = spinDir * lerp(0.04, 0.38, spinMag);
        const coreColorMix = clamp(0.25 + 0.65 * spinMag + 0.12 * frame.sigmaNorm, 0, 1);
        const coreInCoreTint = frame.coreFlag > 0 ? 1 : 0;

        return {
            w,
            h,
            cx,
            cy,
            shadowR,
            photonR,
            diskInner,
            diskOuter,
            diskTilt,
            glow,
            tempNorm,
            massNorm,
            mood,
            lensingStrength,
            turbulence,
            spinSigned,
            spinMag,
            spinDir,
            spinPulse,
            jetAxisAngle,
            beamingBias,
            coreColorMix,
            coreInCoreTint
        };
    }

    function drawBackground(frame, vp) {
        const bg = ctx.createLinearGradient(0, 0, 0, vp.h);
        bg.addColorStop(0, "#030712");
        bg.addColorStop(0.45, "#050b19");
        bg.addColorStop(1, "#010207");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, vp.w, vp.h);

        const neb1 = ctx.createRadialGradient(
            vp.w * 0.18 + Math.cos(state.time * 0.00016) * 40,
            vp.h * 0.18,
            0,
            vp.w * 0.18,
            vp.h * 0.18,
            vp.w * 0.55
        );
        neb1.addColorStop(0, "rgba(56,189,248,0.10)");
        neb1.addColorStop(1, "rgba(56,189,248,0.00)");
        ctx.fillStyle = neb1;
        ctx.fillRect(0, 0, vp.w, vp.h);

        const neb2 = ctx.createRadialGradient(
            vp.w * 0.78 + Math.sin(state.time * 0.00011) * 55,
            vp.h * 0.24,
            0,
            vp.w * 0.78,
            vp.h * 0.24,
            vp.w * 0.45
        );
        neb2.addColorStop(0, "rgba(251,191,36,0.07)");
        neb2.addColorStop(1, "rgba(251,191,36,0.00)");
        ctx.fillStyle = neb2;
        ctx.fillRect(0, 0, vp.w, vp.h);

        const cyclePulse = frame.phase === "reload" ? 0.18 + 0.15 * Math.sin(frame.phaseProgress * Math.PI) : 0;
        if (cyclePulse > 0) {
            const reloadGlow = ctx.createRadialGradient(vp.cx, vp.cy, 0, vp.cx, vp.cy, vp.w * 0.6);
            const reloadColor = vp.spinDir >= 0 ? "34,211,238" : "244,114,182";
            reloadGlow.addColorStop(0, "rgba(" + reloadColor + "," + (0.06 + cyclePulse).toFixed(3) + ")");
            reloadGlow.addColorStop(1, "rgba(34,211,238,0)");
            ctx.fillStyle = reloadGlow;
            ctx.fillRect(0, 0, vp.w, vp.h);
        }
    }

    function drawStars(frame, vp) {
        const lensingStrength = vp.lensingStrength;
        const driftT = state.time * 0.00002;
        const shadowMask = vp.shadowR * 1.05;

        for (let i = 0; i < state.stars.length; i += 1) {
            const s = state.stars[i];
            const x = (s.x + driftT * s.drift / s.depth) % 1;
            const y = s.y;
            const px = x < 0 ? (x + 1) * vp.w : x * vp.w;
            const py = y * vp.h;

            const warped = applyLensingWarp(px, py, vp.cx, vp.cy, vp.shadowR, lensingStrength);
            const wr = Math.hypot(warped.x - vp.cx, warped.y - vp.cy);
            if (wr < shadowMask) continue;

            const lensBoost = smoothstep(vp.shadowR * 3.0, vp.shadowR * 1.1, wr) * 0.55 * lensingStrength;
            const twinkle = 0.65 + 0.35 * Math.sin(state.time * 0.0012 * s.twinkle + i);
            const alpha = clamp(s.alpha * twinkle + lensBoost, 0.04, 1);
            const size = s.size * (1 + lensBoost * 0.55);

            ctx.fillStyle = "hsla(" + s.hue.toFixed(0) + ", 100%, 85%, " + alpha.toFixed(3) + ")";
            ctx.beginPath();
            ctx.arc(warped.x, warped.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawDiskLayer(frame, vp, frontLayer) {
        const t = state.time * 0.001;
        const lensingStrength = vp.lensingStrength;
        const tempBias = 0.45 + 0.55 * vp.tempNorm;
        const turbul = vp.turbulence;
        const rotSense = vp.spinDir;

        for (let i = 0; i < state.disk.length; i += 1) {
            const p = state.disk[i];
            const r = lerp(vp.diskInner, vp.diskOuter, p.rNorm);
            const ang = p.angle0 + rotSense * t * p.speed * (0.8 + 1.6 / Math.sqrt(0.35 + p.rNorm));
            const ca = Math.cos(ang);
            const sa = Math.sin(ang);
            const depthSign = sa * p.lane;
            const isFront = depthSign >= 0;
            if (isFront !== frontLayer) continue;

            const wobble = 1 + 0.025 * turbul * Math.sin(t * 4 + i * 0.13);
            const x0 = vp.cx + ca * r * wobble;
            const y0 = vp.cy + sa * r * vp.diskTilt + p.thickness * (3 + 8 * turbul) * (1 - p.rNorm);
            const warped = applyLensingWarp(x0, y0, vp.cx, vp.cy, vp.shadowR, lensingStrength * 0.65);
            const wr = Math.hypot(warped.x - vp.cx, warped.y - vp.cy);
            if (wr < vp.shadowR * 1.02) continue;

            const spinBoost = vp.beamingBias * ca * p.lane;
            const doppler = clamp(0.55 + 0.75 * ca * p.lane + 0.18 * tempBias + spinBoost, 0.12, 1.75);
            const heat = clamp(0.25 + 0.85 * p.hot * tempBias + 0.18 * frame.sigmaNorm, 0, 1.6);
            const spinHueShift = vp.spinDir < 0 ? 16 * vp.spinMag : -10 * vp.spinMag;
            const hue = lerp(30, 205, 1 - Math.min(heat, 1)) + spinHueShift;
            const lum = lerp(42, 80, Math.min(heat, 1));
            const alpha = clamp(p.alpha * doppler * (frontLayer ? 1.05 : 0.62), 0.03, 0.95);
            const size = p.size * (frontLayer ? 1.1 : 0.85) * (1 + 0.14 * doppler);
            const streak = (3.2 + 10.5 * p.rNorm) * (0.55 + 0.55 * doppler);

            ctx.strokeStyle = "hsla(" + hue.toFixed(0) + ", 96%, " + lum.toFixed(0) + "%, " + (alpha * 0.65).toFixed(3) + ")";
            ctx.lineWidth = Math.max(0.5, size * 0.7);
            ctx.beginPath();
            ctx.moveTo(warped.x, warped.y);
            ctx.lineTo(
                warped.x - sa * streak,
                warped.y + ca * streak * vp.diskTilt
            );
            ctx.stroke();

            ctx.fillStyle = "hsla(" + hue.toFixed(0) + ", 100%, " + (lum + 8).toFixed(0) + "%, " + alpha.toFixed(3) + ")";
            ctx.beginPath();
            ctx.arc(warped.x, warped.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawBlackHole(frame, vp) {
        const ringGlow = clamp(vp.glow + 0.4 * frame.sigmaNorm, 0.2, 2.2);
        const photonOuter = vp.photonR * 1.35;
        const ringWarm = vp.spinDir >= 0 ? [250, 204, 21] : [251, 146, 60];
        const ringCool = vp.spinDir >= 0 ? [56, 189, 248] : [244, 114, 182];
        const ringMix = clamp(0.15 + 0.75 * vp.spinMag, 0, 1);
        const ringMid = mixRgb(ringWarm, ringCool, 0.45 + 0.25 * ringMix);
        const ringOuterRgb = mixRgb([56, 189, 248], ringCool, ringMix);

        const ringGrad = ctx.createRadialGradient(vp.cx, vp.cy, vp.photonR * 0.72, vp.cx, vp.cy, photonOuter);
        ringGrad.addColorStop(0, "rgba(255,255,255,0)");
        ringGrad.addColorStop(0.52, rgbaFromRgb(ringMid, 0.10 + 0.10 * ringGlow));
        ringGrad.addColorStop(0.72, rgbaFromRgb(ringOuterRgb, 0.09 + 0.14 * ringGlow));
        ringGrad.addColorStop(1, rgbaFromRgb(ringOuterRgb, 0));
        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(vp.cx, vp.cy, photonOuter, 0, Math.PI * 2);
        ctx.fill();

        const horizonGlow = ctx.createRadialGradient(vp.cx, vp.cy, 0, vp.cx, vp.cy, vp.shadowR * 2.7);
        horizonGlow.addColorStop(0, "rgba(0,0,0,1)");
        horizonGlow.addColorStop(0.4, "rgba(2,6,23,0.95)");
        horizonGlow.addColorStop(0.78, "rgba(2,6,23,0.45)");
        horizonGlow.addColorStop(1, "rgba(2,6,23,0)");
        ctx.fillStyle = horizonGlow;
        ctx.beginPath();
        ctx.arc(vp.cx, vp.cy, vp.shadowR * 2.7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#010105";
        ctx.beginPath();
        ctx.arc(vp.cx, vp.cy, vp.shadowR, 0, Math.PI * 2);
        ctx.fill();

        if (frame.phase === "memory_core" || frame.phase === "reload") {
            drawMemoryCore(frame, vp);
            drawPolarJets(frame, vp);
        }

        const rimRgb = mixRgb([56, 189, 248], vp.spinDir >= 0 ? [99, 102, 241] : [244, 114, 182], 0.22 + 0.55 * vp.spinMag);
        ctx.strokeStyle = rgbaFromRgb(rimRgb, 0.20 + 0.35 * vp.tempNorm);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(vp.cx, vp.cy, vp.shadowR * 1.02, 0, Math.PI * 2);
        ctx.stroke();
    }

    function drawMemoryCore(frame, vp) {
        const pulseBase = frame.phase === "reload"
            ? 0.55 + 0.45 * Math.sin(Math.PI * frame.phaseProgress)
            : 0.55 + 0.45 * Math.sin(state.time * 0.008 + frame.phaseProgress * Math.PI * 2);
        const pulse = clamp(pulseBase, 0, 1);
        const coreR = lerp(vp.shadowR * 0.08, vp.shadowR * 0.22, pulse);
        const glowR = vp.shadowR * lerp(0.9, 1.8, pulse);
        const posCore = [34, 211, 238];
        const negCore = [244, 114, 182];
        const phaseCore = frame.phase === "reload" ? [251, 191, 36] : [59, 130, 246];
        const spinTint = mixRgb(posCore, negCore, vp.spinDir < 0 ? vp.coreColorMix : 0);
        const coreGlowRgb = mixRgb(phaseCore, spinTint, 0.38 + 0.44 * vp.coreColorMix);
        const coreHaloRgb = mixRgb([59, 130, 246], spinTint, 0.28 + 0.32 * vp.coreInCoreTint);

        const glow = ctx.createRadialGradient(vp.cx, vp.cy, 0, vp.cx, vp.cy, glowR);
        glow.addColorStop(0, "rgba(255,255,255,0.96)");
        glow.addColorStop(0.2, rgbaFromRgb(coreGlowRgb, 0.74 + 0.12 * pulse));
        glow.addColorStop(0.55, rgbaFromRgb(coreHaloRgb, 0.18 + 0.10 * vp.coreInCoreTint));
        glow.addColorStop(1, rgbaFromRgb(coreHaloRgb, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(vp.cx, vp.cy, glowR, 0, Math.PI * 2);
        ctx.fill();

        const coreFillRgb = mixRgb([255, 255, 255], spinTint, 0.18 + 0.22 * vp.spinMag);
        ctx.fillStyle = rgbaFromRgb(coreFillRgb, 0.95);
        ctx.beginPath();
        ctx.arc(vp.cx, vp.cy, coreR, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawPolarJets(frame, vp) {
        const amp = frame.phase === "reload"
            ? 0.3 + 0.9 * Math.sin(Math.PI * frame.phaseProgress)
            : 0.2 + 0.35 * (0.5 + 0.5 * Math.sin(state.time * 0.01));
        const len = vp.shadowR * (2.3 + 1.7 * amp + 0.8 * vp.spinMag);
        const width = vp.shadowR * (0.12 + 0.08 * amp + 0.03 * vp.spinMag);
        const jetBaseRgb = vp.spinDir >= 0 ? [34, 211, 238] : [244, 114, 182];
        const jetMidRgb = mixRgb([59, 130, 246], jetBaseRgb, 0.35 + 0.45 * vp.spinMag);

        for (let s = -1; s <= 1; s += 2) {
            const grad = ctx.createLinearGradient(vp.cx, vp.cy, vp.cx, vp.cy + s * len);
            grad.addColorStop(0, rgbaFromRgb(jetBaseRgb, 0.18 + 0.24 * amp + 0.10 * vp.spinMag));
            grad.addColorStop(0.45, rgbaFromRgb(jetMidRgb, 0.07 + 0.13 * amp));
            grad.addColorStop(1, rgbaFromRgb(jetMidRgb, 0));

            ctx.save();
            ctx.translate(vp.cx, vp.cy);
            ctx.rotate(vp.jetAxisAngle + 0.06 * Math.sin(state.time * 0.0016 + s));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(-width, 0);
            ctx.quadraticCurveTo(-width * 0.22, s * len * 0.25, -width * 0.55, s * len);
            ctx.lineTo(width * 0.55, s * len);
            ctx.quadraticCurveTo(width * 0.22, s * len * 0.25, width, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    function drawLensingArcs(frame, vp) {
        const strength = vp.lensingStrength;
        if (strength <= 0.02) return;

        ctx.save();
        ctx.translate(vp.cx, vp.cy);
        ctx.lineCap = "round";

        for (let i = 0; i < 4; i += 1) {
            const baseR = vp.photonR * (1.08 + i * 0.14);
            const wobble = 1 + 0.03 * Math.sin(state.time * 0.001 + i * 1.7);
            const alpha = (0.04 + 0.04 * strength) * (1 - i / 5) * (0.6 + 0.4 * vp.tempNorm);
            ctx.strokeStyle = "rgba(147,197,253," + alpha.toFixed(3) + ")";
            ctx.lineWidth = 1.0 + 0.35 * (1 - i / 4);
            ctx.beginPath();
            ctx.arc(0, 0, baseR * wobble, -0.25 * Math.PI + i * 0.22, 1.15 * Math.PI + i * 0.17);
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawVignette(vp) {
        const vignette = ctx.createRadialGradient(vp.cx, vp.cy, vp.shadowR * 0.6, vp.cx, vp.cy, Math.max(vp.w, vp.h) * 0.68);
        vignette.addColorStop(0, "rgba(0,0,0,0)");
        vignette.addColorStop(0.68, "rgba(0,0,0,0.14)");
        vignette.addColorStop(1, "rgba(0,0,0,0.42)");
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, vp.w, vp.h);

        ctx.fillStyle = "rgba(255,255,255,0.018)";
        for (let y = 0; y < vp.h; y += 3) {
            ctx.fillRect(0, y, vp.w, 1);
        }
    }

    function drawScene(frame) {
        if (!frame) {
            ctx.fillStyle = "#010207";
            ctx.fillRect(0, 0, state.width, state.height);
            return;
        }

        const vp = visualParams(frame);
        drawBackground(frame, vp);
        drawStars(frame, vp);
        drawDiskLayer(frame, vp, false);
        drawLensingArcs(frame, vp);
        drawBlackHole(frame, vp);
        drawDiskLayer(frame, vp, true);
        drawVignette(vp);
    }

    function setText(el, text) {
        if (el) el.textContent = text;
    }

    function phaseLabel(frame) {
        if (!frame) return "Idle";
        if (frame.phase === "reload") return "Reload / Accretion Bridge";
        if (frame.phase === "memory_core") return "Memory Core (Remnant)";
        return "Evaporation";
    }

    function storyCaption(frame) {
        if (!frame) return "Load a cycle sequence to begin the black-hole story view.";

        const cycleStr = "Cycle " + (frame.cycleIndex + 1) + " of " + frame.cycleCount;
        if (frame.phase === "evaporation") {
            return cycleStr + ": sigma_P-regularized evaporation is visualized as shrinking horizon scale, shifting glow, and increasing radiation bookkeeping. Disk beaming and jet-axis tilt are now also coupled to a spin signal (imported trace if available, otherwise a toy spin track).";
        }
        if (frame.phase === "memory_core") {
            return cycleStr + ": the semi-classical module has reached the effective remnant. In the Zander-2025 picture, this is shown as a finite memory core (not a final terminal endpoint).";
        }
        return (
            cycleStr +
            " -> Cycle " + ((frame.nextCycleIndex || frame.cycleIndex + 1) + 1) +
            ": a short visual reload bridge marks re-loading/spin-up from the memory core before a new evaporation run begins."
        );
    }

    function updateHUD(frame) {
        if (!frame) {
            setText(dom.hudCycle, "0 / 0");
            setText(dom.hudPhase, "Idle");
            setText(dom.hudFrame, "0 / 0");
            return;
        }

        const cycleLabel = frame.phase === "reload" && Number.isInteger(frame.nextCycleIndex)
            ? (frame.cycleIndex + 1) + " -> " + (frame.nextCycleIndex + 1) + " / " + frame.cycleCount
            : (frame.cycleIndex + 1) + " / " + frame.cycleCount;

        setText(dom.hudCycle, cycleLabel);
        setText(dom.hudPhase, phaseLabel(frame));
        setText(dom.hudFrame, (frame.frameIndex + 1) + " / " + frame.frameCount);

        const mpMass = frame.M / engine.MP;
        setText(dom.hudMass, fmtExp(frame.M, 2) + " kg");
        setText(dom.hudMassSub, "~ " + fmtScalar(mpMass, "M_P", 2) + " | scene preset: " + (PRESET_LABELS[frame.preset] || frame.preset));

        setText(dom.hudTemp, fmtExp(frame.TH, 2) + " K");
        const spinTag = (frame.spinSource === "imported" ? "spin:import" : "spin:toy");
        const aStarHud = Number.isFinite(frame.aStar) ? Number(frame.aStar) : 0;
        setText(
            dom.hudTempSub,
            "norm " + frame.tempNorm.toFixed(3) + " | a* " + (aStarHud >= 0 ? "+" : "") + aStarHud.toFixed(3) + " | " + spinTag
        );

        setText(dom.hudRs, fmtExp(frame.rs, 2) + " m");
        setText(dom.hudSigmaEntropy, frame.sigmaNorm.toFixed(3) + " (norm)");
        setText(dom.hudQmEntropy, frame.qmNorm.toFixed(3) + " (toy)");
        setText(dom.hudTau, fmtSeconds(frame.tauEff));

        setText(dom.storyCaption, storyCaption(frame));
        setText(dom.timelineReadout, "frame " + (frame.frameIndex + 1) + " / " + frame.frameCount + "  |  " + phaseLabel(frame));
    }

    function syncTimelineSlider() {
        if (!dom.timelineSlider || !state.story) return;
        dom.timelineSlider.max = String(Math.max(0, state.story.frames.length - 1));
        dom.timelineSlider.value = String(clamp(Math.round(state.frameIndex), 0, state.story.frames.length - 1));
    }

    function setFrameIndex(index, syncSlider) {
        if (!state.story || !state.story.frames.length) return;
        state.frameIndex = clamp(Math.round(index), 0, state.story.frames.length - 1);
        state.playheadFloat = state.frameIndex;
        if (syncSlider !== false) syncTimelineSlider();
        updateHUD(getCurrentFrame());
    }

    function stepFrame(delta) {
        if (!state.story || !state.story.frames.length) return;
        const next = clamp(state.frameIndex + delta, 0, state.story.frames.length - 1);
        setFrameIndex(next, true);
        if (next >= state.story.frames.length - 1 && delta > 0) {
            state.playing = false;
            if (dom.playPauseBtn) dom.playPauseBtn.textContent = "Play";
        }
    }

    function refreshDataSourceStatus() {
        if (state.sourceMode === "json" && state.importedPayload) {
            const filePart = state.importedFileName ? " (" + state.importedFileName + ")" : "";
            setDataSourceStatus(
                "Source: Imported JSON" + filePart + " | physics sliders are display-only until you switch back to Browser Model.",
                "import"
            );
            return;
        }
        setDataSourceStatus("Source: Browser model (live sigma_P wrapper)", "browser");
    }

    function saveCurrentFramePng() {
        if (!dom.canvas) return;
        const frame = getCurrentFrame();
        const cyc = frame ? ("c" + String(frame.cycleIndex + 1).padStart(2, "0")) : "c00";
        const idx = frame ? ("f" + String(frame.frameIndex + 1).padStart(4, "0")) : "f0000";
        const phase = frame ? String(frame.phase || "frame").replace(/[^a-z0-9_-]+/gi, "_") : "frame";
        const filename = "qf-bh-cinema-" + cyc + "-" + phase + "-" + idx + ".png";

        if (typeof dom.canvas.toBlob === "function") {
            dom.canvas.toBlob(function (blob) {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                a.click();
                window.setTimeout(function () { URL.revokeObjectURL(url); }, 400);
            }, "image/png");
            return;
        }

        const a = document.createElement("a");
        a.href = dom.canvas.toDataURL("image/png");
        a.download = filename;
        a.click();
    }

    function applyImportedPayload(payload, fileName) {
        state.importedPayload = payload;
        state.importedFileName = String(fileName || "");
        state.sourceMode = "json";
        refreshDataSourceStatus();
        rebuildScenario();
    }

    function switchToBrowserModel() {
        state.sourceMode = "browser";
        state.importedPayload = null;
        state.importedFileName = "";
        refreshDataSourceStatus();
        rebuildScenario();
    }

    function loadJsonFromSelectedFile() {
        const input = dom.jsonImportInput;
        if (!input || !input.files || input.files.length === 0) {
            setDataSourceStatus("No JSON file selected.", "error");
            return;
        }

        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function () {
            try {
                const raw = typeof reader.result === "string" ? reader.result : "";
                const payload = JSON.parse(raw);
                applyImportedPayload(payload, file.name);
            } catch (err) {
                const msg = err && err.message ? err.message : String(err);
                setDataSourceStatus("Failed to load JSON: " + msg, "error");
            }
        };
        reader.onerror = function () {
            setDataSourceStatus("Failed to read selected file.", "error");
        };
        reader.readAsText(file);
    }

    function rebuildScenario() {
        const cfg = readControls();
        try {
            state.story = state.sourceMode === "json" && state.importedPayload
                ? buildStoryFromImportedPayload(state.importedPayload, cfg)
                : buildCyclicStory(cfg);
            refreshDataSourceStatus();
        } catch (err) {
            state.story = buildCyclicStory(cfg);
            state.sourceMode = "browser";
            state.importedPayload = null;
            state.importedFileName = "";
            const msg = err && err.message ? err.message : String(err);
            setDataSourceStatus("Import error, fell back to Browser model: " + msg, "error");
        }
        state.frameIndex = 0;
        state.playheadFloat = 0;
        syncTimelineSlider();
        updateHUD(getCurrentFrame());
    }

    function scheduleRebuild() {
        if (!dom.autoRebuildToggle || !dom.autoRebuildToggle.checked) return;
        if (state.autoRebuildTimer) window.clearTimeout(state.autoRebuildTimer);
        state.autoRebuildTimer = window.setTimeout(function () {
            state.autoRebuildTimer = 0;
            rebuildScenario();
        }, 90);
    }

    function togglePlayback() {
        state.playing = !state.playing;
        if (dom.playPauseBtn) dom.playPauseBtn.textContent = state.playing ? "Pause" : "Play";
        if (state.playing) state.lastTs = 0;
    }

    function wireControls() {
        updateCustomMassVisibility();
        updateReadouts();

        if (dom.massPreset) {
            dom.massPreset.addEventListener("change", function () {
                updateCustomMassVisibility();
                scheduleRebuild();
            });
        }
        if (dom.customMassInput) {
            dom.customMassInput.addEventListener("change", scheduleRebuild);
        }

        const rebuildInputs = [
            dom.cyclesInput,
            dom.cycleStartFactorInput,
            dom.remnantFactorInput,
            dom.alphaInput,
            dom.gammaInput,
            dom.evapStepsInput,
            dom.qmStepsInput
        ];

        const readoutOnlyInputs = [
            dom.playbackSpeedInput,
            dom.lensingInput,
            dom.turbulenceInput
        ];

        for (let i = 0; i < rebuildInputs.length; i += 1) {
            const el = rebuildInputs[i];
            if (!el) continue;
            el.addEventListener("input", function () {
                updateReadouts();
                scheduleRebuild();
            });
            el.addEventListener("change", function () {
                updateReadouts();
                scheduleRebuild();
            });
        }

        for (let i = 0; i < readoutOnlyInputs.length; i += 1) {
            const el = readoutOnlyInputs[i];
            if (!el) continue;
            el.addEventListener("input", updateReadouts);
            el.addEventListener("change", updateReadouts);
        }

        if (dom.autoRebuildToggle) {
            dom.autoRebuildToggle.addEventListener("change", function () {
                if (dom.autoRebuildToggle.checked) rebuildScenario();
            });
        }

        if (dom.rebuildBtn) {
            dom.rebuildBtn.addEventListener("click", function () {
                rebuildScenario();
            });
        }
        if (dom.saveFrameBtn) {
            dom.saveFrameBtn.addEventListener("click", saveCurrentFramePng);
        }
        if (dom.playPauseBtn) {
            dom.playPauseBtn.addEventListener("click", togglePlayback);
        }
        if (dom.stepBtn) {
            dom.stepBtn.addEventListener("click", function () {
                state.playing = false;
                if (dom.playPauseBtn) dom.playPauseBtn.textContent = "Play";
                stepFrame(1);
            });
        }

        if (dom.timelineSlider) {
            dom.timelineSlider.addEventListener("input", function () {
                state.playing = false;
                if (dom.playPauseBtn) dom.playPauseBtn.textContent = "Play";
                setFrameIndex(Number.parseInt(dom.timelineSlider.value, 10) || 0, false);
                syncTimelineSlider();
            });
        }

        if (dom.loadJsonBtn) {
            dom.loadJsonBtn.addEventListener("click", loadJsonFromSelectedFile);
        }
        if (dom.useBrowserModelBtn) {
            dom.useBrowserModelBtn.addEventListener("click", switchToBrowserModel);
        }
        if (dom.jsonImportInput) {
            dom.jsonImportInput.addEventListener("change", function () {
                if (!dom.autoRebuildToggle || !dom.autoRebuildToggle.checked) return;
                if (dom.jsonImportInput.files && dom.jsonImportInput.files.length > 0) {
                    loadJsonFromSelectedFile();
                }
            });
        }
    }

    function tick(ts) {
        resizeCanvas();

        if (state.lastTs === 0) state.lastTs = ts;
        const dt = clamp(ts - state.lastTs, 0, 80);
        state.lastTs = ts;
        state.time += dt;

        if (state.playing && state.story && state.story.frames.length > 1) {
            const playbackSpeed = parsePositive(dom.playbackSpeedInput ? dom.playbackSpeedInput.value : 1, 1);
            const fpsBase = 28;
            state.playheadFloat += (dt / 1000) * fpsBase * playbackSpeed;
            if (state.playheadFloat >= state.story.frames.length) {
                state.playheadFloat = state.story.frames.length - 1;
                state.playing = false;
                if (dom.playPauseBtn) dom.playPauseBtn.textContent = "Play";
            }

            const nextIdx = clamp(Math.floor(state.playheadFloat), 0, state.story.frames.length - 1);
            if (nextIdx !== state.frameIndex) {
                state.frameIndex = nextIdx;
                syncTimelineSlider();
                updateHUD(getCurrentFrame());
            }
        }

        drawScene(getCurrentFrame());
        state.rafId = window.requestAnimationFrame(tick);
    }

    function handleResize() {
        resizeCanvas();
    }

    function boot() {
        wireControls();
        resizeCanvas();
        refreshDataSourceStatus();
        rebuildScenario();
        if (dom.playPauseBtn) dom.playPauseBtn.textContent = "Pause";

        window.addEventListener("resize", handleResize);
        state.rafId = window.requestAnimationFrame(tick);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
