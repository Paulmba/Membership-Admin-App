<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Add error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    require_once '../config/database.php';
    require_once '../models/Member.php';
    require_once '../models/stats.php'; // Fixed case sensitivity
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load required files: ' . $e->getMessage()
    ]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    try {
        $database = new Database();
        $db = $database->getConnection();

        if (!$db) {
            throw new Exception('Database connection failed');
        }

        $member = new Member($db);
        $stats = new Stats($db);

        // Get dashboard statistics
        $dashboard_stats = $stats->getDashboardStats();

        // Get recent activities
        $recent_activities = $stats->getRecentActivities(10);

        // Mock upcoming events (you can create an Events model later)
        $upcoming_events = [
            [
                'title' => 'Sunday Service',
                'date' => date('F j, Y', strtotime('next Sunday')),
                'time' => '10:00 AM',
                'attendees' => 120
            ],
            [
                'title' => 'Bible Study',
                'date' => date('F j, Y', strtotime('next Tuesday')),
                'time' => '7:00 PM',
                'attendees' => 45
            ],
            [
                'title' => 'Youth Fellowship',
                'date' => date('F j, Y', strtotime('next Thursday')),
                'time' => '6:30 PM',
                'attendees' => 32
            ]
        ];

        // Prepare response
        $response = [
            'success' => true,
            'data' => [
                'stats' => [
                    'total_members' => $dashboard_stats['total_members'] ?? 0,
                    'mobile_users' => $dashboard_stats['mobile_users'] ?? 0,
                    'attendance_rate' => $dashboard_stats['attendance_rate'] ?? 0,
                    'member_growth' => $dashboard_stats['member_growth'] ?? 0,
                    'mobile_growth' => $dashboard_stats['mobile_growth'] ?? 0
                ],
                'recent_activities' => $recent_activities ?? [],
                'upcoming_events' => $upcoming_events
            ]
        ];

        http_response_code(200);
        echo json_encode($response);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Internal server error: ' . $e->getMessage(),
            'debug' => [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}
