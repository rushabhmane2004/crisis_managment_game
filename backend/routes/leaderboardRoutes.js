const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ✅ Route to update leaderboard score
router.post("/update", async (req, res) => {
  const { characterName, score } = req.body;

  try {
    const user = await User.findOne({ username: characterName });

    if (!user) {
      return res.status(404).json({ message: "Character not found" });
    }

    // ✅ Update total score
    user.totalScore += score;
    await user.save();

    res.json({ message: "Score updated successfully", totalScore: user.totalScore });
  } catch (err) {
    console.error("❌ Error updating leaderboard:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
