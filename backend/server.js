const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
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

        const prompt = `Generate 5 multiple-choice quiz questions related to a ${randomScenario} scenario. Each question should have exactly four answer options that are very similar to each other, making it challenging for the user to choose. Format them clearly.`;

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
        let currentQuestion = null;
        let options = [];

        for (const line of lines) {
            if (line.includes("?")) {
                if (currentQuestion && options.length === 4) {
                    questions.push({
                        question: currentQuestion.trim(),
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
                currentQuestion = line;
                options = [];
            } else {
                options.push(line);
            }
        }

        if (currentQuestion && options.length === 4) {
            questions.push({
                question: currentQuestion.trim(),
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

