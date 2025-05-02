import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSinglePlayerQuestions } from "./services/aiQuestionService";
import axios from "axios";
import "./SinglePlayer.css";
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
  const [readyToRender, setReadyToRender] = useState(false); // ✅ new flag

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setReadyToRender(false); // ✅ avoid rendering prematurely
      try {
        const generated = await fetchSinglePlayerQuestions();
        if (generated.questions?.length > 0) {
          setScenario(generated.scenario || "No scenario available.");
          setQuestions(generated.questions);
          setReadyToRender(true); // ✅ render only when fully ready
        }
      } catch (error) {
        console.error("❌ Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAnswer = (option) => {
    if (!option || typeof option.points !== "number") return;

    const updated = [...selectedOptions, option.points];
    setSelectedOptions(updated);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      const finalScore = updated.reduce((sum, val) => sum + val, 0);
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
    } catch (err) {
      console.error("❌ Error saving score:", err.response?.data || err.message);
    }
  };

  return (
    <div className="multiplayer-page full-height">
      <header className="header">
        <h1 className="page-title">Single Player Mode</h1>
        <button className="back-button" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </header>

      <div className="content">
        {/* ✅ FIXED: Avoid flicker by checking readyToRender */}
        {loading || !readyToRender ? (
          <p>Loading questions...</p>
        ) : showScore ? (
          <div className="score-container">
            <h2>Your Final Score: {totalScore}</h2>
            <button onClick={() => navigate("/")}>Return to Home</button>
          </div>
        ) : (
          <>
            <h2 className="scenario-text">{scenario}</h2>
            <div className="question-block">
              <h3 className="question-text">
                {questions[currentQuestionIndex]?.question
                  ?.replace(/\*\*/g, "")
                  .trim()}
              </h3>

              <div className="options-container">
                {questions[currentQuestionIndex]?.options?.map((opt, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(opt)}
                    className="option-button"
                  >
                    {opt.text || "Option"}
                  </button>
                ))}
              </div>

              <div className="milestone-timeline">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className={`milestone-step ${
                      index < currentQuestionIndex
                        ? "completed"
                        : index === currentQuestionIndex
                        ? "active"
                        : ""
                    }`}
                  >
                    <div className="milestone-dot"></div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SinglePlayer;
