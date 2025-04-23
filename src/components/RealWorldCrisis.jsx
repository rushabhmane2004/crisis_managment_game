import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateQuestion } from "./services/questionService";

import "./RealWorldCrisis.css";

const RealWorldCrisis = () => {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState("");
  const [questions, setQuestions] = useState([]);

  const fetchScenario = () => {
    const generated = generateQuestion();
    setScenario(generated.scenario);
    setQuestions(generated.questions);
  };

  return (
    <div className="real-world-crisis-page">
      <header className="header">
        <h1 className="page-title">Real-World Crisis Simulation</h1>
        <button className="back-button" onClick={() => navigate("/")}>Back to Home</button>
      </header>

      <div className="content">
        <p>Simulate real historical crises and test your decision-making skills.</p>
        <button className="generate-button" onClick={fetchScenario}>
          Generate Historical Crisis Scenario
        </button>

        {scenario && (
          <div className="scenario-container">
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

export default RealWorldCrisis;
