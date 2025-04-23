import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PolicyGovernance.css';

// Fallback scores for evaluation errors
const fallbackScores = {
  riskMitigation: 15,
  decisionEffectiveness: 15,
  ethicalResponsibility: 10,
  passionitBalance: 10
};

const PolicyGovernance = () => {
  const [currentScenario, setCurrentScenario] = useState(null);
  const [policyText, setPolicyText] = useState('');
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wordCount, setWordCount] = useState(0);

  const fetchNewScenario = async () => {
    try {
      setLoading(true);
      setError('');
      setScores(null);
      setPolicyText('');
      
      const response = await axios.post('/api/policy_governance/questions', {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Handle rate limit message
      if (response.data.scenario?.includes("Please wait")) {
        setError(response.data.scenario);
        setCurrentScenario("Default scenario: Crisis management simulation");
        return;
      }

      if (response.data?.scenario) {
        setCurrentScenario(response.data.scenario);
      } else {
        setError('Received invalid scenario format from server');
        setCurrentScenario("Default scenario: Urban disaster response planning");
      }
      
    } catch (error) {
      console.error('Scenario load error:', error);
      setError(error.response?.data?.error || 'Failed to load scenario');
      setCurrentScenario("Default scenario: Emergency resource allocation");
    } finally {
      setLoading(false);
    }
  };

  const evaluatePolicy = async () => {
    try {
      setError('');
      const response = await axios.post('/api/policy_governance/evaluate', {
        scenario: currentScenario,
        policy: policyText
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Handle server-provided error with fallback scores
      if (response.data.error) {
        setError(`${response.data.error} Using default scores.`);
        setScores(fallbackScores);
      } else {
        setScores({
          riskMitigation: Math.min(30, Math.max(0, response.data.riskMitigation)),
          decisionEffectiveness: Math.min(30, Math.max(0, response.data.decisionEffectiveness)),
          ethicalResponsibility: Math.min(20, Math.max(0, response.data.ethicalResponsibility)),
          passionitBalance: Math.min(20, Math.max(0, response.data.passionitBalance))
        });
      }
      
    } catch (error) {
      console.error('Evaluation error:', error);
      setError('Evaluation failed. Using default scores.');
      setScores(fallbackScores);
    }
  };

  useEffect(() => {
    fetchNewScenario();
  }, []);

  useEffect(() => {
    // Update word count whenever policy text changes
    const words = policyText.split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [policyText]);

  return (
    <div className="policy-container">
      <h1>Policy & Governance Challenge</h1>
      {error && <div className="error-banner">{error}</div>}
      
      {loading ? (
        <div className="loading">Loading scenario...</div>
      ) : (
        <div className="content-wrapper">
          <div className="scenario-box">
            <h3>📜 Scenario</h3>
            <p>{currentScenario}</p>
          </div>

          <div className="policy-input-section">
            <textarea
              value={policyText}
              onChange={(e) => {
                const newText = e.target.value;
                const words = newText.split(/\s+/).filter(word => word.length > 0);
                if (words.length <= 300) setPolicyText(newText);
              }}
              placeholder="Write your policy here (max 300 words)..."
              rows={6}
            />
            <div className="counter-row">
              <span>{300 - wordCount} words remaining</span>
              <span>Minimum words: {Math.max(0, 50 - wordCount)}</span>
            </div>
          </div>

          {!scores ? (
            <button 
              className="eval-button"
              onClick={evaluatePolicy}
              disabled={!policyText.trim() || wordCount < 50}
            >
              {wordCount < 50 ? `Need ${50 - wordCount} more words` : '🚀 Submit Policy'}
            </button>
          ) : (
            <div className="results-section">
              <div className="score-card">
                <h3>📊 Evaluation Results</h3>
                <div className="score-grid">
                  {Object.entries(scores).map(([key, value]) => (
                    <div key={key} className="score-item">
                      <span>{{
                        riskMitigation: '📉 Risk Mitigation',
                        decisionEffectiveness: '⚖️ Effectiveness',
                        ethicalResponsibility: '🤝 Ethics',
                        passionitBalance: '⚗️ Balance'
                      }[key]}</span>
                      <span className="score-value">{value}/{
                        key === 'riskMitigation' || key === 'decisionEffectiveness' ? 30 : 20
                      }</span>
                    </div>
                  ))}
                </div>
                <div className="total-score">
                  Total: {Object.values(scores).reduce((a, b) => a + b, 0)}/100
                </div>
              </div>
              <button 
                className="next-button"
                onClick={fetchNewScenario}
              >
                ➡️ Next Challenge
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PolicyGovernance;