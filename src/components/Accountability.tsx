import React, { useState } from "react";
import { AccountabilityCommitment } from "../types";
import { 
  Plus, 
  X, 
  Brain, 
  Calendar, 
  Flame, 
  AlertCircle, 
  Sparkles, 
  Check, 
  RefreshCw, 
  TrendingUp, 
  LayoutList, 
  FileText,
  ShieldAlert,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AccountabilityProps {
  commitments: AccountabilityCommitment[];
  onAddCommitment: (
    title: string, 
    status: 'overdue' | 'due-soon' | 'completed', 
    committedDate: string, 
    dueDate: string, 
    impact: string
  ) => void;
  executiveScore: number;
  onRefresh?: () => void;
}

export default function Accountability({ 
  commitments, 
  onAddCommitment, 
  executiveScore,
  onRefresh 
}: AccountabilityProps) {
  // Manual adding state
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<'overdue' | 'due-soon' | 'completed'>('due-soon');
  const [committedDate, setCommittedDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [impact, setImpact] = useState("");

  // AI Intake Assistance states
  const [showAiIntake, setShowAiIntake] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [draftSuccessMsg, setDraftSuccessMsg] = useState("");

  // AI Audit Assessment states
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [auditReport, setAuditReport] = useState<{
    analysisText: string;
    completionRatioEvaluation: string;
    investorCompletionSlipText: string;
    operationsCompletionSlipText: string;
    strategicBoardMilestonesText: string;
    recommendedIntervention: string;
    suggestedRecoveryActions: Array<{
      title: string;
      day: string;
      description: string;
    }>;
  } | null>(null);

  const [isShedulingMitigations, setIsSchedulingMitigations] = useState(false);
  const [mitigationsApplied, setMitigationsApplied] = useState(false);

  const overdue = commitments.filter(c => c.status === "overdue");
  const dueSoon = commitments.filter(c => c.status === "due-soon");
  const completed = commitments.filter(c => c.status === "completed");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !impact.trim()) return;
    onAddCommitment(title, status, committedDate || "June 2, 2026", dueDate || "June 5, 2026", impact);
    setTitle("");
    setCommittedDate("");
    setDueDate("");
    setImpact("");
    setShowAdd(false);
  };

  const completionRate = Math.round(
    (completed.length / (commitments.length || 1)) * 100
  );

  // Trigger Gemini AI Commit Draft Assistant
  const handleAiDraft = async () => {
    if (!aiPrompt.trim()) return;
    setIsDrafting(true);
    setDraftError("");
    setDraftSuccessMsg("");
    try {
      const res = await fetch("/api/accountability/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: aiPrompt })
      });
      if (!res.ok) {
        throw new Error("Failed to formulate promise details from text.");
      }
      const data = await res.json();
      if (data.status === "success" && data.draft) {
        setTitle(data.draft.title);
        setCommittedDate(data.draft.committedDate);
        setDueDate(data.draft.dueDate);
        setImpact(data.draft.impact);
        setStatus(data.draft.status);
        
        setShowAdd(true);
        setDraftSuccessMsg("Gemini AI successfully extracted commitment details! Review and confirm below.");
        setAiPrompt("");
        setShowAiIntake(false);
      } else {
        setDraftError("Could not parse your prompt. Let's try again.");
      }
    } catch (err: any) {
      setDraftError(err.message || "Offline / AI parsing speed bump.");
    } finally {
      setIsDrafting(false);
    }
  };

  // Trigger Gemini AI Performance Audit
  const handleAiAudit = async () => {
    setIsAuditing(true);
    setAuditError("");
    setMitigationsApplied(false);
    try {
      const res = await fetch("/api/accountability/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) {
        throw new Error("Failed to securely generate accountability audit.");
      }
      const data = await res.json();
      if (data.status === "success" && data.audit) {
        setAuditReport(data.audit);
      } else {
        setAuditError("Could not retrieve AI Performance analysis.");
      }
    } catch (err: any) {
      setAuditError(err.message || "Cognitive review systems are loaded.");
    } finally {
      setIsAuditing(false);
    }
  };

  // Schedule AI Recommended Recovery actions to live action_plan_items DB
  const handleInjectMitigations = async () => {
    if (!auditReport || auditReport.suggestedRecoveryActions.length === 0) return;
    setIsSchedulingMitigations(true);
    try {
      const res = await fetch("/api/accountability/mitigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions: auditReport.suggestedRecoveryActions })
      });
      if (!res.ok) {
        throw new Error("Failed to auto-configure mitigation ledger.");
      }
      const data = await res.json();
      if (data.status === "success") {
        setMitigationsApplied(true);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSchedulingMitigations(false);
    }
  };

  // Render text helper to format simple markdown-like double stars and bullet splittings
  const renderAuditSummary = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      if (!trimmed) return null;

      // Check header
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="font-serif-cormorant text-base text-[#F0EFE8] font-bold mt-3 mb-1.5 border-b border-[rgba(201,168,76,0.06)] pb-1">
            {trimmed.replace(/###\s*|\*\*+/g, "")}
          </h4>
        );
      }

      // Check bullets
      if (trimmed.startsWith("*") || trimmed.startsWith("-") || trimmed.startsWith("·")) {
        const cleanContent = trimmed.replace(/^[\s*\-·]+\s*/, "");
        const parts = cleanContent.split(":");
        if (parts.length > 1) {
          return (
            <li key={idx} className="list-none text-xs text-[rgba(240,239,232,0.8)] leading-relaxed mb-1.5 pl-3 border-l border-[#C9A84C] ml-1">
              <strong className="text-[#C9A84C] font-mono tracking-wide">{parts[0].replace(/\*\*+/g, "")}:</strong>
              <span>{parts.slice(1).join(":")}</span>
            </li>
          );
        }
        return (
          <li key={idx} className="list-none text-xs text-[rgba(240,239,232,0.8)] leading-relaxed mb-1.5 pl-3 border-l border-[#C9A84C] ml-1">
            {cleanContent.replace(/\*\*+/g, "")}
          </li>
        );
      }

      return (
        <p key={idx} className="text-xs text-[rgba(240,239,232,0.75)] leading-relaxed mb-2 font-light">
          {trimmed.replace(/\*\*+/g, "")}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(201,168,76,0.1)] pb-4">
        <div>
          <h1 className="font-serif-cormorant text-3xl font-semibold text-[#F0EFE8] leading-tight">
            Accountability Ledger
          </h1>
          <p className="font-mono text-[11px] tracking-[1.5px] text-[#C9A84C] mt-1">
            CRITICAL RECORD OF FOUNDER PROMISES, STRATEGIC BOARD COMMITMENTS & AI COMPLIANCE AUDITING
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setShowAiIntake(!showAiIntake);
              setShowAdd(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 border border-[#C9A84C] text-[10px] font-mono uppercase tracking-wider text-[#C9A84C] bg-[rgba(201,168,76,0.04)] hover:bg-[rgba(201,168,76,0.12)] rounded transition-all"
          >
            <Sparkles size={12} className="text-[#C9A84C]" /> AI Promise Draft
          </button>
          
          <button
            onClick={() => {
              setShowAdd(!showAdd);
              setShowAiIntake(false);
              setDraftSuccessMsg("");
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#C9A84C] text-[#06090F] text-[10px] font-mono uppercase font-bold tracking-wider hover:bg-[#DBC37A] rounded transition-all transition-colors"
          >
            <Plus size={12} /> Commit Promise Manual
          </button>
        </div>
      </div>

      {draftSuccessMsg && (
        <div className="p-3 bg-[rgba(29,158,117,0.1)] border border-[rgba(29,158,117,0.3)] text-xs text-[#1D9E75] rounded-lg font-sans flex items-center gap-2">
          <Check size={14} className="flex-shrink-0" />
          <span>{draftSuccessMsg}</span>
        </div>
      )}

      {/* AI Promise Draft Assistant collapse */}
      <AnimatePresence>
        {showAiIntake && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 bg-[rgba(10,16,35,0.92)] border border-[rgba(201,168,76,0.22)] rounded-lg space-y-3.5 max-w-xl"
          >
            <div className="flex justify-between items-center border-b border-[rgba(201,168,76,0.1)] pb-1.5">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#C9A84C] animate-pulse" />
                <h3 className="font-serif-cormorant text-sm text-[#C9A84C] font-semibold">Gemini AI Promise Intake Helper</h3>
              </div>
              <button onClick={() => setShowAiIntake(false)} className="text-[rgba(240,239,232,0.5)] hover:text-[#F0EFE8]">
                <X size={15} />
              </button>
            </div>
            
            <p className="text-[11px] text-[rgba(240,239,232,0.65)] leading-relaxed">
              Type your raw action plan goal or promise below. AI will intelligently extract a professional corporate title, calculate relevant milestones relative to today (June 2), and formulate target impacts.
            </p>

            <div className="space-y-2">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. need to compile Mr. Chick'n Master financial audit and get it to investor Dinesh Mehta by next Thursday afternoon. This is key to unlocking the SPV 42 strategic allocation."
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.15)] rounded p-2 text-xs text-[#F0EFE8] h-16 resize-none focus:outline-none focus:border-[#C9A84C] font-sans"
              />
              
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-[rgba(240,239,232,0.4)]">Uses Google Gemini 3.5-Flash</span>
                <button
                  type="button"
                  onClick={handleAiDraft}
                  disabled={isDrafting || !aiPrompt.trim()}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#C9A84C] text-[#06090F] font-mono text-[10px] uppercase rounded font-bold disabled:opacity-40"
                >
                  {isDrafting ? (
                    <>
                      <RefreshCw size={11} className="animate-spin" /> Drafting Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles size={11} /> Parse & Build Draft
                    </>
                  )}
                </button>
              </div>
            </div>

            {draftError && <p className="text-[10px] text-[#E24B4A] font-mono">Error: {draftError}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Commit Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit} 
            className="p-4 bg-[rgba(10,16,32,0.95)] border border-[rgba(201,168,76,0.3)] rounded-lg space-y-4 max-w-lg overflow-hidden"
          >
            <div className="flex justify-between items-center border-b border-[rgba(201,168,76,0.1)] pb-2">
              <h3 className="font-serif-cormorant text-xs text-[#C9A84C] uppercase tracking-wider font-semibold flex items-center gap-1">Commit Promise Node to Ledger</h3>
              <button type="button" onClick={() => setShowAdd(false)} className="text-[rgba(240,239,232,0.5)]">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[9px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Promise Title / Objective</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Finalize FOCO outlet performance reports"
                  className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:outline-none focus:border-[#C9A84C]"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">State Gate</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-1.5 text-xs text-[#F0EFE8] focus:outline-none"
                  >
                    <option value="due-soon">⏰ Due Soon</option>
                    <option value="overdue">🔴 Slipped / Overdue</option>
                    <option value="completed">✓ Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Committed Date</label>
                  <input
                    type="text"
                    required
                    value={committedDate}
                    onChange={(e) => setCommittedDate(e.target.value)}
                    placeholder="e.g. May 28"
                    className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-1.5 text-xs text-[#F0EFE8] focus:outline-none focus:border-[#C9A84C]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Due Date</label>
                  <input
                    type="text"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="e.g. June 5"
                    className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-1.5 text-xs text-[#F0EFE8] focus:outline-none focus:border-[#C9A84C]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Core Critical Business Impact Estimation</label>
                <input
                  type="text"
                  required
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  placeholder="Impact: Pushes Round B close and lowers leverage negotiations"
                  className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:outline-none focus:border-[#C9A84C]"
                />
              </div>
            </div>
            
            <button type="submit" className="w-full py-2 bg-[#C9A84C] text-[#06090F] font-mono text-xs uppercase rounded font-bold cursor-pointer hover:bg-[#DBC37A]">
              Enforce Accountability Gate
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Slipped Overdue Commitments */}
      <section className="space-y-3">
        <h2 className="text-[10px] tracking-[3px] uppercase text-[#E24B4A] font-mono flex items-center gap-1">
          <Flame size={12} className="animate-pulse" /> Slipped Overdue Commitments
        </h2>
        <div className="flex flex-col gap-3">
          {overdue.length === 0 ? (
            <p className="text-xs text-[rgba(240,239,232,0.4)] font-mono italic p-4 bg-[rgba(8,12,22,0.3)] rounded border border-[rgba(201,168,76,0.06)]">
              No outstanding overdue commitments registered currently. Excellent detail compliance.
            </p>
          ) : (
            overdue.map((c) => (
              <div key={c.id} className="bg-[rgba(8,12,22,0.7)] border border-[rgba(201,168,76,0.14)] border-l-4 border-l-[#E24B4A] rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <h4 className="font-medium text-[13px] text-[#F0EFE8] tracking-tight">{c.title}</h4>
                  <div className="font-mono text-[9px] tracking-wider bg-[rgba(226,75,74,0.1)] px-2 py-0.5 border border-[rgba(226,75,74,0.22)] text-[#E24B4A] rounded uppercase">
                    {c.committedDaysOverdue ? `${c.committedDaysOverdue} DAYS SLIPPED` : "OVERDUE"}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-[rgba(240,239,232,0.6)] font-mono">
                  <span className="flex items-center gap-1"><Calendar size={11} className="text-[#C9A84C]" /> Committed: {c.committedDate}</span>
                  <span>Due Milestone: {c.dueDate}</span>
                </div>
                {c.impact && (
                  <div className="text-[11px] text-[rgba(226,75,74,0.85)] italic pt-1.5 border-t border-[rgba(201,168,76,0.06)] flex items-start gap-1">
                    <ShieldAlert size={12} className="mt-0.5 flex-shrink-0" />
                    <span>Business Impact: {c.impact}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Due Soon Commitments */}
      <section className="space-y-3">
        <h2 className="text-[10px] tracking-[3px] uppercase text-[#EF9F27] font-mono flex items-center gap-1">
          <AlertCircle size={12} /> Pending Commitments & Milestones
        </h2>
        <div className="flex flex-col gap-2.5">
          {dueSoon.length === 0 ? (
            <p className="text-xs text-[rgba(240,239,232,0.4)] font-mono italic">No upcoming commitments in active rotation.</p>
          ) : (
            dueSoon.map((c) => (
              <div key={c.id} className="bg-[rgba(8,12,22,0.7)] border border-[rgba(201,168,76,0.12)] border-l-4 border-l-[#EF9F27] rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center gap-4">
                  <h4 className="font-medium text-[13px] text-[#F0EFE8]">{c.title}</h4>
                  <div className="font-mono text-[9px] tracking-wider bg-[rgba(239,159,39,0.1)] px-2 py-0.5 border border-[rgba(239,159,39,0.22)] text-[#EF9F27] rounded uppercase">Due Soon</div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-[rgba(240,239,232,0.5)] font-mono">
                  <span className="flex items-center gap-1"><Calendar size={11} className="text-[#EF9F27]" /> Target Deadline: {c.dueDate}</span>
                </div>
                {c.impact && (
                  <p className="text-[11px] text-[rgba(240,239,232,0.65)] pt-1 border-t border-[rgba(201,168,76,0.04)] italic">
                    Impact: {c.impact}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Completed Commitments (Collapsible / Compact) */}
      {completed.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-[10px] tracking-[3px] uppercase text-[#1D9E75] font-mono flex items-center gap-1">
            <Check size={12} /> Archive of Handled Obligations ({completed.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {completed.map((c) => (
              <div key={c.id} className="bg-[rgba(29,158,117,0.02)] border border-[rgba(29,158,117,0.15)] rounded p-3 flex justify-between items-center">
                <div>
                  <h4 className="text-xs text-[#F0EFE8] font-medium line-through decoration-[rgba(240,239,232,0.3)]">{c.title}</h4>
                  <p className="text-[9px] font-mono text-[rgba(240,239,232,0.4)] mt-0.5">Completed prior to target {c.dueDate}</p>
                </div>
                <Check size={14} className="text-[#1D9E75] flex-shrink-0" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Metrics Header */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[rgba(201,168,76,0.1)] pt-6">
        <div className="p-4 bg-[rgba(8,12,22,0.7)] border border-[rgba(201,168,76,0.12)] rounded-lg text-center">
          <span className="block text-[9px] uppercase tracking-wider font-mono text-[rgba(240,239,232,0.5)]">Total Tracked Promises</span>
          <div className="font-serif-cormorant text-3xl font-semibold text-[#F0EFE8] mt-1">{commitments.length}</div>
        </div>
        <div className="p-4 bg-[rgba(8,12,22,0.7)] border border-[rgba(201,168,76,0.12)] rounded-lg text-center font-mono">
          <span className="block text-[9px] uppercase tracking-wider text-[rgba(240,239,232,0.5)]">Completion Fidelity Rate</span>
          <div className="text-2xl font-bold text-[#1D9E75] mt-1.5">{completionRate}%</div>
        </div>
        <div className="p-4 bg-[rgba(8,12,22,0.7)] border border-[rgba(201,168,76,0.12)] rounded-lg text-center">
          <span className="block text-[9px] uppercase tracking-wider font-mono text-[rgba(240,239,232,0.5)]">Audit score</span>
          <div className={`text-2xl font-bold font-mono mt-1.5 ${executiveScore >= 70 ? 'text-[#1D9E75]' : executiveScore >= 50 ? 'text-[#EF9F27]' : 'text-[#E24B4A]'}`}>{executiveScore}/100</div>
        </div>
      </section>

      {/* CORE DYNAMIC AI ACCOUNTABILITY AUDITING SECTION */}
      <section className="bg-[rgba(10,16,32,0.7)] border border-[rgba(201,168,76,0.22)] rounded-xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(201,168,76,0.1)] pb-3">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-[#C9A84C]" />
            <div>
              <h3 className="text-sm font-serif-cormorant font-semibold text-[#F0EFE8]">
                AI Accountability Audit & Contingency Planner
              </h3>
              <p className="text-[10px] font-mono text-[rgba(240,239,232,0.5)] uppercase tracking-wider">
                CRYPTOGRAPHIC COMPLIANCE REVIEW (Powered by Gemini AI)
              </p>
            </div>
          </div>
          
          <button
            onClick={handleAiAudit}
            disabled={isAuditing}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#C9A84C] text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] bg-[rgba(201,168,76,0.06)] hover:bg-[rgba(201,168,76,0.15)] rounded font-semibold disabled:opacity-55 cursor-pointer transition-colors"
          >
            {isAuditing ? (
              <>
                <RefreshCw size={12} className="animate-spin" /> Fetching Strategic Review...
              </>
            ) : (
              <>
                <Zap size={12} className="text-[#C9A84C]" /> Run Strategic Compliance Audit
              </>
            )}
          </button>
        </div>

        {auditError && (
          <div className="p-3 bg-[rgba(226,75,74,0.1)] border border-[rgba(226,75,74,0.3)] text-xs text-[#E24B4A] rounded">
            Error loading audit: {auditError}
          </div>
        )}

        {!auditReport && !isAuditing && (
          <div className="text-center py-6 space-y-2">
            <LayoutList size={28} className="mx-auto text-[rgba(240,239,232,0.22)]" />
            <p className="text-xs text-[rgba(240,239,232,0.55)] max-w-md mx-auto">
              Initiate a live AI audit of current corporate targets. The engine will evaluate slippage risk and generate automatic contingency action plans.
            </p>
          </div>
        )}

        {isAuditing && (
          <div className="py-12 flex flex-col justify-center items-center space-y-3.5">
            <div className="w-8 h-8 rounded-full border border-t-[#C9A84C] border-[rgba(201,168,76,0.1)] animate-spin" />
            <div className="text-center space-y-1">
              <span className="font-mono text-[10px] text-[#C9A84C] tracking-widest uppercase block">Analyzing commitments...</span>
              <p className="text-[11px] text-[rgba(240,239,232,0.45)] italic">Google Gemini auditing corporate delay risks & compiling contingency plans</p>
            </div>
          </div>
        )}

        {auditReport && !isAuditing && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="space-y-5"
          >
            {/* Audited Risk Vectors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-[#05080F] border border-[rgba(201,168,76,0.15)] rounded">
                <span className="block text-[8px] uppercase font-mono text-[rgba(240,239,232,0.45)] tracking-wide">Fidelity Index Assessment</span>
                <div className="text-xs font-semibold text-[#1D9E75] mt-1 flex items-center gap-1.5">
                  <TrendingUp size={12} />
                  {auditReport.completionRatioEvaluation}
                </div>
              </div>
              <div className="p-3 bg-[#05080F] border border-[rgba(201,168,76,0.15)] rounded">
                <span className="block text-[8px] uppercase font-mono text-[rgba(240,239,232,0.45)] tracking-wide">Investor Trust Leak Alert</span>
                <div className="text-xs font-semibold text-[#EF9F27] mt-1 flex items-center gap-1.5">
                  <FileText size={12} />
                  {auditReport.investorCompletionSlipText}
                </div>
              </div>
              <div className="p-3 bg-[#05080F] border border-[rgba(201,168,76,0.15)] rounded">
                <span className="block text-[8px] uppercase font-mono text-[rgba(240,239,232,0.45)] tracking-wide">Operations Slippage Preds</span>
                <div className="text-xs font-semibold text-red-400 mt-1 flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  {auditReport.operationsCompletionSlipText}
                </div>
              </div>
            </div>

            {/* AI Advisor Core Assessment lines */}
            <div className="p-4 bg-[rgba(8,12,22,0.85)] border border-[rgba(201,168,76,0.08)] rounded-lg space-y-1 max-w-3xl">
              {renderAuditSummary(auditReport.analysisText)}
            </div>

            {/* Strategic Structural Intervention advice */}
            <div className="bg-[rgba(201,168,76,0.04)] border-l-4 border-[#C9A84C] rounded-lg p-4 space-y-2">
              <h4 className="text-[10px] font-mono tracking-widest text-[#C9A84C] uppercase font-bold flex items-center gap-1.5">
                <ShieldAlert size={12} /> Mandatory System Accountability Intervention
              </h4>
              <p className="text-xs text-[rgba(240,239,232,0.8)] leading-relaxed">
                {auditReport.recommendedIntervention}
              </p>
            </div>

            {/* Suggested Recovery Actions & Auto Mitigation */}
            <div className="space-y-3.5 border-t border-[rgba(201,168,76,0.1)] pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-xs font-mono font-bold text-[#F0EFE8] uppercase tracking-wider flex items-center gap-1.5">
                    <Check size={13} className="text-[#1D9E75]" /> Contingency Mitigation Plan (Target Actions)
                  </h4>
                  <p className="text-[10px] text-[rgba(240,239,232,0.5)]">Evaluate the proposed corporate salvage efforts to recover slipped commitments.</p>
                </div>

                {mitigationsApplied ? (
                  <div className="px-3.5 py-1.5 bg-[rgba(29,158,117,0.12)] border border-[rgba(29,158,117,0.31)] text-[#1D9E75] text-[10px] font-mono rounded font-semibold flex items-center gap-1.5">
                    <Check size={12} /> Mitigation Blueprint Applied!
                  </div>
                ) : (
                  <button
                    onClick={handleInjectMitigations}
                    disabled={isShedulingMitigations || auditReport.suggestedRecoveryActions.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A84C] text-[#06090F] text-[10px] font-mono uppercase font-bold tracking-wider hover:bg-[#DBC37A] rounded transition-all disabled:opacity-45"
                  >
                    {isShedulingMitigations ? (
                      <>
                        <RefreshCw size={11} className="animate-spin" /> Auto-Scheduling...
                      </>
                    ) : (
                      <>
                        <Zap size={11} /> Auto-Inject Plan to Calendar
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {auditReport.suggestedRecoveryActions.map((act, i) => (
                  <div key={i} className="p-3 bg-[#05080F] border border-[rgba(201,168,76,0.12)] rounded space-y-1">
                    <div className="flex justify-between items-center pb-1 border-b border-[rgba(201,168,76,0.06)]">
                      <span className="text-[9px] font-bold text-[#C9A84C] uppercase tracking-wider">{act.day}</span>
                      <span className="text-[8px] font-mono text-[rgba(240,239,232,0.35)]">RECOVERY</span>
                    </div>
                    <h5 className="text-[11px] font-semibold text-[#F0EFE8] pt-1">{act.title}</h5>
                    <p className="text-[10px] text-[rgba(240,239,232,0.55)] leading-relaxed">{act.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}
