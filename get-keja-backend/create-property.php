<?php
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
    $name = trim($data['name'] ?? '');
    $county = trim($data['county'] ?? '');
    $units = is_array($data['units'] ?? null) ? $data['units'] : [];

    if ($landlordId <= 0 || $name === '' || $county === '' || count($units) === 0) {
        echo json_encode(["success" => false, "message" => "landlord_id, name, county, and at least one unit are required."]);
        exit;
    }

    $description = $data['description'] ?? null;
    $coverImage = $data['cover_image'] ?? null;
    $images = json_encode($data['images'] ?? []);
    $estate = $data['estate'] ?? null;
    $address = $data['address'] ?? null;
    $latitude = $data['latitude'] ?? null;
    $longitude = $data['longitude'] ?? null;
    $amenities = json_encode($data['amenities'] ?? []);
    $houseRules = json_encode($data['house_rules'] ?? []);
    $nearby = json_encode($data['nearby'] ?? (object)[]);
    $areaSqm = $data['area_sqm'] ?? null;

    // New listings start out unverified. They're saved as 'pending' unless the
    // caller explicitly overrides it (e.g. an admin-created listing), and
    // get-properties.php's default (public-facing) query only ever returns
    // status = 'active', so a pending listing is invisible to tenants until
    // an admin approves it from /dashboard/admin/properties.
    $status = $data['status'] ?? 'pending';

    // The property-level house_type/monthly_rent columns are derived from
    // the units, since the "Add property" form collects those per unit —
    // every key here uses ?? so a missing unit field never throws.
    $houseType = $units[0]['house_type'] ?? 'Bedsitter';
    $rents = array_map(fn($u) => (float)($u['rent'] ?? 0), $units);
    $monthlyRent = count($rents) ? min($rents) : 0;

    $stmt = $conn->prepare(
        "INSERT INTO properties
         (landlord_id, name, description, cover_image, images, county, estate, address,
          latitude, longitude, house_type, monthly_rent, area_sqm, amenities, house_rules, nearby, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param(
        "isssssssddsddssss",
        $landlordId, $name, $description, $coverImage, $images, $county, $estate, $address,
        $latitude, $longitude, $houseType, $monthlyRent, $areaSqm, $amenities, $houseRules, $nearby, $status
    );
    $stmt->execute();
    $propertyId = $stmt->insert_id;
    $stmt->close();

    $unitStmt = $conn->prepare(
        "INSERT INTO property_units (property_id, label, is_vacant, monthly_rent, bedrooms, bathrooms) VALUES (?, ?, ?, ?, ?, ?)"
    );
    foreach ($units as $u) {
        $label = $u['label'] ?? '';
        $isVacant = (($u['status'] ?? 'vacant') === 'vacant') ? 1 : 0;
        $rent = (float)($u['rent'] ?? 0);
        $bedrooms = $u['bedrooms'] ?? null;
        $bathrooms = $u['bathrooms'] ?? null;
        $unitStmt->bind_param("isidii", $propertyId, $label, $isVacant, $rent, $bedrooms, $bathrooms);
        $unitStmt->execute();
    }
    $unitStmt->close();

    // Let the landlord know their listing is awaiting review.
    $title = "Listing submitted for review";
    $body = "Your property \"$name\" has been submitted and will go live once an admin verifies it.";
    $notif = $conn->prepare(
        "INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'property_review', ?, ?)"
    );
    $notif->bind_param("iss", $landlordId, $title, $body);
    $notif->execute();
    $notif->close();

    $conn->close();

    echo json_encode(["success" => true, "id" => (string)$propertyId]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
