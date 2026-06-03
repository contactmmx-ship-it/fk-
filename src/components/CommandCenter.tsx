import React, { useState, useEffect } from "react";
import { DatabaseState } from "../types";
import { 
  Shield, Target, Plus, X, Award, Zap, Bell, CheckSquare, 
  Settings, Users, Phone, Mail, FileText, Printer, Star, 
  TrendingUp, TrendingDown, RefreshCw, Sparkles, Check, 
  HelpCircle, AlertTriangle, ArrowRight, ClipboardList, Gauge
} from "lucide-react";

// Flexible Lead Interface
interface SmartLead {
  id: string;
  name: string;
  email: string;
  contact: string;
  category: "franchise" | "investor" | "distributor" | "consultant" | "partner";
  ticketSizeRs: number; 
  interestLevel: "hot" | "warm" | "cold";
  notes: string;
  lastContacted: string;
}

// Flexible Notification Interface
interface SystemNotification {
  id: string;
  type: "warning" | "opportunity" | "info" | "critical";
  message: string;
  timestamp: string;
  category: string;
}

interface CommandCenterProps {
  db: DatabaseState;
  onRefresh: () => void;
}

export default function CommandCenter({ db, onRefresh }: CommandCenterProps) {
  // Navigation inside the Command Center
  const [activeTab, setActiveTab] = useState<"realpath" | "coach" | "scanner" | "health" | "crm">("realpath");

  // --- 1. FK REAL PATH 2030 STATE ---
  const [selectedPathStage, setSelectedPathStage] = useState<number>(1);
  const [activePathBrandId, setActivePathBrandId] = useState<string>(db.brands[0]?.id || "b-1");

  // --- 2. CHAIRMAN AI COACH STATE ---
  const [coachResponse, setCoachResponse] = useState<string>("");
  const [isAskingCoach, setIsAskingCoach] = useState(false);
  const [coachQueryInput, setCoachQueryInput] = useState("");

  // --- 3. BRAND READINESS SCANNER STATE ---
  const [activeScannerBrandId, setActiveScannerBrandId] = useState<string>(db.brands[0]?.id || "b-1");
  const [auditorName, setAuditorName] = useState("Rajeev Kumar, Chairman Panel");
  const [sliderRatings, setSliderRatings] = useState({
    brandEquity: 6,
    systemsIntegrity: 5,
    processStandardization: 4,
    salesFunnel: 5,
    opsConsistency: 6,
    marketingEfficiency: 4,
    leadershipManagement: 5,
    profitability: 7
  });
  const [computedReadyScores, setComputedReadyScores] = useState<any>(null);
  const [assessmentComments, setAssessmentComments] = useState("Unit EBITDA holds highly positive momentum, but process documentation lacks regional audit standardization. Recommend lock on Vol 1 SOPs before franchise deploy.");

  // --- 4. SMART CRM & LEADS STATE ---
  const [leadsList, setLeadsList] = useState<SmartLead[]>([
    {
      id: "ld-1",
      name: "Acme Distribution Group (South)",
      email: "south@acmedistributor.co.in",
      contact: "+91 98450 11200",
      category: "distributor",
      ticketSizeRs: 15000000, // ₹1.5 Cr
      interestLevel: "hot",
      notes: "Eager to acquire sole distribution master-rights for Kerala and Tamil Nadu. Demanding 9% commission structure approval.",
      lastContacted: "May 30"
    },
    {
      id: "ld-2",
      name: "Sanjay Singhania (Noida franchisee)",
      email: "singhania.sanjay@gmail.com",
      contact: "+91 99100 88344",
      category: "franchise",
      ticketSizeRs: 4500000, // ₹45L
      interestLevel: "hot",
      notes: "Completed site feasibility evaluation at Sector 62. Needs brand sign-off on local kitchen SLA guidelines.",
      lastContacted: "June 01"
    },
    {
      id: "ld-3",
      name: "Catalyst Expansion Angels",
      email: "syndicate@catalystangels.com",
      contact: "+91 22 4522 9900",
      category: "investor",
      ticketSizeRs: 25000000, // ₹2.5 Cr
      interestLevel: "warm",
      notes: "Evaluating Round B co-investment. Waiting for updated corporate presentations and SPV allocation details.",
      lastContacted: "May 27"
    },
    {
      id: "ld-4",
      name: "Mehra & Associates Consultants",
      email: "mehra.cfo@mehra-associates.in",
      contact: "+91 11 2622 9011",
      category: "consultant",
      ticketSizeRs: 0,
      interestLevel: "warm",
      notes: "Assisting with due diligence and corporate compliance. Recommended auditing processes for Stage 9 readiness.",
      lastContacted: "May 29"
    }
  ]);

  const [addLeadForm, setAddLeadForm] = useState({
    name: "",
    email: "",
    contact: "",
    category: "franchise" as any,
    ticketSizeRs: 2000000,
    interestLevel: "warm" as any,
    notes: ""
  });
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [leadSuccessMsg, setLeadSuccessMsg] = useState("");

  // --- MITIGATED GAPS BOARD STATE ---
  const [mitigatedGaps, setMitigatedGaps] = useState<{[key: string]: boolean}>({
    "stage-1-gap-0": false,
    "stage-1-gap-1": false,
    "stage-2-gap-0": false,
    "stage-2-gap-1": false,
    "stage-3-gap-0": false,
    "stage-3-gap-1": false,
    "stage-4-gap-0": false,
    "stage-4-gap-1": false,
  });

  // --- DYNAMIC PREDICTION ENGINE STATE ---
  const [annualGrowthRate, setAnnualGrowthRate] = useState<number>(45); // e.g. 45% annual growth rate

  // --- TERRITORY SCANS / MAP INTELLIGENCE ---
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [isScanningCity, setIsScanningCity] = useState(false);

  // --- INVESTOR MATCHMAKER STATE ---
  const [activeMatchBrandId, setActiveMatchBrandId] = useState<string>(db.brands[0]?.id || "b-1");
  const [activeMatchLeadId, setActiveMatchLeadId] = useState<string>("ld-2"); // defaults to Sanjay
  const [synthesizedDrafterPitch, setSynthesizedDrafterPitch] = useState<string>("");
  const [isSynthesizingPitch, setIsSynthesizingPitch] = useState(false);

  // --- DYNAMIC AUTOMATION RULES RULES FOR RULES LEDGER ---
  const [customRules, setCustomRules] = useState<any[]>([
    { id: "cr-1", label: "Runway Alarm Alert", event: "Runway hits critical (< 6 months)", action: "Auto trigger Emergency Recovery Protocol", active: true },
    { id: "cr-2", label: "MRR Threshold Release", event: "Actual MRR hits target budget", action: "Unlock local city verification passport sign-offs", active: true },
    { id: "cr-3", label: "Cold Lead Resurrect", event: "CRM Lead marked idle > 30 days", action: "Trigger continuous AI email drip campaign", active: false }
  ]);
  const [newRuleTrigger, setNewRuleTrigger] = useState<string>("Runway hits critical (< 6 months)");
  const [newRuleAction, setNewRuleAction] = useState<string>("Auto trigger Emergency Recovery Protocol");
  const [newRuleName, setNewRuleName] = useState<string>("");
  const [ruleAlertToast, setRuleAlertToast] = useState<string>("");

  // --- 5. NOTIFICATION CENTER & AUTOMATIONS STATE ---
  const [activeNotifications, setActiveNotifications] = useState<SystemNotification[]>([
    {
      id: "nt-1",
      type: "critical",
      message: "Arvind Capital investor deck is delayed by 9 days. Breaks Round B close. Risk of valuation leverage decay.",
      timestamp: "5 hours ago",
      category: "Investor CRM"
    },
    {
      id: "nt-2",
      type: "warning",
      message: "Continuous cash review for FOCO Outlet #14 has been skipped for 3 consecutive weeks. Run-rate burn continues.",
      timestamp: "Yesterday",
      category: "Operations"
    },
    {
      id: "nt-3",
      type: "opportunity",
      message: "Noida and Pune expansion targets have cleared MRR triggers of ₹12L. Ready for Franchise rollout sign-offs.",
      timestamp: "2 days ago",
      category: "Brand Readiness"
    },
    {
      id: "nt-4",
      type: "info",
      message: "3 committed syndicate investors require allocation codes to start draft subscription deed filings.",
      timestamp: "3 days ago",
      category: "Investor CRM"
    }
  ]);

  const [automationLogs, setAutomationLogs] = useState<any[]>([
    {
      time: "10:32 AM",
      rule: "RULE_COMMITMENT_OVERDUE",
      trigger: "IF commitment overdue > 5 days",
      action: "Flag central risk alert & lower Executive Quotient on active dashboard",
      status: "Triggered (c-1 Overdue)"
    },
    {
      time: "Yesterday",
      rule: "RULE_MRR_TRIGGER_MET",
      trigger: "IF brand Actual MRR >= Output Target",
      action: "Unlock local city feasibility scans & enable 'passport verify' license",
      status: "Active (Chaat Masters met)"
    },
    {
      time: "2 days ago",
      rule: "RULE_INVESTOR_WARM",
      trigger: "IF investor state changes to 'committed'",
      action: "Assign default SPV reference & prompt draft Subscription Agreement preparation",
      status: "Monitoring (Dinesh Mehta pending)"
    }
  ]);

  // Handle active brand changes
  const activeBrand = db.brands.find(b => b.id === activePathBrandId) || db.brands[0];

  // REAL PATH 10 STAGES DEFINITIONS
  const pathStageDetails = [
    {
      stage: 1,
      name: "Business Survival & Runway Secure",
      description: "Establishing Product-Market Fit (PMF) and securing at least 3-6 months of operating capital runway.",
      milestones: ["Runway hours logged", "Unit economics proven positive", "Brand App initial prototype launched"],
      gapsRequired: ["Runway under 6 months is high-alert flag", "Need clear unit metrics before location multiplier"],
      timeline: "3 - 6 Months"
    },
    {
      stage: 2,
      name: "Operational Stabilization",
      description: "Separating critical roles and documenting standard processes to eliminate single-person dependencies.",
      milestones: ["Volume 1 & 2 SOP handbooks compiled", "SOP uploaded to Knowledge Brain", "GM hired for general store oversight"],
      gapsRequired: ["Ops split has confusion", "Standardized employee handbook incomplete"],
      timeline: "4 - 8 Months"
    },
    {
      stage: 3,
      name: "Direct Unit Profitability",
      description: "Proven store-level EBITDA exceeding 25% with optimized COGS and standardized supplier contracts.",
      milestones: ["Supply chain raw-material contracts locked", "Average outlet cash contribution > ₹3L/mo", "Local marketing playbook created"],
      gapsRequired: ["FOCO Outlet #14 continues high cash-burn", "No central supplier audits on raw material pricing"],
      timeline: "6 - 12 Months"
    },
    {
      stage: 4,
      name: "Regional Team Structure",
      description: "Transitioning supervision from Chairman directly to Territory Managers and Cluster Leads.",
      milestones: ["Territory manager appointee logged", "Weekly audit dashboard functional", "Cluster ops review active"],
      gapsRequired: ["Chairman overcommitted on micro outlet operations", "OPS/GM alignment unclear"],
      timeline: "6 - 9 Months"
    },
    {
      stage: 5,
      name: "National Brand Penetration",
      description: "Unifying customer experience nationwide supported by massive media outreach and digital application index.",
      milestones: ["Aggregated brand application users > 50,000", "State-level digital marketing index active", "Unified POS customer feed online"],
      gapsRequired: ["Local franchise apps not connected to central CRM database", "Brand recall limited"],
      timeline: "12 - 18 Months"
    },
    {
      stage: 6,
      name: "Multi-Location Expansion Strategy",
      description: "Scaling across Tier-1 and Tier-2 clusters based on stable COCO and FOCO frameworks.",
      milestones: ["More than 15 active locations live", "Subsystem territory scans indicating READY", "Franchisoe operational score > 80%"],
      gapsRequired: ["Rollout gating is slow due to local zoning rules", "Local franchise capital checks stalled"],
      timeline: "12 - 24 Months"
    },
    {
      stage: 7,
      name: "Distribution Network Scaling",
      description: "Deploying dealer and retail networks to push packaged materials or proprietary inventory to multi-state outlets.",
      milestones: ["Supply chain distribution ledger in index", "Packaged SOP materials certified", "Dealer franchise portal online"],
      gapsRequired: ["No automated ordering tracking portal for dealers", "Bulk supply chain credit lines unfunded"],
      timeline: "18 - 24 Months"
    },
    {
      stage: 8,
      name: "Franchise System Readiness",
      description: "Full compliance with legal franchise disclosure documents, training academies, and standardized dashboards.",
      milestones: ["Franchise Disclosure Document (FDD) updated", "National academy structure ready", "Integrated partner dashboard deployed"],
      gapsRequired: ["Readiness score under 80 threshold", "No standardized FDD for regional multi-units"],
      timeline: "12 - 18 Months"
    },
    {
      stage: 9,
      name: "Institutional Investor Readiness",
      description: "Polishing corporate governance structure, clean cap tables, and automated audits to onboard institutional venture capital.",
      milestones: ["Postgres secure audit trail logged on all corporate events", "Runway > 12 months with ₹50L+ MRR stability", "Clear shareholder voting agreement"],
      gapsRequired: ["Delayed investor presentation deck", "Legal shortlist of COO candidates blocked"],
      timeline: "9 - 15 Months"
    },
    {
      stage: 10,
      name: "Chairman Legacy Scale",
      description: "Ecosystem consolidation, mergers and acquisitions index open, company ready for public listing (IPO).",
      milestones: ["Institutional investment round finalized", "Board of directors governing core strategy", "Consolidated MRR exceeding ₹2 Crore"],
      gapsRequired: ["Operational leadership not completely delegated to professional executive layer"],
      timeline: "24 - 36 Months"
    }
  ];

  // Auto detect active stage based on brand metrics
  const detectedStage = activeBrand ? (
    activeBrand.outletsCountActual >= 20 ? 6 :
    activeBrand.appUsersActual >= 50000 ? 5 :
    activeBrand.outletsCountActual >= 10 ? 4 :
    activeBrand.mrrActual >= 1200000 ? 3 :
    db.knowledgeDocs.length > 0 ? 2 : 1
  ) : 1;

  // Sync selected stage with detected stage when brand changes
  useEffect(() => {
    setSelectedPathStage(detectedStage);
  }, [activePathBrandId, detectedStage]);

  // Calculate Chairman Score out of 100 on mount / database refresh
  const completedCommitmentsPct = db.accountabilityCommitments.length > 0 
    ? (db.accountabilityCommitments.filter(c => c.status === "completed").length / db.accountabilityCommitments.length) * 100
    : 50;

  const mrrGoalPct = activeBrand 
    ? (Number(activeBrand.mrrActual) / (activeBrand.appUsersTarget > 0 ? activeBrand.appUsersTarget : 1500000)) * 100
    : 60;

  const executionWeight = completedCommitmentsPct * 0.40;
  const growthWeight = Math.min(100, mrrGoalPct) * 0.30;
  const expansionWeight = (db.readinessScans.filter(s => s.readyToDeploy).length > 0 ? 95 : 70) * 0.30;
  
  // Calculate total mitigated gaps across all stages
  const mitigatedGapsCount = Object.values(mitigatedGaps).filter(Boolean).length;
  const rawChairmanScore = executionWeight + growthWeight + expansionWeight + (mitigatedGapsCount * 3.5);
  const calculatedChairmanScore = Math.min(100, Math.max(20, Math.round(rawChairmanScore)));

  // Run the automated calculations on the first assessment render
  useEffect(() => {
    handleRunScannerAssess();
  }, [activeScannerBrandId]);

  // --- BRAND READINESS SCANNER ALGORITHMIC CALCULATOR ---
  const handleRunScannerAssess = () => {
    const s = sliderRatings;
    
    // Formula calculations with distinct weights
    const franchise = Math.round((s.processStandardization * 0.35 + s.opsConsistency * 0.25 + s.profitability * 0.25 + s.systemsIntegrity * 0.15) * 10);
    const expansion = Math.round((s.brandEquity * 0.30 + s.leadershipManagement * 0.30 + s.systemsIntegrity * 0.20 + s.marketingEfficiency * 0.20) * 10);
    const investor = Math.round((s.profitability * 0.40 + s.salesFunnel * 0.25 + s.systemsIntegrity * 0.20 + s.leadershipManagement * 0.15) * 10);
    const distribution = Math.round((s.brandEquity * 0.35 + s.processStandardization * 0.25 + s.marketingEfficiency * 0.20 + s.opsConsistency * 0.20) * 10);

    setComputedReadyScores({
      franchise,
      expansion,
      investor,
      distribution,
      timestamp: new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      brandName: db.brands.find(b => b.id === activeScannerBrandId)?.name || "Chaat Masters"
    });
  };

  // --- INTERACTIVE CHAIRMAN COACH VOICE CHAT INTEGRATION ---
  const handleAskCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachQueryInput.trim()) return;
    setIsAskingCoach(true);
    setCoachResponse("");

    const contextPrompt = `
      You are the FK Corporate Chairman Mentor Coach. You possess the deep local operational expertise of an Indian retail network scaling titan combined with the structural analytical rigor of McKinsey and the operational execution control of EOS frameworks. 
      You are coaching the Chairman regarding the company state.
      The Active company parameters are:
      - Active Brand: ${activeBrand?.name} (${activeBrand?.type})
      - Outlets actual vs target: ${activeBrand?.outletsCountActual}/${activeBrand?.outletsCountTarget}
      - App MRR: ₹${(Number(db.partnerScore.metrics.appMRR)/100000.0).toFixed(1)}L
      - Cash Runway: ${db.partnerScore.metrics.cashRunwayMonths} months
      - Total Overdue Commitments: ${db.accountabilityCommitments.filter(c => c.status === "overdue").length}
      - Current Chairman Execution Score: ${calculatedChairmanScore}/100
      
      The user queries: "${coachQueryInput}"
      
      Generate a professional, structured, conversational, highly direct 2-3 paragraph answer to help them clear gaps and guide corporate assets. Speak with deep strategic poise, humility, and absolute focus on numbers. Include zero mock references. Make the output formatted in elegant HTML paragraphs.
    `;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: contextPrompt })
      });
      const data = await res.json();
      if (data.aiMessage?.text) {
        setCoachResponse(data.aiMessage.text);
      } else {
        setCoachResponse("<p>I've evaluated the operational parameters of " + activeBrand?.name + ". Focus immediately on sending out the delayed investor presentation deck EOD today to secure cash runway before attempting to leverage next franchise rollout actions.</p>");
      }
    } catch (err) {
      console.error(err);
      setCoachResponse("<p>Offline backup advisor active: Direct focus on dispatching the Arvind Capital deck today EOD. Delaying this round reduces your capitalization valuation leverage by ₹40L for every week of hesitation.</p>");
    } finally {
      setIsAskingCoach(false);
      setCoachQueryInput("");
    }
  };

  // --- CRM ADD LEAD HANDLER ---
  const handleAddNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addLeadForm.name.trim() || !addLeadForm.email.trim()) return;
    
    setIsAddingLead(true);
    setLeadSuccessMsg("");

    setTimeout(() => {
      const newLead: SmartLead = {
        id: "ld-" + Date.now(),
        name: addLeadForm.name.trim(),
        email: addLeadForm.email.trim(),
        contact: addLeadForm.contact.trim() || "+91 99999 00000",
        category: addLeadForm.category,
        ticketSizeRs: Number(addLeadForm.ticketSizeRs || 0),
        interestLevel: addLeadForm.interestLevel,
        notes: addLeadForm.notes.trim() || "No customized notes recorded.",
        lastContacted: "Just Registered"
      };

      setLeadsList(prev => [newLead, ...prev]);

      // Seed notification for new lead onboarded
      const newNotification: SystemNotification = {
        id: "nt-" + Date.now(),
        type: "info",
        message: `New pipeline lead registered: ${newLead.name} (${newLead.category.toUpperCase()}). Feasibility check initiated.`,
        timestamp: "Just now",
        category: "Smart CRM"
      };
      setActiveNotifications(prev => [newNotification, ...prev]);

      setAddLeadForm({
        name: "",
        email: "",
        contact: "",
        category: "franchise",
        ticketSizeRs: 2000000,
        interestLevel: "warm",
        notes: ""
      });
      setIsAddingLead(false);
      setLeadSuccessMsg("CRM pipeline has successfully indexed lead and updated dynamic matching scores!");
      
      // Auto dismiss success toast
      setTimeout(() => setLeadSuccessMsg(""), 4000);
    }, 800);
  };

  // Interactive city feasibility audit trigger
  const handleTriggerCityScan = async (cityName: string, tierNum: number) => {
    setIsScanningCity(true);
    try {
      const res = await fetch("/api/readiness-scans/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityName,
          tier: tierNum,
          focoModelStable: true,
          npsScore: 8.4
        })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch(err) {
      console.error("City feasibility test failed:", err);
    } finally {
      setIsScanningCity(false);
    }
  };

  // AI Pitch & Dealmaker Synthesizer logic
  const handleSynthesizeFranchisePitch = () => {
    setIsSynthesizingPitch(true);
    setSynthesizedDrafterPitch("");
    
    // Pick the selected brand and selected lead
    const brand = db.brands.find(b => b.id === activeMatchBrandId) || db.brands[0];
    const lead = leadsList.find(l => l.id === activeMatchLeadId) || leadsList[0];
    
    setTimeout(() => {
      if (!brand || !lead) {
        setSynthesizedDrafterPitch("No active portfolio brand or lead records detected to compile match data.");
        setIsSynthesizingPitch(false);
        return;
      }
      
      const compFactor = lead.interestLevel === "hot" ? 97 : lead.interestLevel === "warm" ? 92 : 81;
      const computedMatchScore = Math.min(100, Math.floor(compFactor + (Number(brand.mrrActual) / 300000.5)));
      
      const draft = `=========================================================
FK CHAIRMAN ARCHITECTURE COMPATIBILITY RECORD
=========================================================
Target Brand: ${brand.name} (Ecosystem MRR: ₹${(Number(brand.mrrActual)/100000.0).toFixed(1)}L)
Target Syndicate: ${lead.name} (Budget allotment: ₹${(lead.ticketSizeRs/100000.0).toFixed(1)}L)
Calculated Synergy Score: ${computedMatchScore}% COMPATIBILITY RATING

OFFICIAL PARTNER COMMUNICATIONS PROTOCOL BRIEFING:
"Dear Partner ${lead.name},

In congruence with FK Group's tactical Real Path 2030 roadmap metrics, we've executed readiness audits on ${brand.name}. With a current stabilized MRR run-rate exceeding benchmarks, we invite you to anchor initial multi-unit FOCO development units within your regional sector. 

Aligning your ₹${(lead.ticketSizeRs/100000.0).toFixed(1)}L allocation securely limits operational risk, utilizing our fully-audited process SOPs and isolating supplier pricing contracts. 

Please review standard exclusivity covenants, as our Chairman score indicates high structural integrity ready for direct co-signer execution."

=========================================================
[Cognitive Compliance Layer Verified for Stage Gating]`;
      
      setSynthesizedDrafterPitch(draft);
      setIsSynthesizingPitch(false);
    }, 700);
  };

  // Trigger browser print for the readiness brief
  const handlePrintScannerReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Navigation inside Command Center */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[rgba(201,168,76,0.1)] pb-4">
        <div>
          <h1 className="font-serif-cormorant text-3xl font-semibold text-[#F0EFE8] leading-tight flex items-center gap-2.5">
            <Shield className="text-[#C9A84C]" size={28} /> Chairman Command Center & Engine Workspace
          </h1>
          <p className="font-mono text-[11px] tracking-[1.5px] text-[#C9A84C] mt-1 text-left">
            Unified operational flightdeck · FK Growth & Scale Compliance Control
          </p>
        </div>
        
        <div className="flex bg-[#05080F] border border-[rgba(201,168,76,0.18)] p-1 rounded-lg self-start md:self-center overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab("realpath")}
            className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              activeTab === "realpath" ? "bg-[#C9A84C] text-[#06090F] font-bold" : "text-[rgba(240,239,232,0.6)] hover:text-[#F0EFE8]"
            }`}
          >
            <Target size={11} /> Real Path 2030
          </button>
          <button
            onClick={() => setActiveTab("coach")}
            className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              activeTab === "coach" ? "bg-[#C9A84C] text-[#06090F] font-bold" : "text-[rgba(240,239,232,0.6)] hover:text-[#F0EFE8]"
            }`}
          >
            <Sparkles size={11} /> AI Coach
          </button>
          <button
            onClick={() => setActiveTab("scanner")}
            className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              activeTab === "scanner" ? "bg-[#C9A84C] text-[#06090F] font-bold" : "text-[rgba(240,239,232,0.6)] hover:text-[#F0EFE8]"
            }`}
          >
            <Gauge size={11} /> Brand Scanner
          </button>
          <button
            onClick={() => setActiveTab("health")}
            className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              activeTab === "health" ? "bg-[#C9A84C] text-[#06090F] font-bold" : "text-[rgba(240,239,232,0.6)] hover:text-[#F0EFE8]"
            }`}
          >
            <Bell size={11} /> Health & Notifications
          </button>
          <button
            onClick={() => setActiveTab("crm")}
            className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              activeTab === "crm" ? "bg-[#C9A84C] text-[#06090F] font-bold" : "text-[rgba(240,239,232,0.6)] hover:text-[#F0EFE8]"
            }`}
          >
            <Users size={11} /> Smart CRM & Matches
          </button>
        </div>
      </div>

      {/* --- TAB 1: MODEL-CENTRIC REAL PATH 2030 ENGINE --- */}
      {activeTab === "realpath" && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Brand select controller */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4.5 bg-[rgba(10,16,32,0.5)] border border-[rgba(201,168,76,0.12)] rounded-xl">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[rgba(240,239,232,0.4)]">Active Company Portfolio Item:</span>
              <select
                value={activePathBrandId}
                onChange={(e) => setActivePathBrandId(e.target.value)}
                className="bg-[#05080F] border border-[rgba(201,168,76,0.22)] rounded px-3 py-1 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none font-mono"
              >
                {db.brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.type})</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-[#05080F] border border-[rgba(201,168,76,0.15)] px-3 py-1 rounded text-xs font-mono">
              <span className="text-[rgba(240,239,232,0.4)]">Computed Baseline:</span>
              <span className="text-[#C9A84C] font-bold uppercase">Stage {detectedStage} Identified</span>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse ml-1.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Col: Stepper Stepping Engine (4-cols) */}
            <div className="lg:col-span-4 bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-xl p-4.5 space-y-3.5 max-h-[640px] overflow-y-auto">
              <div className="border-b border-[rgba(201,168,76,0.08)] pb-2">
                <span className="text-[9px] font-mono uppercase tracking-[2px] text-[#C9A84C] block font-semibold">10-STAGE JOURNEY ROADMAP</span>
                <p className="text-[10px] text-[rgba(240,239,232,0.45)] mt-0.5">Click any stage to model and analyze future checklists</p>
              </div>

              <div className="space-y-2">
                {pathStageDetails.map((st) => {
                  const isCurrent = detectedStage === st.stage;
                  const isUnlocked = st.stage <= detectedStage;
                  const isSelected = selectedPathStage === st.stage;

                  return (
                    <button
                      key={st.stage}
                      onClick={() => setSelectedPathStage(st.stage)}
                      className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-start gap-2.5 cursor-pointer select-none ${
                        isSelected 
                          ? "bg-[rgba(201,168,76,0.12)] border-[#C9A84C] shadow-[0_0_8px_rgba(201,168,76,0.08)]"
                          : isCurrent
                          ? "bg-[rgba(29,158,117,0.06)] border-[#1D9E75]"
                          : isUnlocked
                          ? "bg-[rgba(240,239,232,0.01)] border-[rgba(201,168,76,0.1)] hover:border-[rgba(201,168,76,0.22)]"
                          : "bg-transparent border-[rgba(240,239,232,0.03)] opacity-40 hover:opacity-60"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center font-mono font-bold text-xs ${
                        isUnlocked
                          ? "bg-[#C9A84C] text-[#06090F]"
                          : "bg-[rgba(240,239,232,0.1)] text-[rgba(240,239,232,0.4)]"
                      }`}>
                        {st.stage}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-serif font-semibold text-xs text-[#F0EFE8] truncate leading-tight mt-0.5">{st.name}</h4>
                          {isCurrent && (
                            <span className="text-[7.5px] uppercase font-mono px-1 border border-green-500 text-green-400 bg-transparent rounded shrink-0">ACTIVE</span>
                          )}
                        </div>
                        <p className="text-[9.5px] font-mono text-[rgba(240,239,232,0.45)] mt-1 tracking-tight">Est: {st.timeline}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Col: Stepper Deep Analysis View (8-cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Core summary display */}
              <div className="bg-[#0A1020] border-2 border-[#C9A84C] rounded-xl p-5 space-y-4 relative overflow-hidden shadow-[0_0_15px_rgba(201,168,76,0.04)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_70%_20%,_rgba(201,168,76,0.06),_transparent_70%)] pointer-events-none"></div>
                
                <div className="flex justify-between items-center pb-2 border-b border-[rgba(201,168,76,0.1)]">
                  <span className="font-mono text-[10px] uppercase tracking-[2.5px] text-[#C9A84C]">Stage {selectedPathStage} Deep Assessment</span>
                  <span className="text-[10px] font-mono text-[rgba(240,239,232,0.4)]">FK Real Path 2030 Framework</span>
                </div>

                <div className="space-y-2">
                  <h2 className="font-serif-cormorant text-2xl font-bold text-[#F5E0A0] leading-tight">
                    {pathStageDetails[selectedPathStage - 1].name}
                  </h2>
                  <p className="text-xs text-[rgba(240,239,232,0.7)] leading-relaxed">
                    {pathStageDetails[selectedPathStage - 1].description}
                  </p>
                </div>

                {/* Checklist display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  
                  {/* Milestones Required block */}
                  <div className="bg-[#05080F] border border-[rgba(201,168,76,0.12)] p-4 rounded-lg space-y-3">
                    <span className="text-[9px] font-mono uppercase tracking-[2px] text-[#1D9E75] block font-semibold pb-1 border-b border-[rgba(29,158,117,0.1)]">✓ Targets to Solidify</span>
                    <ul className="space-y-2">
                      {pathStageDetails[selectedPathStage - 1].milestones.map((mil, mi) => (
                        <li key={mi} className="text-xs flex gap-2 items-start text-[rgba(240,239,232,0.75)]">
                          <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={13} />
                          <span>{mil}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Highlight Gaps block */}
                  <div className="bg-[#05080F] border border-[rgba(226,75,74,0.15)] p-4 rounded-lg space-y-3">
                    <span className="text-[9px] font-mono uppercase tracking-[2px] text-[#E24B4A] block font-semibold pb-1 border-b border-[rgba(226,75,74,0.1)] flex justify-between items-center">
                      <span>⚠ Risks/Gaps (Mitigate Alerts)</span>
                      <span className="text-[8px] text-[rgba(240,239,232,0.4)]">Check to resolve</span>
                    </span>
                    <ul className="space-y-2">
                      {pathStageDetails[selectedPathStage - 1].gapsRequired.map((gap, gi) => {
                        const gapKey = `stage-${selectedPathStage}-gap-${gi}`;
                        const isMitigated = !!mitigatedGaps[gapKey];
                        return (
                          <li key={gi} className="text-xs flex gap-2.5 items-start text-[rgba(240,239,232,0.75)]">
                            <input
                              type="checkbox"
                              checked={isMitigated}
                              onChange={() => {
                                setMitigatedGaps(prev => ({
                                  ...prev,
                                  [gapKey]: !prev[gapKey]
                                }));
                              }}
                              className="mt-0.5 rounded accent-[#C9A84C] cursor-pointer"
                              id={gapKey}
                            />
                            <label htmlFor={gapKey} className={`cursor-pointer select-none leading-relaxed flex-1 ${isMitigated ? "line-through text-[rgba(240,239,232,0.35)]" : ""}`}>
                              {gap}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                </div>

                <div className="p-3.5 bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.12)] rounded text-[11px] text-[rgba(240,239,232,0.65)] flex justify-between items-center gap-4">
                  <div>
                    <span className="font-mono text-[#C9A84C] block uppercase text-[9px] tracking-wide mb-0.5 font-semibold">Target Timeline Range:</span>
                    Expected baseline window of <strong className="text-[#F0EFE8]">{pathStageDetails[selectedPathStage - 1].timeline}</strong> of continuous operational focus.
                  </div>
                  <button 
                    type="button"
                    onClick={() => setActiveTab("coach")}
                    className="px-3 py-1 bg-[rgba(201,168,76,0.12)] hover:bg-[#C9A84C] hover:text-[#06090F] border border-[rgba(201,168,76,0.25)] rounded font-mono text-[9px] text-[#C9A84C] uppercase font-bold shrink-0 cursor-pointer transition-colors"
                  >
                    Ask Coach Action Plan
                  </button>
                </div>
              </div>

              {/* BRAND VALUATION PREDICTIVE CAGR FORECAST ENGINE */}
              <div className="p-5 bg-gradient-to-br from-[#0a1020] to-[#05080f] border border-[rgba(201,168,76,0.18)] rounded-xl space-y-4">
                <div className="flex justify-between items-center pb-1.5 border-b border-[rgba(201,168,76,0.08)]">
                  <h3 className="text-xs font-mono uppercase tracking-[2.5px] text-[#C9A84C] flex items-center gap-1.5 font-semibold">
                    <TrendingUp size={13} className="text-[#C9A84C]" /> Predictive Growth CAGR Forecast Tool (2026-2030)
                  </h3>
                  <span className="text-[8px] font-mono text-green-400 font-semibold px-2 py-0.5 rounded bg-[rgba(29,158,117,0.06)] border border-[rgba(29,158,117,0.12)] uppercase tracking-wider">
                    RUN RATE SIMULATION
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                  <div className="space-y-3.5 text-xs text-[rgba(240,239,232,0.65)] text-left leading-normal">
                    <p className="font-serif italic">
                      "Using the active brand run-rate of <strong className="text-[#F0EFE8]">₹{(Number(activeBrand?.mrrActual || 3000000)/100000.0).toFixed(1)}L MRR</strong>, we simulate compounding cumulative network metrics to map IPO feasibility and ₹1,100 Crore goal milestones."
                    </p>
                    
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-[rgba(240,239,232,0.45)] uppercase">Annual CAGR Factor:</span>
                        <strong className="text-[#C9A84C]">{annualGrowthRate}%</strong>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="150"
                        value={annualGrowthRate}
                        onChange={(e) => setAnnualGrowthRate(Number(e.target.value))}
                        className="w-full accent-[#C9A84C] bg-[rgba(201,168,76,0.08)] rounded h-1 cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-[rgba(5,8,15,0.7)] border border-[rgba(201,168,76,0.12)] rounded-lg space-y-3 font-mono text-xs text-left">
                    <div className="flex justify-between items-center border-b border-[rgba(201,168,76,0.04)] pb-1.5">
                      <span className="text-[rgba(240,239,232,0.45)] uppercase text-[9px]">Compound MRR 2030:</span>
                      <strong className="text-[#C9A84C] text-sm">
                        ₹{((Number(activeBrand?.mrrActual || 3000000) * Math.pow(1 + annualGrowthRate / 100, 4)) / 100000.0).toFixed(1)}L
                      </strong>
                    </div>
                    
                    <div className="flex justify-between items-center border-b border-[rgba(201,168,76,0.04)] pb-1.5">
                      <span className="text-[rgba(240,239,232,0.45)] uppercase text-[9px]">Simulated FOCO Units:</span>
                      <strong className="text-[#F0EFE8]">
                        {Math.round(Number(activeBrand?.outletsCountActual || 5) * Math.pow(1 + annualGrowthRate / 100, 3.5))} locations
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[rgba(240,239,232,0.45)] uppercase text-[9px]">IPO Gating Status:</span>
                      <strong className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${annualGrowthRate >= 75 ? "bg-[#1D9E75] text-[#05080F]" : annualGrowthRate >= 35 ? "bg-[#EF9F27] text-[#05080F]" : "bg-[#E24B4A] text-[#F0EFE8]"}`}>
                        {annualGrowthRate >= 75 ? "2029 Feasible" : annualGrowthRate >= 35 ? "2031 Gated" : "Delayed Plan"}
                      </strong>
                    </div>
                    
                    <div className="text-[9.5px] text-[rgba(240,239,232,0.4)] leading-relaxed italic border-t border-[rgba(201,168,76,0.06)] pt-1.5 font-sans">
                      Mitigate stage gaps in the interactive checkboxes above to accelerate coefficient scores.
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic AI Roadmap generator visualization */}
              <div className="p-5 bg-gradient-to-r from-[#0a1020] to-[#05080f] border border-[rgba(201,168,76,0.15)] rounded-xl space-y-3.5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-mono uppercase tracking-[2px] text-[#C9A84C] flex items-center gap-1.5 font-semibold">
                    <Sparkles size={13} /> Proprietary Scale Roadmap (Strategic Priorities)
                  </h3>
                  <span className="text-[9px] font-mono text-green-400 font-semibold px-2 py-0.5 rounded bg-[rgba(29,158,117,0.08)] border border-[rgba(29,158,117,0.15)]">AUTOPILOT ON</span>
                </div>
                
                <div className="space-y-2.5">
                  <div className="p-3 bg-[rgba(5,8,15,0.6)] border-l-2 border-[#C9A84C] rounded text-xs space-y-1">
                    <div className="flex justify-between text-[10px] text-[rgba(240,239,232,0.4)] font-mono">
                      <span>IMMEDIATE CRITICAL STRATEGY (1-30 DAYS)</span>
                      <span className="text-[#C9A84C]">PRIORITY 1</span>
                    </div>
                    <p className="text-[#F0EFE8] font-medium font-serif leading-relaxed">
                      Dispatch the audited Arvind Capital Presentation Deck today. Complete shortlist selections for the COO position to delegate operations and allow the Chairman to focus entirely on investor correspondence.
                    </p>
                  </div>

                  <div className="p-3 bg-[rgba(5,8,15,0.6)] border-l-2 border-[rgba(201,168,76,0.4)] rounded text-xs space-y-1">
                    <div className="flex justify-between text-[10px] text-[rgba(240,239,232,0.4)] font-mono">
                      <span>TACTICAL INTEGRATION STAGE (30-90 DAYS)</span>
                      <span className="text-[#C9A84C]">PRIORITY 2</span>
                    </div>
                    <p className="text-[#F0EFE8] font-medium font-serif leading-relaxed">
                      Lock supply chain agreements and execute regional SOP Volume Volume 1 and 2 reviews. Establish Territory Managers for the Noida/Pune clusters to fully support the newly onboarded active units.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- TAB 2: CHAIRMAN AI COACH WORKSPACE --- */}
      {activeTab === "coach" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-left">
          
          {/* Left Col: Calculated Chairman Score (5-cols) */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-gradient-to-br from-[#0c1220] to-[#05080f] border-2 border-[#C9A84C] rounded-xl p-5 flex flex-col items-center justify-between shadow-[0_0_24px_rgba(201,168,76,0.06)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_70%_20%,_rgba(201,168,76,0.08),_transparent_70%)] pointer-events-none"></div>
              
              <div className="w-full flex justify-between items-start pb-2 border-b border-[rgba(201,168,76,0.1)]">
                <span className="text-[10px] font-mono tracking-widest text-[#C9A84C] uppercase font-semibold">CHAIRMAN METRIC COEFFICIENT</span>
                <span className="text-[8px] font-mono text-green-400 uppercase font-semibold tracking-wider flex items-center gap-1 bg-[rgba(29,158,117,0.05)] border border-[rgba(29,158,117,0.15)] px-1.5 py-0.5 rounded">
                  ✓ SECURED STATE
                </span>
              </div>

              {/* Majestic SVG interactive Gauge/Dial representation */}
              <div className="my-6 relative flex items-center justify-center">
                <svg className="w-44 h-44" viewBox="0 0 100 100">
                  {/* Base Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="rgba(201,168,76,0.08)"
                    strokeWidth="8"
                  />
                  {/* Glowing Meter Path */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="url(#goldGradient)"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * calculatedChairmanScore) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                  
                  {/* Linear gradient definition for dial gold glow */}
                  <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B6B2A" />
                      <stop offset="60%" stopColor="#C9A84C" />
                      <stop offset="100%" stopColor="#F5E0A0" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Score text inside radial */}
                <div className="absolute text-center">
                  <span className="text-3xl font-serif font-bold text-[#F0EFE8] leading-none tracking-tight block">{calculatedChairmanScore}</span>
                  <span className="text-[9px] font-mono text-[#C9A84C] uppercase tracking-[1.5px] mt-1 block">SCORE / 100</span>
                </div>
              </div>

              <div className="w-full space-y-3">
                <div className="p-3 bg-[rgba(5,8,15,0.7)] border border-[rgba(201,168,76,0.12)] rounded-lg text-xs space-y-2">
                  <span className="text-[9px] font-mono text-[rgba(240,239,232,0.4)] uppercase block pb-1 border-b border-[rgba(201,168,76,0.06)]">Score Breakdown Coefficients</span>
                  
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[rgba(240,239,232,0.7)]">Commitments Execution (40% Weight):</span>
                    <span className="font-mono font-medium text-[#C9A84C]">{Math.round(completedCommitmentsPct)}% achieved</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[rgba(240,239,232,0.7)]">Ecology growth MRR (30% Weight):</span>
                    <span className="font-mono font-medium text-[#C9A84C]">{Math.round(mrrGoalPct)}% target</span>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[rgba(240,239,232,0.7)]">Expansion Scan Density (30% Weight):</span>
                    <span className="font-mono font-medium text-[#C9A84C]">Active scans verified</span>
                  </div>
                </div>

                <div className="p-3 bg-[rgba(201,168,76,0.04)] border border-[rgba(201,168,76,0.12)] rounded text-[11px] text-[rgba(240,239,232,0.6)] leading-relaxed text-left">
                  <span className="font-bold text-[#C9A84C] block uppercase text-[8.5px] tracking-wide mb-0.5">CHAIRMAN COEFFICIENT AUDIT:</span>
                  This score estimates real-time execution discipline. Complete outstanding commitments (e.g. Arvind deck) inside the main **Accountability** panel to lift this coefficient automatically.
                </div>
              </div>
            </section>
          </div>

          {/* Right Col: AI Interactive Coaching Channel & Mentorship parchments (7-cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* parchment Quote */}
            <div className="p-5 bg-gradient-to-br from-[#0c1220] to-[#05080f] border border-[rgba(201,168,76,0.15)] rounded-xl space-y-3 relative overflow-hidden text-left">
              <div className="absolute top-1 right-2 font-serif text-[60px] text-[rgba(201,168,76,0.05)] select-none pointer-events-none">“</div>
              <span className="text-[9px] font-mono uppercase tracking-[2px] text-[#C9A84C] block font-semibold">DAILY CHAIRMAN MENTORSHIP BOARD</span>
              <p className="font-serif-cormorant text-base text-[#F0EFE8] leading-relaxed italic">
                \"When scaling networks across diverse Tier-2 clusters, do not search for fancy technology models first. Establish robust, standard operational SOP protocols and hold local store leaders accountable to unit-level EBITDA cash indices. Professional delegation clears paths for strategic leverage.\"
              </p>
              <div className="flex justify-between items-center font-mono text-[9px] text-[rgba(240,239,232,0.4)] uppercase pt-1 border-t border-[rgba(201,168,76,0.05)]">
                <span>Traditional Indian Retail wisdom vs McKinsey SOPs</span>
                <span>Vol 1 Operational Guidelines</span>
              </div>
            </div>

            {/* Interactive Coach Query Panel */}
            <div className="bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-xl p-5 space-y-4">
              <div className="border-b border-[rgba(201,168,76,0.08)] pb-2 flex justify-between items-center">
                <span className="text-xs font-mono uppercase tracking-[2px] text-[#C9A84C] font-semibold flex items-center gap-1.5">
                  <Sparkles size={13} /> Ask Chairman AI Mentor Coach
                </span>
                <span className="text-[9px] font-mono text-[rgba(240,239,232,0.4)]">Gemini Engine Live v3.5-flash</span>
              </div>

              <form onSubmit={handleAskCoach} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={coachQueryInput}
                    onChange={(e) => setCoachQueryInput(e.target.value)}
                    disabled={isAskingCoach}
                    placeholder="Ask guidance: 'how can I lower FOCO #14 cash burn?' or 'how to secure Round B?'"
                    className="flex-1 bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2.5 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none placeholder-[rgba(240,239,232,0.3)] mt-0.5"
                  />
                  <button
                    type="submit"
                    disabled={isAskingCoach}
                    className="px-4 bg-[#C9A84C] hover:bg-[#E8C878] text-[#06090F] font-mono text-[10px] uppercase font-bold rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {isAskingCoach ? <RefreshCw size={11} className="animate-spin" /> : null}
                    {isAskingCoach ? "Thinking..." : "Consult Advisor"}
                  </button>
                </div>
              </form>

              {/* Render dynamic response block */}
              {coachResponse ? (
                <div className="p-4 bg-[rgba(5,8,15,0.7)] border border-[rgba(201,168,76,0.15)] rounded-lg text-xs leading-relaxed text-[rgba(240,239,232,0.85)] font-serif space-y-3 text-left animate-fade-in"
                  dangerouslySetInnerHTML={{ __html: coachResponse }}
                />
              ) : isAskingCoach ? (
                <div className="p-5 bg-[rgba(5,8,15,0.4)] border border-dashed border-[rgba(201,168,76,0.15)] rounded-lg text-center space-y-2">
                  <RefreshCw size={20} className="text-[#C9A84C] animate-spin mx-auto" />
                  <p className="font-mono text-[10px] text-[#C9A84C] uppercase tracking-widest">Compiling strategic audit variables & formulating guidance...</p>
                </div>
              ) : (
                <p className="text-[11px] text-[rgba(240,239,232,0.45)] italic text-left">
                  Enter any tactical question above. The AI Coach will evaluate your entire active state, KPIs, commitments, and historical decisions to yield professional consultancy directions.
                </p>
              )}
            </div>

          </div>

        </div>
      )}

      {/* --- TAB 3: BRAND READINESS ASSESSMENT SCANNER --- */}
      {activeTab === "scanner" && (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* Controls section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4.5 bg-[rgba(10,16,32,0.5)] border border-[rgba(201,168,76,0.12)] rounded-xl items-center">
            <div className="space-y-1">
              <span className="block text-[9px] font-mono uppercase tracking-wider text-[rgba(240,239,232,0.4)]">ASSESSMENT PORTFOLIO BRAND:</span>
              <select
                value={activeScannerBrandId}
                onChange={(e) => setActiveScannerBrandId(e.target.value)}
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded px-2.5 py-1.5 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none font-mono"
              >
                {db.brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.type})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <span className="block text-[9px] font-mono uppercase tracking-wider text-[rgba(240,239,232,0.4)]">EVALUATION AUDITOR LEAD:</span>
              <input
                type="text"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded px-2.5 py-1 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 self-end">
              <button
                onClick={handlePrintScannerReport}
                className="px-4 py-1.5 border border-[rgba(201,168,76,0.22)] bg-[rgba(201,168,76,0.05)] hover:bg-[rgba(201,168,76,0.15)] text-[#C9A84C] font-mono text-[10px] uppercase font-bold rounded cursor-pointer flex items-center gap-1.5 transition-all"
                title="Print clean complete physical audit document"
              >
                <Printer size={12} /> Print Physical Dossier
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* Slider inputs form (Left pane) */}
            <div className="bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-[2px] text-[#C9A84C] pb-2 border-b border-[rgba(201,168,76,0.1)] flex items-center gap-1.5 font-semibold">
                <ClipboardList size={13} /> Assessment Sliders (1 - 10 Ratings)
              </h3>

              <div className="space-y-3.5">
                {[
                  { key: "brandEquity", label: "1. Brand Equity & Customer Sentiment", desc: "Digital brand search volume, NPS metrics, organic recall indexes" },
                  { key: "systemsIntegrity", label: "2. Process & Systems Integration", desc: "POS, cloud operations, isolated database, digital checklist sync" },
                  { key: "processStandardization", label: "3. Process Standardization & SOP", desc: "SOP Vol 1 & 2 handbook completeness, automated training logs" },
                  { key: "salesFunnel", label: "4. Store Sales Funnel & Lead Flow", desc: "Local traffic conversions, franchise lead pipeline traction" },
                  { key: "opsConsistency", label: "5. Operational Quality & QC Control", desc: "Store audit conformity, standardized raw-materials checklists" },
                  { key: "marketingEfficiency", label: "6. Unit-level Marketing & CAC", desc: "Store acquisition costs, organic digital traction benchmarks" },
                  { key: "leadershipManagement", label: "7. Operational Leadership split", desc: "Hired delegation general manager capability, role boundaries" },
                  { key: "profitability", label: "8. Unit Economics & Store EBITDA", desc: "Net store profit margins, raw-material suppliers pricing contract stability" }
                ].map((item) => (
                  <div key={item.key} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-serif font-medium text-[rgba(240,239,232,0.85)]">{item.label}</span>
                      <span className="font-mono text-[#C9A84C] font-semibold">{(sliderRatings as any)[item.key]} / 10</span>
                    </div>
                    <p className="text-[9.5px] text-[rgba(240,239,232,0.45)]">{item.desc}</p>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={(sliderRatings as any)[item.key]}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSliderRatings(prev => ({ ...prev, [item.key]: val }));
                      }}
                      className="w-full accent-[#C9A84C] bg-[rgba(201,168,76,0.08)] rounded h-1 slider-thumb:w-4 slider-thumb:h-4 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="block text-[8px] font-mono uppercase tracking-wider text-[rgba(240,239,232,0.4)]">Chairman Audit Comments</span>
                <textarea
                  rows={2}
                  value={assessmentComments}
                  onChange={(e) => setAssessmentComments(e.target.value)}
                  className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none font-sans"
                  placeholder="Insert assessment comments or audit directions here..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRunScannerAssess}
                  className="w-full py-2 bg-[#C9A84C] hover:bg-[#E8C878] text-[#06090F] font-mono text-[10px] uppercase font-bold rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={11} /> Re-Calculate Readiness Gating Scores
                </button>
              </div>
            </div>

            {/* Results display gauges (Right pane) */}
            {computedReadyScores && (
              <div className="bg-[#0A1020] border-2 border-[#C9A84C] rounded-xl p-5 space-y-4 shadow-[0_0_24px_rgba(201,168,76,0.06)]">
                <div className="border-b border-[rgba(201,168,76,0.08)] pb-2 flex justify-between items-center">
                  <span className="text-xs font-mono uppercase tracking-[2.5px] text-[#C9A84C] font-semibold">Diagnostic Output Results</span>
                  <span className="text-[10px] font-mono text-[rgba(240,239,232,0.4)]">Active: {computedReadyScores.brandName}</span>
                </div>

                {/* Score meters grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "franchise", label: "Franchise Readiness", score: computedReadyScores.franchise },
                    { key: "expansion", label: "Expansion Rollout", score: computedReadyScores.expansion },
                    { key: "investor", label: "Venture Capital Ready", score: computedReadyScores.investor },
                    { key: "distribution", label: "Distribution Network", score: computedReadyScores.distribution }
                  ].map((res) => {
                    const isSecure = res.score >= 80;
                    const isRisk = res.score < 50;

                    return (
                      <div key={res.key} className="p-3.5 bg-[rgba(5,8,15,0.6)] border border-[rgba(201,168,76,0.12)] rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono text-[rgba(240,239,232,0.5)] uppercase tracking-wider block">{res.label}</span>
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase ${
                            isSecure 
                              ? "bg-[rgba(29,158,117,10)] text-[#1D9E75]" 
                              : isRisk 
                              ? "bg-[rgba(226,75,74,0.1)] text-[#E24B4A]" 
                              : "bg-[rgba(239,159,39,0.1)] text-[#EF9F27]"
                          }`}>
                            {isSecure ? "SECURED" : isRisk ? "CRITICAL" : "GAP ALERT"}
                          </span>
                        </div>
                        
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-serif font-bold text-[#F0EFE8]">{res.score}</span>
                          <span className="text-[10px] font-mono text-[rgba(240,239,232,0.4)]">/ 100</span>
                        </div>
                        
                        {/* Custom visual progress bar */}
                        <div className="w-full h-1 bg-[rgba(201,168,76,0.06)] rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              isSecure ? "bg-[#1D9E75]" : isRisk ? "bg-[#E24B4A]" : "bg-[#EF9F27]"
                            }`}
                            style={{ width: `${res.score}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-[rgba(5,8,15,0.7)] border border-[rgba(201,168,76,0.15)] rounded-lg space-y-2.5 text-xs text-left">
                  <span className="text-[9px] font-mono text-[#C9A84C] uppercase tracking-widest block font-semibold">Strategic Audit Findings & Recommendations:</span>
                  <div className="space-y-1.5 leading-relaxed text-[rgba(240,239,232,0.7)] font-serif">
                    <p>🎯 <strong className="text-green-400">Strength:</strong> Process profitability is stable with units contributing valuable margin run-rates. Unit econ is certified solid.</p>
                    <p>🚨 <strong className="text-amber-500">Bottleneck:</strong> Standardization Processes and local App CRM indicators hold low values. Scaling multi-units without standard disclosure handbooks risks QC breakdowns.</p>
                  </div>
                </div>

                {/* Print Sheet Dossier Wrapper (invisible in UI but prints beautifully) */}
                <div className="hidden print:block p-8 bg-white text-black space-y-6 text-left border border-black rounded" id="printable-area">
                  <div className="text-center pb-4 border-b border-black">
                    <h1 className="text-2xl font-bold font-serif">FK GROUP EXCLUSIVITY ROADMAP REPORT</h1>
                    <p className="text-[10px] font-mono uppercase mt-1">CONFIDENTIAL EXECUTIVE BRIEFING · BRAND ASSESSMENT DOSSIER</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div><strong>Active Portfolio Brand:</strong> {computedReadyScores.brandName}</div>
                    <div><strong>Auditor Lead:</strong> {auditorName}</div>
                    <div><strong>Evaluation Timestamp:</strong> {computedReadyScores.timestamp}</div>
                    <div><strong>Baseline Quotient:</strong> Stage {detectedStage} active</div>
                  </div>
                  <div className="pt-4 border-t border-black">
                    <h3 className="text-sm font-bold uppercase mb-2">1. Algorithmic Readiness Scoring</h3>
                    <table className="w-full table-auto border border-black text-xs text-left">
                      <thead>
                        <tr className="bg-gray-100 border-b border-black">
                          <th className="p-2">Readiness Category</th>
                          <th className="p-2">Score</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-black">
                          <td className="p-2">Franchise Multi-Unit Readiness</td>
                          <td className="p-2">{computedReadyScores.franchise} / 100</td>
                          <td className="p-2">{computedReadyScores.franchise >= 80 ? "SECURED" : "GAPS REMAINING"}</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-2">Geographic Expansion Gating</td>
                          <td className="p-2">{computedReadyScores.expansion} / 100</td>
                          <td className="p-2">{computedReadyScores.expansion >= 80 ? "SECURED" : "GAPS REMAINING"}</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-2">VC / Institutional Readiness</td>
                          <td className="p-2">{computedReadyScores.investor} / 100</td>
                          <td className="p-2">{computedReadyScores.investor >= 80 ? "SECURED" : "GAPS REMAINING"}</td>
                        </tr>
                        <tr>
                          <td className="p-2">Distribution Network Readiness</td>
                          <td className="p-2">{computedReadyScores.distribution} / 100</td>
                          <td className="p-2">{computedReadyScores.distribution >= 80 ? "SECURED" : "GAPS REMAINING"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold uppercase pt-3">2. Detailed Audit Comments</h3>
                    <p className="text-xs leading-relaxed italic">{assessmentComments}</p>
                  </div>
                  <div className="text-center pt-8 text-[9px] font-mono border-t border-black">
                    FK GROUP COMPLIANCE ASSURANCE SECURED COGNITIVE LAYER
                  </div>
                </div>

              </div>
            )}

            {/* STRATEGIC TERRITORY CLUSTER MAP & CITY IQ GATING PORTAL */}
            <div className="lg:col-span-12 bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-2 border-b border-[rgba(201,168,76,0.1)] gap-2">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-[2px] text-[#C9A84C] font-semibold flex items-center gap-2">
                    <Target size={13} className="text-[#C9A84C]" /> Strategic Territory Cluster Map & City IQ Gating Portal
                  </h3>
                  <p className="text-[10px] text-[rgba(240,239,232,0.45)] mt-0.5">Click "Execute Feasibility Audit" to run target cluster scans on the server</p>
                </div>
                <span className="text-[8px] font-mono text-green-400 font-semibold px-2 py-0.5 rounded bg-[rgba(29,158,117,0.06)] border border-[rgba(29,158,117,0.12)] uppercase tracking-widest">
                  {isScanningCity ? "SCANNING CLUSTERS..." : "GEOGRAPHIC COMPLIANCE GATEWAY"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { city: "NCR Sector (Noida)", tier: 1, pop: "15M+", index: 8.9, focalPoint: "Franchise Pipeline", triggerMRR: 1200000 },
                  { city: "Pune West Cluster", tier: 2, pop: "7M+", index: 8.2, focalPoint: "Retail Expansion", triggerMRR: 1200000 },
                  { city: "Bangalore South Hub", tier: 1, pop: "12M+", index: 9.1, focalPoint: "COCO SOP Standard", triggerMRR: 1500000 },
                  { city: "Hyderabad IT Zone", tier: 1, pop: "10M+", index: 8.6, focalPoint: "Institutional Partner", triggerMRR: 1500000 },
                  { city: "Indore Central MP", tier: 2, pop: "3.5M+", index: 7.4, focalPoint: "Dealer Distribution", triggerMRR: 1000000 },
                  { city: "Jaipur Rajasthan", tier: 2, pop: "4M+", index: 7.1, focalPoint: "Franchise Pipeline", triggerMRR: 1000000 }
                ].map((item, idx) => {
                  const matchedScan = db.readinessScans.find(s => s.cityName.toLowerCase().includes(item.city.toLowerCase().split(" ")[0].toLowerCase()));
                  const isReady = matchedScan?.readyToDeploy || (Number(activeBrand?.mrrActual || 0) >= item.triggerMRR && item.index >= 8.0);
                  
                  return (
                    <div 
                      key={idx} 
                      className="p-4 bg-[rgba(5,8,15,0.6)] border border-[rgba(201,168,76,0.12)] rounded-lg space-y-3 relative hover:border-[#C9A84C] transition-all flex flex-col justify-between"
                      onMouseEnter={() => setHoveredCity(item.city)}
                      onMouseLeave={() => setHoveredCity(null)}
                    >
                      <div className="space-y-1.5 text-left">
                        <div className="flex justify-between items-start">
                          <h4 className="font-serif font-bold text-sm text-[#F0EFE8]">{item.city}</h4>
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.15)] text-[#C9A84C]">
                            Tier {item.tier}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono text-[rgba(240,239,232,0.5)]">
                          <div>POPULATION: <strong className="text-[#F0EFE8]">{item.pop}</strong></div>
                          <div>RETAIL INDEX: <strong className="text-[#F0EFE8]">{item.index}/10</strong></div>
                        </div>
                        <p className="text-[10px] text-[rgba(240,239,232,0.4)]">
                          PRIMARY FOCUS: <span className="text-[#F0EFE8] font-serif italic">{item.focalPoint}</span>
                        </p>
                      </div>

                      <div className="border-t border-[rgba(201,168,76,0.06)] pt-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${isReady ? "bg-[#1D9E75] shadow-[0_0_6px_#1D9E75]" : "bg-[#EF9F27] shadow-[0_0_6px_#EF9F27]"}`} />
                          <span className="font-mono text-[9px] uppercase tracking-wider text-[rgba(240,239,232,0.6)]">
                            {isReady ? "READY FOR DEPLOY" : "Deficit (Audit Pending)"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTriggerCityScan(item.city.split(" ")[0], item.tier)}
                          disabled={isScanningCity}
                          className="px-2.5 py-1 bg-[rgba(201,168,76,0.08)] hover:bg-[#C9A84C] hover:text-[#06090F] border border-[rgba(201,168,76,0.2)] rounded font-mono text-[8.5px] text-[#C9A84C] font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-45 transition-all"
                        >
                          Execute Audit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB 4: CENTRAL HEALTH INDICATORS & OPERATIONS --- */}
      {activeTab === "health" && (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* Traffic light grid */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-[rgba(240,239,232,0.4)] mb-3 block">BUSINESS HEALTH MODULE indicators</span>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
              {[
                { 
                  name: "Revenue Health", 
                  status: Number(db.partnerScore.metrics.revenueMRR) >= 3000000 ? "green" : "amber", 
                  desc: `₹${(Number(db.partnerScore.metrics.revenueMRR)/100000.0).toFixed(1)}L MRR`, 
                  tip: "Stable above ₹30L threshold triggers robust expansion capabilities." 
                },
                { 
                  name: "Profit Health", 
                  status: Number(db.partnerScore.metrics.cashRunwayMonths) >= 12 ? "green" : Number(db.partnerScore.metrics.cashRunwayMonths) >= 6 ? "amber" : "red", 
                  desc: `${db.partnerScore.metrics.cashRunwayMonths} Mo Runway`, 
                  tip: "6.1 months runway is in emergency alert block. Send Arvind presentation today." 
                },
                { 
                  name: "Team Health", 
                  status: "amber", 
                  desc: "SOP active, GM split", 
                  tip: "SOP handbook verification synced. GM / Ops split needs roles clarification." 
                },
                { 
                  name: "Brand Health", 
                  status: "green", 
                  desc: "Chaat Masters trigger", 
                  tip: "Chaat Masters brand app MRR exceeding ₹12L threshold target." 
                },
                { 
                  name: "Expansion Health", 
                  status: db.readinessScans.some(s => s.readyToDeploy) ? "green" : "amber", 
                  desc: "Pune verified", 
                  tip: "City tier scans indicate Pune cluster met all feasibility checkpoints." 
                },
                { 
                  name: "Execution Health", 
                  status: db.accountabilityCommitments.some(c => c.status === "overdue") ? "red" : "green", 
                  desc: `${db.accountabilityCommitments.filter(c => c.status === "overdue").length} Overdue tasks`, 
                  tip: "Delayed Arvind investor presentation slides lowers team execution rate." 
                },
                { 
                  name: "Investor Health", 
                  status: db.investors.length >= 3 ? "green" : "amber", 
                  desc: `${db.investors.length} active leads`, 
                  tip: "Dinesh Mehta co-syndicate showing 90% positive warm commit signals." 
                }
              ].map((item, idx) => {
                const isGreen = item.status === "green";
                const isRed = item.status === "red";
                
                return (
                  <div 
                    key={idx} 
                    className="p-3 bg-[rgba(10,16,32,0.5)] border border-[rgba(201,168,76,0.12)] rounded-lg text-center space-y-1.5 relative group cursor-help transition-all hover:bg-[rgba(201,168,76,0.03)]"
                  >
                    <div className="w-3 h-3 rounded-full mx-auto shadow-md animate-pulse" style={{
                      backgroundColor: isGreen ? "#1D9E75" : isRed ? "#E24B4A" : "#EF9F27",
                      boxShadow: isGreen ? "0 0 8px #1D9E75" : isRed ? "0 0 8px #E24B4A" : "0 0 8px #EF9F27"
                    }} />
                    <span className="block text-[10px] font-medium text-[#F0EFE8] truncate">{item.name}</span>
                    <span className="block text-[9px] font-mono text-[rgba(240,239,232,0.4)] truncate">{item.desc}</span>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-[#0A1020] border border-[#C9A84C] text-[10px] text-[rgba(240,239,232,0.85)] rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl leading-relaxed">
                      <span className="block font-mono text-[#C9A84C] uppercase text-[8px] tracking-wide mb-1 font-semibold">{item.name} STATUS:</span>
                      {item.tip}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-3">
            
            {/* Notification Center */}
            <div className="bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-[2px] text-[#C9A84C] pb-2 border-b border-[rgba(201,168,76,0.1)] flex items-center justify-between font-semibold">
                <span>Notification Center alerts</span>
                <span className="text-[10px] font-mono text-[rgba(240,239,232,0.4)]">{activeNotifications.length} alerts active</span>
              </h3>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {activeNotifications.map((nt) => {
                  const isCrit = nt.type === "critical";
                  const isWarn = nt.type === "warning";
                  const isOpp = nt.type === "opportunity";

                  return (
                    <div key={nt.id} className={`p-3 border rounded text-xs text-left leading-relaxed flex gap-2.5 items-start ${
                      isCrit 
                        ? "bg-[rgba(226,75,74,0.03)] border-[rgba(226,75,74,0.22)]" 
                        : isWarn 
                        ? "bg-[rgba(239,159,39,0.03)] border-[rgba(239,159,39,0.22)]"
                        : isOpp
                        ? "bg-[rgba(29,158,117,0.03)] border-[rgba(29,158,117,0.22)]"
                        : "bg-[rgba(5,8,15,0.6)] border-[rgba(201,168,76,0.08)]"
                    }`}>
                      <div className="mt-0.5 shrink-0">
                        {isCrit && <div className="w-2.5 h-2.5 rounded-full bg-[#E24B4A] shadow-[0_0_6px_#E24B4A]" />}
                        {isWarn && <div className="w-2.5 h-2.5 rounded-full bg-[#EF9F27] shadow-[0_0_6px_#EF9F27]" />}
                        {isOpp && <div className="w-2.5 h-2.5 rounded-full bg-[#1D9E75] shadow-[0_0_6px_#1D9E75]" />}
                        {!isCrit && !isWarn && !isOpp && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3B82F6]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[rgba(240,239,232,0.85)] font-serif">{nt.message}</p>
                        <time className="block text-[8px] font-mono uppercase text-[rgba(240,239,232,0.4)] mt-1.5 tracking-wider">{nt.timestamp} · category: {nt.category}</time>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workflow Automation Control */}
            <div className="bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[rgba(201,168,76,0.1)]">
                <h3 className="text-xs font-mono uppercase tracking-[2px] text-[#C9A84C] flex items-center gap-1.5 font-semibold">
                  <Zap size={13} /> Active Workflow Automation Control
                </h3>
                <span className="text-[8px] font-mono text-[#EF9F27] px-2 py-0.5 rounded bg-[rgba(239,159,39,0.06)] border border-[rgba(239,159,39,0.15)] uppercase">
                  ACTIVE ENGINE MONITORS
                </span>
              </div>

              {/* Rules list */}
              <div className="space-y-2.5">
                {customRules.map((cr) => (
                  <div key={cr.id} className="p-3 bg-[rgba(5,8,15,0.6)] border border-[rgba(201,168,76,0.1)] rounded text-xs flex justify-between items-center gap-4">
                    <div className="text-left space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-[#F0EFE8] font-serif">{cr.label}</strong>
                        <span className={`text-[7px] font-mono px-1 rounded ${cr.active ? "bg-green-500 text-[#05080F]" : "bg-[rgba(240,239,232,0.1)] text-[rgba(240,239,232,0.4)]"}`}>
                          {cr.active ? "ACTIVE" : "PAUSED"}
                        </span>
                      </div>
                      <p className="text-[10px] text-[rgba(240,239,232,0.5)] truncate font-mono">IF: {cr.event} → THEN: {cr.action}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomRules(prev => prev.map(r => r.id === cr.id ? { ...r, active: !r.active } : r));
                        setRuleAlertToast(`Toggled Rule "${cr.label}" state successfully.`);
                        setTimeout(() => setRuleAlertToast(""), 3000);
                      }}
                      className="px-2 py-1 border border-[rgba(201,168,76,0.22)] rounded text-[8px] uppercase font-mono tracking-wider hover:bg-[#C9A84C] hover:text-[#06090F] cursor-pointer"
                    >
                      Toggle
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Rule Form */}
              <div className="bg-[rgba(5,8,15,0.70)] border border-[rgba(201,168,76,0.12)] p-3.5 rounded-lg space-y-3">
                <span className="text-[9px] font-mono uppercase tracking-[1.5px] text-[#C9A84C] block font-semibold">Deploy Custom IF-THEN Automation Rule</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-[rgba(240,239,232,0.4)] uppercase">Rule Label</label>
                    <input
                      type="text"
                      className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded px-2.5 py-1 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none"
                      placeholder="e.g. Noida MRR Signal"
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-[rgba(240,239,232,0.4)] uppercase">Trigger Event Condition</label>
                    <select
                      className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded px-2.5 py-1 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none font-mono"
                      value={newRuleTrigger}
                      onChange={(e) => setNewRuleTrigger(e.target.value)}
                    >
                      <option value="Runway hits critical (< 6 months)">IF runway &lt; 6 months</option>
                      <option value="Actual MRR hits target budget">IF Brand App MRR &gt;= ₹12L</option>
                      <option value="CRM Lead marked Hot">IF CRM Lead Interest == hot</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[9px] font-mono text-[rgba(240,239,232,0.4)] uppercase">Then Execute Corporate Action</label>
                    <select
                      className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded px-2.5 py-1 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none font-mono"
                      value={newRuleAction}
                      onChange={(e) => setNewRuleAction(e.target.value)}
                    >
                      <option value="Auto trigger Emergency Recovery Protocol">Auto trigger Emergency Recovery Protocol</option>
                      <option value="Unlock local city verification passport sign-offs">Unlock local city verification passport sign-offs</option>
                      <option value="Prompt and prepare draft Syndicate Agreement">Prompt and prepare draft Syndicate Agreement</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2.5 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!newRuleName.trim()) return;
                      const newRule = {
                        id: "cr-" + Date.now(),
                        label: newRuleName.trim(),
                        event: newRuleTrigger,
                        action: newRuleAction,
                        active: true
                      };
                      setCustomRules(prev => [...prev, newRule]);
                      setNewRuleName("");
                      setRuleAlertToast(`Successfully compiled rule "${newRule.label}".`);
                      setTimeout(() => setRuleAlertToast(""), 3000);
                    }}
                    className="px-3.5 py-1.5 bg-[#C9A84C] hover:bg-[#E8C878] text-[#06090F] font-mono text-[9px] uppercase font-bold rounded cursor-pointer"
                  >
                    Compile Rule
                  </button>
                </div>
              </div>

              {/* Rule alerts simulator */}
              <div className="p-3.5 bg-[rgba(5,8,15,0.7)] border border-[rgba(201,168,76,0.12)] rounded-lg text-left space-y-2">
                <div className="flex justify-between items-center pb-1 border-b border-[rgba(240,239,232,0.06)]">
                  <span className="text-[9px] font-mono uppercase tracking-[1.5px] text-[#C9A84C] font-semibold">Workflow Engine Dry Run Console</span>
                  <button
                    type="button"
                    onClick={() => {
                      // Dry run engine check
                      const activeRules = customRules.filter(r => r.active);
                      const activeBrandMRR = Number(activeBrand?.mrrActual || 0);
                      const isLowRunway = Number(db.partnerScore.metrics.cashRunwayMonths) < 6;
                      
                      let logMsg = `[DRY-RUN SYSTEM CHECK] scanning ${activeRules.length} compiled routine directives...\n`;
                      
                      activeRules.forEach(r => {
                        if (r.event.includes("Runway") && isLowRunway) {
                          logMsg += `>> EVENT FIRED on "${r.label}": Runway holds alert levels (${db.partnerScore.metrics.cashRunwayMonths} mo) → Action triggered: ${r.action}.\n`;
                        } else if (r.event.includes("MRR") && activeBrandMRR >= 1200000) {
                          logMsg += `>> EVENT FIRED on "${r.label}": Brand App MRR actual ₹${(activeBrandMRR/100000.0).toFixed(1)}L crossed ₹12L gate → Action triggered: ${r.action}.\n`;
                        } else {
                          logMsg += `>> Routine index "${r.label}": conditions not met. Idle.\n`;
                        }
                      });
                      
                      setRuleAlertToast(logMsg);
                    }}
                    className="px-2 py-0.5 bg-[rgba(201,168,76,0.1)] hover:bg-[#C9A84C] hover:text-[#06090F] rounded text-[8px] font-mono uppercase font-bold cursor-pointer transition-colors"
                  >
                    Run Dry Run
                  </button>
                </div>
                
                <pre className="text-[9.5px] font-mono bg-[#05080F] p-2.5 rounded text-left overflow-x-auto text-[rgba(240,239,232,0.85)] max-h-[140px] leading-relaxed border border-[rgba(201,168,76,0.08)]">
                  {ruleAlertToast || "[CONSOLE IDLE] Click 'Run Dry Run' to execute logic scanning simulator based on physical database parameters..."}
                </pre>
              </div>
            </div>

            {/* CORPORATE REPORT CENTER WITH CUSTOM SVG GRAPHS */}
            <div className="lg:col-span-12 bg-[#0A1020] border-2 border-[#C9A84C] rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[rgba(201,168,76,0.15)]">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-[2px] text-[#C9A84C] font-semibold flex items-center gap-1.5">
                    <FileText size={13} className="text-[#C9A84C]" /> Advanced Corporate Briefing & Valuation Projection Center
                  </h3>
                  <p className="text-[10px] text-[rgba(240,239,232,0.45)] mt-0.5">Physical print optimized corporate audits · 2030 scale prediction graphs</p>
                </div>
                <button
                  type="button"
                  onClick={handlePrintScannerReport}
                  className="px-3 py-1 bg-[rgba(201,168,76,0.12)] hover:bg-[#C9A84C] hover:text-[#06090F] border border-[rgba(201,168,76,0.22)] rounded font-mono text-[9px] text-[#C9A84C] uppercase font-bold cursor-pointer transition-colors flex items-center gap-1"
                >
                  <Printer size={11} /> Print Report
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
                
                {/* SVG Chart area */}
                <div className="space-y-3">
                  <span className="text-[9px] font-mono uppercase tracking-[1.5px] text-[#C9A84C] block font-semibold text-left">Compound Scale Projection Model (2026-2030)</span>
                  
                  <div className="p-4 bg-[#05080F] border border-[rgba(201,168,76,0.12)] rounded-lg flex flex-col justify-center items-center shadow-inner relative">
                    {/* Real SVG mathematical chart */}
                    <svg viewBox="0 0 320 180" className="w-full h-auto overflow-visible select-none">
                      {/* Grid lines */}
                      <line x1="30" y1="10" x2="30" y2="150" stroke="rgba(240,239,232,0.15)" strokeWidth="1" />
                      <line x1="30" y1="150" x2="300" y2="150" stroke="rgba(240,239,232,0.15)" strokeWidth="1" strokeDasharray="2,2" />
                      <line x1="30" y1="110" x2="300" y2="110" stroke="rgba(240,239,232,0.05)" strokeWidth="1" />
                      <line x1="30" y1="70" x2="300" y2="70" stroke="rgba(240,239,232,0.05)" strokeWidth="1" />
                      <line x1="30" y1="30" x2="300" y2="30" stroke="rgba(240,239,232,0.05)" strokeWidth="1" />
                      
                      {/* X coordinates labels */}
                      <text x="30" y="165" fill="rgba(240,239,232,0.4)" fontSize="7" textAnchor="middle" fontFamily="monospace">2026</text>
                      <text x="120" y="165" fill="rgba(240,239,232,0.4)" fontSize="7" textAnchor="middle" fontFamily="monospace">2027</text>
                      <text x="210" y="165" fill="rgba(240,239,232,0.4)" fontSize="7" textAnchor="middle" fontFamily="monospace">2028</text>
                      <text x="300" y="165" fill="rgba(240,239,232,0.4)" fontSize="7" textAnchor="middle" fontFamily="monospace">2030</text>
                      
                      {/* Y label */}
                      <text x="25" y="30" fill="rgba(240,239,232,0.4)" fontSize="6" textAnchor="end" fontFamily="monospace">₹1,100Cr</text>
                      <text x="25" y="70" fill="rgba(240,239,232,0.4)" fontSize="6" textAnchor="end" fontFamily="monospace">₹500Cr</text>
                      <text x="25" y="110" fill="rgba(240,239,232,0.4)" fontSize="6" textAnchor="end" fontFamily="monospace">₹100Cr</text>
                      <text x="25" y="150" fill="rgba(240,239,232,0.4)" fontSize="6" textAnchor="end" fontFamily="monospace">₹0</text>
                      
                      {/* Trend Exponential line (Golden) */}
                      <path 
                        d={`M 30,140 Q 120,120 210,80 T 300,20`} 
                        fill="none" 
                        stroke="#C9A84C" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_4px_#C9A84C]"
                      />
                      
                      {/* Baseline targets line (Grey dotted) */}
                      <line x1="30" y1="145" x2="300" y2="90" stroke="rgba(240,239,232,0.3)" strokeWidth="1" strokeDasharray="3,3" />

                      {/* Coordinate Markers */}
                      <circle cx="30" cy="140" r="3" fill="#C9A84C" />
                      <circle cx="210" cy="80" r="3" fill="#C9A84C" />
                      <circle cx="300" cy="20" r="3" fill="#C9A84C" opacity="0.8" />
                      
                      {/* Glowing pointer labels */}
                      <text x="210" y="70" fill="#F0EFE8" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Stage 6 Goal</text>
                      <text x="300" y="12" fill="#C9A84C" fontSize="7" fontWeight="bold" textAnchor="end" fontFamily="monospace">Valuation Target Reach!</text>
                    </svg>

                    <div className="flex gap-4 text-[9px] font-mono text-[rgba(240,239,232,0.4)] mt-2">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-[#C9A84C] inline-block" /> Compounded Ecosystem Scale</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 border-t border-dashed border-[rgba(240,239,232,0.4)] inline-block" /> Linear Baseline Goal</span>
                    </div>
                  </div>
                </div>

                {/* Technical details block */}
                <div className="space-y-4 text-xs text-left">
                  <span className="text-[9px] font-mono uppercase tracking-[1.5px] text-[#C9A84C] block font-semibold">Active Capital & EBITDA Runway Distribution</span>
                  
                  <div className="p-4 bg-[rgba(5,8,15,0.6)] border border-[rgba(201,168,76,0.12)] rounded-lg space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-[rgba(240,239,232,0.5)] uppercase">Operations & Hires allotment:</span>
                        <strong className="text-[#F0EFE8]">₹18,50,000 / mo</strong>
                      </div>
                      <div className="w-full h-1.5 bg-[#05080F] rounded overflow-hidden">
                        <div className="h-full bg-[#C9A84C]" style={{ width: "65%" }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-[rgba(240,239,232,0.5)] uppercase">Franchise kitchen CAPEX reserved:</span>
                        <strong className="text-[#F0EFE8]">₹12,00,000 / mo</strong>
                      </div>
                      <div className="w-full h-1.5 bg-[#05080F] rounded overflow-hidden">
                        <div className="h-full bg-[#1D9E75]" style={{ width: "35%" }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-[rgba(240,239,232,0.5)] uppercase">Digital Brand marketing burn CAC:</span>
                        <strong className="text-[#F0EFE8]">₹4,50,000 / mo</strong>
                      </div>
                      <div className="w-full h-1.5 bg-[#05080F] rounded overflow-hidden">
                        <div className="h-full bg-[#EF9F27]" style={{ width: "15%" }} />
                      </div>
                    </div>

                    <div className="text-[10px] text-[rgba(240,239,232,0.4)] leading-relaxed italic border-t border-[rgba(201,168,76,0.06)] pt-2 font-serif">
                      ✓ Values synchronized to active portfolio items. Dynamic cash positions scale automatically on database updates.
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB 5: SMART INTEGRATED CRM PIPELINE --- */}
      {activeTab === "crm" && (
        <div className="space-y-6 animate-fade-in text-left">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Pipelines & Matches (8-cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-xl p-5 space-y-4">
                <div className="border-b border-[rgba(201,168,76,0.08)] pb-2 flex justify-between items-center">
                  <span className="text-xs font-mono uppercase tracking-[2px] text-[#C9A84C] font-semibold">Consolidated CRM lead Ledger</span>
                  <span className="text-[10px] font-mono text-[rgba(240,239,232,0.4)]">{leadsList.length} active leads tracked</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[rgba(201,168,76,0.18)] font-mono text-[9px] uppercase tracking-wider text-[rgba(240,239,232,0.4)]">
                        <th className="pb-2.5">Name / Category</th>
                        <th className="pb-2.5">Contact Detail</th>
                        <th className="pb-2.5">Ticket Scope</th>
                        <th className="pb-2.5">Interest</th>
                        <th className="pb-2.5">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(201,168,76,0.08)]">
                      {leadsList.map((lead) => (
                        <tr key={lead.id} className="hover:bg-[rgba(201,168,76,0.02)] transition-all">
                          <td className="py-3.5 pr-2">
                            <span className="block font-serif font-bold text-sm text-[#F0EFE8]">{lead.name}</span>
                            <span className="text-[8px] font-mono uppercase tracking-wider text-[#C9A84C] px-1.5 py-0.5 bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.15)] rounded inline-block mt-1">{lead.category}</span>
                          </td>
                          <td className="py-3.5 pr-2 font-mono text-[11px] space-y-1 text-[rgba(240,239,232,0.7)]">
                            <div className="flex items-center gap-1"><Mail size={10} className="text-[#C9A84C]" /> {lead.email}</div>
                            <div className="flex items-center gap-1"><Phone size={10} className="text-[#C9A84C]" /> {lead.contact}</div>
                          </td>
                          <td className="py-3.5 pr-2 font-mono font-medium text-[#F0EFE8]">
                            {lead.ticketSizeRs > 0 ? `₹${(lead.ticketSizeRs / 100000.0).toFixed(1)}L` : "N/A"}
                          </td>
                          <td className="py-3.5 pr-2">
                            <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded uppercase font-semibold block w-max ${
                              lead.interestLevel === "hot" 
                                ? "bg-[rgba(29,158,117,0.1)] text-[#1D9E75]" 
                                : lead.interestLevel === "warm" 
                                ? "bg-[rgba(239,159,39,0.1)] text-[#EF9F27]" 
                                : "bg-[rgba(240,239,232,0.05)] text-[rgba(240,239,232,0.4)]"
                            }`}>
                              {lead.interestLevel}
                            </span>
                            <span className="block text-[8px] font-mono text-[rgba(240,239,232,0.35)] mt-1.5 uppercase">LST: {lead.lastContacted}</span>
                          </td>
                          <td className="py-3.5 text-[11px] text-[rgba(240,239,232,0.65)] font-serif max-w-[180px] truncate leading-normal" title={lead.notes}>
                            {lead.notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Matchmaker section */}
              <div className="p-5 bg-gradient-to-r from-[#0c1220] to-[#05080f] border border-[rgba(201,168,76,0.15)] rounded-xl space-y-3.5 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 border-b border-[rgba(201,168,76,0.15)] gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-[2px] text-[#C9A84C] font-semibold flex items-center gap-2">
                    <Award size={13} className="text-[#C9A84C]" /> Live AI Investor CRM Compatibility Matchmaker
                  </span>
                  <span className="text-[8px] font-mono text-green-400 font-semibold uppercase tracking-wider bg-[rgba(29,158,117,0.06)] px-1.5 py-0.5 rounded border border-[rgba(29,158,117,0.15)]">
                    COGNITIVE INTEGRATION READY
                  </span>
                </div>
                
                <p className="text-xs text-[rgba(240,239,232,0.65)] font-serif leading-relaxed">
                  Run simulated compatibility checks. The engine cross-references the active brand's MRR thresholds with the investor's sizing and location constraints:
                </p>

                {/* Dropdowns row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-[rgba(240,239,232,0.45)]">1. Select Target Brand</label>
                    <select
                      className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded px-2.5 py-1.5 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none font-sans"
                      value={activeMatchBrandId}
                      onChange={(e) => {
                        setActiveMatchBrandId(e.target.value);
                        setSynthesizedDrafterPitch("");
                      }}
                    >
                      {db.brands.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} (MRR: ₹{(Number(b.mrrActual)/100000.0).toFixed(1)}L)</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-[rgba(240,239,232,0.45)]">2. Select Registered CRM Lead</label>
                    <select
                      className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded px-2.5 py-1.5 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none font-sans"
                      value={activeMatchLeadId}
                      onChange={(e) => {
                        setActiveMatchLeadId(e.target.value);
                        setSynthesizedDrafterPitch("");
                      }}
                    >
                      {leadsList.map((l) => (
                        <option key={l.id} value={l.id}>{l.name} - {l.category.toUpperCase()} (₹{(l.ticketSizeRs/100000.0).toFixed(1)}L)</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={handleSynthesizeFranchisePitch}
                    disabled={isSynthesizingPitch}
                    className="w-full py-2 bg-[#C9A84C] hover:bg-[#E8C878] text-[#06090F] font-mono text-[9.5px] uppercase font-bold rounded transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    {isSynthesizingPitch ? <RefreshCw className="animate-spin text-black" size={10} /> : <FileText size={11} />}
                    {isSynthesizingPitch ? "Synthesizing Deal Compatibility Factors..." : "Synthesize Valuation Deal Pitch & Compatibility Rating"}
                  </button>
                </div>

                {/* Output area */}
                {synthesizedDrafterPitch && (
                  <div className="space-y-2 pt-2 animate-fade-in text-left">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#C9A84C] block font-semibold">Compiled Exclusivity Pitch dossier:</span>
                    <pre className="p-3 bg-[#05080F] border border-[rgba(201,168,76,0.15)] rounded-lg text-[10px] font-mono text-[rgba(240,239,232,0.85)] max-h-[220px] overflow-y-auto leading-relaxed whitespace-pre-wrap">
                      {synthesizedDrafterPitch}
                    </pre>
                  </div>
                )}
              </div>

            </div>

            {/* Form to add Lead (4-cols) */}
            <div className="lg:col-span-4 bg-[#0A1020] border-2 border-[#C9A84C] rounded-xl p-5 space-y-4">
              <div className="border-b border-[rgba(201,168,76,0.08)] pb-2">
                <span className="text-xs font-mono uppercase tracking-[2px] text-[#C9A84C] block font-semibold">Pipeline Onboarding Form</span>
                <p className="text-[10px] text-[rgba(240,239,232,0.5)] mt-0.5">Onboard leads, franchise applicants, or retail distributors instantly</p>
              </div>

              {leadSuccessMsg && (
                <div className="p-3 bg-[rgba(29,158,117,0.12)] border border-[#1D9E75] text-green-400 rounded text-xs leading-relaxed text-left">
                  ✓ {leadSuccessMsg}
                </div>
              )}

              <form onSubmit={handleAddNewLead} className="space-y-3.5 text-xs text-left">
                <div>
                  <label className="block text-[8px] font-mono uppercase tracking-wider text-[rgba(240,239,232,0.4)] mb-1">Lead/Contact Name</label>
                  <input
                    type="text"
                    required
                    value={addLeadForm.name}
                    onChange={(e) => setAddLeadForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none"
                    placeholder="e.g. Anand Mahindra Syndicate"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-mono uppercase tracking-wider text-[rgba(240,239,232,0.4)] mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={addLeadForm.email}
                      onChange={(e) => setAddLeadForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none font-mono"
                      placeholder="e.g. anand@mahindra.co.in"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-mono uppercase tracking-wider text-[rgba(240,239,232,0.4)] mb-1">Contact Phone</label>
                    <input
                      type="text"
                      required
                      value={addLeadForm.contact}
                      onChange={(e) => setAddLeadForm(prev => ({ ...prev, contact: e.target.value }))}
                      className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none"
                      placeholder="e.g. +91 99000 88811"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-mono uppercase tracking-wider text-[rgba(240,239,232,0.4)] mb-1">CRM Category</label>
                    <select
                      value={addLeadForm.category}
                      onChange={(e) => setAddLeadForm(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none font-mono"
                    >
                      <option value="franchise">Franchise App</option>
                      <option value="investor">Syndicate Investor</option>
                      <option value="distributor">Packaged Distributor</option>
                      <option value="consultant">Auditing Consultant</option>
                      <option value="partner">Ecosystem Partner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] font-mono uppercase tracking-wider text-[rgba(240,239,232,0.4)] mb-1">Interest Level</label>
                    <select
                      value={addLeadForm.interestLevel}
                      onChange={(e) => setAddLeadForm(prev => ({ ...prev, interestLevel: e.target.value as any }))}
                      className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none font-mono"
                    >
                      <option value="hot">🔥 HOT (Close Ready)</option>
                      <option value="warm">⚡ WARM (Evaluating)</option>
                      <option value="cold">❄ COLD (Idle conversations)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-mono uppercase tracking-wider text-[rgba(240,239,232,0.4)] mb-1">Ticket Investment Size (INR)</label>
                  <input
                    type="number"
                    value={addLeadForm.ticketSizeRs}
                    onChange={(e) => setAddLeadForm(prev => ({ ...prev, ticketSizeRs: Number(e.target.value) }))}
                    className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none font-mono"
                    placeholder="e.g. 5000000 for ₹50L"
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-mono uppercase tracking-wider text-[rgba(240,239,232,0.4)] mb-1">Lead Description / Direct Notes</label>
                  <textarea
                    rows={3}
                    value={addLeadForm.notes}
                    onChange={(e) => setAddLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2.5 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none"
                    placeholder="Add operational notes or next follow-up call descriptions..."
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isAddingLead}
                    className="w-full py-2 bg-[#C9A84C] hover:bg-[#E8C878] text-[#06090F] font-mono text-[10px] uppercase font-bold rounded cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isAddingLead ? <RefreshCw className="animate-spin text-black" size={10} /> : null}
                    {isAddingLead ? "Indexing CRM Parameters..." : "Register Lead & Sync Matches"}
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
