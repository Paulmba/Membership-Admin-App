<?php
// api/ai_reports.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // IMPORTANT: Restrict this to your frontend domain in production
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include necessary files
include_once __DIR__ . '/config/Database.php';
include_once __DIR__ . '/models/Member.php'; // Updated path

// Reusable Gemini API Call Function with Exponential Backoff
function callGeminiAPI($prompt, $model = 'gemini-2.5-flash-preview-05-20', $maxRetries = 3, $initialDelay = 1000)
{
    $GEMINI_API_KEY = 'AIzaSyDpJm1CJCt4MYAZ3lvf_3fIEn7cBeZu9co'; // <<< REPLACE THIS WITH YOUR ACTUAL GEMINI API KEY
    if (empty($GEMINI_API_KEY)) {
        error_log("GEMINI_API_KEY is not set.");
        return ['success' => false, 'message' => 'API Key not configured.'];
    }

    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . $GEMINI_API_KEY;
    $payload = json_encode([
        'contents' => [
            ['parts' => [['text' => $prompt]]]
        ]
    ]);

    $retries = 0;
    while ($retries < $maxRetries) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60); // Set a timeout for the request

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            error_log("cURL error on attempt {$retries}: " . $curlError);
            $retries++;
            usleep($initialDelay * 1000 * (1 << $retries)); // Exponential backoff
            continue;
        }

        if ($httpCode >= 200 && $httpCode < 300) {
            return json_decode($response, true);
        } else {
            error_log("Gemini API error (HTTP {$httpCode}) on attempt {$retries}: " . $response);
            $retries++;
            usleep($initialDelay * 1000 * (1 << $retries)); // Exponential backoff
        }
    }

    return ['success' => false, 'message' => 'Failed to connect to Gemini API after multiple retries.'];
}

// Instantiate DB and Member object
$database = new Database();
$db = $database->getConnection();
$member = new Member($db);

$input = json_decode(file_get_contents("php://input"));

$reportType = $input->report_type ?? 'membership_summary';
$period = $input->period ?? 'last_30_days';
$addressTerm = $input->address_term ?? null; // Capture address term for specific filtering
$userQuery = $input->user_query ?? null; // NEW: Capture user's free-form custom query

// --- Fetch Data from Database ---
$dataForReport = [];
$reportTitle = "AI-Generated Report";
$prompt = "";

try {
    $members_array = [];
    $stmt = null;

    // Determine data fetching strategy based on report type and available terms
    if ($reportType === 'custom_analysis' && !empty($addressTerm)) {
        // If custom analysis and an address term is provided, use the new method
        $stmt = $member->getByAddressSimilarity($addressTerm);
        $reportTitle = "Custom AI Analysis Report for " . htmlspecialchars($addressTerm) . " Area";
    } else {
        // Otherwise, fetch all members for general analysis or other report types
        $stmt = $member->getAll();
    }

    if ($stmt) {
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $members_array[] = $row;
        }
    }

    // Prepare data based on report type
    switch ($reportType) {
        case 'membership_summary':
            $reportTitle = "Membership Summary Report for " . ucwords(str_replace('_', ' ', $period));

            $totalMembers = $member->getTotalCount();
            $mobileUsersCount = $member->getMobileUsersCount();
            $webUsersCount = $totalMembers - $mobileUsersCount;

            $verifiedMembers = 0;
            $genderDistribution = ['Male' => 0, 'Female' => 0, 'Other' => 0];
            $sourceDistribution = ['Mobile' => 0, 'Web' => 0];
            $ageGroups = []; // Will calculate this dynamically

            // Calculate age and other distributions
            foreach ($members_array as $mem) {
                if (isset($mem['is_verified']) && $mem['is_verified'] == 1) {
                    $verifiedMembers++;
                }
                $genderDistribution[$mem['gender']] = ($genderDistribution[$mem['gender']] ?? 0) + 1;
                $sourceDistribution[$mem['source']] = ($sourceDistribution[$mem['source']] ?? 0) + 1;

                if (!empty($mem['dob'])) {
                    $birthDate = new DateTime($mem['dob']);
                    $currentDate = new DateTime();
                    $age = $currentDate->diff($birthDate)->y;

                    $ageGroup = '';
                    if ($age < 18) $ageGroup = 'Under 18';
                    else if ($age >= 18 && $age <= 24) $ageGroup = '18-24';
                    else if ($age >= 25 && $age <= 34) $ageGroup = '25-34';
                    else if ($age >= 35 && $age <= 44) $ageGroup = '35-44';
                    else if ($age >= 45 && $age <= 54) $ageGroup = '45-54';
                    else if ($age >= 55 && $age <= 64) $ageGroup = '55-64';
                    else $ageGroup = '65+';

                    $ageGroups[$ageGroup] = ($ageGroups[$ageGroup] ?? 0) + 1;
                }
            }

            $prompt = "Generate a comprehensive membership summary report for the " . ucwords(str_replace('_', ' ', $period)) . " period. " .
                "Focus on overall numbers, growth, demographics, and user sources. " .
                "The report should be professional, insightful, and easy to read, using clear headings and bullet points. " .
                "Here is the summarized data:\n\n" .
                "- Total Members: {$totalMembers}\n" .
                "- Mobile Users: {$mobileUsersCount}\n" .
                "- Web Users: {$webUsersCount}\n" .
                "- Verified Members: {$verifiedMembers}\n" .
                "- Gender Distribution: " . json_encode($genderDistribution) . "\n" .
                "- Source Distribution: " . json_encode($sourceDistribution) . "\n" .
                "- Age Group Distribution: " . json_encode($ageGroups) . "\n\n" .
                "Analyze this data and provide a detailed report including an overview, key findings, and recommendations. Make sure the report sounds like it was written by an expert analyst.";
            break;

        case 'growth_analysis':
            $reportTitle = "Membership Growth Analysis for " . ucwords(str_replace('_', ' ', $period));

            // Fetch historical growth data (example: monthly registrations)
            // This requires a `created_at` timestamp in your members table
            $growth_data_query = "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as members_added
                                  FROM " . $member->getTableName() . "
                                  WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                                  GROUP BY month ORDER BY month ASC";
            $stmt_growth = $db->prepare($growth_data_query);
            $stmt_growth->execute();
            $growth_data = $stmt_growth->fetchAll(PDO::FETCH_ASSOC);

            $prompt = "Conduct a membership growth analysis for the " . ucwords(str_replace('_', ' ', $period)) . " period. " .
                "Analyze the provided monthly membership additions and discuss trends, peak periods, and potential reasons for growth or stagnation. " .
                "Provide actionable insights and strategies for sustained growth. Format as a analysis report with very easy to understand language and also keep it brief keeping in mind that this data is for a church so even for recommendations it should center on church related activities.\n\n" .
                "Historical monthly new members data:\n" . json_encode($growth_data) . "\n\n";
            break;

        case 'demographic_insights':
            $reportTitle = "Demographic Insights Report for " . ucwords(str_replace('_', ' ', $period));

            // Data for demographics (gender, age, location if available)
            $gender_query = "SELECT gender, COUNT(*) as count FROM " . $member->getTableName() . " GROUP BY gender";
            $age_query = "SELECT FLOOR(DATEDIFF(NOW(), dob) / 365) AS age_group_raw, COUNT(*) AS count FROM " . $member->getTableName() . " GROUP BY age_group_raw ORDER BY age_group_raw ASC";
            // For location, you'd need a 'country' or 'city' column in your members table
            // $location_query = "SELECT address_city, COUNT(*) as count FROM " . $member->getTableName() . " GROUP BY address_city ORDER BY count DESC LIMIT 10";

            $stmt_gender = $db->prepare($gender_query);
            $stmt_gender->execute();
            $gender_data = $stmt_gender->fetchAll(PDO::FETCH_ASSOC);

            $stmt_age = $db->prepare($age_query);
            $stmt_age->execute();
            $age_data_raw = $stmt_age->fetchAll(PDO::FETCH_ASSOC);

            // Group raw ages into standard age groups
            $age_groups_summary = [];
            foreach ($age_data_raw as $age_row) {
                $age = $age_row['age_group_raw'];
                $count = $age_row['count'];
                $ageGroup = '';
                if ($age < 18) $ageGroup = 'Under 18';
                else if ($age >= 18 && $age <= 24) $ageGroup = '18-24';
                else if ($age >= 25 && $age <= 34) $ageGroup = '25-34';
                else if ($age >= 35 && $age <= 44) $ageGroup = '35-44';
                else if ($age >= 45 && $age <= 54) $ageGroup = '45-54';
                else if ($age >= 55 && $age <= 64) $ageGroup = '55-64';
                else $ageGroup = '65+';
                $age_groups_summary[$ageGroup] = ($age_groups_summary[$ageGroup] ?? 0) + $count;
            }


            $prompt = "Generate a demographic insights report for members over the " . ucwords(str_replace('_', ' ', $period)) . " period. " .
                "Analyze the provided gender and age distribution data. " .
                "Identify key demographic segments, discuss their characteristics, and suggest how these insights can be used for targeted strategies. " .
                "Format as a detailed demographic analysis.\n\n" .
                "Gender Distribution: " . json_encode($gender_data) . "\n" .
                "Age Distribution: " . json_encode($age_groups_summary) . "\n\n"; // Add location data if available
            break;

        case 'engagement_metrics':
            $reportTitle = "Member Engagement Metrics Report for " . ucwords(str_replace('_', ' ', $period));

            // Assuming you have an 'activity' table or similar for engagement
            // Example: last login, number of actions, profile completion rate
            $active_members_query = "SELECT COUNT(DISTINCT mid) as active_count FROM " . $member->getTableName() . " WHERE last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            $stmt_active = $db->prepare($active_members_query);
            $stmt_active->execute();
            $active_count = $stmt_active->fetch(PDO::FETCH_ASSOC)['active_count'];

            $profile_completion_query = "SELECT COUNT(*) as completed_count FROM " . $member->getTableName() . " WHERE profile_completed = 1";
            $stmt_profile = $db->prepare($profile_completion_query);
            $stmt_profile->execute();
            $completed_profile_count = $stmt_profile->fetch(PDO::FETCH_ASSOC)['completed_count'];
            $totalMembers = count($members_array); // Use fetched members_array for total
            $profile_completion_rate = $totalMembers > 0 ? round(($completed_profile_count / $totalMembers) * 100, 2) : 0;

            $prompt = "Generate a member engagement metrics report for the " . ucwords(str_replace('_', ' ', $period)) . " period. " .
                "Analyze metrics like active users, profile completion, and discuss implications. " .
                "Provide strategies to enhance member engagement and reduce inactivity. " .
                "Format as an engagement analysis report.\n\n" .
                "Key Engagement Data:\n" .
                "- Total Members: {$totalMembers}\n" .
                "- Active Members (last 30 days): {$active_count}\n" .
                "- Profile Completion Rate: {$profile_completion_rate}%\n\n";
            // Add more engagement metrics here if available (e.g., average sessions, content consumed)
            break;

        case 'custom_analysis':
            $promptContext = "";
            if (!empty($userQuery)) {
                $reportTitle = "Custom AI Query Analysis: " . htmlspecialchars(substr($userQuery, 0, 50)) . (strlen($userQuery) > 50 ? '...' : '');
                $promptContext = "Based on your specific query: \"" . htmlspecialchars($userQuery) . "\", ";
                // For custom queries, we rely on AI to analyze the general dataset based on the prompt.
                // No specific database filtering by address_term for this type unless explicitly requested in prompt.
            } else if (!empty($addressTerm)) {
                $reportTitle = "Custom AI Analysis Report for " . htmlspecialchars($addressTerm) . " Area (" . ucwords(str_replace('_', ' ', $period)) . ")";
                $promptContext = "This data specifically includes members associated with the address search term: '" . htmlspecialchars($addressTerm) . "'. ";
            } else {
                $reportTitle = "Custom AI Analysis Report for All Members (" . ucwords(str_replace('_', ' ', $period)) . ")";
                $promptContext = "Analyze the overall membership data. ";
            }

            $prompt = "Perform a custom AI analysis on the provided membership data. " .
                $promptContext .
                "Identify any interesting patterns, anomalies, or correlations within this group. " .
                "Provide a high-level overview and unique insights relevant to the data provided. " .
                "Here is a sample of the raw member data for context:\n\n";

            // Limit the data sent to Gemini to avoid exceeding token limits, especially for large datasets.
            $sample_members = array_slice($members_array, 0, 50); // Take up to 50 for sample analysis
            if (empty($sample_members)) {
                $prompt .= "No members found for the specified criteria. Please analyze potential reasons or implications.";
            } else {
                foreach ($sample_members as $s_mem) {
                    $prompt .= "   - Member ID: " . $s_mem['mid'] . ", Gender: " . $s_mem['gender'] . ", DOB: " . $s_mem['dob'] . ", Address: " . $s_mem['address'] . ", Source: " . $s_mem['source'] . ", Verified: " . ($s_mem['is_verified'] ? 'Yes' : 'No') . "\n";
                }
            }
            $prompt .= "\nBased on this data and the provided context, provide detailed insights and actionable recommendations tailored to this group.";

            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid report type selected.']);
            exit();
    }

    // Call Gemini API
    $geminiResponse = callGeminiAPI($prompt);

    if (isset($geminiResponse['candidates'][0]['content']['parts'][0]['text'])) {
        $generatedContent = $geminiResponse['candidates'][0]['content']['parts'][0]['text'];
        echo json_encode([
            'success' => true,
            'report' => [
                'title' => $reportTitle,
                'content' => $generatedContent,
                'generated_at' => date('Y-m-d H:i:s')
            ]
        ]);
    } else {
        $errorMessage = 'Failed to get report from AI.';
        if (isset($geminiResponse['message'])) {
            $errorMessage = $geminiResponse['message']; // Error from helper function
        } elseif (isset($geminiResponse['error']['message'])) {
            $errorMessage .= ' Gemini Error: ' . $geminiResponse['error']['message'];
        } else {
            $errorMessage .= ' Unknown Gemini API response structure. Debug log for details.';
            error_log('Gemini API raw response (ai_reports): ' . json_encode($geminiResponse));
        }
        echo json_encode(['success' => false, 'message' => $errorMessage]);
    }
} catch (PDOException $e) {
    error_log("Database Error in ai_reports.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Application Error in ai_reports.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An application error occurred: ' . $e->getMessage()]);
}
