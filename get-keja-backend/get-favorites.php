<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(0); }

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli("localhost", "root", "", "getkeja");

    $userId = (int)($_GET['user_id'] ?? 0);
    if ($userId <= 0) {
        echo json_encode(["success" => false, "message" => "user_id is required."]);
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT p.*, f.id AS favorite_id, f.created_at AS favorited_at
         FROM favorites f
         JOIN properties p ON p.id = f.property_id
         WHERE f.user_id = ?
         ORDER BY f.created_at DESC"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    $conn->close();

    foreach ($rows as &$r) {
        $r['images'] = json_decode($r['images'] ?? '[]', true) ?: [];
        $r['amenities'] = json_decode($r['amenities'] ?? '[]', true) ?: [];
        $r['house_rules'] = json_decode($r['house_rules'] ?? '[]', true) ?: [];
        $r['nearby'] = json_decode($r['nearby'] ?? '{}', true) ?: (object)[];
        $r['featured'] = (bool)$r['featured'];
    }

    echo json_encode(["success" => true, "data" => $rows]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
