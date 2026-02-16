(function () {
    "use strict";

    const engine = window.EvaporationEngine;
    if (!engine || !window.Chart) return;

    const dom = {
        massPreset: document.getElementById("massPreset"),
        customMassWrap: document.getElementById("customMassWrap"),
        customMass: document.getElementById("customMass"),
        alphaRange: document.getElementById("alphaRange"),
        gammaRange: document.getElementById("gammaRange"),
        remRange: document.getElementById("remRange"),
        stepsRange: document.getElementById("stepsRange"),
        alphaValue: document.getElementById("alphaValue"),
        gammaValue: document.getElementById("gammaValue"),
        remValue: document.getElementById("remValue"),
        stepsValue: document.getElementById("stepsValue"),
        modeNormalized: document.getElementById("modeNormalized"),
        modeYears: document.getElementById("modeYears"),
        runButton: document.getElementById("runButton"),
        resetButton: document.getElementById("resetButton"),
        playButton: document.getElementById("playButton"),
        timeline: document.getElementById("timeline"),
        timelineReadout: document.getElementById("timelineReadout"),
        massChart: document.getElementById("massChart"),
        tempChart: document.getElementById("tempChart"),
        entropyChart: document.getElementById("entropyChart"),
        pageChart: document.getElementById("pageChart")
    };

    if (!dom.runButton) return;

    const DATASET_INDEX = {
        mass: { scMarker: 2, qMarker: 3 },
        temp: { scMarker: 3, qMarker: 4 },
        entropy: { bhMarker: 2, radMarker: 3 },
        page: { scMarker: 2, qMarker: 3 }
    };

    const defaults = {
        preset: "pbh",
        customMass: "1e12",
        alpha: 4.0,
        gamma: 1.0,
        remFactor: 1.0,
        nsteps: 1200,
        mode: "normalized"
    };

    const presetMasses = {
        pbh: 1e12,
        stellar: 1.989e31,
        supermassive: 1.989e36
    };

    const state = {
        charts: {
            mass: null,
            temp: null,
            entropy: null,
            page: null
        },
        results: null,
        series: null,
        timer: null
    };

    function parsePositive(value, fallback) {
        const parsed = Number.parseFloat(String(value).replace(",", "."));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    }

    function getTimeMode() {
        return dom.modeYears.checked ? "years" : "normalized";
    }

    function toPoints(x, y) {
        const points = [];
        const n = Math.min(x.length, y.length);
        for (let i = 0; i < n; i += 1) {
            if (Number.isFinite(x[i]) && Number.isFinite(y[i])) {
                points.push({ x: x[i], y: y[i] });
            }
        }
        return points;
    }

    function normalize(arr) {
        let max = 1e-99;
        for (let i = 0; i < arr.length; i += 1) {
            max = Math.max(max, Math.abs(arr[i]));
        }
        return arr.map((v) => v / max);
    }

    function formatExp(value, digits = 2) {
        if (!Number.isFinite(value)) return "n/a";
        return value.toExponential(digits).replace("e+", "e");
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function updateReadouts() {
        dom.alphaValue.textContent = Number(dom.alphaRange.value).toFixed(2);
        dom.gammaValue.textContent = Number(dom.gammaRange.value).toFixed(2);
        dom.remValue.textContent = `${Number(dom.remRange.value).toFixed(2)} MP`;
        dom.stepsValue.textContent = `${Number(dom.stepsRange.value).toFixed(0)} pts`;
    }

    function mapIndex(idxQ, lenQ, lenSc) {
        if (lenSc <= 1 || lenQ <= 1) return 0;
        const frac = idxQ / (lenQ - 1);
        return Math.min(lenSc - 1, Math.max(0, Math.round(frac * (lenSc - 1))));
    }

    function getCurrentIndexQ() {
        if (!state.results) return 0;
        const max = Math.max(state.results.q.t.length - 1, 0);
        const idx = Number.parseInt(dom.timeline.value, 10);
        if (!Number.isFinite(idx)) return 0;
        return Math.max(0, Math.min(max, idx));
    }

    function destroyCharts() {
        Object.keys(state.charts).forEach((key) => {
            if (state.charts[key]) {
                state.charts[key].destroy();
                state.charts[key] = null;
            }
        });
    }

    function makeChart(canvas, datasets, xLabel, yLabel, yType = "linear") {
        return new Chart(canvas.getContext("2d"), {
            type: "line",
            data: { datasets },
            options: {
                parsing: false,
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                interaction: {
                    mode: "nearest",
                    intersect: false
                },
                elements: {
                    line: {
                        tension: 0.2,
                        borderWidth: 2.2
                    },
                    point: {
                        radius: 0
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: "#e2e8f0",
                            filter: (item) => !item.text.startsWith("_")
                        }
                    },
                    tooltip: {
                        mode: "nearest",
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        type: "linear",
                        title: {
                            display: true,
                            text: xLabel,
                            color: "#93c5fd"
                        },
                        ticks: {
                            color: "#cbd5e1",
                            maxTicksLimit: 8
                        },
                        grid: {
                            color: "rgba(148,163,184,0.15)"
                        }
                    },
                    y: {
                        type: yType,
                        title: {
                            display: true,
                            text: yLabel,
                            color: "#93c5fd"
                        },
                        ticks: {
                            color: "#cbd5e1"
                        },
                        grid: {
                            color: "rgba(148,163,184,0.15)"
                        }
                    }
                }
            }
        });
    }

    function computeSeries() {
        const { params, sc, q } = state.results;
        const mode = getTimeMode();
        const xSc = mode === "years"
            ? sc.t.map((v) => v / engine.year)
            : sc.t.map((v) => v / Math.max(sc.tau, 1e-99));
        const xQ = mode === "years"
            ? q.t.map((v) => v / engine.year)
            : q.t.map((v) => v / Math.max(q.tau_eff, 1e-99));

        state.series = {
            xSc,
            xQ,
            xLabel: mode === "years" ? "time [years]" : "normalized time t/tau",
            massSc: sc.M.map((m) => m / params.M0),
            massQ: q.M.map((m) => m / params.M0),
            tempSc: sc.TH.slice(),
            tempQ: q.TH.slice(),
            tempCap: new Array(q.t.length).fill(q.T_max),
            entropyBH: q.S.map((s) => s / engine.kB),
            entropyRad: q.Srad.map((s) => s / engine.kB),
            pageSc: normalize(sc.Srad),
            pageQ: normalize(q.Srad)
        };
    }

    function renderCharts() {
        if (!state.results) return;
        computeSeries();
        const s = state.series;

        destroyCharts();

        state.charts.mass = makeChart(
            dom.massChart,
            [
                {
                    label: "semiclassical M/M0",
                    data: toPoints(s.xSc, s.massSc),
                    borderColor: "#f59e0b"
                },
                {
                    label: "quantized M/M0",
                    data: toPoints(s.xQ, s.massQ),
                    borderColor: "#22d3ee"
                },
                {
                    label: "_marker_sc",
                    data: [],
                    showLine: false,
                    pointRadius: 4.3,
                    pointBackgroundColor: "#f59e0b",
                    pointBorderColor: "#1f2937",
                    pointBorderWidth: 1.2
                },
                {
                    label: "_marker_q",
                    data: [],
                    showLine: false,
                    pointRadius: 4.8,
                    pointBackgroundColor: "#22d3ee",
                    pointBorderColor: "#1f2937",
                    pointBorderWidth: 1.2
                }
            ],
            s.xLabel,
            "mass ratio M/M0"
        );

        state.charts.temp = makeChart(
            dom.tempChart,
            [
                {
                    label: "semiclassical T_H",
                    data: toPoints(s.xSc, s.tempSc),
                    borderColor: "#f97316"
                },
                {
                    label: "quantized T_H",
                    data: toPoints(s.xQ, s.tempQ),
                    borderColor: "#34d399"
                },
                {
                    label: "T_cap",
                    data: toPoints(s.xQ, s.tempCap),
                    borderColor: "#60a5fa",
                    borderDash: [6, 5]
                },
                {
                    label: "_marker_sc",
                    data: [],
                    showLine: false,
                    pointRadius: 4.3,
                    pointBackgroundColor: "#f97316",
                    pointBorderColor: "#1f2937",
                    pointBorderWidth: 1.2
                },
                {
                    label: "_marker_q",
                    data: [],
                    showLine: false,
                    pointRadius: 4.8,
                    pointBackgroundColor: "#34d399",
                    pointBorderColor: "#1f2937",
                    pointBorderWidth: 1.2
                }
            ],
            s.xLabel,
            "temperature [K]",
            "logarithmic"
        );

        state.charts.entropy = makeChart(
            dom.entropyChart,
            [
                {
                    label: "S_BH / kB",
                    data: toPoints(s.xQ, s.entropyBH),
                    borderColor: "#22d3ee"
                },
                {
                    label: "S_rad / kB",
                    data: toPoints(s.xQ, s.entropyRad),
                    borderColor: "#f59e0b"
                },
                {
                    label: "_marker_bh",
                    data: [],
                    showLine: false,
                    pointRadius: 4.7,
                    pointBackgroundColor: "#22d3ee",
                    pointBorderColor: "#1f2937",
                    pointBorderWidth: 1.2
                },
                {
                    label: "_marker_rad",
                    data: [],
                    showLine: false,
                    pointRadius: 4.7,
                    pointBackgroundColor: "#f59e0b",
                    pointBorderColor: "#1f2937",
                    pointBorderWidth: 1.2
                }
            ],
            s.xLabel,
            "entropy (dimensionless)"
        );

        state.charts.page = makeChart(
            dom.pageChart,
            [
                {
                    label: "semiclassical page proxy",
                    data: toPoints(s.xSc, s.pageSc),
                    borderColor: "#fb7185"
                },
                {
                    label: "quantized page proxy",
                    data: toPoints(s.xQ, s.pageQ),
                    borderColor: "#38bdf8"
                },
                {
                    label: "_marker_sc",
                    data: [],
                    showLine: false,
                    pointRadius: 4.3,
                    pointBackgroundColor: "#fb7185",
                    pointBorderColor: "#1f2937",
                    pointBorderWidth: 1.2
                },
                {
                    label: "_marker_q",
                    data: [],
                    showLine: false,
                    pointRadius: 4.8,
                    pointBackgroundColor: "#38bdf8",
                    pointBorderColor: "#1f2937",
                    pointBorderWidth: 1.2
                }
            ],
            s.xLabel,
            "S_rad / S_max"
        );

        updateMarkers();
    }

    function updateSummaryCards() {
        if (!state.results) return;

        const { params, sc, q, diag } = state.results;
        setText("metricTauSc", `${formatExp(sc.tau / engine.year, 2)} y`);
        setText("metricTauScSub", `${formatExp(sc.tau, 2)} s`);
        setText("metricTauEff", `${formatExp(q.tau_eff / engine.year, 2)} y`);
        setText("metricTauEffSub", `${formatExp(q.tau_eff, 2)} s`);
        setText("metricTempCap", `${formatExp(q.T_max, 2)} K`);
        setText("metricSrem", formatExp(q.Srem / engine.kB, 2));
        setText("metricRs", `${formatExp(diag.rs, 2)} m`);
        setText("metricRatio", formatExp(diag.ratio, 2));
        setText("metricNowMass", "1.000 M0");
        setText("metricNowMassSub", `${formatExp(params.M0, 2)} kg`);
        setText("metricNowTime", "0.000 tau");
        setText("metricNowTimeSub", "0.00e0 y");
    }

    function updateTimelineReadout(idxQ) {
        if (!state.results) return;
        const { q } = state.results;
        const t = q.t[idxQ];
        const tau = Math.max(q.tau_eff, 1e-99);
        const frac = t / tau;
        const tYears = t / engine.year;
        dom.timelineReadout.textContent = `frame ${idxQ + 1}/${q.t.length}  |  t/tau=${frac.toFixed(3)}  |  t=${formatExp(tYears, 2)} y`;
    }

    function setMarker(chart, index, x, y) {
        if (!chart || !chart.data?.datasets?.[index]) return;
        if (Number.isFinite(x) && Number.isFinite(y)) {
            chart.data.datasets[index].data = [{ x, y }];
        } else {
            chart.data.datasets[index].data = [];
        }
    }

    function updateMarkers() {
        if (!state.results || !state.series) return;

        const idxQ = getCurrentIndexQ();
        const idxSc = mapIndex(idxQ, state.results.q.t.length, state.results.sc.t.length);
        const s = state.series;
        const { params, q } = state.results;

        setMarker(
            state.charts.mass,
            DATASET_INDEX.mass.scMarker,
            s.xSc[idxSc],
            s.massSc[idxSc]
        );
        setMarker(
            state.charts.mass,
            DATASET_INDEX.mass.qMarker,
            s.xQ[idxQ],
            s.massQ[idxQ]
        );

        setMarker(
            state.charts.temp,
            DATASET_INDEX.temp.scMarker,
            s.xSc[idxSc],
            s.tempSc[idxSc]
        );
        setMarker(
            state.charts.temp,
            DATASET_INDEX.temp.qMarker,
            s.xQ[idxQ],
            s.tempQ[idxQ]
        );

        setMarker(
            state.charts.entropy,
            DATASET_INDEX.entropy.bhMarker,
            s.xQ[idxQ],
            s.entropyBH[idxQ]
        );
        setMarker(
            state.charts.entropy,
            DATASET_INDEX.entropy.radMarker,
            s.xQ[idxQ],
            s.entropyRad[idxQ]
        );

        setMarker(
            state.charts.page,
            DATASET_INDEX.page.scMarker,
            s.xSc[idxSc],
            s.pageSc[idxSc]
        );
        setMarker(
            state.charts.page,
            DATASET_INDEX.page.qMarker,
            s.xQ[idxQ],
            s.pageQ[idxQ]
        );

        Object.keys(state.charts).forEach((key) => {
            if (state.charts[key]) state.charts[key].update("none");
        });

        const tQ = q.t[idxQ];
        const mQ = q.M[idxQ];
        const tau = Math.max(q.tau_eff, 1e-99);
        setText("metricNowTime", `${(tQ / tau).toFixed(3)} tau`);
        setText("metricNowTimeSub", `${formatExp(tQ / engine.year, 2)} y`);
        setText("metricNowMass", `${formatExp(mQ / params.M0, 3)} M0`);
        setText("metricNowMassSub", `${formatExp(mQ, 2)} kg`);

        updateTimelineReadout(idxQ);
    }

    function stopPlayback() {
        if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }
        dom.playButton.textContent = "Play";
    }

    function startPlayback() {
        if (!state.results) return;
        stopPlayback();
        dom.playButton.textContent = "Pause";
        state.timer = setInterval(() => {
            const max = Math.max(state.results.q.t.length - 1, 0);
            let idx = getCurrentIndexQ() + 1;
            if (idx > max) idx = 0;
            dom.timeline.value = String(idx);
            updateMarkers();
        }, 55);
    }

    function togglePlayback() {
        if (state.timer) {
            stopPlayback();
        } else {
            startPlayback();
        }
    }

    function toggleCustomMass() {
        const useCustom = dom.massPreset.value === "custom";
        dom.customMassWrap.style.display = useCustom ? "block" : "none";
    }

    function getParams() {
        const massPreset = dom.massPreset.value;
        const presetMass = presetMasses[massPreset];
        const massFallback = presetMass || presetMasses.pbh;
        const M0 = massPreset === "custom"
            ? parsePositive(dom.customMass.value, massFallback)
            : massFallback;

        const alpha = parsePositive(dom.alphaRange.value, defaults.alpha);
        const gamma = Math.max(parsePositive(dom.gammaRange.value, defaults.gamma), 0.0);
        const remFactor = parsePositive(dom.remRange.value, defaults.remFactor);
        const nsteps = Math.max(200, Math.floor(parsePositive(dom.stepsRange.value, defaults.nsteps)));
        const Mrem = engine.MP * remFactor;

        return { M0, alpha, gamma, remFactor, nsteps, Mrem };
    }

    function runSimulation() {
        const params = getParams();
        const sc = engine.simulateSemiclassical(params.M0, params.nsteps);
        const q = engine.simulateQuantized(params.M0, params.nsteps, params.Mrem, params.alpha, params.gamma);
        const diag = engine.singularityDiagnostics(params.M0);

        state.results = { params, sc, q, diag };

        dom.timeline.max = String(Math.max(q.t.length - 1, 0));
        dom.timeline.value = "0";

        renderCharts();
        updateSummaryCards();
        updateMarkers();
        stopPlayback();
    }

    function applyDefaults() {
        dom.massPreset.value = defaults.preset;
        dom.customMass.value = defaults.customMass;
        dom.alphaRange.value = String(defaults.alpha);
        dom.gammaRange.value = String(defaults.gamma);
        dom.remRange.value = String(defaults.remFactor);
        dom.stepsRange.value = String(defaults.nsteps);
        dom.modeNormalized.checked = defaults.mode === "normalized";
        dom.modeYears.checked = defaults.mode === "years";
        toggleCustomMass();
        updateReadouts();
        runSimulation();
    }

    dom.massPreset.addEventListener("change", () => {
        toggleCustomMass();
        runSimulation();
    });

    dom.customMass.addEventListener("change", runSimulation);
    dom.customMass.addEventListener("keyup", (event) => {
        if (event.key === "Enter") runSimulation();
    });

    [dom.alphaRange, dom.gammaRange, dom.remRange, dom.stepsRange].forEach((el) => {
        el.addEventListener("input", updateReadouts);
        el.addEventListener("change", runSimulation);
    });

    [dom.modeNormalized, dom.modeYears].forEach((el) => {
        el.addEventListener("change", () => {
            if (!state.results) return;
            renderCharts();
        });
    });

    dom.timeline.addEventListener("input", updateMarkers);
    dom.playButton.addEventListener("click", togglePlayback);
    dom.runButton.addEventListener("click", runSimulation);
    dom.resetButton.addEventListener("click", applyDefaults);

    applyDefaults();
})();
