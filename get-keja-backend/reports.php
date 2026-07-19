<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(0); }

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli("localhost", "root", "", "getkeja");

    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) { $data = []; }

    $reporterId = (int)($data['reporter_id'] ?? 0);
    $targetType = $data['target_type'] ?? '';
    $targetId = (int)($data['target_id'] ?? 0);
    $category = $data['category'] ?? '';
    $description = $data['description'] ?? null;

    if ($reporterId <= 0 || $targetType === '' || $targetId <= 0 || $category === '') {
        echo json_encode(["success" => false, "message" => "reporter_id, target_type, target_id, and category are required."]);
        exit;
    }

    $stmt = $conn->prepare(
        "INSERT INTO reports (reporter_id, target_type, target_id, category, description) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("isiss", $reporterId, $targetType, $targetId, $category, $description);
    $stmt->execute();
    $stmt->close();
    $conn->close();

    echo json_encode(["success" => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
