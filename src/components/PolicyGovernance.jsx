import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPolicyGovernanceQuestions } from "./services/aiQuestionService";
import axios from "axios";
import "./Multiplayer.css"; // Reuse CSS
import "./PolicyGovernance.css"; // ✅ Import new beautiful styles

const PolicyGovernance = () => {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState("");
  const [policyText, setPolicyText] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScenario = async () => {
      try {
        const data = await fetchPolicyGovernanceQuestions();
        setScenario(data.scenario || "No scenario available.");
      } catch (error) {
        console.error("❌ Error fetching policy scenario:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchScenario();
  }, []);

  const handleSubmit = async () => {
    if (!policyText.trim()) {
      alert("Please write a policy before submitting!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/policy_governance/evaluate",
        { policyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEvaluation(response.data);
    } catch (error) {
      console.error("❌ Error submitting policy:", error.response?.data || error.message);
    }
  };

  return (
    <div className="multiplayer-page">
      <header className="header">
        <h1 className="page-title">Policy & Governance Mode</h1>
        <button className="back-button" onClick={() => navigate("/")}>Back to Home</button>
      </header>

      <div className="content policy-container">
        {loading ? (
          <p>Loading scenario...</p>
        ) : (
          <>
            <div className="scenario-box">
              <h2 className="scenario-title">Scenario</h2>
              <p className="scenario-text">{scenario}</p>
            </div>

            {!evaluation ? (
              <div className="policy-input-section">
                <textarea
                  className="policy-textarea"
                  rows="10"
                  value={policyText}
                  onChange={(e) => setPolicyText(e.target.value)}
                  placeholder="Write your policy decision here..."
                />
                <div className="counter-row">
                  {policyText.length}/300 words
                </div>

                <button className="eval-button" onClick={handleSubmit}>
                  Submit Policy for Evaluation
                </button>
              </div>
            ) : (
              <div className="score-card">
                <h2>Evaluation Results</h2>

                <div className="score-grid">
                  <div className="score-item">
                    <span>Risk Mitigation</span>
                    <span>{evaluation.riskMitigationScore}/30</span>
                  </div>
                  <div className="score-item">
                    <span>Decision Effectiveness</span>
                    <span>{evaluation.decisionEffectivenessScore}/30</span>
                  </div>
                  <div className="score-item">
                    <span>Ethical Responsibility</span>
                    <span>{evaluation.ethicalResponsibilityScore}/20</span>
                  </div>
                  <div className="score-item">
                    <span>PASSIONIT-PRUTL Balance</span>
                    <span>{evaluation.passionitPrutlScore}/20</span>
                  </div>
                </div>

                <div className="total-score">
                  Total Score: {evaluation.totalScore}/100
                </div>

                <p className="evaluation-summary">{evaluation.evaluationSummary}</p>

                <button className="next-button" onClick={() => navigate("/")}>
                  Return to Home
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PolicyGovernance;
