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

    $userId = (int)($data['user_id'] ?? 0);
    if ($userId <= 0) {
        echo json_encode(["success" => false, "message" => "user_id is required."]);
        exit;
    }

    $sets = []; $types = ""; $values = [];
    foreach (['full_name' => 's', 'phone' => 's', 'bio' => 's', 'avatar_url' => 's'] as $field => $type) {
        if (array_key_exists($field, $data)) {
            $sets[] = "$field = ?";
            $types .= $type;
            $values[] = $data[$field];
        }
    }

    if (!empty($sets)) {
        $sql = "UPDATE users SET " . implode(", ", $sets) . " WHERE id = ?";
        $types .= "i";
        $values[] = $userId;
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$values);
        $stmt->execute();
        $stmt->close();
    }

    $stmt = $conn->prepare(
        "SELECT id, full_name, email, role, phone, bio, avatar_url, status, phone_verified_at, email_verified_at FROM users WHERE id = ?"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    $conn->close();

    if (!$user) {
        echo json_encode(["success" => false, "message" => "User not found."]);
        exit;
    }

    $user['id'] = (string)$user['id'];
    $user['fullName'] = $user['full_name'];

    echo json_encode(["success" => true, "user" => $user]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
