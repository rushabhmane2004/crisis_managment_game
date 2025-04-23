import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSinglePlayerQuestions } from "./services/aiQuestionService"; // ✅ Correct import
import axios from "axios";
import "./Multiplayer.css";

const SinglePlayer = () => {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [showScore, setShowScore] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const generated = await fetchSinglePlayerQuestions(); // ✅ Fetching single player questions

      if (!generated.questions || generated.questions.length === 0) {
        console.warn("⚠️ No questions received from AI.");
      }

      console.log("✅ Fetched questions:", generated.questions);

      setScenario(generated.scenario || "No scenario available.");
      setQuestions(generated.questions || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAnswer = (option) => {
    if (!option || typeof option.points !== "number") {
      console.warn("⚠️ Invalid option selected:", option);
      return;
    }

    setSelectedOptions((prev) => [...prev, option.points]);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      const finalScore = [...selectedOptions, option.points].reduce(
        (sum, p) => sum + p,
        0
      );
      setTotalScore(finalScore);
      setShowScore(true);
      saveScore(finalScore);
    }
  };

  const saveScore = async (score) => {
    const characterName = localStorage.getItem("characterName");

    try {
      await axios.post("http://localhost:5000/api/leaderboard/update", {
        characterName,
        score,
      });

      console.log("✅ Score updated successfully:", score);
    } catch (err) {
      console.error("❌ Error updating score:", err.response?.data || err.message);
    }
  };

  return (
    <div className="multiplayer-page">
      <header className="header">
        <h1 className="page-title">Single Player Mode</h1>
        <button className="back-button" onClick={() => navigate("/")}>Back to Home</button>
      </header>

      <div className="content">
        <h2 className="scenario-text">{scenario}</h2>

        {loading ? (
          <p>Loading questions...</p>
        ) : !showScore ? (
          <div className="question-block">
            {questions.length > 0 ? (
              <>
                <h3 className="question-text">
                  {questions[currentQuestionIndex]?.question?.replace(/\*\*/g, "").trim() || "Question not available."}
                </h3>

                <div className="options-container">
                  {questions[currentQuestionIndex]?.options?.length > 0 ? (
                    questions[currentQuestionIndex].options.map((opt, index) => (
                      <button key={index} onClick={() => handleAnswer(opt)} className="option-button">
                        {opt.text || "Option"}
                      </button>
                    ))
                  ) : (
                    <p>No options available for this question.</p>
                  )}
                </div>
              </>
            ) : (
              <p>No questions available.</p>
            )}
          </div>
        ) : (
          <div className="score-container">
            <h2>Your Final Score: {totalScore}</h2>
            <button onClick={() => navigate("/")}>Return to Home</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SinglePlayer;
