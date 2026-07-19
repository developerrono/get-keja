<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli("localhost", "root", "", "getkeja");

    $data = json_decode(file_get_contents("php://input"), true);

    $fullName = trim($data['fullName'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $role = $data['role'] ?? 'tenant';

    // Only allow these two roles from signup; admin accounts should never
    // be created through this public endpoint.
    if (!in_array($role, ['tenant', 'landlord'], true)) {
        $role = 'tenant';
    }

    if (empty($fullName) || empty($email) || empty($password)) {
        echo json_encode(["success" => false, "message" => "Please fill in all fields."]);
        exit;
    }

    if (strlen($password) < 6) {
        echo json_encode(["success" => false, "message" => "Password must be at least 6 characters."]);
        exit;
    }

    // Check if email is already registered
    $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $check->bind_param("s", $email);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "That email is already registered."]);
        $check->close();
        $conn->close();
        exit;
    }
    $check->close();

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare(
        "INSERT INTO users (full_name, email, password, role, status) VALUES (?, ?, ?, ?, 'active')"
    );
    $stmt->bind_param("ssss", $fullName, $email, $hashedPassword, $role);
    $stmt->execute();

    $newId = $stmt->insert_id;
    $stmt->close();

    echo json_encode([
        "success" => true,
        "message" => "Account created successfully.",
        "user" => [
            "id" => (string)$newId,
            "fullName" => $fullName,
            "email" => $email,
            "role" => $role,
            "status" => "active"
        ]
    ]);

    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Internal Server Error: " . $e->getMessage()
    ]);
}
?>
