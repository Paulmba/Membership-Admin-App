<?php
class LeadershipRole
{
    private $conn;
    private $table_name = "leadership_roles";
    private $member_leadership_table = "member_leadership";
    private $members_table = "members";

    public $role_id;
    public $role_name;
    public $max_allowed;
    public $min_age;
    public $max_age;
    public $gender_requirement;
    public $description;
    public $created_at;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Get all leadership roles
    public function getAllRoles()
    {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY role_id ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Get role by ID
    public function getRoleById($role_id)
    {
        $query = "SELECT * FROM " . $this->table_name . " WHERE role_id = :role_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':role_id', $role_id);
        $stmt->execute();
        return $stmt;
    }

    // Get current leadership assignments
    public function getCurrentLeadership()
    {
        $query = "SELECT 
                    lr.role_id,
                    lr.role_name,
                    lr.max_allowed,
                    lr.description,
                    ml.id as assignment_id,
                    ml.assigned_at,
                    m.mid,
                    m.first_name,
                    m.last_name,
                    m.gender,
                    TIMESTAMPDIFF(YEAR, m.dob, CURDATE()) as age
                  FROM " . $this->table_name . " lr
                  LEFT JOIN " . $this->member_leadership_table . " ml ON lr.role_id = ml.role_id
                  LEFT JOIN " . $this->members_table . " m ON ml.member_id = m.mid
                  ORDER BY lr.role_id ASC, ml.assigned_at ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Get eligible members for a specific role
    public function getEligibleMembers($role_id)
    {
        // First get the role requirements
        $roleQuery = "SELECT * FROM " . $this->table_name . " WHERE role_id = :role_id";
        $roleStmt = $this->conn->prepare($roleQuery);
        $roleStmt->bindParam(':role_id', $role_id);
        $roleStmt->execute();
        $role = $roleStmt->fetch(PDO::FETCH_ASSOC);

        if (!$role) {
            return false;
        }

        // Build the query conditions based on role requirements
        $conditions = [];
        $params = [];

        // Age requirements
        if ($role['min_age']) {
            $conditions[] = "TIMESTAMPDIFF(YEAR, m.dob, CURDATE()) >= :min_age";
            $params[':min_age'] = $role['min_age'];
        }
        if ($role['max_age']) {
            $conditions[] = "TIMESTAMPDIFF(YEAR, m.dob, CURDATE()) <= :max_age";
            $params[':max_age'] = $role['max_age'];
        }

        // Gender requirements
        if ($role['gender_requirement'] && $role['gender_requirement'] !== 'any') {
            $conditions[] = "m.gender = :gender";
            $params[':gender'] = $role['gender_requirement'];
        }

        // Exclude members already assigned to this role
        $conditions[] = "m.mid NOT IN (
            SELECT member_id FROM " . $this->member_leadership_table . " 
            WHERE role_id = :role_id
        )";
        $params[':role_id'] = $role_id;

        // Build final query
        $whereClause = !empty($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";

        $query = "SELECT 
                    m.mid,
                    m.first_name,
                    m.last_name,
                    m.gender,
                    m.dob,
                    TIMESTAMPDIFF(YEAR, m.dob, CURDATE()) as age,
                    m.address,
                    m.phone_number
                  FROM " . $this->members_table . " m
                  " . $whereClause . "
                  ORDER BY m.first_name ASC, m.last_name ASC";

        $stmt = $this->conn->prepare($query);
        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }
        $stmt->execute();
        return $stmt;
    }

    // Check if role assignment is valid
    public function canAssignRole($role_id, $member_id)
    {
        // Get role details
        $roleQuery = "SELECT * FROM " . $this->table_name . " WHERE role_id = :role_id";
        $roleStmt = $this->conn->prepare($roleQuery);
        $roleStmt->bindParam(':role_id', $role_id);
        $roleStmt->execute();
        $role = $roleStmt->fetch(PDO::FETCH_ASSOC);

        if (!$role) {
            return ['valid' => false, 'message' => 'Role not found'];
        }

        // Check if member exists and get their details
        $memberQuery = "SELECT *, TIMESTAMPDIFF(YEAR, dob, CURDATE()) as age 
                       FROM " . $this->members_table . " WHERE mid = :member_id";
        $memberStmt = $this->conn->prepare($memberQuery);
        $memberStmt->bindParam(':member_id', $member_id);
        $memberStmt->execute();
        $member = $memberStmt->fetch(PDO::FETCH_ASSOC);

        if (!$member) {
            return ['valid' => false, 'message' => 'Member not found'];
        }

        // Check age requirements
        if ($role['min_age'] && $member['age'] < $role['min_age']) {
            return ['valid' => false, 'message' => "Member must be at least {$role['min_age']} years old"];
        }
        if ($role['max_age'] && $member['age'] > $role['max_age']) {
            return ['valid' => false, 'message' => "Member must be at most {$role['max_age']} years old"];
        }

        // Check gender requirements
        if (
            $role['gender_requirement'] && $role['gender_requirement'] !== 'any' &&
            $member['gender'] !== $role['gender_requirement']
        ) {
            return ['valid' => false, 'message' => "This role requires a {$role['gender_requirement']}"];
        }

        // Check if member is already assigned to this role
        $existingQuery = "SELECT COUNT(*) as count FROM " . $this->member_leadership_table . " 
                         WHERE role_id = :role_id AND member_id = :member_id";
        $existingStmt = $this->conn->prepare($existingQuery);
        $existingStmt->bindParam(':role_id', $role_id);
        $existingStmt->bindParam(':member_id', $member_id);
        $existingStmt->execute();
        $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing['count'] > 0) {
            return ['valid' => false, 'message' => 'Member is already assigned to this role'];
        }

        // Check maximum allowed assignments
        if ($role['max_allowed']) {
            $countQuery = "SELECT COUNT(*) as count FROM " . $this->member_leadership_table . " 
                          WHERE role_id = :role_id";
            $countStmt = $this->conn->prepare($countQuery);
            $countStmt->bindParam(':role_id', $role_id);
            $countStmt->execute();
            $count = $countStmt->fetch(PDO::FETCH_ASSOC);

            if ($count['count'] >= $role['max_allowed']) {
                return ['valid' => false, 'message' => "Maximum of {$role['max_allowed']} members allowed for this role"];
            }
        }

        return ['valid' => true, 'message' => 'Assignment is valid'];
    }

    // Assign member to role
    public function assignRole($role_id, $member_id, $assigned_by = null)
    {
        // First validate the assignment
        $validation = $this->canAssignRole($role_id, $member_id);
        if (!$validation['valid']) {
            return $validation;
        }

        $query = "INSERT INTO " . $this->member_leadership_table . " 
                  (role_id, member_id, assigned_by, assigned_at) 
                  VALUES (:role_id, :member_id, :assigned_by, NOW())";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':role_id', $role_id);
        $stmt->bindParam(':member_id', $member_id);
        $stmt->bindParam(':assigned_by', $assigned_by);

        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'Role assigned successfully'];
        } else {
            return ['success' => false, 'message' => 'Failed to assign role'];
        }
    }

    // Remove member from role
    public function removeRole($assignment_id)
    {
        $query = "DELETE FROM " . $this->member_leadership_table . " WHERE id = :assignment_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':assignment_id', $assignment_id);

        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'Role removed successfully'];
        } else {
            return ['success' => false, 'message' => 'Failed to remove role'];
        }
    }

    // Get leadership statistics
    public function getLeadershipStats()
    {
        $query = "SELECT 
                    lr.role_name,
                    lr.max_allowed,
                    COUNT(ml.id) as current_count
                  FROM " . $this->table_name . " lr
                  LEFT JOIN " . $this->member_leadership_table . " ml ON lr.role_id = ml.role_id
                  GROUP BY lr.role_id
                  ORDER BY lr.role_id ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Create new role
    public function createRole($role_name, $description = null, $max_allowed = null, $min_age = null, $max_age = null, $gender_requirement = 'any')
    {
        // Check if role name already exists
        $checkQuery = "SELECT COUNT(*) as count FROM " . $this->table_name . " WHERE role_name = :role_name";
        $checkStmt = $this->conn->prepare($checkQuery);
        $checkStmt->bindParam(':role_name', $role_name);
        $checkStmt->execute();
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing['count'] > 0) {
            return ['success' => false, 'message' => 'Role name already exists'];
        }

        $query = "INSERT INTO " . $this->table_name . " 
                  (role_name, description, max_allowed, min_age, max_age, gender_requirement) 
                  VALUES (:role_name, :description, :max_allowed, :min_age, :max_age, :gender_requirement)";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':role_name', $role_name);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':max_allowed', $max_allowed);
        $stmt->bindParam(':min_age', $min_age);
        $stmt->bindParam(':max_age', $max_age);
        $stmt->bindParam(':gender_requirement', $gender_requirement);

        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'Role created successfully', 'role_id' => $this->conn->lastInsertId()];
        } else {
            return ['success' => false, 'message' => 'Failed to create role'];
        }
    }

    // Update existing role
    public function updateRole($role_id, $role_name, $description = null, $max_allowed = null, $min_age = null, $max_age = null, $gender_requirement = 'any')
    {
        // Check if role exists
        $checkQuery = "SELECT COUNT(*) as count FROM " . $this->table_name . " WHERE role_id = :role_id";
        $checkStmt = $this->conn->prepare($checkQuery);
        $checkStmt->bindParam(':role_id', $role_id);
        $checkStmt->execute();
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing['count'] == 0) {
            return ['success' => false, 'message' => 'Role not found'];
        }

        // Check if role name already exists for other roles
        $nameCheckQuery = "SELECT COUNT(*) as count FROM " . $this->table_name . " 
                          WHERE role_name = :role_name AND role_id != :role_id";
        $nameCheckStmt = $this->conn->prepare($nameCheckQuery);
        $nameCheckStmt->bindParam(':role_name', $role_name);
        $nameCheckStmt->bindParam(':role_id', $role_id);
        $nameCheckStmt->execute();
        $nameExists = $nameCheckStmt->fetch(PDO::FETCH_ASSOC);

        if ($nameExists['count'] > 0) {
            return ['success' => false, 'message' => 'Role name already exists'];
        }

        $query = "UPDATE " . $this->table_name . " 
                  SET role_name = :role_name, description = :description, 
                      max_allowed = :max_allowed, min_age = :min_age, 
                      max_age = :max_age, gender_requirement = :gender_requirement,
                      updated_at = NOW()
                  WHERE role_id = :role_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':role_id', $role_id);
        $stmt->bindParam(':role_name', $role_name);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':max_allowed', $max_allowed);
        $stmt->bindParam(':min_age', $min_age);
        $stmt->bindParam(':max_age', $max_age);
        $stmt->bindParam(':gender_requirement', $gender_requirement);

        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'Role updated successfully'];
        } else {
            return ['success' => false, 'message' => 'Failed to update role'];
        }
    }

    // Delete role
    public function deleteRole($role_id)
    {
        // Check if role has any assignments
        $assignmentQuery = "SELECT COUNT(*) as count FROM " . $this->member_leadership_table . " 
                           WHERE role_id = :role_id";
        $assignmentStmt = $this->conn->prepare($assignmentQuery);
        $assignmentStmt->bindParam(':role_id', $role_id);
        $assignmentStmt->execute();
        $assignments = $assignmentStmt->fetch(PDO::FETCH_ASSOC);

        if ($assignments['count'] > 0) {
            return ['success' => false, 'message' => 'Cannot delete role with existing assignments. Remove all assignments first.'];
        }

        $query = "DELETE FROM " . $this->table_name . " WHERE role_id = :role_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':role_id', $role_id);

        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'Role deleted successfully'];
        } else {
            return ['success' => false, 'message' => 'Failed to delete role'];
        }
    }
}
