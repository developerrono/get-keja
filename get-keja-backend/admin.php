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

    // NOTE: In a real deployment you'd verify the caller is actually an
    // admin (e.g. via a session token) before allowing any of this. This
    // app has no server session, so callers are trusted to only expose
    // these admin screens to users whose localStorage role is 'admin'.

    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'stats';

        if ($action === 'stats') {
            $totalUsers = $conn->query("SELECT COUNT(*) c FROM users")->fetch_assoc()['c'];
            $roleRows = $conn->query("SELECT role, COUNT(*) c FROM users GROUP BY role")->fetch_all(MYSQLI_ASSOC);
            $roleCounts = [];
            foreach ($roleRows as $r) { $roleCounts[$r['role']] = (int)$r['c']; }

            $totalProperties = $conn->query("SELECT COUNT(*) c FROM properties")->fetch_assoc()['c'];
            $statusRows = $conn->query("SELECT status, COUNT(*) c FROM properties GROUP BY status")->fetch_all(MYSQLI_ASSOC);
            $propStatus = [];
            foreach ($statusRows as $r) { $propStatus[$r['status']] = (int)$r['c']; }

            $verifRows = $conn->query("SELECT status, COUNT(*) c FROM landlord_verifications GROUP BY status")->fetch_all(MYSQLI_ASSOC);
            $verifStatus = [];
            foreach ($verifRows as $r) { $verifStatus[$r['status']] = (int)$r['c']; }

            $openReports = $conn->query("SELECT COUNT(*) c FROM reports WHERE status = 'open'")->fetch_assoc()['c'];
            $totalReviews = $conn->query("SELECT COUNT(*) c FROM reviews")->fetch_assoc()['c'];

            echo json_encode(["success" => true, "data" => [
                "totalUsers" => (int)$totalUsers,
                "totalLandlords" => ($roleCounts['landlord'] ?? 0) + ($roleCounts['verified_landlord'] ?? 0),
                "verifiedLandlords" => $roleCounts['verified_landlord'] ?? 0,
                "pendingVerifications" => $verifStatus['pending'] ?? 0,
                "totalProperties" => (int)$totalProperties,
                "activeListings" => $propStatus['active'] ?? 0,
                "pendingListings" => $propStatus['pending'] ?? 0,
                "flaggedListings" => $propStatus['hidden'] ?? 0,
                "openReports" => (int)$openReports,
                "totalReviews" => (int)$totalReviews,
            ]]);
            exit;
        }

        if ($action === 'list_users') {
            $rows = $conn->query("SELECT id, full_name, email, role, status, phone, deactivation_reason, deactivated_at, created_at FROM users ORDER BY created_at DESC")->fetch_all(MYSQLI_ASSOC);
            foreach ($rows as &$r) {
                $r['roles'] = [$r['role']];
                $r['is_verified'] = $r['role'] === 'verified_landlord';
            }
            echo json_encode(["success" => true, "data" => $rows]);
            exit;
        }

        if ($action === 'list_verifications') {
            $rows = $conn->query(
                "SELECT v.*, u.full_name, u.email, u.phone
                 FROM landlord_verifications v JOIN users u ON u.id = v.landlord_id
                 ORDER BY v.created_at DESC"
            )->fetch_all(MYSQLI_ASSOC);
            foreach ($rows as &$r) {
                $r['landlord'] = [
                    'full_name' => $r['full_name'],
                    'email' => $r['email'],
                    'phone' => $r['phone'],
                    'avatar_url' => null,
                ];
            }
            echo json_encode(["success" => true, "data" => $rows]);
            exit;
        }

        if ($action === 'list_reports') {
            $rows = $conn->query("SELECT * FROM reports ORDER BY created_at DESC")->fetch_all(MYSQLI_ASSOC);
            echo json_encode(["success" => true, "data" => $rows]);
            exit;
        }

        if ($action === 'list_properties') {
            // Optional ?status=pending|active|rejected|... filter, e.g. for the
            // admin "listings awaiting verification" view. Omit or pass "all"
            // to get everything. Landlord name/email are joined in since the
            // admin review screen needs to show who submitted each listing.
            $statusFilter = trim($_GET['status'] ?? '');

            $sql = "SELECT p.*, u.full_name AS landlord_name, u.email AS landlord_email
                    FROM properties p
                    JOIN users u ON u.id = p.landlord_id";
            if ($statusFilter !== '' && $statusFilter !== 'all') {
                $sql .= " WHERE p.status = ?";
            }
            $sql .= " ORDER BY p.created_at DESC";

            if ($statusFilter !== '' && $statusFilter !== 'all') {
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("s", $statusFilter);
                $stmt->execute();
                $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
                $stmt->close();
            } else {
                $rows = $conn->query($sql)->fetch_all(MYSQLI_ASSOC);
            }

            foreach ($rows as &$r) {
                $r['images'] = json_decode($r['images'] ?? '[]', true) ?: [];
                $r['featured'] = (bool)$r['featured'];
            }
            echo json_encode(["success" => true, "data" => $rows]);
            exit;
        }

        if ($action === 'list_reviews') {
            $rows = $conn->query(
                "SELECT r.*, u.full_name AS tenant_name, p.name AS property_name
                 FROM reviews r JOIN users u ON u.id = r.tenant_id JOIN properties p ON p.id = r.property_id
                 ORDER BY r.created_at DESC"
            )->fetch_all(MYSQLI_ASSOC);
            echo json_encode(["success" => true, "data" => $rows]);
            exit;
        }

        echo json_encode(["success" => false, "message" => "Unknown action."]);
        exit;
    }

    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data['action'] ?? '';

        if ($action === 'reactivate_user') {
            $id = (int)($data['id'] ?? 0);
            if ($id <= 0) {
                echo json_encode(["success" => false, "message" => "id is required."]);
                exit;
            }
            $stmt = $conn->prepare(
                "UPDATE users SET status = 'active', deactivation_reason = NULL, deactivated_at = NULL WHERE id = ?"
            );
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $stmt->close();
            echo json_encode(["success" => true]);
            exit;
        }

        if ($action === 'update_verification') {
            $id = (int)($data['id'] ?? 0);
            $status = $data['status'] ?? '';
            $adminNotes = $data['admin_notes'] ?? '';
            $reviewerId = (int)($data['reviewer_id'] ?? 0);

            $stmt = $conn->prepare(
                "UPDATE landlord_verifications SET status=?, admin_notes=?, reviewed_by=?, reviewed_at=NOW() WHERE id=?"
            );
            $stmt->bind_param("ssii", $status, $adminNotes, $reviewerId, $id);
            $stmt->execute();
            $stmt->close();

            // If approved, upgrade the landlord's role and notify them
            if ($status === 'approved') {
                $lrow = $conn->query("SELECT landlord_id FROM landlord_verifications WHERE id = " . (int)$id)->fetch_assoc();
                if ($lrow) {
                    $landlordId = (int)$lrow['landlord_id'];
                    $upd = $conn->prepare("UPDATE users SET role = 'verified_landlord' WHERE id = ?");
                    $upd->bind_param("i", $landlordId);
                    $upd->execute();
                    $upd->close();

                    $title = "You're verified!";
                    $body = "Your landlord verification was approved. Your listings now show a verified badge.";
                    $notif = $conn->prepare(
                        "INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'verification', ?, ?)"
                    );
                    $notif->bind_param("iss", $landlordId, $title, $body);
                    $notif->execute();
                    $notif->close();
                }
            }

            echo json_encode(["success" => true]);
            exit;
        }

        if ($action === 'update_report') {
            $id = (int)($data['id'] ?? 0);
            $status = $data['status'] ?? '';
            $adminNotes = $data['admin_notes'] ?? '';
            $stmt = $conn->prepare("UPDATE reports SET status=?, admin_notes=? WHERE id=?");
            $stmt->bind_param("ssi", $status, $adminNotes, $id);
            $stmt->execute();
            $stmt->close();
            echo json_encode(["success" => true]);
            exit;
        }

        if ($action === 'update_property') {
            $id = (int)($data['id'] ?? 0);

            $sets = [];
            $types = "";
            $values = [];

            if (array_key_exists('status', $data)) {
                $sets[] = "status = ?";
                $types .= "s";
                $values[] = $data['status'];
            }
            if (array_key_exists('featured', $data)) {
                $sets[] = "featured = ?";
                $types .= "i";
                $values[] = $data['featured'] ? 1 : 0;
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

            // Notify the landlord when their listing is verified (approved) or
            // rejected, mirroring the landlord-identity verification flow above.
            // admin_notes here is only used for the notification text — the
            // properties table has no admin_notes column to persist it in.
            if (array_key_exists('status', $data) && in_array($data['status'], ['active', 'rejected'], true)) {
                $prow = $conn->query("SELECT landlord_id, name FROM properties WHERE id = " . (int)$id)->fetch_assoc();
                if ($prow) {
                    $landlordId = (int)$prow['landlord_id'];
                    $propName = $prow['name'];
                    $adminNotes = trim($data['admin_notes'] ?? '');

                    if ($data['status'] === 'active') {
                        $title = "Listing approved";
                        $body = "Your property \"$propName\" has been verified and is now visible to tenants.";
                    } else {
                        $title = "Listing rejected";
                        $body = "Your property \"$propName\" was not approved."
                              . ($adminNotes !== '' ? " Reason: $adminNotes" : " Please review the details and resubmit.");
                    }

                    $notif = $conn->prepare(
                        "INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'property_review', ?, ?)"
                    );
                    $notif->bind_param("iss", $landlordId, $title, $body);
                    $notif->execute();
                    $notif->close();
                }
            }

            echo json_encode(["success" => true]);
            exit;
        }

        if ($action === 'update_review_status') {
            $id = (int)($data['id'] ?? 0);
            $status = $data['status'] ?? '';
            $stmt = $conn->prepare("UPDATE reviews SET status=? WHERE id=?");
            $stmt->bind_param("si", $status, $id);
            $stmt->execute();
            $stmt->close();
            echo json_encode(["success" => true]);
            exit;
        }

        if ($action === 'broadcast') {
            $authorId = (int)($data['author_id'] ?? 0);
            $category = $data['category'] ?? 'system';
            $title = $data['title'] ?? '';
            $body = $data['body'] ?? '';
            $stmt = $conn->prepare(
                "INSERT INTO admin_announcements (author_id, category, title, body) VALUES (?, ?, ?, ?)"
            );
            $stmt->bind_param("isss", $authorId, $category, $title, $body);
            $stmt->execute();
            $stmt->close();

            // admin_announcements is just an audit log of what was sent — it's
            // never read by the tenant/landlord notification bell. That bell
            // reads the `notifications` table, so without this insert the
            // announcement would silently never reach anyone. Fan it out to
            // every user as a real notification row.
            $notifStmt = $conn->prepare(
                "INSERT INTO notifications (user_id, type, title, body) SELECT id, 'announcement', ?, ? FROM users"
            );
            $notifStmt->bind_param("ss", $title, $body);
            $notifStmt->execute();
            $notifStmt->close();

            echo json_encode(["success" => true]);
            exit;
        }

        echo json_encode(["success" => false, "message" => "Unknown action."]);
        exit;
    }

    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal Server Error: " . $e->getMessage()]);
}
?>
