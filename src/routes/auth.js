const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const router = express.Router();

router.use(express.json());

// Register User
router.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;
  console.log(req.body);
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields." });
  }

  try {
    // Check if user already exists
    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, role || "customer"]
    );

    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Login User
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password." });
  }

  try {
    // Check user existence
    const [userResult] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    const user = userResult[0];
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password." });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    res
      .cookie("token", token, { httpOnly: true })
      .status(200)
      .json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
