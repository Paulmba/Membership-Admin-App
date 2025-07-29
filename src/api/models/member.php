<?php
class Member
{
    private $conn;
    private $table_name = "members";
    private $mobile_table = "mobileusers";

    public $mid;
    public $first_name;
    public $last_name;
    public $gender;
    public $dob;
    public $address;
    public $phone_number;
    public $profile_completed;
    public $created_at;
    public $updated_at;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Getters for table names
    public function getTableName()
    {
        return $this->table_name;
    }

    public function getMobileTableName()
    {
        return $this->mobile_table;
    }

    // Get all members with mobile user information
    public function getAll()
    {
        $query = "SELECT m.*, mu.phone_number as mobile_phone, mu.is_verified,
                     CASE WHEN mu.mid IS NOT NULL THEN 'Mobile' ELSE 'Web' END as source
                     FROM " . $this->table_name . " m
                     LEFT JOIN " . $this->mobile_table . " mu ON m.mid = mu.mid
                     ORDER BY m.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Get members count
    public function getTotalCount()
    {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    // Get mobile users count
    public function getMobileUsersCount()
    {
        $query = "SELECT COUNT(*) as total FROM " . $this->mobile_table;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    // Get members by source (Mobile/Web)
    public function getBySource($source)
    {
        if ($source === 'Mobile') {
            $query = "SELECT m.*, mu.phone_number as mobile_phone, mu.is_verified, 'Mobile' as source
                      FROM " . $this->table_name . " m
                      INNER JOIN " . $this->mobile_table . " mu ON m.mid = mu.mid
                      ORDER BY m.created_at DESC";
        } else {
            $query = "SELECT m.*, NULL as mobile_phone, NULL as is_verified, 'Web' as source
                      FROM " . $this->table_name . " m
                      LEFT JOIN " . $this->mobile_table . " mu ON m.mid = mu.mid
                      WHERE mu.mid IS NULL
                      ORDER BY m.created_at DESC";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Search members by name
    public function search($searchTerm)
    {
        $query = "SELECT m.*, mu.phone_number as mobile_phone, mu.is_verified,
                     CASE WHEN mu.mid IS NOT NULL THEN 'Mobile' ELSE 'Web' END as source
                     FROM " . $this->table_name . " m
                     LEFT JOIN " . $this->mobile_table . " mu ON m.mid = mu.mid
                     WHERE m.first_name LIKE :search OR m.last_name LIKE :search
                     ORDER BY m.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $searchTerm = "%{$searchTerm}%";
        $stmt->bindParam(':search', $searchTerm);
        $stmt->execute();
        return $stmt;
    }

    // NEW METHOD: Get members by address similarity
    public function getByAddressSimilarity($addressTerm)
    {
        $query = "SELECT m.*, mu.phone_number as mobile_phone, mu.is_verified,
                     CASE WHEN mu.mid IS NOT NULL THEN 'Mobile' ELSE 'Web' END as source
                     FROM " . $this->table_name . " m
                     LEFT JOIN " . $this->mobile_table . " mu ON m.mid = mu.mid
                     WHERE m.address LIKE :addressTerm
                     ORDER BY m.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $searchAddress = "%{$addressTerm}%"; // Use % for partial matching
        $stmt->bindParam(':addressTerm', $searchAddress);
        $stmt->execute();
        return $stmt;
    }

    // Get member by ID
    public function getById($id)
    {
        $query = "SELECT m.*, mu.phone_number as mobile_phone, mu.is_verified,
                     CASE WHEN mu.mid IS NOT NULL THEN 'Mobile' ELSE 'Web' END as source
                     FROM " . $this->table_name . " m
                     LEFT JOIN " . $this->mobile_table . " mu ON m.mid = mu.mid
                     WHERE m.mid = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt;
    }

    // Create new member
    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . "
                  (first_name, last_name, gender, dob, address, phone_number, profile_completed)
                  VALUES (:first_name, :last_name, :gender, :dob, :address, :phone_number, :profile_completed)";

        $stmt = $this->conn->prepare($query);

        // Sanitize inputs
        $this->first_name = htmlspecialchars(strip_tags($this->first_name));
        $this->last_name = htmlspecialchars(strip_tags($this->last_name));
        $this->gender = htmlspecialchars(strip_tags($this->gender));
        $this->address = htmlspecialchars(strip_tags($this->address));
        $this->phone_number = htmlspecialchars(strip_tags($this->phone_number));

        // Bind parameters
        $stmt->bindParam(':first_name', $this->first_name);
        $stmt->bindParam(':last_name', $this->last_name);
        $stmt->bindParam(':gender', $this->gender);
        $stmt->bindParam(':dob', $this->dob);
        $stmt->bindParam(':address', $this->address);
        $stmt->bindParam(':phone_number', $this->phone_number);
        $stmt->bindParam(':profile_completed', $this->profile_completed);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Update member
    public function update()
    {
        $query = "UPDATE " . $this->table_name . "
                  SET first_name = :first_name, last_name = :last_name,
                      gender = :gender, dob = :dob, address = :address,
                      phone_number = :phone_number, profile_completed = :profile_completed
                  WHERE mid = :mid";

        $stmt = $this->conn->prepare($query);

        // Sanitize inputs
        $this->first_name = htmlspecialchars(strip_tags($this->first_name));
        $this->last_name = htmlspecialchars(strip_tags($this->last_name));
        $this->gender = htmlspecialchars(strip_tags($this->gender));
        $this->address = htmlspecialchars(strip_tags($this->address));
        $this->phone_number = htmlspecialchars(strip_tags($this->phone_number));

        // Bind parameters
        $stmt->bindParam(':first_name', $this->first_name);
        $stmt->bindParam(':last_name', $this->last_name);
        $stmt->bindParam(':gender', $this->gender);
        $stmt->bindParam(':dob', $this->dob);
        $stmt->bindParam(':address', $this->address);
        $stmt->bindParam(':phone_number', $this->phone_number);
        $stmt->bindParam(':profile_completed', $this->profile_completed);
        $stmt->bindParam(':mid', $this->mid);

        return $stmt->execute();
    }

    // Delete member
    public function delete()
    {
        $query = "DELETE FROM " . $this->table_name . " WHERE mid = :mid";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':mid', $this->mid);
        return $stmt->execute();
    }

    // Get recent member registrations
    public function getRecentRegistrations($limit = 10)
    {
        $query = "SELECT m.*, mu.phone_number as mobile_phone,
                     CASE WHEN mu.mid IS NOT NULL THEN 'Mobile' ELSE 'Web' END as source
                     FROM " . $this->table_name . " m
                     LEFT JOIN " . $this->mobile_table . " mu ON m.mid = mu.mid
                     ORDER BY m.created_at DESC
                     LIMIT :limit";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt;
    }
}