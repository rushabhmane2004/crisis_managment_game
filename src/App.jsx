import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import HomePage from "./components/HomePage";
import SinglePlayer from "./components/SinglePlayer";
import Multiplayer from "./components/Multiplayer";
import AIvsHuman from "./components/AIvsHuman";
import RealWorldCrisis from "./components/RealWorldCrisis";
import PolicyGovernance from "./components/PolicyGovernance";
import CrisisOlympics from "./components/CrisisOlympics";
import Leaderboard from "./components/Leaderboard";
import ScoringRule from "./components/ScoringRule";
import LoginPage from "./components/Loginpage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const expiresAt = localStorage.getItem("expiresAt");
      const authStatus = !!token && (!expiresAt || Date.now() < parseInt(expiresAt));
      setIsAuthenticated(authStatus);
      setLoading(false);
    };

    checkAuth();
    
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (loading) return <div className="loading-spinner">Loading...</div>;
    if (!isAuthenticated) {
      localStorage.clear();
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/login" 
        element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} 
      />
      <Route path="/scoring-rule" element={<ScoringRule />} />

      <Route path="/single-player" element={<ProtectedRoute><SinglePlayer /></ProtectedRoute>} />
      <Route path="/multiplayer" element={<ProtectedRoute><Multiplayer /></ProtectedRoute>} />
      <Route path="/ai-vs-human" element={<ProtectedRoute><AIvsHuman /></ProtectedRoute>} />
      <Route path="/real-world-crisis" element={<ProtectedRoute><RealWorldCrisis /></ProtectedRoute>} />
      <Route path="/policy-governance" element={<ProtectedRoute><PolicyGovernance /></ProtectedRoute>} />
      <Route path="/crisis-olympics" element={<ProtectedRoute><CrisisOlympics /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;