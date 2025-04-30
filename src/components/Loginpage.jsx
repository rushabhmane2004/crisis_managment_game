import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Loginpage.css";

export default function LoginPage({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password || (activeTab === "signup" && !characterName)) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      const url =
        activeTab === "signup"
          ? "http://localhost:5000/api/users/signup"
          : "http://localhost:5000/api/users/login";

      const response = await axios.post(url, {
        email,
        password,
        ...(activeTab === "signup" && { characterName }),
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userData", JSON.stringify(response.data.user));
      localStorage.setItem("expiresAt", (Date.now() + 3600000).toString());

      setIsAuthenticated(true);
      navigate("/", { replace: true });
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Authentication failed";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background geometric shapes */}
      <div className="background-shapes">
        <div className="floating-shape shape1"></div>
        <div className="floating-shape shape2"></div>
        <div className="floating-shape shape3"></div>
        <div className="floating-shape shape4"></div>
      </div>

      {/* Main login card */}
      <div className="login-card">
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => setActiveTab('signin')}
          >
            Sign In
          </button>
          <button 
            className={`tab-button ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        <h1 className="form-title">{activeTab === 'signin' ? 'Sign In' : 'Sign Up'}</h1>

        {error && <p className="error-message">{error}</p>}

        <form className="auth-form" onSubmit={handleAuth}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
            />
            <div className="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              required
            />
            <div className="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
          </div>

          {activeTab === 'signup' && (
            <div className="input-group">
              <input
                type="text"
                placeholder="Character Name"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                className="auth-input"
                required
              />
              <div className="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>
          )}

          {activeTab === 'signin' && (
            <div className="forgot-password">
              <a href="#" className="forgot-link">Forgot Password?</a>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="auth-button"
          >
            {loading ? "Processing..." : activeTab === "signin" ? "Sign In" : "Sign Up"}
            <svg xmlns="http://www.w3.org/2000/svg" className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14"></path>
              <path d="M12 5l7 7-7 7"></path>
            </svg>
          </button>

          <div className="social-login">
            <div className="social-divider">
              <span>Or sign in with</span>
            </div>
            <div className="social-buttons">
              <a href="#" className="social-button google">
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
              </a>
              <a href="#" className="social-button facebook">
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.397,20.997v-8.196h2.765l0.411-3.209h-3.176V7.548c0-0.926,0.258-1.56,1.587-1.56h1.684V3.127C15.849,3.039,15.025,2.997,14.201,3c-2.444,0-4.122,1.492-4.122,4.231v2.355H7.332v3.209h2.753v8.202H13.397z"/>
                </svg>
              </a>
              <a href="#" className="social-button twitter">
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.162,5.656c-0.764,0.364-1.582,0.608-2.439,0.719c0.887-0.534,1.557-1.387,1.876-2.396c-0.826,0.497-1.734,0.85-2.707,1.036 C18.176,4.246,17.18,3.772,16.06,3.772c-2.036,0-3.687,1.652-3.687,3.687c0,0.289,0.32,0.571,0.097,0.841 c-3.064-0.155-5.786-1.621-7.61-3.862c-0.318,0.545-0.5,1.18-0.5,1.855c0,1.279,0.649,2.407,1.639,3.068 c-0.604-0.019-1.169-0.184-1.663-0.457v0.044c0,1.783,1.265,3.273,2.947,3.613c-0.308,0.084-0.631,0.13-0.966,0.13 c-0.237,0-0.466-0.023-0.69-0.066c0.466,1.468,1.825,2.533,3.433,2.533c-1.258,0.985-2.847,1.571-4.575,1.571 c-0.297,0-0.591-0.017-0.879-0.051c1.634,1.05,3.568,1.665,5.652,1.665c6.785,0,10.491-5.622,10.491-10.491 c0-0.161-0.004-0.321-0.011-0.479C20.818,7.217,21.56,6.487,22.162,5.656z"/>
                </svg>
              </a>
              <a href="#" className="social-button github">
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12,2.2467A10.00042,10.00042,0,0,0,8.83752,21.73419c.5.08752.6875-.21247.6875-.475,0-.23749-.01251-1.025-.01251-1.86249C7,19.85919,6.35,18.78423,6.15,18.22173A3.636,3.636,0,0,0,5.125,16.8092c-.35-.1875-.85-.65-.01251-.66248A2.00117,2.00117,0,0,1,6.65,17.17169a2.13742,2.13742,0,0,0,2.91248.825A2.10376,2.10376,0,0,1,10.2,16.65923c-2.225-.25-4.55-1.11254-4.55-4.9375a3.89187,3.89187,0,0,1,1.025-2.6875,3.59373,3.59373,0,0,1,.1-2.65s.83747-.26251,2.75,1.025a9.42747,9.42747,0,0,1,5,0c1.91248-1.3,2.75-1.025,2.75-1.025a3.59323,3.59323,0,0,1,.1,2.65,3.869,3.869,0,0,1,1.025,2.6875c0,3.83747-2.33752,4.6875-4.5625,4.9375a2.36814,2.36814,0,0,1,.675,1.85c0,1.33752-.01251,2.41248-.01251,2.75,0,.26251.1875.575.6875.475A10.0053,10.0053,0,0,0,12,2.2467Z"/>
                </svg>
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}