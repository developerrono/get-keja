<?php
// move-in.php
// POST { tenant_id, property_id, landlord_id, monthly_rent, unit_id? }
// Tenant-initiated: creates a tenancy for themselves and marks the chosen
// unit as occupied. Opening balance is set to one month's rent.

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

    foreach (['tenant_id', 'property_id', 'landlord_id', 'monthly_rent'] as $r) {
        if (!isset($data[$r]) || $data[$r] === '') {
            echo json_encode(["success" => false, "message" => "Missing field: $r"]);
            exit;
        }
    }

    $tenantId = (int)$data['tenant_id'];
    $propertyId = (int)$data['property_id'];
    $landlordId = (int)$data['landlord_id'];
    $monthlyRent = (float)$data['monthly_rent'];
    $unitId = isset($data['unit_id']) && $data['unit_id'] ? (int)$data['unit_id'] : null;

    if ($unitId !== null) {
        $check = $conn->prepare("SELECT is_vacant FROM property_units WHERE id = ?");
        $check->bind_param("i", $unitId);
        $check->execute();
        $unit = $check->get_result()->fetch_assoc();
        $check->close();

        if (!$unit) { echo json_encode(["success" => false, "message" => "Unit not found."]); exit; }
        if (!$unit['is_vacant']) { echo json_encode(["success" => false, "message" => "This unit is no longer vacant."]); exit; }
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare(
        "INSERT INTO tenancies (property_id, unit_id, tenant_id, landlord_id, since_date, monthly_rent, balance, status)
         VALUES (?, ?, ?, ?, CURDATE(), ?, ?, 'active')"
    );
    $stmt->bind_param("iiiidd", $propertyId, $unitId, $tenantId, $landlordId, $monthlyRent, $monthlyRent);
    $stmt->execute();
    $newId = $stmt->insert_id;
    $stmt->close();

    if ($unitId !== null) {
        $upd = $conn->prepare("UPDATE property_units SET is_vacant = 0 WHERE id = ?");
        $upd->bind_param("i", $unitId);
        $upd->execute();
        $upd->close();
    }

    $conn->commit();
    $conn->close();

    echo json_encode(["success" => true, "id" => (string)$newId]);

} catch (Exception $e) {
    if (isset($conn) && $conn->ping()) { $conn->rollback(); }
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
