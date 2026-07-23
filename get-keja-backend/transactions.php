<?php
// transactions.php
// GET ?tenant_id=...   -> a tenant's own payment history
// GET ?landlord_id=... -> a landlord's transaction tracker
// GET ?admin=1         -> every transaction, for the admin dashboard

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
    $landlordId = isset($_GET['landlord_id']) ? (int)$_GET['landlord_id'] : 0;
    $admin = isset($_GET['admin']) && $_GET['admin'] === '1';

    if ($admin) {
        $result = $conn->query(
            "SELECT t.*, p.name AS property_name, u.full_name AS tenant_name, l.full_name AS landlord_name
             FROM transactions t
             LEFT JOIN properties p ON p.id = t.property_id
             LEFT JOIN users u ON u.id = t.tenant_id
             LEFT JOIN users l ON l.id = t.landlord_id
             ORDER BY t.created_at DESC"
        );
        $rows = $result->fetch_all(MYSQLI_ASSOC);
    } elseif ($landlordId > 0) {
        $stmt = $conn->prepare(
            "SELECT t.*, p.name AS property_name, u.full_name AS tenant_name
             FROM transactions t
             LEFT JOIN properties p ON p.id = t.property_id
             LEFT JOIN users u ON u.id = t.tenant_id
             WHERE t.landlord_id = ?
             ORDER BY t.created_at DESC"
        );
        $stmt->bind_param("i", $landlordId);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
    } elseif ($tenantId > 0) {
        $stmt = $conn->prepare(
            "SELECT t.*, p.name AS property_name
             FROM transactions t
             LEFT JOIN properties p ON p.id = t.property_id
             WHERE t.tenant_id = ?
             ORDER BY t.created_at DESC"
        );
        $stmt->bind_param("i", $tenantId);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
    } else {
        echo json_encode(["success" => false, "message" => "Missing tenant_id, landlord_id, or admin=1"]);
        exit;
    }

    $conn->close();

    foreach ($rows as &$r) {
        $r['amount'] = (float)$r['amount'];
        $r['admin_fee'] = (float)$r['admin_fee'];
        $r['landlord_amount'] = (float)$r['landlord_amount'];
    }

    echo json_encode(["success" => true, "data" => $rows]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
