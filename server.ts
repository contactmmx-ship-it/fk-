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

// Secure HTTP response headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled to permit standard Vite preview transformations
    crossOriginEmbedderPolicy: false,
  })
);

// Cross-Origin Resource Sharing (CORS) configured securely
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Inform Express we are behind a proxy, enabling correct req.ip resolution
app.set("trust proxy", 1);

// Rate Limiting to prevent brute-force and DDoS
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per window
  message: { error: "Too many requests from this IP, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false, // Turn off proxy validation warnings since environment has customized headers
});
app.use("/api/", apiRateLimiter);

// Input Sanitization helper to eliminate HTML Injection / XSS
function sanitizeString(str: string): string {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function sanitizeBody(obj: any): any {
  if (!obj) return obj;
  if (typeof obj === "string") return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeBody);
  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeBody(value);
    }
    return sanitized;
  }
  return obj;
}

app.use("/api/", (req, res, next) => {
  if (req.body) {
    req.body = sanitizeBody(req.body);
  }
  next();
});

// --- GOOGLE GEMINI AI CONFIGURATION ---
let ai: GoogleGenAI | null = null;
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

// Ensure Database tables verified
runMigrations();

// --- AUTHENTICATION & ROLE MANAGEMENT ---

interface AuthenticatedRequest extends express.Request {
  user?: {
    id: number;
    email: string;
    role: "Chairman" | "Admin" | "Partner" | "Viewer";
  };
}

// Authentication gate middleware (Requires active JWT in HTTP cookie)
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

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      role: "Chairman" | "Admin" | "Partner" | "Viewer";
    };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Authentication failed. Stale or invalid session." });
  }
};

// Role-Based Access Control gate (RBAC)
const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Access Denied. Authenticated session required." });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Core Forbidden: ${req.user.role} role does not possess permissions to execute this operational block.`,
      });
      return;
    }
    next();
  };
};

// --- AUTHENTICATION REST ENDPOINTS ---

// Register User (Hashed password, default metadata, user sandboxed database)
app.post("/api/auth/register", async (req, res, next) => {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const { email, password, role } = parseResult.data;
    const existing = await findUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: "System Error: Email address already registered in group." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUserInDB(email, passwordHash, role);

    await logAuditEvent(user.id, user.email, "USER_REGISTER", "AUTH");

    // Clear and sign session cookie immediately
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      status: "success",
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
});

// Login User
app.post("/api/auth/login", async (req, res, next) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const { email, password } = parseResult.data;
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid email or verification credentials." });
      return;
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      res.status(401).json({ error: "Invalid email or verification credentials." });
      return;
    }

    await logAuditEvent(user.id, user.email, "USER_LOGIN", "AUTH");

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      status: "success",
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
});

// Logout User
app.post("/api/auth/logout", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (req.user) {
    await logAuditEvent(req.user.id, req.user.email, "USER_LOGOUT", "AUTH");
  }
  res.clearCookie("token");
  res.json({ status: "success", message: "Logged out successfully" });
});

// Get Current Logged In User context
app.get("/api/auth/me", requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// --- SECURED, ISOLATED BACKEND API ENDPOINTS ---

// Get User Isolated complete DB State
app.get("/api/db", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const data = await getCombinedDatabaseState(userId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Reset User database entries
app.post(
  "/api/db/reset",
  requireAuth,
  requireRole(["Chairman", "Admin"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user!.id;
      const email = req.user!.email;

      await seedUserDatabase(userId, email);
      await logAuditEvent(userId, email, "DATABASE_RESET", "SYSTEM");

      const refreshed = await getCombinedDatabaseState(userId);
      res.json({ status: "success", message: "Database reset to corporate seed layout", db: refreshed });
    } catch (error) {
      next(error);
    }
  }
);

// Weekly Board CRUD item addition
app.post(
  "/api/weekly-board/items",
  requireAuth,
  requireRole(["Chairman", "Admin", "Partner"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const parseResult = WeeklyBoardItemSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.issues[0].message });
        return;
      }

      const { category, title, description } = parseResult.data;
      const itemId = "wb-" + Date.now();
      const userId = req.user!.id;

      await dbWriteOperation(userId, async (client, fallbackState) => {
        if (client) {
          await client.query(
            "INSERT INTO weekly_board_items (id, user_id, category, title, description) VALUES ($1, $2, $3, $4, $5)",
            [itemId, userId, category, title, description]
          );
        } else {
          fallbackState.weeklyBoardItems.push({ id: itemId, category, title, description });
        }
      });

      await logAuditEvent(userId, req.user!.email, `ADD_BOARD_ITEM_${category.toUpperCase()}`, "WEEKLY_BOARD");
      res.json({ status: "success", itemId });
    } catch (error) {
      next(error);
    }
  }
);

// Remove Weekly Board Item
app.delete(
  "/api/weekly-board/items/:id",
  requireAuth,
  requireRole(["Chairman", "Admin", "Partner"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const itemId = req.params.id;
      const userId = req.user!.id;

      await dbWriteOperation(userId, async (client, fallbackState) => {
        if (client) {
          const deleteRes = await client.query(
            "DELETE FROM weekly_board_items WHERE id = $1 AND user_id = $2",
            [itemId, userId]
          );
          if (deleteRes.rowCount === 0) {
            throw new Error("Item not found or access unauthorized");
          }
        } else {
          const idx = fallbackState.weeklyBoardItems.findIndex((x: any) => x.id === itemId);
          if (idx !== -1) {
            fallbackState.weeklyBoardItems.splice(idx, 1);
          } else {
            throw new Error("Item not found");
          }
        }
      });

      await logAuditEvent(userId, req.user!.email, `REMOVE_BOARD_ITEM_${itemId}`, "WEEKLY_BOARD");
      res.json({ status: "success" });
    } catch (error) {
      next(error);
    }
  }
);

// Add Action Plan Item
app.post(
  "/api/action-plan",
  requireAuth,
  requireRole(["Chairman", "Admin", "Partner"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const parseResult = ActionPlanItemSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.issues[0].message });
        return;
      }

      const { day, title, description } = parseResult.data;
      const itemId = "ap-" + Date.now();
      const userId = req.user!.id;

      await dbWriteOperation(userId, async (client, fallbackState) => {
        if (client) {
          await client.query(
            "INSERT INTO action_plan_items (id, user_id, day, title, description, completed) VALUES ($1, $2, $3, $4, $5, FALSE)",
            [itemId, userId, day, title, description]
          );
        } else {
          fallbackState.actionPlanItems.push({ id: itemId, day, title, description, completed: false });
        }
      });

      await logAuditEvent(userId, req.user!.email, "ADD_ACTION_PLAN", "WEEKLY_BOARD");
      res.json({ status: "success", itemId });
    } catch (error) {
      next(error);
    }
  }
);

// Toggle Action Plan completed state
app.post(
  "/api/action-plan/toggle",
  requireAuth,
  requireRole(["Chairman", "Admin", "Partner"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.body;
      if (!id) {
        res.status(400).json({ error: "Missing action ID parameter" });
        return;
      }
      const userId = req.user!.id;

      await dbWriteOperation(userId, async (client, fallbackState) => {
        if (client) {
          const updateRes = await client.query(
            "UPDATE action_plan_items SET completed = NOT completed WHERE id = $1 AND user_id = $2 RETURNING completed",
            [id, userId]
          );
          if (updateRes.rowCount === 0) {
            throw new Error("Action item not found or unauthorized access to toggle.");
          }
        } else {
          const item = fallbackState.actionPlanItems.find((x: any) => x.id === id);
          if (item) {
            item.completed = !item.completed;
          } else {
            throw new Error("Action item not found");
          }
        }
      });

      await logAuditEvent(userId, req.user!.email, `TOGGLE_ACTION_ITEM_${id}`, "WEEKLY_BOARD");
      res.json({ status: "success" });
    } catch (error) {
      next(error);
    }
  }
);

// Toggle Emergency State Parameters
app.post(
  "/api/emergency-mode",
  requireAuth,
  requireRole(["Chairman", "Admin"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const parseResult = EmergencyModeSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.issues[0].message });
        return;
      }

      const { isActivated, reason, runwayMonths, revenueGapPct } = parseResult.data;
      const userId = req.user!.id;

      await dbWriteOperation(userId, async (client, fallbackState) => {
        if (client) {
          // Verify table has row
          const exists = await client.query("SELECT * FROM emergency_mode WHERE user_id = $1", [userId]);
          if (exists.rowCount === 0) {
            await client.query(
              "INSERT INTO emergency_mode (user_id, is_activated, activated_at, reason, runway_months, revenue_gap_pct) VALUES ($1, $2, $3, $4, $5, $6)",
              [
                userId,
                isActivated ?? true,
                new Date().toISOString(),
                reason || "KPI Threshold cross trigger",
                runwayMonths || 6.1,
                revenueGapPct || -12,
              ]
            );
          } else {
            await client.query(
              `UPDATE emergency_mode 
               SET is_activated = COALESCE($1, is_activated),
                   activated_at = CASE WHEN $1 IS TRUE THEN $2 ELSE activated_at END,
                   reason = COALESCE($3, reason),
                   runway_months = COALESCE($4, runway_months),
                   revenue_gap_pct = COALESCE($5, revenue_gap_pct)
               WHERE user_id = $6`,
              [isActivated, new Date().toISOString(), reason, runwayMonths, revenueGapPct, userId]
            );
          }
        } else {
          const em = fallbackState.emergencyMode;
          if (isActivated !== undefined) em.isActivated = isActivated;
          if (reason) em.reason = reason;
          if (runwayMonths !== undefined) em.criticalKpis.runwayMonths = runwayMonths;
          if (revenueGapPct !== undefined) em.criticalKpis.revenueGapPct = revenueGapPct;
          if (isActivated) em.activatedAt = new Date().toISOString();
        }
      });

      await logAuditEvent(
        userId,
        req.user!.email,
        `TOGGLE_EMERGENCY_${isActivated ? "ON" : "OFF"}`,
        "EMERGENCY"
      );
      res.json({ status: "success" });
    } catch (error) {
      next(error);
    }
  }
);

// Add Accountability Commitment promises
app.post(
  "/api/accountability/commitments",
  requireAuth,
  requireRole(["Chairman", "Admin", "Partner"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const parseResult = AccountabilityCommitmentSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.issues[0].message });
        return;
      }

      const { title, status, committedDate, dueDate, impact } = parseResult.data;
      const itemId = "c-" + Date.now();
      const userId = req.user!.id;

      await dbWriteOperation(userId, async (client, fallbackState) => {
        if (client) {
          const overdueDays = status === "overdue" ? Math.floor(Math.random() * 8) + 2 : 0;
          await client.query(
            `INSERT INTO commitments (id, user_id, title, status, committed_days_overdue, committed_date, due_date, impact)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [itemId, userId, title, status, overdueDays, committedDate || "Today", dueDate || "EOW", impact || "Platform standard trigger"]
          );

          // Dynamically adjust scoring
          const { rows: overdueList } = await client.query(
            "SELECT COUNT(*)::int as cnt FROM commitments WHERE user_id = $1 AND status = 'overdue'",
            [userId]
          );
          const oCount = overdueList[0].cnt || 0;
          const adjustedScore = Math.max(30, 95 - oCount * 8);

          await client.query(
            `UPDATE scores 
             SET overall_score = $1, accountability_score = $1, executive_score = $1
             WHERE user_id = $2`,
            [adjustedScore, userId]
          );
        } else {
          const overdueDays = status === "overdue" ? Math.floor(Math.random() * 8) + 2 : 0;
          fallbackState.accountabilityCommitments.push({
            id: itemId,
            title,
            status,
            committedDaysOverdue: overdueDays,
            committedDate: committedDate || "Today",
            dueDate: dueDate || "EOW",
            impact: impact || "Platform standard trigger",
          });

          const oCount = fallbackState.accountabilityCommitments.filter((x: any) => x.status === "overdue").length;
          const adjustedScore = Math.max(30, 95 - oCount * 8);
          fallbackState.partnerScore.overallScore = adjustedScore;
          fallbackState.weeklyBoardMetrics.accountabilityScore = adjustedScore;
          fallbackState.partnerScore.metrics.executiveScore = adjustedScore;
        }
      });

      await logAuditEvent(userId, req.user!.email, "ADD_ACCOUNTABILITY_COMMITMENT", "ACCOUNTABILITY");
      res.json({ status: "success", itemId });
    } catch (error) {
      next(error);
    }
  }
);

// AI Accountability - Draft Promise
app.post(
  "/api/accountability/draft",
  requireAuth,
  requireRole(["Chairman", "Admin", "Partner"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { rawText } = req.body;
      if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
        res.status(400).json({ error: "rawText parameter is required." });
        return;
      }

      let result = {
        title: "Committed Deliverable",
        committedDate: "June 2, 2026",
        dueDate: "June 5, 2026",
        impact: "Ensures operational standards and aligns corporate targets.",
        status: "due-soon" as "due-soon" | "overdue" | "completed"
      };

      if (ai) {
        try {
          const prompt = `
            Evaluate the following raw business commitment/thought from a high-growth founder:
            "${rawText}"

            The current date is Tuesday, June 2, 2026. This is crucial for calculating dynamic relative dates (e.g., 'Friday' means June 5, 2026, 'tomorrow' means June 3, 2026).
            Convert this into a formal, clear corporate commitment object with a specific title, starting date, realistic due date, estimated business impact (e.g., 'Strengthens SPV 42 trust', 'Secures Dinesh Mehta\'s strategic investment'), and status ('due-soon', 'overdue', 'completed').
          `;

          const gen = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  committedDate: { type: Type.STRING },
                  dueDate: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  status: { type: Type.STRING }
                },
                required: ["title", "committedDate", "dueDate", "impact", "status"]
              }
            }
          });

          if (gen && gen.text) {
            const parsed = JSON.parse(gen.text.trim());
            result = {
              title: parsed.title || result.title,
              committedDate: parsed.committedDate || result.committedDate,
              dueDate: parsed.dueDate || result.dueDate,
              impact: parsed.impact || result.impact,
              status: (parsed.status === "overdue" || parsed.status === "completed") ? parsed.status : "due-soon"
            };
          }
        } catch (gemErr) {
          console.error("Gemini commitment draft error, falling back to heuristic:", gemErr);
          // Simple fallback parser
          if (rawText.toLowerCase().includes("overdue") || rawText.toLowerCase().includes("slipped")) {
            result.status = "overdue";
          }
          result.title = rawText.length > 60 ? rawText.slice(0, 57) + "..." : rawText;
        }
      } else {
        // Offline heuristics
        let parsedTitle = rawText.length > 60 ? rawText.slice(0, 57) + "..." : rawText;
        let pStatus: "due-soon" | "overdue" | "completed" = "due-soon";
        if (rawText.toLowerCase().includes("overdue") || rawText.toLowerCase().includes("slipped") || rawText.toLowerCase().includes("missed")) {
          pStatus = "overdue";
        } else if (rawText.toLowerCase().includes("done") || rawText.toLowerCase().includes("complete") || rawText.toLowerCase().includes("finish")) {
          pStatus = "completed";
        }
        result = {
          title: parsedTitle,
          committedDate: "June 2, 2026",
          dueDate: "June 9, 2026",
          impact: "Drives team accountability & ensures corporate compliance.",
          status: pStatus
        };
      }

      res.json({ status: "success", draft: result });
    } catch (error) {
      next(error);
    }
  }
);

// AI Accountability - Audit Report
app.post(
  "/api/accountability/audit",
  requireAuth,
  requireRole(["Chairman", "Admin", "Partner"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user!.id;
      let commitments: any[] = [];

      await dbWriteOperation(userId, async (client, fallbackState) => {
        if (client) {
          const { rows } = await client.query(
            "SELECT * FROM commitments WHERE user_id = $1 ORDER BY id",
            [userId]
          );
          commitments = rows;
        } else {
          commitments = fallbackState.accountabilityCommitments;
        }
      });

      const totalCount = commitments.length;
      const overdue = commitments.filter(c => c.status === "overdue");
      const dueSoon = commitments.filter(c => c.status === "due-soon");
      const completed = commitments.filter(c => c.status === "completed");
      const completionRate = Math.round((completed.length / (totalCount || 1)) * 100);

      let auditResult = {
        analysisText: `### **AI Accountability Executive Audit**
Detected **${totalCount} total registered promises** on the ledger with a **${completionRate}% overall completion rate**. While strategic board targets display alignment, operational detail gates present major friction points.
* **Operational Blindspots:** Task slippages show high concentration near regulatory reviews and third-party franchise audits.
* **Strategic Vulnerability:** Important files regarding FOCO outlets are being deferred into risk zones.`,
        completionRatioEvaluation: `${completionRate}% Completion Rate (Low detail management retention)`,
        investorCompletionSlipText: overdue.length > 0 ? `${overdue.length} Slipped strategic milestone(s)` : "Optimal Investor Trust Saved",
        operationsCompletionSlipText: dueSoon.length > 0 ? "Pending critical operations check-ins" : "No immediate pipeline slippage predicted",
        strategicBoardMilestonesText: "92% Strategic Task Fidelity",
        recommendedIntervention: "Execute immediate organizational delegation. Shortlist candidates for the Chief Operating Officer position by June 10, delegating 100% of standard outlet compliance reviews. Ensure all critical files are sent to Dinesh Mehta to finalize SPV 42 closings.",
        suggestedRecoveryActions: [
          { title: "COO Candidate Selection", day: "Monday", description: "Filter shortlist applications and schedule 3 immediate screening calls." },
          { title: "Pune Audit Compliance Sync", day: "Wednesday", description: "Review compliance documents for Pune outlets and dispatch files to Rajeev Kumar." },
          { title: "Dinesh Mehta Valuation File", day: "Friday", description: "Deliver finalized brand target comparative reports for SPV 42." }
        ]
      };

      if (ai) {
        try {
          const formattedCommitments = commitments.map(c => 
            `- [${c.status.toUpperCase()}] "${c.title}" (Committed: ${c.committedDate}, Due: ${c.dueDate}). Impact: ${c.impact}`
          ).join("\n");

          const prompt = `
            You are a strict, top-tier Corporate Venture Capital & Executive Performance AI Assessor.
            You are evaluating the accountability records of the Chairman of FK Group (Rajeev Kumar) on June 2, 2026.
            Here is the ledger of their current commitments:
            ${formattedCommitments || "No active commitments registered yet."}

            Total Commitments: ${totalCount}
            Completed: ${completed.length}
            Overdue / Slipped: ${overdue.length}
            Due Soon: ${dueSoon.length}
            Current Completion Rate: ${completionRate}%

            Perform a rich, deep cryptographic audit of their leadership actions. Identify:
            1. Crucial failure patterns inside the titles (e.g., operations vs. raising money).
            2. Concrete risk predictions (e.g., which pending tasks are highly likely to slip).
            3. A strict recommended executive intervention.
            4. Precisely 3 tactical recovery actions to resolve active slips. These actions must have a specific day associated with them (Monday to Sunday) and look like standard, realistic operating steps for this enterprise (e.g., "COO Shortlist screening", "Finalize SPV 42 metrics", etc.).

            You MUST respond in clean JSON fitting the schema exactly.
          `;

          const gen = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  analysisText: { type: Type.STRING },
                  completionRatioEvaluation: { type: Type.STRING },
                  investorCompletionSlipText: { type: Type.STRING },
                  operationsCompletionSlipText: { type: Type.STRING },
                  strategicBoardMilestonesText: { type: Type.STRING },
                  recommendedIntervention: { type: Type.STRING },
                  suggestedRecoveryActions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        day: { type: Type.STRING },
                        description: { type: Type.STRING }
                      },
                      required: ["title", "day", "description"]
                    }
                  }
                },
                required: [
                  "analysisText", "completionRatioEvaluation", "investorCompletionSlipText",
                  "operationsCompletionSlipText", "strategicBoardMilestonesText", "recommendedIntervention", "suggestedRecoveryActions"
                ]
              }
            }
          });

          if (gen && gen.text) {
            const parsed = JSON.parse(gen.text.trim());
            auditResult = {
              analysisText: parsed.analysisText || auditResult.analysisText,
              completionRatioEvaluation: parsed.completionRatioEvaluation || auditResult.completionRatioEvaluation,
              investorCompletionSlipText: parsed.investorCompletionSlipText || auditResult.investorCompletionSlipText,
              operationsCompletionSlipText: parsed.operationsCompletionSlipText || auditResult.operationsCompletionSlipText,
              strategicBoardMilestonesText: parsed.strategicBoardMilestonesText || auditResult.strategicBoardMilestonesText,
              recommendedIntervention: parsed.recommendedIntervention || auditResult.recommendedIntervention,
              suggestedRecoveryActions: parsed.suggestedRecoveryActions && parsed.suggestedRecoveryActions.length > 0 
                ? parsed.suggestedRecoveryActions 
                : auditResult.suggestedRecoveryActions
            };
          }
        } catch (gemErr) {
          console.error("Gemini AI accountability audit failed, using heuristic fallback:", gemErr);
        }
      }

      await logAuditEvent(userId, req.user!.email, "RUN_AI_ACCOUNTABILITY_AUDIT", "ACCOUNTABILITY");
      res.json({ status: "success", audit: auditResult });
    } catch (error) {
      next(error);
    }
  }
);

// AI Accountability - Mitigate Slips (Apply recovery actions to active action plan)
app.post(
  "/api/accountability/mitigate",
  requireAuth,
  requireRole(["Chairman", "Admin", "Partner"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { actions } = req.body;
      if (!actions || !Array.isArray(actions) || actions.length === 0) {
        res.status(400).json({ error: "actions list parameter is required." });
        return;
      }

      const userId = req.user!.id;

      await dbWriteOperation(userId, async (client, fallbackState) => {
        for (const action of actions) {
          const itemId = "ap-mitigate-" + Math.floor(Math.random() * 1000000) + "-" + Date.now();
          const day = action.day || "Monday";
          const title = `[AI MITIGATION] ${action.title}`;
          const description = action.description || "Generated by the AI Accountability Automated Recovery module.";

          if (client) {
            await client.query(
              "INSERT INTO action_plan_items (id, user_id, day, title, description, completed) VALUES ($1, $2, $3, $4, $5, FALSE)",
              [itemId, userId, day, title, description]
            );
          } else {
            fallbackState.actionPlanItems.push({
              id: itemId,
              day,
              title,
              description,
              completed: false
            });
          }
        }
      });

      await logAuditEvent(userId, req.user!.email, "APPLY_ACCOUNTABILITY_MITIGATIONS", "ACCOUNTABILITY");
      res.json({ status: "success", message: `Successfully scheduled ${actions.length} automated recovery tasks.` });
    } catch (error) {
      next(error);
    }
  }
);

// Publish Board Decision resolution logs
app.post(
  "/api/decision-log",
  requireAuth,
  requireRole(["Chairman", "Admin"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const parseResult = DecisionLogSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.issues[0].message });
        return;
      }

      const { title, context, outcome, status } = parseResult.data;
      const itemId = "dl-" + Date.now();
      const userId = req.user!.id;
      const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

      await dbWriteOperation(userId, async (client, fallbackState) => {
        if (client) {
          await client.query(
            `INSERT INTO weekly_board_items (id, user_id, category, title, description)
             VALUES ($1, $2, $3, $4, $5)`,
            [itemId, userId, "decision", title, `Context: ${context || ""}. Outcome: ${outcome}`]
          );
        } else {
          fallbackState.decisionLogItems.unshift({
            id: itemId,
            title,
            date: dateStr,
            context: context || "Strategic context",
            outcome,
            status,
          });
        }
      });

      await logAuditEvent(userId, req.user!.email, "ADD_DECISION_LOG", "DECISIONS");
      res.json({ status: "success", itemId });
    } catch (error) {
      next(error);
    }
  }
);

// Onboard new Syndicate Investors
app.post(
  "/api/investors",
  requireAuth,
  requireRole(["Chairman", "Admin"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const parseResult = InvestorSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.issues[0].message });
        return;
      }

      const { name, email, contact, ticketSizeRs, stage, spvAllocated, notes } = parseResult.data;
      const itemId = "inv-" + Date.now();
      const userId = req.user!.id;
      const dateStr = new Date().toISOString().split("T")[0];

      await dbWriteOperation(userId, async (client, fallbackState) => {
        if (client) {
          await client.query(
            `INSERT INTO investors (id, user_id, name, email, contact, ticket_size_rs, stage, spv_allocated, last_contacted, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [itemId, userId, name, email || "", contact || "", ticketSizeRs, stage, spvAllocated || "Pending", dateStr, notes || ""]
          );

          // Recalculate partner metrics
          const { rows } = await client.query(
            "SELECT COUNT(*)::int as cnt FROM investors WHERE user_id = $1 AND stage = 'warm'",
            [userId]
          );
          const warmCount = rows[0].cnt || 0;

          await client.query(
            `UPDATE scores SET investor_funnel_warm_count = $1 WHERE user_id = $2`,
            [warmCount, userId]
          );
          await client.query(
            `UPDATE emergency_mode SET investor_funnel_count = $1 WHERE user_id = $2`,
            [warmCount, userId]
          );
        } else {
          fallbackState.investors.push({
            id: itemId,
            name,
            email: email || "",
            contact: contact || "",
            ticketSizeRs,
            stage,
            spvAllocated: spvAllocated || "Pending",
            lastContacted: dateStr,
            notes: notes || "",
          });

          const warmCount = fallbackState.investors.filter((x: any) => x.stage === "warm").length;
          fallbackState.partnerScore.metrics.investorFunnelWarmCount = warmCount;
          fallbackState.emergencyMode.criticalKpis.investorFunnelCount = warmCount;
        }
      });

      await logAuditEvent(userId, req.user!.email, "ONBOARD_INVESTOR", "INVESTORS");
      res.json({ status: "success", itemId });
    } catch (error) {
      next(error);
    }
  }
);

// Update Investor record
app.patch(
  "/api/investors/:id",
  requireAuth,
  requireRole(["Chairman", "Admin"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const itemId = req.params.id;
      const userId = req.user!.id;
      const { name, email, contact, ticketSizeRs, stage, spvAllocated, notes, lastContacted } = req.body;

      await dbWriteOperation(userId, async (client, fallbackState) => {
        if (client) {
          await client.query(
            `UPDATE investors 
             SET name = COALESCE($1, name),
                 email = COALESCE($2, email),
                 contact = COALESCE($3, contact),
                 ticket_size_rs = COALESCE($4, ticket_size_rs),
                 stage = COALESCE($5, stage),
                 spv_allocated = COALESCE($6, spv_allocated),
                 notes = COALESCE($7, notes),
                 last_contacted = COALESCE($8, last_contacted)
             WHERE id = $9 AND user_id = $10`,
            [name, email, contact, ticketSizeRs !== undefined && ticketSizeRs !== null ? Number(ticketSizeRs) : null, stage, spvAllocated, notes, lastContacted, itemId, userId]
          );

          // Recalculate partner metrics
          const { rows } = await client.query(
            "SELECT COUNT(*)::int as cnt FROM investors WHERE user_id = $1 AND stage = 'warm'",
            [userId]
          );
          const warmCount = rows[0].cnt || 0;

          await client.query(
            `UPDATE scores SET investor_funnel_warm_count = $1 WHERE user_id = $2`,
            [warmCount, userId]
          );
          await client.query(
            `UPDATE emergency_mode SET investor_funnel_count = $1 WHERE user_id = $2`,
            [warmCount, userId]
          );
        } else {
          const inv = fallbackState.investors.find((x: any) => x.id === itemId);
          if (inv) {
            if (name !== undefined) inv.name = name;
            if (email !== undefined) inv.email = email;
            if (contact !== undefined) inv.contact = contact;
            if (ticketSizeRs !== undefined) inv.ticketSizeRs = Number(ticketSizeRs);
            if (stage !== undefined) inv.stage = stage;
            if (spvAllocated !== undefined) inv.spvAllocated = spvAllocated;
            if (notes !== undefined) inv.notes = notes;
            if (lastContacted !== undefined) inv.lastContacted = lastContacted;

            const warmCount = fallbackState.investors.filter((x: any) => x.stage === "warm").length;
            fallbackState.partnerScore.metrics.investorFunnelWarmCount = warmCount;
            fallbackState.emergencyMode.criticalKpis.investorFunnelCount = warmCount;
          } else {
            throw new Error("Investor not found in offline state.");
          }
        }
      });

      await logAuditEvent(userId, req.user!.email, `UPDATE_INVESTOR_${itemId}`, "INVESTORS");
      res.json({ status: "success" });
    } catch (error) {
      next(error);
    }
  }
);

// Log Investor Interaction
app.post(
  "/api/investors/:id/log",
  requireAuth,
  requireRole(["Chairman", "Admin"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const itemId = req.params.id;
      const userId = req.user!.id;
      const { type, summary } = req.body; // type: 'call' | 'meeting' | 'email' | 'dispatched_docs'

      if (!type) {
        res.status(400).json({ error: "Interaction type is required." });
        return;
      }

      const dateStr = "June 2, 2026";
      let logPrefix = "";
      if (type === "call") logPrefix = `[📞 Call logged - ${dateStr}]`;
      else if (type === "meeting") logPrefix = `[🤝 Meeting logged - ${dateStr}]`;
      else if (type === "email") logPrefix = `[📧 Sent Email - ${dateStr}]`;
      else if (type === "dispatched_docs") logPrefix = `[📄 Pack Sent - ${dateStr}]`;
      else logPrefix = `[🪵 Action logged - ${dateStr}]`;

      const appendMessage = `${logPrefix} ${summary || "No specific feedback recorded."}`;

      await dbWriteOperation(userId, async (client, fallbackState) => {
        if (client) {
          const invQuery = await client.query("SELECT notes FROM investors WHERE id = $1 AND user_id = $2", [itemId, userId]);
          let existingNotes = "";
          if (invQuery.rowCount && invQuery.rowCount > 0) {
            existingNotes = invQuery.rows[0].notes || "";
          }

          const newNotes = existingNotes 
            ? `${appendMessage}\n\n${existingNotes}`
            : appendMessage;

          await client.query(
            `UPDATE investors 
             SET notes = $1, last_contacted = $2
             WHERE id = $3 AND user_id = $4`,
            [newNotes, dateStr, itemId, userId]
          );
        } else {
          const inv = fallbackState.investors.find((x: any) => x.id === itemId);
          if (inv) {
            inv.notes = inv.notes 
              ? `${appendMessage}\n\n${inv.notes}`
              : appendMessage;
            inv.lastContacted = dateStr;
          } else {
            throw new Error("Investor not found in offline state.");
          }
        }
      });

      await logAuditEvent(userId, req.user!.email, `LOG_INTERACTION_INVESTOR_${itemId}`, "INVESTORS");
      res.json({ status: "success", appended: appendMessage, lastContacted: dateStr });
    } catch (error) {
      next(error);
    }
  }
);

// AI Pitch Deck & Communication Sequence Generator with Gemini
app.post(
  "/api/investors/:id/pitch",
  requireAuth,
  requireRole(["Chairman", "Admin"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const itemId = req.params.id;
      const userId = req.user!.id;
      let investor: any = null;

      await dbWriteOperation(userId, async (client, fallbackState) => {
        if (client) {
          const { rows } = await client.query(
            "SELECT * FROM investors WHERE id = $1 AND user_id = $2",
            [itemId, userId]
          );
          if (rows.length > 0) {
            investor = rows[0];
          }
        } else {
          const matched = fallbackState.investors.find((x: any) => x.id === itemId);
          if (matched) {
            investor = {
              name: matched.name,
              email: matched.email,
              contact: matched.contact,
              ticketSizeRs: matched.ticketSizeRs,
              stage: matched.stage,
              spvAllocated: matched.spvAllocated,
              notes: matched.notes,
              lastContacted: matched.lastContacted
            };
          }
        }
      });

      if (!investor) {
        res.status(404).json({ error: "Investor entity not found." });
        return;
      }

      let pitchResult = {
        emailSubject: `FK Group Syndication Overview // Allocation for ${investor.name}`,
        emailBody: `Dear ${investor.name},\n\nWe hope you are doing well. This is Rajeev Kumar, Chairman of FK Group.\n\nFollowing up regarding our syndication round B pipeline. We have noted your target ticket interest. Let's arrange a brief discussion to walk through the SPV and brand metrics.\n\nBest regards,\nRajeev Kumar\nChairman, FK Group`,
        strategyTactics: `Identify key capital gates and execute direct communication.`
      };

      if (ai) {
        try {
          const ticketVal = investor.ticket_size_rs !== undefined ? investor.ticket_size_rs : (investor.ticketSizeRs || 0);
          const formattedTicket = `₹${(Number(ticketVal) / 100000.0).toFixed(1)} Lakhs`;
          const spvVal = investor.spv_allocated || investor.spvAllocated || "Pending";
          const prompt = `
            You are an elite, highly persuasive General Partner & Investor Relations Director at an Indian mid-market hospitality venture capital fund.
            Your client is Rajeev Kumar, Chairman of FK Group, seeking to close a total ₹13.2 Cr syndicated Round B for high-growth Quick Service Restaurant (QSR) expansions (e.g. FK Brands like Mr. Chick'n Master, Pizza, etc.).

            The target investor is:
            Name: ${investor.name}
            Current Pipeline Stage: "${investor.stage}"
            Target/Allocated Ticket Size: ${formattedTicket}
            Assigned/Proposed SPV: "${spvVal}"
            Past interaction history, focus requirements, objections and log notes:
            "${investor.notes || "No historical notes registered."}"

            Evaluate the investor's stage and historic notes. Devise highly tailored materials:
            1. An extremely polished, high-conviction follow-up/re-engagement email. It must speak directly to their previous questions/notes and handle objections with extreme tact. Maintain elite business integrity, professional style, and warm Indian institutional flair.
            2. Strategic Deal Objections/Tactics list detailing:
               - The matching SPV value proposition.
               - 3 powerful, customized conversational bullet points to de-risk their concerns.
               - Next immediate target action.

            Provide your response strictly in JSON fitting the responseSchema.
          `;

          const responseObj = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  emailSubject: { type: Type.STRING },
                  emailBody: { type: Type.STRING },
                  strategyTactics: { type: Type.STRING }
                },
                required: ["emailSubject", "emailBody", "strategyTactics"]
              }
            }
          });

          if (responseObj && responseObj.text) {
            const parsed = JSON.parse(responseObj.text.trim());
            pitchResult = {
              emailSubject: parsed.emailSubject || pitchResult.emailSubject,
              emailBody: parsed.emailBody || pitchResult.emailBody,
              strategyTactics: parsed.strategyTactics || pitchResult.strategyTactics
            };
          }
        } catch (gemErr) {
          console.error("Gemini investor outreach generator failed:", gemErr);
        }
      }

      await logAuditEvent(userId, req.user!.email, `GENERATE_AI_PITCH_INVESTOR_${itemId}`, "INVESTORS");
      res.json({ status: "success", pitch: pitchResult });
    } catch (error) {
      next(error);
    }
  }
);

// Delete Investor record
app.delete(
  "/api/investors/:id",
  requireAuth,
  requireRole(["Chairman", "Admin"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const itemId = req.params.id;
      const userId = req.user!.id;

      await dbWriteOperation(userId, async (client, fallbackState) => {
        if (client) {
          const dlRes = await client.query("DELETE FROM investors WHERE id = $1 AND user_id = $2", [itemId, userId]);
          if (dlRes.rowCount === 0) {
            throw new Error("Investor not found or unauthorized deletion.");
          }
        } else {
          const idx = fallbackState.investors.findIndex((x: any) => x.id === itemId);
          if (idx !== -1) {
            fallbackState.investors.splice(idx, 1);
          } else {
            throw new Error("Investor not found");
          }
        }
      });

      await logAuditEvent(userId, req.user!.email, `DELETE_INVESTOR_${itemId}`, "INVESTORS");
      res.json({ status: "success" });
    } catch (error) {
      next(error);
    }
  }
);

// Brand comparison update or insertion
app.post(
  "/api/brands",
  requireAuth,
  requireRole(["Chairman", "Admin", "Partner"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const parseResult = BrandSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.issues[0].message });
        return;
      }

      const {
        name,
        type,
        outletsCountTarget,
        outletsCountActual,
        appUsersTarget,
        appUsersActual,
        commissionPct,
        mrrActual,
      } = parseResult.data;
      const userId = req.user!.id;

      await dbWriteOperation(userId, async (client, fallbackState) => {
        const isTriggerMet = (mrrActual || 0) >= 1000000;

        if (client) {
          // Check if brand exists by matching name
          const exists = await client.query(
            "SELECT id FROM brands WHERE LOWER(name) = LOWER($1) AND user_id = $2",
            [name, userId]
          );

          if (exists.rowCount && exists.rowCount > 0) {
            const id = exists.rows[0].id;
            await client.query(
              `UPDATE brands 
               SET type = COALESCE($1, type),
                   outlets_count_target = COALESCE($2, outlets_count_target),
                   outlets_count_actual = COALESCE($3, outlets_count_actual),
                   app_users_target = COALESCE($4, app_users_target),
                   app_users_actual = COALESCE($5, app_users_actual),
                   commission_pct = COALESCE($6, commission_pct),
                   mrr_actual = COALESCE($7, mrr_actual),
                   is_trigger_met = $8
               WHERE id = $9 AND user_id = $10`,
              [
                type,
                outletsCountTarget,
                outletsCountActual,
                appUsersTarget,
                appUsersActual,
                commissionPct,
                mrrActual,
                isTriggerMet,
                id,
                userId,
              ]
            );
          } else {
            const id = "b-" + Date.now();
            await client.query(
              `INSERT INTO brands (id, user_id, name, type, outlets_count_target, outlets_count_actual, app_users_target, app_users_actual, commission_pct, mrr_actual, is_trigger_met)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                id,
                userId,
                name,
                type,
                outletsCountTarget || 100,
                outletsCountActual || 0,
                appUsersTarget || 50000,
                appUsersActual || 0,
                commissionPct || 6,
                mrrActual || 0,
                isTriggerMet,
              ]
            );
          }

          // Recalculate outlet counts metrics
          const { rows } = await client.query(
            "SELECT SUM(outlets_count_actual)::int as total FROM brands WHERE user_id = $1",
            [userId]
          );
          const tOutlets = rows[0].total || 0;
          await client.query(
            "UPDATE scores SET foco_outlets_count = $1 WHERE user_id = $2",
            [tOutlets, userId]
          );
        } else {
          const existing = fallbackState.brands.find((x: any) => x.name.toLowerCase() === name.toLowerCase());
          if (existing) {
            if (type !== undefined) existing.type = type;
            if (outletsCountTarget !== undefined) existing.outletsCountTarget = outletsCountTarget;
            if (outletsCountActual !== undefined) existing.outletsCountActual = outletsCountActual;
            if (appUsersTarget !== undefined) existing.appUsersTarget = appUsersTarget;
            if (appUsersActual !== undefined) existing.appUsersActual = appUsersActual;
            if (commissionPct !== undefined) existing.commissionPct = commissionPct;
            if (mrrActual !== undefined) existing.mrrActual = mrrActual;
            existing.isTriggerMet = isTriggerMet;
          } else {
            fallbackState.brands.push({
              id: "b-" + Date.now(),
              name,
              type: type || "QSR",
              outletsCountTarget: outletsCountTarget || 100,
              outletsCountActual: outletsCountActual || 0,
              appUsersTarget: appUsersTarget || 50000,
              appUsersActual: appUsersActual || 0,
              commissionPct: commissionPct || 6,
              mrrActual: mrrActual || 0,
              isTriggerMet,
            });
          }

          const tOutlets = fallbackState.brands.reduce((acc: number, b: any) => acc + b.outletsCountActual, 0);
          fallbackState.partnerScore.metrics.focoOutletsCount = tOutlets;
        }
      });

      await logAuditEvent(userId, req.user!.email, `UPDATE_BRAND_${name.toUpperCase()}`, "BRANDS");
      res.json({ status: "success" });
    } catch (error) {
      next(error);
    }
  }
);

// Readiness Scanner additions
app.post(
  "/api/readiness-scans/trigger",
  requireAuth,
  requireRole(["Chairman", "Admin"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const parseResult = ReadinessScanSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.issues[0].message });
        return;
      }

      const { cityName, tier, focoModelStable, npsScore } = parseResult.data;
      const userId = req.user!.id;
      const scanId = "sc-" + Date.now();

      await dbWriteOperation(userId, async (client, fallbackState) => {
        // Readiness logic
        let mrrConditionMet = false;
        if (client) {
          const { rows } = await client.query(
            "SELECT COUNT(*)::int as cnt FROM brands WHERE user_id = $1 AND is_trigger_met = TRUE AND mrr_actual >= 1200000",
            [userId]
          );
          mrrConditionMet = rows[0].cnt > 0;
        } else {
          mrrConditionMet = fallbackState.brands.some((b: any) => b.isTriggerMet && b.mrrActual >= 1200000);
        }

        const stableVal = focoModelStable ?? true;
        const npsVal = npsScore ?? 8.1;
        const isReady = mrrConditionMet && stableVal && npsVal >= 8.0;

        const recs = [];
        if (!mrrConditionMet) recs.push("Increase local brand app MRR to threshold of ₹12L before triggering rollout");
        if (!stableVal) recs.push("Audit and separate GM or Operations roles in home office before deploy");
        if (npsVal < 8.0) recs.push("Focus on customer success reviews to pull NPS scores above 8.0 threshold");
        if (isReady) {
          recs.push(`Proceed directly with franchise negotiations in ${cityName}`);
          recs.push("Lock 3 franchise partners and protect existing cash reserves");
        }

        if (client) {
          await client.query("DELETE FROM readiness_scans WHERE LOWER(city_name) = LOWER($1) AND user_id = $2", [cityName, userId]);
          await client.query(
            `INSERT INTO readiness_scans (id, user_id, city_name, tier, mrr_condition_met, foco_model_stable, nps_score, ready_to_deploy, recommendations)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [scanId, userId, cityName, tier || 1, mrrConditionMet, stableVal, npsVal, isReady, recs]
          );
        } else {
          const existingIndex = fallbackState.readinessScans.findIndex((s: any) => s.cityName.toLowerCase() === cityName.toLowerCase());
          const scanResult = {
            id: scanId,
            cityName,
            tier: tier || 1,
            mrrConditionMet,
            focoModelStable: stableVal,
            npsScore: npsVal,
            readyToDeploy: isReady,
            recommendations: recs,
          };
          if (existingIndex !== -1) {
            fallbackState.readinessScans[existingIndex] = scanResult;
          } else {
            fallbackState.readinessScans.push(scanResult);
          }
        }
      });

      await logAuditEvent(userId, req.user!.email, `TRIGGER_READINESS_SCAN_${cityName.toUpperCase()}`, "SCANNER");
      res.json({ status: "success" });
    } catch (error) {
      next(error);
    }
  }
);

// Helper to perform cosine similarity calculation between two float arrays
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Self-healing embeddings function to ensure pre-existing documents have vectors
async function ensureAllEmbeddings(docs: any[], userId: number, aiClient: any) {
  if (!aiClient) return;
  for (const doc of docs) {
    if (!doc.embedding || doc.embedding.length === 0) {
      try {
        console.log(`[RAG Self-Healing] Computing embedding for document "${doc.title}"...`);
        const embRes: any = await aiClient.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: `${doc.title} ${doc.summary || ""} ${doc.content}`,
        });
        const embObj = embRes?.embedding || (embRes?.embeddings && embRes.embeddings[0]) || embRes?.embeddings;
        const vals = embObj?.values;
        if (vals && vals.length > 0) {
          doc.embedding = vals;
          await dbWriteOperation(userId, async (client, fallbackState) => {
            if (client) {
              await client.query(
                "UPDATE knowledge_docs SET embedding = $1 WHERE id = $2 AND user_id = $3",
                [vals, doc.id, userId]
              );
            } else if (fallbackState && fallbackState.knowledgeDocs) {
              const fdoc = fallbackState.knowledgeDocs.find((x: any) => x.id === doc.id);
              if (fdoc) fdoc.embedding = vals;
            }
          });
          console.log(`[RAG Self-Healing] Saved embedding for "${doc.title}"`);
        }
      } catch (err) {
        console.error(`[RAG Self-Healing] Failed for "${doc.title}":`, err);
      }
    }
  }
}

// Offline keyword search matching helper
function fallbackWordMatching(docs: any[], query: string) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (queryWords.length === 0) {
    return docs.map(d => ({
      id: d.id,
      title: d.title,
      category: d.category,
      similarity: 0.5,
      summary: d.summary
    }));
  }

  const matches = docs.map(doc => {
    let matchesCount = 0;
    const textToSearch = `${doc.title} ${doc.summary} ${doc.content}`.toLowerCase();
    for (const word of queryWords) {
      if (textToSearch.includes(word)) {
        matchesCount++;
      }
    }
    const score = matchesCount / queryWords.length;
    return {
      id: doc.id,
      title: doc.title,
      category: doc.category,
      similarity: Number(score.toFixed(3)),
      summary: doc.summary,
    };
  });

  return matches.sort((a, b) => b.similarity - a.similarity);
}

// Knowledge Docs CRUD SOP details with vector embedding generation
app.post(
  "/api/knowledge-brain",
  requireAuth,
  requireRole(["Chairman", "Admin"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const parseResult = KnowledgeDocSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.issues[0].message });
        return;
      }

      const { title, category, summary, content } = parseResult.data;
      const itemId = "kd-" + Date.now();
      const userId = req.user!.id;

      // Generate embedding for document content
      let embedding: number[] | null = null;
      if (ai) {
        try {
          const embRes: any = await ai.models.embedContent({
            model: "gemini-embedding-2-preview",
            contents: `${title} ${summary || ""} ${content}`,
          });
          const embObj = embRes?.embedding || (embRes?.embeddings && embRes.embeddings[0]) || embRes?.embeddings;
          embedding = embObj?.values || null;
        } catch (err) {
          console.warn("Failed to generate embedding during document creation:", err);
        }
      }

      await dbWriteOperation(userId, async (client, fallbackState) => {
        if (client) {
          await client.query(
            `INSERT INTO knowledge_docs (id, user_id, title, category, summary, content, embedding)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [itemId, userId, title, category, summary || "Knowledge SOP", content, embedding]
          );
        } else {
          fallbackState.knowledgeDocs.push({
            id: itemId,
            title,
            category,
            summary: summary || "Knowledge SOP",
            content,
            embedding: embedding || undefined,
          });
        }
      });

      await logAuditEvent(userId, req.user!.email, "ADD_KNOWLEDGE_DOC", "KNOWLEDGE");
      res.json({ status: "success", itemId });
    } catch (error) {
      next(error);
    }
  }
);

// Vector Search & RAG Query Endpoint
app.post(
  "/api/knowledge-brain/query",
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== "string") {
        res.status(400).json({ error: "Query parameter must be a non-empty string" });
        return;
      }

      const userId = req.user!.id;
      const cachedState = await getCombinedDatabaseState(userId);
      const docs = cachedState.knowledgeDocs || [];

      let answerText = "";
      let matchedSources: { id: string; title: string; category: string; similarity: number; summary: string }[] = [];

      if (ai) {
        // Step A: Ensure all active docs have embeddings generated (Self-Healing)
        await ensureAllEmbeddings(docs, userId, ai);

        // Step B: Generate embedding for search query
        let queryEmbedding: number[] | null = null;
        try {
          const qEmbRes: any = await ai.models.embedContent({
            model: "gemini-embedding-2-preview",
            contents: query,
          });
          const embObj = qEmbRes?.embedding || (qEmbRes?.embeddings && qEmbRes.embeddings[0]) || qEmbRes?.embeddings;
          queryEmbedding = embObj?.values || null;
        } catch (err) {
          console.error("Failed to generate query embedding:", err);
        }

        if (queryEmbedding) {
          // Step C: Compute cosine similarities
          for (const doc of docs) {
            if (doc.embedding && doc.embedding.length > 0) {
              const score = cosineSimilarity(queryEmbedding, doc.embedding);
              matchedSources.push({
                id: doc.id,
                title: doc.title,
                category: doc.category,
                similarity: Number(score.toFixed(4)),
                summary: doc.summary,
              });
            }
          }

          // Sort by descending similarity
          matchedSources.sort((a, b) => b.similarity - a.similarity);
        } else {
          // Fallback to text matching if query embed failed
          matchedSources = fallbackWordMatching(docs, query);
        }

        // Step D: Filter top 3 matched documents for context grounding
        const topDocs = matchedSources.slice(0, 3).filter(s => s.similarity > 0.15 || !queryEmbedding);

        const contextText = topDocs.length > 0
          ? topDocs
              .map(s => {
                const docObj = docs.find(d => d.id === s.id);
                return `[SOP Title: ${s.title}] (Category: ${s.category}):\nSummary: ${s.summary}\nFull Content: ${docObj?.content || ""}`;
              })
              .join("\n\n---\n\n")
          : "No relevant corporate documents found in the database State.";

        // Step E: Call Gemini using 3.5-flash with the ground context
        try {
          const promptContext = `
            You are the "FK Group Strategy Engine" answering a tactical operational inquiry from the Chairman.
            
            Based ONLY on the retrieved corporate volumes, rules, and SOP documents matches below, formulate a grounded, high-fidelity response.
            Do not make up facts. If the information isn't in the provided context, clearly indicate that based on stored SOPs, we cannot verify the instruction, but formulate advice derived from standard FK core values.
            
            Retrieved Context:
            ${contextText}
            
            Chairman's Inquiry: "${query}"
            
            Draft a professional, authoritative, and direct response. Use bold points and styled markup. Keep formatting strictly secure and avoid MD code fence wraps.
          `;

          const generateRes = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: promptContext,
            config: {
              temperature: 0.3,
            },
          });

          answerText = generateRes.text || "No strategy generated.";
        } catch (genErr) {
          console.error("RAG generative phase failed:", genErr);
          answerText = `Failed to synthesize generative answer. However, retrieved matched records are attached.`;
        }
      } else {
        // Offline / Unlicensed Local Matching
        matchedSources = fallbackWordMatching(docs, query);
        const topDocs = matchedSources.slice(0, 3);
        
        if (topDocs.length > 0) {
          answerText = `<strong>FK Knowledge Search (Offline Companion Mode):</strong><br><br>We found highly relevant offline SOP matches in your system storage regarding "${query}":<br><br>` + 
            topDocs.map(s => {
              const fullDoc = docs.find(d => d.id === s.id);
              return `• <strong>${s.title}</strong> (${s.category})<br><em>Summary:</em> ${s.summary}<br><em>Content:</em> ${fullDoc?.content || ""}`;
            }).join("<br><br>");
        } else {
          answerText = `<strong>FK Knowledge Search (Offline Companion Mode):</strong><br><br>No matching volumes or operational SOP documents were found matching query "${query}". Please define a SOP template and record file.`;
        }
      }

      await logAuditEvent(userId, req.user!.email, `RAG_QUERY_${query.slice(0, 25).toUpperCase()}`, "KNOWLEDGE");
      res.json({
        status: "success",
        answerText,
        matchedSources: matchedSources.slice(0, 5),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Generate Real Secure QR Passport
app.post(
  "/api/passport/generate",
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { partnerName, roles, verifiedLicenses } = req.body;
      if (!partnerName || typeof partnerName !== "string") {
        res.status(400).json({ error: "Partner name is required and must be a string." });
        return;
      }
      if (!Array.isArray(roles) || !Array.isArray(verifiedLicenses)) {
        res.status(400).json({ error: "Roles and verified licenses must be arrays of strings." });
        return;
      }

      const userId = req.user!.id;
      const randomSeq = Math.random().toString(36).substring(2, 8).toUpperCase();
      const currentYear = new Date().getFullYear();
      const securityCode = `FK-PASSPORT-${userId.toString().padStart(4, "0")}-${randomSeq}-VERIFIED-${currentYear}`;
      
      const verificationDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let updatedPassport: any = null;

      await dbWriteOperation(userId, async (client, fallbackState) => {
        if (client) {
          // Verify or update partners table
          const existing = await client.query("SELECT score_history, id FROM partners WHERE user_id = $1", [userId]);
          let scoreHistory = [68, 70, 75, 72, 74];
          let passportId = "8234-92A-" + userId;
          if (existing.rowCount && existing.rowCount > 0) {
            scoreHistory = existing.rows[0].score_history || scoreHistory;
            passportId = existing.rows[0].id || passportId;
          }

          // Insert or update
          await client.query(
            `INSERT INTO partners (id, user_id, partner_name, roles, verification_date, score_history, verified_licenses, security_code)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (user_id) DO UPDATE SET
               partner_name = $3,
               roles = $4,
               verification_date = $5,
               verified_licenses = $7,
               security_code = $8`,
            [passportId, userId, partnerName, roles, verificationDate, scoreHistory, verifiedLicenses, securityCode]
          );

          updatedPassport = {
            partnerId: passportId,
            partnerName,
            roles,
            verificationDate,
            scoreHistory,
            verifiedLicenses,
            securityCode,
          };
        } else {
          // Mock/Fallback database state
          if (!fallbackState.qrPassport) {
            fallbackState.qrPassport = {};
          }
          const defaultScoreHistory = [68, 70, 75, 72, 74];
          fallbackState.qrPassport = {
            partnerId: fallbackState.qrPassport.partnerId || ("8234-92A-" + userId),
            partnerName,
            roles,
            verificationDate,
            scoreHistory: fallbackState.qrPassport.scoreHistory || defaultScoreHistory,
            verifiedLicenses,
            securityCode,
          };
          updatedPassport = fallbackState.qrPassport;
          return fallbackState;
        }
      });

      await logAuditEvent(userId, req.user!.email, `GENERATE_PASSPORT_${securityCode}`, "PASSPORT");

      res.json({
        status: "success",
        message: "Secure QR Passport generated successfully.",
        passport: updatedPassport,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Verify any QR Passport (can be accessed publicly or authenticated)
app.post(
  "/api/passport/verify",
  async (req, res, next) => {
    try {
      const { securityCode } = req.body;
      if (!securityCode || typeof securityCode !== "string") {
        res.status(400).json({ error: "Security code parameter is required and must be a string." });
        return;
      }

      const trimmedCode = securityCode.trim();

      // PostgreSQL lookup
      if (typeof isPostgresActive !== "undefined" && isPostgresActive && pool) {
        const query = `
          SELECT 
            p.id as partner_id, p.partner_name, p.roles, p.verification_date, p.score_history, p.verified_licenses, p.security_code,
            s.overall_score, s.trend, s.revenue_mrr, s.cash_runway_months, s.foco_outlets_count, s.app_mrr
          FROM partners p
          LEFT JOIN scores s ON p.user_id = s.user_id
          WHERE TRIM(p.security_code) = $1
        `;
        const result = await pool.query(query, [trimmedCode]);
        if (result.rowCount && result.rowCount > 0) {
          const row = result.rows[0];
          res.json({
            status: "success",
            valid: true,
            passport: {
              partnerId: row.partner_id,
              partnerName: row.partner_name,
              roles: row.roles,
              verificationDate: row.verification_date,
              scoreHistory: row.score_history,
              verifiedLicenses: row.verified_licenses,
              securityCode: row.security_code,
            },
            score: {
              overallScore: Number(row.overall_score || 0),
              trend: row.trend || "neutral",
              metrics: {
                revenueMRR: Number(row.revenue_mrr || 0),
                cashRunwayMonths: Number(row.cash_runway_months || 0),
                focoOutletsCount: Number(row.foco_outlets_count || 0),
                appMRR: Number(row.app_mrr || 0),
              }
            }
          });
          return;
        }
      } else {
        // Fallback directory search lookup
        const FALLBACK_DIR = path.join(process.cwd(), "data");
        if (fs.existsSync(FALLBACK_DIR)) {
          const files = fs.readdirSync(FALLBACK_DIR);
          for (const file of files) {
            if (file.endsWith("_db.json")) {
              try {
                const filePath = path.join(FALLBACK_DIR, file);
                const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
                if (content.qrPassport && content.qrPassport.securityCode === trimmedCode) {
                  res.json({
                    status: "success",
                    valid: true,
                    passport: content.qrPassport,
                    score: content.partnerScore || { overallScore: 72, trend: "neutral", metrics: {} }
                  });
                  return;
                }
              } catch (err) {
                console.error("Failed reading fallback file in passport public verification", err);
              }
            }
          }
        }
      }

      // No match found
      res.status(200).json({
        status: "success",
        valid: false,
        error: "Passport signature validation failed. Access code is invalid or expired.",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update War Room tactical battle plans
app.post(
  "/api/war-room/sessions",
  requireAuth,
  requireRole(["Chairman", "Admin"]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const parseResult = WarRoomSessionSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.issues[0].message });
        return;
      }

      const { title, battlePlan, adversaries, allies } = parseResult.data;
      const userId = req.user!.id;

      await dbWriteOperation(userId, async (client, fallbackState) => {
        if (client) {
          const sessions = await client.query(
            "SELECT session_id FROM war_room_sessions WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
          );

          if (sessions.rowCount && sessions.rowCount > 0) {
            const sessId = sessions.rows[0].session_id;
            await client.query(
              `UPDATE war_room_sessions 
               SET title = COALESCE($1, title),
                   battle_plan = COALESCE($2, battle_plan),
                   adversaries = COALESCE($3, adversaries),
                   allies = COALESCE($4, allies)
               WHERE session_id = $5`,
              [title, battlePlan, adversaries, allies, sessId]
            );
          } else {
            const sessId = "wrs-" + Date.now();
            await client.query(
              `INSERT INTO war_room_sessions (session_id, user_id, title, battle_plan, adversaries, allies, advisor_logs)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [sessId, userId, title || "Operation Ingress Delta", battlePlan || [], adversaries || [], allies || [], ["Session initiated."]]
            );
          }
        } else {
          const wrsArr = fallbackState.warRoomSessions;
          if (wrsArr.length > 0) {
            const first = wrsArr[0];
            if (title) first.title = title;
            if (battlePlan) first.battlePlan = battlePlan;
            if (adversaries) first.adversaries = adversaries;
            if (allies) first.allies = allies;
          } else {
            wrsArr.push({
              sessionId: "wrs-" + Date.now(),
              createdAt: new Date().toISOString(),
              status: "active",
              title: title || "Operation Ingress Delta",
              battlePlan: battlePlan || [],
              adversaries: adversaries || [],
              allies: allies || [],
              advisorLogs: ["Session initiated."],
            });
          }
        }
      });

      await logAuditEvent(userId, req.user!.email, "UPDATE_WAR_ROOM_TACTICS", "WAR_ROOM");
      res.json({ status: "success" });
    } catch (error) {
      next(error);
    }
  }
);

// 1. AI CHAIRMAN ADVISOR (Chat system context, isolated messages logic)
app.post("/api/chat", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const parseResult = ChatSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const { prompt } = parseResult.data;
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    // Record user message
    const userMsgId = "msg-" + Date.now() + "-u";
    await dbWriteOperation(userId, async (client, fallbackState) => {
      if (client) {
        await client.query(
          "INSERT INTO messages (id, user_id, sender, text, timestamp) VALUES ($1, $2, $3, $4, NOW())",
          [userMsgId, userId, "user", prompt]
        );
      } else {
        fallbackState.messages.push({
          id: userMsgId,
          sender: "user",
          text: prompt,
          timestamp: new Date().toISOString(),
        });
      }
    });

    const dbState = await getCombinedDatabaseState(userId);

    // Heuristics or AI resolution
    const localResponses: { [key: string]: string } = {
      "am i behind target": `<strong>Yes — and here's the detail:</strong><br><br>Revenue MRR is ₹31.4L against your ₹38L June target. That's 17% behind. The gap is primarily from delayed FOCO outlet performance (2 underperforming) and stalled investor close pushing available capex.<br><br>You have 28 days to close. This is recoverable — but requires you to prioritise investor calls over everything else this week.`,
      "where am i wasting time": `<strong>Three clear patterns in the last 30 days:</strong><br><br>1. Operations review meetings consuming 6+ hrs/week — these belong to your GM, not the Chairman.<br>2. Unstructured WhatsApp decision-making instead of structured sessions.<br>3. Reactive investor conversations without a prepared brief.<br><br>Reclaim these hours. You need to be 80% strategic, 20% operational. Right now you're inverted.`,
      "most urgent decision": `<strong>Two decisions that cannot wait:</strong><br><br><strong>1. Investor deck to Arvind Capital</strong> — delayed 4 times. Every week of delay costs you leverage in the Round B negotiation.<br><br><strong>2. Acquisition LOI for Target #3</strong> — window closes this week. If you miss this, the target goes to a competitor who has been circling.<br><br>Everything else can wait 48 hours. These cannot.`,
      "i am confused": `<strong>I understand. Let me diagnose this clearly.</strong><br><br><strong>Root problem:</strong> You are running at execution speed but need to shift to ownership speed. The confusion is a signal of strategic strategic overload.<br><br><strong>Business problem:</strong> Too many parallel priorities without a clear decision hierarchy.<br><br><strong>Next 2 hours:</strong><br>1. Close laptop. Take 20 minutes offline. Write your 3 non-negotiables for this week on paper.<br>2. Return and execute only those 3 things today.<br><br><strong>Do not:</strong> Reply to any messages or join any unscheduled calls in the next 2 hours.`,
    };

    let answerText = "";
    const queryLower = prompt.toLowerCase();
    for (const [key, response] of Object.entries(localResponses)) {
      if (queryLower.includes(key) || key.includes(queryLower)) {
        answerText = response;
        break;
      }
    }

    if (!answerText) {
      if (ai) {
        try {
          const docContext = dbState.knowledgeDocs
            .map((kd: any) => `[${kd.title}] (${kd.category}): ${kd.content}`)
            .join("\n\n");

          const promptContext = `
            You are the "AI Chairman Advisor" of FK Holdings. You are the continuous business companion to the Chairman of FK Holdings on a strict path to complete the ₹1,100 Crore ecosystem plan (2026-2030).
            
            Here is your knowledge context of the Corporate Volumes & Operating Rules:
            ${docContext}
            
            Current Executive Metrics:
            - Overall Executive Score: ${dbState.partnerScore.overallScore}/100
            - Revenue MRR: ₹${(dbState.partnerScore.metrics.revenueMRR / 100000.0).toFixed(1)}L
            - Cash Runway: ${dbState.partnerScore.metrics.cashRunwayMonths} months
            - FOCO Outlets count: ${dbState.partnerScore.metrics.focoOutletsCount}
            - App MRR: ₹${(dbState.partnerScore.metrics.appMRR / 100000.0).toFixed(1)}L
            
            Provide a highly strategic, professional, and motivational executive response. Write concisely. Be supportive but direct, focusing purely on strategy, asset-light expansion, maintaining IP lock, and eliminating operational distractions. Render your reply in clean, secure formatting with strong markup elements where helpful, without using MD block fences.
            
            Chairman's Query: "${prompt}"
          `;

          const responseObj = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: promptContext,
            config: {
              temperature: 0.7,
            },
          });

          answerText = responseObj.text || "I was unable to structure a strategic output. Please re-engage.";
        } catch (err: any) {
          console.error("Gemini failed in chat route:", err);
          answerText = `<strong>Strategic Processing Fallback:</strong><br><br>Analyzing "${prompt}" against target matrices... Based on the FK 2030 blueprint, we advise focusing entirely on enclosing target investments, mitigating FOCO operations confusion, and delegating detail-level meetings to your GM immediately so that strategic Round B closure remains unblocked.`;
        }
      } else {
        answerText = `<strong>FK Operating Heuristics companion (Offline Mode):</strong><br><br>To hit our target of 400 FOCO outlets and protect EBITDA runway, you must stay focused on the Chairman Operating Layer. Delegate operations detail meetings to your GM immediately and focus on the Arvind Capital deck.`;
      }
    }

    const aiMsgId = "msg-" + Date.now() + "-ai";
    await dbWriteOperation(userId, async (client, fallbackState) => {
      if (client) {
        await client.query(
          "INSERT INTO messages (id, user_id, sender, text, timestamp) VALUES ($1, $2, $3, $4, NOW())",
          [aiMsgId, userId, "ai", answerText]
        );
      } else {
        fallbackState.messages.push({
          id: aiMsgId,
          sender: "ai",
          text: answerText,
          timestamp: new Date().toISOString(),
        });
      }
    });

    await logAuditEvent(userId, userEmail, "AI_ADVISOR_CHAT_TX", "AI_ADVISOR");
    res.json({
      userMessage: { id: userMsgId, sender: "user", text: prompt, timestamp: new Date().toISOString() },
      aiMessage: { id: aiMsgId, sender: "ai", text: answerText, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// 2. DAILY CEO BRIEFING GENERATOR (AI-Powered, isolated context)
app.post("/api/ceo-briefing/generate", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const dbState = await getCombinedDatabaseState(userId);
    const briefId = "br-" + Date.now();
    const dateStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    if (ai) {
      try {
        const dbKpis = `
          MRR: ₹${(dbState.partnerScore.metrics.revenueMRR / 100000.0).toFixed(1)}L
          Runway: ${dbState.partnerScore.metrics.cashRunwayMonths} months
          Outlets Count: ${dbState.partnerScore.metrics.focoOutletsCount}
          App MRR: ₹${(dbState.partnerScore.metrics.appMRR / 100000.0).toFixed(1)}L
          Overdue Commitments Count: ${dbState.accountabilityCommitments.filter((c: any) => c.status === "overdue").length}
        `;

        const promptStr = `
          You are the FK Corporate Briefing Engine. Based on these live KPIs:
          ${dbKpis}
          
          Generate the continuous Daily CEO Briefing for the Chairman. Return a JSON structure matching the following schemas. Do not use markdown backticks, return only raw JSON content:
          {
            "todayMission": "Summary task of the day",
            "biggestRisk": "Immediate critical threat",
            "biggestOpportunity": "Strategic upside to grasp",
            "whatToIgnore": "Operational noise or distraction to delegate",
            "topActions": [
              { "id": "ta-1", "text": "Action description", "expectedImpact": "Benefit description" },
              { "id": "ta-2", "text": "Action description", "expectedImpact": "Benefit description" }
            ]
          }
        `;

        const responseObj = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: promptStr,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                todayMission: { type: Type.STRING },
                biggestRisk: { type: Type.STRING },
                biggestOpportunity: { type: Type.STRING },
                whatToIgnore: { type: Type.STRING },
                topActions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      expectedImpact: { type: Type.STRING },
                    },
                    required: ["id", "text", "expectedImpact"],
                  },
                },
              },
              required: ["todayMission", "biggestRisk", "biggestOpportunity", "whatToIgnore", "topActions"],
            },
          },
        });

        const parsedBrief = JSON.parse(responseObj.text || "{}");

        await dbWriteOperation(userId, async (client, fallbackState) => {
          if (client) {
            await client.query(
              `INSERT INTO ceo_briefings (id, user_id, date, today_mission, biggest_risk, biggest_opportunity, what_to_ignore, top_actions)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                briefId,
                userId,
                dateStr,
                parsedBrief.todayMission,
                parsedBrief.biggestRisk,
                parsedBrief.biggestOpportunity,
                parsedBrief.whatToIgnore,
                JSON.stringify(parsedBrief.topActions),
              ]
            );
          } else {
            fallbackState.ceoBriefings.unshift({
              date: dateStr,
              ...parsedBrief,
            });
          }
        });

        await logAuditEvent(userId, req.user!.email, "GENERATE_AI_CEO_BRIEFING", "REPORTS");
        res.json({ status: "success", briefing: parsedBrief });
        return;
      } catch (err) {
        console.error("Failed to generate AI ceo briefing, falling back...", err);
      }
    }

    // Default offline briefing fallback
    const fallbackBrief = {
      todayMission: "Close Round B syndicate leads and execute Arvind deck.",
      biggestRisk: "Procrastination on critical investor correspondence costing leverage.",
      biggestOpportunity: "Expansion triggers have officially been cleared with MRR above target.",
      whatToIgnore: "General retail outlet operational reviews. Outsource entirely to GM.",
      topActions: [
        { id: "ta-1", text: "Investor call — Dinesh Mehta", expectedImpact: "Warm commitment close within 2 weeks." },
        { id: "ta-2", text: "Lock candidate shortlist for COO role", expectedImpact: "Delegates operations to allow strategic focus." },
      ],
    };

    await dbWriteOperation(userId, async (client, fallbackState) => {
      if (client) {
        await client.query(
          `INSERT INTO ceo_briefings (id, user_id, date, today_mission, biggest_risk, biggest_opportunity, what_to_ignore, top_actions)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            briefId,
            userId,
            dateStr,
            fallbackBrief.todayMission,
            fallbackBrief.biggestRisk,
            fallbackBrief.biggestOpportunity,
            fallbackBrief.whatToIgnore,
            JSON.stringify(fallbackBrief.topActions),
          ]
        );
      } else {
        fallbackState.ceoBriefings.unshift({
          date: dateStr,
          ...fallbackBrief,
        });
      }
    });

    await logAuditEvent(userId, req.user!.email, "GENERATE_FALLBACK_CEO_BRIEFING", "REPORTS");
    res.json({ status: "success", briefing: fallbackBrief });
  } catch (error) {
    next(error);
  }
});

// --- CENTRALIZED ERROR HANDLING MIDDLEWARE ---
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Centralized API Error Handler caught:", err);
    res.status(err.status || 500).json({
      error: err.message || "An internal error occurred executing this corporate operation.",
    });
  }
);

// --- STATIC ASSETS & VITE SERVING MIDDLEWARE ---

export default app;

if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);

    // Wildcard route to handle React Router client navigation
    app.get("*", (req, res, next) => {
      // Exclude API routes from wildcard static serve to avoid shadowing auth fails
      if (req.path.startsWith("/api/")) {
        return next();
      }
      vite
        .transformIndexHtml(req.url, fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8"))
        .then((html) => {
          res.status(200).set({ "Content-Type": "text/html" }).end(html);
        })
        .catch(next);
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Development server booted on port ${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Production server booted on port ${PORT}`);
  });
}
