<?php
// api/ai_predictions.php
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
include_once __DIR__ . '/models/Member.php'; // <-- UPDATED PATH

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
        curl_setopt($ch, CURLOPT_TIMEOUT, 90); // Increased timeout for potentially longer AI generation

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

$predictionType = $input->prediction_type ?? 'membership_growth';
$predictionPeriod = $input->prediction_period ?? 'next_6_months';

try {
    $historicalData = [];
    $predictionTitle = "Predictive Analysis";
    $predictionPrompt = "";

    switch ($predictionType) {
        case 'membership_growth':
            $predictionTitle = "Predicted Membership Growth for " . ucwords(str_replace('_', ' ', $predictionPeriod));

            // Fetch last 12-24 months of historical membership data for Gemini to analyze
            $historical_growth_query = "SELECT DATE_FORMAT(created_at, '%Y-%m') as period, COUNT(*) as members
                                        FROM " . $member->getTableName() . "
                                        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 MONTH)
                                        GROUP BY period ORDER BY period ASC";
            $stmt = $db->prepare($historical_growth_query);
            $stmt->execute();
            $raw_historical_data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Reformat to cumulative data for prediction context
            $cumulative_members = 0;
            $processed_historical_data = [];
            foreach ($raw_historical_data as $row) {
                $cumulative_members += $row['members'];
                $processed_historical_data[] = ['period' => $row['period'], 'actual' => $cumulative_members];
            }
            $historicalData = $processed_historical_data;

            $num_periods = 0;
            if ($predictionPeriod === 'next_3_months') $num_periods = 3;
            else if ($predictionPeriod === 'next_6_months') $num_periods = 6;
            else if ($predictionPeriod === 'next_year') $num_periods = 12;

            $predictionPrompt = "Given the following historical cumulative membership growth data (YYYY-MM, total members), predict the total membership for the {$num_periods} subsequent months. " .
                "Also, provide a summary of the predictions, key risk factors that could affect this growth, and actionable recommendations to achieve or exceed the predicted growth. " .
                "Return the data in a single JSON object with the following structure:\n" .
                "{\n" .
                "  \"title\": \"Predicted Membership Growth\",\n" .
                "  \"chart_data\": [\n" .
                "    {\"period\": \"YYYY-MM\", \"actual\": 1234, \"predicted\": null}, // Historical\n" .
                "    {\"period\": \"YYYY-MM\", \"actual\": null, \"predicted\": 5678}  // Predicted\n" .
                "  ],\n" .
                "  \"summary\": [\n" .
                "    {\"metric\": \"Overall Growth\", \"value\": \"X%\", \"description\": \"Expected increase\"}\n" .
                "  ],\n" .
                "  \"risk_factors\": [\n" .
                "    {\"factor\": \"Risk Name\", \"impact\": \"Impact description\"}\n" .
                "  ],\n" .
                "  \"recommendations\": [\n" .
                "    {\"action\": \"Actionable step\", \"expected_impact\": \"Benefit\"}\n" .
                "  ]\n" .
                "}\n\n" .
                "Historical Data:\n" . json_encode($historicalData);
            break;

        case 'churn_risk':
            $predictionTitle = "Member Churn Risk Prediction for " . ucwords(str_replace('_', ' ', $predictionPeriod));
            // For churn, you'd ideally have data on member activity, login frequency, last interaction etc.
            // For this example, we'll simulate some risk factors.
            $sample_churn_risk_factors = [
                ['member_id' => 101, 'last_login_days_ago' => 65, 'profile_completion' => 0.4],
                ['member_id' => 105, 'last_login_days_ago' => 10, 'profile_completion' => 0.9],
            ];
            // Fetch some recent inactive members or members with low engagement
            $inactive_members_query = "SELECT mid, DATEDIFF(NOW(), last_login) as last_login_days_ago, profile_completed FROM " . $member->getTableName() . " WHERE last_login <= DATE_SUB(NOW(), INTERVAL 30 DAY) LIMIT 10";
            $stmt = $db->prepare($inactive_members_query);
            $stmt->execute();
            $inactive_members_data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $prompt_data = [
                'inactive_members' => $inactive_members_data,
                'total_members' => $member->getTotalCount(),
                'active_members_last_30_days' => $db->query("SELECT COUNT(DISTINCT mid) FROM " . $member->getTableName() . " WHERE last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)")->fetchColumn()
            ];

            $predictionPrompt = "Analyze the provided sample of inactive members and overall engagement data. " .
                "Predict key churn indicators and patterns for the {$predictionPeriod}. " .
                "Identify top risk factors for member churn and provide actionable recommendations to reduce churn. " .
                "Return the data in a single JSON object with the following structure:\n" .
                "{\n" .
                "  \"title\": \"Member Churn Risk Prediction\",\n" .
                "  \"chart_data\": [\n" .
                "    {\"period\": \"Metric\", \"actual\": 100, \"predicted\": 90} // Example data. Adapt to a relevant churn chart.\n" .
                "  ],\n" .
                "  \"summary\": [\n" .
                "    {\"metric\": \"Churn Rate\", \"value\": \"X%\", \"description\": \"Predicted churn rate\"}\n" .
                "  ],\n" .
                "  \"risk_factors\": [\n" .
                "    {\"factor\": \"Low Engagement\", \"impact\": \"Members not logging in.\"}\n" .
                "  ],\n" .
                "  \"recommendations\": [\n" .
                "    {\"action\": \"Send re-engagement emails\", \"expected_impact\": \"Increase activity\"}\n" .
                "  ]\n" .
                "}\n\n" .
                "Data for analysis:\n" . json_encode($prompt_data);
            break;

            // Add more cases for other prediction types (engagement_trends, demographic_shifts)
            // Adjust the SQL queries and the prompt accordingly for each type.
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid prediction type selected.']);
            exit();
    }

    $geminiResponse = callGeminiAPI($predictionPrompt);

    if (isset($geminiResponse['candidates'][0]['content']['parts'][0]['text'])) {
        $geminiText = $geminiResponse['candidates'][0]['content']['parts'][0]['text'];
        $parsedPredictions = json_decode($geminiText, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($parsedPredictions)) {
            // For consistency with React frontend, ensure it's an object, not array
            $finalPredictions = $parsedPredictions; // If Gemini returns the whole object
            if (isset($parsedPredictions[0]) && count($parsedPredictions) > 1) { // If Gemini returned an array of objects for some reason
                $finalPredictions = $parsedPredictions[0]; // Take the first one, or merge them as needed
            }
        } else {
            // Fallback if Gemini doesn't return perfect JSON
            error_log("Gemini did not return perfect JSON for predictions. Raw response: " . $geminiText);
            $finalPredictions = [
                'title' => $predictionTitle . ' (AI Parse Error)',
                'chart_data' => $historicalData, // Use historical data as a fallback for the chart
                'summary' => [['metric' => 'AI Parsing Error', 'value' => 'N/A', 'description' => 'Could not parse AI-generated JSON.']],
                'risk_factors' => [['factor' => 'AI Output Format', 'impact' => 'Check Gemini prompt for JSON structure accuracy.']],
                'recommendations' => [['action' => 'Manually review AI response', 'expected_impact' => 'Adjust prompt or parsing logic.']],
            ];
        }

        echo json_encode([
            'success' => true,
            'predictions' => $finalPredictions
        ]);
    } else {
        $errorMessage = 'Failed to get predictions from AI.';
        if (isset($geminiResponse['message'])) {
            $errorMessage = $geminiResponse['message']; // Error from helper function
        } elseif (isset($geminiResponse['error']['message'])) {
            $errorMessage .= ' Gemini Error: ' . $geminiResponse['error']['message'];
        } else {
            $errorMessage .= ' Unknown Gemini API response structure. Debug log for details.';
            error_log('Gemini API raw response (ai_predictions): ' . json_encode($geminiResponse));
        }
        echo json_encode(['success' => false, 'message' => $errorMessage]);
    }
} catch (PDOException $e) {
    error_log("Database Error in ai_predictions.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Application Error in ai_predictions.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An application error occurred: ' . $e->getMessage()]);
}