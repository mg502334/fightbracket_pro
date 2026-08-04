import { useState } from "react";
import { Swords, Clock, CheckCircle2, AlertCircle, ChevronRight, Search, X, Layers, Filter, Sparkles } from "lucide-react";
import { BracketType, type BracketMatch, type Player, type GameTheme, getChronologicalRoundName } from "../data/tournamentData";

interface BracketViewProps {
  matches: BracketMatch[];
  players: Player[];
  theme: GameTheme;
  onCallMatch: (match: BracketMatch) => void;
  onGenerateBracket?: (type: BracketType) => void;
  selectedPool?: string;
  onSelectPool?: (pool: string) => void;
  isImported?: boolean;
}

const STATE_CONFIG = {
  pending: { label: 'PENDING', color: 'var(--muted-foreground)', bg: 'var(--border)', icon: Clock },
  called: { label: 'CALLED', color: '#FFD600', bg: 'rgba(255,214,0,0.1)', icon: AlertCircle },
  in_progress: { label: 'LIVE', color: '#00FF88', bg: 'rgba(0,255,136,0.1)', icon: Swords },
  completed: { label: 'DONE', color: '#3A5A7A', bg: 'rgba(58,90,122,0.1)', icon: CheckCircle2 },
};

type Phase = 'ALL' | 'POOLS' | 'TOP_24' | 'TOP_8';

export function BracketView({
  matches,
  players,
  theme,
  onCallMatch,
  onGenerateBracket,
  selectedPool: externalSelectedPool,
  onSelectPool: externalOnSelectPool,
  isImported = false,
}: BracketViewProps) {
  const [hoveredMatchId, setHoveredMatchId] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<BracketType>(BracketType.SINGLE_ELIMINATION);
  const [internalPool, setInternalPool] = useState<string>('ALL');
  const [selectedPhase, setSelectedPhase] = useState<Phase>('ALL');
  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [filterMatchesOnly, setFilterMatchesOnly] = useState<boolean>(false);

  const selectedPool = externalSelectedPool !== undefined ? externalSelectedPool : internalPool;
  const setSelectedPool = (p: string) => {
    setInternalPool(p);
    externalOnSelectPool?.(p);
  };

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 opacity-80 mt-10">
        <Swords size={48} className="mb-4 opacity-30" style={{ color: theme.primaryColor }} />
        <h3 className="text-xl tracking-widest mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>BRACKET NOT GENERATED</h3>
        <p className="text-sm opacity-60 mb-6 text-center max-w-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {players.length === 0 ? "Add players first, then generate the bracket to begin the tournament." : `${players.length} players added. Ready to generate bracket.`}
        </p>
        {isImported ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono">
            <span>Pool configuration and bracket generation is locked for imported tournaments.</span>
          </div>
        ) : (
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
        )}
      </div>
    );
  }

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));

  // Extract unique pools if present
  const availablePools = Array.from(new Set(matches.map(m => m.pool).filter(Boolean))) as string[];
  availablePools.sort();

  // Filter matches by Phase & Pool & Search
  let processedMatches = matches;

  if (selectedPhase === 'POOLS') {
    processedMatches = processedMatches.filter(m => m.pool !== undefined || m.round <= 3);
  } else if (selectedPhase === 'TOP_24') {
    processedMatches = processedMatches.filter(m => Math.abs(m.round) >= 2 && Math.abs(m.round) <= 5);
  } else if (selectedPhase === 'TOP_8') {
    processedMatches = processedMatches.filter(m => Math.abs(m.round) >= 4 || m.roundName.toLowerCase().includes('final'));
  }

  if (selectedPool !== 'ALL') {
    processedMatches = processedMatches.filter(m => m.pool === selectedPool);
  }

  // Handle Player Search
  const query = playerSearch.trim().toLowerCase();
  const searchMatchingPlayerIds = new Set<string>();

  if (query) {
    players.forEach(p => {
      if (p.tag.toLowerCase().includes(query) || (p.realName && p.realName.toLowerCase().includes(query))) {
        searchMatchingPlayerIds.add(p.id);
      }
    });
  }

  const isMatchFoundBySearch = (m: BracketMatch) => {
    if (!query) return false;
    return (m.player1Id && searchMatchingPlayerIds.has(m.player1Id)) ||
           (m.player2Id && searchMatchingPlayerIds.has(m.player2Id));
  };

  const matchingMatchesCount = query
    ? processedMatches.filter(m => isMatchFoundBySearch(m)).length
    : 0;

  if (query && filterMatchesOnly) {
    processedMatches = processedMatches.filter(m => isMatchFoundBySearch(m));
  }

  // Categorize matches
  const losersMatches = processedMatches.filter(m => m.round < 0 || m.roundName.toLowerCase().includes('loser'));
  const grandFinalsMatches = processedMatches.filter(m => m.roundName.toLowerCase().includes('grand final'));
  const winnersMatches = processedMatches.filter(m => !losersMatches.includes(m) && !grandFinalsMatches.includes(m));

  return (
    <div className="overflow-auto pb-8 h-full space-y-6 p-4">
      {/* Start.gg Style Navigation & Search Controls Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border"
        style={{
          background: `linear-gradient(135deg, rgba(5,10,20,0.9) 0%, rgba(10,20,40,0.8) 100%)`,
          borderColor: `${theme.primaryColor}30`,
        }}
      >
        {/* Left: Phase & Pool Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Phase Selector */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/10">
            <Layers size={14} className="ml-2 opacity-50" style={{ color: theme.primaryColor }} />
            <span className="text-[10px] font-mono tracking-widest opacity-50 mr-1">PHASE:</span>
            {[
              { id: 'ALL', label: 'ALL PHASES' },
              { id: 'POOLS', label: 'POOLS' },
              { id: 'TOP_24', label: 'TOP 24' },
              { id: 'TOP_8', label: 'TOP 8' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPhase(p.id as Phase)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  selectedPhase === p.id
                    ? 'text-black'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  background: selectedPhase === p.id ? theme.primaryColor : 'transparent',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Pool Dropdown Selector */}
          {availablePools.length > 0 && (
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-xs font-mono font-bold opacity-60 tracking-wider">POOL:</span>
              <select
                value={selectedPool}
                onChange={e => setSelectedPool(e.target.value)}
                className="bg-transparent text-xs font-bold font-mono outline-none cursor-pointer"
                style={{ color: theme.primaryColor }}
              >
                <option value="ALL" className="bg-[#050A14] text-white">ALL POOLS ({availablePools.length})</option>
                {availablePools.map(pool => (
                  <option key={pool} value={pool} className="bg-[#050A14] text-white">
                    POOL {pool}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Player Search & Match Highlight Tool */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              type="text"
              placeholder="Search player in bracket..."
              value={playerSearch}
              onChange={e => setPlayerSearch(e.target.value)}
              className="w-full py-1.5 pl-9 pr-8 text-xs rounded-lg bg-black/50 border border-white/15 outline-none focus:border-cyan-400 transition-colors"
              style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}
            />
            {playerSearch && (
              <button
                onClick={() => setPlayerSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {query && (
            <button
              onClick={() => setFilterMatchesOnly(!filterMatchesOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                filterMatchesOnly
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/50'
                  : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
              }`}
            >
              <Filter size={12} />
              {filterMatchesOnly ? 'SHOW ALL' : 'FILTER MATCHES'}
            </button>
          )}

          {query && (
            <div className="text-[11px] font-mono px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              {matchingMatchesCount} {matchingMatchesCount === 1 ? 'match' : 'matches'}
            </div>
          )}
        </div>
      </div>

      {/* Bracket Sections */}
      <BracketSection 
        title="WINNERS BRACKET" 
        matches={winnersMatches} 
        playerMap={playerMap} 
        theme={theme} 
        hoveredMatchId={hoveredMatchId} 
        setHoveredMatchId={setHoveredMatchId} 
        onCallMatch={onCallMatch} 
        searchMatchingPlayerIds={searchMatchingPlayerIds}
        selectedPool={selectedPool}
      />
      <BracketSection 
        title="LOSERS BRACKET" 
        matches={losersMatches} 
        playerMap={playerMap} 
        theme={theme} 
        hoveredMatchId={hoveredMatchId} 
        setHoveredMatchId={setHoveredMatchId} 
        onCallMatch={onCallMatch} 
        searchMatchingPlayerIds={searchMatchingPlayerIds}
        selectedPool={selectedPool}
      />
      <BracketSection 
        title="GRAND FINALS" 
        matches={grandFinalsMatches} 
        playerMap={playerMap} 
        theme={theme} 
        hoveredMatchId={hoveredMatchId} 
        setHoveredMatchId={setHoveredMatchId} 
        onCallMatch={onCallMatch} 
        searchMatchingPlayerIds={searchMatchingPlayerIds}
        selectedPool={selectedPool}
      />
    </div>
  );
}

function BracketSection({ 
  title, matches, playerMap, theme, hoveredMatchId, setHoveredMatchId, onCallMatch, searchMatchingPlayerIds, selectedPool
}: { 
  title: string; 
  matches: BracketMatch[]; 
  playerMap: Record<string, Player>;
  theme: GameTheme;
  hoveredMatchId: string | null;
  setHoveredMatchId: (id: string | null) => void;
  onCallMatch: (match: BracketMatch) => void;
  searchMatchingPlayerIds: Set<string>;
  selectedPool?: string;
}) {
  if (matches.length === 0) return null;

  const isLosers = matches.some(m => m.round < 0 || m.roundName?.toLowerCase().includes('loser'));
  // Sort rounds chronologically: winners 1→N, losers by absolute value ascending (earliest first)
  // start.gg losers rounds use negative integers: -1 = Losers Round 1 (earliest), -2 = next, etc.
  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) =>
    isLosers ? Math.abs(a) - Math.abs(b) : a - b
  );

  return (
    <div>
      <div className="text-xl tracking-widest mb-6 border-b pb-2 flex items-center justify-between" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: theme.primaryColor, borderColor: `${theme.primaryColor}30` }}>
        <span>{title}</span>
        {selectedPool && selectedPool !== 'ALL' && (
          <span className="text-xs font-mono opacity-50 font-normal">POOL {selectedPool}</span>
        )}
      </div>
      <div className="flex gap-12 min-w-max pb-4 overflow-x-auto custom-scrollbar">
        {rounds.map((round, rIdx) => {
          let roundMatches = matches.filter(m => m.round === round);
          roundMatches.sort((a, b) => {
            const idA = a.identifier;
            const idB = b.identifier;
            // If both have identifiers (from start.gg), sort by them:
            // single-char comes before multi-char, then alphabetically.
            // This preserves start.gg's N→O→P→Q→W→X... ordering.
            if (idA && idB) {
              if (idA.length !== idB.length) return idA.length - idB.length;
              return idA.localeCompare(idB);
            }
            // Fall back to matchNumber (which is now the raw numeric start.gg set ID)
            return (a.matchNumber || 0) - (b.matchNumber || 0);
          });
          const isLast = rIdx === rounds.length - 1;
          const totalRounds = rounds.length;
          const isGrandFinals = title.includes("GRAND");
          
          let roundName = getChronologicalRoundName(rIdx, totalRounds, isLosers, isGrandFinals);
          if (roundMatches.length > 0 && roundMatches[0].roundName) {
            const mName = roundMatches[0].roundName;
            if (mName) {
              // Strip the [Pool X] prefix for a cleaner column label
              const cleanName = mName.replace(/^\[Pool [^\]]+\]\s*/i, '').trim();
              if (cleanName && !cleanName.startsWith('Round ')) {
                // Use the descriptive Start.gg name (e.g. "Winners Round 1", "Losers Semi-Final")
                roundName = cleanName;
              }
            }
          }

          return (
            <div key={round} className="flex flex-col min-w-[250px]">
              <div
                className="text-center text-xs tracking-widest truncate mb-6 font-bold"
                style={{ fontFamily: 'JetBrains Mono, monospace', color: theme.primaryColor, opacity: 0.85 }}
              >
                {roundName}
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

                  const matchesSearch = (p1 && searchMatchingPlayerIds.has(p1.id)) ||
                                       (p2 && searchMatchingPlayerIds.has(p2.id));

                  return (
                    <div key={match.id} className="relative w-full">
                      {/* Connection Line */}
                      {!isLast && (
                        <div 
                          className="absolute top-1/2 -right-6 h-px w-6" 
                          style={{ background: isLive || matchesSearch ? theme.primaryColor : 'rgba(122,158,192,0.2)' }} 
                        />
                      )}

                      {/* Start.gg Style Progression Destination Pill for Pool Finals */}
                      {isLast && selectedPool && selectedPool !== 'ALL' && (
                        <div className="absolute top-1/2 -right-28 -translate-y-1/2 flex flex-col gap-1 z-10 pointer-events-none">
                          <div className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg whitespace-nowrap">
                            <span>→</span> T8 Top 24 [W]
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap opacity-60">
                            <span>→</span> T8 Top 24 [L]
                          </div>
                        </div>
                      )}

                      <div
                        className={`rounded-lg overflow-hidden cursor-pointer transition-all duration-200 w-full ${
                          matchesSearch ? 'ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.4)] scale-[1.02]' : ''
                        }`}
                        style={{
                          background: isHovered ? `${theme.primaryColor}12` : cfg.bg,
                          border: `1px solid ${
                            matchesSearch ? theme.primaryColor : isLive ? theme.primaryColor : isHovered ? `${theme.primaryColor}40` : 'rgba(122,158,192,0.15)'
                          }`,
                          boxShadow: isLive ? `0 0 12px ${theme.glowColor}` : matchesSearch ? `0 0 20px ${theme.primaryColor}` : 'none',
                        }}
                        onMouseEnter={() => setHoveredMatchId(match.id)}
                        onMouseLeave={() => setHoveredMatchId(null)}
                        onClick={() => canCall && onCallMatch(match)}
                      >
                        <div
                          className="flex items-center justify-between px-2.5 py-1"
                          style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(122,158,192,0.1)' }}
                        >
                          <span className="text-xs opacity-60 flex items-center gap-1" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                            {match.pool && (
                              <span className="px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold mr-1">
                                POOL {match.pool}
                              </span>
                            )}
                            {match.identifier ? `MATCH ${match.identifier} · ` : ''}BO{match.bestOf} {match.stationId ? `· STN ${match.stationId}` : ''}
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
                          isSearched={Boolean(p1 && searchMatchingPlayerIds.has(p1.id))}
                        />
                        <div className="h-px" style={{ background: 'var(--border)' }} />
                        <PlayerSlot
                          player={p2}
                          score={match.player2Score}
                          isWinner={match.winnerId === match.player2Id}
                          isCompleted={match.state === 'completed'}
                          theme={theme}
                          isSearched={Boolean(p2 && searchMatchingPlayerIds.has(p2.id))}
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
                        {match.streamUrl && (() => {
                          const isTwitch = match.streamUrl.includes('twitch.tv');
                          const isYouTube = match.streamUrl.includes('youtube.com') || match.streamUrl.includes('youtu.be');
                          const isTikTok = match.streamUrl.includes('tiktok.com');
                          
                          const platformName = isTwitch ? 'TWITCH' : isYouTube ? 'YOUTUBE' : isTikTok ? 'TIKTOK' : 'STREAM';
                          const platformColor = isTwitch ? '#6441a5' : isYouTube ? '#FF0000' : isTikTok ? '#00f2fe' : theme.primaryColor;
                          
                          const buttonText = match.state === 'completed' 
                            ? `WAS ON ${platformName}` 
                            : match.state === 'pending'
                              ? `SCHEDULED ON ${platformName}`
                              : `WATCH LIVE ON ${platformName}`;

                          return (
                            <a
                              href={match.streamUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1 py-1.5 text-xs tracking-widest mt-px hover:brightness-125 transition-all"
                              style={{
                                background: platformColor,
                                color: isTikTok ? '#000000' : 'white',
                                fontFamily: 'JetBrains Mono, monospace',
                                fontWeight: 700,
                                textDecoration: 'none',
                                opacity: match.state === 'completed' ? 0.6 : 1
                              }}
                            >
                              {buttonText}
                            </a>
                          );
                        })()}
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
  isSearched,
}: {
  player: Player | null;
  score: number;
  isWinner: boolean;
  isCompleted: boolean;
  theme: GameTheme;
  isSearched?: boolean;
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
      className={`flex items-center justify-between px-3 py-2 transition-colors ${
        isSearched ? 'bg-cyan-500/15' : ''
      }`}
      style={{ opacity: isCompleted && !isWinner ? 0.4 : 1 }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs opacity-40 tabular-nums w-4 shrink-0" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
          {player.seed}
        </span>
        <span
          className="text-sm truncate flex items-center gap-1"
          style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: isWinner || isSearched ? 700 : 500,
            color: isSearched ? '#00FF88' : isWinner ? theme.primaryColor : 'var(--foreground)',
          }}
        >
          {player.countryFlag} {player.tag}
          {isSearched && <Sparkles size={10} className="text-cyan-400 animate-pulse" />}
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
