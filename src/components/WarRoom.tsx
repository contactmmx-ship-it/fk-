import React, { useState } from "react";
import { WarRoomSession } from "../types";
import { Shield, Target, Plus, X, Skull, Award, ListFilter, HelpCircle } from "lucide-react";

interface WarRoomProps {
  session: WarRoomSession;
  onUpdateSession: (params: { title?: string; battlePlan?: string[]; adversaries?: string[]; allies?: string[] }) => void;
}

export default function WarRoom({ session, onUpdateSession }: WarRoomProps) {
  const [newPlan, setNewPlan] = useState("");
  const [newAdversary, setNewAdversary] = useState("");
  const [newAlly, setNewAlly] = useState("");

  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.trim()) return;
    const plans = [...session.battlePlan, newPlan.trim()];
    onUpdateSession({ battlePlan: plans });
    setNewPlan("");
  };

  const handleRemovePlan = (index: number) => {
    const plans = session.battlePlan.filter((_, i) => i !== index);
    onUpdateSession({ battlePlan: plans });
  };

  const handleAddAdversary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdversary.trim()) return;
    const items = [...session.adversaries, newAdversary.trim()];
    onUpdateSession({ adversaries: items });
    setNewAdversary("");
  };

  const handleRemoveAdversary = (index: number) => {
    const items = session.adversaries.filter((_, i) => i !== index);
    onUpdateSession({ adversaries: items });
  };

  const handleAddAlly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlly.trim()) return;
    const items = [...session.allies, newAlly.trim()];
    onUpdateSession({ allies: items });
    setNewAlly("");
  };

  const handleRemoveAlly = (index: number) => {
    const items = session.allies.filter((_, i) => i !== index);
    onUpdateSession({ allies: items });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(201,168,76,0.1)] pb-4">
        <div>
          <h1 className="font-serif-cormorant text-3xl font-semibold text-[#F0EFE8] leading-tight flex items-center gap-2">
            <Shield className="text-[#C9A84C]" /> Chairman War Room
          </h1>
          <p className="font-mono text-[11px] tracking-[1.5px] text-[#C9A84C] mt-1">
            Tactical Theater Dashboard · Active Combat Session
          </p>
        </div>
        <div className="px-3.5 py-1 bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] text-[10px] uppercase font-mono rounded text-[#F5E0A0]">
          Active: {session.title}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Double-Column: Battle Plan & Intel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tactical Battle Plan Card */}
          <div className="bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-[2px] text-[#C9A84C] flex items-center gap-2 pb-2 border-b border-[rgba(201,168,76,0.1)]">
              <Target size={14} /> Critical Action Sequence
            </h3>
            
            <div className="space-y-2.5">
              {session.battlePlan.map((plan, i) => (
                <div key={i} className="group flex justify-between items-start gap-4 p-3 bg-[rgba(6,9,15,0.4)] border border-[rgba(201,168,76,0.1)] rounded hover:border-[#C9A84C] transition-all">
                  <div className="flex items-start gap-2.5 text-xs text-[#F0EFE8]">
                    <span className="font-mono text-[9px] text-[#C9A84C] mt-0.5">#{i+1}</span>
                    <span>{plan}</span>
                  </div>
                  <button
                    onClick={() => handleRemovePlan(i)}
                    className="opacity-0 group-hover:opacity-100 text-[rgba(240,239,232,0.4)] hover:text-[#E24B4A] transition-all cursor-pointer border-none bg-transparent"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddPlan} className="flex gap-2 pt-2">
              <input
                type="text"
                required
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value)}
                placeholder="Append new tactical battle plan step..."
                className="flex-1 bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none"
              />
              <button type="submit" className="px-4 py-2 bg-[#C9A84C] hover:bg-[#E8C878] text-[#06090F] font-mono text-[10px] uppercase rounded transition-colors cursor-pointer">
                Append Plan
              </button>
            </form>
          </div>

          {/* Adversaries & Allies Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Threats Box */}
            <div className="bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-xl p-4.5 space-y-3">
              <h3 className="text-[10px] font-mono uppercase tracking-[2px] text-[#E24B4A] flex items-center gap-2 pb-1.5 border-b border-[rgba(226,75,74,0.15)]">
                <Skull size={12} /> Active Adversary Pressures
              </h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {session.adversaries.map((adv, i) => (
                  <div key={i} className="group flex justify-between items-center gap-2 p-2 bg-[rgba(226,75,74,0.02)] border border-[rgba(226,75,74,0.15)] rounded">
                    <span className="text-xs text-[rgba(240,239,232,0.75)]">· {adv}</span>
                    <button onClick={() => handleRemoveAdversary(i)} className="opacity-0 group-hover:opacity-100 text-[rgba(240,239,232,0.4)] hover:text-[#E24B4A] cursor-pointer">✕</button>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddAdversary} className="flex gap-2 pt-1">
                <input
                  type="text"
                  required
                  value={newAdversary}
                  onChange={(e) => setNewAdversary(e.target.value)}
                  placeholder="Record strategic friction..."
                  className="flex-1 bg-[#05080F] border border-[rgba(226,75,74,0.15)] rounded px-2 py-1 text-xs text-[#F0EFE8]"
                />
                <button type="submit" className="px-2.5 bg-transparent border border-[#E24B4A] hover:bg-[#E24B4A] text-[#E24B4A] hover:text-[#F0EFE8] font-mono text-[9px] uppercase rounded transition-all cursor-pointer">
                  Add
                </button>
              </form>
            </div>

            {/* Allies Box */}
            <div className="bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-xl p-4.5 space-y-3">
              <h3 className="text-[10px] font-mono uppercase tracking-[2px] text-[#1D9E75] flex items-center gap-2 pb-1.5 border-b border-[rgba(29,158,117,0.15)]">
                <Award size={12} /> Strategic Alliances & Leverage
              </h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {session.allies.map((all, i) => (
                  <div key={i} className="group flex justify-between items-center gap-2 p-2 bg-[rgba(29,158,117,0.02)] border border-[rgba(29,158,117,0.15)] rounded">
                    <span className="text-xs text-[rgba(240,239,232,0.75)]">· {all}</span>
                    <button onClick={() => handleRemoveAlly(i)} className="opacity-0 group-hover:opacity-100 text-[rgba(240,239,232,0.4)] hover:text-[#E24B4A] cursor-pointer">✕</button>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddAlly} className="flex gap-2 pt-1">
                <input
                  type="text"
                  required
                  value={newAlly}
                  onChange={(e) => setNewAlly(e.target.value)}
                  placeholder="Identify helpful resources..."
                  className="flex-1 bg-[#05080F] border border-[rgba(29,158,117,0.15)] rounded px-2 py-1 text-xs text-[#F0EFE8]"
                />
                <button type="submit" className="px-2.5 bg-transparent border border-[#1D9E75] hover:bg-[#1D9E75] text-[#1D9E75] hover:text-[#F0EFE8] font-mono text-[9px] uppercase rounded transition-all cursor-pointer">
                  Add
                </button>
              </form>
            </div>

          </div>
        </div>

        {/* Right Single-Column Sidebar: AI Advisor Tactical Log */}
        <div className="space-y-4">
          <div className="bg-[rgba(10,16,32,0.5)] border border-[rgba(201,168,76,0.18)] rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-[2px] text-[#C9A84C] flex items-center gap-1.5 pb-2 border-b border-[rgba(201,168,76,0.1)]">
              <ListFilter size={13} className="text-[#C9A84C]" /> Advisor Intel Logs
            </h3>
            
            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {session.advisorLogs.map((log, i) => (
                <div key={i} className="text-xs leading-relaxed text-[rgba(240,239,232,0.75)] p-3.5 bg-[rgba(5,8,15,0.6)] border-l border-l-[#C9A84C] rounded-r">
                  {log}
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-[rgba(201,168,76,0.04)] border border-[rgba(201,168,76,0.15)] rounded text-[11px] text-[rgba(240,239,232,0.6)] leading-relaxed">
              <span className="font-bold text-[#C9A84C] block mb-1">💡 COGNITIVE COMBAT BRIEFING:</span>
              War room metrics correlate live with search results. To update Advisory logs with deep corporate volumes, query the AI Advisor in the primary conversation panel or select the Knowledge Brain menu.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
