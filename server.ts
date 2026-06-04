import express from "express";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

import {
  runMigrations,
  getCombinedDatabaseState,
  dbWriteOperation,
  findUserByEmail,
  createUserInDB
} from "./server/db.js";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "fk_group_secret_session_layer_2026";

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1);

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: "Too many requests" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});
app.use("/api/", apiRateLimiter);

// --- BULLETPROOF SELF-HEALING AI ENGINE ---
async function callGeminiAI(prompt: string, context: string = "") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        throw new Error("Missing GEMINI_API_KEY.");
    }

    const configs = [
        { model: "gemini-1.5-flash", version: "v1beta" },
        { model: "gemini-pro", version: "v1" }
    ];

    let lastError = "";

    for (const config of configs) {
        try {
            const url = `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `You are the AI Chairman Advisor. Goal: ₹1,100 Crore Plan.\n\nContext:\n${context}\n\nQuery: ${prompt}` }] }]
                })
            });
            const data: any = await response.json();
            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            }
            if (data.error) lastError = data.error.message;
        } catch (err: any) { lastError = err.message; }
    }
    throw new Error(lastError || "AI connection failed");
}

runMigrations();

interface AuthenticatedRequest extends express.Request {
  user?: { id: number; email: string; role: string };
}

const requireAuth = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    req.user = jwt.verify(token, JWT_SECRET) as any;
    next();
  } catch (error) { res.status(401).json({ error: "Invalid session" }); }
};

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.json({ status: "success", user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) { res.status(500).json({ error: "Login error" }); }
});

app.get("/api/debug/ai", (req, res) => {
    res.json({ active: true, key_detected: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" });
});

app.get("/api/db", requireAuth, async (req: AuthenticatedRequest, res) => {
  res.json(await getCombinedDatabaseState(req.user!.id));
});

app.post("/api/chat", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user!.id;
    const dbState = await getCombinedDatabaseState(userId);
    const context = dbState.knowledgeDocs.map((kd: any) => `[${kd.title}]: ${kd.content}`).join("\n");

    const answerText = await callGeminiAI(prompt, context);
    const aiMsgId = "msg-ai-" + Date.now();

    await dbWriteOperation(userId, async (client, fallbackState) => {
      if (client) await client.query("INSERT INTO messages (id, user_id, sender, text) VALUES ($1, $2, $3, $4)", [aiMsgId, userId, "ai", answerText]);
      else fallbackState.messages.push({ id: aiMsgId, sender: "ai", text: answerText, timestamp: new Date().toISOString() });
    });

    res.json({ aiMessage: { id: aiMsgId, sender: "ai", text: answerText, timestamp: new Date().toISOString() } });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Static serving
if (process.env.NODE_ENV !== "production") {
  createViteServer({ server: { middlewareMode: true }, appType: "spa" }).then((vite) => {
    app.use(vite.middlewares);
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      vite.transformIndexHtml(req.url, fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8")).then((html) => {
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      }).catch(next);
    });
    app.listen(PORT, "0.0.0.0", () => console.log(`Server on port ${PORT}`));
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
  app.listen(PORT, "0.0.0.0", () => console.log(`Server on port ${PORT}`));
}

export default app;
