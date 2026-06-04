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
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

import {
  runMigrations,
  getCombinedDatabaseState,
  dbWriteOperation,
  logAuditEvent,
  findUserByEmail,
  createUserInDB,
  seedUserDatabase,
  pool,
  isPostgresActive
} from "./server/db.js";

import {
  RegisterSchema,
  LoginSchema,
  WeeklyBoardItemSchema,
  ActionPlanItemSchema,
  EmergencyModeSchema,
  AccountabilityCommitmentSchema,
  DecisionLogSchema,
  InvestorSchema,
  BrandSchema,
  ReadinessScanSchema,
  KnowledgeDocSchema,
  WarRoomSessionSchema,
  ChatSchema
} from "./server/validation.js";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "fk_group_secret_session_layer_2026";

// --- SECURITY & PLATFORM ENHANCEMENTS ---
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1);

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: "Too many requests from this IP" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});
app.use("/api/", apiRateLimiter);

// --- GOOGLE GEMINI AI CONFIGURATION ---
let ai: any = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Strategic Gemini Advisor initialized successfully.");
  } else {
    console.warn("GEMINI_API_KEY is missing. Operating on offline heuristics.");
  }
} catch (err) {
  console.error("Failed to initialize Gemini:", err);
}

runMigrations();

// --- AUTHENTICATION & ROLE MANAGEMENT ---
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: number;
    email: string;
    role: "Chairman" | "Admin" | "Partner" | "Viewer";
  };
}

const requireAuth = async (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.status(401).json({ error: "Authentication failed. No token provided." });
      return;
    }
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Authentication failed. Stale or invalid session." });
  }
};

// --- REST ENDPOINTS ---

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }
    const { email, password } = parseResult.data;
    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: "Invalid email or credentials." });
      return;
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
    res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 24 * 60 * 60 * 1000 });
    res.json({ status: "success", user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) { next(error); }
});

app.get("/api/auth/me", requireAuth, (req: AuthenticatedRequest, res) => res.json({ user: req.user }));

app.get("/api/debug/ai", (req, res) => {
  res.json({
    active: !!ai,
    key_detected: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY",
    env: process.env.NODE_ENV
  });
});

app.get("/api/db", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    res.json(await getCombinedDatabaseState(req.user!.id));
  } catch (error) { next(error); }
});

// 1. AI CHAIRMAN ADVISOR (Chat system)
app.post("/api/chat", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { prompt } = req.body;
    const userId = req.user!.id;
    const dbState = await getCombinedDatabaseState(userId);

    let answerText = "AI is currently offline. Please ensure your GEMINI_API_KEY is configured in the .env file.";

    if (ai) {
      try {
        const docContext = dbState.knowledgeDocs
          .map((kd: any) => `[${kd.title}] (${kd.category}): ${kd.content}`)
          .join("\n\n");

        const promptContext = `
          You are the "AI Chairman Advisor" of FK Holdings. You are the continuous business companion to the Chairman on a strict path to complete the ₹1,100 Crore ecosystem plan.

          Context:
          ${docContext}

          Metrics:
          - Overall Score: ${dbState.partnerScore.overallScore}/100
          - MRR: ₹${(dbState.partnerScore.metrics.revenueMRR / 100000.0).toFixed(1)}L
          - Cash Runway: ${dbState.partnerScore.metrics.cashRunwayMonths} months

          Chairman Query: "${prompt}"
        `;

        const responseObj = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: promptContext,
        });

        answerText = responseObj.text || "I am analyzing the data. Please rephrase.";
      } catch (err: any) {
        console.error("Gemini failed in chat route:", err);
        answerText = `Operational Alert: ${err.message || "Connection timeout"}.`;
      }
    }

    const aiMsgId = "msg-ai-" + Date.now();
    await dbWriteOperation(userId, async (client, fallbackState) => {
      const msg = { id: aiMsgId, sender: "ai", text: answerText, timestamp: new Date().toISOString() };
      if (client) {
        await client.query("INSERT INTO messages (id, user_id, sender, text, timestamp) VALUES ($1, $2, $3, $4, NOW())", [aiMsgId, userId, "ai", answerText]);
      } else {
        fallbackState.messages.push(msg);
      }
    });

    res.json({ aiMessage: { id: aiMsgId, sender: "ai", text: answerText, timestamp: new Date().toISOString() } });
  } catch (error) { next(error); }
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
