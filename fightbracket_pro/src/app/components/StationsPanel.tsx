import { useState } from "react";
import { Monitor, Swords, Plus, X, ChevronRight, Circle, Pencil, Check } from "lucide-react";
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
  discordTextCallouts?: boolean;
  discordVoiceCallouts?: boolean;
  onToggleDiscordText?: () => void;
  onToggleDiscordVoice?: () => void;
  onOpenDiscordSettings?: () => void;
}

export function StationsPanel({
  stations,
  matches,
  players,
  theme,
  onAssignMatch,
  onCallMatch,
  onClearStation,
  onAddStation,
  onRemoveStation,
  onRenameStation,
  discordTextCallouts = true,
  discordVoiceCallouts = true,
  onToggleDiscordText,
  onToggleDiscordVoice,
  onOpenDiscordSettings
}: StationsPanelProps) {
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
    <div className="space-y-4">
      {/* Discord Match Callout Switches */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg border backdrop-blur-sm"
        style={{
          background: 'rgba(88,101,242,0.06)',
          borderColor: 'rgba(88,101,242,0.25)',
        }}
      >
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 127.14 96.36" fill="#5865F2" aria-hidden="true" className="shrink-0">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
          </svg>
          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Discord Match Callouts
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              Live broadcast controls for match announcements
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Text Callouts Switch */}
          <button
            onClick={onToggleDiscordText}
            title={discordTextCallouts ? 'Click to turn OFF Discord text channel callouts' : 'Click to turn ON Discord text channel callouts'}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
              discordTextCallouts
                ? 'bg-[#5865F2]/20 border-[#5865F2]/60 text-white shadow-[0_0_12px_rgba(88,101,242,0.3)]'
                : 'bg-black/40 border-white/10 text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>💬 TEXT CALLS</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${discordTextCallouts ? 'bg-[#5865F2] text-white' : 'bg-white/10 text-gray-400'}`}>
              {discordTextCallouts ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Voice Callouts Switch */}
          <button
            onClick={onToggleDiscordVoice}
            title={discordVoiceCallouts ? 'Click to turn OFF Discord voice channel TTS callouts' : 'Click to turn ON Discord voice channel TTS callouts'}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
              discordVoiceCallouts
                ? 'bg-cyan-500/20 border-cyan-500/60 text-white shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                : 'bg-black/40 border-white/10 text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>🎙️ VOICE CALLS</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${discordVoiceCallouts ? 'bg-cyan-500 text-black' : 'bg-white/10 text-gray-400'}`}>
              {discordVoiceCallouts ? 'ON' : 'OFF'}
            </span>
          </button>

          {onOpenDiscordSettings && (
            <button
              onClick={onOpenDiscordSettings}
              title="Open Discord Webhook Settings"
              className="text-[11px] font-mono text-gray-400 hover:text-cyan-400 underline underline-offset-2 ml-1"
            >
              [Settings]
            </button>
          )}
        </div>
      </div>

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
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (editName.trim()) onRenameStation(station.id, editName.trim());
                      setEditingStation(null);
                    }}
                    className="flex items-center gap-1"
                  >
                    <input
                      type="text"
                      value={editName}
                      autoFocus
                      onChange={(e) => setEditName(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      onBlur={() => {
                        if (editName.trim()) onRenameStation(station.id, editName.trim());
                        setEditingStation(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.stopPropagation();
                          setEditingStation(null);
                        }
                      }}
                      className="bg-black/60 border border-white/30 rounded px-1.5 py-0.5 text-sm tracking-wider focus:outline-none focus:border-cyan-400 w-32 sm:w-36"
                      style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--foreground)' }}
                    />
                    <button
                      type="submit"
                      onMouseDown={(e) => e.preventDefault()}
                      className="p-1 hover:text-emerald-400 text-slate-400 transition-colors"
                      title="Save name"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setEditingStation(null);
                      }}
                      className="p-1 hover:text-rose-400 text-slate-400 transition-colors"
                      title="Cancel"
                    >
                      <X size={13} />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setEditingStation(station.id); setEditName(station.name); }}
                    className="group/name flex items-center gap-1.5 text-left hover:opacity-90 focus:outline-none"
                    title="Click to rename station"
                  >
                    <span
                      className="text-sm tracking-wider group-hover/name:underline underline-offset-2"
                      style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: isLive ? (gameTheme?.primaryColor ?? theme.primaryColor) : 'var(--foreground)' }}
                    >
                      {station.name}
                    </span>
                    <Pencil size={11} className="opacity-40 group-hover/name:opacity-100 transition-opacity text-slate-400" />
                  </button>
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
                      onClick={() => { if (confirm('Remove this station?')) onRemoveStation(station.id); }}
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
                      onClick={() => { if (confirm('Remove this station?')) onRemoveStation(station.id); }}
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
