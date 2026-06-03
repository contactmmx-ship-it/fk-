import React, { useState } from "react";
import { EmergencyModeState } from "../types";
import { ShieldAlert, RefreshCw, Layers, CheckSquare, XSquare, Info } from "lucide-react";

interface EmergencyModeProps {
  state: EmergencyModeState;
  onToggleEmergency: (params: { isActivated: boolean; reason?: string; runwayMonths?: number; revenueGapPct?: number }) => void;
  onRefreshStats?: () => void;
}

export default function EmergencyMode({ state, onToggleEmergency, onRefreshStats }: EmergencyModeProps) {
  const [reasonInput, setReasonInput] = useState(state.reason);
  const [runwayInput, setRunwayInput] = useState(state.criticalKpis.runwayMonths);
  const [gapInput, setGapInput] = useState(state.criticalKpis.revenueGapPct);
  const [showConfig, setShowConfig] = useState(false);

  const handleSubmitConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onToggleEmergency({
      isActivated: state.isActivated,
      reason: reasonInput,
      runwayMonths: Number(runwayInput),
      revenueGapPct: Number(gapInput)
    });
    setShowConfig(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(201,168,76,0.1)] pb-4">
        <div>
          <h1 className="font-serif-cormorant text-3xl font-semibold text-[#F0EFE8] leading-tight flex items-center gap-3">
            <ShieldAlert className={state.isActivated ? "text-[#E24B4A] animate-pulse" : "text-[rgba(240,239,232,0.4)]"} /> Emergency KPI Gating
          </h1>
          <p className="font-mono text-[11px] tracking-[1.5px] text-[#C9A84C] mt-1">
            Status: {state.isActivated ? "CRITICAL EMERGENCY IN PRACTICE" : "NORMAL STRATEGIC TRACKING"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-4 py-2 border border-[rgba(201,168,76,0.18)] text-[11px] font-mono uppercase tracking-wider text-[#F0EFE8] bg-[rgba(10,16,32,0.8)] hover:bg-[rgba(201,168,76,0.06)] rounded transition-all cursor-pointer"
          >
            Adjust Gates
          </button>
          <button
            onClick={() => onToggleEmergency({ isActivated: !state.isActivated })}
            className={`px-4 py-2 text-[11px] font-mono uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 ${
              state.isActivated
                ? "bg-[#1D9E75] hover:bg-[#157c5b] text-[#F0EFE8]"
                : "bg-[#E24B4A] hover:bg-[#b83636] text-[#F0EFE8]"
            }`}
          >
            {state.isActivated ? "Disarm Emergency" : "Trigger Emergency"}
          </button>
        </div>
      </div>

      {showConfig && (
        <form onSubmit={handleSubmitConfig} className="p-4 bg-[rgba(10,16,32,0.95)] border border-[rgba(201,168,76,0.3)] rounded-lg space-y-4 max-w-md">
          <h3 className="font-serif-cormorant text-lg text-[#C9A84C] font-semibold border-b border-[rgba(201,168,76,0.1)] pb-2">Configure Emergency Parameters</h3>
          <div className="grid grid-cols-1 gap-2.5">
            <div>
              <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Emergency Context</label>
              <input
                type="text"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Cash Runway (months)</label>
                <input
                  type="number"
                  step="0.1"
                  value={runwayInput}
                  onChange={(e) => setRunwayInput(Number(e.target.value))}
                  className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Revenue Gap (%)</label>
                <input
                  type="number"
                  value={gapInput}
                  onChange={(e) => setGapInput(Number(e.target.value))}
                  className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
                />
              </div>
            </div>
          </div>
          <button type="submit" className="w-full py-2 bg-[#C9A84C] hover:bg-[#E8C878] text-[#06090F] font-mono text-xs uppercase tracking-wider rounded transition-colors cursor-pointer">
            Publish New Parameters
          </button>
        </form>
      )}

      {/* Emergency Banner */}
      {state.isActivated ? (
        <div className="bg-gradient-to-br from-[rgba(226,75,74,0.15)] to-[rgba(226,75,74,0.03)] border-2 border-[#E24B4A] rounded-xl p-5 relative overflow-hidden animate-pulse">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E24B4A] via-[rgba(226,75,74,0.5)] to-[#E24B4A]"></div>
          <h2 className="text-[#E24B4A] text-lg font-bold uppercase tracking-wider flex items-center gap-2">
            ⚠️ EMERGENCY MODE ACTIVATED — RECOVERY WINDOW IN PROGRESS
          </h2>
          <p className="text-[12.5px] text-[rgba(240,239,232,0.7)] mt-2 italic leading-relaxed">
            "{state.reason}"
          </p>
          <p className="text-[10px] text-[rgba(240,239,232,0.4)] font-mono uppercase mt-4">
            System Alarm Initialized At: {new Date(state.activatedAt).toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-[rgba(29,158,117,0.1)] to-[rgba(29,158,117,0.02)] border border-[#1D9E75] rounded-xl p-5">
          <h2 className="text-[#1D9E75] text-sm font-bold uppercase tracking-wider">
            ✓ ECOSYSTEM PARAMETERS HEALTHY
          </h2>
          <p className="text-xs text-[rgba(240,239,232,0.65)] mt-1.5 leading-relaxed">
            All key triggers (Revenue Runway, Outlet Stability, and investor pipeline numbers) reside within standard tracking parameters. Maintain systemic audit on Mondays.
          </p>
        </div>
      )}

      {/* Critical KPIs Grid */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-mono tracking-[3px] uppercase text-[#C9A84C] pb-1 border-b border-[rgba(201,168,76,0.12)]">
          Critical Gating Threshold KPIs
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[rgba(226,75,74,0.08)] border border-[rgba(226,75,74,0.3)] rounded-lg p-4 text-center">
            <div className="font-serif-cormorant text-2xl font-semibold text-[#E24B4A]">{state.criticalKpis.runwayMonths}mo</div>
            <div className="text-[9px] text-[rgba(240,239,232,0.4)] uppercase tracking-widest mt-1">Cash Runway</div>
          </div>
          <div className="bg-[rgba(226,75,74,0.08)] border border-[rgba(226,75,74,0.3)] rounded-lg p-4 text-center">
            <div className="font-serif-cormorant text-2xl font-semibold text-[#E24B4A]">{state.criticalKpis.revenueGapPct}%</div>
            <div className="text-[9px] text-[rgba(240,239,232,0.4)] uppercase tracking-widest mt-1">Revenue Gap</div>
          </div>
          <div className="bg-[rgba(226,75,74,0.02)] border border-[rgba(201,168,76,0.18)] rounded-lg p-4 text-center">
            <div className="font-serif-cormorant text-2xl font-semibold text-[#C9A84C]">{state.criticalKpis.investorFunnelCount} Active</div>
            <div className="text-[9px] text-[rgba(240,239,232,0.4)] uppercase tracking-widest mt-1">Warm Funnel Leads</div>
          </div>
        </div>
      </section>

      {/* 72-Hour recovery plan */}
      <section className="bg-[rgba(8,12,22,0.8)] border border-[rgba(201,168,76,0.18)] rounded-xl p-5 space-y-4">
        <h3 className="text-[10px] font-mono tracking-[3px] uppercase text-[#C9A84C] flex items-center gap-1.5">
          <Layers size={11} /> 72-Hour Recovery Plan Timelines
        </h3>
        <div className="space-y-3.5">
          {state.recoveryPlan.map((p, index) => (
            <div key={index} className="p-3.5 bg-[rgba(5,8,15,0.6)] border-l-2 border-l-[#C9A84C] rounded-r">
              <h4 className="font-medium text-xs text-[#F0EFE8] uppercase tracking-wider mb-2">{p.phase}</h4>
              <div className="flex flex-col gap-1.5">
                {p.tasks.map((task, ti) => (
                  <div key={ti} className="text-[11.5px] text-[rgba(240,239,232,0.75)] pl-4 relative">
                    <span className="absolute left-0 text-[#C9A84C]">→</span> {task}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Actions to Take */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-mono tracking-[3px] uppercase text-[#C9A84C] pb-1 border-b border-[rgba(201,168,76,0.12)]">
          Crisis Action Framework
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* DO List */}
          <div className="bg-[rgba(8,12,22,0.5)] border border-[rgba(201,168,76,0.18)] rounded-xl p-4.5 space-y-2.5">
            <h4 className="text-[9px] font-mono tracking-widest uppercase text-[#1D9E75] mb-2 font-bold flex items-center gap-1">
              <CheckSquare size={12} /> Priority Objectives (Mandatory)
            </h4>
            <div className="flex flex-col gap-2">
              {state.actionsToTake.filter(a => a.isDo).map((action, ai) => (
                <div key={ai} className="p-3 bg-[rgba(5,8,15,0.4)] border border-[rgba(201,168,76,0.08)] rounded flex items-center gap-2.5 text-xs text-[rgba(240,239,232,0.85)]">
                  <span className="w-5 h-5 rounded-full bg-[rgba(29,158,117,0.15)] text-[#1D9E75] flex items-center justify-center font-bold text-[10px]">✓</span>
                  <span>{action.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DONT List */}
          <div className="bg-[rgba(8,12,22,0.5)] border border-[rgba(201,168,76,0.18)] rounded-xl p-4.5 space-y-2.5">
            <h4 className="text-[9px] font-mono tracking-widest uppercase text-[#E24B4A] mb-2 font-bold flex items-center gap-1">
              <XSquare size={12} /> Execution Interdictions (prohibited)
            </h4>
            <div className="flex flex-col gap-2">
              {state.actionsToTake.filter(a => !a.isDo).map((action, ai) => (
                <div key={ai} className="p-3 bg-[rgba(5,8,15,0.4)] border border-[rgba(226,75,74,0.04)] border-l-2 border-l-[#E24B4A] rounded flex items-center gap-2.5 text-xs text-[rgba(240,239,232,0.7)]">
                  <span className="w-5 h-5 rounded-full bg-[rgba(226,75,74,0.15)] text-[#E24B4A] flex items-center justify-center font-bold text-[10px]">✗</span>
                  <span>{action.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Root Cause Analysis */}
      <section className="bg-[rgba(10,16,32,0.7)] border border-[rgba(201,168,76,0.18)] rounded-xl p-5 space-y-3">
        <h3 className="text-xs text-[#F0EFE8] font-serif-cormorant font-semibold flex items-center gap-1.5 border-b border-[rgba(201,168,76,0.12)] pb-2.5">
          <Info size={14} className="text-[#C9A84C]" /> Root Cause Cascade Analysis
        </h3>
        <div className="space-y-3.5 text-xs text-[rgba(240,239,232,0.7)]">
          <div>
            <strong className="text-[#F0EFE8] block mb-1">Primary trigger cascade:</strong>
            {state.rootCauseAnalysis.primary}
          </div>
          <div>
            <strong className="text-[#F0EFE8] block mb-1">Secondary feedback loops:</strong>
            {state.rootCauseAnalysis.secondary}
          </div>
          <div>
            <strong className="text-[#F0EFE8] block mb-1">Tertiary structural drain:</strong>
            {state.rootCauseAnalysis.tertiary}
          </div>
          <div className="bg-[rgba(29,158,117,0.08)] border-l-4 border-l-[#1D9E75] rounded p-4 text-[rgba(240,239,232,0.85)] mt-4">
            <strong className="text-[#1D9E75] font-mono text-[9px] uppercase tracking-wider block mb-1">System Intervention fix:</strong>
            {state.rootCauseAnalysis.systemFix}
          </div>
        </div>
      </section>
    </div>
  );
}
