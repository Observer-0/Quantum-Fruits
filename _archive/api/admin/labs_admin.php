<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once dirname(__DIR__) . '/db.php';

try {
    $pdo = qf_connect_db();
    qf_ensure_schema($pdo);
    qf_seed_if_empty($pdo);

    $stmt = $pdo->query(
        'SELECT key, id, title, lab, theory, python, description, icon, badge, accent, text_color, sort_order
         FROM labs
         ORDER BY sort_order ASC, key ASC'
    );

    $rows = $stmt->fetchAll();
    echo json_encode(
        ['labs' => $rows],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT
    );
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(
        [
            'error' => 'labs_admin_list_failed',
            'message' => $e->getMessage(),
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
}
