<?php
// mpesa-callback.php
// Safaricom's servers POST here directly once the tenant enters their PIN
// (or cancels/times out). Must be a publicly reachable HTTPS URL for
// production — see mpesa-config.php for local-dev tunnel notes.

ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Content-Type: application/json");

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli("localhost", "root", "", "getkeja");

    $raw = file_get_contents('php://input');
    // Debug log so you can see exactly what Safaricom sent during testing.
    file_put_contents(__DIR__ . '/mpesa-callback.log', date('c') . " " . $raw . "\n", FILE_APPEND);

    $data = json_decode($raw, true);
    $callback = $data['Body']['stkCallback'] ?? null;

    if (!$callback) {
        http_response_code(400);
        echo json_encode(["ResultCode" => 1, "ResultDesc" => "Invalid payload"]);
        exit;
    }

    $checkoutRequestId = $callback['CheckoutRequestID'];
    $resultCode = (int)$callback['ResultCode'];

    if ($resultCode === 0) {
        // Payment succeeded — pull the receipt number out of CallbackMetadata
        $items = $callback['CallbackMetadata']['Item'] ?? [];
        $receipt = null;
        foreach ($items as $i) {
            if ($i['Name'] === 'MpesaReceiptNumber') { $receipt = $i['Value']; break; }
        }

        $update = $conn->prepare("UPDATE transactions SET status = 'success', mpesa_receipt = ?, confirmed_at = NOW() WHERE checkout_request_id = ?");
        $update->bind_param("ss", $receipt, $checkoutRequestId);
        $update->execute();
        $update->close();

        // If this payment is tied to a tenancy, reduce the outstanding balance
        $tx = $conn->prepare("SELECT tenancy_id, amount FROM transactions WHERE checkout_request_id = ?");
        $tx->bind_param("s", $checkoutRequestId);
        $tx->execute();
        $row = $tx->get_result()->fetch_assoc();
        $tx->close();

        if ($row && $row['tenancy_id']) {
            $tenancyId = (int)$row['tenancy_id'];
            $amount = (float)$row['amount'];
            $updBalance = $conn->prepare("UPDATE tenancies SET balance = balance - ? WHERE id = ?");
            $updBalance->bind_param("di", $amount, $tenancyId);
            $updBalance->execute();
            $updBalance->close();
        }
    } else {
        $reason = $callback['ResultDesc'] ?? 'Payment failed or was cancelled.';
        $update = $conn->prepare("UPDATE transactions SET status = 'failed', failure_reason = ? WHERE checkout_request_id = ?");
        $update->bind_param("ss", $reason, $checkoutRequestId);
        $update->execute();
        $update->close();
    }

    $conn->close();

    // Safaricom expects exactly this acknowledgement shape back, regardless of outcome
    echo json_encode(["ResultCode" => 0, "ResultDesc" => "Accepted"]);

} catch (Exception $e) {
    // Still acknowledge Safaricom so they don't retry indefinitely — log the real failure instead
    file_put_contents(__DIR__ . '/mpesa-callback.log', date('c') . " ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
    echo json_encode(["ResultCode" => 0, "ResultDesc" => "Accepted"]);
}
?>
