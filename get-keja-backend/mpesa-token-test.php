<?php
// mpesa-token-test.php
// TEMPORARY diagnostic file. Visit this directly in your browser:
// http://localhost/get-keja-backend/mpesa-token-test.php
// Delete it once M-Pesa is working — it prints your consumer key (partially).

$config = require __DIR__ . '/mpesa-config.php';

$url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
$credentials = base64_encode($config['consumer_key'] . ':' . $config['consumer_secret']);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ["Authorization: Basic $credentials"],
]);

$response = curl_exec($ch);
$curlErrno = curl_errno($ch);
$curlError = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

header("Content-Type: text/plain");

echo "=== M-Pesa token request diagnostic ===\n\n";
echo "consumer_key (first/last 4 chars): "
    . substr($config['consumer_key'], 0, 4) . "..." . substr($config['consumer_key'], -4) . "\n";
echo "consumer_key length: " . strlen($config['consumer_key']) . " (should be 43-44 for Daraja)\n";
echo "consumer_secret length: " . strlen($config['consumer_secret']) . " (should be 43-44 for Daraja)\n\n";

echo "cURL errno: $curlErrno\n";
echo "cURL error: " . ($curlError ?: "(none)") . "\n";
echo "HTTP status code: $httpCode\n\n";

echo "Raw response body:\n";
echo $response === false ? "(curl_exec returned false — request never completed)" : $response;
echo "\n\n";

echo "=== What to do next ===\n";
if ($curlErrno === 60 || stripos($curlError, 'certificate') !== false) {
    echo "This is an SSL certificate verification failure. Download https://curl.se/ca/cacert.pem,\n";
    echo "save it anywhere (e.g. C:\\xampp\\cacert.pem), and tell Claude the path — the mpesa-helpers.php\n";
    echo "fix will point CURLOPT_CAINFO at it directly, no php.ini editing required.\n";
} elseif ($curlErrno === 6 || $curlErrno === 7) {
    echo "This looks like a network/DNS/connectivity issue reaching sandbox.safaricom.co.ke —\n";
    echo "check your internet connection or any firewall/antivirus blocking outbound HTTPS.\n";
} elseif ($httpCode === 400 || $httpCode === 401) {
    echo "Safaricom rejected the credentials (HTTP $httpCode). Double check the consumer key/secret\n";
    echo "were copied exactly, with no extra spaces, from the correct Sandbox app on the Daraja portal.\n";
} elseif ($httpCode === 200) {
    echo "This actually succeeded! If mpesa-stk-push.php still fails, the bug is elsewhere in\n";
    echo "mpesa-helpers.php, not the token request itself.\n";
} else {
    echo "Send Claude everything printed above.\n";
}
