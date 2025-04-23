const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  scenario: { type: String, required: true },
  question: { type: String, required: true },
  options: [{ text: String, points: Number }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Question", QuestionSchema);
