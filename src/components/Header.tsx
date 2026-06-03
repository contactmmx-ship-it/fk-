import React from "react";

interface HeaderProps {
  activePath: string;
  onNavigate: (path: string) => void;
  executiveScore: number;
  currentUser: { email: string; role: string } | null;
  onLogout: () => void;
}

export default function Header({ activePath, onNavigate, executiveScore, currentUser, onLogout }: HeaderProps) {
  const routes = [
    { path: "/command-center", label: "Command Center" },
    { path: "/weekly-board", label: "Weekly Board" },
    { path: "/emergency-mode", label: "Emergency Mode" },
    { path: "/accountability", label: "Accountability" },
    { path: "/decision-log", label: "Decision Log" },
    { path: "/war-room", label: "Chairman War Room" }
  ];

  return (
    <header className="flex items-center justify-between px-7 py-4.5 border-b border-[rgba(201,168,76,0.18)] bg-[rgba(6,9,15,0.95)] sticky top-0 z-50 backdrop-blur-md">
      <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate("/command-center")}>
        <div className="w-8 h-8 border border-[#C9A84C] rounded-md flex items-center justify-center font-serif-cormorant text-base font-semibold text-[#C9A84C] tracking-[0.5px]">
          FK
        </div>
        <div className="font-sans font-extralight text-[13px] tracking-[2.5px] uppercase text-[rgba(240,239,232,0.6)]">
          <span className="text-[#C9A84C] font-normal">Chairman</span> Partner OS
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-1">
        {routes.map((r) => (
          <button
            key={r.path}
            onClick={() => onNavigate(r.path)}
            className={`px-4 py-2 text-[11px] tracking-[1.5px] uppercase font-mono transition-all cursor-pointer border-b-2 bg-transparent ${
              activePath === r.path
                ? "text-[#C9A84C] border-[#C9A84C] font-normal"
                : "text-[rgba(240,239,232,0.38)] border-transparent hover:text-[rgba(240,239,232,0.65)]"
            }`}
          >
            {r.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        {currentUser && (
          <div className="flex items-center gap-2">
            <span className="hidden lg:inline text-[9px] font-mono text-[rgba(240,239,232,0.48)] uppercase">
              {currentUser.email} <span className="text-[#C9A84C]">[{currentUser.role}]</span>
            </span>
            <button
              onClick={onLogout}
              className="px-2.5 py-1 text-[9px] font-mono uppercase bg-[rgba(201,168,76,0.1)] hover:bg-[rgba(201,168,76,0.22)] border border-[rgba(201,168,76,0.28)] text-[#C9A84C] cursor-pointer rounded transition-all"
              title="End active supervisor session"
            >
              Sign Out
            </button>
          </div>
        )}
        <div className="hidden sm:flex items-center gap-2.5 bg-[rgba(201,168,76,0.15)] border border-[rgba(201,168,76,0.25)] px-2.5 py-1 rounded text-[10px] tracking-[1.5px] font-mono text-[#C9A84C]">
          DAY 183 — FK MISSION 2030
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-mono text-[rgba(240,239,232,0.5)]">EXEC: <span className="text-[#C9A84C] font-bold">{executiveScore}</span></div>
          <div className="w-2 h-2 rounded-full bg-[#1D9E75] shadow-[0_0_6px_#1D9E75] animate-pulse"></div>
        </div>
      </div>
    </header>
  );
}
