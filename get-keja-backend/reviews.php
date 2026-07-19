<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(0); }

function recalcRating($conn, $propertyId) {
    $stmt = $conn->prepare(
        "SELECT AVG(rating) AS avg_r, COUNT(*) AS cnt FROM reviews WHERE property_id = ? AND status = 'active'"
    );
    $stmt->bind_param("i", $propertyId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $avg = $row['avg_r'] !== null ? round((float)$row['avg_r'], 2) : 0;
    $cnt = (int)$row['cnt'];

    $update = $conn->prepare("UPDATE properties SET average_rating = ?, reviews_count = ? WHERE id = ?");
    $update->bind_param("dii", $avg, $cnt, $propertyId);
    $update->execute();
    $update->close();
}

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli("localhost", "root", "", "getkeja");

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $tenantId = isset($_GET['tenant_id']) ? (int)$_GET['tenant_id'] : 0;
        $landlordId = isset($_GET['landlord_id']) ? (int)$_GET['landlord_id'] : 0;

        if ($tenantId > 0) {
            $stmt = $conn->prepare(
                "SELECT r.*, p.name AS property_name
                 FROM reviews r
                 JOIN properties p ON p.id = r.property_id
                 WHERE r.tenant_id = ?
                 ORDER BY r.created_at DESC"
            );
            $stmt->bind_param("i", $tenantId);
        } elseif ($landlordId > 0) {
            $stmt = $conn->prepare(
                "SELECT r.*, p.name AS property_name, u.full_name AS tenant_name
                 FROM reviews r
                 JOIN properties p ON p.id = r.property_id
                 JOIN users u ON u.id = r.tenant_id
                 WHERE p.landlord_id = ? AND r.status = 'active'
                 ORDER BY r.created_at DESC"
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

        foreach ($rows as &$r) { $r['photos'] = json_decode($r['photos'] ?? '[]', true) ?: []; }
        echo json_encode(["success" => true, "data" => $rows]);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) { $data = []; }

    // Landlord replies to a review on one of their own properties
    if (($data['action'] ?? '') === 'reply') {
        $id = (int)($data['id'] ?? 0);
        $landlordId = (int)($data['landlord_id'] ?? 0);
        $reply = trim($data['reply'] ?? '');

        if ($id <= 0 || $landlordId <= 0 || $reply === '') {
            echo json_encode(["success" => false, "message" => "id, landlord_id, and reply are required."]);
            exit;
        }

        $check = $conn->prepare(
            "SELECT r.id FROM reviews r
             JOIN properties p ON p.id = r.property_id
             WHERE r.id = ? AND p.landlord_id = ?"
        );
        $check->bind_param("ii", $id, $landlordId);
        $check->execute();
        $owned = $check->get_result()->fetch_assoc();
        $check->close();

        if (!$owned) {
            echo json_encode(["success" => false, "message" => "Review not found or not on one of your properties."]);
            exit;
        }

        $update = $conn->prepare("UPDATE reviews SET landlord_reply = ?, replied_at = NOW() WHERE id = ?");
        $update->bind_param("si", $reply, $id);
        $update->execute();
        $update->close();
        $conn->close();

        echo json_encode(["success" => true]);
        exit;
    }

    // Delete a review
    if (($data['action'] ?? '') === 'delete') {
        $id = (int)($data['id'] ?? 0);
        $stmt = $conn->prepare("SELECT property_id FROM reviews WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($row) {
            $del = $conn->prepare("DELETE FROM reviews WHERE id = ?");
            $del->bind_param("i", $id);
            $del->execute();
            $del->close();
            recalcRating($conn, $row['property_id']);
        }
        $conn->close();
        echo json_encode(["success" => true]);
        exit;
    }

    // Submit (insert or update) a review
    $propertyId = (int)($data['property_id'] ?? 0);
    $tenantId = (int)($data['tenant_id'] ?? 0);
    $rating = (int)($data['rating'] ?? 0);
    $body = $data['body'] ?? '';
    $photos = json_encode($data['photos'] ?? []);

    if ($propertyId <= 0 || $tenantId <= 0 || $rating < 1 || $rating > 5) {
        echo json_encode(["success" => false, "message" => "Valid property_id, tenant_id, and rating (1-5) are required."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id FROM reviews WHERE property_id = ? AND tenant_id = ?");
    $stmt->bind_param("ii", $propertyId, $tenantId);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($existing) {
        $update = $conn->prepare("UPDATE reviews SET rating = ?, body = ?, photos = ?, status = 'active' WHERE id = ?");
        $update->bind_param("issi", $rating, $body, $photos, $existing['id']);
        $update->execute();
        $update->close();
    } else {
        $insert = $conn->prepare(
            "INSERT INTO reviews (property_id, tenant_id, rating, body, photos, status) VALUES (?, ?, ?, ?, ?, 'active')"
        );
        $insert->bind_param("iiiss", $propertyId, $tenantId, $rating, $body, $photos);
        $insert->execute();
        $insert->close();
    }

    recalcRating($conn, $propertyId);
    $conn->close();

    echo json_encode(["success" => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
