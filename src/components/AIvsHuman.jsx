import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAiVsCrisisQuestions } from "./services/aiQuestionService";
import axios from "axios";
import "./Multiplayer.css"; // ✅ Reuse same styling

const AIVsHuman = () => {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [humanScore, setHumanScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [timer, setTimer] = useState(30);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const generated = await fetchAiVsCrisisQuestions();
        if (generated.questions?.length > 0) {
          setScenario(generated.scenario || "No scenario available.");
          setQuestions(generated.questions);
        } else {
          console.warn("⚠️ No questions received.");
        }
      } catch (error) {
        console.error("❌ Error fetching AI vs Human questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (questions.length === 0 || showResult) return;

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
  }, [currentQuestionIndex, questions, showResult]);

  const simulateAiAnswer = (options) => {
    const random = Math.random();
    if (random < 0.7) {
      return options[0].points; // 70% chance best answer
    } else if (random < 0.9) {
      return options[1].points; // 20% chance second best
    } else {
      return options[2].points; // 10% mistake
    }
  };

  const handleTimeout = () => {
    handleAnswer({ points: 0 }); // Human timeout = 0 points
  };

  const handleAnswer = (option) => {
    const humanPoints = option.points;
    const aiPoints = simulateAiAnswer(questions[currentQuestionIndex].options);

    setHumanScore(prev => prev + humanPoints);
    setAiScore(prev => prev + aiPoints);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimer(30); // Reset timer for next
    } else {
      setShowResult(true);
    }
  };

  return (
    <div className="multiplayer-page">
      <header className="header">
        <h1 className="page-title">🤖 AI vs Human Challenge</h1>
        <button className="back-button" onClick={() => navigate("/")}>Back to Home</button>
      </header>

      <div className="content">
        {loading ? (
          <p>Loading Scenario...</p>
        ) : showResult ? (
          <div className="score-container">
            <h2>🏆 Final Scores</h2>
            <p>You: {humanScore}</p>
            <p>AI: {aiScore}</p>
            <h3>{humanScore >= aiScore ? "🎉 You Win!" : "🤖 AI Wins!"}</h3>
            <button onClick={() => navigate("/")}>Return to Home</button>
          </div>
        ) : (
          <>
            <h2 className="scenario-text">{scenario}</h2>
            <div className="timer">Time Left: {timer}s</div>

            <div className="score-bar">
              <div className="human-score" style={{ width: `${(humanScore / 100) * 100}%` }}>You: {humanScore}</div>
              <div className="ai-score" style={{ width: `${(aiScore / 100) * 100}%` }}>AI: {aiScore}</div>
            </div>

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

export default AIVsHuman;
