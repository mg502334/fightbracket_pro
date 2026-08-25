import { useState } from "react";
import { Swords, Clock, CheckCircle2, AlertCircle, ChevronRight, Search, X, Layers, Filter, Sparkles, Tv, RefreshCw, Monitor, Smartphone, Radio } from "lucide-react";
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
  onPlayerClick?: (playerId: string) => void;
  onManualSync?: () => void;
  lastSyncedAt?: Date | null;
  isSyncing?: boolean;
  autoSyncSlug?: string | null;
}

const STATE_CONFIG = {
  pending: { label: 'PENDING', color: 'var(--muted-foreground)', bg: 'var(--border)', icon: Clock },
  called: { label: 'CALLED', color: '#FFD600', bg: 'rgba(255,214,0,0.1)', icon: AlertCircle },
  in_progress: { label: 'LIVE', color: '#00FF88', bg: 'rgba(0,255,136,0.1)', icon: Swords },
  completed: { label: 'DONE', color: '#3A5A7A', bg: 'rgba(58,90,122,0.1)', icon: CheckCircle2 },
};

export function getTop8Standings(matches: BracketMatch[], players: Player[]): { placement: number; player: Player }[] {
  const playerMap = new Map(players.map(p => [p.id, p]));

  // 1. If explicit placements exist from Start.gg or manual assignments, use them
  const explicitPlacements = players
    .filter(p => p.placement !== undefined && p.placement >= 1 && p.placement <= 8)
    .sort((a, b) => (a.placement || 99) - (b.placement || 99));

  if (explicitPlacements.length > 0) {
    return explicitPlacements.map(p => ({ placement: p.placement!, player: p }));
  }

  // 2. Derive standings from match outcomes
  const completedMatches = matches.filter(m => m.state === 'completed' && m.winnerId);
  if (completedMatches.length === 0) return [];

  const getLoser = (m: BracketMatch): Player | null => {
    if (!m.winnerId) return null;
    const loserId = m.winnerId === m.player1Id ? m.player2Id : m.player1Id;
    return loserId ? playerMap.get(loserId) || null : null;
  };

  const getWinner = (m: BracketMatch): Player | null => {
    return m.winnerId ? playerMap.get(m.winnerId) || null : null;
  };

  const standings: { placement: number; player: Player }[] = [];
  const processedPlayerIds = new Set<string>();

  const addStanding = (placement: number, player: Player | null) => {
    if (!player || processedPlayerIds.has(player.id)) return;
    processedPlayerIds.add(player.id);
    standings.push({ placement, player });
  };

  // Grand Finals (Check for Reset match first)
  const gfReset = completedMatches.find(m => m.roundName?.toLowerCase().includes('grand final reset'));
  const gfMain = completedMatches.find(
    m => m.roundName?.toLowerCase().includes('grand final') && !m.roundName?.toLowerCase().includes('reset')
  );
  const gfMatch = gfReset || gfMain;

  if (gfMatch) {
    addStanding(1, getWinner(gfMatch));
    addStanding(2, getLoser(gfMatch));
  }

  // Group losers bracket matches by absolute round number descending
  const losersMatches = completedMatches.filter(
    m => m.round < 0 || m.roundName?.toLowerCase().includes('loser')
  );

  const losersRoundsMap = new Map<number, BracketMatch[]>();
  losersMatches.forEach(m => {
    const absRound = Math.abs(m.round);
    if (!losersRoundsMap.has(absRound)) losersRoundsMap.set(absRound, []);
    losersRoundsMap.get(absRound)!.push(m);
  });

  const sortedLoserRounds = Array.from(losersRoundsMap.keys()).sort((a, b) => b - a);

  // Round 1 (highest abs round, e.g. Losers Final) -> 3rd Place
  if (sortedLoserRounds.length > 0) {
    const matchesInRound = losersRoundsMap.get(sortedLoserRounds[0]) || [];
    matchesInRound.forEach(m => addStanding(3, getLoser(m)));
  }

  // Round 2 (e.g. Losers Semi) -> 4th Place
  if (sortedLoserRounds.length > 1) {
    const matchesInRound = losersRoundsMap.get(sortedLoserRounds[1]) || [];
    matchesInRound.forEach(m => addStanding(4, getLoser(m)));
  }

  // Round 3 (e.g. Losers Quarter) -> 5th Place
  if (sortedLoserRounds.length > 2) {
    const matchesInRound = losersRoundsMap.get(sortedLoserRounds[2]) || [];
    matchesInRound.forEach(m => addStanding(5, getLoser(m)));
  }

  // Round 4 (e.g. Losers Round 3) -> 7th Place
  if (sortedLoserRounds.length > 3) {
    const matchesInRound = losersRoundsMap.get(sortedLoserRounds[3]) || [];
    matchesInRound.forEach(m => addStanding(7, getLoser(m)));
  }

  return standings;
}

export function BracketView({
  matches,
  players,
  theme,
  onCallMatch,
  onGenerateBracket,
  selectedPool: externalSelectedPool,
  onSelectPool: externalOnSelectPool,
  isImported = false,
  onPlayerClick,
  onManualSync,
  lastSyncedAt,
  isSyncing,
  autoSyncSlug,
}: BracketViewProps) {
  const [hoveredMatchId, setHoveredMatchId] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<BracketType>(BracketType.SINGLE_ELIMINATION);
  const [internalPool, setInternalPool] = useState<string>('DEFAULT');
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');
  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [filterMatchesOnly, setFilterMatchesOnly] = useState<boolean>(false);
  const [shareTooltip, setShareTooltip] = useState(false);
  const [showDisplayMenu, setShowDisplayMenu] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);

  const playerSuggestions = playerSearch.trim()
    ? players.filter(p => p.tag.toLowerCase().includes(playerSearch.toLowerCase().trim())).slice(0, 6)
    : [];

  const handleSelectPlayer = (pTag: string) => {
    setPlayerSearch(pTag);
    setShowSuggestions(false);
    setSuggestionIndex(-1);
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

  // Extract unique phases
  const availablePhases = Array.from(new Set(matches.map(m => m.phase).filter(Boolean))) as string[];
  const activePhase = selectedPhase;

  // Extract unique pools based ONLY on the active phase
  const availablePools = Array.from(new Set(matches.filter(m => activePhase === 'ALL' || m.phase === activePhase).map(m => m.pool).filter(Boolean))) as string[];
  availablePools.sort();

  // Determine active pool: default to ALL pools to show the entire bracket structure by default
  let activePool = externalSelectedPool !== undefined ? externalSelectedPool : internalPool;
  if (activePool === 'DEFAULT') {
    activePool = 'ALL';
  } else if (activePool !== 'ALL' && !availablePools.includes(activePool)) {
    activePool = 'ALL';
  }

  const setSelectedPool = (p: string) => {
    setInternalPool(p);
    externalOnSelectPool?.(p);
  };

  const handleShareToDiscord = () => {
    // Build a nicely formatted Discord message
    const totalMatches = matches.length;
    const completedMatches = matches.filter(m => m.state === 'completed').length;
    const calledMatches = matches.filter(m => m.state === 'called' || m.state === 'in_progress').length;
    const progressPct = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
    const isCompleted = totalMatches > 0 && completedMatches === totalMatches;

    const lines: string[] = [
      isCompleted ? `**TOURNAMENT RESULTS**` : `**LIVE BRACKET UPDATE**`,
      ``,
      `📊 **Progress:** **${completedMatches}/${totalMatches}** matches complete (${progressPct}%)`,
    ];

    if (calledMatches > 0 && !isCompleted) {
      lines.push(`🎮 **Active:** **${calledMatches}** match${calledMatches === 1 ? '' : 'es'} in progress`);
    }

    const top8 = getTop8Standings(matches, players);

    // When completed (or if top 8 results exist), show Top 8 Standings from 1st place to 8th player
    if (top8.length > 0 && (isCompleted || top8.length >= 8)) {
      lines.push(``);
      lines.push(`🏆 **Top 8 Standings:**`);
      top8.forEach(({ placement, player }) => {
        const medal = placement === 1 ? '🥇 ' : placement === 2 ? '🥈 ' : placement === 3 ? '🥉 ' : '';
        const flag = player.countryFlag ? `${player.countryFlag} ` : '';
        const suffix = placement === 1 ? 'st' : placement === 2 ? 'nd' : placement === 3 ? 'rd' : 'th';
        lines.push(`> ${medal}**${placement}${suffix}**: ${flag}**${player.tag}**`);
      });
    }

    // Top 3 completed matches with results for live updates
    const recent = matches
      .filter(m => m.state === 'completed' && m.winnerId)
      .slice(-3)
      .reverse();

    if (recent.length > 0 && (!isCompleted || top8.length === 0)) {
      lines.push(``);
      lines.push(`📋 **Recent Results:**`);
      recent.forEach(m => {
        const winnerPlayer = players.find(p => p.id === m.winnerId);
        const p1 = players.find(p => p.id === m.player1Id);
        const p2 = players.find(p => p.id === m.player2Id);
        if (winnerPlayer && p1 && p2) {
          const loser = winnerPlayer.id === p1.id ? p2 : p1;
          lines.push(`> ✅ **${winnerPlayer.tag}** def. ${loser.tag} — ${m.roundName}`);
        }
      });
    }

    lines.push(``);
    lines.push(`🔗 <${window.location.href}>`);

    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setShareTooltip(true);
      setTimeout(() => setShareTooltip(false), 2500);
    }).catch(() => {
      // fallback: show the text in a prompt
      window.prompt('Copy this to Discord:', text);
    });
  };

  // Filter matches by Phase & Search
  let processedMatches = matches.map(m => ({ ...m }));
  if (activePhase !== 'ALL') {
    processedMatches = processedMatches.filter(m => m.phase === activePhase);
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

  // If a single pool is selected, filter to that pool
  const singlePoolMatches = activePool !== 'ALL'
    ? processedMatches.filter(m => m.pool === activePool)
    : processedMatches;

  const losersMatches = singlePoolMatches.filter(m => m.round < 0 || m.roundName.toLowerCase().includes('loser'));
  const grandFinalsMatches = singlePoolMatches.filter(m => m.roundName.toLowerCase().includes('grand final'));
  const winnersMatches = singlePoolMatches.filter(m => !losersMatches.includes(m) && !grandFinalsMatches.includes(m));

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
          {availablePhases.length > 0 && (
            <div className="flex items-center gap-1.5 bg-black/40 px-3 rounded-lg border border-white/10 h-10 shrink-0">
              <Layers size={14} className="opacity-50" style={{ color: theme.primaryColor }} />
              <span className="text-[10px] font-mono font-bold tracking-widest opacity-50 mr-1 uppercase">PHASE:</span>
              
              {availablePhases.length > 1 && (
                <button
                  onClick={() => setSelectedPhase('ALL')}
                  className={`h-7 px-2.5 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all ${
                    activePhase === 'ALL'
                      ? 'text-black'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  style={{
                    background: activePhase === 'ALL' ? theme.primaryColor : 'transparent',
                  }}
                >
                  ALL PHASES
                </button>
              )}

              {availablePhases.map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPhase(p)}
                  className={`h-7 px-2.5 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all ${
                    activePhase === p
                      ? 'text-black'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  style={{
                    background: activePhase === p ? theme.primaryColor : 'transparent',
                  }}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {/* Pool Dropdown Selector */}
          {availablePools.length > 0 && (
            <div className="flex items-center gap-2 bg-black/40 px-3 rounded-lg border border-white/10 h-10 shrink-0">
              <span className="text-[10px] font-mono font-bold tracking-widest opacity-50 mr-1 uppercase">POOL:</span>
              <select
                value={activePool}
                onChange={(e) => setSelectedPool(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-md px-2 h-7 text-xs font-mono font-bold uppercase tracking-wider focus:outline-none transition-colors hover:border-white/20"
                style={{ color: theme.primaryColor }}
              >
                {availablePools.map(pool => (
                  <option key={pool} value={pool} className="bg-[#050A14] text-white">
                    POOL {pool}
                  </option>
                ))}
                {availablePools.length > 1 && (
                  <option value="ALL" className="bg-[#050A14] text-white">
                    ALL POOLS ({availablePools.length})
                  </option>
                )}
              </select>
            </div>
          )}
        </div>

        {/* Right: Player Search & Match Highlight Tool */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 h-10">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 z-10 pointer-events-none" />
            <input
              type="text"
              placeholder="Search player in bracket..."
              value={playerSearch}
              onFocus={() => setShowSuggestions(true)}
              onChange={e => {
                setPlayerSearch(e.target.value);
                setShowSuggestions(true);
                setSuggestionIndex(-1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSuggestionIndex(prev => Math.min(prev + 1, playerSuggestions.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSuggestionIndex(prev => Math.max(prev - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (suggestionIndex >= 0 && playerSuggestions[suggestionIndex]) {
                    handleSelectPlayer(playerSuggestions[suggestionIndex].tag);
                  } else if (playerSuggestions.length > 0) {
                    handleSelectPlayer(playerSuggestions[0].tag);
                  } else {
                    setShowSuggestions(false);
                  }
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                }
              }}
              className="w-full h-10 pl-9 pr-8 text-xs font-mono font-bold tracking-wider rounded-lg bg-black/50 border border-white/15 outline-none focus:border-cyan-400 transition-colors uppercase"
              style={{ color: 'var(--foreground)' }}
            />
            {playerSearch && (
              <button
                onClick={() => {
                  setPlayerSearch('');
                  setShowSuggestions(false);
                  setSuggestionIndex(-1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 z-10"
              >
                <X size={12} />
              </button>
            )}

            {/* Autocomplete Player Suggestions Dropdown */}
            {showSuggestions && playerSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-12 z-50 p-1.5 rounded-xl bg-[#050A14] border border-cyan-500/40 shadow-2xl backdrop-blur-md space-y-1 font-mono text-xs animate-in fade-in duration-100">
                <div className="text-[9px] text-cyan-400/80 px-2 py-1 font-bold tracking-widest uppercase border-b border-white/10 flex items-center justify-between">
                  <span>PLAYERS ({playerSuggestions.length})</span>
                  <span className="text-[8px] text-gray-500">ENTER ↵ TO SELECT</span>
                </div>
                {playerSuggestions.map((p, idx) => {
                  const mCount = matches.filter(m => m.player1Id === p.id || m.player2Id === p.id).length;
                  const isSelected = idx === suggestionIndex;
                  return (
                    <button
                      key={p.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectPlayer(p.tag);
                      }}
                      onMouseEnter={() => setSuggestionIndex(idx)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50'
                          : 'bg-white/5 text-white/80 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt={p.tag} className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-cyan-400/50" />
                        ) : (
                          <span className="text-sm shrink-0">{p.countryFlag || '🎮'}</span>
                        )}
                        <span className="font-bold truncate text-xs">{p.tag}</span>
                        {p.seed && (
                          <span className="text-[9px] px-1 rounded bg-white/10 text-gray-400">#SEED {p.seed}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-cyan-400 font-bold shrink-0 ml-2">
                        {mCount} {mCount === 1 ? 'match' : 'matches'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {query && (
            <button
              onClick={() => setFilterMatchesOnly(!filterMatchesOnly)}
              className={`h-10 px-3.5 flex items-center gap-1.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase border transition-all ${
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
            <div className="h-10 px-3.5 flex items-center text-xs font-mono font-bold tracking-wider uppercase rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              {matchingMatchesCount} {matchingMatchesCount === 1 ? 'match' : 'matches'}
            </div>
          )}

          {/* Share on Discord button */}
          <div className="relative">
            <button
              id="bracket-share-discord"
              onClick={handleShareToDiscord}
              title="Copy bracket summary to clipboard for Discord"
              className="flex items-center gap-1.5 h-10 px-3.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase border transition-all hover:brightness-125"
              style={{
                borderColor: 'rgba(88,101,242,0.45)',
                color: '#5865F2',
                background: 'rgba(88,101,242,0.12)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 127.14 96.36" fill="#5865F2" aria-hidden="true">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
              SHARE
            </button>
            {shareTooltip && (
              <div
                className="absolute bottom-full mb-2 right-0 px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap pointer-events-none animate-in fade-in duration-150"
                style={{ background: '#5865F2', color: 'white' }}
              >
                Copied to clipboard!
              </div>
            )}
          </div>

          {/* Dedicated Venue Display & Stream Overlay Selector */}
          <div className="relative">
            <button
              onClick={() => setShowDisplayMenu(!showDisplayMenu)}
              title="Open bracket in a dedicated venue display window or stream overlay"
              className="flex items-center gap-1.5 h-10 px-3.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase border transition-all hover:brightness-125 bg-cyan-500/10 text-cyan-400 border-cyan-500/40"
            >
              <Tv size={14} />
              <span>DISPLAY MODE</span>
            </button>

            {showDisplayMenu && (
              <div className="absolute right-0 top-12 z-50 w-72 p-2 rounded-xl bg-[#050A14] border border-cyan-500/40 shadow-2xl backdrop-blur-md space-y-1.5 font-mono text-xs">
                <div className="text-[10px] text-gray-400 px-2 py-1 font-bold tracking-widest border-b border-white/10 uppercase">
                  SELECT VENUE DISPLAY MODE
                </div>

                <button
                  onClick={() => {
                    window.open('/display', 'BracketDisplayWindow', 'width=1920,height=1080');
                    setShowDisplayMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 text-left transition-all group border border-transparent hover:border-cyan-500/30"
                >
                  <Monitor size={16} className="text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white group-hover:text-cyan-300">Widescreen TV (16:9)</div>
                    <div className="text-[10px] text-gray-400">Horizontal 1920x1080 venue TV/projector</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    window.open('/display?orient=vertical', 'BracketDisplayWindow', 'width=1080,height=1920');
                    setShowDisplayMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 text-left transition-all group border border-transparent hover:border-purple-500/30"
                >
                  <Smartphone size={16} className="text-purple-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white group-hover:text-purple-300">Vertical Monitor (9:16)</div>
                    <div className="text-[10px] text-gray-400">Rotated 1080x1920 portrait display</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    window.open('/twitch-extension/video_overlay.html', 'StreamOverlayWindow', 'width=1280,height=720');
                    setShowDisplayMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-left transition-all group border border-transparent hover:border-emerald-500/30"
                >
                  <Radio size={16} className="text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white group-hover:text-emerald-300">OBS Stream Overlay</div>
                    <div className="text-[10px] text-gray-400">Live stream HUD & match callouts</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Live Start.gg Sync & Manual Refresh Button */}
          {onManualSync && (
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              title={autoSyncSlug ? "Live Start.gg auto-sync active (polling every 10s during live matches). Click to sync immediately." : "Click to refresh bracket from Start.gg"}
              className="h-10 w-10 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all shrink-0 relative"
            >
              <RefreshCw size={15} className={isSyncing ? 'animate-spin text-cyan-400' : ''} />
              {autoSyncSlug && !isSyncing && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Bracket Rendering: Grouped by Phase & Pool Blocks */}
      <div className="space-y-12">
        {(availablePhases.length > 0
          ? (activePhase === 'ALL' ? availablePhases : [activePhase])
          : ['DEFAULT']
        ).map(phaseName => {
          const isDefaultPhase = phaseName === 'DEFAULT';
          const pPhaseMatches = processedMatches.filter(m =>
            isDefaultPhase ? true : (m.phase || availablePhases[0]) === phaseName
          );

          if (pPhaseMatches.length === 0) return null;

          const phasePools = Array.from(
            new Set(pPhaseMatches.map(m => m.pool).filter(Boolean))
          ) as string[];
          phasePools.sort();

          if (activePool === 'ALL' && phasePools.length > 1) {
            const unpooledMatches = pPhaseMatches.filter(m => !m.pool);

            return (
              <div
                key={phaseName}
                className="space-y-8 p-6 rounded-2xl border bg-black/30 backdrop-blur-sm"
                style={{ borderColor: `${theme.primaryColor}30` }}
              >
                {availablePhases.length > 1 && (
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <Layers size={22} style={{ color: theme.primaryColor }} />
                      <h3
                        className="text-2xl font-bold tracking-widest uppercase"
                        style={{ fontFamily: 'Rajdhani, sans-serif', color: theme.primaryColor }}
                      >
                        PHASE: {phaseName}
                      </h3>
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/10 opacity-70">
                        {pPhaseMatches.length} matches · {phasePools.length} pools
                      </span>
                    </div>
                  </div>
                )}

                {/* Pool Blocks inside Phase */}
                <div className="space-y-8">
                  {phasePools.map(poolName => {
                    const pMatches = pPhaseMatches.filter(m => m.pool === poolName);
                    const pLosers = pMatches.filter(
                      m => m.round < 0 || m.roundName?.toLowerCase().includes('loser')
                    );
                    const pGrandFinals = pMatches.filter(m =>
                      m.roundName?.toLowerCase().includes('grand final')
                    );
                    const pWinners = pMatches.filter(
                      m => !pLosers.includes(m) && !pGrandFinals.includes(m)
                    );

                    return (
                      <div
                        key={poolName}
                        className="p-6 rounded-xl border border-white/10 bg-black/20 space-y-6"
                      >
                        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                          <span className="px-3 py-1 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold text-sm tracking-wider">
                            POOL {poolName}
                          </span>
                          <span className="text-xs font-mono opacity-50">
                            {pMatches.length} matches
                          </span>
                        </div>

                        <BracketSection
                          title={`POOL ${poolName} — WINNERS BRACKET`}
                          matches={pWinners}
                          allMatches={matches}
                          playerMap={playerMap}
                          theme={theme}
                          hoveredMatchId={hoveredMatchId}
                          setHoveredMatchId={setHoveredMatchId}
                          onCallMatch={onCallMatch}
                          searchMatchingPlayerIds={searchMatchingPlayerIds}
                          selectedPool={poolName}
                          onPlayerClick={onPlayerClick}
                        />
                        <BracketSection
                          title={`POOL ${poolName} — LOSERS BRACKET`}
                          matches={pLosers}
                          allMatches={matches}
                          playerMap={playerMap}
                          theme={theme}
                          hoveredMatchId={hoveredMatchId}
                          setHoveredMatchId={setHoveredMatchId}
                          onCallMatch={onCallMatch}
                          searchMatchingPlayerIds={searchMatchingPlayerIds}
                          selectedPool={poolName}
                          onPlayerClick={onPlayerClick}
                        />
                        <BracketSection
                          title={`POOL ${poolName} — FINALS`}
                          matches={pGrandFinals}
                          allMatches={matches}
                          playerMap={playerMap}
                          theme={theme}
                          hoveredMatchId={hoveredMatchId}
                          setHoveredMatchId={setHoveredMatchId}
                          onCallMatch={onCallMatch}
                          searchMatchingPlayerIds={searchMatchingPlayerIds}
                          selectedPool={poolName}
                          onPlayerClick={onPlayerClick}
                        />
                      </div>
                    );
                  })}

                  {/* Main Phase Bracket Block for matches in this phase without a pool label */}
                  {unpooledMatches.length > 0 && (
                    <div className="p-6 rounded-xl border border-white/10 bg-black/20 space-y-6">
                      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                        <span className="px-3 py-1 rounded bg-purple-500/20 text-purple-400 font-mono font-bold text-sm tracking-wider">
                          {phaseName.toUpperCase()} — MAIN BRACKET
                        </span>
                        <span className="text-xs font-mono opacity-50">
                          {unpooledMatches.length} matches
                        </span>
                      </div>

                      <BracketSection
                        title={`${phaseName} — WINNERS BRACKET`}
                        matches={unpooledMatches.filter(
                          m =>
                            !m.roundName?.toLowerCase().includes('loser') &&
                            m.round >= 0 &&
                            !m.roundName?.toLowerCase().includes('grand final')
                        )}
                        allMatches={matches}
                        playerMap={playerMap}
                        theme={theme}
                        hoveredMatchId={hoveredMatchId}
                        setHoveredMatchId={setHoveredMatchId}
                        onCallMatch={onCallMatch}
                        searchMatchingPlayerIds={searchMatchingPlayerIds}
                        onPlayerClick={onPlayerClick}
                      />
                      <BracketSection
                        title={`${phaseName} — LOSERS BRACKET`}
                        matches={unpooledMatches.filter(
                          m => m.round < 0 || m.roundName?.toLowerCase().includes('loser')
                        )}
                        allMatches={matches}
                        playerMap={playerMap}
                        theme={theme}
                        hoveredMatchId={hoveredMatchId}
                        setHoveredMatchId={setHoveredMatchId}
                        onCallMatch={onCallMatch}
                        searchMatchingPlayerIds={searchMatchingPlayerIds}
                        onPlayerClick={onPlayerClick}
                      />
                      <BracketSection
                        title={`${phaseName} — GRAND FINALS`}
                        matches={unpooledMatches.filter(m =>
                          m.roundName?.toLowerCase().includes('grand final')
                        )}
                        allMatches={matches}
                        playerMap={playerMap}
                        theme={theme}
                        hoveredMatchId={hoveredMatchId}
                        setHoveredMatchId={setHoveredMatchId}
                        onCallMatch={onCallMatch}
                        searchMatchingPlayerIds={searchMatchingPlayerIds}
                        onPlayerClick={onPlayerClick}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          }

          const pMatches =
            activePool !== 'ALL'
              ? pPhaseMatches.filter(m => m.pool === activePool)
              : pPhaseMatches;

          if (pMatches.length === 0) return null;

          const pLosers = pMatches.filter(
            m => m.round < 0 || m.roundName?.toLowerCase().includes('loser')
          );
          const pGrandFinals = pMatches.filter(m =>
            m.roundName?.toLowerCase().includes('grand final')
          );
          const pWinners = pMatches.filter(
            m => !pLosers.includes(m) && !pGrandFinals.includes(m)
          );

          return (
            <div
              key={phaseName}
              className="space-y-8 p-6 rounded-2xl border bg-black/30 backdrop-blur-sm"
              style={{ borderColor: `${theme.primaryColor}30` }}
            >
              {availablePhases.length > 1 && (
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <Layers size={22} style={{ color: theme.primaryColor }} />
                  <h3
                    className="text-2xl font-bold tracking-widest uppercase"
                    style={{ fontFamily: 'Rajdhani, sans-serif', color: theme.primaryColor }}
                  >
                    PHASE: {phaseName}
                  </h3>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/10 opacity-70">
                    {pMatches.length} matches
                  </span>
                </div>
              )}

              <BracketSection
                title={availablePhases.length > 1 ? `${phaseName} — WINNERS BRACKET` : 'WINNERS BRACKET'}
                matches={pWinners}
                allMatches={matches}
                playerMap={playerMap}
                theme={theme}
                hoveredMatchId={hoveredMatchId}
                setHoveredMatchId={setHoveredMatchId}
                onCallMatch={onCallMatch}
                searchMatchingPlayerIds={searchMatchingPlayerIds}
                selectedPool={activePool !== 'ALL' ? activePool : undefined}
                onPlayerClick={onPlayerClick}
              />
              <BracketSection
                title={availablePhases.length > 1 ? `${phaseName} — LOSERS BRACKET` : 'LOSERS BRACKET'}
                matches={pLosers}
                allMatches={matches}
                playerMap={playerMap}
                theme={theme}
                hoveredMatchId={hoveredMatchId}
                setHoveredMatchId={setHoveredMatchId}
                onCallMatch={onCallMatch}
                searchMatchingPlayerIds={searchMatchingPlayerIds}
                selectedPool={activePool !== 'ALL' ? activePool : undefined}
                onPlayerClick={onPlayerClick}
              />
              <BracketSection
                title={availablePhases.length > 1 ? `${phaseName} — GRAND FINALS` : 'GRAND FINALS'}
                matches={pGrandFinals}
                allMatches={matches}
                playerMap={playerMap}
                theme={theme}
                hoveredMatchId={hoveredMatchId}
                setHoveredMatchId={setHoveredMatchId}
                onCallMatch={onCallMatch}
                searchMatchingPlayerIds={searchMatchingPlayerIds}
                selectedPool={activePool !== 'ALL' ? activePool : undefined}
                onPlayerClick={onPlayerClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { computeBracketSlots } from '../data/bracketEngine';

function BracketSection({ 
  title, matches, allMatches, playerMap, theme, hoveredMatchId, setHoveredMatchId, onCallMatch, searchMatchingPlayerIds, selectedPool, onPlayerClick
}: { 
  title: string; 
  matches: BracketMatch[]; 
  allMatches: BracketMatch[];
  playerMap: Record<string, Player>;
  theme: GameTheme;
  hoveredMatchId: string | null;
  setHoveredMatchId: (id: string | null) => void;
  onCallMatch: (match: BracketMatch) => void;
  searchMatchingPlayerIds: Set<string>;
  selectedPool?: string;
  onPlayerClick?: (playerId: string) => void;
}) {
  if (matches.length === 0) return null;

  const isLosers = matches.some(m => m.round < 0 || m.roundName?.toLowerCase().includes('loser'));

  // Build bracket tree slot positions using the BracketEngine
  // This gives each match its true vertical position based on parent-child relationships
  const slotMap = computeBracketSlots(matches);

  const SLOT_SIZE = 160; // 160px per slot — card height (~112px) + stream bar (~32px) + gap

  // Sort rounds chronologically: winners 1→N, losers by absolute value ascending (earliest first)
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
      <div className="flex gap-12 min-w-max px-4 py-4 pr-36 overflow-x-auto custom-scrollbar">
        {rounds.map((round, rIdx) => {
          let roundMatches = matches.filter(m => m.round === round);
          roundMatches.sort((a, b) => {
            // Priority 1: Use BracketEngine slot positions (most accurate — from prereqSet tree)
            const slotA = slotMap.slots.get(a.id) ?? 9999;
            const slotB = slotMap.slots.get(b.id) ?? 9999;
            if (slotA !== slotB) return slotA - slotB;
            
            // Priority 2: start.gg identifier letters (N < O < P < Q < W < X...)
            const idA = a.identifier;
            const idB = b.identifier;
            if (idA && idB) {
              if (idA.length !== idB.length) return idA.length - idB.length;
              return idA.localeCompare(idB);
            }
            if (idA) return -1;
            if (idB) return 1;
            // Priority 3: raw numeric start.gg set ID (chronological)
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
              <div 
                className="relative w-full"
                style={{ height: (slotMap.maxSlot + 1) * SLOT_SIZE }}
              >
                {roundMatches.map((match, mIdx) => {
                  const p1 = match.player1Id ? playerMap[match.player1Id] : null;
                  const p2 = match.player2Id ? playerMap[match.player2Id] : null;
                  const cfg = STATE_CONFIG[match.state];
                  const Icon = cfg.icon;
                  const isHovered = hoveredMatchId === match.id;
                  const canCall = match.state === 'pending' && p1 && p2;
                  const isLive = match.state === 'in_progress' || match.state === 'called';

                  const matchesSearch = (p1 && searchMatchingPlayerIds.has(p1.id)) ||
                                       (p2 && searchMatchingPlayerIds.has(p2.id));

                  const slot = slotMap.slots.get(match.id) ?? mIdx;

                  return (
                    <div 
                      key={match.id} 
                      className="absolute w-full"
                      style={{ top: slot * SLOT_SIZE }}
                    >
                      {/* Connection Line — Perfectly Aligned Outlet & Inlet Slots */}
                      {!isLast && (
                        (() => {
                          let nextMatch = matches.find(
                            m =>
                              m.prereqSetIds?.includes(match.id) ||
                              m.loserPrereqSetIds?.includes(match.id) ||
                              m.id === match.loserNextMatchId
                          );
                          if (!nextMatch && rIdx < rounds.length - 1) {
                            const nextRound = rounds[rIdx + 1];
                            const nextRoundMatches = matches.filter(m => m.round === nextRound);

                            // Visual Fallback: Only auto-connect if round sizes mathematically align
                            if (roundMatches.length === nextRoundMatches.length) {
                              nextMatch = nextRoundMatches[mIdx];
                            } else if (roundMatches.length === nextRoundMatches.length * 2) {
                              const targetIdx = Math.floor(mIdx / 2);
                              nextMatch = nextRoundMatches[targetIdx];
                            }
                          }

                          if (nextMatch) {
                            const nextSlot = slotMap.slots.get(nextMatch.id) ?? slot;
                            const nextRoundIndex = rounds.indexOf(nextMatch.round);
                            const colsDiff = Math.max(1, nextRoundIndex >= 0 ? nextRoundIndex - rIdx : 1);
                            const dx = (colsDiff - 1) * (250 + 48) + 48;
                            const dy = (nextSlot - slot) * SLOT_SIZE;

                            // 1. Calculate source card outlet Y position (43 = P1 slot, 80 = P2 slot, 61 = center divider)
                            let yStart = 61;
                            if (match.winnerId) {
                              if (match.winnerId === match.player1Id) yStart = 43;
                              else if (match.winnerId === match.player2Id) yStart = 80;
                            } else if (nextMatch.player1Id && (nextMatch.player1Id === match.player1Id || nextMatch.player1Id === match.player2Id)) {
                              yStart = nextMatch.player1Id === match.player1Id ? 43 : 80;
                            } else if (nextMatch.player2Id && (nextMatch.player2Id === match.player1Id || nextMatch.player2Id === match.player2Id)) {
                              yStart = nextMatch.player2Id === match.player1Id ? 43 : 80;
                            }

                            // 2. Calculate target card inlet Y position (43 = P1 slot, 80 = P2 slot, 61 = center divider)
                            let targetSlotY = 61;
                            const isP1Prereq = nextMatch.prereqSetIds && nextMatch.prereqSetIds[0] === match.id;
                            const isP2Prereq = nextMatch.prereqSetIds && nextMatch.prereqSetIds[1] === match.id;

                            if (match.winnerId && nextMatch.player1Id === match.winnerId) {
                              targetSlotY = 43;
                            } else if (match.winnerId && nextMatch.player2Id === match.winnerId) {
                              targetSlotY = 80;
                            } else if (nextMatch.player1Id && (nextMatch.player1Id === match.player1Id || nextMatch.player1Id === match.player2Id)) {
                              targetSlotY = 43;
                            } else if (nextMatch.player2Id && (nextMatch.player2Id === match.player1Id || nextMatch.player2Id === match.player2Id)) {
                              targetSlotY = 80;
                            } else if (isP1Prereq) {
                              targetSlotY = 43;
                            } else if (isP2Prereq) {
                              targetSlotY = 80;
                            } else if (slot < nextSlot) {
                              targetSlotY = 43;
                            } else if (slot > nextSlot) {
                              targetSlotY = 80;
                            } else {
                              targetSlotY = yStart; // Match outlet position for straight horizontal line if same slot level
                            }

                            const yTarget = dy + targetSlotY;
                            const pathD = (dy === 0 && yStart === yTarget)
                              ? `M 0 ${yStart} L ${dx} ${yTarget}`
                              : `M 0 ${yStart} C ${dx * 0.45} ${yStart}, ${dx * 0.55} ${yTarget}, ${dx} ${yTarget}`;

                            const isMatchHovered = hoveredMatchId === match.id || hoveredMatchId === nextMatch.id;
                            const isWinnerAdvanced = match.winnerId && (nextMatch.player1Id === match.winnerId || nextMatch.player2Id === match.winnerId);
                            const isHighlighted = matchesSearch || isMatchHovered || isLive || isWinnerAdvanced;

                            const strokeColor = matchesSearch
                              ? '#00FF88'
                              : isMatchHovered
                                ? '#00E5FF'
                                : isLive
                                  ? '#00FF88'
                                  : isWinnerAdvanced
                                    ? '#00E5FF'
                                    : theme.primaryColor;

                            const strokeW = isHighlighted ? 2.5 : 2.0;
                            const strokeOpacity = isHighlighted ? 1.0 : 0.85;
                            const glowOpacity = isHighlighted ? 0.6 : 0.35;

                            return (
                              <svg 
                                className="absolute pointer-events-none"
                                style={{ 
                                  top: 0,
                                  left: '100%',
                                  width: dx, 
                                  height: 1, 
                                  overflow: 'visible',
                                  zIndex: isHighlighted ? 3 : 1
                                }}
                              >
                                {/* Glowing Ambient Path Background */}
                                <path 
                                  d={pathD}
                                  fill="none"
                                  stroke={strokeColor}
                                  strokeWidth={5}
                                  strokeOpacity={glowOpacity}
                                  style={{ filter: `drop-shadow(0 0 6px ${strokeColor})` }}
                                />
                                {/* Solid Main Connection Path */}
                                <path 
                                  d={pathD}
                                  fill="none"
                                  stroke={strokeColor}
                                  strokeWidth={strokeW}
                                  strokeOpacity={strokeOpacity}
                                />
                                <circle cx={0} cy={yStart} r={isHighlighted ? 3 : 2.5} fill={strokeColor} />
                                <circle cx={dx} cy={yTarget} r={isHighlighted ? 3 : 2.5} fill={strokeColor} />
                              </svg>
                            );
                          }
                          
                          return (
                            <div 
                              className="absolute top-[61px] left-full h-0.5 w-6 shadow-[0_0_8px_rgba(41,121,255,0.4)]" 
                              style={{ background: theme.primaryColor, opacity: 0.75 }} 
                            />
                          );
                        })()
                      )}

                      {/* Start.gg Style Progression Destination Pill for Pool Finals */}
                      {isLast && (
                        (() => {
                          let winDest = "Next Phase";
                          let loseDest = "Next Phase";
                          
                          const isWinnersFinal = match.roundName?.toLowerCase().includes('winners final');
                          const isLosersFinal = match.roundName?.toLowerCase().includes('losers final');
                          const isGrandFinal = match.roundName?.toLowerCase().includes('grand final');

                          if (isGrandFinal) return null;

                          if (isWinnersFinal) {
                            winDest = "Grand Finals";
                            loseDest = "Losers Final";
                          } else if (isLosersFinal) {
                            winDest = "Grand Finals";
                            loseDest = "Eliminated";
                          } else {
                            const destMatches = allMatches.filter(m => m.prereqSetIds?.includes(match.id));
                            if (destMatches.length > 0) {
                              const wMatch = destMatches.find(m => m.round > 0 || m.roundName?.toLowerCase().includes('grand'));
                              const lMatch = destMatches.find(m => m.round < 0 || m.roundName?.toLowerCase().includes('loser'));
                              
                              if (wMatch) winDest = wMatch.roundName?.toLowerCase().includes('grand') ? "Grand Finals" : (wMatch.phase || winDest);
                              if (lMatch) loseDest = lMatch.phase || loseDest;
                              
                              if (!wMatch && destMatches[0]) winDest = destMatches[0].phase || winDest;
                            } else {
                              const currentPhase = match.phase;
                              if (currentPhase) {
                                 const availablePhases = Array.from(new Set(allMatches.map(m => m.phase).filter(Boolean))) as string[];
                                 
                                 availablePhases.sort((a, b) => {
                                    const aPool = a.toLowerCase().includes('pool');
                                    const bPool = b.toLowerCase().includes('pool');
                                    if (aPool && !bPool) return -1;
                                    if (!aPool && bPool) return 1;
                                    
                                    const aTop = a.match(/top\s*(\d+)/i);
                                    const bTop = b.match(/top\s*(\d+)/i);
                                    if (aTop && bTop) return parseInt(bTop[1]) - parseInt(aTop[1]);
                                    
                                    return a.localeCompare(b);
                                 });

                                 const idx = availablePhases.indexOf(currentPhase);
                                 if (idx >= 0 && idx < availablePhases.length - 1) {
                                    winDest = availablePhases[idx + 1];
                                    loseDest = availablePhases[idx + 1];
                                 }
                              }
                            }
                          }
                          if (winDest === "Next Phase" && loseDest === "Next Phase") return null;

                          const p2Won = match.winnerId === match.player2Id;
                          
                          const wPill = (
                            <div className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg whitespace-nowrap">
                              <span>→</span> {winDest} [W]
                            </div>
                          );
                          const lPill = !isLosers && loseDest !== "Eliminated" ? (
                            <div className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap opacity-60">
                              <span>→</span> {loseDest} [L]
                            </div>
                          ) : null;

                          return (
                            <div className="absolute top-0 left-full ml-4 h-full flex flex-col z-10 pointer-events-none">
                              {/* Header Ghost Spacer */}
                              <div className="px-2.5 py-1 border-b border-transparent flex items-center">
                                <span className="text-xs invisible leading-tight" style={{ fontSize: 10 }}>S</span>
                              </div>
                              
                              {/* Player 1 Pill */}
                              <div className="px-3 py-2 flex items-center">
                                <span className="text-sm invisible leading-tight w-0">S</span>
                                {p2Won ? lPill : wPill}
                              </div>

                              {/* Divider Ghost Spacer */}
                              <div className="h-px" />

                              {/* Player 2 Pill */}
                              <div className="px-3 py-2 flex items-center">
                                <span className="text-sm invisible leading-tight w-0">S</span>
                                {p2Won ? wPill : lPill}
                              </div>
                            </div>
                          );
                        })()
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
                          onClick={() => { if (canCall && onCallMatch) { onCallMatch(match); } }}
                          onPlayerClick={onPlayerClick}
                        />
                        <div className="h-px" style={{ background: 'var(--border)' }} />
                        <PlayerSlot
                          player={p2}
                          score={match.player2Score}
                          isWinner={match.winnerId === match.player2Id}
                          isCompleted={match.state === 'completed'}
                          theme={theme}
                          isSearched={Boolean(p2 && searchMatchingPlayerIds.has(p2.id))}
                          onClick={() => { if (canCall && onCallMatch) { onCallMatch(match); } }}
                          onPlayerClick={onPlayerClick}
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
  onClick,
  onPlayerClick,
}: {
  player: Player | null;
  score: number;
  isWinner: boolean;
  isCompleted: boolean;
  theme: GameTheme;
  isSearched?: boolean;
  onClick?: () => void;
  onPlayerClick?: (id: string) => void;
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
        <button
          onClick={(e) => {
            if (player.fbUserId && onPlayerClick) {
              e.stopPropagation();
              onPlayerClick(player.fbUserId);
            } else if (onClick) {
              onClick();
            }
          }}
          className={`flex items-center gap-1.5 text-left transition-opacity min-w-0 ${player.fbUserId ? 'hover:opacity-80 cursor-pointer' : ''}`}
        >
          {player.avatarUrl && (
            <img 
              src={player.avatarUrl} 
              alt={player.tag} 
              className="w-4 h-4 rounded-full object-cover shrink-0 ring-1"
              style={{ borderColor: theme.primaryColor }}
            />
          )}
          <span
            className="text-base truncate flex items-center gap-1 leading-snug"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: isWinner || isSearched ? 800 : 700,
              color: isSearched ? '#00FF88' : isWinner ? theme.primaryColor : 'var(--foreground)',
              textDecoration: player.fbUserId ? 'underline' : 'none',
              textDecorationColor: theme.primaryColor,
              textDecorationThickness: '1px',
              textUnderlineOffset: '2px',
            }}
          >
            {!player.avatarUrl && player.countryFlag} {player.tag}
            {isSearched && <Sparkles size={12} className="text-cyan-400 animate-pulse" />}
          </span>
        </button>
      </div>
      <span
        className="text-base tabular-nums ml-2 shrink-0"
        style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: isWinner ? theme.primaryColor : score > 0 ? 'var(--foreground)' : 'rgba(122,158,192,0.4)' }}
      >
        {score}
      </span>
    </div>
  );
}
