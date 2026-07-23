<?php
// my-tenancy.php
// GET ?tenant_id=...
// Returns the calling tenant's own tenancies (active and ended), newest first.

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

    $tenantId = isset($_GET['tenant_id']) ? (int)$_GET['tenant_id'] : 0;
    if ($tenantId <= 0) {
        echo json_encode(["success" => false, "message" => "Missing tenant_id"]);
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT t.*, p.name AS property_name, p.cover_image, pu.label AS unit_label
         FROM tenancies t
         LEFT JOIN properties p ON p.id = t.property_id
         LEFT JOIN property_units pu ON pu.id = t.unit_id
         WHERE t.tenant_id = ?
         ORDER BY t.since_date DESC"
    );
    $stmt->bind_param("i", $tenantId);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    $conn->close();

    foreach ($rows as &$r) {
        $r['monthly_rent'] = (float)$r['monthly_rent'];
        $r['balance'] = (float)$r['balance'];
    }

    echo json_encode(["success" => true, "data" => $rows]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
