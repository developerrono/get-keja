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

    $id = (int)($data['id'] ?? 0);
    $landlordId = (int)($data['landlord_id'] ?? 0);

    if ($id <= 0 || $landlordId <= 0) {
        echo json_encode(["success" => false, "message" => "id and landlord_id are required."]);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM properties WHERE id = ? AND landlord_id = ?");
    $stmt->bind_param("ii", $id, $landlordId);
    $stmt->execute();
    $deleted = $stmt->affected_rows > 0;
    $stmt->close();
    $conn->close();

    if (!$deleted) {
        echo json_encode(["success" => false, "message" => "Property not found or not owned by this landlord."]);
        exit;
    }

    echo json_encode(["success" => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
