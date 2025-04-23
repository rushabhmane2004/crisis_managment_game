import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateQuestion } from "./services/questionService";

import "./Multiplayer.css";

const AIvsHuman = () => {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [showScore, setShowScore] = useState(false);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    const generated = generateQuestion();
    setScenario(generated.scenario);
    setQuestions(generated.questions);
  }, []);

  const handleAnswer = (option) => {
    setSelectedOptions([...selectedOptions, option.points]);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      const finalScore = selectedOptions.reduce((sum, points) => sum + points, option.points);
      setTotalScore(finalScore);
      setShowScore(true);
    }
  };

  return (
    <div className="multiplayer-page">
      <header className="header">
        <h1 className="page-title">AI vs Human Mode</h1>
        <button className="back-button" onClick={() => navigate("/")}>Back to Home</button>
      </header>

      <div className="content">
        <h2>Scenario: {scenario}</h2>

        {!showScore ? (
          <div className="question-block">
            <h3>{questions[currentQuestionIndex]?.question}</h3>
            {questions[currentQuestionIndex]?.options.map((option, idx) => (
              <button key={idx} onClick={() => handleAnswer(option)} className="option-button">
                {option.text}
              </button>
            ))}
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

export default AIvsHuman;
