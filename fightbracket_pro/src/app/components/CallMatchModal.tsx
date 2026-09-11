import { useState } from "react";
import { motion } from "motion/react";
import { X, Monitor, Radio, CheckCircle } from "lucide-react";
import { BracketMatch, Station, Player, GameTheme } from "../data/tournamentData";
import { FistBumpIcon } from "./FistBumpIcon";

export function CallMatchModal({
  match,
  players,
  stations,
  theme,
  onConfirm,
  onCancel
}: {
  match: BracketMatch;
  players: Player[];
  stations: Station[];
  theme: GameTheme;
  onConfirm: (stationId: number) => void;
  onCancel: () => void;
}) {
  const [selectedStation, setSelectedStation] = useState<number | null>(null);

  const availableStations = stations.filter(
    s => s.active && !s.matchId && (!s.gameId || s.gameId === match.gameId)
  );

  const p1 = players.find(p => p.id === match.player1Id);
  const p2 = players.find(p => p.id === match.player2Id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{
          background: 'linear-gradient(175deg, #0d1527 0%, #060a14 100%)',
          border: `1.5px solid ${theme.primaryColor}60`,
          boxShadow: `0 0 50px ${theme.glowColor}`,
        }}
      >
        {/* Top Accent Strip */}
        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
        />

        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <div className="flex items-center gap-2">
            <Radio size={14} className="animate-pulse" style={{ color: theme.primaryColor }} />
            <span
              className="text-xs font-mono font-bold tracking-widest uppercase"
              style={{ color: theme.primaryColor }}
            >
              CALL MATCH TO STATION
            </span>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          {/* Match Info with Animated Fist Bump */}
          <div
            className="rounded-xl p-4 mb-6 text-center border"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderColor: `${theme.primaryColor}30`,
            }}
          >
            <div className="text-[11px] font-mono tracking-widest uppercase text-slate-400 mb-2">
              {match.roundName} · BEST OF {match.bestOf}
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className="flex-1 text-right truncate">
                <span className="text-base sm:text-lg font-black font-sans text-white">
                  {p1?.tag || 'TBD'}
                </span>
                {p1?.character && (
                  <div className="text-[11px] text-slate-400 truncate">{p1.character}</div>
                )}
              </div>

              {/* Fist Bump Icon */}
              <div className="shrink-0 px-2">
                <FistBumpIcon
                  size={28}
                  leftColor={theme.primaryColor}
                  rightColor={theme.secondaryColor}
                  sparkColor="#FFD600"
                />
              </div>

              <div className="flex-1 text-left truncate">
                <span className="text-base sm:text-lg font-black font-sans text-white">
                  {p2?.tag || 'TBD'}
                </span>
                {p2?.character && (
                  <div className="text-[11px] text-slate-400 truncate">{p2.character}</div>
                )}
              </div>
            </div>
          </div>

          {/* Station Selection */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
              SELECT ACTIVE STATION
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {availableStations.length} available
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-6 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {availableStations.map(s => {
              const isSelected = selectedStation === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStation(s.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all relative ${
                    isSelected
                      ? 'scale-[1.03] shadow-lg'
                      : 'opacity-70 hover:opacity-100 hover:border-slate-500'
                  }`}
                  style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${theme.primaryColor}30 0%, ${theme.primaryColor}10 100%)`
                      : 'rgba(255, 255, 255, 0.04)',
                    borderColor: isSelected ? theme.primaryColor : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: isSelected ? `0 0 15px ${theme.glowColor}` : 'none',
                  }}
                >
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 text-emerald-400">
                      <CheckCircle size={12} fill="currentColor" className="text-black" />
                    </span>
                  )}
                  <Monitor
                    size={20}
                    className="mb-1.5"
                    style={{ color: isSelected ? theme.primaryColor : '#94A3B8' }}
                  />
                  <span
                    className="text-sm font-bold font-mono"
                    style={{ color: isSelected ? '#FFFFFF' : '#E2E8F0' }}
                  >
                    STATION {s.id}
                  </span>
                  {s.streamName && (
                    <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-tighter truncate max-w-full">
                      STREAM
                    </span>
                  )}
                </button>
              );
            })}

            {availableStations.length === 0 && (
              <div className="col-span-4 py-8 text-center text-xs font-mono text-slate-500 border border-dashed border-white/10 rounded-xl">
                No vacant stations available for this game right now.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl text-xs font-mono font-bold tracking-wider hover:bg-white/10 transition-colors border border-white/10 text-slate-300"
            >
              CANCEL
            </button>
            <button
              onClick={() => selectedStation && onConfirm(selectedStation)}
              disabled={!selectedStation}
              className="flex-1 py-3 rounded-xl text-xs font-mono font-bold tracking-wider text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
              style={{
                background: selectedStation
                  ? `linear-gradient(90deg, #FFD600, ${theme.primaryColor})`
                  : 'rgba(255,255,255,0.1)',
                boxShadow: selectedStation ? '0 0 20px rgba(255, 214, 0, 0.4)' : 'none',
              }}
            >
              BROADCAST CALL
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
