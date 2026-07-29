import { useState } from "react";
import { Bell, Trophy, Swords, MapPin, CheckCircle2, Clock, Search, ChevronRight, Wifi, Battery, Signal } from "lucide-react";
import type { Player, BracketMatch, GameTheme } from "../data/tournamentData";
import { GAME_THEMES } from "../data/tournamentData";

interface MobileCompanionProps {
  players: Player[];
  matches: BracketMatch[];
  theme: GameTheme;
}

type MobileView = 'home' | 'bracket' | 'notifications';

export function MobileCompanion({ players, matches, theme }: MobileCompanionProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id ?? '');
  const [mobileView, setMobileView] = useState<MobileView>('home');
  const [searchQuery, setSearchQuery] = useState('');

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));
  const selectedPlayer = playerMap[selectedPlayerId];

  const playerMatches = matches.filter(m =>
    m.player1Id === selectedPlayerId || m.player2Id === selectedPlayerId
  );

  const currentMatch = playerMatches.find(m => m.state === 'in_progress' || m.state === 'called');
  const nextMatch = playerMatches.find(m => m.state === 'pending' && m.player1Id && m.player2Id);

  const filteredPlayers = players.filter(p =>
    p.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.realName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex gap-6 items-start">
      {/* Player selector (desktop side) */}
      <div className="w-60 shrink-0 rounded overflow-hidden" style={{ background: 'var(--card)', border: '1px solid rgba(122,158,192,0.12)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--sidebar)' }}>
          <div className="text-xs tracking-widest mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)' }}>PREVIEW AS PLAYER</div>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full px-2.5 py-1.5 rounded text-sm outline-none"
            style={{ background: 'var(--background)', border: '1px solid rgba(122,158,192,0.1)', color: 'var(--foreground)', fontFamily: 'Inter, sans-serif' }}
          />
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 500 }}>
          {filteredPlayers.map(player => {
            const gameTheme = GAME_THEMES[player.gameId];
            const isSelected = player.id === selectedPlayerId;
            return (
              <button
                key={player.id}
                onClick={() => setSelectedPlayerId(player.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                style={{
                  background: isSelected ? `${theme.primaryColor}12` : 'transparent',
                  borderBottom: '1px solid rgba(122,158,192,0.06)',
                  borderLeft: isSelected ? `2px solid ${theme.primaryColor}` : '2px solid transparent',
                }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: gameTheme.primaryColor }}
                />
                <div className="min-w-0">
                  <div className="text-sm truncate" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: isSelected ? theme.primaryColor : 'var(--foreground)' }}>
                    {player.tag}
                  </div>
                  <div className="text-xs opacity-40 truncate" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>
                    {gameTheme.shortName} · #{player.seed}
                  </div>
                </div>
                {isSelected && <ChevronRight size={12} style={{ color: theme.primaryColor, shrink: 0, marginLeft: 'auto' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Phone frame */}
      <div className="flex-1 flex justify-center">
        <div
          className="relative"
          style={{
            width: 360,
            height: 720,
            background: 'var(--background)',
            borderRadius: 40,
            border: '2px solid rgba(255,255,255,0.08)',
            boxShadow: `0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), inset 0 0 0 1px rgba(0,0,0,0.5)`,
            overflow: 'hidden',
          }}
        >
          {/* Notch */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
            style={{ width: 120, height: 28, background: 'var(--background)', borderRadius: '0 0 18px 18px' }}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--muted)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-8 pb-2">
            <span className="text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)', opacity: 0.8, fontSize: 11 }}>9:41</span>
            <div className="flex items-center gap-1.5 opacity-70">
              <Signal size={12} color="#E8F4F8" />
              <Wifi size={12} color="#E8F4F8" />
              <Battery size={12} color="#E8F4F8" />
            </div>
          </div>

          {/* App content */}
          <div className="px-5 flex flex-col h-full pb-20" style={{ overflowY: 'auto' }}>
            {/* Header */}
            <div className="mb-4">
              <div className="text-xs opacity-40 tracking-widest mb-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>
                CLASH OF KINGS VII
              </div>
              <div className="text-lg" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--foreground)' }}>
                {selectedPlayer?.countryFlag} {selectedPlayer?.tag}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: selectedPlayer?.checkedIn ? 'rgba(0,255,136,0.1)' : 'rgba(255,23,68,0.1)',
                    color: selectedPlayer?.checkedIn ? '#00FF88' : '#FF1744',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 9,
                  }}
                >
                  {selectedPlayer?.checkedIn ? '✓ CHECKED IN' : '✗ NOT CHECKED IN'}
                </span>
                {selectedPlayer && (
                  <span className="text-xs opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>
                    {GAME_THEMES[selectedPlayer.gameId].shortName} · #{selectedPlayer.seed}
                  </span>
                )}
              </div>
            </div>

            {/* Current match alert */}
            {currentMatch && (
              <MobileMatchCard match={currentMatch} players={playerMap} currentPlayerId={selectedPlayerId} isActive />
            )}

            {/* Next match */}
            {nextMatch && !currentMatch && (
              <div className="mb-4">
                <div className="text-xs opacity-40 mb-2 tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>NEXT MATCH</div>
                <MobileMatchCard match={nextMatch} players={playerMap} currentPlayerId={selectedPlayerId} />
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <MiniStat label="WINS" value={playerMatches.filter(m => m.winnerId === selectedPlayerId).length} color="#00FF88" />
              <MiniStat label="LOSSES" value={playerMatches.filter(m => m.state === 'completed' && m.winnerId && m.winnerId !== selectedPlayerId).length} color="#FF1744" />
            </div>

            {/* Match history */}
            <div>
              <div className="text-xs opacity-40 mb-2 tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>MATCH HISTORY</div>
              <div className="flex flex-col gap-1.5">
                {playerMatches.map(m => {
                  const oppId = m.player1Id === selectedPlayerId ? m.player2Id : m.player1Id;
                  const opp = oppId ? playerMap[oppId] : null;
                  const won = m.winnerId === selectedPlayerId;
                  const completed = m.state === 'completed';
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between px-3 py-2 rounded"
                      style={{
                        background: 'var(--border)',
                        border: `1px solid ${completed ? (won ? 'rgba(0,255,136,0.15)' : 'rgba(255,23,68,0.15)') : 'var(--border)'}`,
                      }}
                    >
                      <div>
                        <div className="text-xs" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--foreground)', fontSize: 12 }}>
                          vs {opp?.tag ?? 'TBD'}
                        </div>
                        <div className="text-xs opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>
                          {m.roundName}
                        </div>
                      </div>
                      <div className="text-right">
                        {completed ? (
                          <div className="text-xs" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: won ? '#00FF88' : '#FF1744' }}>
                            {won ? 'WIN' : 'LOSS'}
                          </div>
                        ) : (
                          <Clock size={12} className="opacity-30" />
                        )}
                        {(m.player1Score > 0 || m.player2Score > 0) && (
                          <div className="text-xs opacity-50" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>
                            {m.player1Id === selectedPlayerId ? m.player1Score : m.player2Score}-{m.player1Id === selectedPlayerId ? m.player2Score : m.player1Score}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom nav */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-3 px-4"
            style={{
              background: 'rgba(10, 10, 15, 0.95)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {[
              { icon: Trophy, label: 'Bracket', view: 'bracket' as MobileView },
              { icon: Swords, label: 'Matches', view: 'home' as MobileView },
              { icon: Bell, label: 'Alerts', view: 'notifications' as MobileView },
            ].map(item => {
              const Icon = item.icon;
              const active = mobileView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => setMobileView(item.view)}
                  className="flex flex-col items-center gap-1 transition-all"
                >
                  <Icon size={20} style={{ color: active ? theme.primaryColor : 'rgba(122,158,192,0.5)' }} />
                  <span className="text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: active ? theme.primaryColor : 'rgba(122,158,192,0.4)' }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Home indicator */}
          <div
            className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full"
            style={{ width: 100, height: 4, background: 'rgba(255,255,255,0.15)' }}
          />
        </div>
      </div>
    </div>
  );
}

function MobileMatchCard({ match, players, currentPlayerId, isActive }: {
  match: BracketMatch;
  players: Record<string, Player>;
  currentPlayerId: string;
  isActive?: boolean;
}) {
  const p1 = match.player1Id ? players[match.player1Id] : null;
  const p2 = match.player2Id ? players[match.player2Id] : null;
  const oppId = match.player1Id === currentPlayerId ? match.player2Id : match.player1Id;
  const opp = oppId ? players[oppId] : null;
  const gameTheme = GAME_THEMES[match.gameId];

  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{
        background: isActive ? `linear-gradient(135deg, ${gameTheme.primaryColor}20, ${gameTheme.primaryColor}05)` : 'var(--border)',
        border: `1px solid ${isActive ? `${gameTheme.primaryColor}50` : 'var(--border)'}`,
        boxShadow: isActive ? `0 0 20px ${gameTheme.glowColor}` : 'none',
      }}
    >
      {isActive && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: gameTheme.primaryColor }} />
          <span className="text-xs tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: gameTheme.primaryColor }}>
            MATCH CALLED — STATION {match.stationId}
          </span>
        </div>
      )}
      <div className="text-xs opacity-40 mb-1 tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>
        {match.roundName} · BO{match.bestOf}
      </div>
      <div className="text-sm" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--foreground)' }}>
        vs {opp?.tag ?? 'TBD'}
      </div>
      {opp && (
        <div className="text-xs opacity-50 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
          {opp.countryFlag} {opp.character}
        </div>
      )}
      {isActive && match.stationId && (
        <div
          className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded"
          style={{ background: `${gameTheme.primaryColor}15`, border: `1px solid ${gameTheme.primaryColor}30` }}
        >
          <MapPin size={12} style={{ color: gameTheme.primaryColor }} />
          <span className="text-sm" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: gameTheme.primaryColor }}>
            Report to Station {match.stationId}
          </span>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg px-3 py-2.5" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <div className="text-xs opacity-40 mb-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>{label}</div>
      <div className="text-2xl" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
