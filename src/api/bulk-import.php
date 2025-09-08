<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once './config/database.php';
include_once './models/Member.php';

$database = new Database();
$db = $database->getConnection();
$member = new Member($db);

$response = [
    'success' => false,
    'message' => '',
    'data' => [],
    'errors' => []
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['csvFile']) && $_FILES['csvFile']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['csvFile']['tmp_name'];
        $fileName = $_FILES['csvFile']['name'];
        $fileType = pathinfo($fileName, PATHINFO_EXTENSION);

        // Ensure file is CSV
        if (strtolower($fileType) !== 'csv') {
            $response['message'] = 'Only CSV files are allowed.';
            echo json_encode($response);
            exit;
        }

        $importedMembers = [];
        $errors = [];

        if (($handle = fopen($file, "r")) !== false) {
            // Read header row
            $header = fgetcsv($handle);

            // Normalize header (lowercase, trimmed)
            $header = array_map(fn ($h) => strtolower(trim($h)), $header);

            // Expected header
            $expectedHeader = ['first_name', 'last_name', 'gender', 'dob', 'address', 'phone_number'];

            // Validate header
            if ($header !== $expectedHeader) {
                $response['message'] = 'CSV header is invalid. Expected: ' . implode(', ', $expectedHeader);
                echo json_encode($response);
                exit;
            }

            $row = 1;
            while (($data = fgetcsv($handle)) !== false) {
                $row++;

                // Skip empty rows
                if (empty(array_filter($data))) {
                    continue;
                }

                // Fix mismatch: trim row to expected column count
                if (count($data) > count($header)) {
                    $data = array_slice($data, 0, count($header));
                }

                // Skip row if still mismatched
                if (count($data) !== count($header)) {
                    $errors[] = "Row $row: Column mismatch (expected " . count($header) . " values, got " . count($data) . ")";
                    continue;
                }

                // Combine header + row into associative array
                $memberData = array_combine($header, $data);

                // Validate required fields
                if (
                    empty($memberData['first_name']) ||
                    empty($memberData['last_name']) ||
                    empty($memberData['gender']) ||
                    empty($memberData['dob'])
                ) {
                    $errors[] = "Row $row: Missing required fields";
                    continue;
                }

                // Validate gender
                $validGenders = ['Male', 'Female', 'Other'];
                if (!in_array($memberData['gender'], $validGenders)) {
                    $errors[] = "Row $row: Invalid gender. Must be one of: " . implode(', ', $validGenders);
                    continue;
                }

                // Validate date format
                if (!DateTime::createFromFormat('Y-m-d', $memberData['dob'])) {
                    $errors[] = "Row $row: Invalid date format. Use YYYY-MM-DD";
                    continue;
                }

                // Assign to member object
                $member->first_name = $memberData['first_name'];
                $member->last_name  = $memberData['last_name'];
                $member->gender     = $memberData['gender'];
                $member->dob        = $memberData['dob'];
                $member->address    = $memberData['address'] ?? null;
                $member->phone_number = $memberData['phone_number'] ?? null;
                $member->profile_completed = 0;

                // Save to DB
                error_log("Attempting to create member: " . print_r($memberData, true));
                if ($member->create()) {
                    $importedMembers[] = [
                        'first_name' => $memberData['first_name'],
                        'last_name'  => $memberData['last_name'],
                        'gender'     => $memberData['gender'],
                        'dob'        => $memberData['dob'],
                        'address'    => $memberData['address'],
                        'phone_number' => $memberData['phone_number']
                    ];
                    error_log("Successfully created member: " . print_r($memberData, true));
                } else {
                    $errors[] = "Row $row: Failed to insert into database";
                    error_log("Failed to create member: " . print_r($memberData, true));
                }
            }
            fclose($handle);

            // Build response
            if (empty($errors)) {
                $response['success'] = true;
                $response['message'] = 'Successfully imported ' . count($importedMembers) . ' members';
                $response['data'] = $importedMembers;
            } else {
                $response['success'] = true;
                $response['message'] = 'Imported ' . count($importedMembers) . ' members with ' . count($errors) . ' errors';
                $response['data'] = $importedMembers;
                $response['errors'] = $errors;
            }
        } else {
            $response['message'] = 'Failed to open CSV file';
        }
    } else {
        $response['message'] = 'No CSV file uploaded or upload error';
    }
} else {
    $response['message'] = 'Invalid request method';
}

echo json_encode($response);
