<?php
// submit-verification.php
// POST { landlord_id, full_name, phone, national_id, id_photo_url, selfie_url, business_name? }
// Landlord-facing: submits (or re-submits) an identity verification request.
// This does NOT auto-approve — it lands in the admin verification queue
// (see admin.php action=list_verifications / update_verification) for a
// human reviewer to check the ID photo against the selfie.
//
// NOTE: there is no automated face-match here. If you want automated
// liveness/face-match, that's normally where a KYC provider (Persona,
// Sumsub, Smile Identity) plugs in — this endpoint gives you the same data
// shape so you can wire one in later without changing the frontend.

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

    $landlordId = (int)($data['landlord_id'] ?? 0);
    $fullName = trim($data['full_name'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $nationalId = trim($data['national_id'] ?? '');
    $idPhotoUrl = trim($data['id_photo_url'] ?? '');
    $selfieUrl = trim($data['selfie_url'] ?? '');
    $businessName = trim($data['business_name'] ?? '');

    if ($landlordId <= 0 || $fullName === '' || $nationalId === '' || $idPhotoUrl === '' || $selfieUrl === '') {
        echo json_encode(["success" => false, "message" => "full_name, national_id, id_photo_url, and selfie_url are required."]);
        exit;
    }

    // If there's already a pending/info_requested submission, update it
    // instead of creating a duplicate row.
    $existing = $conn->prepare(
        "SELECT id FROM landlord_verifications WHERE landlord_id = ? AND status IN ('pending','info_requested') ORDER BY created_at DESC LIMIT 1"
    );
    $existing->bind_param("i", $landlordId);
    $existing->execute();
    $row = $existing->get_result()->fetch_assoc();
    $existing->close();

    if ($row) {
        $stmt = $conn->prepare(
            "UPDATE landlord_verifications
             SET full_name=?, phone=?, national_id=?, id_photo_url=?, selfie_url=?, business_name=?, status='pending', admin_notes=NULL
             WHERE id=?"
        );
        $stmt->bind_param("ssssssi", $fullName, $phone, $nationalId, $idPhotoUrl, $selfieUrl, $businessName, $row['id']);
        $stmt->execute();
        $stmt->close();
    } else {
        $stmt = $conn->prepare(
            "INSERT INTO landlord_verifications (landlord_id, full_name, phone, national_id, id_photo_url, selfie_url, business_name, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')"
        );
        $stmt->bind_param("issssss", $landlordId, $fullName, $phone, $nationalId, $idPhotoUrl, $selfieUrl, $businessName);
        $stmt->execute();
        $stmt->close();
    }

    $conn->close();
    echo json_encode(["success" => true, "message" => "Verification submitted. We'll review it shortly."]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
