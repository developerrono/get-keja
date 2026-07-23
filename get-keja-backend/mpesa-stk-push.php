<?php
// mpesa-stk-push.php
// POST { tenant_id, landlord_id, phone, amount, tenancy_id?, property_id?, unit_id? }
// Triggers the STK Push on the tenant's phone and records a pending
// transaction row. The result arrives later at mpesa-callback.php.

ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(0); }

require_once __DIR__ . '/mpesa-helpers.php';

function fail($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(["success" => false, "message" => $msg]);
    exit;
}

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli("localhost", "root", "", "getkeja");

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) { $input = []; }

    foreach (['tenant_id', 'landlord_id', 'phone', 'amount'] as $r) {
        if (empty($input[$r]) && $input[$r] !== 0) fail("Missing field: $r");
    }

    $amount = (float) $input['amount'];
    if ($amount < 1) fail("Amount must be at least KSh 1.");

    $phone = mpesa_normalize_phone($input['phone']);
    if (!preg_match('/^254[71]\d{8}$/', $phone)) fail("Invalid phone number. Use format 07XXXXXXXX or 2547XXXXXXXX.");

    global $mpesaConfig;

    $token = mpesa_get_access_token();

    $timestamp = date('YmdHis');
    $password = base64_encode($mpesaConfig['shortcode'] . $mpesaConfig['passkey'] . $timestamp);

    $payload = [
        "BusinessShortCode" => $mpesaConfig['shortcode'],
        "Password"          => $password,
        "Timestamp"         => $timestamp,
        "TransactionType"   => "CustomerPayBillOnline",
        "Amount"            => (int) round($amount),
        "PartyA"            => $phone,
        "PartyB"            => $mpesaConfig['shortcode'],
        "PhoneNumber"       => $phone,
        "CallBackURL"       => $mpesaConfig['callback_url'],
        "AccountReference"  => substr("Keja" . ($input['property_id'] ?? ''), 0, 12),
        "TransactionDesc"   => "Rent payment",
    ];

    $ch = curl_init(mpesa_base_url() . '/mpesa/stkpush/v1/processrequest');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ["Authorization: Bearer $token", "Content-Type: application/json"],
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
    ]);
    $response = curl_exec($ch);
    if (curl_errno($ch)) { $err = curl_error($ch); curl_close($ch); fail("STK Push request failed: $err", 502); }
    curl_close($ch);

    $result = json_decode($response, true);
    if (!isset($result['CheckoutRequestID'])) {
        fail($result['errorMessage'] ?? ("Safaricom rejected the request: " . $response), 502);
    }

    $adminFee = round($amount * $mpesaConfig['admin_fee_percent'], 2);
    $landlordAmount = round($amount - $adminFee, 2);

    $tenantId = (int)$input['tenant_id'];
    $landlordId = (int)$input['landlord_id'];
    $tenancyId = isset($input['tenancy_id']) && $input['tenancy_id'] ? (int)$input['tenancy_id'] : null;
    $propertyId = isset($input['property_id']) && $input['property_id'] ? (int)$input['property_id'] : null;
    $unitId = isset($input['unit_id']) && $input['unit_id'] ? (int)$input['unit_id'] : null;
    $checkoutRequestId = $result['CheckoutRequestID'];
    $merchantRequestId = $result['MerchantRequestID'];

    $stmt = $conn->prepare(
        "INSERT INTO transactions
            (tenancy_id, tenant_id, landlord_id, property_id, unit_id, phone, amount, admin_fee, landlord_amount, status, checkout_request_id, merchant_request_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NOW())"
    );
    $stmt->bind_param(
        "iiiiisdddss",
        $tenancyId, $tenantId, $landlordId, $propertyId, $unitId, $phone, $amount, $adminFee, $landlordAmount, $checkoutRequestId, $merchantRequestId
    );
    $stmt->execute();
    $stmt->close();
    $conn->close();

    echo json_encode([
        "success" => true,
        "checkout_request_id" => $checkoutRequestId,
        "merchant_request_id" => $merchantRequestId,
        "message" => "STK Push sent — enter your M-Pesa PIN on your phone to complete payment.",
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
