<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli("localhost", "root", "", "getkeja");

    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($id <= 0) {
        echo json_encode(["success" => false, "message" => "Property id is required."]);
        exit;
    }

    // ---- Property ----
    $stmt = $conn->prepare("SELECT * FROM properties WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $property = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$property) {
        echo json_encode(["success" => false, "message" => "Property not found."]);
        exit;
    }

    $property['images'] = json_decode($property['images'] ?? '[]', true) ?: [];
    $property['amenities'] = json_decode($property['amenities'] ?? '[]', true) ?: [];
    $property['house_rules'] = json_decode($property['house_rules'] ?? '[]', true) ?: [];
    $property['nearby'] = json_decode($property['nearby'] ?? '{}', true) ?: (object)[];
    $property['featured'] = (bool)$property['featured'];

    // ---- Landlord info ----
    $stmt = $conn->prepare("SELECT id, full_name, email, phone, role FROM users WHERE id = ?");
    $stmt->bind_param("i", $property['landlord_id']);
    $stmt->execute();
    $landlord = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if ($landlord) {
        $landlord['is_verified'] = $landlord['role'] === 'verified_landlord';
    }
    $property['landlord'] = $landlord ?: null;

    // ---- Units ----
    $stmt = $conn->prepare("SELECT * FROM property_units WHERE property_id = ? ORDER BY id ASC");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $units = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    $property['units'] = $units;

    // ---- Active reviews ----
    $stmt = $conn->prepare(
        "SELECT r.*, u.full_name AS tenant_name
         FROM reviews r
         JOIN users u ON u.id = r.tenant_id
         WHERE r.property_id = ? AND r.status = 'active'
         ORDER BY r.created_at DESC"
    );
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $reviews = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    $property['reviews'] = $reviews;

    // ---- Increment view count (fire and forget) ----
    $update = $conn->prepare("UPDATE properties SET views_count = views_count + 1 WHERE id = ?");
    $update->bind_param("i", $id);
    $update->execute();
    $update->close();

    $conn->close();

    echo json_encode(["success" => true, "data" => $property]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Internal Server Error: " . $e->getMessage()
    ]);
}
?>
