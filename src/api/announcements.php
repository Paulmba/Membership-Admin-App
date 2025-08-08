<?php
// api/announcements.php

// Set headers for CORS and content type
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle pre-flight OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include the database connection file
include_once 'config/database.php';

// Establish database connection
try {
    $database = new Database();
    $pdo = $database->getConnection();
} catch (Exception $e) {
    http_response_code(503); // Service Unavailable
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Determine the request method
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // --- READ active announcements ---
        // Fetches announcements that have not expired yet
        $query = "SELECT id, title, content, DATE_FORMAT(expiry_date, '%Y-%m-%d') as expiry_date, created_at FROM announcements WHERE expiry_date > NOW() ORDER BY created_at DESC";
        $stmt = $pdo->prepare($query);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $announcements]);
        } else {
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => []]);
        }
        break;

    case 'POST':
        // --- CREATE a new announcement ---
        $data = json_decode(file_get_contents("php://input"));

        // Basic validation
        if (empty($data->title) || empty($data->content) || empty($data->expiry_date)) {
            http_response_code(400); // Bad Request
            echo json_encode(['success' => false, 'message' => 'Incomplete data. Title, content, and expiry date are required.']);
            exit();
        }

        $query = "INSERT INTO announcements (title, content, expiry_date) VALUES (:title, :content, :expiry_date)";
        $stmt = $pdo->prepare($query);

        // Sanitize data
        $title = htmlspecialchars(strip_tags($data->title));
        $content = htmlspecialchars(strip_tags($data->content));
        $expiry_date = htmlspecialchars(strip_tags($data->expiry_date));

        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':content', $content);
        $stmt->bindParam(':expiry_date', $expiry_date);

        if ($stmt->execute()) {
            http_response_code(201); // Created
            echo json_encode(['success' => true, 'message' => 'Announcement was created.']);
        } else {
            http_response_code(500); // Internal Server Error
            echo json_encode(['success' => false, 'message' => 'Unable to create announcement.']);
        }
        break;

    case 'PUT':
        // --- UPDATE an existing announcement ---
        $data = json_decode(file_get_contents("php://input"));
        $id = isset($_GET['id']) ? $_GET['id'] : null;

        if (!$id || empty($data->title) || empty($data->content) || empty($data->expiry_date)) {
            http_response_code(400); // Bad Request
            echo json_encode(['success' => false, 'message' => 'Incomplete data. ID, title, content, and expiry date are required.']);
            exit();
        }

        $query = "UPDATE announcements SET title = :title, content = :content, expiry_date = :expiry_date WHERE id = :id";
        $stmt = $pdo->prepare($query);

        // Sanitize data
        $title = htmlspecialchars(strip_tags($data->title));
        $content = htmlspecialchars(strip_tags($data->content));
        $expiry_date = htmlspecialchars(strip_tags($data->expiry_date));
        $id = htmlspecialchars(strip_tags($id));

        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':content', $content);
        $stmt->bindParam(':expiry_date', $expiry_date);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                http_response_code(200); // OK
                echo json_encode(['success' => true, 'message' => 'Announcement was updated.']);
            } else {
                http_response_code(404); // Not Found
                echo json_encode(['success' => false, 'message' => 'Announcement not found or no changes made.']);
            }
        } else {
            http_response_code(500); // Internal Server Error
            echo json_encode(['success' => false, 'message' => 'Unable to update announcement.']);
        }
        break;

    case 'DELETE':
        // --- DELETE an announcement ---
        $id = isset($_GET['id']) ? $_GET['id'] : null;

        if (!$id) {
            http_response_code(400); // Bad Request
            echo json_encode(['success' => false, 'message' => 'No ID provided.']);
            exit();
        }

        $query = "DELETE FROM announcements WHERE id = :id";
        $stmt = $pdo->prepare($query);

        // Sanitize data
        $id = htmlspecialchars(strip_tags($id));
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                http_response_code(200); // OK
                echo json_encode(['success' => true, 'message' => 'Announcement was deleted.']);
            } else {
                http_response_code(404); // Not Found
                echo json_encode(['success' => false, 'message' => 'Announcement not found.']);
            }
        } else {
            http_response_code(500); // Internal Server Error
            echo json_encode(['success' => false, 'message' => 'Unable to delete announcement.']);
        }
        break;

    default:
        // Invalid request method
        http_response_code(405); // Method Not Allowed
        echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
        break;
}
