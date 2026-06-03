import React, { useState } from "react";
import { DecisionLogItem } from "../types";
import { Hammer, Calendar, ClipboardList, Plus, FileText, CheckCircle } from "lucide-react";

interface DecisionLogProps {
  decisions: DecisionLogItem[];
  onAddDecision: (title: string, context: string, outcome: string, status: 'successful' | 'in-progress' | 'pending') => void;
}

export default function DecisionLog({ decisions, onAddDecision }: DecisionLogProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [outcome, setOutcome] = useState("");
  const [status, setStatus] = useState<'successful' | 'in-progress' | 'pending'>('successful');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !outcome.trim()) return;
    onAddDecision(title, context, outcome, status);
    setTitle("");
    setContext("");
    setOutcome("");
    setStatus("successful");
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(201,168,76,0.1)] pb-4">
        <div>
          <h1 className="font-serif-cormorant text-3xl font-semibold text-[#F0EFE8] leading-tight">
            Decision Log Ledger
          </h1>
          <p className="font-mono text-[11px] tracking-[1.5px] text-[#C9A84C] mt-1">
            Tracking strategic resolutions, policy approvals, and capital allocations
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 border border-[#C9A84C] text-[11px] font-mono uppercase tracking-wider text-[#C9A84C] bg-[rgba(201,168,76,0.06)] hover:bg-[rgba(201,168,76,0.15)] rounded rounded-md cursor-pointer transition-colors"
        >
          <Plus size={14} /> Record New Decision
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="p-4 bg-[rgba(10,16,32,0.95)] border border-[rgba(201,168,76,0.3)] rounded-lg space-y-4 max-w-lg">
          <div className="flex justify-between items-center border-b border-[rgba(201,168,76,0.1)] pb-2">
            <h3 className="font-serif-cormorant text-lg text-[#C9A84C] font-semibold">Publish Board Resolution</h3>
            <button type="button" onClick={() => setShowAdd(false)} className="text-[rgba(240,239,232,0.5)]">✕</button>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            <div>
              <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Decision / Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Pune Expansion Go/No-Go Gate approval"
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">State Level / Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
              >
                <option value="successful">🟢 YES - Formally Resolved / Successful</option>
                <option value="in-progress">🟡 Pending Escalation / In Progress</option>
                <option value="pending">⚪ Deferred / Future planning</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Business Query Context</label>
              <textarea
                rows={2}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Describe current KPI indicators, roadblocks or constraints resolved..."
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Final Settlement / Outlined Resolution Outcome</label>
              <textarea
                required
                rows={3}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="e.g. YES, proceed with franchise model. Do not deploy direct company capital."
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-2 bg-[#C9A84C] text-[#06090F] font-mono text-xs uppercase rounded">
            Record Formal Board Resolution
          </button>
        </form>
      )}

      {/* Render Decisions Log */}
      <section className="space-y-4">
        <h2 className="text-[10px] tracking-[3px] uppercase text-[#C9A84C] font-mono flex items-center gap-1.5 pb-1 border-b border-[rgba(201,168,76,0.12)]">
          <ClipboardList size={11} /> Historical Resolutions log
        </h2>
        
        <div className="space-y-3.5">
          {decisions.length === 0 ? (
            <p className="text-xs text-[rgba(240,239,232,0.4)] font-mono italic">No decisions recorded on public ledger.</p>
          ) : (
            decisions.map((dl) => (
              <div key={dl.id} className="bg-[rgba(8,12,22,0.7)] border border-[rgba(201,168,76,0.18)] p-4.5 rounded-lg space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-semibold text-[13.5px] text-[#F0EFE8] leading-tight">{dl.title}</h3>
                    <span className="text-[10px] font-mono text-[rgba(240,239,232,0.4)] flex items-center gap-1.5 mt-1">
                      <Calendar size={10} /> {dl.date}
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    {dl.status === "successful" ? (
                      <span className="px-2.5 py-0.5 bg-[rgba(29,158,117,0.1)] border border-[rgba(29,158,117,0.3)] text-[#1D9E75] text-[9px] font-mono rounded uppercase tracking-wider">
                        Resolved
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-[rgba(239,159,39,0.1)] border border-[rgba(239,159,39,0.3)] text-[#EF9F27] text-[9px] font-mono rounded uppercase tracking-wider">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {dl.context && (
                  <p className="text-[12px] text-[rgba(240,239,232,0.6)] leading-relaxed pl-3.5 border-l border-[rgba(201,168,76,0.15)] italic">
                    Context: {dl.context}
                  </p>
                )}

                <div className="bg-[rgba(5,8,15,0.6)] border-l-2 border-l-[#C9A84C] rounded p-3 text-xs leading-relaxed text-[#F0EFE8]">
                  <strong className="text-[#C9A84C] font-mono text-[9px] tracking-wider uppercase block mb-1">Settled Outcome / Enforced Resolution:</strong>
                  {dl.outcome}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
