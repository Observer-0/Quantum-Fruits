<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db.php';

try {
    $pdo = qf_connect_db();
    qf_ensure_schema($pdo);
    qf_seed_if_empty($pdo);

    $stmt = $pdo->query(
        'SELECT key, id, title, lab, theory, python, description, icon, badge, accent, text_color
         FROM labs
         ORDER BY sort_order ASC, key ASC'
    );

    $out = [];
    foreach ($stmt as $row) {
        $key = (string)$row['key'];
        $out[$key] = [
            'id' => (string)$row['id'],
            'title' => (string)$row['title'],
            'lab' => (string)$row['lab'],
            'theory' => $row['theory'] !== null ? (string)$row['theory'] : null,
            'python' => $row['python'] !== null ? (string)$row['python'] : null,
            'description' => (string)$row['description'],
            'icon' => $row['icon'] !== null ? (string)$row['icon'] : '*',
            'badge' => $row['badge'] !== null ? (string)$row['badge'] : null,
            'accent' => $row['accent'] !== null ? (string)$row['accent'] : null,
            'textColor' => $row['text_color'] !== null ? (string)$row['text_color'] : null,
        ];
    }

    echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(
        [
            'error' => 'labs_api_failed',
            'message' => $e->getMessage(),
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
}
