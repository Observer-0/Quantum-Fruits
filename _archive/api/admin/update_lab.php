<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once dirname(__DIR__) . '/db.php';

function qf_read_payload(): array
{
    $raw = file_get_contents('php://input');
    if (is_string($raw) && trim($raw) !== '') {
        $json = json_decode($raw, true);
        if (is_array($json)) {
            return $json;
        }
    }
    return $_POST;
}

function qf_must_string(array $data, string $field): string
{
    if (!array_key_exists($field, $data)) {
        throw new InvalidArgumentException("Missing field: {$field}");
    }
    $value = trim((string)$data[$field]);
    if ($value === '') {
        throw new InvalidArgumentException("Empty field: {$field}");
    }
    return $value;
}

function qf_optional_string(array $data, string $field): ?string
{
    if (!array_key_exists($field, $data)) {
        return null;
    }
    $value = trim((string)$data[$field]);
    return $value === '' ? null : $value;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'method_not_allowed', 'message' => 'Use POST']);
        exit;
    }

    $payload = qf_read_payload();

    $key = qf_must_string($payload, 'key');
    $id = qf_must_string($payload, 'id');
    $title = qf_must_string($payload, 'title');
    $lab = qf_must_string($payload, 'lab');
    $description = qf_must_string($payload, 'description');

    $theory = qf_optional_string($payload, 'theory');
    $python = qf_optional_string($payload, 'python');
    $icon = qf_optional_string($payload, 'icon');
    $badge = qf_optional_string($payload, 'badge');
    $accent = qf_optional_string($payload, 'accent');
    $textColor = qf_optional_string($payload, 'text_color');
    if ($textColor === null) {
        $textColor = qf_optional_string($payload, 'textColor');
    }

    $sortOrder = 999;
    if (array_key_exists('sort_order', $payload)) {
        $sortOrder = (int)$payload['sort_order'];
    }

    $pdo = qf_connect_db();
    qf_ensure_schema($pdo);
    qf_seed_if_empty($pdo);

    $stmt = $pdo->prepare(
        'UPDATE labs
         SET id = :id,
             title = :title,
             lab = :lab,
             theory = :theory,
             python = :python,
             description = :description,
             icon = :icon,
             badge = :badge,
             accent = :accent,
             text_color = :text_color,
             sort_order = :sort_order
         WHERE key = :key'
    );

    $stmt->execute([
        ':key' => $key,
        ':id' => $id,
        ':title' => $title,
        ':lab' => $lab,
        ':theory' => $theory,
        ':python' => $python,
        ':description' => $description,
        ':icon' => $icon,
        ':badge' => $badge,
        ':accent' => $accent,
        ':text_color' => $textColor,
        ':sort_order' => $sortOrder,
    ]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'not_found', 'message' => "Unknown key: {$key}"]);
        exit;
    }

    echo json_encode(['ok' => true, 'updated_key' => $key], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_payload', 'message' => $e->getMessage()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'update_failed', 'message' => $e->getMessage()]);
}
