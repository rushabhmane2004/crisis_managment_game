import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // For smooth animations
import "./Leaderboard.css";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    // Fetch leaderboard data from backend API
    fetch("http://localhost:5000/api/leaderboard") // 🔹 Update with your API endpoint
      .then(response => response.json())
      .then(data => setPlayers(data))
      .catch(error => console.error("Error fetching leaderboard:", error));
  }, []);

  return (
    <div className="leaderboard-page">
      <header className="header">
        <h1 className="page-title">Leaderboard</h1>
        <button className="back-button" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </header>

      <div className="leaderboard-content">
        <h2>🏆 Top Crisis Strategists 🏆</h2>
        <p className="description">Who will emerge as the ultimate crisis solver?</p>

        <motion.div
          className="leaderboard-list"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {players.length > 0 ? (
            players.map((player, index) => (
              <motion.div
                key={index}
                className={`leaderboard-entry rank-${index + 1}`}
                whileHover={{ scale: 1.05 }}
              >
                <span className="rank">#{index + 1}</span>
                <span className="player-name">{player.name}</span>
                <span className="player-score">{player.score} pts</span>
              </motion.div>
            ))
          ) : (
            <p className="loading-message">Loading leaderboard...</p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Leaderboard;
