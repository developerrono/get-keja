<?php
// move-in.php
// POST { tenant_id, property_id, landlord_id, monthly_rent, unit_id?, checkout_request_id }
// Tenant-initiated: creates a tenancy for themselves and marks the chosen
// unit as occupied — but ONLY after a successful M-Pesa payment.
//
// Flow: the frontend first calls mpesa-stk-push.php, waits for the
// transaction to reach status='success' (via mpesa-query.php), and only
// then calls this endpoint with that transaction's checkout_request_id.
// This guarantees payment happens before a unit is claimed.

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

    foreach (['tenant_id', 'property_id', 'landlord_id', 'monthly_rent', 'checkout_request_id'] as $r) {
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
    $checkoutRequestId = $data['checkout_request_id'];

    // ---- Verify payment actually succeeded before doing anything else ----
    $txStmt = $conn->prepare(
        "SELECT id, status, tenancy_id, amount FROM transactions
         WHERE checkout_request_id = ? AND tenant_id = ? AND property_id = ?"
    );
    $txStmt->bind_param("sii", $checkoutRequestId, $tenantId, $propertyId);
    $txStmt->execute();
    $tx = $txStmt->get_result()->fetch_assoc();
    $txStmt->close();

    if (!$tx) {
        echo json_encode(["success" => false, "message" => "We couldn't find that payment. Please try paying again."]);
        exit;
    }
    if ($tx['status'] !== 'success') {
        echo json_encode(["success" => false, "message" => "Payment hasn't been confirmed yet. Please wait for the M-Pesa confirmation before moving in."]);
        exit;
    }
    if ($tx['tenancy_id'] !== null) {
        echo json_encode(["success" => false, "message" => "This payment has already been used to create a tenancy."]);
        exit;
    }

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
    // Opening balance = one month's rent minus what was just paid.
    $openingBalance = max($monthlyRent - (float)$tx['amount'], 0);
    $stmt->bind_param("iiiidd", $propertyId, $unitId, $tenantId, $landlordId, $monthlyRent, $openingBalance);
    $stmt->execute();
    $newId = $stmt->insert_id;
    $stmt->close();

    if ($unitId !== null) {
        // Re-check + flip atomically inside the same transaction so two
        // tenants racing to move into the same unit can't both succeed —
        // whichever COMMITs first wins; the loser's UPDATE below affects 0
        // rows and we roll back.
        $upd = $conn->prepare("UPDATE property_units SET is_vacant = 0 WHERE id = ? AND is_vacant = 1");
        $upd->bind_param("i", $unitId);
        $upd->execute();
        $affected = $upd->affected_rows;
        $upd->close();

        if ($affected === 0) {
            $conn->rollback();
            echo json_encode(["success" => false, "message" => "This unit was just taken by someone else. Your payment is safe — contact support to apply it elsewhere."]);
            exit;
        }
    }

    // Link the transaction to the new tenancy so it can't be reused.
    $linkTx = $conn->prepare("UPDATE transactions SET tenancy_id = ? WHERE id = ?");
    $linkTx->bind_param("ii", $newId, $tx['id']);
    $linkTx->execute();
    $linkTx->close();

    $conn->commit();
    $conn->close();

    echo json_encode(["success" => true, "id" => (string)$newId]);

} catch (Exception $e) {
    if (isset($conn) && $conn->ping()) { $conn->rollback(); }
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
