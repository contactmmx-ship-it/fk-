import React, { useState } from "react";
import { WeeklyBoardItem, WeeklyBoardMetrics, ActionPlanItem } from "../types";
import { CheckCircle2, AlertTriangle, Plus, X, Heart, ShieldAlert, Award } from "lucide-react";

interface WeeklyBoardProps {
  items: WeeklyBoardItem[];
  metrics: WeeklyBoardMetrics;
  actionPlan: ActionPlanItem[];
  onToggleAction: (id: string) => void;
  onAddBoardItem: (category: 'win' | 'fail' | 'risk' | 'team', title: string, description: string) => void;
  onRemoveBoardItem: (id: string) => void;
  onAddActionItem: (title: string, description: string) => void;
}

export default function WeeklyBoard({
  items,
  metrics,
  actionPlan,
  onToggleAction,
  onAddBoardItem,
  onRemoveBoardItem,
  onAddActionItem
}: WeeklyBoardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState<'win' | 'fail' | 'risk' | 'team'>('win');
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [showActionForm, setShowActionForm] = useState(false);
  const [actionTitle, setActionTitle] = useState("");
  const [actionDesc, setActionDesc] = useState("");

  const wins = items.filter(i => i.category === "win");
  const failures = items.filter(i => i.category === "fail");
  const risks = items.filter(i => i.category === "risk");
  const team = items.filter(i => i.category === "team");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    onAddBoardItem(newCategory, newTitle, newDesc);
    setNewTitle("");
    setNewDesc("");
    setShowAddForm(false);
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTitle.trim()) return;
    onAddActionItem(actionTitle, actionDesc);
    setActionTitle("");
    setActionDesc("");
    setShowActionForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(201,168,76,0.1)] pb-4">
        <div>
          <h1 className="font-serif-cormorant text-3xl font-semibold text-[#F0EFE8] leading-tight">
            Weekly Board Review
          </h1>
          <p className="font-mono text-[11px] tracking-[1.5px] text-[#C9A84C] mt-1">
            Monday, June 02, 2026 · Week of May 26 - Jun 02
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 border border-[#C9A84C] text-[11px] font-mono uppercase tracking-wider text-[#C9A84C] bg-[rgba(201,168,76,0.06)] hover:bg-[rgba(201,168,76,0.15)] transition-all cursor-pointer rounded rounded-md"
        >
          <Plus size={14} /> Record Board Item
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-4 bg-[rgba(10,16,32,0.9)] border border-[rgba(201,168,76,0.3)] rounded-lg space-y-4 max-w-xl animate-fade-in">
          <div className="flex justify-between items-center border-b border-[rgba(201,168,76,0.1)] pb-2">
            <h3 className="font-serif-cormorant text-lg font-semibold text-[#C9A84C]">New Board Outcome Entry</h3>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-[rgba(240,239,232,0.5)] hover:text-[#F0EFE8]">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-columns-1 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[rgba(240,239,232,0.4)] mb-1">Outcome Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-sm text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none"
              >
                <option value="win">🏆 Win This Week</option>
                <option value="fail">🚨 Failure / Missed Commitment</option>
                <option value="risk">⚠️ Strategic Risk Flag</option>
                <option value="team">👥 Team Execution Note</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[rgba(240,239,232,0.4)] mb-1">Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Pune Franchise shortlisting final"
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-sm text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[rgba(240,239,232,0.4)] mb-1">Impact / Context Description</label>
              <textarea
                required
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Add precise metrics, bottlenecks or strategic action resulting"
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-sm text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-2 bg-[#C9A84C] hover:bg-[#E8C878] text-[#06090F] font-mono font-medium text-xs uppercase tracking-wider rounded transition-colors cursor-pointer">
            Deploy Entry to Ledger
          </button>
        </form>
      )}

      {/* Wins Section */}
      <section className="space-y-3">
        <h2 className="text-[10px] tracking-[3px] uppercase text-[#C9A84C] font-mono flex items-center gap-2 pb-1 border-b border-[rgba(201,168,76,0.12)]">
          <Award size={12} /> Wins This Week
        </h2>
        <div className="grid gap-2.5">
          {wins.length === 0 ? (
            <p className="text-xs text-[rgba(240,239,232,0.4)] font-mono italic">No recent victories recorded on scoreboard.</p>
          ) : (
            wins.map((w) => (
              <div key={w.id} className="group relative bg-[rgba(8,12,22,0.7)] border border-[rgba(201,168,76,0.18)] border-l-4 border-l-[#1D9E75] rounded-md p-4 flex gap-4 items-start transition-all hover:bg-[rgba(8,12,22,0.95)]">
                <span className="text-lg text-[#1D9E75] select-none">✓</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[13px] text-[#F0EFE8]">{w.title}</h4>
                  <p className="text-[12px] text-[rgba(240,239,232,0.65)] mt-1">{w.description}</p>
                </div>
                <button
                  onClick={() => onRemoveBoardItem(w.id)}
                  className="opacity-0 group-hover:opacity-100 text-[rgba(240,239,232,0.4)] hover:text-[#E24B4A] transition-colors p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Failures Section */}
      <section className="space-y-3">
        <h2 className="text-[10px] tracking-[3px] uppercase text-[#E24B4A] font-mono flex items-center gap-2 pb-1 border-b border-[rgba(226,75,74,0.15)]">
          <ShieldAlert size={12} /> Failures & Delayed Deliveries
        </h2>
        <div className="grid gap-2.5">
          {failures.length === 0 ? (
            <p className="text-xs text-[rgba(240,239,232,0.4)] font-mono italic">Operating in high precision, no slips logged.</p>
          ) : (
            failures.map((f) => (
              <div key={f.id} className="group relative bg-[rgba(8,12,22,0.7)] border border-[rgba(201,168,76,0.18)] border-l-4 border-l-[#E24B4A] rounded-md p-4 flex gap-4 items-start transition-all hover:bg-[rgba(8,12,22,0.95)]">
                <span className="text-lg text-[#E24B4A] select-none">✗</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[13px] text-[#F0EFE8]">{f.title}</h4>
                  <p className="text-[12px] text-[rgba(240,239,232,0.65)] mt-1">{f.description}</p>
                </div>
                <button
                  onClick={() => onRemoveBoardItem(f.id)}
                  className="opacity-0 group-hover:opacity-100 text-[rgba(240,239,232,0.4)] hover:text-[#E24B4A] transition-colors p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Critical Risks Section */}
      <section className="space-y-3">
        <h2 className="text-[10px] tracking-[3px] uppercase text-[#EF9F27] font-mono flex items-center gap-2 pb-1 border-b border-[rgba(239,159,39,0.15)]">
          <AlertTriangle size={12} /> Critical Risks & Obstacles
        </h2>
        <div className="grid gap-2.5">
          {risks.length === 0 ? (
            <p className="text-xs text-[rgba(240,239,232,0.4)] font-mono italic">No alert levels currently triggered.</p>
          ) : (
            risks.map((r) => (
              <div key={r.id} className="group relative bg-[rgba(8,12,22,0.7)] border border-[rgba(201,168,76,0.18)] border-l-4 border-l-[#EF9F27] rounded-md p-4 flex gap-4 items-start transition-all hover:bg-[rgba(8,12,22,0.95)]">
                <span className="text-lg text-[#EF9F27] select-none">⚠️</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[13px] text-[#F0EFE8]">{r.title}</h4>
                  <p className="text-[12px] text-[rgba(240,239,232,0.65)] mt-1">{r.description}</p>
                </div>
                <button
                  onClick={() => onRemoveBoardItem(r.id)}
                  className="opacity-0 group-hover:opacity-100 text-[rgba(240,239,232,0.4)] hover:text-[#E24B4A] transition-colors p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Team Performance Section */}
      <section className="space-y-3">
        <h2 className="text-[10px] tracking-[3px] uppercase text-[#C9A84C] font-mono flex items-center gap-2 pb-1 border-b border-[rgba(201,168,76,0.12)]">
          <Heart size={12} /> Team Performance / Human Capital notes
        </h2>
        <div className="grid gap-2.5">
          {team.length === 0 ? (
            <p className="text-xs text-[rgba(240,239,232,0.4)] font-mono italic">No alignment entries made yet.</p>
          ) : (
            team.map((t) => (
              <div key={t.id} className="group relative bg-[rgba(8,12,22,0.7)] border border-[rgba(201,168,76,0.18)] border-l-4 border-l-[#C9A84C] rounded-md p-4 flex gap-4 items-start transition-all hover:bg-[rgba(8,12,22,0.95)]">
                <span className="text-lg text-[#C9A84C] select-none">👥</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[13px] text-[#F0EFE8]">{t.title}</h4>
                  <p className="text-[12px] text-[rgba(240,239,232,0.65)] mt-1">{t.description}</p>
                </div>
                <button
                  onClick={() => onRemoveBoardItem(t.id)}
                  className="opacity-0 group-hover:opacity-100 text-[rgba(240,239,232,0.4)] hover:text-[#E24B4A] transition-colors p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Revenue Section */}
      <section className="space-y-3">
        <h2 className="text-[10px] tracking-[3px] uppercase text-[#C9A84C] font-mono pb-1 border-b border-[rgba(201,168,76,0.12)]">
          Revenue & Accountability Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-lg p-5 text-center">
            <span className="block text-[10px] text-[rgba(240,239,232,0.4)] uppercase tracking-widest mb-1.5">June Target vs Actual</span>
            <div className="font-serif-cormorant text-4xl font-semibold text-[#E24B4A]">{metrics.juneTargetVsActual}%</div>
            <div className="text-[11px] text-[rgba(240,239,232,0.5)] mt-2 font-mono uppercase">{metrics.mrrTargetGap}</div>
          </div>
          <div className="bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-lg p-5 text-center">
            <span className="block text-[10px] text-[rgba(240,239,232,0.4)] uppercase tracking-widest mb-1.5">Accountability Quotient</span>
            <div className={`font-serif-cormorant text-4xl font-semibold ${metrics.accountabilityScore >= 70 ? 'text-[#1D9E75]' : metrics.accountabilityScore >= 50 ? 'text-[#EF9F27]' : 'text-[#E24B4A]'}`}>{metrics.accountabilityScore}/100</div>
            <div className="text-[11px] text-[rgba(240,239,232,0.5)] mt-2 font-mono uppercase">Trend: {metrics.weeklyTrend} from prior periods</div>
          </div>
        </div>
      </section>

      {/* Combined Action Plan Section */}
      <section className="space-y-3">
        <div className="flex justify-between items-center pb-1 border-b border-[rgba(201,168,76,0.12)]">
          <h2 className="text-[10px] tracking-[3px] uppercase text-[#C9A84C] font-mono">
            This Week's Tactical Action Plan
          </h2>
          <button
            onClick={() => setShowActionForm(!showActionForm)}
            className="text-[11px] font-mono text-[#C9A84C] hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1"
          >
            <Plus size={10} /> Add Action
          </button>
        </div>

        {showActionForm && (
          <form onSubmit={handleActionSubmit} className="p-3 bg-[rgba(10,16,32,0.8)] border border-[rgba(201,168,76,0.2)] rounded space-y-3 max-w-md">
            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                required
                value={actionTitle}
                onChange={(e) => setActionTitle(e.target.value)}
                placeholder="Tactical Action (e.g. Schedule call with Arvind Partner)"
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
              />
              <input
                type="text"
                value={actionDesc}
                onChange={(e) => setActionDesc(e.target.value)}
                placeholder="Detailed Expected Impact"
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
              />
            </div>
            <button type="submit" className="px-3 py-1 bg-[#C9A84C] text-[#06090F] font-mono text-[10px] uppercase rounded">
              Deploy Action
            </button>
          </form>
        )}

        <div className="grid gap-2.5">
          {actionPlan.map((action, i) => (
            <div
              key={action.id}
              onClick={() => onToggleAction(action.id)}
              className={`flex items-start gap-4 p-4 border rounded-md cursor-pointer transition-all ${
                action.completed
                  ? "bg-[rgba(29,158,117,0.06)] border-[rgba(29,158,117,0.2)] text-[rgba(240,239,232,0.5)]"
                  : "bg-[rgba(8,12,22,0.7)] border-[rgba(201,168,76,0.18)] hover:border-[#C9A84C]"
              }`}
            >
              <div className="pt-0.5 select-none">
                <CheckCircle2
                  size={16}
                  className={action.completed ? "text-[#1D9E75] fill-[rgba(29,158,117,0.1)]" : "text-[rgba(240,239,232,0.3)]"}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium text-[13px] ${action.completed ? 'line-through text-[rgba(240,239,232,0.4)]' : 'text-[#F0EFE8]'}`}>
                  <span className="font-mono text-[10px] bg-[rgba(201,168,76,0.1)] text-[#C9A84C] px-1.5 py-0.5 rounded mr-2 uppercase">{action.day}</span>
                  {action.title}
                </h4>
                {action.description && (
                  <p className={`text-[12px] mt-1 ${action.completed ? 'text-[rgba(240,239,232,0.35)]' : 'text-[rgba(240,239,232,0.65)]'}`}>
                    {action.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
