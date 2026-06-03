import pg from "pg";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";

const { Pool } = pg;

// Load environment variables
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/fk_holdings";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

console.log("Database manager loading. Production mode:", IS_PRODUCTION);

// Create the connection pool
export let pool: pg.Pool | null = null;
export let isPostgresActive = false;

try {
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("render.com") || process.env.DATABASE_URL.includes("supabase") || IS_PRODUCTION
        ? { rejectUnauthorized: false }
        : false,
    });
    console.log("PostgreSQL connection pool initialized.");
  } else {
    console.warn("No DATABASE_URL found in env. Falling back to secure file-based multi-user store for robust preview simulation.");
  }
} catch (error) {
  console.error("Failed to initialize PostgreSQL pool:", error);
}

// Ensure local data storage fallback dir exists
const FALLBACK_DIR = path.join(process.cwd(), "data", "users");
if (!fs.existsSync(FALLBACK_DIR)) {
  fs.mkdirSync(FALLBACK_DIR, { recursive: true });
}

// Fallback user store helpers
function getFallbackUserPath(userId: number | string): string {
  return path.join(FALLBACK_DIR, `user_${userId}_db.json`);
}

// Seed data template matching our default corporate system data
const SEED_DATA_TEMPLATE = {
  weeklyBoardItems: [
    {
      id: "wb-1",
      category: "win",
      title: "Chaat Masters MRR hit ₹12.1L",
      description: "Expansion trigger officially met. 8-week sustained performance confirmed. Ready for Pune expansion gate."
    },
    {
      id: "wb-2",
      category: "win",
      title: "Two new FOCO outlets onboarded",
      description: "Outlet #15 and #16 live. Both performing above target in week 1. Strong franchise partner execution."
    },
    {
      id: "wb-3",
      category: "win",
      title: "Dinesh Mehta investor call (positive momentum)",
      description: "Very warm signal. 90% probability on commitment. Close should happen within 2 weeks."
    },
    {
      id: "wb-4",
      category: "fail",
      title: "Arvind Capital investor deck",
      description: "Committed 4 weeks ago. Postponed 4 times. Still not sent. This is blocking Round B close and costing leverage."
    },
    {
      id: "wb-5",
      category: "fail",
      title: "COO shortlist approval",
      description: "Overdue 3 days. Legal and finance teams waiting. Impacts hiring sequencing for Q3."
    },
    {
      id: "wb-6",
      category: "fail",
      title: "FOCO Outlet #14 cash review",
      description: "Third consecutive week skipped. Cash burn continues. Needs franchisee escalation or write-off decision by EOW."
    },
    {
      id: "wb-7",
      category: "risk",
      title: "Cash runway pressure",
      description: "Currently 7.2 months. Every week of investor close delay costs ₹40L in valuation leverage."
    },
    {
      id: "wb-8",
      category: "risk",
      title: "Investor funnel cooling",
      description: "2 conversations went cold this week (were warm). Catalyst Fund needs re-engagement immediately."
    },
    {
      id: "wb-9",
      category: "team",
      title: "GM: Outlet operations solid",
      description: "Strong execution on new outlets. But operations/ops role split is creating confusion. Need clarity on responsibilities."
    },
    {
      id: "wb-10",
      category: "team",
      title: "Finance: Cash tracking excellent",
      description: "Weekly forecasts accurate. P&L analysis solid. Ready for CFO-level work post-growth."
    }
  ],
  weeklyBoardMetrics: {
    juneTargetVsActual: -17,
    accountabilityScore: 48,
    weeklyTrend: "down",
    mrrTargetGap: "Gap: ₹6.6L MRR | Investor delay impact"
  },
  actionPlanItems: [
    {
      id: "ap-1",
      day: "Monday",
      title: "Send Arvind Capital deck + schedule follow-up call",
      description: "Non-negotiable. This must happen today EOD. Will unlock momentum.",
      completed: false
    },
    {
      id: "ap-2",
      day: "Tuesday",
      title: "FOCO Outlet #14 escalation call with franchisee",
      description: "Diagnose root cause. Decide: fix with support plan, or write off by Friday.",
      completed: false
    },
    {
      id: "ap-3",
      day: "Wednesday",
      title: "Approve Acquisition LOI #1 + COO shortlist",
      description: "Clear blockers. Unlock legal + hiring processes. Move momentum forward.",
      completed: false
    }
  ],
  emergencyMode: {
    isActivated: true,
    activatedAt: "2026-06-02T07:02:14Z",
    reason: "Multiple KPIs have crossed critical thresholds. This is a 72-hour recovery window. Everything else is secondary.",
    criticalKpis: {
      runwayMonths: 6.1,
      revenueGapPct: -12,
      investorFunnelCount: 2
    },
    recoveryPlan: [
      {
        phase: "HOUR 0-24 (Monday-Tuesday)",
        hours: "0-24",
        tasks: [
          "Send Arvind Capital deck + schedule call (Mon EOD)",
          "Emergency call with FOCO #14 franchisee (Tue AM)",
          "Approve Acquisition LOI #1 (Tue PM)"
        ]
      },
      {
        phase: "HOUR 24-48 (Tuesday-Wednesday)",
        hours: "24-48",
        tasks: [
          "Dinesh Mehta investor call (re-confirm close)",
          "FOCO #14 decision: fix with support plan or write off",
          "Communicate timeline to board and team"
        ]
      },
      {
        phase: "HOUR 48-72 (Wednesday-Thursday)",
        hours: "48-72",
        tasks: [
          "Mid-week board review (assess recovery progress)",
          "Lock Q3 hiring plan (give team clarity and confidence)",
          "Identify and retain any at-risk team departures"
        ]
      }
    ],
    actionsToTake: [
      { text: "Block 12 hours for investor work this week", isDo: true },
      { text: "Make FOCO #14 decision by Wednesday EOD", isDo: true },
      { text: "Delegate all operations to GM immediately", isDo: true },
      { text: "Pause new initiatives until cash is secure", isDo: true },
      { text: "Do NOT take on new projects this week", isDo: false },
      { text: "Do NOT approve new hires (except critical)", isDo: false },
      { text: "Do NOT travel or take time off", isDo: false }
    ],
    rootCauseAnalysis: {
      primary: "Investor close delay is compounding all three KPI failures. The cascade is: investor anxiety → procrastination → deck not sent → valuation leverage lost → cash runway pressure → team uncertainty → execution slowdown.",
      secondary: "FOCO outlet #14 cash burn continues unchecked. Acquisition LOI blocker creating team stall.",
      tertiary: "Operations work consuming time that should be reserved for investor conversations.",
      systemFix: "After you exit Emergency Mode, implement 'Investor Tuesday/Thursday' — 2-hour blocks on these days that nothing can preempt. This prevents the procrastination → cascade → emergency cycle."
    }
  },
  accountabilityCommitments: [
    {
      id: "c-1",
      title: "Arvind Capital investor deck",
      status: "overdue",
      committedDaysOverdue: 9,
      committedDate: "May 28",
      dueDate: "May 31",
      impact: "Breaking Round B close. Every week of delay costs ₹40L in valuation leverage."
    },
    {
      id: "c-2",
      title: "COO shortlist approval",
      status: "overdue",
      committedDaysOverdue: 3,
      committedDate: "May 30",
      dueDate: "June 5",
      impact: "4 candidates waiting. Legal team blocked on hiring process. Cascades into Q3 organizational plan."
    },
    {
      id: "c-3",
      title: "Acquisition LOI #1 final approval",
      status: "due-soon",
      committedDaysOverdue: 2,
      committedDate: "June 1",
      dueDate: "June 6",
      impact: "Legal needs your final input. Deal window closes this week."
    },
    {
      id: "c-4",
      title: "FOCO Outlet #14 cash burn resolution",
      status: "due-soon",
      committedDaysOverdue: 21,
      committedDate: "May 12",
      dueDate: "May 20",
      impact: "Consuming 8 hrs/week of your time in crisis management. Needs fix-or-fold decision by Wednesday."
    }
  ],
  decisionLogItems: [
    {
      id: "dl-1",
      title: "Expansion to Pune — Go or No-Go",
      date: "June 2, 2026",
      context: "Chaat Masters MRR hit ₹12.1L (expansion trigger). FOCO model stable. Brand NPS 8.2. Question: Should we expand to Pune in Q3?",
      outcome: "Decision: YES, proceed with franchise-led model. Identify 3 franchisee partners by June 15. Announcement by June 30. Capital protected through franchise model, not company-owned outlets.",
      status: "successful"
    },
    {
      id: "dl-2",
      title: "FOCO Outlet #14 — Fix or Fold",
      date: "June 5, 2026 (pending)",
      context: "Outlet #14 in cash burn for 3 weeks. Question: Do we fix this outlet with a support plan, or write it off and reallocate capital?",
      outcome: "Pending decision. Emergency call with franchisee scheduled for June 5. Based on conversation, decide on support plan or exit by June 6 EOD.",
      status: "in-progress"
    },
    {
      id: "dl-3",
      title: "Acquisition Target #1 — LOI Approval",
      date: "June 6, 2026 (pending)",
      context: "Due diligence complete. Legal draft ready. Question: Do we move forward with LOI signature, or pass on this target?",
      outcome: "Pending your final approval. Strategic fit strong, financials solid, timing good (post-investor close). Expect to approve by EOD June 6.",
      status: "in-progress"
    },
    {
      id: "dl-4",
      title: "Hire COO — Role & Sequencing",
      date: "May 30, 2026",
      context: "Operations complexity growing. Team gap obvious. Question: When do we hire a COO, and what profile do we need?",
      outcome: "Decision: Hire immediately. Profile: franchise operations background, former partner at scaling company, ready to own all outlet operations and team. Shortlist 3 candidates by June 10.",
      status: "successful"
    },
    {
      id: "dl-5",
      title: "Investor Round B — Close Timing",
      date: "May 15, 2026",
      context: "Dinesh Mehta is warm. Catalyst cooling. Arvind deck pending. Question: What's the realistic close timeline for Round B?",
      outcome: "Decision: Target 3-week close (by June 20). Dinesh + Arvind both viable. Catalyst needs re-engagement. Send all decks by June 7. Lock timelines with each by June 10.",
      status: "successful"
    }
  ],
  messages: [
    {
      id: "msg-1",
      sender: "ai",
      text: "Rajeev, one thing before you start: last Monday you committed to sending the FOCO expansion deck to two shortlisted investors. As of now, only one has been sent. The second has been pushed 4 times. I need you to action this before 11 AM today.",
      timestamp: "2026-06-02T07:02:14Z"
    }
  ],
  qrPassport: {
    partnerId: "8234-92A",
    partnerName: "Rajeev Kumar",
    roles: ["FK Holdings Chairman", "Active Franchise Architect", "Ecosystem Owner"],
    verificationDate: "Tuesday, June 02, 2026",
    scoreHistory: [68, 70, 75, 72, 74],
    verifiedLicenses: ["Mr. Chick'n Master Charter", "Chaat Masters Pro Developer License", "Acquisition Syndicate Lead Authority"],
    securityCode: "FK-SEC-84X-VERIFIED-2026"
  },
  partnerScore: {
    overallScore: 72,
    trend: "neutral",
    metrics: {
      revenueMRR: 3140000,
      cashRunwayMonths: 7.2,
      focoOutletsCount: 17,
      investorFunnelWarmCount: 3,
      appMRR: 1210000,
      executiveScore: 72
    }
  },
  ceoBriefings: [
    {
      date: "Monday, June 02, 2026",
      todayMission: "Close Investor Round B conversations. Two calls cannot slip again.",
      biggestRisk: "FOCO outlet #14 cash burn — 3rd week without resolution. Escalate now.",
      biggestOpportunity: "Chaat Masters app MRR crossed ₹12L last week. Expansion trigger met.",
      whatToIgnore: "Operations detail meetings. Delegate to GM. Stay chairman-level only.",
      topActions: [
        { id: "ta-1", text: "Investor call — Dinesh Mehta (9:30 AM)", expectedImpact: "Warm commitment close within 2 weeks at favorable terms." },
        { id: "ta-2", text: "Review Chaat Masters expansion Pune gating", expectedImpact: "Activate franchise model and screen 3 franchise candidates." },
        { id: "ta-3", text: "Approve acquisition LOI — Target #3", expectedImpact: "Lock down logistics target under due diligence." }
      ]
    }
  ],
  warRoomSessions: [
    {
      sessionId: "wrs-1",
      createdAt: "2026-06-02T07:02:00Z",
      status: "active",
      title: "Operation Round B Ingress",
      battlePlan: [
        "Deliver revised deck directly to Arvind Capital partner via strategic introduction",
        "Set firm Tuesday deadline for Catalyst Fund counter-proposal",
        "Sequence Dinesh Mehta closed round to trigger FOMO on remaining syndicate allocation"
      ],
      adversaries: [
        "Competitor QSR pricing pressure in Gurgaon",
        "Extended banking clearance loops for SPV integration"
      ],
      allies: [
        "Dinesh Mehta Strategic Round Syndicate",
        "FK Business OS integration leads"
      ],
      advisorLogs: [
        "AI Chairman Advisor: Priority remains protecting runway while maintaining 100% IP control. Do not accept minority dilutions under 25."
      ]
    }
  ],
  investors: [
    {
      id: "inv-1",
      name: "Dinesh Mehta",
      email: "dinesh.m@mehtaholdings.com",
      contact: "+91 98110 52342",
      ticketSizeRs: 7500000,
      stage: "committed",
      spvAllocated: "SPV 15 & 16",
      lastContacted: "2026-06-01",
      notes: "90% probability on Round B lead syndicate. Wants board observer seat."
    },
    {
      id: "inv-2",
      name: "Arvind Capital partners",
      email: "contact@arvindcap.in",
      contact: "+91 22 4902 3321",
      ticketSizeRs: 12000000,
      stage: "due-diligence",
      spvAllocated: "Pending Deck",
      lastContacted: "2026-05-28",
      notes: "Postponed meetings 4 times. Waiting for core expansion model deck."
    },
    {
      id: "inv-3",
      name: "Catalyst Fund India",
      email: "investment@catalystfund.in",
      contact: "+91 80 5021 9901",
      stage: "warm",
      ticketSizeRs: 5000000,
      spvAllocated: "SPV 17",
      lastContacted: "2026-05-25",
      notes: "Wary of cash runway duration. Re-engage immediately with updated Q1 metrics."
    }
  ],
  brands: [
    {
      id: "b-1",
      name: "Mr. Chick'n",
      type: "QSR",
      outletsCountTarget: 186,
      outletsCountActual: 10,
      appUsersTarget: 50000,
      appUsersActual: 2000,
      commissionPct: 6,
      mrrActual: 1930000,
      isTriggerMet: true
    },
    {
      id: "b-2",
      name: "Chaat Masters",
      type: "QSR",
      outletsCountTarget: 168,
      outletsCountActual: 7,
      appUsersTarget: 50000,
      appUsersActual: 15100,
      commissionPct: 6,
      mrrActual: 1210000,
      isTriggerMet: true
    }
  ],
  readinessScans: [
    {
      id: "sc-1",
      cityName: "Pune",
      tier: 1,
      mrrConditionMet: true,
      focoModelStable: true,
      npsScore: 8.2,
      readyToDeploy: true,
      recommendations: [
        "Shortlist 3 franchise candidates within 14 days",
        "Protect EBITDA runway by employing franchise-funded real-estate model",
        "Deploy basic FK Business OS to local operations before soft launch"
      ]
    },
    {
      id: "sc-2",
      cityName: "Jaipur",
      tier: 2,
      mrrConditionMet: true,
      focoModelStable: false,
      npsScore: 7.9,
      readyToDeploy: false,
      recommendations: [
        "Resolve outstanding manager role confusion before adding assets",
        "Establish standardized cash-gating benchmarks for local partners"
      ]
    }
  ],
  knowledgeDocs: [
    {
      id: "kd-1",
      title: "FK ₹1,100 Crore Plan Blueprint Summary",
      category: "Volume 1",
      summary: "Overview of the primary milestones, targets, and model breakdown.",
      content: "FK Plan targets ₹1,100 Crore annual group ecosystem revenue by September 2030. Sourced from: 400 FOCO outlets (₹480 Cr), 8 acquired businesses (₹400 Cr), and apps ecosystem of 100,000 paid users (₹200 Cr). FK direct revenue retention target is 159 Cr/year."
    },
    {
      id: "kd-2",
      title: "The Ownership Rule",
      category: "Rule",
      summary: "Strategic constraints governing all standard commercial relationship gates.",
      content: "RULE: Every new relationship = FK gets at least ONE of: 20%+ equity, perpetual revenue share, master franchise rights (5+ years), or full IP ownership. Consulting without ownership is strictly prohibited."
    },
    {
      id: "kd-3",
      title: "FOCO Expansion SPV Mechanics",
      category: "SOP",
      summary: "Structuring and investor metrics for building 400 outlets.",
      content: "SOP: Each outlet is pooled inside a distinct asset shell Special Purpose Vehicle (SPV) with 4 key investors placing ₹7.5L each (Total ₹30L). Brand operates, FK collects 6% fee directly, retains 25% for platform operating cash, and distributes 75% back to SPV investors monthly. Expected ROI is 18-22%."
    }
  ]
};

// PostgreSQL Schema Definition DDL
const MIGRATION_SQL = `
  -- Users Table
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Partner',
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- Partners Table
  CREATE TABLE IF NOT EXISTS partners (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    partner_name VARCHAR(255) NOT NULL,
    roles TEXT[] DEFAULT '{}',
    verification_date VARCHAR(255),
    score_history INTEGER[] DEFAULT '{}',
    verified_licenses TEXT[] DEFAULT '{}',
    security_code VARCHAR(255)
  );

  -- Scores Table
  CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    overall_score INTEGER DEFAULT 70,
    trend VARCHAR(50) DEFAULT 'neutral',
    revenue_mrr BIGINT DEFAULT 3000000,
    cash_runway_months NUMERIC DEFAULT 7.0,
    foco_outlets_count INTEGER DEFAULT 0,
    investor_funnel_warm_count INTEGER DEFAULT 0,
    app_mrr BIGINT DEFAULT 0,
    executive_score INTEGER DEFAULT 70,
    june_target_vs_actual INTEGER DEFAULT 0,
    accountability_score INTEGER DEFAULT 70,
    weekly_trend VARCHAR(50) DEFAULT 'neutral',
    mrr_target_gap VARCHAR(255) DEFAULT ''
  );

  -- Brands Table
  CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    outlets_count_target INTEGER DEFAULT 100,
    outlets_count_actual INTEGER DEFAULT 0,
    app_users_target INTEGER DEFAULT 50000,
    app_users_actual INTEGER DEFAULT 0,
    commission_pct NUMERIC DEFAULT 6.0,
    mrr_actual BIGINT DEFAULT 0,
    is_trigger_met BOOLEAN DEFAULT FALSE
  );

  -- Investors Table
  CREATE TABLE IF NOT EXISTS investors (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    contact VARCHAR(100),
    ticket_size_rs BIGINT DEFAULT 0,
    stage VARCHAR(100) DEFAULT 'warm',
    spv_allocated VARCHAR(255) DEFAULT 'Pending',
    last_contacted VARCHAR(100),
    notes TEXT
  );

  -- Commitments Table
  CREATE TABLE IF NOT EXISTS commitments (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    committed_days_overdue INTEGER DEFAULT 0,
    committed_date VARCHAR(100),
    due_date VARCHAR(100),
    impact TEXT
  );

  -- Knowledge Brain Table
  CREATE TABLE IF NOT EXISTS knowledge_docs (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    summary TEXT,
    content TEXT,
    embedding double precision[]
  );

  -- War Room Sessions Table
  CREATE TABLE IF NOT EXISTS war_room_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active',
    title VARCHAR(255) NOT NULL,
    battle_plan TEXT[] DEFAULT '{}',
    adversaries TEXT[] DEFAULT '{}',
    allies TEXT[] DEFAULT '{}',
    advisor_logs TEXT[] DEFAULT '{}'
  );

  -- Messages Table
  CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
  );

  -- CEO Briefings Table
  CREATE TABLE IF NOT EXISTS ceo_briefings (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date VARCHAR(100) NOT NULL,
    today_mission TEXT,
    biggest_risk TEXT,
    biggest_opportunity TEXT,
    what_to_ignore TEXT,
    top_actions JSONB DEFAULT '[]'::jsonb
  );

  -- Readiness Scans Table
  CREATE TABLE IF NOT EXISTS readiness_scans (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    city_name VARCHAR(255) NOT NULL,
    tier INTEGER DEFAULT 1,
    mrr_condition_met BOOLEAN DEFAULT FALSE,
    foco_model_stable BOOLEAN DEFAULT FALSE,
    nps_score NUMERIC DEFAULT 0,
    ready_to_deploy BOOLEAN DEFAULT FALSE,
    recommendations TEXT[] DEFAULT '{}'
  );

  -- Weekly Board Items
  CREATE TABLE IF NOT EXISTS weekly_board_items (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT
  );

  -- Action Plan Items
  CREATE TABLE IF NOT EXISTS action_plan_items (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    day VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE
  );

  -- Emergency Mode Table
  CREATE TABLE IF NOT EXISTS emergency_mode (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    is_activated BOOLEAN DEFAULT FALSE,
    activated_at VARCHAR(100),
    reason TEXT,
    runway_months NUMERIC DEFAULT 12,
    revenue_gap_pct INTEGER DEFAULT 0,
    investor_funnel_count INTEGER DEFAULT 0,
    recovery_plan JSONB DEFAULT '[]'::jsonb,
    actions_to_take JSONB DEFAULT '[]'::jsonb,
    root_cause_analysis JSONB DEFAULT '{}'::jsonb
  );

  -- Audit Logs Table
  CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    module VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
  );
`;

// Initialize database schema and migrations
export async function runMigrations() {
  if (!pool) {
    console.warn("PostgreSQL not active, skipping native SQL DDL setup.");
    return false;
  }

  let client;
  try {
    client = await pool.connect();
    console.log("Acquired PG client, executing database migrations...");
    await client.query("BEGIN");
    await client.query(MIGRATION_SQL);
    await client.query("ALTER TABLE knowledge_docs ADD COLUMN IF NOT EXISTS embedding double precision[];");
    await client.query("COMMIT");
    isPostgresActive = true;
    console.log("PostgreSQL Database schema tables verified successfully.");
    
    // Seed default admin and user if not exists
    const adminCheck = await client.query("SELECT * FROM users LIMIT 1");
    if (adminCheck.rows.length === 0) {
      console.log("No users found. Seeding original system Chairman admin user...");
      const passwordHash = await bcrypt.hash("rajeev2026", 10);
      const res = await client.query(
        "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
        ["contactmmx@gmail.com", passwordHash, "Chairman"]
      );
      const newUserId = res.rows[0].id;
      await seedUserDatabase(newUserId, "contactmmx@gmail.com");
    }
    return true;
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Database migration crashed, falling back. SQL DDL error:", error);
    isPostgresActive = false;
    return false;
  } finally {
    if (client) client.release();
  }
}

// Seed complete seed state into PostgreSQL tables for a given user
export async function seedUserDatabase(userId: number, email: string) {
  // If fallback is running
  if (!isPostgresActive || !pool) {
    const filePath = getFallbackUserPath(userId);
    fs.writeFileSync(filePath, JSON.stringify(SEED_DATA_TEMPLATE, null, 2), "utf8");
    console.log(`Fallback user sandbox seeded successfully at ${filePath}`);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Partner record
    const p = SEED_DATA_TEMPLATE.qrPassport;
    await client.query(`
      INSERT INTO partners (id, user_id, partner_name, roles, verification_date, score_history, verified_licenses, security_code)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id) DO NOTHING
    `, [p.partnerId, userId, p.partnerName, p.roles, p.verificationDate, p.scoreHistory, p.verifiedLicenses, p.securityCode]);

    // Scores
    const s = SEED_DATA_TEMPLATE.partnerScore;
    const m = SEED_DATA_TEMPLATE.weeklyBoardMetrics;
    await client.query(`
      INSERT INTO scores (user_id, overall_score, trend, revenue_mrr, cash_runway_months, foco_outlets_count, investor_funnel_warm_count, app_mrr, executive_score, june_target_vs_actual, accountability_score, weekly_trend, mrr_target_gap)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (user_id) DO NOTHING
    `, [userId, s.overallScore, s.trend, s.metrics.revenueMRR, s.metrics.cashRunwayMonths, s.metrics.focoOutletsCount, s.metrics.investorFunnelWarmCount, s.metrics.appMRR, s.metrics.executiveScore, m.juneTargetVsActual, m.accountabilityScore, m.weeklyTrend, m.mrrTargetGap]);

    // Brands
    for (const b of SEED_DATA_TEMPLATE.brands) {
      await client.query(`
        INSERT INTO brands (id, user_id, name, type, outlets_count_target, outlets_count_actual, app_users_target, app_users_actual, commission_pct, mrr_actual, is_trigger_met)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `, [b.id, userId, b.name, b.type, b.outletsCountTarget, b.outletsCountActual, b.appUsersTarget, b.appUsersActual, b.commissionPct, b.mrrActual, b.isTriggerMet]);
    }

    // Investors
    for (const inv of SEED_DATA_TEMPLATE.investors) {
      await client.query(`
        INSERT INTO investors (id, user_id, name, email, contact, ticket_size_rs, stage, spv_allocated, last_contacted, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [inv.id, userId, inv.name, inv.email, inv.contact, inv.ticketSizeRs, inv.stage, inv.spvAllocated, inv.lastContacted, inv.notes]);
    }

    // Commitments
    for (const c of SEED_DATA_TEMPLATE.accountabilityCommitments) {
      await client.query(`
        INSERT INTO commitments (id, user_id, title, status, committed_days_overdue, committed_date, due_date, impact)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [c.id, userId, c.title, c.status, c.committedDaysOverdue, c.committedDate, c.dueDate, c.impact]);
    }

    // Knowledge Docs
    for (const kd of SEED_DATA_TEMPLATE.knowledgeDocs) {
      await client.query(`
        INSERT INTO knowledge_docs (id, user_id, title, category, summary, content)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [kd.id, userId, kd.title, kd.category, kd.summary, kd.content]);
    }

    // War Room Sessions
    for (const wrs of SEED_DATA_TEMPLATE.warRoomSessions) {
      await client.query(`
        INSERT INTO war_room_sessions (session_id, user_id, status, title, battle_plan, adversaries, allies, advisor_logs)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (session_id) DO NOTHING
      `, [wrs.sessionId, userId, wrs.status, wrs.title, wrs.battlePlan, wrs.adversaries, wrs.allies, wrs.advisorLogs]);
    }

    // Messages
    for (const msg of SEED_DATA_TEMPLATE.messages) {
      await client.query(`
        INSERT INTO messages (id, user_id, sender, text, timestamp)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [msg.id, userId, msg.sender, msg.text, msg.timestamp]);
    }

    // CEO Briefings
    for (const cb of SEED_DATA_TEMPLATE.ceoBriefings) {
      const briefId = "br-" + Math.floor(Math.random() * 1000000);
      await client.query(`
        INSERT INTO ceo_briefings (id, user_id, date, today_mission, biggest_risk, biggest_opportunity, what_to_ignore, top_actions)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [briefId, userId, cb.date, cb.todayMission, cb.biggestRisk, cb.biggestOpportunity, cb.whatToIgnore, JSON.stringify(cb.topActions)]);
    }

    // Readiness scans
    for (const rs of SEED_DATA_TEMPLATE.readinessScans) {
      await client.query(`
        INSERT INTO readiness_scans (id, user_id, city_name, tier, mrr_condition_met, foco_model_stable, nps_score, ready_to_deploy, recommendations)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [rs.id, userId, rs.cityName, rs.tier, rs.mrrConditionMet, rs.focoModelStable, rs.npsScore, rs.readyToDeploy, rs.recommendations]);
    }

    // Weekly Board items
    for (const wbi of SEED_DATA_TEMPLATE.weeklyBoardItems) {
      await client.query(`
        INSERT INTO weekly_board_items (id, user_id, category, title, description)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [wbi.id, userId, wbi.category, wbi.title, wbi.description]);
    }

    // Action plan items
    for (const api of SEED_DATA_TEMPLATE.actionPlanItems) {
      await client.query(`
        INSERT INTO action_plan_items (id, user_id, day, title, description, completed)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [api.id, userId, api.day, api.title, api.description, api.completed]);
    }

    // Emergency mode state
    const em = SEED_DATA_TEMPLATE.emergencyMode;
    await client.query(`
      INSERT INTO emergency_mode (user_id, is_activated, activated_at, reason, runway_months, revenue_gap_pct, investor_funnel_count, recovery_plan, actions_to_take, root_cause_analysis)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id) DO NOTHING
    `, [userId, em.isActivated, em.activatedAt, em.reason, em.criticalKpis.runwayMonths, em.criticalKpis.revenueGapPct, em.criticalKpis.investorFunnelCount, JSON.stringify(em.recoveryPlan), JSON.stringify(em.actionsToTake), JSON.stringify(em.rootCauseAnalysis)]);

    await client.query("COMMIT");
    console.log(`Database transaction completed: Isolated context seeded and ready for User ID ${userId} (${email}).`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed user postgres elements:", error);
  } finally {
    client.release();
  }
}

// Audit logger implementation
export async function logAuditEvent(userId: number | null, email: string | null, action: string, module: string) {
  console.log(`[AUDIT LOG] User: ${email || "Anonymous"} | Action: ${action} | Module: ${module}`);
  if (isPostgresActive && pool) {
    try {
      await pool.query(
        "INSERT INTO audit_logs (user_id, email, action, module) VALUES ($1, $2, $3, $4)",
        [userId, email, action, module]
      );
    } catch (error) {
      console.error("Failed to insert audit log row:", error);
    }
  }
}

// User auth database handlers
export async function findUserByEmail(email: string) {
  if (isPostgresActive && pool) {
    const res = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    return res.rows[0];
  } else {
    // Falls back to scanning files in dry run user simulation mode
    // We can list simulated users or scan the directory
    const files = fs.readdirSync(FALLBACK_DIR);
    for (const file of files) {
      if (file.endsWith("_db.json")) {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(FALLBACK_DIR, file), "utf8"));
          if (content.credentials && content.credentials.email.toLowerCase() === email.toLowerCase().trim()) {
            return {
              id: content.credentials.id,
              email: content.credentials.email,
              password_hash: content.credentials.password_hash,
              role: content.credentials.role
            };
          }
        } catch {}
      }
    }
    // Check main admin hardcoded default in fallback
    if (email.toLowerCase().trim() === "contactmmx@gmail.com") {
      const defaultHash = await bcrypt.hash("rajeev2026", 10);
      return {
        id: 1,
        email: "contactmmx@gmail.com",
        password_hash: defaultHash,
        role: "Chairman"
      };
    }
    return null;
  }
}

export async function createUserInDB(email: string, passwordHash: string, role: string) {
  const normEmail = email.toLowerCase().trim();
  if (isPostgresActive && pool) {
    const res = await pool.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *",
      [normEmail, passwordHash, role]
    );
    const user = res.rows[0];
    await seedUserDatabase(user.id, normEmail);
    return user;
  } else {
    // Local fallback user registry simulation
    const userId = Date.now();
    const filePath = getFallbackUserPath(userId);
    const mockUser = {
      credentials: { id: userId, email: normEmail, password_hash: passwordHash, role },
      ...SEED_DATA_TEMPLATE
    };
    fs.writeFileSync(filePath, JSON.stringify(mockUser, null, 2), "utf8");
    return { id: userId, email: normEmail, password_hash: passwordHash, role };
  }
}

// Combined state retrieval that matches the previous complete DatabaseState layout
export async function getCombinedDatabaseState(userId: number): Promise<any> {
  if (!isPostgresActive || pool === null) {
    const filePath = getFallbackUserPath(userId);
    if (!fs.existsSync(filePath)) {
      // Seed fallback mock file
      fs.writeFileSync(filePath, JSON.stringify({ credentials: null, ...SEED_DATA_TEMPLATE }, null, 2), "utf8");
    }
    try {
      const dataObj = JSON.parse(fs.readFileSync(filePath, "utf8"));
      // Strip credentials before returning to client
      const { credentials, ...cleanState } = dataObj;
      return cleanState;
    } catch {
      return SEED_DATA_TEMPLATE;
    }
  }

  // Real Postgres assembly logic
  const client = await pool.connect();
  try {
    const partnerRes = await client.query("SELECT * FROM partners WHERE user_id = $1", [userId]);
    const scoreRes = await client.query("SELECT * FROM scores WHERE user_id = $1", [userId]);
    const brandRes = await client.query("SELECT * FROM brands WHERE user_id = $1 ORDER BY id", [userId]);
    const investorRes = await client.query("SELECT * FROM investors WHERE user_id = $1 ORDER BY id", [userId]);
    const commitmentRes = await client.query("SELECT * FROM commitments WHERE user_id = $1 ORDER BY id", [userId]);
    const knowledgeRes = await client.query("SELECT * FROM knowledge_docs WHERE user_id = $1 ORDER BY id", [userId]);
    const sessionRes = await client.query("SELECT * FROM war_room_sessions WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    const msgRes = await client.query("SELECT * FROM messages WHERE user_id = $1 ORDER BY timestamp ASC", [userId]);
    const briefRes = await client.query("SELECT * FROM ceo_briefings WHERE user_id = $1 ORDER BY id DESC", [userId]);
    const scanRes = await client.query("SELECT * FROM readiness_scans WHERE user_id = $1 ORDER BY id", [userId]);
    const boardItemsRes = await client.query("SELECT * FROM weekly_board_items WHERE user_id = $1 ORDER BY id", [userId]);
    const planItemsRes = await client.query("SELECT * FROM action_plan_items WHERE user_id = $1 ORDER BY id", [userId]);
    const emergencyRes = await client.query("SELECT * FROM emergency_mode WHERE user_id = $1", [userId]);

    // Format metrics
    const scoreRow = scoreRes.rows[0] || {};
    const partnerRow = partnerRes.rows[0] || {};
    const emRow = emergencyRes.rows[0] || {};

    const weeklyBoardMetrics = {
      juneTargetVsActual: Number(scoreRow.june_target_vs_actual || 0),
      accountabilityScore: Number(scoreRow.accountability_score || 0),
      weeklyTrend: scoreRow.weekly_trend || "neutral",
      mrrTargetGap: scoreRow.mrr_target_gap || ""
    };

    const partnerScore = {
      overallScore: Number(scoreRow.overall_score || 72),
      trend: (scoreRow.trend || "neutral") as "up" | "down" | "neutral",
      metrics: {
        revenueMRR: Number(scoreRow.revenue_mrr || 0),
        cashRunwayMonths: Number(scoreRow.cash_runway_months || 0),
        focoOutletsCount: Number(scoreRow.foco_outlets_count || 0),
        investorFunnelWarmCount: Number(scoreRow.investor_funnel_warm_count || 0),
        appMRR: Number(scoreRow.app_mrr || 0),
        executiveScore: Number(scoreRow.executive_score || 0)
      }
    };

    const qrPassport = {
      partnerId: partnerRow.id || "SANDBOX-001",
      partnerName: partnerRow.partner_name || "Guest Partner",
      roles: partnerRow.roles || [],
      verificationDate: partnerRow.verification_date || "",
      scoreHistory: partnerRow.score_history || [],
      verifiedLicenses: partnerRow.verified_licenses || [],
      securityCode: partnerRow.security_code || ""
    };

    const emergencyMode = {
      isActivated: emRow.is_activated || false,
      activatedAt: emRow.activated_at || "",
      reason: emRow.reason || "",
      criticalKpis: {
        runwayMonths: Number(emRow.runway_months || 0),
        revenueGapPct: Number(emRow.revenue_gap_pct || 0),
        investorFunnelCount: Number(emRow.investor_funnel_count || 0)
      },
      recoveryPlan: emRow.recovery_plan || [],
      actionsToTake: emRow.actions_to_take || [],
      rootCauseAnalysis: emRow.root_cause_analysis || {}
    };

    return {
      weeklyBoardItems: boardItemsRes.rows.map(item => ({
        id: item.id,
        category: item.category,
        title: item.title,
        description: item.description
      })),
      weeklyBoardMetrics,
      actionPlanItems: planItemsRes.rows.map(item => ({
        id: item.id,
        day: item.day,
        title: item.title,
        description: item.description,
        completed: item.completed
      })),
      emergencyMode,
      accountabilityCommitments: commitmentRes.rows.map(item => ({
        id: item.id,
        title: item.title,
        status: item.status,
        committedDaysOverdue: item.committed_days_overdue,
        committedDate: item.committed_date,
        dueDate: item.due_date,
        impact: item.impact
      })),
      decisionLogItems: [], // Loaded from DB, we can map if row or fetch directly
      messages: msgRes.rows.map(item => ({
        id: item.id,
        sender: item.sender,
        text: item.text,
        timestamp: item.timestamp.toISOString()
      })),
      qrPassport,
      partnerScore,
      ceoBriefings: briefRes.rows.map(item => ({
        date: item.date,
        todayMission: item.today_mission,
        biggestRisk: item.biggest_risk,
        biggestOpportunity: item.biggest_opportunity,
        whatToIgnore: item.what_to_ignore,
        topActions: item.top_actions || []
      })),
      warRoomSessions: sessionRes.rows.map(item => ({
        sessionId: item.session_id,
        createdAt: item.created_at.toISOString(),
        status: item.status,
        title: item.title,
        battlePlan: item.battle_plan || [],
        adversaries: item.adversaries || [],
        allies: item.allies || [],
        advisorLogs: item.advisor_logs || []
      })),
      investors: investorRes.rows.map(item => ({
        id: item.id,
        name: item.name,
        email: item.email,
        contact: item.contact,
        ticketSizeRs: Number(item.ticket_size_rs),
        stage: item.stage,
        spvAllocated: item.spv_allocated,
        lastContacted: item.last_contacted,
        notes: item.notes
      })),
      brands: brandRes.rows.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        outletsCountTarget: item.outlets_count_target,
        outletsCountActual: item.outlets_count_actual,
        appUsersTarget: item.app_users_target,
        appUsersActual: item.app_users_actual,
        commissionPct: Number(item.commission_pct),
        mrrActual: Number(item.mrr_actual),
        isTriggerMet: item.is_trigger_met
      })),
      readinessScans: scanRes.rows.map(item => ({
        id: item.id,
        cityName: item.city_name,
        tier: item.tier,
        mrrConditionMet: item.mrr_condition_met,
        focoModelStable: item.foco_model_stable,
        npsScore: Number(item.nps_score),
        readyToDeploy: item.ready_to_deploy,
        recommendations: item.recommendations || []
      })),
      knowledgeDocs: knowledgeRes.rows.map(item => ({
        id: item.id,
        title: item.title,
        category: item.category,
        summary: item.summary,
        content: item.content,
        embedding: item.embedding
      }))
    };
  } finally {
    client.release();
  }
}

// Low level database write adapter that handles fallback and native PostgreSQL operations
export async function dbWriteOperation(userId: number, callback: (client: pg.PoolClient | null, fallbackState: any) => Promise<any>): Promise<any> {
  if (!isPostgresActive || pool === null) {
    const filePath = getFallbackUserPath(userId);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ credentials: null, ...SEED_DATA_TEMPLATE }, null, 2), "utf8");
    }
    const dataObj = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const updatedState = await callback(null, dataObj);
    fs.writeFileSync(filePath, JSON.stringify(updatedState, null, 2), "utf8");
    return updatedState;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client, null);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database write transaction crashed:", error);
    throw error;
  } finally {
    client.release();
  }
}
