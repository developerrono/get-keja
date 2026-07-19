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

    $token = $data['token'] ?? '';
    $password = $data['password'] ?? '';

    if ($token === '' || strlen($password) < 6) {
        echo json_encode(["success" => false, "message" => "A valid token and a password of at least 6 characters are required."]);
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW()"
    );
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $reset = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$reset) {
        echo json_encode(["success" => false, "message" => "This reset link is invalid or has expired."]);
        exit;
    }

    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $userId = (int)$reset['user_id'];
    $resetId = (int)$reset['id'];

    $upd = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
    $upd->bind_param("si", $hashed, $userId);
    $upd->execute();
    $upd->close();

    $mark = $conn->prepare("UPDATE password_resets SET used = 1 WHERE id = ?");
    $mark->bind_param("i", $resetId);
    $mark->execute();
    $mark->close();

    $conn->close();
    echo json_encode(["success" => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
