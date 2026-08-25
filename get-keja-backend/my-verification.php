<?php
// my-verification.php
// GET ?landlord_id=123
// Returns the landlord's own latest verification submission (if any) and
// their current `role` — the frontend uses this to gate posting/updating
// properties until role === 'verified_landlord'.

ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(0); }

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli("localhost", "root", "", "getkeja");

    $landlordId = isset($_GET['landlord_id']) ? (int)$_GET['landlord_id'] : 0;
    if ($landlordId <= 0) {
        echo json_encode(["success" => false, "message" => "landlord_id is required."]);
        exit;
    }

    $userStmt = $conn->prepare(
        "SELECT role, phone_verified_at, email_verified_at FROM users WHERE id = ?"
    );
    $userStmt->bind_param("i", $landlordId);
    $userStmt->execute();
    $user = $userStmt->get_result()->fetch_assoc();
    $userStmt->close();

    if (!$user) {
        echo json_encode(["success" => false, "message" => "User not found."]);
        exit;
    }

    $verStmt = $conn->prepare(
        "SELECT id, status, admin_notes, created_at, reviewed_at
         FROM landlord_verifications WHERE landlord_id = ? ORDER BY created_at DESC LIMIT 1"
    );
    $verStmt->bind_param("i", $landlordId);
    $verStmt->execute();
    $verification = $verStmt->get_result()->fetch_assoc();
    $verStmt->close();
    $conn->close();

    echo json_encode([
        "success" => true,
        "data" => [
            "role" => $user['role'],
            "is_verified_landlord" => $user['role'] === 'verified_landlord',
            "phone_verified" => $user['phone_verified_at'] !== null,
            "email_verified" => $user['email_verified_at'] !== null,
            "verification" => $verification ?: null,
        ],
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
