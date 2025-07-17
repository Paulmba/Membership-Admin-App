<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once './config/database.php';
require_once './models/Member.php';

$database = new Database();
$db = $database->getConnection();

$member = new Member($db);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetRequest($member);
        break;
    case 'POST':
        handlePostRequest($member);
        break;
    case 'PUT':
        handlePutRequest($member);
        break;
    case 'DELETE':
        handleDeleteRequest($member);
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}

function handleGetRequest($member)
{
    try {
        $source = isset($_GET['source']) ? $_GET['source'] : null;
        $search = isset($_GET['search']) ? $_GET['search'] : null;
        $id = isset($_GET['id']) ? $_GET['id'] : null;

        if ($id) {
            // Get specific member
            $stmt = $member->getById($id);
            $member_data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($member_data) {
                $response = [
                    'success' => true,
                    'data' => formatMemberData($member_data)
                ];
            } else {
                $response = [
                    'success' => false,
                    'message' => 'Member not found'
                ];
                http_response_code(404);
            }
        } else {
            // Get all members with filters
            if ($search) {
                $stmt = $member->search($search);
            } elseif ($source) {
                $stmt = $member->getBySource($source);
            } else {
                $stmt = $member->getAll();
            }

            $members = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $members[] = formatMemberData($row);
            }

            $response = [
                'success' => true,
                'data' => $members,
                'total' => count($members)
            ];
        }

        http_response_code(200);
        echo json_encode($response);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Internal server error: ' . $e->getMessage()
        ]);
    }
}

function handlePostRequest($member)
{
    try {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
            return;
        }

        // Validate required fields
        $required_fields = ['first_name', 'last_name', 'gender', 'dob'];
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "Field '{$field}' is required"]);
                return;
            }
        }

        // Convert gender to initial
        $gender_mapping = [
            'Male' => 'M',
            'Female' => 'F',
            'Other' => 'O',
            'Prefer not to say' => 'P'
        ];
        $gender_initial = isset($gender_mapping[$data['gender']]) ? $gender_mapping[$data['gender']] : 'O';

        // Set member properties
        $member->first_name = $data['first_name'];
        $member->last_name = $data['last_name'];
        $member->gender = $gender_initial;
        $member->dob = $data['dob'];
        $member->address = $data['address'] ?? '';
        $member->phone_number = $data['phone_number'] ?? '';
        $member->profile_completed = $data['profile_completed'] ?? 0;

        $member_id = $member->create();

        if ($member_id) {
            $response = [
                'success' => true,
                'message' => 'Member created successfully',
                'data' => ['id' => $member_id]
            ];
            http_response_code(201);
        } else {
            $response = [
                'success' => false,
                'message' => 'Failed to create member'
            ];
            http_response_code(500);
        }

        echo json_encode($response);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Internal server error: ' . $e->getMessage()
        ]);
    }
}

function handlePutRequest($member)
{
    try {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data || !isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid data or missing ID']);
            return;
        }

        // Convert gender to initial
        $gender_mapping = [
            'Male' => 'M',
            'Female' => 'F',
            'Other' => 'O',
            'Prefer not to say' => 'P'
        ];
        $gender_initial = isset($gender_mapping[$data['gender']]) ? $gender_mapping[$data['gender']] : $data['gender'];

        // Set member properties
        $member->mid = $data['id'];
        $member->first_name = $data['first_name'] ?? '';
        $member->last_name = $data['last_name'] ?? '';
        $member->gender = $gender_initial;
        $member->dob = $data['dob'] ?? '';
        $member->address = $data['address'] ?? '';
        $member->phone_number = $data['phone_number'] ?? '';
        $member->profile_completed = $data['profile_completed'] ?? 0;

        if ($member->update()) {
            $response = [
                'success' => true,
                'message' => 'Member updated successfully'
            ];
            http_response_code(200);
        } else {
            $response = [
                'success' => false,
                'message' => 'Failed to update member'
            ];
            http_response_code(500);
        }

        echo json_encode($response);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Internal server error: ' . $e->getMessage()
        ]);
    }
}

function handleDeleteRequest($member)
{
    try {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data || !isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing member ID']);
            return;
        }

        $member->mid = $data['id'];

        if ($member->delete()) {
            $response = [
                'success' => true,
                'message' => 'Member deleted successfully'
            ];
            http_response_code(200);
        } else {
            $response = [
                'success' => false,
                'message' => 'Failed to delete member'
            ];
            http_response_code(500);
        }

        echo json_encode($response);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Internal server error: ' . $e->getMessage()
        ]);
    }
}

function formatMemberData($row)
{
    // Convert gender initial back to full name
    $gender_mapping = [
        'M' => 'Male',
        'F' => 'Female',
        'O' => 'Other',
        'P' => 'Prefer not to say'
    ];
    $gender_full = isset($gender_mapping[$row['gender']]) ? $gender_mapping[$row['gender']] : $row['gender'];

    return [
        'id' => $row['mid'],
        'name' => $row['first_name'] . ' ' . $row['last_name'],
        'first_name' => $row['first_name'],
        'last_name' => $row['last_name'],
        'gender' => $gender_full,
        'dob' => $row['dob'],
        'address' => $row['address'],
        'phone_number' => $row['phone_number'],
        'mobile_phone' => $row['mobile_phone'] ?? null,
        'is_verified' => $row['is_verified'] ?? null,
        'profile_completed' => $row['profile_completed'],
        'source' => $row['source'],
        'joined' => date('Y-m-d', strtotime($row['created_at'])),
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at']
    ];
}