const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const multiplayerRooms = {}; // roomId -> { players: { username: score }, scenario }

require("dotenv").config();
const bcrypt = require("bcrypt");

const app = express();
const router = express.Router();

const User = require("./models/User");
const userRoutes = require('./routes/userRoutes');

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(helmet());

app.use('/api/users', userRoutes);

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = "models/gemini-1.5-flash";

if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is missing in .env file.");
    process.exit(1);
}
if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in .env file.");
    process.exit(1);
}
if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET is missing in .env file.");
    process.exit(1);
}

const connectDB = async () => {
    try {
        console.log("📌 MongoDB Connection Attempting...");
        await mongoose.connect(process.env.MONGO_URI, { dbName: "crisis_management" });
        console.log("✅ MongoDB Connected Successfully!");
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error.message);
        setTimeout(connectDB, 5000);
    }
};
connectDB();

let cachedQuestions = null;
let lastRequestTime = 0;
const CACHE_DURATION = 10 * 60 * 1000;

const requestTracker = {};
const RATE_LIMIT = 5;

app.use((req, res, next) => {
    console.log('Incoming body:', req.body);
    console.log(`📌 [${new Date().toISOString()}] ${req.method} - ${req.url} - IP: ${req.ip}`);
    next();
});

const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized: Token missing" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: "Forbidden: Invalid Token" });
    }
};

const scenarios = [
    "wildlife encounter",
    "building collapse",
    "earthquake",
    "fire",
    "accident",
    "elevator failure",
    "bridge collapse",
    "nuclear disaster",
    "chemical spill",
    "sea tornado",
    "flood situation",
    "cloud burst"
];

const generateAIQuestions = async () => {
    try {
        console.log("🔹 Generating AI questions...");

        const now = Date.now();
        const clientIP = "global";

        if (!requestTracker[clientIP]) requestTracker[clientIP] = { count: 0, timestamp: now };

        if (requestTracker[clientIP].count >= RATE_LIMIT && now - requestTracker[clientIP].timestamp < CACHE_DURATION) {
            throw new Error("Rate limit exceeded. Please wait before requesting again.");
        }

        if (cachedQuestions && now - lastRequestTime < CACHE_DURATION) {
            console.log("⚡ Using cached AI-generated questions.");
            return cachedQuestions;
        }

        const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        console.log(`🔹 Selected Scenario: ${randomScenario}`);

        const prompt = `Generate 5 multiple-choice quiz questions related to a ${randomScenario} scenario. Each question should have exactly four answer options that are very similar to each other, making it challenging for the user to choose. Format them clearly and consistently, for example:

Question 1: What should you do in this situation?
A) Option one
B) Option two
C) Option three
D) Option four

Follow this structure for all 5 questions.`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/${MODEL_NAME}:generateContent?key=${API_KEY}`,
            {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }]
                    }
                ]
            }
        );

        const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No questions generated.";
        console.log("✅ AI Response:\n", generatedText);

        const lines = generatedText.split("\n").map(line => line.trim()).filter(line => line !== "");

        let questions = [];
        let currentQuestion = "";
        let options = [];

        for (const line of lines) {
            const questionMatch = line.match(/^Question\s*\d*[:.]?\s*(.*\?)$/i);
            const optionMatch = line.match(/^[A-Da-d][).:-]\s*(.*)/);

            if (questionMatch) {
                if (currentQuestion && options.length === 4) {
                    questions.push({
                        question: currentQuestion,
                        optionA: options[0],
                        optionB: options[1],
                        optionC: options[2],
                        optionD: options[3],
                        options: [
                            { text: options[0], points: 10 },
                            { text: options[1], points: 5 },
                            { text: options[2], points: 0 },
                            { text: options[3], points: -5 }
                        ]
                    });
                }
                currentQuestion = questionMatch[1];
                options = [];
            } else if (optionMatch) {
                options.push(optionMatch[1]);
            }
        }

        if (currentQuestion && options.length === 4) {
            questions.push({
                question: currentQuestion,
                optionA: options[0],
                optionB: options[1],
                optionC: options[2],
                optionD: options[3],
                options: [
                    { text: options[0], points: 10 },
                    { text: options[1], points: 5 },
                    { text: options[2], points: 0 },
                    { text: options[3], points: -5 }
                ]
            });
        }

        if (questions.length < 5) {
            console.warn(`⚠️ Only ${questions.length} questions parsed. Expected 5.`);
        }

        cachedQuestions = { scenario: `AI-generated ${randomScenario} scenario`, questions };
        lastRequestTime = Date.now();
        requestTracker[clientIP].count++;
        requestTracker[clientIP].timestamp = now;

        return cachedQuestions;
    } catch (error) {
        console.error("❌ AI Error:", error.response?.data || error.message);
        throw new Error(error.message || "Failed to generate questions.");
    }
};

app.post("/api/multiplayer/questions", authenticateToken, async (req, res) => {
    try {
        const aiQuestions = await generateAIQuestions();
        res.status(200).json(aiQuestions);
    } catch (error) {
        res.status(500).json({ error: error.message || "Failed to fetch AI questions." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

const SINGLE_PLAYER_API_KEY = "AIzaSyA7Q3yfldIOAeGg0dLZv_nWczJl8xmzD6s"; // 👈 Different API key

const generateSinglePlayerQuestions = async () => {
    try {
        console.log("🎯 Generating AI questions for Single Player...");

        const now = Date.now();

        if (cachedQuestions && now - lastRequestTime < CACHE_DURATION) {
            console.log("⚡ Using cached AI-generated questions (Single Player).");
            return cachedQuestions;
        }

        const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        const prompt = `Generate 5 multiple-choice quiz questions related to a ${randomScenario} scenario. Each question should have exactly four similar answer options. Format them like:

Question 1: What should you do in this situation?
A) Option one
B) Option two
C) Option three
D) Option four`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/${MODEL_NAME}:generateContent?key=${SINGLE_PLAYER_API_KEY}`,
            {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }]
                    }
                ]
            }
        );

        const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No questions generated.";
        const lines = generatedText.split("\n").map(line => line.trim()).filter(Boolean);

        let questions = [];
        let currentQuestion = "";
        let options = [];

        for (const line of lines) {
            const questionMatch = line.match(/^Question\s*\d*[:.]?\s*(.*\?)$/i);
            const optionMatch = line.match(/^[A-Da-d][).:-]\s*(.*)/);

            if (questionMatch) {
                if (currentQuestion && options.length === 4) {
                    questions.push({
                        question: currentQuestion,
                        options: [
                            { text: options[0], points: 10 },
                            { text: options[1], points: 5 },
                            { text: options[2], points: 0 },
                            { text: options[3], points: -5 }
                        ]
                    });
                }
                currentQuestion = questionMatch[1];
                options = [];
            } else if (optionMatch) {
                options.push(optionMatch[1]);
            }
        }

        if (currentQuestion && options.length === 4) {
            questions.push({
                question: currentQuestion,
                options: [
                    { text: options[0], points: 10 },
                    { text: options[1], points: 5 },
                    { text: options[2], points: 0 },
                    { text: options[3], points: -5 }
                ]
            });
        }

        cachedQuestions = { scenario: `AI-generated ${randomScenario} scenario`, questions };
        lastRequestTime = Date.now();

        return cachedQuestions;
    } catch (error) {
        console.error("❌ Single Player AI Error:", error.response?.data || error.message);
        throw new Error("Failed to generate single player questions.");
    }
};

app.post("/api/singleplayer/questions", authenticateToken, async (req, res) => {
    try {
        const aiQuestions = await generateSinglePlayerQuestions();
        res.status(200).json(aiQuestions);
    } catch (error) {
        res.status(500).json({ error: error.message || "Failed to fetch Single Player questions." });
    }
});

const REAL_WORLD_CRISIS_API_KEY = "AIzaSyATMv-2NUvEGOwl8MzXS_PkDIwCnBqg_3E"; // New API key for Real World Crisis

const generateRealWorldCrisisQuestions = async () => {
  try {
    console.log("🌍 Generating AI questions for Real World Crisis...");

    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const prompt = `Generate 5 multiple-choice quiz questions based on real-world crisis situations like pandemics, cyberattacks, and economic downturns. Format them as:

Question 1: What is the correct response?
A) Option 1
B) Option 2
C) Option 3
D) Option 4`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/${MODEL_NAME}:generateContent?key=${REAL_WORLD_CRISIS_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      }
    );

    const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No questions generated.";
    console.log("✅ AI Real World Crisis Response:\n", generatedText);

    const lines = generatedText.split("\n").map(line => line.trim()).filter(Boolean);

    let questions = [];
    let currentQuestion = "";
    let options = [];

    for (const line of lines) {
      const questionMatch = line.match(/^Question\s*\d*[:.]?\s*(.*\?)$/i);
      const optionMatch = line.match(/^[A-Da-d][).:-]\s*(.*)/);

      if (questionMatch) {
        if (currentQuestion && options.length === 4) {
          questions.push({
            question: currentQuestion,
            options: [
              { text: options[0], points: 10 },
              { text: options[1], points: 5 },
              { text: options[2], points: 0 },
              { text: options[3], points: -5 }
            ]
          });
        }
        currentQuestion = questionMatch[1];
        options = [];
      } else if (optionMatch) {
        options.push(optionMatch[1]);
      }
    }

    if (currentQuestion && options.length === 4) {
      questions.push({
        question: currentQuestion,
        options: [
          { text: options[0], points: 10 },
          { text: options[1], points: 5 },
          { text: options[2], points: 0 },
          { text: options[3], points: -5 }
        ]
      });
    }

    return { scenario: `Real-World Crisis: ${randomScenario}`, questions };
  } catch (error) {
    console.error("❌ Real World Crisis AI Error:", error.response?.data || error.message);
    throw new Error("Failed to generate Real World Crisis questions.");
  }
};

app.post("/api/real_world_crisis/questions", authenticateToken, async (req, res) => {
  try {
    const aiQuestions = await generateRealWorldCrisisQuestions();
    res.status(200).json(aiQuestions);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch Real World Crisis questions." });
  }
});

const POLICY_GOVERNANCE_API_KEY = "AIzaSyC3iTH-O2dASx-tJY7ZbNF_aUmBMwWbu2s"; // You can assign a separate API key if needed

const generatePolicyGovernanceScenario = async () => {
  try {
    const randomScenario = "You are a policymaker responding to a nationwide water scarcity crisis. Design a new water management policy.";

    return {
      scenario: randomScenario,
      wordLimit: 300
    };
  } catch (error) {
    console.error("❌ Error generating Policy Scenario:", error.message);
    throw new Error("Failed to generate policy governance scenario.");
  }
};

const evaluatePolicy = async (policyText) => {
    try {
      const prompt = `
  You are an expert AI trained to assess crisis management policies based on the following criteria:
  
  - Risk Mitigation Strategy (0-30 points)
  - Decision Effectiveness (0-30 points)
  - Ethical & Social Responsibility (0-20 points)
  - PASSIONIT-PRUTL Balance (0-20 points)
  
  Please read the user's submitted policy below and score them in each category. Provide a brief explanation too.
  
  User Policy:
  "${policyText}"
  
  Respond strictly in JSON format like:
  {
    "riskMitigationScore": 25,
    "decisionEffectivenessScore": 27,
    "ethicalResponsibilityScore": 18,
    "passionitPrutlScore": 17,
    "totalScore": 87,
    "evaluationSummary": "Overall, the policy shows strong risk mitigation and ethical balance."
  }
  `;
  
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/${MODEL_NAME}:generateContent?key=${POLICY_GOVERNANCE_API_KEY}`,
        {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ]
        }
      );
  
      let generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "{}"; // Use let here!
      console.log("✅ AI Raw Response:\n", generatedText);
  
      generatedText = generatedText.replace(/```json|```/g, "").trim(); // Clean Markdown backticks
  
      const evaluation = JSON.parse(generatedText); // Parse clean JSON
      return evaluation;
    } catch (error) {
      console.error("❌ AI Policy Evaluation Error:", error.response?.data || error.message);
      throw new Error("Failed to evaluate the submitted policy.");
    }
  };
  

app.post("/api/policy_governance/questions", authenticateToken, async (req, res) => {
  try {
    const scenarioData = await generatePolicyGovernanceScenario();
    res.status(200).json(scenarioData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/policy_governance/evaluate", authenticateToken, async (req, res) => {
  const { policyText } = req.body;
  if (!policyText) {
    return res.status(400).json({ error: "Policy text is required for evaluation." });
  }

  try {
    const evaluation = await evaluatePolicy(policyText);
    res.status(200).json(evaluation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const CRISIS_OLYMPICS_API_KEY = "AIzaSyCHDMNNv6vssGkK5D7_IXWSlpFTD8XVPEQ";

const generateCrisisOlympicsQuestions = async () => {
  try {
    const randomScenario = "You are participating in Crisis Olympics. Respond quickly to manage a crisis situation!";
    const prompt = `
Generate exactly 5 multiple-choice quiz questions based on a crisis situation (hurricane, earthquake, pandemic). 
Each question must have 4 options labeled A), B), C), D).

Format STRICTLY like:
Question 1: What should you do during a hurricane?
A) Option one
B) Option two
C) Option three
D) Option four

Do NOT add headings like 'Scenario', only questions!`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/${MODEL_NAME}:generateContent?key=${CRISIS_OLYMPICS_API_KEY}`,
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      }
    );

    let generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!generatedText || generatedText.trim() === "") {
      throw new Error("Empty AI response for Crisis Olympics questions.");
    }

    console.log("✅ AI Raw Response Crisis Olympics:\n", generatedText);

    generatedText = generatedText.replace(/```json|```/g, "").trim();
    const lines = generatedText.split("\n").map(line => line.trim()).filter(Boolean);

    let questions = [];
    let currentQuestion = "";
    let options = [];

    for (const line of lines) {
      const questionMatch = line.match(/^Question\s*\d+[:.)-]?\s*(.*)$/i);
      const optionMatch = line.match(/^[A-D][).:-]\s*(.*)/);

      if (questionMatch) {
        if (currentQuestion && options.length === 4) {
          questions.push({
            question: currentQuestion,
            options: [
              { text: options[0], points: 10 },
              { text: options[1], points: 5 },
              { text: options[2], points: 0 },
              { text: options[3], points: -5 }
            ]
          });
        }
        currentQuestion = questionMatch[1];
        options = [];
      } else if (optionMatch) {
        options.push(optionMatch[1]);
      }
    }

    if (currentQuestion && options.length === 4) {
      questions.push({
        question: currentQuestion,
        options: [
          { text: options[0], points: 10 },
          { text: options[1], points: 5 },
          { text: options[2], points: 0 },
          { text: options[3], points: -5 }
        ]
      });
    }

    if (questions.length < 5) {
      throw new Error(`Only ${questions.length} questions parsed. Expected 5.`);
    }

    console.log("✅ Parsed Crisis Olympics Questions:", questions);

    return { scenario: randomScenario, questions };
  } catch (error) {
    console.error("❌ Crisis Olympics AI Error:", error.message || error.response?.data);
    throw new Error(error.message || "Failed to generate Crisis Olympics questions.");
  }
};

app.post("/api/crisis_olympics/questions", authenticateToken, async (req, res) => {
  try {
    const aiQuestions = await generateCrisisOlympicsQuestions(); // <<<<<<<<<< 🛠️ This was missing!
    res.status(200).json(aiQuestions);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch Crisis Olympics questions." });
  }
});

const AI_VS_HUMAN_API_KEY = "AIzaSyDLjhM28Zxka3U1V76FWjEmWDk3D1GK-og"; // New API Key!

const generateAiVsHumanQuestions = async () => {
  try {
    const randomScenario = "Compete against AI in a Crisis Scenario Challenge!";
    const prompt = `
Generate exactly 5 multiple-choice quiz questions about crisis management. 
Each question must have 4 options labeled A), B), C), D).
Strict format:

Question 1: How should you prepare for an earthquake?
A) Option one
B) Option two
C) Option three
D) Option four

No extra headings, no scenario text.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/${MODEL_NAME}:generateContent?key=${AI_VS_HUMAN_API_KEY}`,
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      }
    );

    let generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!generatedText || generatedText.trim() === "") {
      throw new Error("Empty AI response for AI vs Human questions.");
    }

    generatedText = generatedText.replace(/```json|```/g, "").trim();
    const lines = generatedText.split("\n").map(line => line.trim()).filter(Boolean);

    let questions = [];
    let currentQuestion = "";
    let options = [];

    for (const line of lines) {
      const questionMatch = line.match(/^Question\s*\d+[:.)-]?\s*(.*)$/i);
      const optionMatch = line.match(/^[A-D][).:-]\s*(.*)/);

      if (questionMatch) {
        if (currentQuestion && options.length === 4) {
          questions.push({
            question: currentQuestion,
            options: [
              { text: options[0], points: 10 },
              { text: options[1], points: 5 },
              { text: options[2], points: 0 },
              { text: options[3], points: -5 }
            ]
          });
        }
        currentQuestion = questionMatch[1];
        options = [];
      } else if (optionMatch) {
        options.push(optionMatch[1]);
      }
    }

    if (currentQuestion && options.length === 4) {
      questions.push({
        question: currentQuestion,
        options: [
          { text: options[0], points: 10 },
          { text: options[1], points: 5 },
          { text: options[2], points: 0 },
          { text: options[3], points: -5 }
        ]
      });
    }

    if (questions.length < 5) {
      throw new Error(`Only ${questions.length} questions parsed. Expected 5.`);
    }

    return { scenario: randomScenario, questions };
  } catch (error) {
    console.error("❌ AI vs Human API Error:", error.message || error.response?.data);
    throw new Error(error.message || "Failed to generate AI vs Human questions.");
  }
};

// Add this route in server.js
app.post("/api/ai_vs_crisis/questions", authenticateToken, async (req, res) => {
  try {
    const aiQuestions = await generateAiVsHumanQuestions();
    res.status(200).json(aiQuestions);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch AI vs Human questions." });
  }
});

