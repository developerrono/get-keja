<?php
// mpesa-helpers.php
// Shared helpers used by mpesa-stk-push.php and mpesa-callback.php.

$mpesaConfig = require __DIR__ . '/mpesa-config.php';

function mpesa_base_url() {
    global $mpesaConfig;
    return $mpesaConfig['env'] === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';
}

function mpesa_get_access_token() {
    global $mpesaConfig;
    $credentials = base64_encode($mpesaConfig['consumer_key'] . ':' . $mpesaConfig['consumer_secret']);

    $ch = curl_init(mpesa_base_url() . '/oauth/v1/generate?grant_type=client_credentials');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Basic $credentials"]);
    $response = curl_exec($ch);
    if (curl_errno($ch)) {
        $err = curl_error($ch);
        curl_close($ch);
        throw new Exception('Failed to reach Daraja: ' . $err);
    }
    curl_close($ch);

    $data = json_decode($response, true);
    if (!isset($data['access_token'])) {
        throw new Exception('Could not get M-Pesa access token: ' . $response);
    }
    return $data['access_token'];
}

/** Normalizes a Kenyan phone number (07xx, 01xx, 7xx, or 2547xx) to Daraja's expected 2547XXXXXXXX / 2541XXXXXXXX format. */
function mpesa_normalize_phone($phone) {
    $phone = preg_replace('/\D/', '', $phone); // strip spaces, +, dashes
    if (substr($phone, 0, 1) === '0') {
        $phone = '254' . substr($phone, 1);
    } elseif (substr($phone, 0, 3) !== '254') {
        $phone = '254' . $phone;
    }
    return $phone;
}
