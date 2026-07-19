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

    $userId = (int)($data['user_id'] ?? 0);
    $propertyId = (int)($data['property_id'] ?? 0);

    if ($userId <= 0 || $propertyId <= 0) {
        echo json_encode(["success" => false, "message" => "user_id and property_id are required."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id FROM favorites WHERE user_id = ? AND property_id = ?");
    $stmt->bind_param("ii", $userId, $propertyId);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($existing) {
        $existingId = (int)$existing['id'];
        $del = $conn->prepare("DELETE FROM favorites WHERE id = ?");
        $del->bind_param("i", $existingId);
        $del->execute();
        $del->close();
        $favorited = false;
    } else {
        $ins = $conn->prepare("INSERT INTO favorites (user_id, property_id) VALUES (?, ?)");
        $ins->bind_param("ii", $userId, $propertyId);
        $ins->execute();
        $ins->close();
        $favorited = true;
    }
    $conn->close();

    echo json_encode(["success" => true, "favorited" => $favorited]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
