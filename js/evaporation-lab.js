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
        pageChart: document.getElementById("pageChart"),
        scanMetric: document.getElementById("scanMetric"),
        scanGrid: document.getElementById("scanGrid"),
        scanAlphaMin: document.getElementById("scanAlphaMin"),
        scanAlphaMax: document.getElementById("scanAlphaMax"),
        scanGammaMin: document.getElementById("scanGammaMin"),
        scanGammaMax: document.getElementById("scanGammaMax"),
        scanRunButton: document.getElementById("scanRunButton"),
        scanCanvas: document.getElementById("scanCanvas"),
        scanLegendMin: document.getElementById("scanLegendMin"),
        scanLegendMax: document.getElementById("scanLegendMax"),
        scanReadout: document.getElementById("scanReadout")
    };

    if (!dom.runButton || !dom.scanCanvas) return;

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
        mode: "normalized",
        scanMetric: "tau_years",
        scanGrid: "16",
        scanAlphaMin: 0.1,
        scanAlphaMax: 10.0,
        scanGammaMin: 0.0,
        scanGammaMax: 5.0
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
        timer: null,
        scan: {
            values: null,
            meta: null,
            plot: null,
            summary: "Heatmap not computed yet.",
            busy: false
        }
    };

    function parsePositive(value, fallback) {
        const parsed = Number.parseFloat(String(value).replace(",", "."));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    }

    function parseFinite(value, fallback) {
        const parsed = Number.parseFloat(String(value).replace(",", "."));
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function clamp(v, min, max) {
        return Math.min(max, Math.max(min, v));
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
        if (state.scan.values) drawScanHeatmap();
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
        drawScanHeatmap();
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
        dom.scanMetric.value = defaults.scanMetric;
        dom.scanGrid.value = defaults.scanGrid;
        dom.scanAlphaMin.value = String(defaults.scanAlphaMin);
        dom.scanAlphaMax.value = String(defaults.scanAlphaMax);
        dom.scanGammaMin.value = String(defaults.scanGammaMin);
        dom.scanGammaMax.value = String(defaults.scanGammaMax);
        toggleCustomMass();
        updateReadouts();
        runSimulation();
    }

    function interpolateColor(a, b, t) {
        return [
            Math.round(a[0] + (b[0] - a[0]) * t),
            Math.round(a[1] + (b[1] - a[1]) * t),
            Math.round(a[2] + (b[2] - a[2]) * t)
        ];
    }

    function heatColor(norm) {
        const t = clamp(norm, 0, 1);
        const stops = [
            { p: 0.0, c: [15, 23, 42] },
            { p: 0.22, c: [30, 64, 175] },
            { p: 0.42, c: [41, 142, 212] },
            { p: 0.62, c: [34, 197, 94] },
            { p: 0.82, c: [245, 158, 11] },
            { p: 1.0, c: [239, 68, 68] }
        ];

        for (let i = 0; i < stops.length - 1; i += 1) {
            const left = stops[i];
            const right = stops[i + 1];
            if (t >= left.p && t <= right.p) {
                const local = (t - left.p) / Math.max(right.p - left.p, 1e-9);
                const rgb = interpolateColor(left.c, right.c, local);
                return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
            }
        }

        const end = stops[stops.length - 1].c;
        return `rgb(${end[0]}, ${end[1]}, ${end[2]})`;
    }

    function resizeScanCanvas() {
        const rect = dom.scanCanvas.getBoundingClientRect();
        const width = Math.max(320, Math.round(rect.width || 320));
        const height = Math.max(220, Math.round(rect.height || 320));
        const dpr = window.devicePixelRatio || 1;
        dom.scanCanvas.width = Math.round(width * dpr);
        dom.scanCanvas.height = Math.round(height * dpr);
        const ctx = dom.scanCanvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { ctx, width, height };
    }

    function getMetricLabel(metric) {
        return metric === "srem_kb" ? "S_rem / kB" : "tau_eff [years]";
    }

    function drawScanPlaceholder(message) {
        const { ctx, width, height } = resizeScanCanvas();
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "rgba(2, 6, 23, 0.92)";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "rgba(148, 163, 184, 0.25)";
        ctx.strokeRect(10, 10, width - 20, height - 20);
        ctx.fillStyle = "#dbeafe";
        ctx.font = "600 14px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(message, width * 0.5, height * 0.5);
    }

    function alphaAt(col, meta) {
        if (meta.grid <= 1) return meta.alphaMin;
        return meta.alphaMin + (col / (meta.grid - 1)) * (meta.alphaMax - meta.alphaMin);
    }

    function gammaAtRow(row, meta) {
        if (meta.grid <= 1) return meta.gammaMax;
        return meta.gammaMax - (row / (meta.grid - 1)) * (meta.gammaMax - meta.gammaMin);
    }

    function updateScanLegend(minVal, maxVal, metric) {
        const suffix = metric === "srem_kb" ? "" : " y";
        dom.scanLegendMin.textContent = `min: ${formatExp(minVal, 2)}${suffix}`;
        dom.scanLegendMax.textContent = `max: ${formatExp(maxVal, 2)}${suffix}`;
    }

    function drawScanHeatmap() {
        if (!state.scan.values || !state.scan.meta) {
            drawScanPlaceholder(state.scan.summary);
            return;
        }

        const { values, meta } = state.scan;
        const { ctx, width, height } = resizeScanCanvas();
        const left = 58;
        const right = 18;
        const top = 26;
        const bottom = 44;
        const plotWidth = Math.max(width - left - right, 10);
        const plotHeight = Math.max(height - top - bottom, 10);
        const cellWidth = plotWidth / meta.grid;
        const cellHeight = plotHeight / meta.grid;
        const span = Math.max(meta.max - meta.min, 1e-99);

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "rgba(2, 6, 23, 0.97)";
        ctx.fillRect(0, 0, width, height);

        for (let row = 0; row < meta.grid; row += 1) {
            for (let col = 0; col < meta.grid; col += 1) {
                const value = values[row][col];
                const norm = (value - meta.min) / span;
                ctx.fillStyle = heatColor(norm);
                ctx.fillRect(
                    left + col * cellWidth,
                    top + row * cellHeight,
                    Math.ceil(cellWidth),
                    Math.ceil(cellHeight)
                );
            }
        }

        ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
        ctx.lineWidth = 1;
        ctx.strokeRect(left, top, plotWidth, plotHeight);

        ctx.strokeStyle = "rgba(148, 163, 184, 0.13)";
        for (let i = 1; i < meta.grid; i += 1) {
            const x = left + i * cellWidth;
            const y = top + i * cellHeight;
            ctx.beginPath();
            ctx.moveTo(x, top);
            ctx.lineTo(x, top + plotHeight);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(left, y);
            ctx.lineTo(left + plotWidth, y);
            ctx.stroke();
        }

        ctx.fillStyle = "#dbeafe";
        ctx.font = "600 12px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(getMetricLabel(meta.metric), left, 14);

        ctx.font = "500 11px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#cbd5e1";
        ctx.textAlign = "center";
        ctx.fillText("alpha", left + plotWidth * 0.5, height - 8);
        ctx.textAlign = "right";
        ctx.fillText(formatExp(meta.alphaMin, 2), left + 2, height - 8);
        ctx.textAlign = "left";
        ctx.fillText(formatExp(meta.alphaMax, 2), left + plotWidth - 28, height - 8);

        ctx.save();
        ctx.translate(14, top + plotHeight * 0.5);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = "center";
        ctx.fillStyle = "#cbd5e1";
        ctx.fillText("gamma", 0, 0);
        ctx.restore();

        ctx.textAlign = "right";
        ctx.fillStyle = "#cbd5e1";
        ctx.fillText(formatExp(meta.gammaMax, 2), left - 6, top + 8);
        ctx.fillText(formatExp(meta.gammaMin, 2), left - 6, top + plotHeight);

        const currAlpha = parsePositive(dom.alphaRange.value, defaults.alpha);
        const currGamma = Math.max(parseFinite(dom.gammaRange.value, defaults.gamma), 0);
        const alphaSpan = Math.max(meta.alphaMax - meta.alphaMin, 1e-99);
        const gammaSpan = Math.max(meta.gammaMax - meta.gammaMin, 1e-99);
        const normX = (currAlpha - meta.alphaMin) / alphaSpan;
        const normY = (meta.gammaMax - currGamma) / gammaSpan;

        if (normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1) {
            const cx = left + normX * plotWidth;
            const cy = top + normY * plotHeight;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(cx - 8, cy);
            ctx.lineTo(cx + 8, cy);
            ctx.moveTo(cx, cy - 8);
            ctx.lineTo(cx, cy + 8);
            ctx.stroke();
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.beginPath();
            ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        state.scan.plot = { left, top, plotWidth, plotHeight, cellWidth, cellHeight };
        updateScanLegend(meta.min, meta.max, meta.metric);
    }

    function writeScanSummary() {
        dom.scanReadout.textContent = state.scan.summary;
    }

    function handleScanHover(event) {
        if (!state.scan.values || !state.scan.meta || !state.scan.plot) return;
        const rect = dom.scanCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const { left, top, plotWidth, plotHeight, cellWidth, cellHeight } = state.scan.plot;

        if (x < left || x > left + plotWidth || y < top || y > top + plotHeight) {
            writeScanSummary();
            return;
        }

        const col = clamp(Math.floor((x - left) / cellWidth), 0, state.scan.meta.grid - 1);
        const row = clamp(Math.floor((y - top) / cellHeight), 0, state.scan.meta.grid - 1);
        const alpha = alphaAt(col, state.scan.meta);
        const gamma = gammaAtRow(row, state.scan.meta);
        const value = state.scan.values[row][col];
        const label = state.scan.meta.metric === "srem_kb"
            ? `S_rem/kB=${formatExp(value, 2)}`
            : `tau_eff=${formatExp(value, 2)} y`;

        dom.scanReadout.textContent = `alpha=${alpha.toFixed(3)} | gamma=${gamma.toFixed(3)} | ${label}`;
    }

    async function runScan() {
        if (!state.results || state.scan.busy) return;

        const params = getParams();
        let alphaMin = Math.max(parseFinite(dom.scanAlphaMin.value, defaults.scanAlphaMin), 0);
        let alphaMax = Math.max(parseFinite(dom.scanAlphaMax.value, defaults.scanAlphaMax), 0);
        let gammaMin = Math.max(parseFinite(dom.scanGammaMin.value, defaults.scanGammaMin), 0);
        let gammaMax = Math.max(parseFinite(dom.scanGammaMax.value, defaults.scanGammaMax), 0);
        if (alphaMax <= alphaMin) alphaMax = alphaMin + 1e-6;
        if (gammaMax <= gammaMin) gammaMax = gammaMin + 1e-6;

        const grid = clamp(Math.round(parseFinite(dom.scanGrid.value, 16)), 6, 28);
        const metric = dom.scanMetric.value === "srem_kb" ? "srem_kb" : "tau_years";
        const metricLabel = getMetricLabel(metric);
        const scanSteps = Math.max(220, Math.min(820, Math.round(params.nsteps * 0.45)));

        state.scan.busy = true;
        dom.scanRunButton.disabled = true;
        dom.scanRunButton.textContent = "Scanning...";
        state.scan.summary = `Scanning ${grid}x${grid} ...`;
        writeScanSummary();

        try {
            const values = Array.from({ length: grid }, () => new Array(grid).fill(0));
            let minVal = Infinity;
            let maxVal = -Infinity;

            for (let row = 0; row < grid; row += 1) {
                const gamma = gammaAtRow(row, { gammaMin, gammaMax, grid });
                for (let col = 0; col < grid; col += 1) {
                    const alpha = alphaAt(col, { alphaMin, alphaMax, grid });
                    const q = engine.simulateQuantized(params.M0, scanSteps, params.Mrem, alpha, gamma);
                    const value = metric === "srem_kb" ? q.Srem / engine.kB : q.tau_eff / engine.year;
                    values[row][col] = value;
                    minVal = Math.min(minVal, value);
                    maxVal = Math.max(maxVal, value);
                }

                state.scan.summary = `Scanning row ${row + 1}/${grid} ...`;
                writeScanSummary();
                if ((row % 2) === 0) {
                    // Keep UI responsive while scanning.
                    await new Promise((resolve) => setTimeout(resolve, 0));
                }
            }

            state.scan.values = values;
            state.scan.meta = {
                metric,
                metricLabel,
                alphaMin,
                alphaMax,
                gammaMin,
                gammaMax,
                grid,
                min: minVal,
                max: maxVal
            };
            state.scan.summary = `Scan ready (${metricLabel}) | alpha ${alphaMin.toFixed(2)}..${alphaMax.toFixed(2)} | gamma ${gammaMin.toFixed(2)}..${gammaMax.toFixed(2)}.`;
            drawScanHeatmap();
            writeScanSummary();
        } finally {
            state.scan.busy = false;
            dom.scanRunButton.disabled = false;
            dom.scanRunButton.textContent = "Run Scan";
        }
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
    dom.resetButton.addEventListener("click", () => {
        applyDefaults();
        runScan();
    });

    dom.scanRunButton.addEventListener("click", runScan);
    dom.scanCanvas.addEventListener("mousemove", handleScanHover);
    dom.scanCanvas.addEventListener("mouseleave", writeScanSummary);

    window.addEventListener("resize", () => {
        if (state.scan.values) {
            drawScanHeatmap();
        } else {
            drawScanPlaceholder(state.scan.summary);
        }
    });

    applyDefaults();
    drawScanPlaceholder(state.scan.summary);
    setTimeout(() => {
        runScan();
    }, 120);
})();
