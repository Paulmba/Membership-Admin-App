<?php
// config/database.php
class Database
{
    private $host = 'localhost';
    private $db_name = 'church_membership';
    private $username = 'root';
    private $password = '1234567890';
    public $conn;
    public $gemini_api_key = 'AIzaSyDpJm1CJCt4MYAZ3lvf_3fIEn7cBeZu9co'; // Your Gemini API Key

    public function getConnection()
    {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $exception) {
            throw new Exception("Database connection failed: " . $exception->getMessage());
        }

        return $this->conn;
    }
}

// Create the $pdo variable that your main code expects
try {
    $database = new Database();
    $pdo = $database->getConnection();
} catch (Exception $e) {
    error_log("Database connection error: " . $e->getMessage());
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]));
}