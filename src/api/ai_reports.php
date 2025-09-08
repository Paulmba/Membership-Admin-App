<?php
ini_set('max_execution_time', 300);
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
function callGeminiAPI($prompt, $apiKey, $model = 'gemini-2.5-flash-preview-05-20', $maxRetries = 3, $initialDelay = 1000)
{
    if (empty($apiKey)) {
        error_log("GEMINI_API_KEY is not configured.");
        return ['success' => false, 'message' => 'API Key not configured.'];
    }

    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . $apiKey;
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
        curl_setopt($ch, CURLOPT_TIMEOUT, 90); // Increased timeout for larger model

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
$geminiApiKey = $database->gemini_api_key;
$member = new Member($db);

$input = json_decode(file_get_contents("php://input"));

$reportType = $input->report_type ?? 'membership_summary';
$period = $input->period ?? 'last_30_days';
$userQuery = $input->user_query ?? null;

$reportTitle = "AI-Generated Report";
$prompt = "";

try {
    $members_array = [];
    $stmt = $member->getAll();

    if ($stmt) {
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $members_array[] = $row;
        }
    }

    switch ($reportType) {
        case 'membership_summary':
            $reportTitle = "Membership Summary for " . ucwords(str_replace('_', ' ', $period));

            $totalMembers = $member->getTotalCount();
            $verifiedMembers = 0;
            $genderDistribution = ['Male' => 0, 'Female' => 0];
            $sourceDistribution = ['Mobile' => 0, 'Web' => 0];
            $ageGroups = [];
            $locationCounts = [];

            foreach ($members_array as $mem) {
                if (!empty($mem['is_verified']) && $mem['is_verified'] == 1) $verifiedMembers++;

                if (isset($mem['gender'])) {
                    if ($mem['gender'] === 'M') {
                        $genderDistribution['Male']++;
                    } elseif ($mem['gender'] === 'F') {
                        $genderDistribution['Female']++;
                    }
                }

                if (isset($mem['source'])) {
                    $sourceDistribution[$mem['source']] = ($sourceDistribution[$mem['source']] ?? 0) + 1;
                }

                if (!empty($mem['dob'])) {
                    $birthDate = new DateTime($mem['dob']);
                    $age = $birthDate->diff(new DateTime())->y;
                    if ($age < 18) $ageGroup = 'Under 18';
                    else if ($age <= 24) $ageGroup = '18-24';
                    else if ($age <= 34) $ageGroup = '25-34';
                    else if ($age <= 44) $ageGroup = '35-44';
                    else if ($age <= 54) $ageGroup = '45-54';
                    else if ($age <= 64) $ageGroup = '55-64';
                    else $ageGroup = '65+';
                    $ageGroups[$ageGroup] = ($ageGroups[$ageGroup] ?? 0) + 1;
                }

                if (!empty($mem['address'])) {
                    $locationCounts[$mem['address']] = ($locationCounts[$mem['address']] ?? 0) + 1;
                }
            }
            arsort($locationCounts);

            $prompt = "Generate a membership summary report. The report should have a clear introduction, body, and conclusion.

**Data for the period " . ucwords(str_replace('_', ' ', $period)) . ":**
- Total Members: {$totalMembers}
- Verified Members: {$verifiedMembers}
- User Sources: " . json_encode($sourceDistribution) . "
- Gender Distribution: " . json_encode($genderDistribution) . "
- Age Group Distribution: " . json_encode($ageGroups) . "
- Location Distribution: " . json_encode($locationCounts) . "

**Report Structure and Requirements:**
1.  **Header:** Start the report with a header containing only 'To:' and 'Subject:'. Do not include 'From:' or 'Date:'.
2.  **Introduction:** Briefly explain the purpose of the report.
3.  **Body:**
    *   Present the key metrics in a clear, easy-to-read format using markdown.
    *   Provide a short analysis of each key area (Sources, Gender, Age, Location).
4.  **Conclusion:**
    *   Summarize the key findings.
    *   Provide one or two simple, actionable recommendations that are practical and culturally appropriate for the local context.
5.  **Summary Tag:** At the very end of your response, provide a one-sentence summary of the key insight from the report, enclosed in <summary> tags.";
            break;

        case 'growth_analysis':
            $reportTitle = "Membership Growth Analysis";
            $growth_data_query = "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as members_added FROM " . $member->getTableName() . " WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH) GROUP BY month ORDER BY month ASC";
            $stmt_growth = $db->prepare($growth_data_query);
            $stmt_growth->execute();
            $growth_data = $stmt_growth->fetchAll(PDO::FETCH_ASSOC);

            $prompt = "Generate a membership growth analysis report. The report should have a clear introduction, body, and conclusion.

**Monthly New Member Data:**
" . json_encode($growth_data) . "

**Report Structure and Requirements:**
1.  **Header:** Start the report with a header containing only 'To:' and 'Subject:'. Do not include 'From:' or 'Date:'.
2.  **Introduction:** Briefly explain the purpose of the report.
3.  **Body:**
    *   Analyze the growth trend, pointing out any significant increases, decreases, or patterns.
    *   Identify potential reasons for the observed trends (e.g., seasonal changes, local events).
4.  **Conclusion:**
    *   Summarize the main growth trend.
    *   Offer 2-3 practical and simple activities the church could organize to boost membership growth, considering the local context.
5.  **Summary Tag:** At the very end of your response, provide a one-sentence summary of the main growth trend, enclosed in <summary> tags.";
            break;

        case 'demographic_insights':
            $reportTitle = "Demographic Insights Report";
            $gender_query = "SELECT gender, COUNT(*) as count FROM " . $member->getTableName() . " WHERE gender IN ('M', 'F') GROUP BY gender";
            $stmt_gender = $db->prepare($gender_query);
            $stmt_gender->execute();
            $gender_data_raw = $stmt_gender->fetchAll(PDO::FETCH_ASSOC);
            $gender_data = ['Male' => 0, 'Female' => 0];
            foreach ($gender_data_raw as $row) {
                if ($row['gender'] === 'M') {
                    $gender_data['Male'] = $row['count'];
                } elseif ($row['gender'] === 'F') {
                    $gender_data['Female'] = $row['count'];
                }
            }

            $age_query = "SELECT FLOOR(DATEDIFF(NOW(), dob) / 365) AS age_raw, COUNT(*) AS count FROM " . $member->getTableName() . " WHERE dob IS NOT NULL GROUP BY age_raw ORDER BY age_raw ASC";
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

            $prompt = "Generate a demographic insights report. The report should have a clear introduction, body, and conclusion.

**Demographic Data:**
- Gender Distribution: " . json_encode($gender_data) . "
- Age Group Distribution: " . json_encode($age_groups_summary) . "

**Report Structure and Requirements:**
1.  **Header:** Start the report with a header containing only 'To:' and 'Subject:'. Do not include 'From:' or 'Date:'.
2.  **Introduction:** Briefly explain the purpose of the report.
3.  **Body:**
    *   Describe the key demographic groups within the church.
    *   For each key group (e.g., 'Youth', 'Seniors'), provide one simple, actionable insight that is culturally relevant.
4.  **Conclusion:**
    *   Summarize the most important demographic insight.
    *   Suggest how the church can better tailor its programs or communication to serve these demographic groups, keeping the local culture in mind.
5.  **Summary Tag:** At the very end of your response, provide a one-sentence summary of the most important demographic insight, enclosed in <summary> tags.";
            break;

        case 'engagement_metrics':
            $reportTitle = "Member Engagement Report";
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

            $prompt = "Generate a member engagement report. The report should have a clear introduction, body, and conclusion.

**Engagement Data:**
- Total Members: {$totalMembers}
- Active Members (last 30 days): {$active_count}
- Profile Completion Rate: {$profile_completion_rate}%

**Report Structure and Requirements:**
1.  **Header:** Start the report with a header containing only 'To:' and 'Subject:'. Do not include 'From:' or 'Date:'.
2.  **Introduction:** Briefly explain the purpose of the report.
3.  **Body:**
    *   Clearly present the engagement metrics.
    *   Analyze what these numbers might indicate about the health of the church community.
4.  **Conclusion:**
    *   Summarize the member engagement level.
    *   Provide 3 concrete and simple ideas to improve member engagement and participation, considering the local context.
5.  **Summary Tag:** At the very end of your response, provide a one-sentence summary of the member engagement level, enclosed in <summary> tags.";
            break;

        case 'area_report':
            $reportTitle = "Member Area Report";
            $locationCounts = [];
            foreach ($members_array as $mem) {
                if (!empty($mem['address'])) {
                    $locationCounts[$mem['address']] = ($locationCounts[$mem['address']] ?? 0) + 1;
                }
            }
            arsort($locationCounts);

            $prompt = "Generate an area report based on the locations of church members. The report should have a clear introduction, body, and conclusion.

**Member Location Data (Address Counts):**
" . json_encode($locationCounts) . "

**Report Structure and Requirements:**
1.  **Header:** Start the report with a header containing only 'To:' and 'Subject:'. Do not include 'From:' or 'Date:'.
2.  **Introduction:** Briefly explain the purpose of the report.
3.  **Body:**
    *   Analyze the geographic distribution of the members.
    *   Identify the top 3-5 areas with the highest concentration of members.
    *   Provide one or two insights about the overall geographic spread of the congregation (e.g., 'highly localized', 'spread across the city', etc.).
4.  **Conclusion:**
    *   Summarize the geographic distribution.
    *   Suggest potential areas for outreach, new small groups, or community events based on the location data, keeping the local context in mind.
5.  **Summary Tag:** At the very end of your response, provide a one-sentence summary of the geographic distribution, enclosed in <summary> tags.";
            break;

        case 'custom_analysis':
            $reportTitle = "Custom Analysis";
            if (!empty($userQuery)) {
                $reportTitle .= ": " . htmlspecialchars(substr($userQuery, 0, 50)) . (strlen($userQuery) > 50 ? '...' : '');

                // Fetch all members
                $stmt_all_members = $member->getAll();
                $all_members = $stmt_all_members->fetchAll(PDO::FETCH_ASSOC);

                // Fetch leadership data
                include_once __DIR__ . '/models/leadership_role.php';
                $leadership = new LeadershipRole($db);
                $stmt_leadership = $leadership->getCurrentLeadership();
                $leadership_data = $stmt_leadership->fetchAll(PDO::FETCH_ASSOC);

                $prompt = "A church administrator has asked the following question: \""
                    . htmlspecialchars($userQuery) . "\"

Analyze the provided data to answer the question. The report should have a clear introduction, body, and conclusion, and all insights should be culturally and contextually appropriate.

**All Member Data:**
";
                foreach ($all_members as $s_mem) {
                    $gender = '';
                    if (isset($s_mem['gender'])) {
                        if ($s_mem['gender'] === 'M') {
                            $gender = 'Male';
                        } elseif ($s_mem['gender'] === 'F') {
                            $gender = 'Female';
                        }
                    }
                    // only include members with gender Male or Female
                    if ($gender) {
                        $prompt .= "- Name: {$s_mem['first_name']} {$s_mem['last_name']}, Gender: {$gender}, DOB: {$s_mem['dob']}, Address: {$s_mem['address']}, Source: {$s_mem['source']}
";
                    }
                }
                $prompt .= "
**Leadership Data:**
";
                foreach ($leadership_data as $role) {
                    $prompt .= "- Role: {$role['role_name']}, Description: {$role['description']}
";
                    if (!empty($role['assignments'])) {
                        foreach ($role['assignments'] as $assignment) {
                            $prompt .= "  - Member: {$assignment['first_name']} {$assignment['last_name']}
";
                        }
                    }
                }

                $prompt .= "
**Report Structure and Requirements:**
1.  **Header:** Start the report with a header containing only 'To:' and 'Subject:'. Do not include 'From:' or 'Date:'.
2.  **Introduction:** Briefly introduce the user's question.
3.  **Body:** Directly address the user's question using the provided data.
4.  **Conclusion:** Summarize the answer to the user's question.
5.  **Formatting:** Format your response in markdown.
6.  **Data Sufficiency:** If the data is insufficient to answer the question, explain why and what data would be needed.
7.  **Scope:** ONLY provide the specific information requested in the user's query. Do not include any additional analysis, patterns, trends, anomalies, or recommendations unless explicitly asked for.
8.  **Summary Tag:** At the very end of your response, provide a one-sentence summary of the answer to the user's question, enclosed in <summary> tags.";
            } else {
                $prompt = "No custom query provided. Please provide a query for analysis.";
            }
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid report type selected.']);
            exit();
    }

    if (empty($prompt)) {
        echo json_encode(['success' => false, 'message' => 'Prompt could not be generated.']);
        exit();
    }

    $geminiResponse = callGeminiAPI($prompt, $geminiApiKey);

    if (isset($geminiResponse['candidates'][0]['content']['parts'][0]['text'])) {
        $generatedContent = $geminiResponse['candidates'][0]['content']['parts'][0]['text'];

        $summary = '';
        if (preg_match('/<summary>(.*?)<\/summary>/s', $generatedContent, $matches)) {
            $summary = $matches[1];
            $generatedContent = str_replace($matches[0], '', $generatedContent);
        }

        echo json_encode([
            'success' => true,
            'report' => [
                'title' => $reportTitle,
                'content' => trim($generatedContent),
                'summary' => trim($summary),
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
            $errorMessage .= ' Unknown API response. Raw: ' . json_encode($geminiResponse);
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
