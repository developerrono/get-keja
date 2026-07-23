<?php
// upload-media.php
// Accepts a multipart/form-data POST with fields: file, folder
// Saves the file under /uploads/{folder}/ and returns its public URL.
//
// Drop this in the same directory as your other *.php endpoints
// (get-keja-backend/), matching their existing include/config style —
// adjust the require_once line below to however your other files
// pull in DB config / CORS headers, if needed.

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // tighten this in production
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function fail($message, $code = 400) {
    http_response_code($code);
    echo json_encode(["success" => false, "message" => $message]);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    fail("No file uploaded or upload error.");
}

$file = $_FILES['file'];
$folder = isset($_POST['folder']) ? $_POST['folder'] : 'misc';

// Sanitize folder: allow only alphanumeric, dash, underscore, slash
$folder = preg_replace('/[^a-zA-Z0-9\/_-]/', '', $folder);

// Basic validation
$maxSize = 200 * 1024 * 1024; // 200MB, covers video
if ($file['size'] > $maxSize) {
    fail("File too large (max 200MB).");
}

$allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'webm'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($ext, $allowedExt)) {
    fail("Unsupported file type: .$ext");
}

// Build destination path: uploads/{folder}/{uuid}.{ext}
$uploadsRoot = __DIR__ . '/uploads';
$destDir = $uploadsRoot . '/' . $folder;
if (!is_dir($destDir)) {
    mkdir($destDir, 0755, true);
}

// Generate a random filename to avoid collisions/overwrites
$filename = bin2hex(random_bytes(16)) . '.' . $ext;
$destPath = $destDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    fail("Failed to save file.", 500);
}

// Build the public URL. Adjust the base to match how you serve /uploads
// (e.g. if get-keja-backend is served at http://localhost/get-keja-backend,
// this assumes /uploads sits alongside it at the same level).
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$publicUrl = "$scheme://$host/get-keja-backend/uploads/$folder/$filename";

echo json_encode([
    "success" => true,
    "url" => $publicUrl,
]);
