import React, { useState, useEffect, useRef } from "react";
import { DatabaseState, Message, Investor, BrandComparison } from "./types";
import Header from "./components/Header";
import WeeklyBoard from "./components/WeeklyBoard";
import EmergencyMode from "./components/EmergencyMode";
import Accountability from "./components/Accountability";
import DecisionLog from "./components/DecisionLog";
import WarRoom from "./components/WarRoom";
import InvestorCRM from "./components/InvestorCRM";
import BrandComparisonCenter from "./components/BrandComparison";
import KnowledgeBrain from "./components/KnowledgeBrain";
import PartnerPassport from "./components/PartnerPassport";
import AuthOverlay from "./components/AuthOverlay";
import CommandCenter from "./components/CommandCenter";
import { QrCode, Sparkles, Send, Mic, RefreshCw, Layers, Brain, Landmark, Compass, HelpCircle } from "lucide-react";

export default function App() {
  // Navigation Routing State
  const [activePath, setActivePath] = useState<string>("/weekly-board");
  // Sub-tabs in the main panel workspace to toggle specialized modules
  const [activeSubTab, setActiveSubTab] = useState<"none" | "investors" | "brands" | "brain" | "passport">("none");

  // User State
  const [currentUser, setCurrentUser] = useState<{ id: number; email: string; role: string } | null>(null);

  // Live Database State
  const [db, setDb] = useState<DatabaseState | null>(null);
  const [loading, setLoading] = useState(true);

  // AI Chat and Inputs
  const [chatInput, setChatInput] = useState("");
  const [thinkingAI, setThinkingAI] = useState(false);
  const convoEndRef = useRef<HTMLDivElement | null>(null);

  // Voice state
  const [voiceActive, setVoiceActive] = useState(false);

  // Check for scanning/verify parameters in URL
  const [scannedVerifyCode, setScannedVerifyCode] = useState<string | null>(null);

  // Sync route on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("verifyCode");
    if (code) {
      setScannedVerifyCode(code);
      setActiveSubTab("passport");
    }

    const path = window.location.pathname;
    const validPaths = ["/command-center", "/weekly-board", "/emergency-mode", "/accountability", "/decision-log", "/war-room"];
    if (validPaths.includes(path)) {
      setActivePath(path);
    } else {
      setActivePath("/command-center");
      const search = window.location.search;
      window.history.replaceState({}, "", "/command-center" + search);
    }
  }, []);

  // Fetch complete database state
  const fetchDB = async () => {
    try {
      const res = await fetch("/api/db");
      if (res.ok) {
        const data = await res.json();
        setDb(data);
      } else {
        console.warn("Unauthorized or stale database state token during fetch");
      }
      setLoading(false);
    } catch (err) {
      console.error("Error loading database context:", err);
      setLoading(false);
    }
  };

  // Verify supervisor sessions on mount
  useEffect(() => {
    const verifyUserSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const schema = await res.json();
          if (schema.user) {
            setCurrentUser(schema.user);
            await fetchDB();
            return;
          }
        }
        setCurrentUser(null);
        setLoading(false);
      } catch (err) {
        console.error("Auth verify error:", err);
        setCurrentUser(null);
        setLoading(false);
      }
    };
    verifyUserSession();
  }, []);

  const handleNavigate = (path: string) => {
    setActivePath(path);
    window.history.pushState({}, "", path);
    // Reset sub-tab when routing changes so we see the principal boards
    setActiveSubTab("none");
  };

  const handleAuthSuccess = async (user: { id: number; email: string; role: string }) => {
    setLoading(true);
    setCurrentUser(user);
    await fetchDB();
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setDb(null);
      setLoading(false);
    } catch (err) {
      console.error("Failed to clear supervisor session token:", err);
    }
  };

  // Scroll conversation to bottom on message updates
  useEffect(() => {
    if (convoEndRef.current) {
      convoEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [db?.messages, thinkingAI]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06090F] flex flex-col justify-center items-center font-sans select-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 border border-[#C9A84C] rounded-md flex items-center justify-center font-serif text-xl font-bold text-[#C9A84C]">
            FK
          </div>
          <span className="font-mono text-[#C9A84C] text-[12px] tracking-wider uppercase">Loading Executive Layer...</span>
        </div>
        <RefreshCw size={20} className="text-[#C9A84C] animate-spin" />
      </div>
    );
  }

  // Render Login overlay context if unauthenticated
  if (!currentUser) {
    return <AuthOverlay onAuthSuccess={handleAuthSuccess} />;
  }

  // Render blank state if database load failed
  if (!db) {
    return (
      <div className="min-h-screen bg-[#06090F] flex flex-col justify-center items-center font-sans select-none">
        <div className="text-center space-y-4 max-w-sm px-6">
          <p className="font-mono text-xs text-[#E24B4A]">⚠ FAILED TO CONFIGURE SECURED WORKSPACE</p>
          <p className="text-xs text-[rgba(240,239,232,0.6)] leading-relaxed">
            The session database has either failed to migrate or login credential schemas could not sync isolated states.
          </p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-[rgba(201,168,76,0.15)] hover:bg-[rgba(201,168,76,0.25)] border border-[rgba(201,168,76,0.25)] text-[#C9A84C] rounded font-mono text-xs cursor-pointer"
          >
            Clear Stale Session
          </button>
        </div>
      </div>
    );
  }

  // --- API STATE TRANSACTION WRAPPER CALLS ---

  // Refreshes the database state after an update
  const refreshState = async () => {
    const res = await fetch("/api/db");
    if (res.ok) {
      const data = await res.json();
      setDb(data);
    }
  };

  // 1. Toggles an action item
  const handleToggleAction = async (id: string) => {
    await fetch("/api/action-plan/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    refreshState();
  };

  // 2. Add Win/Fail Board Item
  const handleAddBoardItem = async (category: 'win' | 'fail' | 'risk' | 'team', title: string, description: string) => {
    await fetch("/api/weekly-board/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, title, description })
    });
    refreshState();
  };

  // 3. Remove Win/Fail Board Item
  const handleRemoveBoardItem = async (id: string) => {
    await fetch(`/api/weekly-board/items/${id}`, { method: "DELETE" });
    refreshState();
  };

  // 4. Add Action Plan item
  const handleAddActionItem = async (title: string, description: string) => {
    await fetch("/api/action-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description })
    });
    refreshState();
  };

  // 5. Toggle Emergency State
  const handleToggleEmergency = async (payload: { isActivated: boolean; reason?: string; runwayMonths?: number; revenueGapPct?: number }) => {
    await fetch("/api/emergency-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    refreshState();
  };

  // 6. Commit promise
  const handleAddCommitment = async (title: string, status: 'overdue' | 'due-soon' | 'completed', committedDate: string, dueDate: string, impact: string) => {
    await fetch("/api/accountability/commitments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, status, committedDate, dueDate, impact })
    });
    refreshState();
  };

  // 7. Publish Board Decision Resolution
  const handleAddDecision = async (title: string, context: string, outcome: string, status: 'successful' | 'in-progress' | 'pending') => {
    await fetch("/api/decision-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, context, outcome, status })
    });
    refreshState();
  };

  // 8. Onboard new investor
  const handleAddInvestor = async (investor: Omit<Investor, "id" | "lastContacted">) => {
    await fetch("/api/investors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(investor)
    });
    refreshState();
  };

  // 9. Remove investor record
  const handleRemoveInvestor = async (id: string) => {
    await fetch(`/api/investors/${id}`, { method: "DELETE" });
    refreshState();
  };

  // 10. Update brand target criteria
  const handleUpdateBrand = async (brand: Omit<BrandComparison, "id" | "isTriggerMet">) => {
    await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brand)
    });
    refreshState();
  };

  // 11. Run expansion scan on city
  const handleTriggerScan = async (cityName: string) => {
    await fetch("/api/readiness-scans/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityName })
    });
    refreshState();
  };

  // 12. Record Knowledge document SOP
  const handleAddDoc = async (title: string, category: string, summary: string, content: string) => {
    await fetch("/api/knowledge-brain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, summary, content })
    });
    refreshState();
  };

  // 13. Update tactical War Room session
  const handleUpdateSession = async (params: { title?: string; battlePlan?: string[]; adversaries?: string[]; allies?: string[] }) => {
    await fetch("/api/war-room/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    refreshState();
  };

  // 14. Generate fresh Daily CEO AI briefing
  const handleGenerateBriefing = async () => {
    await fetch("/api/ceo-briefing/generate", { method: "POST" });
    refreshState();
  };

  // 15. Send Chat Message to AI Advisor
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setThinkingAI(true);
    
    // Optimistically write custom state
    const optimUserMsg: Message = {
      id: "msg-" + Date.now() + "-u",
      sender: "user",
      text: textToSend,
      timestamp: new Date().toISOString()
    };
    setDb(prev => prev ? { ...prev, messages: [...prev.messages, optimUserMsg] } : null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToSend })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to connect to AI Advisor");
      }

      const data = await res.json();
      if (data.aiMessage) {
        // Feed complete list from server response
        refreshState();
      }
    } catch (err: any) {
      console.error(err);
      // Add error message to chat
      const errorMsg: Message = {
        id: "msg-" + Date.now() + "-err",
        sender: "ai",
        text: `<span style="color: #E24B4A;"><strong>Operational Error:</strong> ${err.message}. Ensure your GEMINI_API_KEY is configured in the .env file and the server is running.</span>`,
        timestamp: new Date().toISOString()
      };
      setDb(prev => prev ? { ...prev, messages: [...prev.messages, errorMsg] } : null);
    } finally {
      setThinkingAI(false);
    }
  };

  const handleQuickAsk = (q: string) => {
    handleSendMessage(q);
  };

  const handleVoiceIndicator = () => {
    setVoiceActive(true);
    setTimeout(() => {
      setVoiceActive(false);
      handleSendMessage("Querying core operating systems via active voice channel...");
    }, 2000);
  };

  // Current briefing references
  const currentBrief = db.ceoBriefings.length > 0 ? db.ceoBriefings[0] : null;

  return (
    <div className="min-h-screen bg-[#06090F] flex flex-col font-sans selection:bg-[#C9A84C] selection:text-[#06090F]">
      
      {/* Dynamic sticky header, feeds active session descriptors */}
      <Header
        activePath={activePath}
        onNavigate={handleNavigate}
        executiveScore={db.partnerScore.overallScore}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main double split frame layout */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Left Double-Workspace: Navigation views + subsystem directories */}
        <div className="col-span-1 lg:col-span-8 p-6 lg:border-r border-[rgba(201,168,76,0.18)] space-y-6">
          
          {/* Subsystem Direct Tool Toggle Bar (Standard BNI style) */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[rgba(201,168,76,0.08)] pb-3">
            <span className="text-[9px] font-mono uppercase tracking-[2px] text-[rgba(240,239,232,0.4)] mr-2">Subsystem Engines:</span>
            <button
              onClick={() => setActiveSubTab(activeSubTab === "investors" ? "none" : "investors")}
              className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded border border-[rgba(201,168,76,0.18)] cursor-pointer transition-all flex items-center gap-1 ${
                activeSubTab === "investors" ? "bg-[#C9A84C] text-[#06090F] font-bold" : "bg-[rgba(10,16,32,0.6)] text-[rgba(240,239,232,0.6)] hover:border-[#C9A84C]"
              }`}
            >
              <Landmark size={10} /> Investor CRM
            </button>
            <button
              onClick={() => setActiveSubTab(activeSubTab === "brands" ? "none" : "brands")}
              className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded border border-[rgba(201,168,76,0.18)] cursor-pointer transition-all flex items-center gap-1 ${
                activeSubTab === "brands" ? "bg-[#C9A84C] text-[#06090F] font-bold" : "bg-[rgba(10,16,32,0.6)] text-[rgba(240,239,232,0.6)] hover:border-[#C9A84C]"
              }`}
            >
              <Compass size={10} /> Brand Comparison
            </button>
            <button
              onClick={() => setActiveSubTab(activeSubTab === "brain" ? "none" : "brain")}
              className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded border border-[rgba(201,168,76,0.18)] cursor-pointer transition-all flex items-center gap-1 ${
                activeSubTab === "brain" ? "bg-[#C9A84C] text-[#06090F] font-bold" : "bg-[rgba(10,16,32,0.6)] text-[rgba(240,239,232,0.6)] hover:border-[#C9A84C]"
              }`}
            >
              <Brain size={10} /> Knowledge Brain
            </button>
            <button
              onClick={() => setActiveSubTab(activeSubTab === "passport" ? "none" : "passport")}
              className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded border border-[rgba(201,168,76,0.18)] cursor-pointer transition-all flex items-center gap-1 ${
                activeSubTab === "passport" ? "bg-[#C9A84C] text-[#06090F] font-bold" : "bg-[rgba(10,16,32,0.6)] text-[rgba(240,239,232,0.6)] hover:border-[#C9A84C]"
              }`}
            >
              <QrCode size={10} /> Passport & Score
            </button>
          </div>

          {/* Active Workspace mapping */}
          <div className="bg-[rgba(6,9,15,0.4)] relative">
            
            {/* If a sub-tab is activated, show it. Otherwise show the standard current path view */}
            {activeSubTab === "investors" && (
              <div className="animate-fade-in">
                <InvestorCRM 
                  investors={db.investors} 
                  onAddInvestor={handleAddInvestor} 
                  onRemoveInvestor={handleRemoveInvestor} 
                  onRefresh={refreshState}
                />
              </div>
            )}
            
            {activeSubTab === "brands" && (
              <div className="animate-fade-in">
                <BrandComparisonCenter brands={db.brands} onUpdateBrand={handleUpdateBrand} />
              </div>
            )}
            
            {activeSubTab === "brain" && (
              <div className="animate-fade-in">
                <KnowledgeBrain docs={db.knowledgeDocs} onAddDoc={handleAddDoc} />
              </div>
            )}

            {activeSubTab === "passport" && (
              <div className="animate-fade-in">
                <PartnerPassport 
                  passport={db.qrPassport} 
                  score={db.partnerScore} 
                  readinessScans={db.readinessScans} 
                  onTriggerScan={handleTriggerScan} 
                  onPassportUpdate={refreshState}
                  initialVerifyCode={scannedVerifyCode}
                  onClearInitialVerifyCode={() => setScannedVerifyCode(null)}
                />
              </div>
            )}

            {activeSubTab === "none" && (
              <>
                {activePath === "/command-center" && (
                  <CommandCenter
                    db={db}
                    onRefresh={refreshState}
                  />
                )}

                {activePath === "/weekly-board" && (
                  <WeeklyBoard
                    items={db.weeklyBoardItems}
                    metrics={db.weeklyBoardMetrics}
                    actionPlan={db.actionPlanItems}
                    onToggleAction={handleToggleAction}
                    onAddBoardItem={handleAddBoardItem}
                    onRemoveBoardItem={handleRemoveBoardItem}
                    onAddActionItem={handleAddActionItem}
                  />
                )}

                {activePath === "/emergency-mode" && (
                  <EmergencyMode
                    state={db.emergencyMode}
                    onToggleEmergency={handleToggleEmergency}
                  />
                )}

                {activePath === "/accountability" && (
                  <Accountability
                    commitments={db.accountabilityCommitments}
                    onAddCommitment={handleAddCommitment}
                    executiveScore={db.partnerScore.overallScore}
                    onRefresh={refreshState}
                  />
                )}

                {activePath === "/decision-log" && (
                  <DecisionLog
                    decisions={db.decisionLogItems}
                    onAddDecision={handleAddDecision}
                  />
                )}

                {activePath === "/war-room" && (
                  <WarRoom
                    session={db.warRoomSessions[0]}
                    onUpdateSession={handleUpdateSession}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar: Continuous Always-On AI Chairman Partner + CEO Daily briefings */}
        <div className="col-span-1 lg:col-span-4 p-6 bg-[rgba(5,8,14,0.45)] space-y-6 lg:border-l border-[rgba(201,168,76,0.06)] flex flex-col justify-start">
          
          {/* Avatar Section */}
          <div className="flex items-start gap-4 p-4.5 bg-gradient-to-br from-[#0c1220] to-[#080c16] border border-[rgba(201,168,76,0.25)] rounded-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-[radial-gradient(circle_at_7%_2%,_rgba(201,168,76,0.05),_transparent_70%)]"></div>
            
            <div className="relative flex-shrink-0">
              <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#1a2640] to-[#0d1626] border border-[rgba(201,168,76,0.3)] flex items-center justify-center overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="44" cy="44" rx="30" ry="34" fill="#2a3550" />
                  <ellipse cx="44" cy="62" rx="22" ry="16" fill="#1a2540" />
                  <ellipse cx="32" cy="40" rx="6" ry="4.5" fill="#0d1520" />
                  <ellipse cx="56" cy="40" rx="6" ry="4.5" fill="#0d1520" />
                  <circle cx="32" cy="40" r="3" fill="#d4aa50" />
                  <circle cx="56" cy="40" r="3" fill="#d4aa50" />
                  <path d="M35 60 Q44 65 53 60" stroke="#C9A84C" strokeWidth="1.2" fill="none" opacity="0.6" />
                </svg>
              </div>
              <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-[#060915] border border-[rgba(201,168,76,0.25)] rounded-full flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#1D9E75]" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-lg font-bold text-[#F0EFE8]">FK Strategic Partner</h3>
              <p className="text-[9px] font-mono tracking-wider text-[#C9A84C] uppercase mt-0.5">Always On AI Companion</p>
              <p className="text-[11.5px] text-[rgba(240,239,232,0.7)] leading-relaxed italic mt-2 font-serif">
                "Welcome to supervisor portal. Let's direct company assets and hit target metrics today."
              </p>
            </div>
          </div>

          {/* Daily CEO Briefing Block */}
          <div className="bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-[rgba(201,168,76,0.1)]">
              <span className="text-[9px] font-mono uppercase tracking-[2px] text-[#C9A84C]">CEO Daily Briefing</span>
              <button
                onClick={handleGenerateBriefing}
                className="text-[9.5px] font-mono text-[#C9A84C] hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1"
                title="Generates a fresh real AI brief using Gemini"
              >
                <Sparkles size={11} /> Generate real Brief
              </button>
            </div>
            
            {currentBrief ? (
              <div className="space-y-2 text-xs text-[rgba(240,239,232,0.8)] leading-relaxed">
                <div className="flex justify-between font-mono text-[9px] text-[rgba(240,239,232,0.4)] uppercase">
                  <span>Dated Review:</span>
                  <span>{currentBrief.date}</span>
                </div>
                <p>🎯 <strong className="text-[#C9A84C]">Today's Mission:</strong> {currentBrief.todayMission}</p>
                <p>🚨 <strong className="text-[#E24B4A]">Core Risk:</strong> {currentBrief.biggestRisk}</p>
                <p>🚀 <strong className="text-[#1D9E75]">Key Opportunity:</strong> {currentBrief.biggestOpportunity}</p>
                <p>⚪ <strong className="text-[rgba(240,239,232,0.5)]">Ignore:</strong> {currentBrief.whatToIgnore}</p>
              </div>
            ) : (
              <p className="text-xs text-[rgba(240,239,232,0.4)] italic">No pre-briefing generated. Click above to run Gemini engine.</p>
            )}
          </div>

          {/* Continuous Chat Assistant Section */}
          <div className="bg-[rgba(10,16,30,0.6)] border border-[rgba(201,168,76,0.18)] rounded-lg flex-1 min-h-[350px] flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b border-[rgba(201,168,76,0.1)] text-[10px] font-mono uppercase tracking-widest text-[rgba(240,239,232,0.55)]">
              AI Chairman Advisor Chat
            </div>
            
            {/* Message thread */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {db.messages.map((m) => (
                <div key={m.id} className={`flex gap-2.5 items-start ${m.sender === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-serif font-bold ${
                    m.sender === "ai" ? "bg-[rgba(201,168,76,0.15)] text-[#C9A84C] border border-[rgba(201,168,76,0.25)]" : "bg-[rgba(15,24,40,0.8)] text-[rgba(240,239,232,0.55)] border border-[rgba(201,168,76,0.06)]"
                  }`}>
                    {m.sender === "ai" ? "FK" : "RA"}
                  </div>
                  <div className={`max-w-[80%] rounded-lg p-3 text-xs leading-relaxed ${
                    m.sender === "ai"
                      ? "bg-[rgba(10,16,30,0.7)] border border-[rgba(201,168,76,0.12)] text-[rgba(240,239,232,0.65)] hover:border-[#C9A84C]"
                      : "bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.22)] text-[#F0EFE8]"
                  }`}
                  dangerouslySetInnerHTML={{ __html: m.text }}
                  />
                </div>
              ))}

              {thinkingAI && (
                <div className="flex gap-2.5 items-start">
                  <div className="w-6 h-6 rounded-full bg-[rgba(201,168,76,0.15)] text-[#C9A84C] flex items-center justify-center text-xs font-serif font-bold">
                    FK
                  </div>
                  <div className="flex items-center gap-1 p-3 bg-[rgba(10,16,30,0.5)] border border-[rgba(201,168,76,0.1)] rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce delay-75" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce delay-150" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce delay-300" />
                  </div>
                </div>
              )}
              <div ref={convoEndRef} />
            </div>

            {/* Input elements */}
            <div className="p-3 border-t border-[rgba(201,168,76,0.1)] bg-[rgba(5,8,12,0.8)] space-y-2.5">
              <div className="flex items-center gap-2 bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded-full px-3 py-1">
                <button
                  type="button"
                  onClick={handleVoiceIndicator}
                  className={`p-1.5 bg-[rgba(201,168,76,0.15)] hover:bg-[rgba(201,168,76,0.25)] text-[#C9A84C] border border-[rgba(201,168,76,0.25)] rounded-full flex items-center justify-center cursor-pointer transition-all ${
                    voiceActive ? "animate-pulse border-red-500 text-red-500" : ""
                  }`}
                  title="Speak strategically"
                >
                  <Mic size={13} />
                </button>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && chatInput.trim()) {
                      handleSendMessage(chatInput);
                      setChatInput("");
                    }
                  }}
                  placeholder={voiceActive ? "Listening..." : "Ask: am i behind target?"}
                  className="flex-1 bg-transparent border-none text-xs text-[#F0EFE8] focus:outline-none placeholder-[rgba(240,239,232,0.3)] mt-0.5"
                />
                <button
                  onClick={() => {
                    if (chatInput.trim()) {
                      handleSendMessage(chatInput);
                      setChatInput("");
                    }
                  }}
                  className="p-1 w-6 h-6 bg-[#C9A84C] text-[#06090F] flex items-center justify-center rounded-full border-none cursor-pointer hover:bg-[#E8C878] transition-colors"
                >
                  <Send size={11} />
                </button>
              </div>

              {/* Quick Prompt suggestions */}
              <div className="flex flex-wrap gap-1">
                <button onClick={() => handleQuickAsk("Am I behind target")} className="px-2 py-0.5 rounded-full bg-[#05080F] border border-[rgba(201,168,76,0.15)] text-[9.5px] italic text-[rgba(240,239,232,0.6)] cursor-pointer hover:text-[#C9A84C] hover:border-[#C9A84C]">"Am I behind?"</button>
                <button onClick={() => handleQuickAsk("Where am I wasting time")} className="px-2 py-0.5 rounded-full bg-[#05080F] border border-[rgba(201,168,76,0.15)] text-[9.5px] italic text-[rgba(240,239,232,0.6)] cursor-pointer hover:text-[#C9A84C] hover:border-[#C9A84C]">"Where wasting time?"</button>
                <button onClick={() => handleQuickAsk("most urgent decision")} className="px-2 py-0.5 rounded-full bg-[#05080F] border border-[rgba(201,168,76,0.15)] text-[9.5px] italic text-[rgba(240,239,232,0.6)] cursor-pointer hover:text-[#C9A84C] hover:border-[#C9A84C]">"Most urgent?"</button>
                <button onClick={() => handleQuickAsk("I am confused")} className="px-2 py-0.5 rounded-full bg-[#05080F] border border-[rgba(201,168,76,0.15)] text-[9.5px] italic text-[rgba(240,239,232,0.6)] cursor-pointer hover:text-[#C9A84C] hover:border-[#C9A84C]">"I am confused"</button>
              </div>
            </div>
          </div>

          {/* Goal Run Rate Progress Indicator */}
          <div className="p-4 bg-[rgba(8,12,22,0.5)] border border-[rgba(201,168,76,0.12)] rounded-lg space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[rgba(240,239,232,0.5)] uppercase">Goal: ₹1,100 Crore Plan</span>
              <span className="text-[#C9A84C]">34% Clear</span>
            </div>
            <div className="w-full h-1 bg-[rgba(201,168,76,0.1)] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#8B6B2A] to-[#E8C878]" style={{ width: "34%" }}></div>
            </div>
            <div className="flex justify-between text-[10px] text-[rgba(240,239,232,0.4)]">
              <span>₹374 Cr Run-Rate</span>
              <span>4.5 yrs remaining</span>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
