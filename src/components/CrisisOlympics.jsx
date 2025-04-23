import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateQuestion } from "./services/questionService";

import "./Multiplayer.css";

const Multiplayer = () => {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState("");
  const [questions, setQuestions] = useState([]);

  const fetchQuestion = () => {
    const generated = generateQuestion();
    setScenario(generated.scenario);
    setQuestions(generated.questions);
  };

  return (
    <div className="multiplayer-page">
      <header className="header">
        <h1 className="page-title">Multiplayer Mode</h1>
        <button className="back-button" onClick={() => navigate("/")}>Back to Home</button>
      </header>

      <div className="content">
        <p>Challenge your friends in a real-time crisis management game.</p>
        <button className="generate-button" onClick={fetchQuestion}>Generate Crisis Scenario</button>

        {scenario && (
          <div className="question-container">
            <h2>Scenario: {scenario}</h2>
            {questions.map((q, index) => (
              <div key={index} className="question-block">
                <h3>{q.question}</h3>
                {q.options.map((option, idx) => (
                  <button key={idx} className="option-button">
                    {option.text} (Points: {option.points})
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Multiplayer;
