<?php
// mpesa-config.php
// Fill in your Safaricom Daraja SANDBOX credentials from
// https://developer.safaricom.co.ke -> My Apps

return [
    'env' => 'sandbox', // change to 'production' when you go live

    'consumer_key'    => 'MavWjWEyPjNobuhlGXfVUeElv9jGorqUTt4gUw1i6W5ybc7v',
    'consumer_secret' => 'kvfXTTXkb8qWThtZxHcNtdG4QB3xxZIJMcatjfGwOpnCtgG6Bk7yp4UGGFBKURkf',

    // Daraja's public sandbox test shortcode + passkey (from their docs) —
    // fine to use as-is for sandbox testing. Replace both when you get a
    // real Paybill/Till number for production.
    'shortcode' => '174379',
    'passkey'   => 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',

    // CRITICAL: Safaricom's servers call this URL directly to deliver the
    // payment result. They cannot reach http://localhost. For local dev,
    // run `ngrok http 80` (or whatever port XAMPP/Apache listens on) and
    // put the ngrok https URL here, e.g.:
    // https://a1b2c3d4.ngrok-free.app/get-keja-backend/mpesa-callback.php
   'callback_url' => 'https://system-jargon-attention.ngrok-free.dev/get-keja-backend/mpesa-callback.php',

    'admin_fee_percent' => 0.01, // 1%
];

