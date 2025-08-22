<?php
// api/ai_reports.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Restrict in production
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once __DIR__ . '/config/Database.php';
include_once __DIR__ . '/models/Member.php';

// Gemini API call with retries
function callGeminiAPI($prompt, $model = 'gemini-2.5-flash-preview-05-20', $maxRetries = 3, $initialDelay = 1000)
{
    $GEMINI_API_KEY = 'AIzaSyDpJm1CJCt4MYAZ3lvf_3fIEn7cBeZu9co'; // Replace with your key
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
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            error_log("cURL error on attempt {$retries}: " . $curlError);
            $retries++;
            usleep($initialDelay * 1000 * (1 << $retries));
            continue;
        }

        if ($httpCode >= 200 && $httpCode < 300) {
            return json_decode($response, true);
        } else {
            error_log("Gemini API error (HTTP {$httpCode}) on attempt {$retries}: " . $response);
            $retries++;
            usleep($initialDelay * 1000 * (1 << $retries));
        }
    }

    return ['success' => false, 'message' => 'Failed to connect to Gemini API after multiple retries.'];
}

$database = new Database();
$db = $database->getConnection();
$member = new Member($db);

$input = json_decode(file_get_contents("php://input"));

$reportType = $input->report_type ?? 'membership_summary';
$period = $input->period ?? 'last_30_days';
$addressTerm = $input->address_term ?? null;
$userQuery = $input->user_query ?? null;
$simpleMode = $input->simple_mode ?? false;

$dataForReport = [];
$reportTitle = "AI-Generated Report";
$prompt = "";

try {
    $members_array = [];
    $stmt = null;

    if ($reportType === 'custom_analysis' && !empty($addressTerm)) {
        $stmt = $member->getByAddressSimilarity($addressTerm);
        $reportTitle = "Custom Analysis for " . htmlspecialchars($addressTerm) . " Area";
    } else {
        $stmt = $member->getAll();
    }

    if ($stmt) {
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $members_array[] = $row;
        }
    }

    switch ($reportType) {
        case 'membership_summary':
            $reportTitle = "Membership Summary for " . ucwords(str_replace('_', ' ', $period));

            $totalMembers = $member->getTotalCount();
            $mobileUsersCount = $member->getMobileUsersCount();
            $webUsersCount = $totalMembers - $mobileUsersCount;

            $verifiedMembers = 0;
            $genderDistribution = ['Male' => 0, 'Female' => 0];
            $sourceDistribution = ['Mobile' => 0, 'Web' => 0];
            $ageGroups = [];

            foreach ($members_array as $mem) {
                if (!empty($mem['is_verified']) && $mem['is_verified'] == 1) {
                    $verifiedMembers++;
                }
                $genderDistribution[$mem['gender']] = ($genderDistribution[$mem['gender']] ?? 0) + 1;
                $sourceDistribution[$mem['source']] = ($sourceDistribution[$mem['source']] ?? 0) + 1;

                if (!empty($mem['dob'])) {
                    $birthDate = new DateTime($mem['dob']);
                    $currentDate = new DateTime();
                    $age = $currentDate->diff($birthDate)->y;

                    if ($age < 18) $ageGroup = 'Under 18';
                    else if ($age <= 24) $ageGroup = '18-24';
                    else if ($age <= 34) $ageGroup = '25-34';
                    else if ($age <= 44) $ageGroup = '35-44';
                    else if ($age <= 54) $ageGroup = '45-54';
                    else if ($age <= 64) $ageGroup = '55-64';
                    else $ageGroup = '65+';

                    $ageGroups[$ageGroup] = ($ageGroups[$ageGroup] ?? 0) + 1;
                }
            }

            $prompt = "Create a simple membership summary for " . ucwords(str_replace('_', ' ', $period)) . ". " .
                "Totals and counts:\n" .
                "- Total members: {$totalMembers}\n" .
                "- Mobile users: {$mobileUsersCount}\n" .
                "- Web users: {$webUsersCount}\n" .
                "- Verified members: {$verifiedMembers}\n" .
                "- Gender counts: " . json_encode($genderDistribution) . "\n" .
                "- User sources: " . json_encode($sourceDistribution) . "\n" .
                "- Age groups: " . json_encode($ageGroups) . "\n\n" .
                "Use clear, brief sentences.";
            break;

        case 'growth_analysis':
            $reportTitle = "Membership Growth for " . ucwords(str_replace('_', ' ', $period));

            $growth_data_query = "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as members_added
                                  FROM " . $member->getTableName() . "
                                  WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                                  GROUP BY month ORDER BY month ASC";
            $stmt_growth = $db->prepare($growth_data_query);
            $stmt_growth->execute();
            $growth_data = $stmt_growth->fetchAll(PDO::FETCH_ASSOC);

            $prompt = "Analyze membership growth for " . ucwords(str_replace('_', ' ', $period)) . ". " .
                "Monthly new members:\n" .
                json_encode($growth_data) . "\n\n" .
                "Explain trends and suggest simple church activities to encourage growth. Keep it short.";
            break;

        case 'demographic_insights':
            $reportTitle = "Demographic Insights for " . ucwords(str_replace('_', ' ', $period));

            $gender_query = "SELECT gender, COUNT(*) as count FROM " . $member->getTableName() . " GROUP BY gender";
            $age_query = "SELECT FLOOR(DATEDIFF(NOW(), dob) / 365) AS age_raw, COUNT(*) AS count FROM " . $member->getTableName() . " GROUP BY age_raw ORDER BY age_raw ASC";

            $stmt_gender = $db->prepare($gender_query);
            $stmt_gender->execute();
            $gender_data = $stmt_gender->fetchAll(PDO::FETCH_ASSOC);

            $stmt_age = $db->prepare($age_query);
            $stmt_age->execute();
            $age_data_raw = $stmt_age->fetchAll(PDO::FETCH_ASSOC);

            $age_groups_summary = [];
            foreach ($age_data_raw as $age_row) {
                $age = $age_row['age_raw'];
                $count = $age_row['count'];
                if ($age < 18) $ageGroup = 'Under 18';
                else if ($age <= 24) $ageGroup = '18-24';
                else if ($age <= 34) $ageGroup = '25-34';
                else if ($age <= 44) $ageGroup = '35-44';
                else if ($age <= 54) $ageGroup = '45-54';
                else if ($age <= 64) $ageGroup = '55-64';
                else $ageGroup = '65+';

                $age_groups_summary[$ageGroup] = ($age_groups_summary[$ageGroup] ?? 0) + $count;
            }

            $prompt = "Write a brief demographic report for " . ucwords(str_replace('_', ' ', $period)) . ". " .
                "Gender data:\n" . json_encode($gender_data) . "\n" .
                "Age groups:\n" . json_encode($age_groups_summary) . "\n\n" .
                "Describe key groups and simple ways the church can use this info.";
            break;

        case 'engagement_metrics':
            $reportTitle = "Member Engagement for " . ucwords(str_replace('_', ' ', $period));

            $active_members_query = "SELECT COUNT(DISTINCT mid) as active_count FROM " . $member->getTableName() . " WHERE last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            $stmt_active = $db->prepare($active_members_query);
            $stmt_active->execute();
            $active_count = $stmt_active->fetch(PDO::FETCH_ASSOC)['active_count'];

            $profile_completion_query = "SELECT COUNT(*) as completed_count FROM " . $member->getTableName() . " WHERE profile_completed = 1";
            $stmt_profile = $db->prepare($profile_completion_query);
            $stmt_profile->execute();
            $completed_profile_count = $stmt_profile->fetch(PDO::FETCH_ASSOC)['completed_count'];

            $totalMembers = count($members_array);
            $profile_completion_rate = $totalMembers > 0 ? round(($completed_profile_count / $totalMembers) * 100, 2) : 0;

            $prompt = "Make a short report on member engagement for " . ucwords(str_replace('_', ' ', $period)) . ". " .
                "Include active members, profile completion, and simple ways to improve participation:\n" .
                "- Total members: {$totalMembers}\n" .
                "- Active last 30 days: {$active_count}\n" .
                "- Profile completion rate: {$profile_completion_rate}%\n";
            break;

        case 'custom_analysis':
            if (!empty($userQuery)) {
                $reportTitle = "Custom Analysis: " . htmlspecialchars(substr($userQuery, 0, 50)) . (strlen($userQuery) > 50 ? '...' : '');

                if ($simpleMode) {
                    // Just send the user query as prompt (short/simple mode)
                    $prompt = $userQuery;
                } else {
                    // Detailed mode with member data sample
                    $promptContext = "Based on this query: \"" . htmlspecialchars($userQuery) . "\", ";

                    $prompt = "Do a custom analysis. " . $promptContext .
                        "Find patterns or unusual info in this member data:\n\n";

                    $sample_members = array_slice($members_array, 0, 50);
                    if (empty($sample_members)) {
                        $prompt .= "No members found. Explain possible reasons.";
                    } else {
                        foreach ($sample_members as $s_mem) {
                            $fullName = trim(($s_mem['first_name'] ?? '') . ' ' . ($s_mem['last_name'] ?? ''));
                            $prompt .= "- ID: " . $s_mem['mid'] . ", Name: " . $fullName .
                                ", Gender: " . $s_mem['gender'] . ", DOB: " . $s_mem['dob'] .
                                ", Address: " . $s_mem['address'] . ", Source: " . $s_mem['source'] .
                                ", Verified: " . ($s_mem['is_verified'] ? 'Yes' : 'No') . "\n";
                        }
                    }
                    $prompt .= "\nGive clear insights and simple recommendations.";
                }
            } else if (!empty($addressTerm)) {
                $reportTitle = "Custom Analysis for " . htmlspecialchars($addressTerm) . " (" . ucwords(str_replace('_', ' ', $period)) . ")";
                $prompt = "Analyze members from '" . htmlspecialchars($addressTerm) . "' area for " . ucwords(str_replace('_', ' ', $period)) . ". Provide key insights and recommendations.";
            } else {
                $reportTitle = "Custom Analysis for All Members (" . ucwords(str_replace('_', ' ', $period)) . ")";
                $prompt = "Analyze overall membership data for " . ucwords(str_replace('_', ' ', $period)) . ". Provide key insights and recommendations.";
            }
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid report type selected.']);
            exit();
    }

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
            $errorMessage = $geminiResponse['message'];
        } elseif (isset($geminiResponse['error']['message'])) {
            $errorMessage .= ' Gemini Error: ' . $geminiResponse['error']['message'];
        } else {
            $errorMessage .= ' Unknown API response.';
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
