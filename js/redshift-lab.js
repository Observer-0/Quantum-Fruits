/**
 * js/redshift-lab.js
 * ------------------------
 * Implementation of the Redshift Validation logic.
 * Transforms UTC simulation data into z-values and matches against constraints.
 */

const Physics = {
    lp: 1.616e-35,
    c: 2.99792458e8,
    H_SNe: 73.0,
    H_CMB: 67.4
};

function generateHData() {
    const z = [];
    const H = [];
    const jerk = [];

    // Simulate a smoothed oscillatory H(z) curve
    // In a real UTC sim, this comes from the integration.
    // For the UI, we generate the predicted curve:
    // H(z) approaches 67 at high z and hits 73 at z=0.
    for (let i = 0; i <= 50; i++) {
        const valZ = (i / 50) * 2.5;
        z.push(valZ);

        // Characteristic curve: H(z) = 70 + 3 * cos(z) - log(1+z)
        // This is a schematic representation of the 'breathing' phase
        const valH = 70 + 3.2 * Math.cos(valZ * 1.5) - Math.log(1 + valZ);
        H.push(valH);
    }

    // Calculate Jerk (Gradient)
    for (let i = 1; i < H.length; i++) {
        const dH = H[i] - H[i - 1];
        const dz = z[i] - z[i - 1];
        jerk.push(dH / (H[i] * dz));
    }

    return { z, H, jerk: [0, ...jerk] };
}

function updateValidationCharts() {
    const data = generateHData();

    // 1. H(z) Plot
    const traceMod = {
        x: data.z,
        y: data.H,
        name: 'UTC Model Pred.',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#10b981', width: 4 }
    };

    const traceSH0ES = {
        x: [0.05],
        y: [73.2],
        error_y: { type: 'data', array: [1.3], visible: true },
        name: 'SH0ES (SNe Ia)',
        type: 'scatter',
        mode: 'markers',
        marker: { color: '#f43f5e', size: 10 }
    };

    const traceBAO = {
        x: [1.5],
        y: [69.5],
        error_y: { type: 'data', array: [2.5], visible: true },
        name: 'Quasars / BAO',
        type: 'scatter',
        mode: 'markers',
        marker: { color: '#a78bfa', size: 10 }
    };

    const traceCMB = {
        x: [0, 2.5],
        y: [67.4, 67.4],
        name: 'Planck CMB (ΛCDM)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#3b82f6', dash: 'dash', width: 2 }
    };

    const layoutH = {
        title: { text: 'Hubble Parameter H(z)', font: { color: '#fff' } },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { title: 'Redshift z', gridcolor: 'rgba(255,255,255,0.05)', tickfont: { color: '#94a3b8' }, autorange: 'reversed' },
        yaxis: { title: 'H [km/s/Mpc]', gridcolor: 'rgba(255,255,255,0.05)', tickfont: { color: '#94a3b8' } },
        showlegend: true,
        legend: { font: { color: '#94a3b8' }, bgcolor: 'rgba(0,0,0,0.5)' },
        margin: { t: 50, b: 50, l: 50, r: 20 }
    };

    Plotly.newPlot('hz-plot', [traceMod, traceSH0ES, traceBAO, traceCMB], layoutH, { displayModeBar: false });

    // 2. Jerk Plot
    const traceJerk = {
        x: data.z,
        y: data.jerk,
        name: 'Rel. Jerk',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#f59e0b', width: 2 },
        fill: 'tozeroy'
    };

    const layoutJ = {
        title: { text: 'Relative Jerk Parameter', font: { color: '#fff' } },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { title: 'Redshift z', gridcolor: 'rgba(255,255,255,0.05)', tickfont: { color: '#94a3b8' }, autorange: 'reversed' },
        yaxis: { title: 'Rel. Jerk', gridcolor: 'rgba(255,255,255,0.05)', tickfont: { color: '#94a3b8' } },
        margin: { t: 50, b: 50, l: 50, r: 20 }
    };

    Plotly.newPlot('jerk-plot', [traceJerk], layoutJ, { displayModeBar: false });

    // Update Stats
    const H_73_si = 73.0 * (1000 / 3.086e22);
    const H_67_si = 67.0 * (1000 / 3.086e22);
    const chi_73 = Math.pow(Math.pow(H_73_si, 2) / Math.pow(Physics.c, 2), 2) * Math.pow(Physics.lp, 4);
    const chi_67 = Math.pow(Math.pow(H_67_si, 2) / Math.pow(Physics.c, 2), 2) * Math.pow(Physics.lp, 4);

    document.getElementById('val-chi-73').innerText = chi_73.toExponential(2);
    document.getElementById('val-chi-67').innerText = chi_67.toExponential(2);
    document.getElementById('val-ratio').innerText = (chi_73 / chi_67).toFixed(4);
}

document.addEventListener('DOMContentLoaded', updateValidationCharts);
