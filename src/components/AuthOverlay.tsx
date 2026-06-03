import React, { useState } from "react";
import { Sparkles, RefreshCw, KeyRound, Mail, UserCheck } from "lucide-react";

interface AuthOverlayProps {
  onAuthSuccess: (user: { id: number; email: string; role: string }) => void;
}

export default function AuthOverlay({ onAuthSuccess }: AuthOverlayProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"Chairman" | "Admin" | "Partner" | "Viewer">("Partner");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password credentials.");
      return;
    }

    if (isRegister) {
      if (password.length < 6) {
        setErrorMsg("Credential strength constraint: Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Credential mismatch: Password confirmation field does not match.");
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister ? { email, password, role } : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Execution failed on the core authentication gateway.");
      }

      if (data.user) {
        onAuthSuccess(data.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Credential authentication failed. Please audit connection parameters.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#04060A] flex flex-col justify-center items-center p-6 font-sans relative overflow-hidden select-none">
      
      {/* Decorative luxury radial flares */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,_rgba(201,168,76,0.04),_transparent_65%)] pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,_rgba(29,158,117,0.02),_transparent_70%)] pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-[460px] bg-[#0A0D14] border border-[rgba(201,168,76,0.18)] rounded-xl p-8 relative z-10 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-sm transition-all duration-300">
        
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 border border-[#C9A84C] rounded-lg flex items-center justify-center font-serif text-3xl font-bold text-[#C9A84C] bg-[#0E121B] shadow-[0_4px_12px_rgba(201,168,76,0.08)] mb-4 animate-pulse">
            FK
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#F0EFE8] tracking-wide">
            FK PARTNER OS
          </h1>
          <p className="font-mono text-[9px] text-[#C9A84C] uppercase tracking-[3px] mt-1.5">
            Executive Ledger & Control Hub 2030
          </p>
        </div>

        {/* Action Toggle Switch */}
        <div className="grid grid-cols-2 bg-[#05070A] rounded-lg p-1 border border-[rgba(201,168,76,0.08)] mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg(null);
            }}
            className={`py-2 text-[10px] font-mono uppercase tracking-wider rounded transition-all cursor-pointer ${
              !isRegister
                ? "bg-[#C9A84C] text-[#06090F] font-semibold shadow-sm"
                : "text-[rgba(240,239,232,0.45)] hover:text-white"
            }`}
          >
            Access Login
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg(null);
            }}
            className={`py-2 text-[10px] font-mono uppercase tracking-wider rounded transition-all cursor-pointer ${
              isRegister
                ? "bg-[#C9A84C] text-[#06090F] font-semibold shadow-sm"
                : "text-[rgba(240,239,232,0.45)] hover:text-white"
            }`}
          >
            Register Board
          </button>
        </div>

        {/* Input Form Workspace */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email input component */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-wider text-[rgba(240,239,232,0.5)] flex items-center gap-1.5">
              <Mail size={11} className="text-[#C9A84C]" />
              Supervisory Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rajeev@fkholdings.com"
              className="w-full bg-[#070A0F] border border-[rgba(201,168,76,0.14)] focus:border-[#C9A84C] text-[#F0EFE8] text-xs px-4 py-3 rounded focus:outline-none placeholder-[rgba(240,239,232,0.2)] transition-colors"
            />
          </div>

          {/* Password input component */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-wider text-[rgba(240,239,232,0.5)] flex items-center gap-1.5">
              <KeyRound size={11} className="text-[#C9A84C]" />
              Security Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#070A0F] border border-[rgba(201,168,76,0.14)] focus:border-[#C9A84C] text-[#F0EFE8] text-xs px-4 py-3 rounded focus:outline-none placeholder-[rgba(240,239,232,0.2)] transition-colors"
            />
          </div>

          {/* Confirm Password (only register) */}
          {isRegister && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-[10px] uppercase font-mono tracking-wider text-[rgba(240,239,232,0.5)] flex items-center gap-1.5">
                <KeyRound size={11} className="text-[#C9A84C]" />
                Confirm Security Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#070A0F] border border-[rgba(201,168,76,0.14)] focus:border-[#C9A84C] text-[#F0EFE8] text-xs px-4 py-3 rounded focus:outline-none placeholder-[rgba(240,239,232,0.2)] transition-colors"
              />
            </div>
          )}

          {/* Role selection dropdown (only register) */}
          {isRegister && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-[10px] uppercase font-mono tracking-wider text-[rgba(240,239,232,0.5)] flex items-center gap-1.5">
                <UserCheck size={11} className="text-[#C9A84C]" />
                Assigned Board Role
              </label>
              <select
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
                className="w-full bg-[#070A0F] border border-[rgba(201,168,76,0.14)] focus:border-[#C9A84C] text-[#F0EFE8] text-xs px-4 py-3 rounded focus:outline-none transition-colors"
              >
                <option value="Chairman">Chairman (Supervisory Advisor)</option>
                <option value="Admin">Admin (Core Group Controller)</option>
                <option value="Partner">Partner (Ecosystem Licensee)</option>
                <option value="Viewer">Viewer (Corporate Auditor)</option>
              </select>
            </div>
          )}

          {/* Gate error banner */}
          {errorMsg && (
            <div className="p-3 bg-[rgba(226,75,74,0.1)] border border-[rgba(226,75,74,0.35)] text-[#E24B4A] text-[11px] rounded leading-relaxed font-mono">
              ⚠ {errorMsg}
            </div>
          )}

          {/* Submit Trigger */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-[#8B6B2A] to-[#C9A84C] hover:from-[#A8853D] hover:to-[#E8C878] text-[#06090F] font-bold text-xs uppercase tracking-[2px] rounded cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <>
                <Sparkles size={13} />
                {isRegister ? "Confirm New User" : "Enter Executive Control"}
              </>
            )}
          </button>
        </form>

        {/* Corporate Disclosure footer */}
        <div className="mt-8 pt-4 border-t border-[rgba(201,168,76,0.06)] text-center">
          <p className="text-[9px] font-mono text-[rgba(240,239,232,0.3)] select-none">
            CONFIDENTIAL FOR EXCLUSIVE FK BOARD MEMBERS. ANY UNAUTHORIZED INTERACTION AND LOGS WILL BE RECORDED ON AUDIT LEDGER PLD-90.
          </p>
        </div>

      </div>
    </div>
  );
}
