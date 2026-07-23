<?php
// mpesa-query.php
// GET ?checkout_request_id=...
// The frontend polls this every few seconds after triggering an STK Push.
// Reads straight from the DB (populated by mpesa-callback.php).

ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli("localhost", "root", "", "getkeja");

    $checkoutId = $_GET['checkout_request_id'] ?? '';
    if (!$checkoutId) {
        echo json_encode(["success" => false, "message" => "Missing checkout_request_id"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT status, mpesa_receipt, amount, failure_reason FROM transactions WHERE checkout_request_id = ?");
    $stmt->bind_param("s", $checkoutId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    $conn->close();

    if (!$row) {
        echo json_encode(["success" => false, "message" => "Transaction not found."]);
        exit;
    }

    $row['amount'] = (float)$row['amount'];
    echo json_encode(["success" => true, "data" => $row]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
