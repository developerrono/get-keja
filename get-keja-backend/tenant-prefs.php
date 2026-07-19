<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(0); }

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli("localhost", "root", "", "getkeja");
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $userId = (int)($_GET['user_id'] ?? 0);
        if ($userId <= 0) { echo json_encode(["success" => false, "message" => "user_id required."]); exit; }

        $stmt = $conn->prepare("SELECT * FROM tenant_preferences WHERE user_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($row) {
            $row['preferred_counties'] = json_decode($row['preferred_counties'] ?? '[]', true) ?: [];
            $row['preferred_house_types'] = json_decode($row['preferred_house_types'] ?? '[]', true) ?: [];
            $row['preferred_estates'] = json_decode($row['preferred_estates'] ?? '[]', true) ?: [];
            $row['needs_parking'] = (bool)$row['needs_parking'];
            $row['has_pets'] = (bool)$row['has_pets'];
            $row['onboarding_dismissed'] = (bool)$row['onboarding_dismissed'];
            $row['onboarding_completed'] = (bool)$row['onboarding_completed'];
        }
        echo json_encode(["success" => true, "data" => $row ?: null]);
        exit;
    }

    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) { $data = []; }
        $userId = (int)($data['user_id'] ?? 0);
        if ($userId <= 0) { echo json_encode(["success" => false, "message" => "user_id required."]); exit; }

        // Existing row, so partial updates (e.g. just "dismissed") don't wipe other fields
        $stmt = $conn->prepare("SELECT * FROM tenant_preferences WHERE user_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $existing = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        $budgetMin = array_key_exists('budget_min', $data) ? (float)$data['budget_min'] : ($existing['budget_min'] ?? null);
        $budgetMax = array_key_exists('budget_max', $data) ? (float)$data['budget_max'] : ($existing['budget_max'] ?? null);
        $counties = array_key_exists('preferred_counties', $data) ? json_encode($data['preferred_counties']) : ($existing['preferred_counties'] ?? '[]');
        $houseTypes = array_key_exists('preferred_house_types', $data) ? json_encode($data['preferred_house_types']) : ($existing['preferred_house_types'] ?? '[]');
        $estates = array_key_exists('preferred_estates', $data) ? json_encode($data['preferred_estates']) : ($existing['preferred_estates'] ?? '[]');
        $moveIn = array_key_exists('move_in_date', $data) ? $data['move_in_date'] : ($existing['move_in_date'] ?? null);
        $notes = array_key_exists('notes', $data) ? $data['notes'] : ($existing['notes'] ?? '');
        $needsParking = array_key_exists('needs_parking', $data) ? ($data['needs_parking'] ? 1 : 0) : ($existing['needs_parking'] ?? 0);
        $hasPets = array_key_exists('has_pets', $data) ? ($data['has_pets'] ? 1 : 0) : ($existing['has_pets'] ?? 0);
        $furnished = array_key_exists('furnished_preference', $data) ? $data['furnished_preference'] : ($existing['furnished_preference'] ?? 'any');
        $dismissed = array_key_exists('onboarding_dismissed', $data) ? ($data['onboarding_dismissed'] ? 1 : 0) : ($existing['onboarding_dismissed'] ?? 0);
        $completed = array_key_exists('onboarding_completed', $data) ? ($data['onboarding_completed'] ? 1 : 0) : ($existing['onboarding_completed'] ?? 0);

        if ($existing) {
            $update = $conn->prepare(
                "UPDATE tenant_preferences SET
                    budget_min=?, budget_max=?, preferred_counties=?, preferred_house_types=?, preferred_estates=?,
                    move_in_date=?, notes=?, needs_parking=?, has_pets=?, furnished_preference=?,
                    onboarding_dismissed=?, onboarding_completed=?
                 WHERE user_id=?"
            );
            $update->bind_param(
                "ddsssssiisiii",
                $budgetMin, $budgetMax, $counties, $houseTypes, $estates,
                $moveIn, $notes, $needsParking, $hasPets, $furnished,
                $dismissed, $completed, $userId
            );
            $update->execute();
            $update->close();
        } else {
            $insert = $conn->prepare(
                "INSERT INTO tenant_preferences
                    (user_id, budget_min, budget_max, preferred_counties, preferred_house_types, preferred_estates,
                     move_in_date, notes, needs_parking, has_pets, furnished_preference,
                     onboarding_dismissed, onboarding_completed)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $insert->bind_param(
                "iddsssssiisii",
                $userId, $budgetMin, $budgetMax, $counties, $houseTypes, $estates,
                $moveIn, $notes, $needsParking, $hasPets, $furnished,
                $dismissed, $completed
            );
            $insert->execute();
            $insert->close();
        }

        $conn->close();
        echo json_encode(["success" => true]);
        exit;
    }

    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
