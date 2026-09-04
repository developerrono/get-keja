<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(0); }

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli("localhost", "root", "", "getkeja");

    $search = trim($_GET['search'] ?? '');
    $county = trim($_GET['county'] ?? '');
    $houseType = trim($_GET['house_type'] ?? '');
    $minRent = (isset($_GET['min_rent']) && $_GET['min_rent'] !== '') ? (float)$_GET['min_rent'] : null;
    $maxRent = (isset($_GET['max_rent']) && $_GET['max_rent'] !== '') ? (float)$_GET['max_rent'] : null;
    $landlordId = (isset($_GET['landlord_id']) && $_GET['landlord_id'] !== '') ? (int)$_GET['landlord_id'] : null;
    $status = trim($_GET['status'] ?? '');
    $perPage = isset($_GET['per_page']) ? max(1, (int)$_GET['per_page']) : 12;
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $offset = ($page - 1) * $perPage;

    // Plain public browsing (no status param at all — e.g. the tenant-facing
    // listing page) is the only case that should also hide "full" properties
    // (every unit occupied). A landlord viewing their own dashboard passes
    // status=all, and anyone explicitly filtering by a specific status is
    // asking a narrower question than "what can a tenant rent right now",
    // so we leave those requests alone.
    $isPublicBrowse = ($status === '');

    $where = [];
    $types = "";
    $values = [];

    if ($status === 'all') {
        // no status filter — used by a landlord's own dashboard
    } elseif ($status !== '') {
        $where[] = "p.status = ?"; $types .= "s"; $values[] = $status;
    } else {
        $where[] = "p.status = 'active'";
    }

    if ($search !== '') {
        $like = "%$search%";
        $where[] = "(p.name LIKE ? OR p.estate LIKE ? OR p.county LIKE ?)";
        $types .= "sss"; $values[] = $like; $values[] = $like; $values[] = $like;
    }
    if ($county !== '') { $where[] = "p.county = ?"; $types .= "s"; $values[] = $county; }
    if ($houseType !== '') { $where[] = "p.house_type = ?"; $types .= "s"; $values[] = $houseType; }
    if ($minRent !== null) { $where[] = "p.monthly_rent >= ?"; $types .= "d"; $values[] = $minRent; }
    if ($maxRent !== null) { $where[] = "p.monthly_rent <= ?"; $types .= "d"; $values[] = $maxRent; }
    if ($landlordId !== null) { $where[] = "p.landlord_id = ?"; $types .= "i"; $values[] = $landlordId; }

    $whereSql = $where ? ("WHERE " . implode(" AND ", $where)) : "";
    $havingSql = $isPublicBrowse ? "HAVING vacant_count > 0" : "";

    // Total count (for pagination). This has to apply the same vacancy
    // aggregation + HAVING as the main query, or pagination totals would
    // include full properties that the main query then filters out.
    $countSql = "SELECT COUNT(*) c FROM (
                    SELECT p.id,
                           COALESCE(SUM(CASE WHEN u.is_vacant = 1 THEN 1 ELSE 0 END), 0) AS vacant_count
                    FROM properties p
                    LEFT JOIN property_units u ON u.property_id = p.id
                    $whereSql
                    GROUP BY p.id
                    $havingSql
                 ) t";
    if ($types !== "") {
        $stmt = $conn->prepare($countSql);
        $stmt->bind_param($types, ...$values);
        $stmt->execute();
        $total = (int)$stmt->get_result()->fetch_assoc()['c'];
        $stmt->close();
    } else {
        $total = (int)$conn->query($countSql)->fetch_assoc()['c'];
    }

    // Main query, aggregating unit counts/prices to avoid N+1 lookups
    $sql = "SELECT p.*,
                   COUNT(u.id) AS units_count,
                   COALESCE(SUM(CASE WHEN u.is_vacant = 1 THEN 1 ELSE 0 END), 0) AS vacant_count,
                   COALESCE(SUM(CASE WHEN u.is_vacant = 0 THEN 1 ELSE 0 END), 0) AS occupied_count,
                   MIN(u.monthly_rent) AS rent_min,
                   MAX(u.monthly_rent) AS rent_max
            FROM properties p
            LEFT JOIN property_units u ON u.property_id = p.id
            $whereSql
            GROUP BY p.id
            $havingSql
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?";
    $types2 = $types . "ii";
    $values2 = array_merge($values, [$perPage, $offset]);

    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types2, ...$values2);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    $conn->close();

    foreach ($rows as &$r) {
        $r['images'] = json_decode($r['images'] ?? '[]', true) ?: [];
        $r['amenities'] = json_decode($r['amenities'] ?? '[]', true) ?: [];
        $r['house_rules'] = json_decode($r['house_rules'] ?? '[]', true) ?: [];
        $r['nearby'] = json_decode($r['nearby'] ?? '{}', true) ?: (object)[];
        $r['featured'] = (bool)$r['featured'];
        $r['units_count'] = (int)$r['units_count'];
        $r['vacant_count'] = (int)$r['vacant_count'];
        $r['occupied_count'] = (int)$r['occupied_count'];
    }

    echo json_encode(["success" => true, "data" => $rows, "total" => $total]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
