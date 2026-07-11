import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Monitor } from "lucide-react";
import { BracketMatch, Station, Player, GameTheme } from "../data/tournamentData";

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

  const availableStations = stations.filter(s => s.active && !s.matchId && (!s.gameId || s.gameId === match.gameId));

  const p1 = players.find(p => p.id === match.player1Id);
  const p2 = players.find(p => p.id === match.player2Id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-lg overflow-hidden flex flex-col shadow-2xl"
        style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div className="text-sm tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace', color: theme.primaryColor }}>
            CALL MATCH
          </div>
          <button onClick={onCancel} className="opacity-50 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <div className="text-center mb-6">
            <div className="text-xs opacity-50 mb-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{match.roundName}</div>
            <div className="text-xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {p1?.tag || 'TBD'} <span style={{ color: theme.primaryColor }}>vs</span> {p2?.tag || 'TBD'}
            </div>
          </div>

          <div className="text-xs tracking-widest opacity-50 mb-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            SELECT STATION
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {availableStations.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStation(s.id)}
                className={`flex flex-col items-center justify-center py-3 rounded border transition-all ${selectedStation === s.id ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                style={{ 
                  background: selectedStation === s.id ? `${theme.primaryColor}20` : 'var(--card)',
                  borderColor: selectedStation === s.id ? theme.primaryColor : 'var(--border)'
                }}
              >
                <Monitor size={16} className="mb-1" style={{ color: selectedStation === s.id ? theme.primaryColor : 'var(--foreground)' }} />
                <span className="text-xs tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color: selectedStation === s.id ? theme.primaryColor : 'var(--foreground)' }}>
                  {s.id}
                </span>
              </button>
            ))}
            {availableStations.length === 0 && (
              <div className="col-span-4 py-4 text-center text-xs opacity-50" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                No available stations for this game.
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded text-xs tracking-widest font-bold opacity-70 hover:opacity-100 transition-opacity"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              CANCEL
            </button>
            <button
              onClick={() => selectedStation && onConfirm(selectedStation)}
              disabled={!selectedStation}
              className="flex-1 py-3 rounded text-xs tracking-widest font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: theme.primaryColor, color: 'var(--background)' }}
            >
              CONFIRM CALL
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
