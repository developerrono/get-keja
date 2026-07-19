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
        $landlordId = isset($_GET['landlord_id']) ? (int)$_GET['landlord_id'] : 0;
        if ($landlordId <= 0) {
            echo json_encode(["success" => false, "message" => "landlord_id is required."]);
            exit;
        }

        $stmt = $conn->prepare(
            "SELECT t.*, u.full_name AS tenant_name, u.email AS tenant_email, u.phone AS tenant_phone,
                    p.name AS property_name, pu.label AS unit_label
             FROM tenancies t
             JOIN users u ON u.id = t.tenant_id
             JOIN properties p ON p.id = t.property_id
             LEFT JOIN property_units pu ON pu.id = t.unit_id
             WHERE t.landlord_id = ?
             ORDER BY t.status ASC, t.since_date DESC"
        );
        $stmt->bind_param("i", $landlordId);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        $conn->close();

        foreach ($rows as &$r) {
            $r['monthly_rent'] = (float)$r['monthly_rent'];
            $r['balance'] = (float)$r['balance'];
        }

        echo json_encode(["success" => true, "data" => $rows]);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) { $data = []; }
    $action = $data['action'] ?? '';

    if ($action === 'create') {
        $propertyId = (int)($data['property_id'] ?? 0);
        $unitId = isset($data['unit_id']) && $data['unit_id'] ? (int)$data['unit_id'] : null;
        $tenantId = (int)($data['tenant_id'] ?? 0);
        $tenantEmail = trim($data['tenant_email'] ?? '');
        $landlordId = (int)($data['landlord_id'] ?? 0);
        $sinceDate = $data['since_date'] ?? '';
        $monthlyRent = (float)($data['monthly_rent'] ?? 0);

        if ($tenantId <= 0 && $tenantEmail !== '') {
            $find = $conn->prepare("SELECT id FROM users WHERE email = ?");
            $find->bind_param("s", $tenantEmail);
            $find->execute();
            $foundUser = $find->get_result()->fetch_assoc();
            $find->close();
            if (!$foundUser) {
                echo json_encode(["success" => false, "message" => "No account found with that email. The tenant needs to sign up first."]);
                exit;
            }
            $tenantId = (int)$foundUser['id'];
        }

        if ($propertyId <= 0 || $tenantId <= 0 || $landlordId <= 0 || $sinceDate === '') {
            echo json_encode(["success" => false, "message" => "property_id, tenant_id (or tenant_email), landlord_id, and since_date are required."]);
            exit;
        }

        // Ownership check
        $check = $conn->prepare("SELECT id FROM properties WHERE id = ? AND landlord_id = ?");
        $check->bind_param("ii", $propertyId, $landlordId);
        $check->execute();
        $owned = $check->get_result()->fetch_assoc();
        $check->close();
        if (!$owned) {
            echo json_encode(["success" => false, "message" => "Property not found or not owned by this landlord."]);
            exit;
        }

        $conn->begin_transaction();

        $stmt = $conn->prepare(
            "INSERT INTO tenancies (property_id, unit_id, tenant_id, landlord_id, since_date, monthly_rent, balance, status)
             VALUES (?, ?, ?, ?, ?, ?, 0, 'active')"
        );
        $stmt->bind_param("iiiisd", $propertyId, $unitId, $tenantId, $landlordId, $sinceDate, $monthlyRent);
        $stmt->execute();
        $stmt->close();

        if ($unitId !== null) {
            $upd = $conn->prepare("UPDATE property_units SET is_vacant = 0 WHERE id = ? AND property_id = ?");
            $upd->bind_param("ii", $unitId, $propertyId);
            $upd->execute();
            $upd->close();
        }

        $conn->commit();
        $conn->close();
        echo json_encode(["success" => true]);
        exit;
    }

    if ($action === 'update') {
        $id = (int)($data['id'] ?? 0);
        if ($id <= 0) {
            echo json_encode(["success" => false, "message" => "id is required."]);
            exit;
        }

        $sets = [];
        $types = "";
        $values = [];

        if (array_key_exists('balance', $data)) {
            $sets[] = "balance = ?";
            $types .= "d";
            $values[] = (float)$data['balance'];
        }
        if (array_key_exists('status', $data) && in_array($data['status'], ['active', 'ended'], true)) {
            $sets[] = "status = ?";
            $types .= "s";
            $values[] = $data['status'];
        }

        if (empty($sets)) {
            echo json_encode(["success" => false, "message" => "No updatable fields provided."]);
            exit;
        }

        $sql = "UPDATE tenancies SET " . implode(", ", $sets) . " WHERE id = ?";
        $types .= "i";
        $values[] = $id;

        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$values);
        $stmt->execute();
        $stmt->close();

        // If the tenancy just ended, free up the unit again
        if (($data['status'] ?? null) === 'ended') {
            $find = $conn->prepare("SELECT unit_id, property_id FROM tenancies WHERE id = ?");
            $find->bind_param("i", $id);
            $find->execute();
            $row = $find->get_result()->fetch_assoc();
            $find->close();

            if ($row && $row['unit_id']) {
                $upd = $conn->prepare("UPDATE property_units SET is_vacant = 1 WHERE id = ?");
                $upd->bind_param("i", $row['unit_id']);
                $upd->execute();
                $upd->close();
            }
        }

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
