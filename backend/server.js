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

const SINGLE_PLAYER_API_KEY = "AIzaSyA7Q3yfldIOAeGg0dLZv_nWczJl8xmzD6s";
const SECONDARY_API_KEY = "AIzaSyAzl6q3HiZly3K1S2PSwhYcRjg6DsYI490";
const API_ENDPOINT = (key) => `https://generativelanguage.googleapis.com/v1/${MODEL_NAME}:generateContent?key=${key}`;

// Unified AI Question Generator
const generateAIQuestionsWithKey = async (apiKey, prompt) => {
    try {
        const response = await axios.post(
            API_ENDPOINT(apiKey),
            { contents: [{ role: "user", parts: [{ text: prompt }] }] }
        );
        return response.data;
    } catch (error) {
        console.error(`❌ API Key ${apiKey.slice(0,8)}... failed:`, error.message);
        throw error;
    }
};

// Enhanced Single Player Question Generator
const generateSinglePlayerQuestions = async () => {
    try {
        console.log("🎯 Generating AI questions for Single Player...");
        const now = Date.now();

        // Cache check
        if (cachedQuestions && now - lastRequestTime < CACHE_DURATION) {
            console.log("⚡ Using cached questions");
            return cachedQuestions;
        }

        // Scenario setup
        const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        const prompt = `Generate 5 multiple-choice quiz questions about ${randomScenario}.
            Each question must have 4 options labeled A) to D). Format exactly like:
            
            Question 1: What's the best response?
            A) Option one
            B) Option two
            C) Option three
            D) Option four`;

        // API call with fallback
        let response;
        try {
            response = await generateAIQuestionsWithKey(SINGLE_PLAYER_API_KEY, prompt);
        } catch (primaryError) {
            console.warn("⚠️ Primary key failed, trying secondary...");
            response = await generateAIQuestionsWithKey(SECONDARY_API_KEY, prompt);
        }

        // Validate response
        const generatedText = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!generatedText) throw new Error("Empty AI response");

        // Improved parsing
        const lines = generatedText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        let questions = [];
        let currentQuestion = null;
        let options = [];

        for (const line of lines) {
            const questionMatch = line.match(/^Question\s+\d+[:.]?\s*(.+)/i);
            const optionMatch = line.match(/^([A-D])[)\-.]\s*(.+)/i);

            if (questionMatch) {
                if (currentQuestion && options.length === 4) {
                    questions.push(createQuestionObject(currentQuestion, options));
                }
                currentQuestion = questionMatch[1];
                options = [];
            } else if (optionMatch) {
                options.push(optionMatch[2]);
            }
        }

        // Add final question
        if (currentQuestion && options.length === 4) {
            questions.push(createQuestionObject(currentQuestion, options));
        }

        // Validate questions
        if (questions.length < 5) {
            console.warn(`⚠️ Generated only ${questions.length}/5 questions`);
            questions = questions.slice(0, 5); // Ensure exactly 5
        }

        // Update cache
        cachedQuestions = {
            scenario: `${randomScenario} Challenge`,
            questions: questions.map(q => ({
                question: q.question,
                options: q.options
            }))
        };
        lastRequestTime = Date.now();

        return cachedQuestions;

    } catch (error) {
        console.error("❌ Single Player Error:", error.message);
        throw new Error("Question generation failed: " + error.message);
    }
};

// Helper function for question creation
const createQuestionObject = (question, options) => ({
    question,
    options: [
        { text: options[0], points: 10 },
        { text: options[1], points: 5 },
        { text: options[2], points: 0 },
        { text: options[3], points: -5 }
    ]
});

// Route handler (keep this at the end)
app.post("/api/singleplayer/questions", authenticateToken, async (req, res) => {
    try {
        const questions = await generateSinglePlayerQuestions();
        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            details: "Please try again in 10 minutes"
        });
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

const PRIMARY_API_KEY = "AIzaSyAj-zEKsAdTtcWaFex3rggFfxLe3gXagxo";
const FALLBACK_API_KEY = "AIzaSyA1YGTT0-Wef4wMK8rZTMFoAGiapeIRPOY";

// ------------------- Embedding and Cosine Similarity ------------------

const cosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (normA * normB);
};

const getEmbedding = async (text) => {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta2/models/embedding-gecko-001:embedText?key=${PRIMARY_API_KEY}`,
    { text }
  );
  return response.data.embedding.values;
};

// ------------------- Scenario Generator ------------------

const generatePolicyGovernanceScenario = async () => {
  try {
    const prompt = `Generate a short, crisp crisis scenario where a policymaker must take action. Limit to 2-3 lines.`;
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/${MODEL_NAME}:generateContent?key=${PRIMARY_API_KEY}`,
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      }
    );

    const scenarioText = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!scenarioText) {
      throw new Error("Empty scenario generated.");
    }

    return {
      scenario: scenarioText,
      wordLimit: 300
    };
  } catch (error) {
    console.warn("⚠️ Primary scenario generation failed. Switching to fallback key.");

    const prompt = `Generate a short, crisp crisis scenario for policymaker response. Keep it within 2-3 lines.`;
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/${MODEL_NAME}:generateContent?key=${FALLBACK_API_KEY}`,
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      }
    );

    const scenarioText = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!scenarioText) {
      throw new Error("Fallback scenario also failed.");
    }

    return {
      scenario: scenarioText,
      wordLimit: 300
    };
  }
};

// ------------------- Policy Generator ------------------

const generatePolicyForScenario = async (scenario) => {
  const prompt = `Create a clear, concise policy (max 300 words) to address the following scenario:\n\n"${scenario}"`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1/${MODEL_NAME}:generateContent?key=${PRIMARY_API_KEY}`,
    {
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    }
  );

  const policy = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!policy) throw new Error("Policy generation failed.");
  return policy;
};

// ------------------- Evaluation ------------------

const evaluatePolicy = async (policyText) => {
  const prompt = `Evaluate this crisis policy: "${policyText}" and score it on:
- Risk Mitigation (0-30)
- Decision Effectiveness (0-30)
- Ethical & Social Responsibility (0-20)
- PASSIONIT-PRUTL Balance (0-20)

Respond only in this JSON format:
{
  "riskMitigationScore": <number>,
  "decisionEffectivenessScore": <number>,
  "ethicalResponsibilityScore": <number>,
  "passionitPrutlScore": <number>,
  "totalScore": <number>,
  "evaluationSummary": "<brief explanation>"
}`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1/${MODEL_NAME}:generateContent?key=${PRIMARY_API_KEY}`,
    {
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    }
  );

  let text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  text = text.replace(/```json|```/g, "").trim();
  const result = JSON.parse(text);
  return result;
};

// ------------------- Middleware ------------------



// ------------------- Routes ------------------

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
    return res.status(400).json({ error: "Policy text is required." });
  }

  try {
    const evaluation = await evaluatePolicy(policyText);
    res.status(200).json(evaluation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/policy_governance/generate_and_evaluate", authenticateToken, async (req, res) => {
  try {
    const { scenario } = await generatePolicyGovernanceScenario();
    const policyText = await generatePolicyForScenario(scenario);

    const [scenarioVec, policyVec] = await Promise.all([
      getEmbedding(scenario),
      getEmbedding(policyText)
    ]);

    const similarity = cosineSimilarity(scenarioVec, policyVec);

    if (similarity < 0.85) {
      return res.status(400).json({
        error: "Policy does not align well with the scenario.",
        similarity
      });
    }

    const evaluation = await evaluatePolicy(policyText);

    res.status(200).json({
      scenario,
      policyText,
      similarity: similarity.toFixed(3),
      evaluation
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: "Internal error during policy evaluation." });
  }
});


const CRISIS_OLYMPICS_API_KEY = "AIzaSyCHDMNNv6vssGkK5D7_IXWSlpFTD8XVPEQ";
const CRISIS_OLYMPICS_FALLBACK_KEY = "AIzaSyCHsqtRzl682FdbovevIvLmRVwbNIPuIl4";

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

    let response;
    try {
      // Try primary API key first
      response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/${MODEL_NAME}:generateContent?key=${CRISIS_OLYMPICS_API_KEY}`,
        { contents: [{ role: "user", parts: [{ text: prompt }] }] }
      );
    } catch (primaryError) {
      console.warn("⚠️ Primary Crisis Olympics API key failed, trying fallback...");
      // Use fallback API key if primary fails
      response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/${MODEL_NAME}:generateContent?key=${CRISIS_OLYMPICS_FALLBACK_KEY}`,
        { contents: [{ role: "user", parts: [{ text: prompt }] }] }
      );
    }

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
    const aiQuestions = await generateCrisisOlympicsQuestions();
    res.status(200).json(aiQuestions);
  } catch (error) {
    res.status(500).json({ 
      error: error.message || "Failed to fetch Crisis Olympics questions.",
      retrySuggestion: "Please try again in a few minutes"
    });
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

