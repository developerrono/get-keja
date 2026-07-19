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
        $action = $_GET['action'] ?? '';

        if ($action === 'list_conversations') {
            $userId = (int)($_GET['user_id'] ?? 0);
            if ($userId <= 0) {
                echo json_encode(["success" => false, "message" => "user_id is required."]);
                exit;
            }

            $stmt = $conn->prepare(
                "SELECT c.*, p.name AS property_name, p.cover_image,
                        t.full_name AS tenant_name, l.full_name AS landlord_name
                 FROM conversations c
                 LEFT JOIN properties p ON p.id = c.property_id
                 JOIN users t ON t.id = c.tenant_id
                 JOIN users l ON l.id = c.landlord_id
                 WHERE c.tenant_id = ? OR c.landlord_id = ?
                 ORDER BY c.last_message_at DESC"
            );
            $stmt->bind_param("ii", $userId, $userId);
            $stmt->execute();
            $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            $conn->close();
            echo json_encode(["success" => true, "data" => $rows]);
            exit;
        }

        if ($action === 'list_messages') {
            $conversationId = (int)($_GET['conversation_id'] ?? 0);
            if ($conversationId <= 0) {
                echo json_encode(["success" => false, "message" => "conversation_id is required."]);
                exit;
            }

            $stmt = $conn->prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC");
            $stmt->bind_param("i", $conversationId);
            $stmt->execute();
            $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            $conn->close();
            echo json_encode(["success" => true, "data" => $rows]);
            exit;
        }

        echo json_encode(["success" => false, "message" => "Unknown action."]);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) { $data = []; }
    $action = $data['action'] ?? '';

    if ($action === 'get_or_create_conversation') {
        $tenantId = (int)($data['tenant_id'] ?? 0);
        $landlordId = (int)($data['landlord_id'] ?? 0);
        $propertyId = (isset($data['property_id']) && $data['property_id'] !== null) ? (int)$data['property_id'] : null;

        if ($tenantId <= 0 || $landlordId <= 0) {
            echo json_encode(["success" => false, "message" => "tenant_id and landlord_id are required."]);
            exit;
        }

        // The conversations_unique key covers (tenant_id, landlord_id,
        // property_id), but NULL isn't matched by a plain `= ?` — so branch
        // explicitly on whether property_id was actually given.
        if ($propertyId === null) {
            $stmt = $conn->prepare(
                "SELECT * FROM conversations WHERE tenant_id = ? AND landlord_id = ? AND property_id IS NULL"
            );
            $stmt->bind_param("ii", $tenantId, $landlordId);
        } else {
            $stmt = $conn->prepare(
                "SELECT * FROM conversations WHERE tenant_id = ? AND landlord_id = ? AND property_id = ?"
            );
            $stmt->bind_param("iii", $tenantId, $landlordId, $propertyId);
        }
        $stmt->execute();
        $convo = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$convo) {
            $ins = $conn->prepare(
                "INSERT INTO conversations (tenant_id, landlord_id, property_id) VALUES (?, ?, ?)"
            );
            $ins->bind_param("iii", $tenantId, $landlordId, $propertyId);
            $ins->execute();
            $newId = $ins->insert_id;
            $ins->close();

            $stmt = $conn->prepare("SELECT * FROM conversations WHERE id = ?");
            $stmt->bind_param("i", $newId);
            $stmt->execute();
            $convo = $stmt->get_result()->fetch_assoc();
            $stmt->close();
        }
        $conn->close();
        echo json_encode(["success" => true, "data" => $convo]);
        exit;
    }

    if ($action === 'send_message') {
        $conversationId = (int)($data['conversation_id'] ?? 0);
        $senderId = (int)($data['sender_id'] ?? 0);
        $body = $data['body'] ?? null;
        $imageUrl = $data['image_url'] ?? null;

        if ($conversationId <= 0 || $senderId <= 0) {
            echo json_encode(["success" => false, "message" => "conversation_id and sender_id are required."]);
            exit;
        }

        $stmt = $conn->prepare(
            "INSERT INTO messages (conversation_id, sender_id, body, image_url) VALUES (?, ?, ?, ?)"
        );
        $stmt->bind_param("iiss", $conversationId, $senderId, $body, $imageUrl);
        $stmt->execute();
        $stmt->close();

        $upd = $conn->prepare("UPDATE conversations SET last_message_at = NOW() WHERE id = ?");
        $upd->bind_param("i", $conversationId);
        $upd->execute();
        $upd->close();
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
