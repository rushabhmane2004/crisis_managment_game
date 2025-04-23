const express = require("express");
const router = express.Router();
const Question = require("../models/Question");

// Endpoint to get a random question
router.get("/random", async (req, res) => {
  try {
    const questions = await Question.find();
    if (questions.length === 0) {
      return res.status(404).json({ message: "No questions found" });
    }

    const randomIndex = Math.floor(Math.random() * questions.length);
    res.json(questions[randomIndex]);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
