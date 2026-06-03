import React, { useState } from "react";
import { BrandComparison } from "../types";
import { BarChart3, Plus, ShieldCheck, HelpCircle, Edit } from "lucide-react";

interface BrandComparisonProps {
  brands: BrandComparison[];
  onUpdateBrand: (brand: Omit<BrandComparison, "id" | "isTriggerMet">) => void;
}

export default function BrandComparisonCenter({ brands, onUpdateBrand }: BrandComparisonProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("QSR");
  const [targetOutlets, setTargetOutlets] = useState("186");
  const [actualOutlets, setActualOutlets] = useState("10");
  const [targetUsers, setTargetUsers] = useState("50000");
  const [actualUsers, setActualUsers] = useState("15000");
  const [commission, setCommission] = useState("6");
  const [mrr, setMrr] = useState("1200000"); // 12L

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onUpdateBrand({
      name,
      type,
      outletsCountTarget: Number(targetOutlets),
      outletsCountActual: Number(actualOutlets),
      appUsersTarget: Number(targetUsers),
      appUsersActual: Number(actualUsers),
      commissionPct: Number(commission),
      mrrActual: Number(mrr)
    });
    setName("");
    setShowAdd(false);
  };

  // Adjust metrics of existing brand instantly via inline editor
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editOutlets, setEditOutlets] = useState(0);
  const [editMrr, setEditMrr] = useState(0);

  const startEditing = (b: BrandComparison) => {
    setEditingBrandId(b.id);
    setEditOutlets(b.outletsCountActual);
    setEditMrr(b.mrrActual);
  };

  const saveEdit = (b: BrandComparison) => {
    onUpdateBrand({
      name: b.name,
      type: b.type,
      outletsCountTarget: b.outletsCountTarget,
      outletsCountActual: editOutlets,
      appUsersTarget: b.appUsersTarget,
      appUsersActual: b.appUsersActual,
      commissionPct: b.commissionPct,
      mrrActual: editMrr
    });
    setEditingBrandId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(201,168,76,0.1)] pb-4">
        <div>
          <h1 className="font-serif-cormorant text-3xl font-semibold text-[#F0EFE8] leading-tight">
            Brand Comparison Center
          </h1>
          <p className="font-mono text-[11px] tracking-[1.5px] text-[#C9A84C] mt-1">
            Compare segment metrics, outlet pipeline targets, and app trigger gates
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 border border-[#C9A84C] text-[11px] font-mono uppercase tracking-wider text-[#C9A84C] bg-[rgba(201,168,76,0.06)] hover:bg-[rgba(201,168,76,0.15)] rounded rounded-md cursor-pointer transition-colors"
        >
          <Plus size={14} /> Add Corporate Brand
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddSubmit} className="p-4 bg-[rgba(10,16,32,0.95)] border border-[rgba(201,168,76,0.3)] rounded-lg space-y-4 max-w-lg">
          <h3 className="font-serif-cormorant text-base text-[#C9A84C] font-semibold border-b border-[rgba(201,168,76,0.1)] pb-2">Record Brand Parameters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Brand Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mr. Chick'n"
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Corporate Segment (Type)</label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="QSR, Retail, etc."
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Target Outlets (2030 Goal)</label>
              <input
                type="number"
                value={targetOutlets}
                onChange={(e) => setTargetOutlets(e.target.value)}
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Actual Outlets Localized</label>
              <input
                type="number"
                value={actualOutlets}
                onChange={(e) => setActualOutlets(e.target.value)}
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Active App Users Target</label>
              <input
                type="number"
                value={targetUsers}
                onChange={(e) => setTargetUsers(e.target.value)}
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Actual App Users Onboarded</label>
              <input
                type="number"
                value={actualUsers}
                onChange={(e) => setActualUsers(e.target.value)}
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Commission % of Gross Sales</label>
              <input
                type="number"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Current App MRR (₹)</label>
              <input
                type="number"
                value={mrr}
                onChange={(e) => setMrr(e.target.value)}
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-2 bg-[#C9A84C] text-[#06090F] font-mono text-xs uppercase tracking-wider rounded transition-all cursor-pointer">
            Deploy Brand Parameters
          </button>
        </form>
      )}

      {/* Brand Visualizer directory */}
      <section className="space-y-4">
        <h2 className="text-[10px] tracking-[3px] uppercase text-[#C9A84C] font-mono pb-1 border-b border-[rgba(201,168,76,0.12)]">
          Live Segment Outlines
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brands.map((b) => {
            const outletsPct = Math.round((b.outletsCountActual / b.outletsCountTarget) * 100);
            const usersPct = Math.round((b.appUsersActual / b.appUsersTarget) * 100);
            const isEditing = editingBrandId === b.id;

            return (
              <div key={b.id} className="bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-xl p-5 space-y-4 relative">
                
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-serif-cormorant text-xl font-bold text-[#F0EFE8] leading-tight">{b.name}</h3>
                    <span className="text-[10px] font-mono text-[rgba(240,239,232,0.5)] mt-1 uppercase bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.18)] px-1.5 py-0.5 rounded">
                      Segment: {b.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {b.isTriggerMet ? (
                      <span className="px-2.5 py-0.5 bg-[rgba(29,158,117,0.15)] border border-[rgba(29,158,117,0.35)] text-[#1D9E75] text-[9px] font-mono rounded uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck size={10} /> Trigger Clear
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-[rgba(226,75,74,0.1)] border border-[rgba(226,75,74,0.3)] text-[#E24B4A] text-[9px] font-mono rounded uppercase">
                        Threshold Locked
                      </span>
                    )}

                    {!isEditing && (
                      <button
                        onClick={() => startEditing(b)}
                        className="p-1 text-[rgba(240,239,232,0.4)] hover:text-[#C9A84C] cursor-pointer"
                        title="Inline Adjust Target"
                      >
                        <Edit size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="p-3 bg-[rgba(5,8,15,0.7)] border border-[rgba(201,168,76,0.2)] rounded space-y-3">
                    <h4 className="text-[10px] font-mono uppercase text-[#C9A84C]">Inline KPI editor</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Live Outlets</label>
                        <input
                          type="number"
                          value={editOutlets}
                          onChange={(e) => setEditOutlets(Number(e.target.value))}
                          className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-1.5 text-xs text-[#F0EFE8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">App MRR (₹)</label>
                        <input
                          type="number"
                          value={editMrr}
                          onChange={(e) => setEditMrr(Number(e.target.value))}
                          className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-1.5 text-xs text-[#F0EFE8]"
                        />
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => saveEdit(b)} className="flex-1 py-1 bg-[#1D9E75] text-xs text-[#F0EFE8] font-mono rounded cursor-pointer">Save</button>
                      <button onClick={() => setEditingBrandId(null)} className="px-3 bg-transparent border border-[rgba(240,239,232,0.2)] text-xs text-[rgba(240,239,232,0.5)] font-mono rounded cursor-pointer">Close</button>
                    </div>
                  </div>
                ) : (
                  /* Stats Display */
                  <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-[rgba(201,168,76,0.1)] text-xs">
                    <div>
                      <span className="block text-[10px] text-[rgba(240,239,232,0.4)] mb-0.5">Outlet Progress</span>
                      <strong className="text-[#F0EFE8]">{b.outletsCountActual} / {b.outletsCountTarget}</strong>
                      <span className="text-[10px] text-[#C9A84C] ml-1">({outletsPct}%)</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[rgba(240,239,232,0.4)] mb-0.5">App MRR</span>
                      <strong className="text-[#F5E0A0]">₹{(b.mrrActual / 100000.0).toFixed(1)}L</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[rgba(240,239,232,0.4)] mb-0.5">Royalty split</span>
                      <strong className="text-[#1D9E75]">{b.commissionPct}% gross</strong>
                    </div>
                  </div>
                )}

                {/* Progress bar visualizer */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-[rgba(240,239,232,0.5)]">
                    <span>Active app users pool</span>
                    <span>{b.appUsersActual.toLocaleString()} / {b.appUsersTarget.toLocaleString()} ({usersPct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[rgba(201,168,76,0.08)] rounded-full overflow-hidden">
                    <div className="h-full bg-[#C9A84C] rounded-full transition-all duration-300" style={{ width: `${Math.min(100, usersPct)}%` }}></div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* Guide Note */}
      <section className="bg-[rgba(201,168,76,0.04)] border border-[rgba(201,168,76,0.15)] rounded-xl p-5 flex gap-4 leading-relaxed text-xs text-[rgba(240,239,232,0.65)]">
        <HelpCircle size={24} className="text-[#C9A84C] flex-shrink-0" />
        <div className="space-y-1.5">
          <strong className="text-[#F0EFE8] font-serif-cormorant text-sm block">Understanding Expansion Triggers</strong>
          <p>
            Per the corporate blueprint, a vertical brand is ready to trigger City-level Rollouts (e.g. Pune, Noida etc.) only when they achieve sustained app revenue of <strong>₹12L MRR for 8 consecutive weeks</strong> (denoted in dashboard as "Trigger Clear"). Expanding before clearing trigger gates threatens existing Group EBITDA.
          </p>
        </div>
      </section>
    </div>
  );
}
