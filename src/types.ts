export interface WeeklyBoardItem {
  id: string;
  category: 'win' | 'fail' | 'risk' | 'team';
  title: string;
  description: string;
  impact?: string;
}

export interface WeeklyBoardMetrics {
  juneTargetVsActual: number; // e.g., -17 for -17%
  accountabilityScore: number; // e.g., 48
  weeklyTrend: string; // e.g., "down"
  mrrTargetGap: string; // e.g., "GAP: ₹6.6L MRR"
}

export interface ActionPlanItem {
  id: string;
  day: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface EmergencyModeState {
  isActivated: boolean;
  activatedAt: string;
  reason: string;
  criticalKpis: {
    runwayMonths: number;
    revenueGapPct: number;
    investorFunnelCount: number;
  };
  recoveryPlan: {
    phase: string;
    hours: string;
    tasks: string[];
  }[];
  actionsToTake: {
    text: string;
    isDo: boolean; // true = DO, false = DO NOT
    isBlocked?: boolean;
  }[];
  rootCauseAnalysis: {
    primary: string;
    secondary: string;
    tertiary: string;
    systemFix: string;
  };
}

export interface AccountabilityCommitment {
  id: string;
  title: string;
  status: 'overdue' | 'due-soon' | 'completed';
  committedDaysOverdue?: number; // e.g., 9
  committedDate: string; // e.g., "May 28"
  dueDate: string; // e.g., "May 31"
  impact: string;
}

export interface DecisionLogItem {
  id: string;
  title: string;
  date: string;
  context: string;
  outcome: string;
  status: 'successful' | 'in-progress' | 'pending';
}

export interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export interface QRPassport {
  partnerId: string; // e.g., "8234-92A"
  partnerName: string; // "Rajeev"
  roles: string[]; // e.g. ["FK Holdings Chairman", "Active Franchise Manager"]
  verificationDate: string; // e.g. "Tuesday, June 02, 2026"
  scoreHistory: number[];
  verifiedLicenses: string[]; // List of brand permissions e.g. ["Mr. Chick'n Master", "Chaat Masters Pro Developer"]
  securityCode: string; // Dynamic QR hash e.g. "FK-SEC-84X"
}

export interface PartnerScore {
  overallScore: number; // e.g. 72
  trend: 'up' | 'down' | 'neutral';
  metrics: {
    revenueMRR: number; // e.g. 3140000 -> ₹31.4L
    cashRunwayMonths: number; // e.g. 7.2
    focoOutletsCount: number; // e.g. 17
    investorFunnelWarmCount: number; // e.g. 3
    appMRR: number; // e.g. 1210000 -> ₹12.1L
    executiveScore: number; // e.g. 72
  };
}

export interface DailyCEOBriefing {
  date: string;
  todayMission: string;
  biggestRisk: string;
  biggestOpportunity: string;
  whatToIgnore: string;
  topActions: {
    id: string;
    text: string;
    expectedImpact: string;
  }[];
}

export interface WarRoomSession {
  sessionId: string;
  createdAt: string;
  status: 'active' | 'archived';
  title: string;
  battlePlan: string[];
  adversaries: string[]; // e.g., ["Competitor A launch", "Delayed Round B Close"]
  allies: string[]; // e.g., ["Dinesh Mehta Strategic Round"]
  advisorLogs: string[];
}

export interface Investor {
  id: string;
  name: string;
  email: string;
  contact: string;
  ticketSizeRs: number; // e.g. 750000 for ₹7.5L
  stage: 'cold' | 'warm' | 'due-diligence' | 'committed';
  spvAllocated: string; // e.g. "SPV 42" or "Pending"
  lastContacted: string; // e.g. "2026-05-30"
  notes?: string;
}

export interface BrandComparison {
  id: string;
  name: string;
  type: string; // QSR / Retail etc
  outletsCountTarget: number;
  outletsCountActual: number;
  appUsersTarget: number;
  appUsersActual: number;
  commissionPct: number; // e.g., 6 for 6%
  mrrActual: number; // e.g. 1210000 -> ₹12.1L
  isTriggerMet: boolean;
}

export interface ExpansionReadinessScan {
  id: string;
  cityName: string;
  tier: number; // 1 or 2
  mrrConditionMet: boolean;
  focoModelStable: boolean;
  npsScore: number; // e.g., 8.2
  readyToDeploy: boolean;
  recommendations: string[];
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string; // "Volume 1", "Volume 2", "SOP", "Rule"
  summary: string;
  content: string; // Key details
  embedding?: number[];
}

export interface DatabaseState {
  weeklyBoardItems: WeeklyBoardItem[];
  weeklyBoardMetrics: WeeklyBoardMetrics;
  actionPlanItems: ActionPlanItem[];
  emergencyMode: EmergencyModeState;
  accountabilityCommitments: AccountabilityCommitment[];
  decisionLogItems: DecisionLogItem[];
  messages: Message[];
  qrPassport: QRPassport;
  partnerScore: PartnerScore;
  ceoBriefings: DailyCEOBriefing[];
  warRoomSessions: WarRoomSession[];
  investors: Investor[];
  brands: BrandComparison[];
  readinessScans: ExpansionReadinessScan[];
  knowledgeDocs: KnowledgeDoc[];
}
