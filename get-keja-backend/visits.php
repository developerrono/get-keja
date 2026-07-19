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
        $tenantId = isset($_GET['tenant_id']) ? (int)$_GET['tenant_id'] : 0;
        $landlordId = isset($_GET['landlord_id']) ? (int)$_GET['landlord_id'] : 0;

        if ($tenantId > 0) {
            $stmt = $conn->prepare(
                "SELECT v.*, p.name AS property_name, p.cover_image, p.county, p.estate
                 FROM visits v
                 JOIN properties p ON p.id = v.property_id
                 WHERE v.tenant_id = ?
                 ORDER BY v.scheduled_at DESC"
            );
            $stmt->bind_param("i", $tenantId);
        } elseif ($landlordId > 0) {
            $stmt = $conn->prepare(
                "SELECT v.*, p.name AS property_name, p.cover_image, p.county, p.estate,
                        u.full_name AS tenant_name, u.phone AS tenant_phone
                 FROM visits v
                 JOIN properties p ON p.id = v.property_id
                 JOIN users u ON u.id = v.tenant_id
                 WHERE p.landlord_id = ?
                 ORDER BY v.scheduled_at DESC"
            );
            $stmt->bind_param("i", $landlordId);
        } else {
            echo json_encode(["success" => false, "message" => "tenant_id or landlord_id is required."]);
            exit;
        }

        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        $conn->close();
        echo json_encode(["success" => true, "data" => $rows]);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) { $data = []; }
    $action = $data['action'] ?? '';

    if ($action === 'book') {
        $tenantId = (int)($data['tenant_id'] ?? 0);
        $propertyId = (int)($data['property_id'] ?? 0);
        $unitId = (isset($data['unit_id']) && $data['unit_id'] !== null) ? (int)$data['unit_id'] : null;
        $scheduledAt = $data['scheduled_at'] ?? '';
        $notes = $data['notes'] ?? '';

        if ($tenantId <= 0 || $propertyId <= 0 || $scheduledAt === '') {
            echo json_encode(["success" => false, "message" => "tenant_id, property_id, and scheduled_at are required."]);
            exit;
        }

        $stmt = $conn->prepare(
            "INSERT INTO visits (tenant_id, property_id, unit_id, scheduled_at, notes, status) VALUES (?, ?, ?, ?, ?, 'pending')"
        );
        $stmt->bind_param("iiiss", $tenantId, $propertyId, $unitId, $scheduledAt, $notes);
        $stmt->execute();
        $stmt->close();
        $conn->close();
        echo json_encode(["success" => true]);
        exit;
    }

    if ($action === 'update_status') {
        $id = (int)($data['id'] ?? 0);
        $status = $data['status'] ?? '';
        if ($id <= 0 || $status === '') {
            echo json_encode(["success" => false, "message" => "id and status are required."]);
            exit;
        }
        $stmt = $conn->prepare("UPDATE visits SET status = ? WHERE id = ?");
        $stmt->bind_param("si", $status, $id);
        $stmt->execute();
        $stmt->close();
        $conn->close();
        echo json_encode(["success" => true]);
        exit;
    }

    echo json_encode(["success" => false, "message" => "Unknown action."]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
