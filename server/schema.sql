-- FK Holdings Production PostgreSQL Database Schema DDL
-- Verifies 100% compliant relational structure with cascading user-isolation and index optimizations

-- 1. Users Table (Core account credential registry)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Partner', -- 'Chairman', 'Admin', 'Partner', 'Viewer'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Partners Table (QR verification parameters and brand licensing)
CREATE TABLE IF NOT EXISTS partners (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  partner_name VARCHAR(255) NOT NULL,
  roles TEXT[] DEFAULT '{}',
  verification_date VARCHAR(255),
  score_history INTEGER[] DEFAULT '{}',
  verified_licenses TEXT[] DEFAULT '{}',
  security_code VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_partners_user ON partners(user_id);

-- 3. Scores Table (Central performance index and weekly board metrics)
CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  overall_score INTEGER DEFAULT 70,
  trend VARCHAR(50) DEFAULT 'neutral',
  revenue_mrr BIGINT DEFAULT 3000000,
  cash_runway_months NUMERIC(4, 2) DEFAULT 7.00,
  foco_outlets_count INTEGER DEFAULT 0,
  investor_funnel_warm_count INTEGER DEFAULT 0,
  app_mrr BIGINT DEFAULT 0,
  executive_score INTEGER DEFAULT 70,
  june_target_vs_actual INTEGER DEFAULT 0,
  accountability_score INTEGER DEFAULT 70,
  weekly_trend VARCHAR(50) DEFAULT 'neutral',
  mrr_target_gap VARCHAR(255) DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id);

-- 4. Brands Table (Comparison and expansion triggers)
CREATE TABLE IF NOT EXISTS brands (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) DEFAULT 'QSR',
  outlets_count_target INTEGER DEFAULT 100,
  outlets_count_actual INTEGER DEFAULT 0,
  app_users_target INTEGER DEFAULT 50000,
  app_users_actual INTEGER DEFAULT 0,
  commission_pct NUMERIC(4, 2) DEFAULT 6.00,
  mrr_actual BIGINT DEFAULT 0,
  is_trigger_met BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_brands_user ON brands(user_id);

-- 5. Investors Table (Round B syndicate log)
CREATE TABLE IF NOT EXISTS investors (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  contact VARCHAR(100),
  ticket_size_rs BIGINT DEFAULT 0,
  stage VARCHAR(100) DEFAULT 'warm', -- 'cold', 'warm', 'due-diligence', 'committed'
  spv_allocated VARCHAR(255) DEFAULT 'Pending',
  last_contacted VARCHAR(100),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_investors_user ON investors(user_id);

-- 6. Commitments Table (Accountability tracking system)
CREATE TABLE IF NOT EXISTS commitments (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'due-soon', -- 'overdue', 'due-soon', 'completed'
  committed_days_overdue INTEGER DEFAULT 0,
  committed_date VARCHAR(100),
  due_date VARCHAR(100),
  impact TEXT
);

CREATE INDEX IF NOT EXISTS idx_commitments_user ON commitments(user_id);

-- 7. Knowledge Docs Table (Volume rules operational guidelines)
CREATE TABLE IF NOT EXISTS knowledge_docs (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'SOP',
  summary TEXT,
  content TEXT
);

CREATE INDEX IF NOT EXISTS idx_knowledge_docs_user ON knowledge_docs(user_id);

-- 8. War Room Sessions Table (Tactical execution sessions)
CREATE TABLE IF NOT EXISTS war_room_sessions (
  session_id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  title VARCHAR(255) NOT NULL,
  battle_plan TEXT[] DEFAULT '{}',
  adversaries TEXT[] DEFAULT '{}',
  allies TEXT[] DEFAULT '{}',
  advisor_logs TEXT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_war_room_sessions_user ON war_room_sessions(user_id);

-- 9. Messages Table (AI Chatbot operational threads)
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender VARCHAR(50) NOT NULL, -- 'ai', 'user'
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);

-- 10. CEO Briefings Table (Reports and daily notifications)
CREATE TABLE IF NOT EXISTS ceo_briefings (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date VARCHAR(100) NOT NULL,
  today_mission TEXT,
  biggest_risk TEXT,
  biggest_opportunity TEXT,
  what_to_ignore TEXT,
  top_actions JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ceo_briefings_user ON ceo_briefings(user_id);

-- 11. Readiness Scans Table (City-tier expansion gating assessments)
CREATE TABLE IF NOT EXISTS readiness_scans (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city_name VARCHAR(255) NOT NULL,
  tier INTEGER DEFAULT 1,
  mrr_condition_met BOOLEAN DEFAULT FALSE,
  foco_model_stable BOOLEAN DEFAULT FALSE,
  nps_score NUMERIC(4, 2) DEFAULT 0,
  ready_to_deploy BOOLEAN DEFAULT FALSE,
  recommendations TEXT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_readiness_scans_user ON readiness_scans(user_id);

-- 12. Weekly Board Items Table (Core Board wins, failures, elements)
CREATE TABLE IF NOT EXISTS weekly_board_items (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'win', 'fail', 'risk', 'team'
  title VARCHAR(255) NOT NULL,
  description TEXT
);

CREATE INDEX IF NOT EXISTS idx_weekly_board_items_user ON weekly_board_items(user_id);

-- 13. Action Plan Items Table (Days-of-the-week strategic execution)
CREATE TABLE IF NOT EXISTS action_plan_items (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_action_plan_items_user ON action_plan_items(user_id);

-- 14. Emergency 72-Hour Recovery Mode Parameters
CREATE TABLE IF NOT EXISTS emergency_mode (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  is_activated BOOLEAN DEFAULT FALSE,
  activated_at VARCHAR(100),
  reason TEXT,
  runway_months NUMERIC(4, 2) DEFAULT 12.00,
  revenue_gap_pct INTEGER DEFAULT 0,
  investor_funnel_count INTEGER DEFAULT 0,
  recovery_plan JSONB DEFAULT '[]'::jsonb,
  actions_to_take JSONB DEFAULT '[]'::jsonb,
  root_cause_analysis JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_emergency_mode_user ON emergency_mode(user_id);

-- 15. Audit Logs Table (Full compliance security audit chain)
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  module VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
