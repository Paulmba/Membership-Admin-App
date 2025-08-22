<?php
// src/api/leadership.php

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');
    http_response_code(200);
    exit();
}

// Set CORS headers for all requests
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

include_once 'config/database.php';
include_once 'models/leadership_role.php';

$database = new Database();
$db = $database->getConnection();
$leadership = new LeadershipRole($db);

$request_method = $_SERVER['REQUEST_METHOD'];
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path_parts = explode('/', $request_uri);

switch ($request_method) {
    case 'GET':
        handleGetRequest();
        break;
    case 'POST':
        handlePostRequest();
        break;
    case 'DELETE':
        handleDeleteRequest();
        break;
    default:
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
        break;
}

function handleGetRequest()
{
    global $leadership;

    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'roles':
            getRoles();
            break;
        case 'current-leadership':
            getCurrentLeadership();
            break;
        case 'eligible-members':
            getEligibleMembers();
            break;
        case 'stats':
            getLeadershipStats();
            break;
        default:
            http_response_code(400);
            echo json_encode(['message' => 'Invalid action']);
            break;
    }
}

function handlePostRequest()
{
    global $leadership;

    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    switch ($action) {
        case 'assign-role':
            assignRole($input);
            break;
        case 'create-role':
            createRole($input);
            break;
        case 'update-role':
            updateRole($input);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
}

function handleDeleteRequest()
{
    global $leadership;

    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    switch ($action) {
        case 'remove-role':
            removeRole($input);
            break;
        case 'delete-role':
            deleteRole($input);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
}

function getRoles()
{
    global $leadership;

    try {
        $stmt = $leadership->getAllRoles();
        $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $roles]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch roles']);
    }
}

function getCurrentLeadership()
{
    global $leadership;

    try {
        $stmt = $leadership->getCurrentLeadership();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Group results by role
        $grouped = [];
        foreach ($results as $row) {
            $role_id = $row['role_id'];

            if (!isset($grouped[$role_id])) {
                $grouped[$role_id] = [
                    'role_id' => $row['role_id'],
                    'role_name' => $row['role_name'],
                    'max_allowed' => $row['max_allowed'],
                    'description' => $row['description'],
                    'assignments' => []
                ];
            }

            if ($row['mid']) {
                $grouped[$role_id]['assignments'][] = [
                    'assignment_id' => $row['assignment_id'],
                    'member_id' => $row['mid'],
                    'first_name' => $row['first_name'],
                    'last_name' => $row['last_name'],
                    'gender' => $row['gender'],
                    'age' => $row['age'],
                    'assigned_at' => $row['assigned_at']
                ];
            }
        }

        // Convert to indexed array
        $leadership_data = array_values($grouped);

        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $leadership_data]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch current leadership']);
    }
}

function getEligibleMembers()
{
    global $leadership;

    $role_id = $_GET['role_id'] ?? '';

    if (!$role_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Role ID is required']);
        return;
    }

    try {
        $stmt = $leadership->getEligibleMembers($role_id);

        if ($stmt === false) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Role not found']);
            return;
        }

        $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $members]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch eligible members']);
    }
}

function getLeadershipStats()
{
    global $leadership;

    try {
        $stmt = $leadership->getLeadershipStats();
        $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $stats]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch leadership stats']);
    }
}

function assignRole($input)
{
    global $leadership;

    $role_id = $input['role_id'] ?? '';
    $member_id = $input['member_id'] ?? '';
    $assigned_by = $input['assigned_by'] ?? null;

    if (!$role_id || !$member_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Role ID and Member ID are required']);
        return;
    }

    try {
        $result = $leadership->assignRole($role_id, $member_id, $assigned_by);

        if ($result['success']) {
            http_response_code(200);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to assign role']);
    }
}

function removeRole($input)
{
    global $leadership;

    $assignment_id = $input['assignment_id'] ?? '';

    if (!$assignment_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Assignment ID is required']);
        return;
    }

    try {
        $result = $leadership->removeRole($assignment_id);

        if ($result['success']) {
            http_response_code(200);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to remove role']);
    }
}

// Configuration functions
function createRole($input)
{
    global $leadership;

    $role_name = trim($input['role_name'] ?? '');
    $description = trim($input['description'] ?? '') ?: null;
    $max_allowed = !empty($input['max_allowed']) ? (int)$input['max_allowed'] : null;
    $min_age = !empty($input['min_age']) ? (int)$input['min_age'] : null;
    $max_age = !empty($input['max_age']) ? (int)$input['max_age'] : null;
    $gender_requirement = $input['gender_requirement'] ?? 'any';

    if (!$role_name) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Role name is required']);
        return;
    }

    // Validate gender requirement
    if (!in_array($gender_requirement, ['any', 'male', 'female'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid gender requirement']);
        return;
    }

    // Validate age constraints
    if ($min_age && $max_age && $min_age > $max_age) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Minimum age cannot be greater than maximum age']);
        return;
    }

    try {
        $result = $leadership->createRole($role_name, $description, $max_allowed, $min_age, $max_age, $gender_requirement);

        if ($result['success']) {
            http_response_code(201);
        } else {
            http_response_code(400);
        }
        echo json_encode($result);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create role']);
    }
}

function updateRole($input)
{
    global $leadership;

    $role_id = $input['role_id'] ?? '';
    $role_name = trim($input['role_name'] ?? '');
    $description = trim($input['description'] ?? '') ?: null;
    $max_allowed = !empty($input['max_allowed']) ? (int)$input['max_allowed'] : null;
    $min_age = !empty($input['min_age']) ? (int)$input['min_age'] : null;
    $max_age = !empty($input['max_age']) ? (int)$input['max_age'] : null;
    $gender_requirement = $input['gender_requirement'] ?? 'any';

    if (!$role_id || !$role_name) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Role ID and name are required']);
        return;
    }

    // Validate gender requirement
    if (!in_array($gender_requirement, ['any', 'male', 'female'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid gender requirement']);
        return;
    }

    // Validate age constraints
    if ($min_age && $max_age && $min_age > $max_age) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Minimum age cannot be greater than maximum age']);
        return;
    }

    try {
        $result = $leadership->updateRole($role_id, $role_name, $description, $max_allowed, $min_age, $max_age, $gender_requirement);

        if ($result['success']) {
            http_response_code(200);
        } else {
            http_response_code(400);
        }
        echo json_encode($result);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update role']);
    }
}

function deleteRole($input)
{
    global $leadership;

    $role_id = $input['role_id'] ?? '';

    if (!$role_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Role ID is required']);
        return;
    }

    try {
        $result = $leadership->deleteRole($role_id);

        if ($result['success']) {
            http_response_code(200);
        } else {
            http_response_code(400);
        }
        echo json_encode($result);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete role']);
    }
}
