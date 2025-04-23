import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // ✅ Imported for animation
import "./HomePage.css";
import crisisImage from "../assets/fotor-ai-20250321164313.jpg"; // ✅ Updated Image

const HomePage = () => {
  console.log("HomePage component rendered"); // Debugging

  const navigate = useNavigate();

  return (
    <div className="homepage">
      <div className="top-gradient">
        <header className="header">
          {/* ✅ Updated Game Name with Shadow Effect */}
          <h1 className="game-name">ChoiceMaster</h1>
          <nav className="nav-links">
            <button className="scoring-rule" onClick={() => navigate("/scoring-rule")}>
              Scoring Rule
            </button>
            <button className="leaderboard" onClick={() => navigate("/leaderboard")}>
              Leaderboard
            </button>
            <button className="share-button">Share</button>
            <button className="login-button" onClick={() => navigate("/login")}>
              Login
            </button>
          </nav>
        </header>
      </div>

      <hr className="top-divider" />

      {/* ✅ Updated Crisis Image */}
      <div className="fire-image-section">
        <img src={crisisImage} alt="Crisis Fire Situation" />
      </div>

      <hr className="divider" />

      <div className="game-title-section">
        <h2 className="game-title">Crisis Management Game</h2>
        <p className="tagline">"Crisis, strategy, survival—can you make the right call?"</p>
      </div>

      <hr className="divider-modes" />

      <h2 className="game-modes-title">Game Modes</h2>

      <div className="game-modes">
        {/* ✅ Animated Game Mode Buttons */}
        {[
          { label: "Single Player", path: "/single-player" },
          { label: "Multiplayer", path: "/multiplayer" },
          { label: "AI vs Human", path: "/ai-vs-human" },
          { label: "Real World Crisis", path: "/real-world-crisis" },
          { label: "Policy & Governance", path: "/policy-governance" },
          { label: "Crisis Olympics", path: "/crisis-olympics" }
        ].map((mode, index) => (
          <motion.button
            key={index}
            className="game-button"
            onClick={() => navigate(mode.path)}
            whileHover={{ scale: 1.1, y: -5, backgroundColor: "#007bff" }} // ✅ Bouncing Effect
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {mode.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;