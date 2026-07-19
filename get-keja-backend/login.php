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
    $password = $data['password'] ?? '';

    if ($email === '' || $password === '') {
        echo json_encode(["success" => false, "message" => "Email and password are required."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user) {
        echo json_encode(["success" => false, "message" => "Invalid email or password."]);
        exit;
    }

    $stored = $user['password'];
    // Bcrypt hashes always start with $2y$/$2a$/$2b$ — anything else is
    // legacy plaintext seed data (e.g. the demo accounts), so fall back to
    // a direct compare for those instead of rejecting real users.
    if (preg_match('/^\$2[aby]\$/', $stored)) {
        $valid = password_verify($password, $stored);
    } else {
        $valid = hash_equals($stored, $password);
    }

    if (!$valid) {
        echo json_encode(["success" => false, "message" => "Invalid email or password."]);
        exit;
    }

    unset($user['password']);
    $user['id'] = (string)$user['id'];
    $user['fullName'] = $user['full_name'];

    $conn->close();
    echo json_encode(["success" => true, "user" => $user]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
