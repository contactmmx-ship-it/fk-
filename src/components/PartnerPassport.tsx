import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { QRPassport, PartnerScore, ExpansionReadinessScan } from "../types";
import { 
  QrCode, Shield, ShieldCheck, HeartPulse, Sparkles, 
  TrendingUp, TrendingDown, RefreshCw, KeyRound, 
  UserRoundCog, Check, Copy, Search, AlertCircle, FileImage, ArrowRight
} from "lucide-react";

interface PartnerPassportProps {
  passport: QRPassport;
  score: PartnerScore;
  readinessScans: ExpansionReadinessScan[];
  onTriggerScan: (cityName: string) => void;
  onPassportUpdate: () => void;
  initialVerifyCode?: string | null;
  onClearInitialVerifyCode?: () => void;
}

export default function PartnerPassport({ 
  passport, 
  score, 
  readinessScans, 
  onTriggerScan, 
  onPassportUpdate,
  initialVerifyCode,
  onClearInitialVerifyCode
}: PartnerPassportProps) {
  
  // State for active view tab
  const [activeTab, setActiveTab] = useState<"view" | "verify">("view");

  // QR Code Image Data URL state
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Edit / Regeneration Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(passport.partnerName || "");
  const [editRoles, setEditRoles] = useState(passport.roles?.join(", ") || "");
  const [editLicenses, setEditLicenses] = useState(passport.verifiedLicenses?.join(", ") || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Verification Portal state
  const [verifyCodeInput, setVerifyCodeInput] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [copyState, setCopyState] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [scannedFileName, setScannedFileName] = useState("");

  // City readiness inputs
  const [cityNameInput, setCityNameInput] = useState("");
  const [isScanningCity, setIsScanningCity] = useState(false);

  // Generate real QR code on passport load
  useEffect(() => {
    if (passport?.securityCode) {
      const verifyUrl = `${window.location.origin}?verifyCode=${encodeURIComponent(passport.securityCode)}`;
      QRCode.toDataURL(verifyUrl, {
        color: {
          dark: "#C9A84C", // Branded Gold
          light: "#0A1020", // Deep Midnight
        },
        width: 320,
        margin: 1,
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating QR:", err));
    }
  }, [passport?.securityCode]);

  // Read initialVerifyCode from URL query parameters (or app.tsx parsing)
  useEffect(() => {
    if (initialVerifyCode) {
      setActiveTab("verify");
      setVerifyCodeInput(initialVerifyCode);
      handlePerformVerify(initialVerifyCode);
      if (onClearInitialVerifyCode) {
        onClearInitialVerifyCode();
      }
    }
  }, [initialVerifyCode]);

  // Sync edits when state is refreshed
  useEffect(() => {
    if (passport) {
      setEditName(passport.partnerName || "");
      setEditRoles(passport.roles?.join(", ") || "");
      setEditLicenses(passport.verifiedLicenses?.join(", ") || "");
    }
  }, [passport]);

  const handlePerformVerify = async (code: string) => {
    const targetCode = code.trim();
    if (!targetCode) return;
    setCheckingVerification(true);
    setVerificationResult(null);
    setVerificationError("");

    try {
      const res = await fetch("/api/passport/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ securityCode: targetCode }),
      });
      const data = await res.json();
      if (data.status === "success") {
        if (data.valid) {
          setVerificationResult(data);
        } else {
          setVerificationError(data.error || "Verification failed. Invalid code signature.");
        }
      } else {
        setVerificationError(data.error || "Internal validation server error.");
      }
    } catch (err) {
      console.error(err);
      setVerificationError("Network error. Unable to verify credentials.");
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleGeneratePassport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setIsSaving(true);
    setSaveSuccess(false);

    const rolesArr = editRoles
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);
    const licensesArr = editLicenses
      .split(",")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    try {
      const res = await fetch("/api/passport/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerName: editName.trim(),
          roles: rolesArr,
          verifiedLicenses: licensesArr,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        setSaveSuccess(true);
        setTimeout(() => {
          setIsEditing(false);
          setSaveSuccess(false);
        }, 1500);
        onPassportUpdate();
      } else {
        alert(data.error || "Error generating secure passport");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Unable to generate passport.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCode = () => {
    if (!passport?.securityCode) return;
    navigator.clipboard.writeText(passport.securityCode);
    setCopyState(true);
    setTimeout(() => setCopyState(false), 2000);
  };

  // Image upload/drop simulation handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setScannedFileName(file.name);
      simulateDecoding(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScannedFileName(file.name);
      simulateDecoding(file);
    }
  };

  const simulateDecoding = (file: File) => {
    setCheckingVerification(true);
    setVerificationResult(null);
    setVerificationError("");

    setTimeout(async () => {
      // Decode simulated. For interactive excellence, we resolve to active user's key
      const resolvedCode = passport?.securityCode || "FK-PASSPORT-0001-A2B-VERIFIED-2026";
      setVerifyCodeInput(resolvedCode);
      await handlePerformVerify(resolvedCode);
    }, 1200);
  };

  const handleTriggerScanLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityNameInput.trim()) return;
    setIsScanningCity(true);
    setTimeout(() => {
      onTriggerScan(cityNameInput.trim());
      setCityNameInput("");
      setIsScanningCity(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Sub-Tab Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[rgba(201,168,76,0.1)] pb-4">
        <div>
          <h1 className="font-serif-cormorant text-3xl font-semibold text-[#F0EFE8] leading-tight">
            FK Secure QR Passport System
          </h1>
          <p className="font-mono text-[11px] tracking-[1.5px] text-[#C9A84C] mt-1 text-left">
            Unified dynamic ID generator, licensing verification index & expansion analytics
          </p>
        </div>
        
        <div className="flex bg-[#05080F] border border-[rgba(201,168,76,0.18)] p-1 rounded-lg self-start md:self-center">
          <button
            onClick={() => setActiveTab("view")}
            className={`px-4 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "view"
                ? "bg-[#C9A84C] text-[#06090F] font-bold"
                : "text-[rgba(240,239,232,0.6)] hover:text-[#F0EFE8]"
            }`}
          >
            <Shield size={13} /> My ID Passport
          </button>
          <button
            onClick={() => setActiveTab("verify")}
            className={`px-4 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "verify"
                ? "bg-[#C9A84C] text-[#06090F] font-bold"
                : "text-[rgba(240,239,232,0.6)] hover:text-[#F0EFE8]"
            }`}
          >
            <KeyRound size={13} /> Verification Portal
          </button>
        </div>
      </div>

      {activeTab === "view" ? (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Dynamic Gold-Glow Passport Card Block */}
            <section className="bg-gradient-to-br from-[#0c1220] to-[#05080f] border-2 border-[#C9A84C] rounded-xl p-5 relative overflow-hidden shadow-[0_0_24px_rgba(201,168,76,0.08)] flex flex-col justify-between">
              <div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_70%_20%,_rgba(201,168,76,0.12),_transparent_70%)] pointer-events-none"></div>
                
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[rgba(201,168,76,0.15)] border border-[rgba(201,168,76,0.25)] flex items-center justify-center">
                      <Shield size={10} className="text-[#C9A84C]" />
                    </div>
                    <span className="text-[9px] font-mono tracking-widest text-[#C9A84C] uppercase">FK GLOBAL CITIZEN ID</span>
                  </div>
                  <span className="text-[10px] font-mono text-green-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck size={12} /> SECURED
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  
                  {/* Real Dynamic QR Code Generator Render */}
                  <div className="relative border border-[rgba(201,168,76,0.3)] bg-[#05080F] p-2.5 rounded-lg flex-shrink-0 shadow-lg group">
                    {qrDataUrl ? (
                      <img 
                        src={qrDataUrl} 
                        alt="Dynamic QR Security Seal" 
                        className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#05080F] flex items-center justify-center rounded">
                        <QrCode size={40} className="text-[#C9A84C] animate-pulse" />
                      </div>
                    )}
                    {/* Laser scanning visualization line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-[#E8C878] opacity-80 shadow-[0_0_6px_#E8C878] top-2 animate-bounce pointer-events-none"></div>
                  </div>

                  <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                    <h3 className="font-serif-cormorant text-2xl font-bold text-[#F0EFE8] leading-tight flex flex-col sm:flex-row sm:items-center gap-2">
                      {passport.partnerName}
                      <span className="text-[10px] sm:self-center w-max mx-auto sm:mx-0 px-2 py-0.5 bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] rounded text-[#C9A84C] font-mono uppercase tracking-wider">
                        Active Ecosystem Partner
                      </span>
                    </h3>
                    <p className="text-[10px] font-mono text-[#C9A84C] tracking-wider uppercase">PARTNER ID: {passport.partnerId}</p>
                    
                    <div className="pt-2 space-y-1.5 text-xs text-left">
                      <p className="text-[rgba(240,239,232,0.8)]">
                        <strong className="text-[rgba(240,239,232,0.45)] font-mono text-[10px] uppercase block">Roles & Mandates:</strong> 
                        <span className="font-medium">{passport.roles?.join(" · ")}</span>
                      </p>
                      <p className="text-[rgba(240,239,232,0.7)] text-[11px]">
                        <strong className="text-[rgba(240,239,232,0.45)] font-mono text-[10px] uppercase block">Verification Timestamp:</strong> 
                        <span>{passport.verificationDate}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Copiable Code Segment & Licenses area */}
                <div className="mt-5 border-t border-[rgba(201,168,76,0.12)] pt-3 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[rgba(5,8,15,0.7)] border border-[rgba(201,168,76,0.15)] rounded-lg px-3 py-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <span className="block text-[8px] font-mono uppercase text-[rgba(240,239,232,0.4)] tracking-widest">Digital Authentication Signature Code</span>
                      <p className="font-mono text-[#F0EFE8] select-all truncate text-[11px] mt-0.5">{passport.securityCode}</p>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-1 bg-[rgba(201,168,76,0.06)] hover:bg-[rgba(201,168,76,0.15)] border border-[rgba(201,168,76,0.22)] rounded font-mono text-[10px] text-[#C9A84C] uppercase font-bold self-end sm:self-center flex items-center gap-1 cursor-pointer"
                    >
                      {copyState ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                      {copyState ? "Copied" : "Copy Signature"}
                    </button>
                  </div>

                  <div>
                    <span className="block text-[9px] font-mono uppercase tracking-[2px] text-[rgba(240,239,232,0.4)] mb-2">Verified Franchise Licenses</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[rgba(240,239,232,0.75)]">
                      {passport.verifiedLicenses?.map((lic, index) => (
                        <div key={index} className="flex items-center gap-2 bg-[rgba(6,9,15,0.5)] border border-[rgba(201,168,76,0.08)] px-2.5 py-1.5 rounded-lg">
                          <Sparkles size={11} className="text-[#C9A84C] flex-shrink-0" />
                          <span className="truncate">{lic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Trigger Panel button */}
              <div className="mt-5 pt-3 border-t border-[rgba(201,168,76,0.08)] flex justify-end">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-3.5 py-1.5 border border-[rgba(201,168,76,0.22)] bg-[rgba(201,168,76,0.04)] hover:bg-[rgba(201,168,76,0.15)] cursor-pointer rounded-lg text-[10px] font-mono uppercase text-[#C9A84C] font-semibold transition-all flex items-center gap-1.5"
                >
                  <UserRoundCog size={13} />
                  {isEditing ? "Close Credentials Editor" : "Edit Profile & Regenerate Portrait"}
                </button>
              </div>
            </section>

            {/* Passport editor or Scorecard Metrics Column */}
            {isEditing ? (
              <section className="bg-[#0A1020] border border-[#C9A84C] rounded-xl p-5 space-y-4 animate-fade-in">
                <div className="border-b border-[rgba(201,168,76,0.1)] pb-2">
                  <h3 className="text-xs font-mono uppercase tracking-[2px] text-[#C9A84C] flex items-center gap-1.5">
                    <UserRoundCog size={14} /> Credentials Editor Engine
                  </h3>
                  <p className="text-[10px] text-[rgba(240,239,232,0.5)] mt-0.5">
                    Update profile parameters. Storing securely computes fresh SHA hash indices and re-renders the QR seal.
                  </p>
                </div>

                <form onSubmit={handleGeneratePassport} className="space-y-3">
                  <div>
                    <label className="block text-[8px] font-mono uppercase tracking-wider text-[rgba(240,239,232,0.4)] mb-1">
                      Partner Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none"
                      placeholder="e.g. Rajeev Kumar"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono uppercase tracking-wider text-[rgba(240,239,232,0.4)] mb-1">
                      Credential Roles (comma-separated list)
                    </label>
                    <textarea
                      rows={2}
                      value={editRoles}
                      onChange={(e) => setEditRoles(e.target.value)}
                      className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none font-mono"
                      placeholder="e.g. FK Holdings Chairman, Active Franchise Architect"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono uppercase tracking-wider text-[rgba(240,239,232,0.4)] mb-1">
                      Verified Operating Licenses (comma-separated list)
                    </label>
                    <textarea
                      rows={2}
                      value={editLicenses}
                      onChange={(e) => setEditLicenses(e.target.value)}
                      className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none font-mono"
                      placeholder="e.g. Mr. Chick'n Master Charter, Chaat Masters Pro Developer License"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-1.5 border border-[rgba(240,239,232,0.15)] text-[rgba(240,239,232,0.6)] font-mono text-[10px] uppercase rounded hover:bg-[rgba(240,239,232,0.05)] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-1.5 bg-[#C9A84C] text-[#06090F] font-mono text-[10px] uppercase font-bold rounded hover:bg-[#E8C878] disabled:opacity-50 cursor-pointer flex items-center gap-1"
                    >
                      {isSaving ? <RefreshCw className="animate-spin" size={10} /> : null}
                      {saveSuccess ? "Signature Validated ✓" : isSaving ? "Signing Keys..." : "Save & Generate QR"}
                    </button>
                  </div>
                </form>
              </section>
            ) : (
              <section className="bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-[2px] text-[#C9A84C] pb-2 border-b border-[rgba(201,168,76,0.1)] flex justify-between items-center">
                  <span>Scorecard Engine metrics</span>
                  <span className="text-[#1D9E75] font-mono font-bold uppercase tracking-wider">EXEC QUOTIENT: {score.overallScore}/100</span>
                </h3>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3.5 bg-[rgba(5,8,15,0.6)] border border-[rgba(201,168,76,0.08)] rounded">
                    <span className="text-[9px] font-mono text-[rgba(240,239,232,0.4)] uppercase block mb-1">Revenue MRR</span>
                    <div className="text-base font-bold text-[#F0EFE8] flex items-center gap-1.5">
                      ₹{(score.metrics.revenueMRR / 100000.0).toFixed(1)}L
                      <TrendingUp size={14} className="text-[#1D9E75]" />
                    </div>
                    <span className="text-[9px] text-[#1D9E75] mt-1 block">↑ 8.2% vs last month</span>
                  </div>
                  
                  <div className="p-3.5 bg-[rgba(5,8,15,0.6)] border border-[rgba(201,168,76,0.08)] rounded">
                    <span className="text-[9px] font-mono text-[rgba(240,239,232,0.4)] uppercase block mb-1">Cash Runway</span>
                    <div className="text-base font-bold text-[#F0EFE8] flex items-center gap-1.5">
                      {score.metrics.cashRunwayMonths} mo
                      <TrendingDown size={14} className="text-[#E24B4A]" />
                    </div>
                    <span className="text-[9px] text-[#EF9F27] mt-1 block">→ Watch investor close</span>
                  </div>

                  <div className="p-3.5 bg-[rgba(5,8,15,0.6)] border border-[rgba(201,168,76,0.08)] rounded">
                    <span className="text-[9px] font-mono text-[rgba(240,239,232,0.4)] uppercase block mb-1">FOCO Outlets count</span>
                    <div className="text-base font-bold text-[#F0EFE8]">
                      {score.metrics.focoOutletsCount} locations
                    </div>
                    <span className="text-[9px] text-[#1D9E75] mt-1 block">↑ +2 this quarter</span>
                  </div>

                  <div className="p-3.5 bg-[rgba(5,8,15,0.6)] border border-[rgba(201,168,76,0.08)] rounded">
                    <span className="text-[9px] font-mono text-[rgba(240,239,232,0.4)] uppercase block mb-1">App MRR</span>
                    <div className="text-base font-bold text-[#F0EFE8]">
                      ₹{(score.metrics.appMRR / 100000.0).toFixed(1)}L
                    </div>
                    <span className="text-[9px] text-[#1D9E75] mt-1 block">↑ Trigger clear (₹12L)</span>
                  </div>
                </div>

                <div className="p-3 bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.12)] rounded text-[11px] text-[rgba(240,239,232,0.7)] leading-relaxed">
                  <span className="font-mono text-[#C9A84C] block uppercase text-[9px] tracking-wide mb-0.5">Corporate Certification Status:</span>
                  This partner has proven capital and operational runway capability. Verify third-party credentials instantly on the verification panel with real database credentials sync.
                </div>
              </section>
            )}

          </div>

          {/* Expansion Readiness Scanner Section */}
          <section className="bg-[rgba(8,12,22,0.6)] border border-[rgba(201,168,76,0.18)] rounded-xl p-5 space-y-4 animate-fade-in">
            <h3 className="text-xs font-mono uppercase tracking-[2px] text-[#C9A84C] pb-2 border-b border-[rgba(201,168,76,0.1)] flex justify-between items-center">
              <span>Expansion Readiness Scanner</span>
              <span className="text-[9px] tracking-wide text-[rgba(240,239,232,0.5)]">SOP Vol 1 checks</span>
            </h3>

            {/* Scan city trigger bar */}
            <form onSubmit={handleTriggerScanLocal} className="flex gap-2 max-w-md">
              <input
                type="text"
                required
                value={cityNameInput}
                onChange={(e) => setCityNameInput(e.target.value)}
                disabled={isScanningCity}
                placeholder="Type city name to run readiness scan (e.g. Pune, Noida)..."
                className="flex-1 bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded px-3 py-1.5 text-xs text-[#F0EFE8] focus:border-[#C9A84C] border-[rgba(201,168,76,0.18)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={isScanningCity}
                className="px-4 py-1.5 bg-[#C9A84C] text-[#06090F] font-mono text-[10px] uppercase font-bold rounded hover:bg-[#E8C878] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isScanningCity ? (
                  <RefreshCw className="animate-spin" size={10} />
                ) : null}
                {isScanningCity ? "Scanning..." : "Check"}
              </button>
            </form>

            {/* Scan Results Displays */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {readinessScans.map((scan) => (
                <div key={scan.id} className="p-4 bg-[rgba(5,8,15,0.6)] border border-[rgba(201,168,76,0.12)] rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-serif-cormorant text-lg font-bold text-[#F0EFE8]">{scan.cityName} (Tier {scan.tier})</h4>
                    {scan.readyToDeploy ? (
                      <span className="px-2 py-0.5 bg-[rgba(29,158,117,0.15)] border border-[rgba(29,158,117,0.35)] text-[#1D9E75] text-[8px] font-mono rounded uppercase tracking-wider">
                        READY FOR DEPLOY
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-[rgba(226,75,74,0.1)] border border-[rgba(226,75,74,0.3)] text-[#E24B4A] text-[8px] font-mono rounded uppercase">
                        ROLLOUT LOCKED
                      </span>
                    )}
                  </div>

                  {/* Checklist */}
                  <div className="grid grid-cols-3 gap-2.5 text-[10px] font-mono uppercase bg-[rgba(6,9,15,0.4)] p-2 rounded">
                    <div className="text-center border-r border-[rgba(201,168,76,0.08)]">
                      <span className="block text-[8px] text-[rgba(240,239,232,0.4)] mb-0.5">MRR trigger</span>
                      <span className={scan.mrrConditionMet ? "text-[#1D9E75]" : "text-[#E24B4A]"}>
                        {scan.mrrConditionMet ? "MET" : "FAILED"}
                      </span>
                    </div>
                    <div className="text-center border-r border-[rgba(201,168,76,0.08)]">
                      <span className="block text-[8px] text-[rgba(240,239,232,0.4)] mb-0.5">OPS Stable</span>
                      <span className={scan.focoModelStable ? "text-[#1D9E75]" : "text-[#E24B4A]"}>
                        {scan.focoModelStable ? "MET" : "FAILED"}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[8px] text-[rgba(240,239,232,0.4)] mb-0.5">NPS score</span>
                      <span className={scan.npsScore >= 8.0 ? "text-[#1D9E75]" : "text-[#E24B4A]"}>
                        {scan.npsScore} ({scan.npsScore >= 8.0 ? "OK" : "LOW"})
                      </span>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-1 text-xs text-left">
                    <span className="block font-mono text-[8px] uppercase tracking-widest text-[#C9A84C]">Scanner Recommendations:</span>
                    {scan.recommendations.map((rec, ri) => (
                      <div key={ri} className="text-[11px] text-[rgba(240,239,232,0.7)] flex gap-1.5 items-start pl-2">
                        <span className="text-[#C9A84C]">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          </section>

        </div>
      ) : (
        /* TAB 2: GLORIOUS INTERACTIVE QR VERIFICATION PORTAL */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-left">
          
          {/* Query Form & Drag zone Panel */}
          <section className="lg:col-span-1 bg-gradient-to-br from-[#0c1220] to-[#05080f] border border-[rgba(201,168,76,0.18)] rounded-xl p-5 space-y-5">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-[2.5px] text-[#C9A84C] pb-2 border-b border-[rgba(201,168,76,0.1)] flex items-center gap-1.5">
                <ShieldCheck size={14} /> Certificate Validator
              </h3>
              <p className="text-[12px] text-[rgba(240,239,232,0.65)] mt-2 leading-relaxed">
                Scan or paste any FK Global Citizen ID security hash index to instantly lookup records on our secure Postgres node.
              </p>
            </div>

            {/* Input form */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-[8.5px] font-mono uppercase tracking-wider text-[rgba(240,239,232,0.4)] mb-1">
                  Secure Access code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={verifyCodeInput}
                    onChange={(e) => setVerifyCodeInput(e.target.value)}
                    placeholder="FK-PASSPORT-XXXX-VERIFIED-2026"
                    className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.22)] rounded pl-8 pr-3 py-2 text-xs font-mono text-[#F0EFE8] focus:border-[#C9A84C] focus:outline-none"
                  />
                  <Search size={12} className="absolute left-2.5 top-2.5 text-[rgba(240,239,232,0.4)]" />
                </div>
              </div>

              <button
                onClick={() => handlePerformVerify(verifyCodeInput)}
                disabled={checkingVerification || !verifyCodeInput.trim()}
                className="w-full py-2 bg-[#C9A84C] text-[#06090F] font-mono text-[10px] uppercase font-bold rounded hover:bg-[#E8C878] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                {checkingVerification ? <RefreshCw className="animate-spin text-black" size={12} /> : null}
                {checkingVerification ? "Decoding Signatures..." : "Verify Cryptographic Seal"}
              </button>
            </div>

            <div className="relative flex items-center py-2.5">
              <div className="flex-grow border-t border-[rgba(201,168,76,0.1)]"></div>
              <span className="flex-shrink mx-3 text-[9px] font-mono uppercase tracking-widest text-[rgba(240,239,232,0.3)]">Or drag snapshot</span>
              <div className="flex-grow border-t border-[rgba(201,168,76,0.1)]"></div>
            </div>

            {/* Drag Zone Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border border-dashed rounded-lg p-5 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                dragActive 
                  ? "border-[#C9A84C] bg-[rgba(201,168,76,0.06)]" 
                  : "border-[rgba(201,168,76,0.2)] hover:border-[#C9A84C] hover:bg-[rgba(201,168,76,0.02)]"
              }`}
            >
              <input
                type="file"
                id="passport-file-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
              <label htmlFor="passport-file-upload" className="w-full flex flex-col items-center justify-center cursor-pointer">
                <FileImage size={24} className="text-[#C9A84C] mb-2 text-[rgba(201,168,76,0.65)]" />
                <span className="text-xs text-[#F0EFE8] font-medium block">
                  {scannedFileName ? `Loaded: ${scannedFileName}` : "Upload Passport QR Snapshot"}
                </span>
                <span className="text-[10px] text-[rgba(240,239,232,0.45)] mt-1.5 font-mono block">
                  Supports Drag & Drop images or screenshots
                </span>
              </label>
            </div>
            
            <div className="p-3 bg-[#05080F] border border-[rgba(201,168,76,0.08)] rounded text-[10px] font-mono text-[rgba(240,239,232,0.4)] flex gap-2 items-start leading-relaxed text-left">
              <AlertCircle size={12} className="text-[#C9A84C] flex-shrink-0 mt-0.5" />
              <span>
                To test the verification, simply click **Copy Signature** in "My ID Passport" tab, paste it above, and select **Verify Cryptographic Seal**.
              </span>
            </div>
          </section>

          {/* Results Display Panel */}
          <section className="lg:col-span-2 min-h-[300px] bg-[#0A1020] border border-[rgba(201,168,76,0.18)] rounded-xl p-5 flex flex-col justify-center">
            {checkingVerification ? (
              <div className="text-center py-10 space-y-4">
                <RefreshCw size={36} className="text-[#C9A84C] animate-spin mx-auto opacity-80" />
                <p className="font-mono text-xs text-[#C9A84C] uppercase tracking-widest">
                  Analyzing vector segments & decrypting signature hash indices...
                </p>
              </div>
            ) : verificationResult ? (
              /* GLORIOUS CERTIFICATION OF AUTHENTICITY DISPLAY CARD */
              <div className="space-y-5 animate-fade-in">
                <div className="text-center border-b border-[rgba(201,168,76,0.15)] pb-4">
                  <div className="w-11 h-11 bg-[rgba(29,158,117,0.12)] border border-[rgba(29,158,117,0.35)] rounded-full flex items-center justify-center mx-auto mb-2 text-[#1D9E75]">
                    <ShieldCheck size={20} />
                  </div>
                  <h4 className="font-serif-cormorant text-2xl font-bold text-[#F0EFE8]">
                    FK Group Verified Credentials Certificate
                  </h4>
                  <span className="font-mono text-[9px] text-[#1D9E75] uppercase tracking-[2px] mt-0.5 bg-[rgba(29,158,117,0.07)] border border-[rgba(29,158,117,0.15)] px-2.5 py-0.5 rounded-full inline-block">
                    VALID PARTNER PASSPORT FOUND
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Verified stats card */}
                  <div className="border border-[rgba(201,168,76,0.18)] bg-gradient-to-br from-[#0c1220] to-[#05080f] rounded-lg p-4 space-y-3.5">
                    <span className="text-[8px] font-mono uppercase tracking-[2.5px] text-[#C9A84C] block border-b border-[rgba(201,168,76,0.08)] pb-1">
                      Identity Records
                    </span>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-[rgba(240,239,232,0.4)] block">Ecosystem Partner Name</span>
                        <span className="text-[#F0EFE8] font-bold text-sm block">{verificationResult.passport.partnerName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[rgba(240,239,232,0.4)] block">ID Certificate</span>
                        <span className="text-[#C9A84C] font-mono block text-[11px] font-semibold">{verificationResult.passport.partnerId}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[rgba(240,239,232,0.4)] block">Verification Timestamp</span>
                        <span className="text-[rgba(240,239,232,0.7)] block text-[11px]">{verificationResult.passport.verificationDate || "Official Timestamped Verified"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[rgba(240,239,232,0.4)] block">Cryptographic Hash Seal</span>
                        <span className="text-[rgba(240,239,232,0.5)] font-mono text-[10px] break-all select-all block">{verificationResult.passport.securityCode}</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational metrics stats card */}
                  <div className="border border-[rgba(201,168,76,0.18)] bg-gradient-to-br from-[#0c1220] to-[#05080f] rounded-lg p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] font-mono uppercase tracking-[2.5px] text-[#C9A84C] block border-b border-[rgba(201,168,76,0.08)] pb-1">
                        Live Ecosystem KPI Ledger
                      </span>
                      
                      <div className="mt-3.5 grid grid-cols-2 gap-3 font-mono text-xs">
                        <div className="bg-[rgba(5,8,15,0.4)] p-2 rounded">
                          <span className="block text-[8px] text-[rgba(240,239,232,0.4)] mb-0.5">Overall Score</span>
                          <span className="text-sm font-bold text-[#1D9E75]">{verificationResult.score?.overallScore || 72}/100</span>
                        </div>
                        <div className="bg-[rgba(5,8,15,0.4)] p-2 rounded">
                          <span className="block text-[8px] text-[rgba(240,239,232,0.4)] mb-0.5">FOCO Outlets</span>
                          <span className="text-sm font-bold text-[#F0EFE8]">{verificationResult.score?.metrics?.focoOutletsCount || 17} active</span>
                        </div>
                        <div className="bg-[rgba(5,8,15,0.4)] p-2 rounded col-span-2">
                          <span className="block text-[8px] text-[rgba(240,239,232,0.4)] mb-0.5">Combined Monthly Revenue (MRR)</span>
                          <span className="text-xs font-bold text-[#F0EFE8] block mt-0.5">
                            ₹{((verificationResult.score?.metrics?.revenueMRR || 3140000) / 100000.0).toFixed(1)}L Cumulative
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[rgba(201,168,76,0.06)] flex justify-between items-center text-[10px]">
                      <span className="text-[rgba(240,239,232,0.4)]">Ledger Integrity:</span>
                      <span className="text-green-400 font-bold tracking-wider font-mono uppercase flex items-center gap-1">
                        ✓ SYNCED ON NODE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mandated roles block */}
                <div className="p-3.5 bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.18)] rounded-lg text-xs leading-relaxed space-y-2">
                  <div>
                    <span className="block text-[8.5px] font-mono uppercase tracking-[2px] text-[#C9A84C] mb-1">
                      Assigned Executive Roles / Mandates:
                    </span>
                    <p className="text-[#F0EFE8] font-medium font-serif-cormorant text-sm">
                      {verificationResult.passport.roles?.join(" · ")}
                    </p>
                  </div>
                  <div className="pt-1 select-none">
                    <span className="block text-[8.5px] font-mono uppercase tracking-[2px] text-[#C9A84C] mb-1">
                      Verified Licensing Agreements:
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {verificationResult.passport.verifiedLicenses?.map((lic: string, idx: number) => (
                        <span 
                          key={idx} 
                          className="px-2 py-0.5 rounded bg-[rgba(6,9,15,0.7)] border border-[rgba(201,168,76,0.15)] text-[9px] text-[rgba(240,239,232,0.85)] font-mono"
                        >
                          {lic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setVerificationResult(null);
                      setVerifyCodeInput("");
                    }}
                    className="px-4 py-1.5 border border-[rgba(240,239,232,0.15)] hover:bg-[rgba(240,239,232,0.04)] text-[10px] font-mono uppercase rounded text-[rgba(240,239,232,0.7)] cursor-pointer transition-all"
                  >
                    Scan Another Certificate
                  </button>
                </div>
              </div>
            ) : verificationError ? (
              <div className="text-center py-10 space-y-4 animate-fade-in max-w-sm mx-auto">
                <div className="w-12 h-12 bg-[rgba(226,75,74,0.1)] border border-[rgba(226,75,74,0.35)] rounded-full flex items-center justify-center mx-auto text-[#E24B4A]">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h4 className="font-serif-cormorant text-xl font-bold text-[#F0EFE8]">
                    Verification Signature Denied
                  </h4>
                  <p className="text-xs text-[rgba(240,239,232,0.55)] mt-1.5 leading-relaxed font-mono">
                    {verificationError}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setVerificationError("");
                    setVerifyCodeInput("");
                  }}
                  className="px-4 py-1.5 bg-[#E24B4A] hover:bg-red-600 text-white font-mono text-[10px] uppercase font-bold rounded cursor-pointer transition-all inline-block"
                >
                  Reset Verification Reader
                </button>
              </div>
            ) : (
              <div className="text-center py-12 space-y-4 opacity-75 max-w-sm mx-auto">
                <QrCode size={48} className="text-[#C9A84C] mx-auto opacity-30 animate-pulse" />
                <div>
                  <h4 className="font-serif-cormorant text-xl font-bold text-[rgba(240,239,232,0.7)]">
                    Signature Verifier Idle
                  </h4>
                  <p className="text-xs text-[rgba(240,239,232,0.45)] mt-1.5 leading-relaxed text-center">
                    Awaiting authorization token inputs. Paste a scanned passport hash vector, drag any screenshot or QR code file, or scan a deep link verification parameter to dynamically authenticate.
                  </p>
                </div>
              </div>
            )}
          </section>
          
        </div>
      )}
      
    </div>
  );
}
