<?php
// verify-otp.php
// POST { user_id, channel: "phone"|"email", code }
// Verifies the most recent unexpired OTP for this user/channel. On success,
// marks it verified and stamps users.phone_verified_at / email_verified_at.

ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(0); }

const MAX_ATTEMPTS = 5;

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli("localhost", "root", "", "getkeja");

    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) { $data = []; }

    $userId = (int)($data['user_id'] ?? 0);
    $channel = $data['channel'] ?? '';
    $code = trim($data['code'] ?? '');

    if ($userId <= 0 || !in_array($channel, ['phone', 'email'], true) || $code === '') {
        echo json_encode(["success" => false, "message" => "user_id, channel, and code are required."]);
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT id, code_hash, attempts, expires_at FROM otp_codes
         WHERE user_id = ? AND channel = ? AND verified_at IS NULL
         ORDER BY created_at DESC LIMIT 1"
    );
    $stmt->bind_param("is", $userId, $channel);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        echo json_encode(["success" => false, "message" => "No pending code found. Request a new one."]);
        exit;
    }

    if (strtotime($row['expires_at']) < time()) {
        echo json_encode(["success" => false, "message" => "That code has expired. Request a new one."]);
        exit;
    }

    if ((int)$row['attempts'] >= MAX_ATTEMPTS) {
        echo json_encode(["success" => false, "message" => "Too many attempts. Request a new code."]);
        exit;
    }

    if (!password_verify($code, $row['code_hash'])) {
        $upd = $conn->prepare("UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?");
        $upd->bind_param("i", $row['id']);
        $upd->execute();
        $upd->close();
        echo json_encode(["success" => false, "message" => "Incorrect code."]);
        exit;
    }

    $conn->begin_transaction();

    $upd = $conn->prepare("UPDATE otp_codes SET verified_at = NOW() WHERE id = ?");
    $upd->bind_param("i", $row['id']);
    $upd->execute();
    $upd->close();

    $column = $channel === 'phone' ? 'phone_verified_at' : 'email_verified_at';
    $userUpd = $conn->prepare("UPDATE users SET $column = NOW() WHERE id = ?");
    $userUpd->bind_param("i", $userId);
    $userUpd->execute();
    $userUpd->close();

    $conn->commit();
    $conn->close();

    echo json_encode(["success" => true, "message" => ucfirst($channel) . " verified."]);

} catch (Exception $e) {
    if (isset($conn) && $conn->ping()) { $conn->rollback(); }
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
