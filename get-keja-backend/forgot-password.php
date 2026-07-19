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

    $email = trim($data['email'] ?? '');
    if ($email === '') {
        echo json_encode(["success" => false, "message" => "Email is required."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    // Always report success even if the email isn't registered, so this
    // endpoint can't be used to enumerate which emails have accounts.
    if (!$user) {
        $conn->close();
        echo json_encode(["success" => true]);
        exit;
    }

    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
    $userId = (int)$user['id'];

    $ins = $conn->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)");
    $ins->bind_param("iss", $userId, $token, $expiresAt);
    $ins->execute();
    $ins->close();
    $conn->close();

    // No email server is configured in this dev setup, so the frontend
    // shows this link directly instead of sending mail.
    $devLink = "http://localhost:8080/reset-password?token=" . $token;

    echo json_encode(["success" => true, "dev_reset_link" => $devLink]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
