<?php
// === CORS (allow your Vite + React origin) ===
$allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
];
if (!empty($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins)) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// === Debug errors (disable in production) ===
error_reporting(E_ALL);
ini_set('display_errors', 1);
ob_start();

// Log function for debugging
function debugLog($message)
{
    error_log("[DEBUG] " . $message);
}

try {
    debugLog("Starting dashboard API request");

    // ── Check if files exist before requiring them ──
    $configPath = __DIR__ . '/config/database.php';
    $memberPath = __DIR__ . '/models/Member.php';
    $statsPath = __DIR__ . '/models/stats.php';

    debugLog("Checking file paths:");
    debugLog("Config: $configPath - " . (file_exists($configPath) ? "EXISTS" : "MISSING"));
    debugLog("Member: $memberPath - " . (file_exists($memberPath) ? "EXISTS" : "MISSING"));
    debugLog("Stats: $statsPath - " . (file_exists($statsPath) ? "EXISTS" : "MISSING"));

    if (!file_exists($configPath)) {
        throw new Exception("Database config file not found at: $configPath");
    }
    if (!file_exists($memberPath)) {
        throw new Exception("Member model file not found at: $memberPath");
    }
    if (!file_exists($statsPath)) {
        throw new Exception("Stats model file not found at: $statsPath");
    }

    debugLog("Including required files...");
    require_once $configPath;
    require_once $memberPath;
    require_once $statsPath;

    // ── Check if classes exist ──
    debugLog("Checking if classes exist...");
    if (!class_exists('Database')) {
        throw new Exception('Database class not found - check your database.php file');
    }
    if (!class_exists('Stats')) {
        throw new Exception('Stats class not found - check your stats.php file');
    }

    debugLog("Classes found, attempting database connection...");

    // ── Test database connection ──
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception('Database connection returned null - check your database credentials');
    }

    debugLog("Database connection successful, testing query...");

    // Test if connection is actually working
    try {
        $db->query("SELECT 1");
        debugLog("Database query test successful");
    } catch (PDOException $e) {
        debugLog("Database query test failed: " . $e->getMessage());
        throw new Exception('Database connection test failed: ' . $e->getMessage());
    }

    // ── Initialize Stats model ──
    debugLog("Initializing Stats model...");
    $statsModel = new Stats($db);

    // ── Get data with individual error handling ──
    $stats = null;
    $recent_activities = null;

    debugLog("Getting dashboard stats...");
    try {
        $stats = $statsModel->getDashboardStats();
        debugLog("Dashboard stats retrieved successfully");
    } catch (Exception $e) {
        debugLog("Stats error: " . $e->getMessage());
        error_log("Stats error: " . $e->getMessage());
        $stats = [
            'total_members' => 0,
            'mobile_users' => 0,
            'active_members' => 0,
            'new_members_this_month' => 0,
            'total_events' => 0,
            'attendance_rate' => 0,
            'member_growth' => 0,
            'mobile_growth' => 0
        ];
    }

    debugLog("Getting recent activities...");
    try {
        $recent_activities = $statsModel->getRecentActivities(10);
        debugLog("Recent activities retrieved successfully");
    } catch (Exception $e) {
        debugLog("Recent activities error: " . $e->getMessage());
        error_log("Recent activities error: " . $e->getMessage());
        $recent_activities = [];
    }

    debugLog("Preparing response...");
    $response = [
        'success' => true,
        'data'    => [
            'stats'             => $stats,
            'recent_activities' => $recent_activities,
            'upcoming_events'   => [
                [
                    'title'     => 'Sunday Service',
                    'date'      => date('F j, Y', strtotime('next Sunday')),
                    'time'      => '10:00 AM',
                    'attendees' => 120
                ],
                [
                    'title'     => 'Bible Study',
                    'date'      => date('F j, Y', strtotime('next Tuesday')),
                    'time'      => '7:00 PM',
                    'attendees' => 45
                ],
                [
                    'title'     => 'Youth Fellowship',
                    'date'      => date('F j, Y', strtotime('next Thursday')),
                    'time'      => '6:30 PM',
                    'attendees' => 32
                ]
            ]
        ]
    ];

    debugLog("Sending successful response");
    ob_end_clean();
    http_response_code(200);
    echo json_encode($response);
} catch (Exception $e) {
    debugLog("Exception caught: " . $e->getMessage());
    ob_end_clean();

    // Log the full error for debugging
    error_log("Dashboard API Error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage(),
        'error_type' => 'server_error',
        'debug_info' => [
            'config_path' => $configPath ?? 'undefined',
            'member_path' => $memberPath ?? 'undefined',
            'stats_path' => $statsPath ?? 'undefined',
            'current_dir' => __DIR__,
            'php_version' => phpversion(),
            'extensions' => get_loaded_extensions()
        ]
    ]);
}