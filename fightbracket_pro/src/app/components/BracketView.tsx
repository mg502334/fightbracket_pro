import { useState } from "react";
import { Swords, Clock, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { BracketType, type BracketMatch, type Player, type GameTheme } from "../data/tournamentData";

interface BracketViewProps {
  matches: BracketMatch[];
  players: Player[];
  theme: GameTheme;
  onCallMatch: (match: BracketMatch) => void;
  onGenerateBracket?: (type: BracketType) => void;
}

const STATE_CONFIG = {
  pending: { label: 'PENDING', color: 'var(--muted-foreground)', bg: 'var(--border)', icon: Clock },
  called: { label: 'CALLED', color: '#FFD600', bg: 'rgba(255,214,0,0.1)', icon: AlertCircle },
  in_progress: { label: 'LIVE', color: '#00FF88', bg: 'rgba(0,255,136,0.1)', icon: Swords },
  completed: { label: 'DONE', color: '#3A5A7A', bg: 'rgba(58,90,122,0.1)', icon: CheckCircle2 },
};

export function BracketView({ matches, players, theme, onCallMatch, onGenerateBracket }: BracketViewProps) {
  const [hoveredMatchId, setHoveredMatchId] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<BracketType>(BracketType.SINGLE_ELIMINATION);

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 opacity-80 mt-10">
        <Swords size={48} className="mb-4 opacity-30" style={{ color: theme.primaryColor }} />
        <h3 className="text-xl tracking-widest mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>BRACKET NOT GENERATED</h3>
        <p className="text-sm opacity-60 mb-6 text-center max-w-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {players.length === 0 ? "Add players first, then generate the bracket to begin the tournament." : `${players.length} players added. Ready to generate bracket.`}
        </p>
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <select 
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as BracketType)}
            className="w-full bg-black/40 border rounded px-3 py-2.5 text-sm focus:outline-none transition-colors"
            style={{ borderColor: 'rgba(122,158,192,0.3)', fontFamily: 'JetBrains Mono, monospace' }}
            disabled={players.length === 0}
          >
            {Object.values(BracketType).map(format => (
              <option key={format} value={format}>{format.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <button 
            disabled={players.length === 0}
            onClick={() => onGenerateBracket?.(selectedFormat)} 
            className="w-full px-6 py-2.5 rounded text-sm tracking-widest font-bold text-black hover:brightness-125 transition-all disabled:opacity-30 disabled:cursor-not-allowed" 
            style={{ background: theme.primaryColor, fontFamily: 'Rajdhani, sans-serif' }}
          >
            GENERATE BRACKET
          </button>
        </div>
      </div>
    );
  }

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));

  // Categorize matches
  const winnersMatches = matches.filter(m => m.round > 0 && !m.roundName.toLowerCase().includes('grand final'));
  const losersMatches = matches.filter(m => m.round < 0 || m.roundName.toLowerCase().includes('loser'));
  const grandFinalsMatches = matches.filter(m => m.round > 0 && m.roundName.toLowerCase().includes('grand final'));

  return (
    <div className="overflow-auto pb-8 h-full space-y-16 p-4">
      <BracketSection 
        title="WINNERS BRACKET" 
        matches={winnersMatches} 
        playerMap={playerMap} 
        theme={theme} 
        hoveredMatchId={hoveredMatchId} 
        setHoveredMatchId={setHoveredMatchId} 
        onCallMatch={onCallMatch} 
      />
      <BracketSection 
        title="LOSERS BRACKET" 
        matches={losersMatches} 
        playerMap={playerMap} 
        theme={theme} 
        hoveredMatchId={hoveredMatchId} 
        setHoveredMatchId={setHoveredMatchId} 
        onCallMatch={onCallMatch} 
      />
      <BracketSection 
        title="GRAND FINALS" 
        matches={grandFinalsMatches} 
        playerMap={playerMap} 
        theme={theme} 
        hoveredMatchId={hoveredMatchId} 
        setHoveredMatchId={setHoveredMatchId} 
        onCallMatch={onCallMatch} 
      />
    </div>
  );
}

function BracketSection({ 
  title, matches, playerMap, theme, hoveredMatchId, setHoveredMatchId, onCallMatch 
}: { 
  title: string; 
  matches: BracketMatch[]; 
  playerMap: Record<string, Player>;
  theme: GameTheme;
  hoveredMatchId: string | null;
  setHoveredMatchId: (id: string | null) => void;
  onCallMatch: (match: BracketMatch) => void;
}) {
  if (matches.length === 0) return null;

  // Sort rounds. For losers, rounds are usually negative (-1, -2, -3), we want them to render left-to-right from largest negative to closest to 0.
  // Start.gg uses -1 for Losers Round 1. Wait, -1 is Losers R1. So we want to sort ascending.
  // Actually, sometimes it's sorted 1, 2, 3. So just sort by absolute value if negative?
  // Start.gg Losers bracket rounds: Losers R1 is -1. Losers R2 is -2. Wait, actually, Start.gg rounds for losers go -1, -2, -3...
  // Wait, if Losers R1 is -1 and Losers R2 is -2, then sorting mathematically puts -8 before -1. 
  // Let's sort based on the string name or just round number. Start.gg usually means smaller absolute value is earlier, wait!
  // Start.gg assigns Losers R1 = -1. Losers R2 = -2.
  // We want to render -1, then -2, then -3. So we should sort by absolute value, or descending for negative numbers.
  const isLosers = matches[0]?.round < 0;
  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => isLosers ? b - a : a - b);

  return (
    <div>
      <div className="text-xl tracking-widest mb-6 border-b pb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: theme.primaryColor, borderColor: `${theme.primaryColor}30` }}>
        {title}
      </div>
      <div className="flex gap-12 min-w-max">
        {rounds.map((round, rIdx) => {
          const roundMatches = matches.filter(m => m.round === round);
          const isLast = rIdx === rounds.length - 1;

          return (
            <div key={round} className="flex flex-col min-w-[240px]">
              <div
                className="text-center text-xs tracking-widest truncate mb-6"
                style={{ fontFamily: 'JetBrains Mono, monospace', color: theme.primaryColor, opacity: 0.7 }}
              >
                {roundMatches[0]?.roundName}
              </div>
              <div className="flex flex-col justify-around flex-1 gap-6 relative">
                {roundMatches.map(match => {
                  const p1 = match.player1Id ? playerMap[match.player1Id] : null;
                  const p2 = match.player2Id ? playerMap[match.player2Id] : null;
                  const cfg = STATE_CONFIG[match.state];
                  const Icon = cfg.icon;
                  const isHovered = hoveredMatchId === match.id;
                  const canCall = match.state === 'pending' && p1 && p2;
                  const isLive = match.state === 'in_progress' || match.state === 'called';

                  return (
                    <div key={match.id} className="relative w-full">
                      {/* Connection Line */}
                      {!isLast && (
                        <div 
                          className="absolute top-1/2 -right-6 h-px w-6" 
                          style={{ background: isLive ? theme.primaryColor : 'rgba(122,158,192,0.2)' }} 
                        />
                      )}
                      <div
                        className="rounded overflow-hidden cursor-pointer transition-all duration-150 w-full"
                        style={{
                          background: isHovered ? `${theme.primaryColor}12` : cfg.bg,
                          border: `1px solid ${isLive ? theme.primaryColor : isHovered ? `${theme.primaryColor}40` : 'rgba(122,158,192,0.15)'}`,
                          boxShadow: isLive ? `0 0 12px ${theme.glowColor}` : 'none',
                        }}
                        onMouseEnter={() => setHoveredMatchId(match.id)}
                        onMouseLeave={() => setHoveredMatchId(null)}
                        onClick={() => canCall && onCallMatch(match)}
                      >
                        <div
                          className="flex items-center justify-between px-2 py-1"
                          style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(122,158,192,0.1)' }}
                        >
                          <span className="text-xs opacity-50" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                            BO{match.bestOf} {match.stationId ? `· STN ${match.stationId}` : ''}
                          </span>
                          <div className="flex items-center gap-1">
                            <Icon size={10} style={{ color: cfg.color }} />
                            <span className="text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: cfg.color }}>
                              {cfg.label}
                            </span>
                          </div>
                        </div>

                        <PlayerSlot
                          player={p1}
                          score={match.player1Score}
                          isWinner={match.winnerId === match.player1Id}
                          isCompleted={match.state === 'completed'}
                          theme={theme}
                        />
                        <div className="h-px" style={{ background: 'var(--border)' }} />
                        <PlayerSlot
                          player={p2}
                          score={match.player2Score}
                          isWinner={match.winnerId === match.player2Id}
                          isCompleted={match.state === 'completed'}
                          theme={theme}
                        />

                        {canCall && isHovered && (
                          <div
                            className="flex items-center justify-center gap-1 py-1.5 text-xs tracking-widest cursor-pointer hover:bg-black/20"
                            onClick={(e) => { e.stopPropagation(); onCallMatch(match); }}
                            style={{
                              background: `${theme.primaryColor}20`,
                              color: theme.primaryColor,
                              fontFamily: 'JetBrains Mono, monospace',
                              fontWeight: 700
                            }}
                          >
                            <ChevronRight size={12} />
                            CALL MATCH
                          </div>
                        )}
                        {match.streamUrl && (
                          <a
                            href={match.streamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1 py-1.5 text-xs tracking-widest mt-px hover:opacity-80 transition-opacity"
                            style={{
                              background: `#6441a5`,
                              color: 'white',
                              fontFamily: 'JetBrains Mono, monospace',
                              fontWeight: 700,
                              textDecoration: 'none'
                            }}
                          >
                            WATCH LIVE
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlayerSlot({
  player,
  score,
  isWinner,
  isCompleted,
  theme,
}: {
  player: Player | null;
  score: number;
  isWinner: boolean;
  isCompleted: boolean;
  theme: GameTheme;
}) {
  if (!player) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-xs opacity-20 italic" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>TBD</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between px-3 py-2"
      style={{ opacity: isCompleted && !isWinner ? 0.4 : 1 }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs opacity-40 tabular-nums w-4 shrink-0" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
          {player.seed}
        </span>
        <span className="text-sm truncate" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: isWinner ? 700 : 500, color: isWinner ? theme.primaryColor : 'var(--foreground)' }}>
          {player.countryFlag} {player.tag}
        </span>
      </div>
      <span
        className="text-sm tabular-nums ml-2 shrink-0"
        style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: isWinner ? theme.primaryColor : score > 0 ? 'var(--foreground)' : 'rgba(122,158,192,0.4)' }}
      >
        {score}
      </span>
    </div>
  );
}
