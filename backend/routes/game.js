const express = require("express");
const User = require("../models/User");
const router = express.Router();

// ✅ Update User Score
router.post("/update-score", async (req, res) => {
  try {
    const { userId, gameMode, score } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // ✅ Update highest score per game mode
    user.scores[gameMode] = Math.max(user.scores[gameMode] || 0, score);
    user.totalScore += score;
    user.gamesPlayed += 1;

    await user.save();
    console.log("✅ Score updated for", user.username);

    res.json({ msg: "Score updated successfully", scores: user.scores });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

// ✅ Fetch Leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const users = await User.find().sort({ totalScore: -1 }).limit(10);
    res.json(users);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
