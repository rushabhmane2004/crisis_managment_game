import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ScoringRule.css';

const ScoringRule = () => {
  const navigate = useNavigate();

  return (
    <div className="scoring-rule-page">
      <header className="header">
        <h1 className="page-title">Scoring Rule</h1>
        <button className="back-button" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </header>

      <div className="scoring-content">
        <h2>Lord KALKI Judgment System</h2>
        <p>Players are evaluated based on strategic crisis management decisions. Scores are determined by four key factors:</p>

        <table className="scoring-table">
          <thead>
            <tr>
              <th>Scoring Factor</th>
              <th>Description</th>
              <th>Points Range</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Risk Mitigation Strategy</td>
              <td>How well are risks assessed and managed?</td>
              <td>0-30</td>
            </tr>
            <tr>
              <td>Decision Effectiveness</td>
              <td>Are choices practical, realistic, and impactful?</td>
              <td>0-30</td>
            </tr>
            <tr>
              <td>Ethical & Social Responsibility</td>
              <td>Do decisions consider public welfare and fairness?</td>
              <td>0-20</td>
            </tr>
            <tr>
              <td>PASSIONIT-PRUTL Balance</td>
              <td>Does the strategy align with ethical governance principles?</td>
              <td>0-20</td>
            </tr>
          </tbody>
        </table>

        <h3>Score Breakdown</h3>
        <ul>
          <li><strong>90-100:</strong> <span className="score-mastermind">Crisis Mastermind</span> – Excellent risk assessment and strategic thinking.</li>
          <li><strong>70-89:</strong> <span className="score-strategist">Strategic Problem Solver</span> – Strong decision-making, but room for optimization.</li>
          <li><strong>50-69:</strong> <span className="score-reactive">Reactive Responder</span> – Basic crisis management skills, needs more foresight.</li>
          <li><strong>&lt;50:</strong> <span className="score-highrisk">High-Risk Decision-Maker</span> – Poor crisis response, high-risk choices.</li>
        </ul>

        <h3>Game Modes</h3>
        <p>The scoring system applies to all game modes:</p>
        <ul>
          <li><strong>Single Player:</strong> Individual crisis management challenges.</li>
          <li><strong>Multiplayer:</strong> Compete with others in real-time crisis resolution.</li>
          <li><strong>AI vs Human:</strong> Compete against AI decision-making.</li>
          <li><strong>Real-World Crisis:</strong> Solve real-life crisis scenarios.</li>
          <li><strong>Policy & Governance:</strong> Implement policies to manage crises.</li>
          <li><strong>Crisis Olympics:</strong> Test crisis response skills under extreme conditions.</li>
        </ul>
      </div>
    </div>
  );
};

export default ScoringRule;
