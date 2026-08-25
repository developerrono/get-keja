<?php
// send-otp.php
// POST { user_id, channel: "phone"|"email", destination }
// Generates a 6-digit code, stores its hash with a 10-minute expiry, and
// sends it via the configured SMS/email provider.
//
// NOTE: SMS delivery is stubbed via sendSms() below — plug in your provider
// (e.g. Africa's Talking, Twilio) by filling in that function. Email
// delivery uses PHP mail() as a placeholder; swap for your mailer of choice.

ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(0); }

function sendSms(string $to, string $message): bool {
    // TODO: integrate a real SMS gateway (Africa's Talking is common in Kenya).
    // Example (Africa's Talking):
    //   $ch = curl_init("https://api.africastalking.com/version1/messaging");
    //   ... set headers with apiKey, POST username/to/message ...
    error_log("[send-otp] SMS to $to: $message");
    return true;
}

function sendEmailOtp(string $to, string $message): bool {
    // TODO: swap for a real transactional mailer (SMTP/SES/SendGrid) — PHP's
    // mail() usually requires local mail server config to actually deliver.
    return @mail($to, "Your Get Keja verification code", $message);
}

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli("localhost", "root", "", "getkeja");

    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) { $data = []; }

    $userId = (int)($data['user_id'] ?? 0);
    $channel = $data['channel'] ?? '';
    $destination = trim($data['destination'] ?? '');

    if ($userId <= 0 || !in_array($channel, ['phone', 'email'], true) || $destination === '') {
        echo json_encode(["success" => false, "message" => "user_id, channel, and destination are required."]);
        exit;
    }

    // Basic format guard (mirrors src/lib/validators.ts on the frontend).
    if ($channel === 'phone' && !preg_match('/^(?:\+254|254|0)(7\d{8}|1\d{8})$/', $destination)) {
        echo json_encode(["success" => false, "message" => "That doesn't look like a valid Kenyan phone number."]);
        exit;
    }
    if ($channel === 'email' && !filter_var($destination, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["success" => false, "message" => "That doesn't look like a valid email address."]);
        exit;
    }

    // Rate-limit: don't allow more than 1 active (unexpired, unverified) OTP per user/channel.
    $existing = $conn->prepare(
        "SELECT id, created_at FROM otp_codes WHERE user_id = ? AND channel = ? AND verified_at IS NULL AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1"
    );
    $existing->bind_param("is", $userId, $channel);
    $existing->execute();
    $activeOtp = $existing->get_result()->fetch_assoc();
    $existing->close();

    if ($activeOtp) {
        $secondsAgo = time() - strtotime($activeOtp['created_at']);
        if ($secondsAgo < 60) {
            echo json_encode(["success" => false, "message" => "Please wait before requesting another code."]);
            exit;
        }
    }

    $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $codeHash = password_hash($code, PASSWORD_DEFAULT);

    $stmt = $conn->prepare(
        "INSERT INTO otp_codes (user_id, channel, destination, code_hash, purpose, expires_at) VALUES (?, ?, ?, ?, 'verify', DATE_ADD(NOW(), INTERVAL 10 MINUTE))"
    );
    $stmt->bind_param("isss", $userId, $channel, $destination, $codeHash);
    $stmt->execute();
    $stmt->close();
    $conn->close();

    $message = "Your Get Keja verification code is $code. It expires in 10 minutes.";
    if ($channel === 'phone') {
        sendSms($destination, $message);
    } else {
        sendEmailOtp($destination, $message);
    }

    echo json_encode(["success" => true, "message" => "Verification code sent."]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
