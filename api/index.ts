import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import {
  getCombinedDatabaseState,
  findUserByEmail,
  dbWriteOperation
} from "../server/db.js";

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "fk_group_secret_session_layer_2026";

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1);

const cloudMemory: any = {};

// --- ROBUST AI ENGINE (DIRECT REST LINK) ---
async function callGeminiAI(prompt: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        throw new Error("Missing GEMINI_API_KEY in environment variables.");
    }

    // Using the most stable production model and endpoint
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: `You are the FK Chairman Strategic Partner. High-level corporate strategy only. Goal: 1100Cr Plan. Chairman says: ${prompt}` }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        })
    });

    const data: any = await response.json();

    if (data.error) {
        throw new Error(data.error.message || "AI Engine failure");
    }

    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
        return "I am processing the data. Please rephrase your query.";
    }

    return data.candidates[0].content.parts[0].text;
}

// Auth Middleware
interface AuthenticatedRequest extends express.Request {
  user?: { id: number; email: string; role: string };
}
const requireAuth = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Authentication required" });
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid session" });
  }
};

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000
    });
    res.json({ status: "success", user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", requireAuth, (req: AuthenticatedRequest, res) => res.json({ user: req.user }));

app.get("/api/debug/ai", (req, res) => {
  res.json({
    active: !!process.env.GEMINI_API_KEY,
    key_detected: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY",
    mode: "DIRECT_REST_V1"
  });
});

app.get("/api/db", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const data = await getCombinedDatabaseState(userId);
  if (cloudMemory[userId]) {
    data.messages = [...data.messages, ...cloudMemory[userId]];
  }
  res.json(data);
});

app.post("/api/chat", requireAuth, async (req: AuthenticatedRequest, res) => {
    const { prompt } = req.body;
    const userId = req.user!.id;

    const userMsg = { id: "msg-" + Date.now(), sender: "user", text: prompt, timestamp: new Date().toISOString() };
    if (!cloudMemory[userId]) cloudMemory[userId] = [];
    cloudMemory[userId].push(userMsg);

    let answerText = "";
    try {
        answerText = await callGeminiAI(prompt);
    } catch (err: any) {
        console.error("AI Error:", err);
        answerText = `Operational Alert: ${err.message}. Ensure GEMINI_API_KEY is correct in Vercel.`;
    }

    const aiMsg = { id: "msg-ai-" + Date.now(), sender: "ai", text: answerText, timestamp: new Date().toISOString() };
    cloudMemory[userId].push(aiMsg);

    res.json({ aiMessage: aiMsg });
});

export default app;
