const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// ✅ User Signup Fixes
router.post("/signup", async (req, res) => {
  const { email, password, characterName } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Ensure email is stored in lowercase
    const normalizedEmail = email.toLowerCase();

    // ✅ Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ Create new user
    user = new User({ 
      email: normalizedEmail, 
      password: hashedPassword, 
      username: characterName, 
      characterName, 
      totalScore: 0, 
      gamesPlayed: 0
    });

    await user.save();

    // ✅ Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, username: user.username, characterName: user.characterName, userId: user._id });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ User Login Fixes
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.warn("❌ Login failed: User not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.warn("❌ Login failed: Incorrect password");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, username: user.username, characterName: user.characterName, userId: user._id });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
