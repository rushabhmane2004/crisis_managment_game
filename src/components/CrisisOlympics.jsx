import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCrisisOlympicsQuestions } from "./services/aiQuestionService";
import axios from "axios";
import "./Multiplayer.css";

const CrisisOlympics = () => {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [showScore, setShowScore] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const generated = await fetchCrisisOlympicsQuestions();
        if (generated.questions?.length > 0) {
          setScenario(generated.scenario || "No scenario available.");
          setQuestions(generated.questions);
        } else {
          console.warn("⚠️ No questions received.");
        }
      } catch (error) {
        console.error("❌ Error fetching Crisis Olympics questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (questions.length === 0 || showScore) return;

    const countdown = setInterval(() => {
      setTimer(prev => {
        if (prev === 1) {
          handleTimeout();
          clearInterval(countdown);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [currentQuestionIndex, questions, showScore]);

  const handleTimeout = () => {
    handleAnswer({ points: 0 }); // No selection, auto zero
  };

  const handleAnswer = (option) => {
    const newSelected = [...selectedOptions, option.points];
    setSelectedOptions(newSelected);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimer(30); // Reset timer for next question
    } else {
      const finalScore = newSelected.reduce((sum, p) => sum + p, 0);
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
      console.log("✅ Crisis Olympics Score Updated Successfully");
    } catch (err) {
      console.error("❌ Error updating Crisis Olympics score:", err.response?.data || err.message);
    }
  };

  return (
    <div className="multiplayer-page">
      <header className="header">
        <h1 className="page-title">🏆 Crisis Olympics Mode</h1>
        <button className="back-button" onClick={() => navigate("/")}>Back to Home</button>
      </header>

      <div className="content">
        {loading ? (
          <p>Loading Crisis Scenario...</p>
        ) : showScore ? (
          <div className="score-container">
            <h2>Your Final Score: {totalScore}</h2>
            <button onClick={() => navigate("/")}>Return to Home</button>
          </div>
        ) : (
          <>
            <h2 className="scenario-text">{scenario}</h2>

            <div className="timer">Time Left: {timer}s</div>

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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CrisisOlympics;
