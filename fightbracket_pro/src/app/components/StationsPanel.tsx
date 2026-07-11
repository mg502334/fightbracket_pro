import { useState } from "react";
import { Monitor, Swords, Plus, X, ChevronRight, Circle } from "lucide-react";
import type { Station, BracketMatch, Player, GameTheme } from "../data/tournamentData";
import { GAME_THEMES } from "../data/tournamentData";

interface StationsPanelProps {
  stations: Station[];
  matches: BracketMatch[];
  players: Player[];
  theme: GameTheme;
  onAssignMatch: (stationId: number, matchId: string) => void;
  onCallMatch: (match: BracketMatch, stationId: number) => void;
  onClearStation: (stationId: number) => void;
  onAddStation: () => void;
  onRemoveStation: (stationId: number) => void;
  onRenameStation: (stationId: number, name: string) => void;
}

export function StationsPanel({ stations, matches, players, theme, onAssignMatch, onCallMatch, onClearStation, onAddStation, onRemoveStation, onRenameStation }: StationsPanelProps) {
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [editingStation, setEditingStation] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));

  const readyMatches = matches.filter(m =>
    m.state === 'pending' &&
    m.player1Id &&
    m.player2Id &&
    !stations.some(s => s.matchId === m.id)
  );

  function handleAssign(stationId: number, matchId: string) {
    onAssignMatch(stationId, matchId);
    setSelectedStation(null);
  }

  function handleCall(stationId: number) {
    const station = stations.find(s => s.id === stationId);
    if (!station?.matchId) return;
    const match = matches.find(m => m.id === station.matchId);
    if (match) onCallMatch(match, stationId);
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
      {stations.map(station => {
        const match = station.matchId ? matches.find(m => m.id === station.matchId) : null;
        const p1 = match?.player1Id ? playerMap[match.player1Id] : null;
        const p2 = match?.player2Id ? playerMap[match.player2Id] : null;
        const gameTheme = station.gameId ? GAME_THEMES[station.gameId] : null;
        const isActive = station.active;
        const isLive = match?.state === 'in_progress' || match?.state === 'called';
        const isSelecting = selectedStation === station.id;

        return (
          <div
            key={station.id}
            className="rounded overflow-hidden transition-all duration-200"
            style={{
              background: 'var(--card)',
              border: `1px solid ${isLive ? (gameTheme?.primaryColor ?? theme.primaryColor) : isSelecting ? `${theme.primaryColor}50` : 'rgba(122,158,192,0.15)'}`,
              boxShadow: isLive ? `0 0 16px ${gameTheme?.glowColor ?? theme.glowColor}` : 'none',
              opacity: isActive ? 1 : 0.4,
            }}
          >
            {/* Station header */}
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{
                background: isLive ? `${gameTheme?.primaryColor ?? theme.primaryColor}12` : 'var(--sidebar)',
                borderBottom: `1px solid rgba(122,158,192,0.1)`,
              }}
            >
              <div className="flex items-center gap-2">
                <Monitor size={13} style={{ color: isLive ? (gameTheme?.primaryColor ?? theme.primaryColor) : 'var(--muted-foreground)' }} />
                {editingStation === station.id ? (
                  <input
                    type="text"
                    value={editName}
                    autoFocus
                    onBlur={() => {
                      if (editName.trim()) onRenameStation(station.id, editName.trim());
                      setEditingStation(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editName.trim()) onRenameStation(station.id, editName.trim());
                        setEditingStation(null);
                      }
                      if (e.key === 'Escape') setEditingStation(null);
                    }}
                    className="bg-transparent border-b border-white/20 text-sm tracking-wider focus:outline-none focus:border-white/50 w-24"
                    style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--foreground)' }}
                  />
                ) : (
                  <span
                    className="text-sm tracking-wider cursor-pointer hover:opacity-80"
                    onClick={() => { setEditingStation(station.id); setEditName(station.name); }}
                    style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: isLive ? (gameTheme?.primaryColor ?? theme.primaryColor) : 'var(--foreground)' }}
                    title="Click to rename"
                  >
                    {station.name}
                  </span>
                )}
                {gameTheme && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded tracking-wider"
                    style={{ background: `${gameTheme.primaryColor}18`, color: gameTheme.primaryColor, fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}
                  >
                    {gameTheme.shortName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Circle
                  size={7}
                  fill={isLive ? '#00FF88' : isActive && match ? '#FFD600' : isActive ? 'var(--muted-foreground)' : '#3A5A7A'}
                  style={{ color: 'transparent' }}
                />
                <span className="text-xs opacity-50" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                  {isLive ? 'LIVE' : match ? 'ASSIGNED' : isActive ? 'OPEN' : 'OFFLINE'}
                </span>
              </div>
            </div>

            {/* Station body */}
            <div className="p-4">
              {match && p1 && p2 ? (
                <div>
                  <div className="text-xs opacity-40 mb-2 tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {match.roundName} · BO{match.bestOf}
                  </div>
                  <div className="flex flex-col gap-1.5 mb-3">
                    <MatchSlot player={p1} score={match.player1Score} gameTheme={gameTheme} isWinner={match.winnerId === p1.id} />
                    <div className="text-center text-xs opacity-30" style={{ fontFamily: 'JetBrains Mono, monospace' }}>VS</div>
                    <MatchSlot player={p2} score={match.player2Score} gameTheme={gameTheme} isWinner={match.winnerId === p2.id} />
                  </div>

                  <div className="flex gap-2">
                    {match.state !== 'in_progress' && match.state !== 'completed' && (
                      <button
                        onClick={() => handleCall(station.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs tracking-widest transition-all hover:opacity-80"
                        style={{
                          background: `${gameTheme?.primaryColor ?? theme.primaryColor}20`,
                          border: `1px solid ${gameTheme?.primaryColor ?? theme.primaryColor}40`,
                          color: gameTheme?.primaryColor ?? theme.primaryColor,
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      >
                        <Swords size={11} />
                        CALL MATCH
                      </button>
                    )}
                    <button
                      onClick={() => onClearStation(station.id)}
                      className="flex items-center justify-center w-8 h-7 rounded transition-all hover:opacity-80"
                      title="Clear Station"
                      style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.3)', color: '#FF1744' }}
                    >
                      <X size={11} />
                    </button>
                    <button
                      onClick={() => { if(confirm('Remove this station?')) onRemoveStation(station.id); }}
                      className="flex items-center justify-center w-8 h-7 rounded transition-all hover:opacity-80 ml-1"
                      title="Remove Station"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted-foreground)' }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
              ) : isActive && !isSelecting ? (
                <div>
                  <div className="text-xs opacity-30 mb-3 text-center py-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    — OPEN —
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedStation(station.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs tracking-widest transition-all hover:opacity-80"
                      style={{
                        background: `${theme.primaryColor}10`,
                        border: `1px dashed ${theme.primaryColor}30`,
                        color: theme.primaryColor,
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      <Plus size={11} />
                      ASSIGN MATCH
                    </button>
                    <button
                      onClick={() => { if(confirm('Remove this station?')) onRemoveStation(station.id); }}
                      className="flex items-center justify-center w-8 h-7 rounded transition-all hover:opacity-80 shrink-0"
                      title="Remove Station"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted-foreground)' }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
              ) : isSelecting ? (
                <div>
                  <div className="text-xs mb-2 tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace', color: theme.primaryColor }}>
                    SELECT MATCH:
                  </div>
                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                    {readyMatches.length === 0 ? (
                      <div className="text-xs opacity-30 py-2 text-center" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        No matches ready
                      </div>
                    ) : (
                      readyMatches.map(rm => {
                        const rp1 = rm.player1Id ? playerMap[rm.player1Id] : null;
                        const rp2 = rm.player2Id ? playerMap[rm.player2Id] : null;
                        const rg = GAME_THEMES[rm.gameId];
                        return (
                          <button
                            key={rm.id}
                            onClick={() => handleAssign(station.id, rm.id)}
                            className="flex items-center justify-between px-2 py-1.5 rounded text-left transition-all hover:opacity-80"
                            style={{
                              background: `${rg.primaryColor}10`,
                              border: `1px solid ${rg.primaryColor}25`,
                            }}
                          >
                            <div>
                              <div className="text-xs" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--foreground)', fontSize: 11 }}>
                                {rp1?.tag ?? 'TBD'} vs {rp2?.tag ?? 'TBD'}
                              </div>
                              <div className="text-xs opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>
                                {rg.shortName} · {rm.roundName}
                              </div>
                            </div>
                            <ChevronRight size={11} style={{ color: rg.primaryColor, opacity: 0.6 }} />
                          </button>
                        );
                      })
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedStation(null)}
                    className="mt-2 w-full py-1 text-xs opacity-40 hover:opacity-60 transition-all"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    cancel
                  </button>
                </div>
              ) : (
                <div className="text-xs opacity-20 text-center py-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>OFFLINE</div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Add Station Button */}
      <button
        onClick={onAddStation}
        className="rounded flex flex-col items-center justify-center transition-all hover:opacity-80 min-h-[160px]"
        style={{
          background: 'var(--card)',
          border: `1px dashed ${theme.primaryColor}30`,
          opacity: 0.6,
        }}
      >
        <Plus size={24} style={{ color: theme.primaryColor, marginBottom: '8px' }} />
        <span className="text-sm tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: theme.primaryColor }}>
          ADD STATION
        </span>
      </button>
    </div>
  );
}

function MatchSlot({ player, score, gameTheme, isWinner }: { player: Player; score: number; gameTheme: GameTheme | null; isWinner: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-2.5 py-1.5 rounded"
      style={{
        background: isWinner ? `${gameTheme?.primaryColor ?? '#00E5FF'}15` : 'var(--border)',
        border: `1px solid ${isWinner ? `${gameTheme?.primaryColor ?? '#00E5FF'}30` : 'var(--border)'}`,
      }}
    >
      <span className="text-xs" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: isWinner ? (gameTheme?.primaryColor ?? '#00E5FF') : 'var(--foreground)' }}>
        {player.countryFlag} {player.tag}
      </span>
      <span className="text-xs tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: score > 0 ? 'var(--foreground)' : 'rgba(122,158,192,0.3)' }}>
        {score}
      </span>
    </div>
  );
}
