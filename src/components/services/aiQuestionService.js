import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const fetchMultiplayerQuestions = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/multiplayer/questions`, {}, getAuthHeaders());
    
    const data = response.data;
    console.log("✅ Multiplayer Response:", data);

    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format for multiplayer.");
    }

    const scenario = data.scenario || "";
    const questions = Array.isArray(data.questions) ? data.questions : [];

    if (!scenario) console.warn("⚠️ Multiplayer: Scenario missing.");
    if (questions.length === 0) console.warn("⚠️ Multiplayer: No questions received.");

    return { scenario, questions };
  } catch (error) {
    console.error("❌ Error fetching multiplayer questions:", error.response?.data || error.message);
    return { scenario: "", questions: [] };
  }
};

export const fetchSinglePlayerQuestions = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/singleplayer/questions`, {}, getAuthHeaders());
    
    const data = response.data;
    console.log("✅ Single Player Response:", data);

    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format for singleplayer.");
    }

    const scenario = data.scenario || "";
    const questions = Array.isArray(data.questions) ? data.questions : [];

    if (!scenario) console.warn("⚠️ Single Player: Scenario missing.");
    if (questions.length === 0) console.warn("⚠️ Single Player: No questions received.");

    return { scenario, questions };
  } catch (error) {
    console.error("❌ Error fetching singleplayer questions:", error.response?.data || error.message);
    return { scenario: "", questions: [] };
  }
};

export const fetchAiVsCrisisQuestions = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/ai_vs_crisis/questions`, {}, getAuthHeaders());

    const data = response.data;
    console.log("✅ AI vs Crisis Response:", data);

    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format for AI vs Crisis.");
    }

    const scenario = data.scenario || "";
    const questions = Array.isArray(data.questions) ? data.questions : [];

    if (!scenario) console.warn("⚠️ AI vs Crisis: Scenario missing.");
    if (questions.length === 0) console.warn("⚠️ AI vs Crisis: No questions received.");

    return { scenario, questions };
  } catch (error) {
    console.error("❌ Error fetching AI vs Crisis questions:", error.response?.data || error.message);
    return { scenario: "", questions: [] };
  }
};

export const fetchCrisisOlympicsQuestions = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/crisis_olympics/questions`, {}, getAuthHeaders());

    const data = response.data;
    console.log("✅ Crisis Olympics Response:", data);

    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format for Crisis Olympics.");
    }

    const scenario = data.scenario || "";
    const questions = Array.isArray(data.questions) ? data.questions : [];

    if (!scenario) console.warn("⚠️ Crisis Olympics: Scenario missing.");
    if (questions.length === 0) console.warn("⚠️ Crisis Olympics: No questions received.");

    return { scenario, questions };
  } catch (error) {
    console.error("❌ Error fetching Crisis Olympics questions:", error.response?.data || error.message);
    return { scenario: "", questions: [] };
  }
};

export const fetchRealWorldCrisisQuestions = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/real_world_crisis/questions`, {}, getAuthHeaders());

    const data = response.data;
    console.log("✅ Real World Crisis Response:", data);

    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format for Real World Crisis.");
    }

    const scenario = data.scenario || "";
    const questions = Array.isArray(data.questions) ? data.questions : [];

    if (!scenario) console.warn("⚠️ Real World Crisis: Scenario missing.");
    if (questions.length === 0) console.warn("⚠️ Real World Crisis: No questions received.");

    return { scenario, questions };
  } catch (error) {
    console.error("❌ Error fetching Real World Crisis questions:", error.response?.data || error.message);
    return { scenario: "", questions: [] };
  }
};

// aiquestionservice.js
export const fetchPolicyGovernanceQuestions = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/policy_governance/questions`, {}, getAuthHeaders());
    console.log("✅ Policy Governance Response:", response.data);

    // New response structure validation
    if (!response.data || typeof response.data !== "object") {
      throw new Error("Invalid policy governance response format");
    }

    // Extract from new response format
    const scenario = response.data.scenario || "Default policy scenario";
    const wordLimit = response.data.wordLimit || 300;

    // Validate server response
    if (typeof scenario !== "string") {
      console.warn("⚠️ Policy Governance: Invalid scenario format");
    }

    return { 
      scenario,
      wordLimit, // Added word limit to response
      questions: [] // Maintain compatibility with existing code
    };

  } catch (error) {
    console.error("❌ Policy Governance Error:", error.message);
    return {
      scenario: "As City Planner, how would you redesign infrastructure for climate resilience?",
      wordLimit: 300,
      questions: []
    };
  }
};