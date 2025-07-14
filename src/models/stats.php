<?php
class Stats
{
    private $conn;
    private $members_table = "members";
    private $mobile_table = "mobileusers";

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Get dashboard statistics
    public function getDashboardStats()
    {
        $stats = [];

        // Total members
        $stats['total_members'] = $this->getTotalMembers();

        // Mobile users
        $stats['mobile_users'] = $this->getMobileUsers();

        // Attendance rate (mock data for now)
        $stats['attendance_rate'] = 78;

        // Growth percentages
        $stats['member_growth'] = $this->getMemberGrowth();
        $stats['mobile_growth'] = $this->getMobileGrowth();

        return $stats;
    }

    private function getTotalMembers()
    {
        $query = "SELECT COUNT(*) as total FROM " . $this->members_table;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    private function getMobileUsers()
    {
        $query = "SELECT COUNT(*) as total FROM " . $this->mobile_table;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    private function getMemberGrowth()
    {
        // Get current month members
        $current_query = "SELECT COUNT(*) as current_count FROM " . $this->members_table . " 
                         WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
                         AND YEAR(created_at) = YEAR(CURRENT_DATE())";

        $stmt = $this->conn->prepare($current_query);
        $stmt->execute();
        $current = $stmt->fetch(PDO::FETCH_ASSOC)['current_count'];

        // Get previous month members
        $previous_query = "SELECT COUNT(*) as previous_count FROM " . $this->members_table . " 
                          WHERE MONTH(created_at) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) 
                          AND YEAR(created_at) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)";

        $stmt = $this->conn->prepare($previous_query);
        $stmt->execute();
        $previous = $stmt->fetch(PDO::FETCH_ASSOC)['previous_count'];

        if ($previous == 0) return 0;

        $growth = (($current - $previous) / $previous) * 100;
        return round($growth, 1);
    }

    private function getMobileGrowth()
    {
        // Get current month mobile users
        $current_query = "SELECT COUNT(*) as current_count FROM " . $this->mobile_table . " 
                         WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
                         AND YEAR(created_at) = YEAR(CURRENT_DATE())";

        $stmt = $this->conn->prepare($current_query);
        $stmt->execute();
        $current = $stmt->fetch(PDO::FETCH_ASSOC)['current_count'];

        // Get previous month mobile users
        $previous_query = "SELECT COUNT(*) as previous_count FROM " . $this->mobile_table . " 
                          WHERE MONTH(created_at) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) 
                          AND YEAR(created_at) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)";

        $stmt = $this->conn->prepare($previous_query);
        $stmt->execute();
        $previous = $stmt->fetch(PDO::FETCH_ASSOC)['previous_count'];

        if ($previous == 0) return $current; // Return actual count if no previous data

        $growth = (($current - $previous) / $previous) * 100;
        return round($growth, 1);
    }

    // Get recent activities
    public function getRecentActivities($limit = 10)
    {
        $activities = [];

        // Recent member registrations
        $member_query = "SELECT m.first_name, m.last_name, m.created_at, 
                        CASE WHEN mu.mid IS NOT NULL THEN 'Mobile' ELSE 'Web' END as source
                        FROM " . $this->members_table . " m
                        LEFT JOIN " . $this->mobile_table . " mu ON m.mid = mu.mid
                        ORDER BY m.created_at DESC 
                        LIMIT :limit";

        $stmt = $this->conn->prepare($member_query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $activities[] = [
                'type' => 'member',
                'title' => 'New Member Registration',
                'description' => $row['first_name'] . ' ' . $row['last_name'] . ' joined the congregation (' . $row['source'] . ')',
                'time' => $this->timeAgo($row['created_at']),
                'icon' => 'UserCheck'
            ];
        }

        // Add mock activities for events, donations, prayers
        $mock_activities = [
            [
                'type' => 'event',
                'title' => 'Youth Group Meeting',
                'description' => 'Wednesday evening service scheduled',
                'time' => '4 hours ago',
                'icon' => 'Calendar'
            ],
            [
                'type' => 'donation',
                'title' => 'Donation Received',
                'description' => '$500 received from anonymous donor',
                'time' => '1 day ago',
                'icon' => 'Heart'
            ],
            [
                'type' => 'prayer',
                'title' => 'Prayer Request',
                'description' => 'New prayer request submitted',
                'time' => '2 days ago',
                'icon' => 'Book'
            ]
        ];

        // Merge and sort activities
        $activities = array_merge($activities, $mock_activities);

        // Sort by time (most recent first)
        usort($activities, function ($a, $b) {
            return strcmp($b['time'], $a['time']);
        });

        return array_slice($activities, 0, $limit);
    }

    private function timeAgo($datetime)
    {
        $time = time() - strtotime($datetime);

        if ($time < 60) return 'just now';
        if ($time < 3600) return floor($time / 60) . ' minutes ago';
        if ($time < 86400) return floor($time / 3600) . ' hours ago';
        if ($time < 2592000) return floor($time / 86400) . ' days ago';
        if ($time < 31536000) return floor($time / 2592000) . ' months ago';

        return floor($time / 31536000) . ' years ago';
    }
}
?></31536000>