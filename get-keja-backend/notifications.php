<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(0); }

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli("localhost", "root", "", "getkeja");

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $userId = (int)($_GET['user_id'] ?? 0);
        if ($userId <= 0) {
            echo json_encode(["success" => false, "message" => "user_id is required."]);
            exit;
        }

        $stmt = $conn->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        $conn->close();

        foreach ($rows as &$r) { $r['is_read'] = (bool)$r['is_read']; }
        echo json_encode(["success" => true, "data" => $rows]);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) { $data = []; }
    $id = (int)($data['id'] ?? 0);

    if ($id <= 0) {
        echo json_encode(["success" => false, "message" => "id is required."]);
        exit;
    }

    $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();
    $conn->close();

    echo json_encode(["success" => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
