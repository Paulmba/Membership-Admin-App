<?php
// api/ai_analytics.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // IMPORTANT: Restrict this to your frontend domain in production
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include necessary files
include_once __DIR__ . '/config/Database.php';
include_once __DIR__ . '/models/Member.php';

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

try {
    // --- 1. Fetch ALL necessary raw data from database ---
    $stmt_all_members = $member->getAll();
    $all_members = $stmt_all_members->fetchAll(PDO::FETCH_ASSOC);

    // --- 2. Calculate Metrics & Chart Data (in PHP) ---
    $totalMembers = count($all_members);
    $mobileUsers = 0;
    $verifiedMembers = 0;
    $ageSum = 0;
    $genderDistribution = ['Male' => 0, 'Female' => 0];
    $sourceDistribution = ['Mobile' => 0, 'Web' => 0];
    $ageDistribution = []; // For the chart
    $growthData = []; // For the chart

    // Initialize growth data for past 12 months for chart
    for ($i = 11; $i >= 0; $i--) {
        $month = date('Y-m', strtotime("-$i months"));
        $growthData[$month] = 0;
    }

    foreach ($all_members as $m) {
        // Mobile Users
        if ($m['source'] === 'Mobile') {
            $mobileUsers++;
        }
        // Verified Members
        if (isset($m['is_verified']) && $m['is_verified'] == 1) {
            $verifiedMembers++;
        }
        // Gender Distribution
        $genderDistribution[$m['gender']] = ($genderDistribution[$m['gender']] ?? 0) + 1;
        // Source Distribution
        $sourceDistribution[$m['source']] = ($sourceDistribution[$m['source']] ?? 0) + 1;

        // Age Calculation
        if (!empty($m['dob'])) {
            $birthDate = new DateTime($m['dob']);
            $currentDate = new DateTime();
            $age = $currentDate->diff($birthDate)->y;
            $ageSum += $age;

            $ageGroup = '';
            if ($age < 18) $ageGroup = 'Under 18';
            else if ($age >= 18 && $age <= 24) $ageGroup = '18-24';
            else if ($age >= 25 && $age <= 34) $ageGroup = '25-34';
            else if ($age >= 35 && $age <= 44) $ageGroup = '35-44';
            else if ($age >= 45 && $age <= 54) $ageGroup = '45-54';
            else if ($age >= 55 && $age <= 64) $ageGroup = '55-64';
            else $ageGroup = '65+';

            $ageDistribution[$ageGroup] = ($ageDistribution[$ageGroup] ?? 0) + 1;
        }

        // Growth Data (monthly registrations)
        if (!empty($m['created_at'])) {
            $regMonth = date('Y-m', strtotime($m['created_at']));
            if (isset($growthData[$regMonth])) {
                $growthData[$regMonth]++;
            }
        }
    }

    // Convert age distribution to array of objects for Recharts
    $formattedAgeDistribution = [];
    foreach ($ageDistribution as $group => $count) {
        $formattedAgeDistribution[] = ['age_group' => $group, 'count' => $count];
    }
    // Sort age groups for consistent chart display (optional, based on your ageGroup definition)
    usort($formattedAgeDistribution, function ($a, $b) {
        $order = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
        return array_search($a['age_group'], $order) <=> array_search($b['age_group'], $order);
    });

    // Convert growth data to array of objects for Recharts and calculate actual growth
    $formattedGrowthData = [];
    $currentMonth = date('Y-m');
    $lastMonth = date('Y-m', strtotime('-1 month'));

    $cumulativeMembers = 0;

    foreach ($growthData as $month => $membersAdded) {
        $cumulativeMembers += $membersAdded;
        $formattedGrowthData[] = ['month' => $month, 'members' => $cumulativeMembers];
    }

    // Recalculate growth rate based on total members at month end
    $membersAtLastMonthEnd = 0;
    $membersAtTwoMonthsAgoEnd = 0;

    // Get total members at the end of the last full month
    $stmt_last_month_members = $db->prepare("SELECT COUNT(*) FROM " . $member->getTableName() . " WHERE created_at <= LAST_DAY(DATE_SUB(NOW(), INTERVAL 1 MONTH))");
    $stmt_last_month_members->execute();
    $membersAtLastMonthEnd = $stmt_last_month_members->fetchColumn();

    // Get total members at the end of two months ago
    $stmt_two_months_ago_members = $db->prepare("SELECT COUNT(*) FROM " . $member->getTableName() . " WHERE created_at <= LAST_DAY(DATE_SUB(NOW(), INTERVAL 2 MONTH))");
    $stmt_two_months_ago_members->execute();
    $membersAtTwoMonthsAgoEnd = $stmt_two_months_ago_members->fetchColumn();


    $growthRate = 0;
    if ($membersAtTwoMonthsAgoEnd > 0) {
        $growthRate = round((($membersAtLastMonthEnd - $membersAtTwoMonthsAgoEnd) / $membersAtTwoMonthsAgoEnd) * 100, 2);
    } elseif ($membersAtLastMonthEnd > 0) {
        $growthRate = 100; // If prevMonthMembers was 0 and total > 0, it's 100% growth
    }


    // Average Age
    $averageAge = $totalMembers > 0 ? round($ageSum / $totalMembers, 1) : 0;

    // Most Common Age Group
    $mostCommonAgeGroup = 'N/A';
    if (!empty($ageDistribution)) {
        arsort($ageDistribution); // Sort by count in descending order
        $mostCommonAgeGroup = key($ageDistribution);
    }

    // Mobile Percentage
    $mobilePercentage = $totalMembers > 0 ? round(($mobileUsers / $totalMembers) * 100, 2) : 0;
    // Verification Rate
    $verificationRate = $totalMembers > 0 ? round(($verifiedMembers / $totalMembers) * 100, 2) : 0;

    // --- 3. Prepare Prompt for Gemini for AI Insights ---
    // Refined prompt for stricter JSON output
    $ai_insights_prompt = "Generate 3 concise and actionable AI-generated insights and recommendations based on the following membership analytics data. " .
        "Each insight must have a 'title' (string), 'description' (string), and a 'recommendation' (string). and should contain really brief explanations and in basic terminologies for anyone to understand " .
        "**ONLY return a JSON array of objects. Do NOT include any other text, greetings, or explanations outside the JSON.** " .
        "The JSON structure must be: " .
        "[\n  {\"title\": \"Insight Title\", \"description\": \"Insight description.\", \"recommendation\": \"Actionable recommendation.\"}\n]\n\n" .
        "Analytics Data:\n" .
        "- Total Members: {$totalMembers}\n" .
        "- Growth Rate (from last month): {$growthRate}%\n" .
        "- Mobile Users: {$mobileUsers} ({$mobilePercentage}%)\n" .
        "- Verified Members: {$verifiedMembers} ({$verificationRate}% verification rate)\n" .
        "- Average Age: {$averageAge}\n" .
        "- Most Common Age Group: {$mostCommonAgeGroup}\n" .
        "- Gender Distribution: " . json_encode($genderDistribution) . "\n" .
        "- Registration Source Distribution: " . json_encode($sourceDistribution) . "\n" .
        "- Monthly Growth Trend (cumulative members): " . json_encode($formattedGrowthData) . "\n";

    $geminiResponse = callGeminiAPI($ai_insights_prompt);
    $ai_insights = [];

    if (isset($geminiResponse['candidates'][0]['content']['parts'][0]['text'])) {
        $geminiText = $geminiResponse['candidates'][0]['content']['parts'][0]['text'];

        // Robust JSON extraction: Find the first '[' and last ']'
        $firstBrace = strpos($geminiText, '[');
        $lastBrace = strrpos($geminiText, ']');

        if ($firstBrace !== false && $lastBrace !== false && $firstBrace < $lastBrace) {
            $extractedJsonString = substr($geminiText, $firstBrace, $lastBrace - $firstBrace + 1);
            $parsedInsights = json_decode($extractedJsonString, true);
        } else {
            $parsedInsights = null; // No valid JSON structure found
        }

        if (json_last_error() === JSON_ERROR_NONE && is_array($parsedInsights)) {
            $ai_insights = $parsedInsights;
        } else {
            // If Gemini didn't return perfect JSON or it couldn't be extracted, format a general insight
            error_log("Gemini did not return perfect JSON for insights OR extraction failed. Raw response: " . $geminiText);
            $ai_insights[] = [
                'title' => 'AI Insights Unavailable',
                'description' => 'Failed to parse AI-generated insights. The AI response might not be in the expected JSON format. Raw output snippet: ' . substr($geminiText, 0, 200) . '...',
                'recommendation' => 'Review the Gemini API prompt and response. The model should return only JSON.'
            ];
        }
    } else {
        error_log("No content found in Gemini API response for insights.");
        $ai_insights[] = [
            'title' => 'AI Insight Generation Failed',
            'description' => 'Failed to retrieve any content from the AI for insights. Check API logs and Gemini API key.',
            'recommendation' => 'Ensure Gemini API is accessible and prompt is clear.'
        ];
    }

    // --- 4. Prepare Final JSON Response for Frontend ---
    echo json_encode([
        'success' => true,
        'analytics' => [
            'total_members' => $totalMembers,
            'mobile_users' => $mobileUsers,
            'mobile_percentage' => $mobilePercentage,
            'verified_members' => $verifiedMembers,
            'verification_rate' => $verificationRate,
            'average_age' => $averageAge,
            'most_common_age_group' => $mostCommonAgeGroup,
            'growth_rate' => $growthRate, // This is current month vs previous month for the dashboard metric
            'growth_data' => $formattedGrowthData, // For the line chart (cumulative)
            'gender_distribution' => array_map(function ($key, $value) {
                return ['name' => $key, 'value' => $value];
            }, array_keys($genderDistribution), array_values($genderDistribution)), // For pie chart
            'source_distribution' => array_map(function ($key, $value) {
                return ['source' => $key, 'count' => $value];
            }, array_keys($sourceDistribution), array_values($sourceDistribution)), // For bar chart
            'age_distribution' => $formattedAgeDistribution, // For bar chart
            'ai_insights' => $ai_insights,
        ]
    ]);
} catch (PDOException $e) {
    error_log("Database Error in ai_analytics.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Application Error in ai_analytics.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An application error occurred: ' . $e->getMessage()]);
}
