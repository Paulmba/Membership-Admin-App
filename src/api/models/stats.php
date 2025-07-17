<?php
// models/stats.php
class Stats
{
    private $conn;
    private $members_table = "members";
    private $mobile_table  = "mobileusers";

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Get dashboard statistics
    public function getDashboardStats()
    {
        try {
            $stats = [
                'total_members'    => $this->getTotalMembers(),
                'mobile_users'     => $this->getMobileUsers(),
                'attendance_rate'  => 78, // mock or adjust as needed
                'member_growth'    => $this->getMemberGrowth(),
                'mobile_growth'    => $this->getMobileGrowth()
            ];

            error_log("Stats retrieved successfully: " . json_encode($stats));
            return $stats;
        } catch (Exception $e) {
            error_log("Error in getDashboardStats: " . $e->getMessage());
            throw $e;
        }
    }

    private function getTotalMembers()
    {
        try {
            $sql  = "SELECT COUNT(*) as total FROM {$this->members_table}";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (PDOException $e) {
            error_log("Error getting total members: " . $e->getMessage());
            throw new Exception("Failed to get total members: " . $e->getMessage());
        }
    }

    private function getMobileUsers()
    {
        try {
            $sql  = "SELECT COUNT(*) as total FROM {$this->mobile_table}";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (PDOException $e) {
            error_log("Error getting mobile users: " . $e->getMessage());
            // Return 0 if mobile table doesn't exist or has issues
            return 0;
        }
    }

    private function getMemberGrowth()
    {
        try {
            // Current month
            $curSql = "SELECT COUNT(*) as cnt FROM {$this->members_table}
                       WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
                         AND YEAR(created_at)  = YEAR(CURRENT_DATE())";
            $curStmt = $this->conn->prepare($curSql);
            $curStmt->execute();
            $cur = $curStmt->fetch(PDO::FETCH_ASSOC)['cnt'];

            // Previous month
            $prevSql = "SELECT COUNT(*) as cnt FROM {$this->members_table}
                        WHERE MONTH(created_at) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH)
                          AND YEAR(created_at)  = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)";
            $prevStmt = $this->conn->prepare($prevSql);
            $prevStmt->execute();
            $prev = $prevStmt->fetch(PDO::FETCH_ASSOC)['cnt'];

            if ((int)$prev === 0) {
                return 0;
            }
            return round((($cur - $prev) / $prev) * 100, 1);
        } catch (PDOException $e) {
            error_log("Error calculating member growth: " . $e->getMessage());
            return 0; // Return 0 if calculation fails
        }
    }

    private function getMobileGrowth()
    {
        try {
            // Current month
            $curSql = "SELECT COUNT(*) as cnt FROM {$this->mobile_table}
                       WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
                         AND YEAR(created_at)  = YEAR(CURRENT_DATE())";
            $curStmt = $this->conn->prepare($curSql);
            $curStmt->execute();
            $cur = $curStmt->fetch(PDO::FETCH_ASSOC)['cnt'];

            // Previous month
            $prevSql = "SELECT COUNT(*) as cnt FROM {$this->mobile_table}
                        WHERE MONTH(created_at) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH)
                          AND YEAR(created_at)  = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)";
            $prevStmt = $this->conn->prepare($prevSql);
            $prevStmt->execute();
            $prev = $prevStmt->fetch(PDO::FETCH_ASSOC)['cnt'];

            if ((int)$prev === 0) {
                return (int)$cur;
            }
            return round((($cur - $prev) / $prev) * 100, 1);
        } catch (PDOException $e) {
            error_log("Error calculating mobile growth: " . $e->getMessage());
            return 0;
        }
    }

    // Get recent member & mock activities
    public function getRecentActivities($limit = 10)
    {
        $activities = [];

        try {
            // Simple query to avoid JOIN issues
            $sql = "SELECT first_name, last_name, created_at, mid 
                    FROM {$this->members_table} 
                    ORDER BY created_at DESC 
                    LIMIT :limit";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                // Check if this member exists in mobile table
                $source = $this->isMobileUser($row['mid']) ? 'Mobile' : 'Web';

                $activities[] = [
                    'type'        => 'member',
                    'title'       => 'New Member Registration',
                    'description' => "{$row['first_name']} {$row['last_name']} joined ({$source})",
                    'time'        => $this->timeAgo($row['created_at']),
                    'icon'        => 'UserCheck'
                ];
            }
        } catch (PDOException $e) {
            error_log("Error getting recent activities: " . $e->getMessage());
        }

        // Add mock activities
        $mockActivities = [
            [
                'type'        => 'event',
                'title'       => 'Youth Group Meeting',
                'description' => 'Wednesday evening service scheduled',
                'time'        => '4 hours ago',
                'icon'        => 'Calendar'
            ],
            [
                'type'        => 'donation',
                'title'       => 'Donation Received',
                'description' => '$500 received from anonymous donor',
                'time'        => '1 day ago',
                'icon'        => 'Heart'
            ],
            [
                'type'        => 'prayer',
                'title'       => 'Prayer Request',
                'description' => 'New prayer request submitted',
                'time'        => '2 days ago',
                'icon'        => 'Book'
            ]
        ];

        $activities = array_merge($activities, $mockActivities);
        return array_slice($activities, 0, $limit);
    }

    private function isMobileUser($mid)
    {
        try {
            $sql = "SELECT COUNT(*) as count FROM {$this->mobile_table} WHERE mid = :mid";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':mid', $mid, PDO::PARAM_INT);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['count'] > 0;
        } catch (PDOException $e) {
            error_log("Error checking mobile user: " . $e->getMessage());
            return false;
        }
    }

    private function timeAgo($datetime)
    {
        $elapsed = time() - strtotime($datetime);
        if ($elapsed < 60)       return 'just now';
        if ($elapsed < 3600)     return floor($elapsed / 60) . ' minutes ago';
        if ($elapsed < 86400)    return floor($elapsed / 3600) . ' hours ago';
        if ($elapsed < 2592000)  return floor($elapsed / 86400) . ' days ago';
        if ($elapsed < 31536000) return floor($elapsed / 2592000) . ' months ago';
        return floor($elapsed / 31536000) . ' years ago';
    }
}