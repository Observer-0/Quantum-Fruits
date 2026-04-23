<?php
declare(strict_types=1);

function qf_db_path(): string
{
    return dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'quantum_fruits.sqlite';
}

function qf_connect_db(): PDO
{
    $dbPath = qf_db_path();
    $dbDir = dirname($dbPath);

    if (!is_dir($dbDir)) {
        mkdir($dbDir, 0777, true);
    }

    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    return $pdo;
}

function qf_ensure_schema(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS labs (
            key TEXT PRIMARY KEY,
            id TEXT NOT NULL,
            title TEXT NOT NULL,
            lab TEXT NOT NULL,
            theory TEXT,
            python TEXT,
            description TEXT NOT NULL,
            icon TEXT,
            badge TEXT,
            accent TEXT,
            text_color TEXT,
            sort_order INTEGER NOT NULL DEFAULT 999
        )'
    );
}

function qf_seed_if_empty(PDO $pdo): void
{
    $count = (int)$pdo->query('SELECT COUNT(*) FROM labs')->fetchColumn();
    if ($count > 0) {
        return;
    }

    $seed = [
        ['motor', 'LAB-001', 'Kinematic Motor', 'motor.html', 'theory.html#quantum', 'py/kinematic_motor_sim.py', 'Action-tick dynamics (N=E*t/hbar) linking quantum action flow to macroscopic braking in the model.', '⚙️', 'Kinematic Model', '#38bdf8', '#000', 1],
        ['galaxy', 'LAB-002', 'Galaxy Rotation', 'galaxy_lab.html', 'theory.html#galaxies', 'py/physics_engine.py', 'Galaxy-rotation fits in a sigma_P coupling model (without a dark-matter term in this setup).', '🌀', 'Rotation Fit', '#10b981', '#000', 2],
        ['hubble', 'LAB-011', 'Cosmic Breathing', 'hubble_flow_lab.html', 'theory.html#cosmology', 'py/Unified_Hubble_Tension.py', 'Explores Hubble-tension diagnostics with phase sampling and observed |H0| magnitudes.', '🪐', 'Cosmology Diagnostic', '#fbbf24', '#000', 3],
        ['lattice', 'LAB-004', 'URM Lattice', 'lattice_lab.html', 'theory.html#quantum', 'py/quantum_fruits_sim.py', 'Discrete spacetime-action lattice model used as a numerical framework.', '🕸️', 'Lattice Model', '#a855f7', '#fff', 4],
        ['evaporation', 'LAB-006', 'Evaporation Lab', 'evaporation_lab.html', 'theory.html#blackholes', 'py/sigmaP_evaporation_refined.py', 'Models unitary black-hole decay and its implications for information retention.', '🕳️', 'Evaporation Model', '#fbbf24', '#000', 5],
        ['bh_cinema', 'LAB-014', 'BH Cinema Lab', 'bh_cinema_lab.html', 'theory.html#blackholes', 'py/physics_engine.py', 'Cinematic black-hole visualization driven by sigma_P evaporation cycles and remnant-memory transitions.', 'BH', 'Visual Story Lab', '#22d3ee', '#001018', 6],
        ['entropy', 'LAB-008', 'Entropy Holo-Lab', 'entropy_lab.html', 'theory.html#blackholes', 'py/Info_Paradox2.py', 'Visualizes holographic entropy proxies and information-density scaling.', '📊', 'Entropy Diagnostic', '#f43f5e', '#fff', 7],
        ['answer42', 'INF-042', 'The Answer is 42', 'theory.html#library', 'theory.html#library', 'py/answer_42.py', 'Douglas Adams easter egg (The Answer is 42), not a physics model.', '🌌', 'Douglas Adams Meme', '#38bdf8', '#000', 8],
        ['dipole', 'LAB-013', 'Cosmic Dipole', 'dipole_lab.html', 'theory.html#cosmology', 'py/UTC_Redshift_Validation.py', 'Examines a reported 3.7x velocity excess under a spacetime-grid friction hypothesis.', '🧭', 'Dipole Hypothesis', '#818cf8', '#fff', 9],
    ];

    $stmt = $pdo->prepare(
        'INSERT INTO labs (
            key, id, title, lab, theory, python, description, icon, badge, accent, text_color, sort_order
        ) VALUES (
            :key, :id, :title, :lab, :theory, :python, :description, :icon, :badge, :accent, :text_color, :sort_order
        )'
    );

    foreach ($seed as $row) {
        $stmt->execute([
            ':key' => $row[0],
            ':id' => $row[1],
            ':title' => $row[2],
            ':lab' => $row[3],
            ':theory' => $row[4],
            ':python' => $row[5],
            ':description' => $row[6],
            ':icon' => $row[7],
            ':badge' => $row[8],
            ':accent' => $row[9],
            ':text_color' => $row[10],
            ':sort_order' => $row[11],
        ]);
    }
}
