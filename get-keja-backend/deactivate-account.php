<?php
// deactivate-account.php
// POST { user_id, reason }
// Replaces hard account deletion for landlords: sets status='deactivated'
// with a required reason, timestamped, and visible to admins in the
// landlords/users dashboard. The account and its data are preserved —
// nothing is deleted. An admin can reactivate by setting status back to
// 'active' (see admin.php).

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
    $reason = trim($data['reason'] ?? '');

    if ($userId <= 0) {
        echo json_encode(["success" => false, "message" => "user_id is required."]);
        exit;
    }
    if ($reason === '' || mb_strlen($reason) < 10) {
        echo json_encode(["success" => false, "message" => "Please provide a reason (at least 10 characters) — this helps our security review."]);
        exit;
    }

    $stmt = $conn->prepare(
        "UPDATE users SET status = 'deactivated', deactivation_reason = ?, deactivated_at = NOW() WHERE id = ?"
    );
    $stmt->bind_param("si", $reason, $userId);
    $stmt->execute();
    $stmt->close();

    // Notify admins by writing a notification to every admin account, so
    // it shows up in their existing notifications feed.
    $admins = $conn->query("SELECT id FROM users WHERE role = 'admin'");
    if ($admins) {
        $title = "Landlord account deactivated";
        $body = "A landlord (user #$userId) deactivated their account. Reason: $reason";
        $notif = $conn->prepare(
            "INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'account_deactivated', ?, ?)"
        );
        while ($admin = $admins->fetch_assoc()) {
            $adminId = (int)$admin['id'];
            $notif->bind_param("iss", $adminId, $title, $body);
            $notif->execute();
        }
        $notif->close();
    }

    $conn->close();
    echo json_encode(["success" => true, "message" => "Your account has been deactivated."]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
