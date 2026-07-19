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

    $id = (int)($data['id'] ?? 0);
    if ($id <= 0) {
        echo json_encode(["success" => false, "message" => "id is required."]);
        exit;
    }

    // Bulk-mark every unit on this property vacant/occupied
    if (array_key_exists('set_all_units_status', $data)) {
        $isVacant = ($data['set_all_units_status'] === 'vacant') ? 1 : 0;
        $stmt = $conn->prepare("UPDATE property_units SET is_vacant = ? WHERE property_id = ?");
        $stmt->bind_param("ii", $isVacant, $id);
        $stmt->execute();
        $stmt->close();
        $conn->close();
        echo json_encode(["success" => true]);
        exit;
    }

    $fieldTypes = [
        'name' => 's', 'description' => 's', 'cover_image' => 's', 'county' => 's',
        'estate' => 's', 'address' => 's', 'latitude' => 'd', 'longitude' => 'd',
        'house_type' => 's', 'monthly_rent' => 'd', 'bedrooms' => 'i', 'bathrooms' => 'i',
        'area_sqm' => 'd', 'status' => 's', 'featured' => 'i',
    ];
    $jsonFields = ['images', 'amenities', 'house_rules', 'nearby'];

    $sets = []; $types = ""; $values = [];
    foreach ($fieldTypes as $field => $type) {
        if (array_key_exists($field, $data)) {
            $sets[] = "$field = ?";
            $types .= $type;
            $values[] = $field === 'featured' ? ($data[$field] ? 1 : 0) : $data[$field];
        }
    }
    foreach ($jsonFields as $field) {
        if (array_key_exists($field, $data)) {
            $sets[] = "$field = ?";
            $types .= "s";
            $values[] = json_encode($data[$field]);
        }
    }

    if (empty($sets)) {
        echo json_encode(["success" => false, "message" => "No updatable fields provided."]);
        exit;
    }

    $sql = "UPDATE properties SET " . implode(", ", $sets) . " WHERE id = ?";
    $types .= "i";
    $values[] = $id;

    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$values);
    $stmt->execute();
    $stmt->close();
    $conn->close();

    echo json_encode(["success" => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
