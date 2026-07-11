import type React from "react";
import { Zap, Globe, Users } from "lucide-react";
import { type GameTheme } from "../data/tournamentData";

interface GameBannerProps {
  theme: GameTheme;
  entrantCount: number;
  checkedInCount: number;
  activeMatchCount: number;
  completionPercentage?: number;
}

const GameLogos: Record<string, React.ReactNode> = {
  tekken8: (
    <svg viewBox="0 0 80 24" className="h-6" fill="currentColor">
      <text x="0" y="20" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: 2 }}>
        TEKKEN 8
      </text>
    </svg>
  ),
  sf6: (
    <svg viewBox="0 0 120 24" className="h-6" fill="currentColor">
      <text x="0" y="20" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: 2 }}>
        STREET FIGHTER 6
      </text>
    </svg>
  ),
  fatalFury: (
    <svg viewBox="0 0 180 24" className="h-6" fill="currentColor">
      <text x="0" y="20" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: 2 }}>
        FATAL FURY: CITY OF WOLVES
      </text>
    </svg>
  ),
};

export function GameBanner({ theme, entrantCount, checkedInCount, activeMatchCount, completionPercentage = 0 }: GameBannerProps) {
  const isActive = activeMatchCount > 0;

  return (
    <div
      className="relative overflow-hidden border-b"
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom} 0%, #050A14 60%)`,
        borderColor: `${theme.primaryColor}30`,
      }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

      {/* Glow line at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${theme.primaryColor}, transparent)` }}
      />

      <div className="relative flex items-center justify-between px-6 py-4">
        {/* Left: Game identity */}
        <div className="flex items-center gap-4">
          {/* Game color badge */}
          <div
            className="w-1 h-12 rounded-full"
            style={{ background: `linear-gradient(180deg, ${theme.primaryColor}, ${theme.secondaryColor})`, boxShadow: `0 0 12px ${theme.primaryColor}` }}
          />
          <div>
            <div
              className="text-xs tracking-widest mb-1 opacity-70"
              style={{ fontFamily: 'JetBrains Mono, monospace', color: theme.primaryColor }}
            >
              {theme.publisher} · NOW LIVE
            </div>
            <div
              className="text-2xl tracking-wider"
              style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: theme.primaryColor, textShadow: `0 0 20px ${theme.primaryColor}` }}
            >
              {theme.displayName}
            </div>
            <div className="text-xs opacity-50 tracking-wider mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)' }}>
              {theme.description}
            </div>
          </div>
        </div>

        {/* Right: Live stats */}
        <div className="flex items-center gap-6">
          <Stat icon={<Users size={14} />} label="ENTRANTS" value={entrantCount} color="#7A9EC0" />
          <Stat icon={<Zap size={14} />} label="CHECKED IN" value={checkedInCount} color="#00FF88" />
          <Stat icon={<Globe size={14} />} label="LIVE MATCHES" value={activeMatchCount} color={theme.primaryColor} pulse={isActive} />

          {isActive && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded text-xs tracking-widest"
              style={{
                background: `${theme.primaryColor}18`,
                border: `1px solid ${theme.primaryColor}40`,
                color: theme.primaryColor,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: theme.primaryColor }} />
              IN PROGRESS
              {completionPercentage > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px]" style={{ background: `${theme.primaryColor}30`, color: theme.primaryColor }}>
                  {completionPercentage}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, color, pulse }: { icon: React.ReactNode; label: string; value: number; color: string; pulse?: boolean }) {
  return (
    <div className="text-right">
      <div className="flex items-center gap-1 justify-end mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
        {icon}
        <span className="text-xs tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
      </div>
      <div
        className="text-xl tabular-nums"
        style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color, textShadow: pulse ? `0 0 10px ${color}` : 'none' }}
      >
        {value}
      </div>
    </div>
  );
}
