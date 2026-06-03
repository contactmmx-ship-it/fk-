import React, { useState, useEffect } from "react";
import { Investor } from "../types";
import { 
  UserPlus, 
  Search, 
  DollarSign, 
  Mail, 
  Phone, 
  Calendar, 
  Trash2, 
  Sparkles, 
  Check, 
  RefreshCw, 
  Layers, 
  Edit3, 
  Save, 
  Send, 
  MessageSquare, 
  FileText, 
  Layers2, 
  Briefcase, 
  FileSpreadsheet, 
  PhoneCall, 
  Handshake, 
  AlertCircle,
  Plus,
  MailOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InvestorCRMProps {
  investors: Investor[];
  onAddInvestor: (investor: Omit<Investor, "id" | "lastContacted">) => void;
  onRemoveInvestor: (id: string) => void;
  onRefresh?: () => void;
}

export default function InvestorCRM({ 
  investors, 
  onAddInvestor, 
  onRemoveInvestor,
  onRefresh 
}: InvestorCRMProps) {
  // Navigation & Filtering
  const [filterStage, setFilterStage] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Manual onboarding form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [ticketSize, setTicketSize] = useState("7500000"); // 75L default
  const [stage, setStage] = useState<'cold' | 'warm' | 'due-diligence' | 'committed'>('warm');
  const [spv, setSpv] = useState("");
  const [notes, setNotes] = useState("");

  // CRM Workspace states
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [logType, setLogType] = useState<'call' | 'meeting' | 'email' | 'dispatched_docs'>('call');
  const [logSummary, setLogSummary] = useState("");
  const [currentEditNotes, setCurrentEditNotes] = useState("");
  const [isNotesFocused, setIsNotesFocused] = useState(false);

  // AI Outreach states
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [aiPitch, setAiPitch] = useState<{
    emailSubject: string;
    emailBody: string;
    strategyTactics: string;
  } | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Filter lists
  const filteredInvestors = investors.filter((inv) => {
    const matchesStage = filterStage === "all" || inv.stage === filterStage;
    const matchesSearch = inv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (inv.notes && inv.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStage && matchesSearch;
  });

  // Set default selected investor if none selected or the selected one got removed
  useEffect(() => {
    if (filteredInvestors.length > 0) {
      if (!selectedId || !investors.some(i => i.id === selectedId)) {
        setSelectedId(filteredInvestors[0].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [filteredInvestors, investors, selectedId]);

  const selectedInvestor = investors.find(i => i.id === selectedId) || null;

  useEffect(() => {
    if (selectedInvestor) {
      setCurrentEditNotes(selectedInvestor.notes || "");
      setAiPitch(null); // Reset pitch when switching investors to prevent confusion
    }
  }, [selectedId, selectedInvestor]);

  // Goal statistics
  const totalCommitted = investors
    .filter(i => i.stage === "committed")
    .reduce((sum, current) => sum + Number(current.ticketSizeRs), 0);

  const totalTargetGoal = 132000000; // 13.2 Cr target
  const committedPercentage = Math.round((totalCommitted / totalTargetGoal) * 100);

  // Submit manual onboard
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddInvestor({
      name,
      email: email || "investor@example.com",
      contact: contact || "+91 Contact Pending",
      ticketSizeRs: Number(ticketSize),
      stage,
      spvAllocated: spv || "Pending Allocation",
      notes: notes || ""
    });
    setName("");
    setEmail("");
    setContact("");
    setNotes("");
    setSpv("");
    setTicketSize("7500000");
    setShowAdd(false);
  };

  // Change investor stage (on server)
  const handleStageChange = async (targetStage: 'cold' | 'warm' | 'due-diligence' | 'committed') => {
    if (!selectedInvestor) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/investors/${selectedInvestor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: targetStage })
      });
      if (res.ok) {
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error("Failed to update investor stage:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Update investor notes directly
  const handleNotesUpdate = async () => {
    if (!selectedInvestor) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/investors/${selectedInvestor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: currentEditNotes })
      });
      if (res.ok) {
        setIsNotesFocused(false);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error("Failed to update investor notes:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Log interaction (POST /api/investors/:id/log)
  const handleLogInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor || !logSummary.trim()) return;
    setIsLogging(true);
    try {
      const res = await fetch(`/api/investors/${selectedInvestor.id}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: logType, summary: logSummary })
      });
      if (res.ok) {
        setLogSummary("");
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error("Failed to log interaction:", err);
    } finally {
      setIsLogging(false);
    }
  };

  // Trigger Gemini AI custom follow-up pitching campaign
  const handleGenerateAiPitch = async () => {
    if (!selectedInvestor) return;
    setIsGeneratingPitch(true);
    setAiPitch(null);
    try {
      const res = await fetch(`/api/investors/${selectedInvestor.id}/pitch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success" && data.pitch) {
          setAiPitch(data.pitch);
        }
      }
    } catch (err) {
      console.error("Gemini failed generating pitch sequence:", err);
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const copyToClipboard = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(code);
    setTimeout(() => setCopySuccess(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(201,168,76,0.1)] pb-4">
        <div>
          <h1 className="font-serif-cormorant text-3xl font-semibold text-[#F0EFE8] leading-tight">
            Investor CRM & Deal Pipeline
          </h1>
          <p className="font-mono text-[11px] tracking-[1.5px] text-[#C9A84C] mt-1">
            ROUND B SYNDICATION PIPELINE WORKSPACES · TOTAL RM AUDITING
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-3.5 py-1.5 border border-[#C9A84C] text-[10px] font-mono uppercase tracking-wider text-[#C9A84C] bg-[rgba(201,168,76,0.04)] hover:bg-[rgba(201,168,76,0.12)] rounded transition-all transition-colors"
        >
          <UserPlus size={12} /> Onboard Syndicate Lead
        </button>
      </div>

      {/* Goal Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-xl p-4 flex flex-col justify-between space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[9px] text-[rgba(240,239,232,0.4)] uppercase tracking-wider block">Round B Progress Ledger</span>
              <span className="text-[13px] text-[#F0EFE8] font-serif-cormorant font-bold">
                ₹{(totalCommitted/10000000.0).toFixed(2)} Cr committed of ₹12.0 Cr base (₹13.2 Cr Target)
              </span>
            </div>
            <span className="font-mono text-sm text-[#C9A84C] font-semibold">{committedPercentage}%</span>
          </div>
          <div className="space-y-1.5">
            <div className="w-full h-1.5 bg-[rgba(201,168,76,0.08)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#8B6B2A] to-[#E8C878] rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, committedPercentage)}%` }}
              />
            </div>
            <div className="flex justify-between font-mono text-[8.5px] text-[rgba(240,239,232,0.35)]">
              <span>0.0 Cr</span>
              <span>6.6 Cr (Fifty Percent Target)</span>
              <span>13.2 Cr Goal</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0A1020] border border-[rgba(201,168,76,0.15)] rounded-lg p-3.5 flex flex-col justify-between">
            <span className="block text-[8px] font-mono uppercase text-[rgba(240,239,232,0.45)]">Committed Leads</span>
            <div>
              <div className="font-serif-cormorant text-2xl font-bold text-[#F0EFE8]">
                {investors.filter(i => i.stage === "committed").length}
              </div>
              <p className="text-[9px] font-mono text-[#1D9E75] mt-0.5">Active Allocations</p>
            </div>
          </div>
          <div className="bg-[#0A1020] border border-[rgba(201,168,76,0.15)] rounded-lg p-3.5 flex flex-col justify-between">
            <span className="block text-[8px] font-mono uppercase text-[rgba(240,239,232,0.45)]">In Negotiation</span>
            <div>
              <div className="font-serif-cormorant text-2xl font-bold text-[#F0EFE8]">
                {investors.filter(i => i.stage === "due-diligence" || i.stage === "warm").length}
              </div>
              <p className="text-[9px] font-mono text-[#EF9F27] mt-0.5">Due Diligence + Warm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Onboard form block collapse */}
      <AnimatePresence>
        {showAdd && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddSubmit} 
            className="p-4 bg-[rgba(10,16,32,0.95)] border border-[rgba(201,168,76,0.3)] rounded-lg space-y-4 max-w-xl mx-auto overflow-hidden"
          >
            <div className="flex justify-between items-center border-b border-[rgba(201,168,76,0.1)] pb-2">
              <h3 className="font-serif-cormorant text-xs text-[#C9A84C] uppercase tracking-wider font-semibold">Onboard New Syndicate Investor</h3>
              <button type="button" onClick={() => setShowAdd(false)} className="text-[rgba(240,239,232,0.5)]">
                <Trash2 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[9px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dinesh Mehta"
                  className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Syndication Ticket (INR Rupees)</label>
                <input
                  type="number"
                  required
                  value={ticketSize}
                  onChange={(e) => setTicketSize(e.target.value)}
                  placeholder="e.g. 7500000"
                  className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Security / SPV Shell Allocated</label>
                <input
                  type="text"
                  value={spv}
                  onChange={(e) => setSpv(e.target.value)}
                  placeholder="e.g. SPV 42 / Pending"
                  className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Lead Funnel Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as any)}
                  className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:outline-none"
                >
                  <option value="warm">⚡ Warm Lead (In discussion)</option>
                  <option value="due-diligence">⏰ Due Diligence (Reviewing files)</option>
                  <option value="committed">🟢 Formally Committed</option>
                  <option value="cold">❄ Cold / Postponed</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Email Coordinates</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dinesh@kapital.in"
                  className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+91-91234-56789"
                  className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[9px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Interactive discussion Summary / Objections</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Objections regarding franchise model stability. Requesting Mr. Chick'n Master financial sheets."
                  className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:outline-none"
                />
              </div>
            </div>

            <button type="submit" className="w-full py-2 bg-[#C9A84C] text-[#06090F] font-mono text-xs uppercase tracking-wider font-bold rounded hover:bg-[#DBC37A]">
              Register Investor Profile & Allocations
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Main CRM Workspace (Split Pane) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Directory Listing */}
        <div className="lg:col-span-5 space-y-3">
          
          {/* Filter & Search Headers */}
          <div className="bg-[#0A1020] border border-[rgba(201,168,76,0.12)] rounded-lg p-3.5 space-y-3">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#05080F] border border-[rgba(201,168,76,0.1)] rounded">
              <Search size={13} className="text-[rgba(240,239,232,0.4)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads..."
                className="bg-transparent border-none focus:outline-none text-xs text-[#F0EFE8] w-full placeholder-[rgba(240,239,232,0.35)]"
              />
            </div>

            <div className="flex flex-wrap gap-1 font-mono text-[9px]">
              {[
                { code: "all", label: "All" },
                { code: "committed", label: "Committed" },
                { code: "due-diligence", label: "D.D." },
                { code: "warm", label: "Warm" },
                { code: "cold", label: "Cold" }
              ].map((st) => (
                <button
                  key={st.code}
                  onClick={() => setFilterStage(st.code)}
                  className={`px-2 py-1 rounded transition-colors ${
                    filterStage === st.code
                      ? "bg-[#C9A84C] text-[#06090F] font-bold"
                      : "bg-[#05080F] text-[rgba(240,239,232,0.5)] border border-[rgba(201,168,76,0.08)] hover:border-[rgba(201,168,76,0.2)]"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Matches List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredInvestors.length === 0 ? (
              <div className="text-center py-10 bg-[#0A1020] border border-[rgba(201,168,76,0.08)] rounded-lg text-xs text-[rgba(240,239,232,0.4)] italic">
                No matching leads found.
              </div>
            ) : (
              filteredInvestors.map((inv) => {
                const isSelected = inv.id === selectedId;
                return (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setSelectedId(inv.id);
                      setAiPitch(null);
                    }}
                    className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected 
                        ? "bg-[rgba(201,168,76,0.06)] border-[#C9A84C]" 
                        : "bg-[#0A1020] border-[rgba(201,168,76,0.12)] hover:border-[rgba(201,168,76,0.25)]"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-semibold text-xs tracking-tight text-[#F0EFE8]">{inv.name}</h4>
                        <span className="block text-[9px] font-mono text-[rgba(240,239,232,0.4)] mt-0.5 truncate max-w-[200px]">
                          SPV Allocation: {inv.spvAllocated}
                        </span>
                      </div>
                      <span className={`px-1.5 py-0.5 text-[8px] font-mono rounded uppercase ${
                        inv.stage === "committed" ? "bg-[rgba(29,158,117,0.1)] text-[#1D9E75] border border-[rgba(29,158,117,0.25)]" : 
                        inv.stage === "due-diligence" ? "bg-[rgba(239,159,39,0.1)] text-[#EF9F27] border border-[rgba(239,159,39,0.25)]" : 
                        inv.stage === "cold" ? "bg-[rgba(226,75,74,0.08)] text-[#E24B4A] border border-[rgba(226,75,74,0.22)]" :
                        "bg-[rgba(240,239,232,0.05)] text-[rgba(240,239,232,0.6)]"
                      }`}>
                        {inv.stage === "due-diligence" ? "Due Diligence" : inv.stage}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono text-[rgba(240,239,232,0.5)] border-t border-[rgba(201,168,76,0.06)] mt-2 pt-1.5">
                      <span className="text-[#C9A84C] font-semibold">₹{(inv.ticketSizeRs / 100000.0).toFixed(1)}L Ticket</span>
                      <span>Contacted: {inv.lastContacted}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Investor Details Workspace & Action Center */}
        <div className="lg:col-span-7">
          {selectedInvestor ? (
            <div className="bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-xl p-5 space-y-6 text-left">
              
              {/* Selected Investor Main Info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(201,168,76,0.08)] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-[#C9A84C]" />
                    <h2 className="font-serif-cormorant text-xl font-bold text-[#F0EFE8]">{selectedInvestor.name}</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-[rgba(240,239,232,0.45)]">
                    <span className="flex items-center gap-1"><Mail size={11} /> {selectedInvestor.email}</span>
                    <span className="flex items-center gap-1"><Phone size={11} /> {selectedInvestor.contact}</span>
                  </div>
                </div>

                <div className="bg-[#05080F] border border-[rgba(201,168,76,0.15)] rounded px-3 py-1.5 text-center sm:text-right minimum-w-[120px]">
                  <span className="block text-[8px] font-mono uppercase text-[rgba(240,239,232,0.4)]">Committed Ticket Range</span>
                  <span className="block text-sm font-mono text-[#C9A84C] font-semibold">
                    ₹{(selectedInvestor.ticketSizeRs / 100000.0).toFixed(1)} Lakhs
                  </span>
                </div>
              </div>

              {/* Deal Stage Step Control */}
              <div className="space-y-2">
                <span className="block text-[8px] font-mono uppercase text-[rgba(240,239,232,0.45)] tracking-wider">
                  Update Deal Pipeline Stage Gate
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { code: "cold", title: "❄ Cold / Delay" },
                    { code: "warm", title: "⚡ Warm Lead" },
                    { code: "due-diligence", title: "⏰ Due Diligence" },
                    { code: "committed", title: "🟢 Committed" }
                  ].map((sg) => {
                    const isCurrent =selectedInvestor.stage === sg.code;
                    return (
                      <button
                        key={sg.code}
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStageChange(sg.code as any)}
                        className={`py-1.5 text-[9.5px] font-mono rounded transition-all cursor-pointer ${
                          isCurrent 
                            ? "bg-[#C9A84C] text-[#06090F] font-bold border border-[#C9A84C]" 
                            : "bg-[#05080F] text-[rgba(240,239,232,0.6)] border border-[rgba(201,168,76,0.08)] hover:border-[rgba(201,168,76,0.2)]"
                        }`}
                      >
                        {sg.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CRM Live Interaction Logs & Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2 border-t border-[rgba(201,168,76,0.06)]">
                
                {/* Panel: Notes & Editable Details */}
                <div className="md:col-span-7 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="block text-[8px] font-mono uppercase text-[rgba(240,239,232,0.45)] tracking-wider flex items-center gap-1">
                      <FileText size={11} /> Historical Notes / Requirements thread
                    </span>
                    {isNotesFocused && (
                      <button
                        onClick={handleNotesUpdate}
                        disabled={isUpdating}
                        className="flex items-center gap-1 px-2 py-0.5 bg-[#C9A84C] text-[#06090F] font-mono text-[9px] uppercase rounded font-bold"
                      >
                        <Save size={10} /> Save Changes
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <textarea
                      rows={5}
                      value={currentEditNotes}
                      onChange={(e) => setCurrentEditNotes(e.target.value)}
                      onFocus={() => setIsNotesFocused(true)}
                      placeholder="Add strategic discussions details, board observer expectations, or franchise security objections..."
                      className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.15)] rounded-lg p-2.5 text-xs text-[rgba(240,239,232,0.85)] leading-relaxed focus:outline-none focus:border-[#C9A84C] font-sans"
                    />
                    {!isNotesFocused && (
                      <div className="absolute right-2 bottom-2 text-[9px] font-mono text-[rgba(240,239,232,0.3)] flex items-center gap-1 pointer-events-none">
                        <Edit3 size={10} /> Click to Manual Edit Notes
                      </div>
                    )}
                  </div>

                  {selectedInvestor.notes && (
                    <div className="text-[10px] font-mono text-[rgba(240,239,232,0.45)] flex items-center justify-between">
                      <span>SPV Shell allocated: {selectedInvestor.spvAllocated}</span>
                      <span>Last Audited: {selectedInvestor.lastContacted}</span>
                    </div>
                  )}
                </div>

                {/* Panel: Fast Interaction Logger */}
                <div className="md:col-span-5 bg-[#05080F] border border-[rgba(201,168,76,0.08)] rounded-lg p-3.5 space-y-3">
                  <span className="block text-[8px] font-mono uppercase text-[rgba(240,239,232,0.4)] tracking-wider">
                    Log Investor Interaction
                  </span>

                  <form onSubmit={handleLogInteraction} className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-1 font-mono text-[8px]">
                      {[
                        { code: "call", icon: <PhoneCall size={9} />, label: "Call" },
                        { code: "meeting", icon: <Handshake size={9} />, label: "Meeting" },
                        { code: "email", icon: <Send size={9} />, label: "Email" },
                        { code: "dispatched_docs", icon: <FileSpreadsheet size={9} />, label: "Docs Pack" }
                      ].map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => setLogType(item.code as any)}
                          className={`flex items-center justify-center gap-1.5 py-1 rounded border capitalize transition-colors cursor-pointer ${
                            logType === item.code 
                              ? "bg-[rgba(201,168,76,0.15)] text-[#C9A84C] border-[#C9A84C]" 
                              : "bg-[#0A1020] text-[rgba(240,239,232,0.5)] border-[rgba(201,168,76,0.05)]"
                          }`}
                        >
                          {item.icon} {item.label}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={2}
                      required
                      value={logSummary}
                      onChange={(e) => setLogSummary(e.target.value)}
                      placeholder="e.g. Conducted audit call. Cleared QSR outlet stable margins metrics. Ready to sign SPV docs."
                      className="w-full bg-[#06090F] border border-[rgba(201,168,76,0.12)] rounded p-1.5 text-[11px] text-[#F0EFE8] focus:outline-none focus:border-[#C9A84C]"
                    />

                    <button
                      type="submit"
                      disabled={isLogging || !logSummary.trim()}
                      className="w-full py-1.5 bg-[#C9A84C] text-[#06090F] font-mono text-[9px] uppercase font-bold rounded flex items-center justify-center gap-1 disabled:opacity-45"
                    >
                      {isLogging ? (
                        <>
                          <RefreshCw size={10} className="animate-spin" /> Logging...
                        </>
                      ) : (
                        <>
                          <Plus size={10} /> Log Interactions (June 2)
                        </>
                      )}
                    </button>
                  </form>
                </div>

              </div>

              {/* Gemini AI Outreach Campaign Assistant */}
              <div className="pt-5 border-t border-[rgba(201,168,76,0.08)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-serif-cormorant font-bold text-[#F0EFE8] flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#C9A84C]" /> 
                      Gemini AI Strategic Outreach Composer
                    </h3>
                    <p className="text-[10px] font-mono text-[rgba(240,239,232,0.5)]">
                      Compile customized follow-ups & address investor blockages dynamically
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateAiPitch}
                    disabled={isGeneratingPitch}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[rgba(201,168,76,0.05)] border border-[#C9A84C] text-[10px] text-[#C9A84C] font-mono uppercase rounded font-bold hover:bg-[rgba(201,168,76,0.15)] disabled:opacity-50 transition-colors"
                  >
                    {isGeneratingPitch ? (
                      <>
                        <RefreshCw size={11} className="animate-spin" /> Drafting Pitch...
                      </>
                    ) : (
                      <>
                        <Sparkles size={11} /> Generate Pitch Sequences
                      </>
                    )}
                  </button>
                </div>

                {isGeneratingPitch && (
                  <div className="py-8 bg-[#05080F] border border-[rgba(201,168,76,0.12)] rounded-lg text-center space-y-2">
                    <div className="w-5 h-5 rounded-full border border-t-[#C9A84C] border-[rgba(201,168,76,0.1)] animate-spin mx-auto" />
                    <p className="text-[10px] font-mono text-[#C9A84C] uppercase tracking-wider animate-pulse">
                      Analyzing ticket sizes, SPVs, & historical friction...
                    </p>
                  </div>
                )}

                {aiPitch && !isGeneratingPitch && (
                  <motion.div 
                    initial={{ opacity: 0, y: 6 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {/* Draft Follow up Email */}
                    <div className="bg-[#05080F] border border-[rgba(201,168,76,0.12)] rounded-lg p-4 space-y-3 relative">
                      <div className="flex justify-between items-center border-b border-[rgba(201,168,76,0.06)] pb-1.5">
                        <span className="text-[9px] font-mono text-[#C9A84C] font-bold uppercase tracking-wider flex items-center gap-1">
                          <MailOpen size={11} /> Hyper-Personalized Follow-up
                        </span>
                        <button
                          onClick={() => copyToClipboard(`${aiPitch.emailSubject}\n\n${aiPitch.emailBody}`, "email")}
                          className="text-[9px] font-mono uppercase px-2 py-0.5 rounded border border-[rgba(201,168,76,0.15)] text-[rgba(240,239,232,0.6)] hover:text-[#F0EFE8] flex items-center gap-1 transition-colors"
                        >
                          {copySuccess === "email" ? <Check size={10} className="text-[#1D9E75]" /> : <FileText size={10} />}
                          {copySuccess === "email" ? "Copied" : "Copy Draft"}
                        </button>
                      </div>

                      <div className="space-y-1.5 font-sans text-xs">
                        <div className="text-[rgba(240,239,232,0.5)] border-b border-[rgba(201,168,76,0.04)] pb-1 truncate">
                          <strong className="font-mono text-[9px] text-[#C9A84C] uppercase">Subj:</strong> {aiPitch.emailSubject}
                        </div>
                        <div className="whitespace-pre-line text-[rgba(240,239,232,0.85)] leading-relaxed h-[180px] overflow-y-auto pr-1 select-all font-light pt-1.5 text-[11px]">
                          {aiPitch.emailBody}
                        </div>
                      </div>
                    </div>

                    {/* Objection De-risking strategies */}
                    <div className="bg-[#05080F] border border-[rgba(201,168,76,0.12)] rounded-lg p-4 space-y-3 relative">
                      <div className="flex justify-between items-center border-b border-[rgba(201,168,76,0.06)] pb-1.5">
                        <span className="text-[9px] font-mono text-[#EF9F27] font-bold uppercase tracking-wider flex items-center gap-1">
                          <AlertCircle size={11} /> Objection Handling & Observers
                        </span>
                        <button
                          onClick={() => copyToClipboard(aiPitch.strategyTactics, "tactics")}
                          className="text-[9px] font-mono uppercase px-2 py-0.5 rounded border border-[rgba(201,168,76,0.15)] text-[rgba(240,239,232,0.6)] hover:text-[#F0EFE8] flex items-center gap-1 transition-colors"
                        >
                          {copySuccess === "tactics" ? <Check size={10} className="text-[#1D9E75]" /> : <FileText size={10} />}
                          {copySuccess === "tactics" ? "Copied" : "Copy strategy"}
                        </button>
                      </div>

                      <div className="text-[rgba(240,239,232,0.85)] leading-relaxed font-sans text-[11px] h-[190px] overflow-y-auto pr-1">
                        <div className="whitespace-pre-line leading-relaxed pb-2 text-[10.5px] font-mono text-[rgba(240,239,232,0.7)] text-left">
                          {aiPitch.strategyTactics}
                        </div>
                      </div>
                    </div>

                  </motion.div>
                )}
              </div>

              {/* Delete / Remove investor block */}
              <div className="pt-4 border-t border-[rgba(226,75,74,0.15)] flex justify-between items-center font-mono text-[10px]">
                <span className="text-[rgba(240,239,232,0.35)]">
                  Safety Zone: ensure backup allocation plans are ready.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const confirm = window.confirm(`Proceed with removing investor record "${selectedInvestor.name}"?`);
                    if (confirm) onRemoveInvestor(selectedInvestor.id);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 border border-[rgba(226,75,74,0.35)] hover:border-[#E24B4A] text-[rgba(240,239,232,0.5)] hover:text-[#E24B4A] rounded transition-all"
                >
                  <Trash2 size={11} /> Remove Lead From Ledger
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-[#0A1020] border border-[rgba(201,168,76,0.08)] rounded-xl p-10 text-center space-y-3">
              <Layers size={36} className="mx-auto text-[rgba(201,168,76,0.22)] animate-pulse" />
              <div className="space-y-1">
                <h3 className="font-serif-cormorant text-md text-[#F0EFE8] font-semibold">Select Investor Directory Card</h3>
                <p className="text-xs text-[rgba(240,239,232,0.45)] max-w-sm mx-auto leading-relaxed">
                  Choose a syndicate lead from the pipeline directory on the left to review metrics, logs and run Gemini strategic outreach.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
