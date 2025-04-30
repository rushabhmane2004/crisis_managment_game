import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./HomePage.css";
import crisisImage from "../assets/fotor-ai-20250321164313.jpg";

const HomePage = () => {
  const navigate = useNavigate();
  const [characterName, setCharacterName] = useState("");
  const [welcomeMessageVisible, setWelcomeMessageVisible] = useState(true);

  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      try {
        const parsedUser = JSON.parse(storedUserData);
        setCharacterName(parsedUser.characterName);
      } catch (err) {
        console.error("❌ Error parsing userData from localStorage:", err);
      }
    }

    // Set the welcome message to fade out after 4 seconds
    const timer = setTimeout(() => {
      setWelcomeMessageVisible(false);
    }, 4000); // Message fades out after 4 seconds

    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, []);

  return (
    <div className="homepage">
      <div className="top-gradient">
        <header className="header">
          <div className="game-and-character">
            <h1 className="game-name">ChoiceMaster</h1>
          </div>

          <nav className="nav-links">
            <button className="scoring-rule" onClick={() => navigate("/scoring-rule")}>
              Scoring Rule
            </button>
            <button className="leaderboard" onClick={() => navigate("/leaderboard")}>
              Leaderboard
            </button>
            <button className="share-button">Share</button>
          </nav>

          {characterName && (
            <div className="character-box">
              <strong>{characterName}</strong>
            </div>
          )}
        </header>
      </div>

      <hr className="top-divider" />

      {/* Display Welcome Message if characterName is available */}
      {welcomeMessageVisible && characterName && (
        <div className="welcome-message">
          <p>Hello, {characterName}! Welcome to ChoiceMaster—show off your skills!</p>
        </div>
      )}

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
            whileHover={{ scale: 1.1, y: -5, backgroundColor: "#007bff" }}
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
