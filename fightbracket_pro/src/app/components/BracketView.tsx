import { useState, useEffect } from "react";
import { Swords, Clock, CheckCircle2, AlertCircle, ChevronRight, ChevronDown, Search, X, Layers, Filter, Sparkles, Tv, RefreshCw, Monitor, Smartphone, Radio, Share2, Globe, Hash, Shuffle, ArrowUpDown, Copy, UserPlus, Users, Cloud, ExternalLink, Lock, Unlock, Play, RotateCcw, GripVertical } from "lucide-react";
import { BracketType, type BracketMatch, type Player, type GameTheme, type Station, getChronologicalRoundName, getSeedingOrder } from "../data/tournamentData";
import { getBracketSubdomainUrl, sanitizeSubdomain, getMatchPermalink } from "../utils/subdomain";
import { toast } from "sonner";

interface BracketViewProps {
  matches: BracketMatch[];
  players: Player[];
  stations?: Station[];
  theme: GameTheme;
  onCallMatch: (match: BracketMatch) => void;
  onGenerateBracket?: (type: BracketType) => void;
  onUpdateSeed?: (playerId: string, newSeed: number) => void;
  onUpdatePlayerStation?: (playerId: string, stationId: number | null) => void;
  onAutoSeed?: (mode: 'checked-in' | 'random' | 'tag') => void;
  onSwapSeeds?: (player1Id: string, player2Id: string) => void;
  onStartTournament?: () => void;
  onRestartTournament?: () => void;
  isTournamentStarted?: boolean;
  onOpenAddPlayer?: () => void;
  onOpenImportModal?: () => void;
  onLoadDemoPlayers?: () => void;
  selectedPool?: string;
  onSelectPool?: (pool: string) => void;
  isImported?: boolean;
  onPlayerClick?: (playerId: string) => void;
  onViewAnnouncement?: (match: BracketMatch) => void;
  onManualSync?: () => void;
  lastSyncedAt?: Date | null;
  isSyncing?: boolean;
  autoSyncSlug?: string | null;
  subdomain?: string | null;
  tournamentId?: string | null;
  tournamentName?: string | null;
  highlightedMatchId?: string | null;
  onShareBracket?: () => Promise<string | null> | void;
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
  stations,
  theme,
  onCallMatch,
  onGenerateBracket,
  onUpdateSeed,
  onUpdatePlayerStation,
  onAutoSeed,
  onSwapSeeds,
  onStartTournament,
  onRestartTournament,
  isTournamentStarted = false,
  onOpenAddPlayer,
  onOpenImportModal,
  onLoadDemoPlayers,
  selectedPool: externalSelectedPool,
  onSelectPool: externalOnSelectPool,
  isImported = false,
  onPlayerClick,
  onViewAnnouncement,
  onManualSync,
  lastSyncedAt,
  isSyncing,
  autoSyncSlug,
  subdomain,
  tournamentId,
  tournamentName,
  highlightedMatchId,
  onShareBracket,
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
  const [seedingViewTab, setSeedingViewTab] = useState<'matchups' | 'list'>('matchups');
  const [dragOverPlayerId, setDragOverPlayerId] = useState<string | null>(null);
  const [dragOverMatchupSlot, setDragOverMatchupSlot] = useState<string | null>(null);
  const [dragSlotOver, setDragSlotOver] = useState<string | null>(null);
  const [showRestartModal, setShowRestartModal] = useState<boolean>(false);

  // Auto-scroll and focus on highlighted match permalink
  useEffect(() => {
    if (highlightedMatchId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`match-card-${highlightedMatchId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [highlightedMatchId]);

  const playerSuggestions = playerSearch.trim()
    ? players.filter(p => p.tag.toLowerCase().includes(playerSearch.toLowerCase().trim())).slice(0, 6)
    : [];

  const handleSelectPlayer = (pTag: string) => {
    setPlayerSearch(pTag);
    setShowSuggestions(false);
    setSuggestionIndex(-1);
  };

  if (matches.length === 0) {
    const sortedPlayers = [...players].sort((a, b) => a.seed - b.seed);

    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
        {/* Header & Generator Card */}
        {isImported ? (
          <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Cloud size={32} />
              </div>
              <div>
                <h3 className="text-xl tracking-widest font-bold text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  START.GG IMPORTED EVENT
                </h3>
                <p className="text-xs text-amber-300/80 font-mono mt-0.5">
                  {players.length > 0
                    ? `${players.length} competitors synced from Start.gg · Bracket progression & seeds are managed on Start.gg.`
                    : 'Bracket generation, seeding, and competitors are managed externally on Start.gg.'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {autoSyncSlug && (
                <a
                  href={`https://start.gg/${autoSyncSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white font-mono text-xs hover:border-amber-400 hover:text-amber-300 transition-all font-bold"
                >
                  <ExternalLink size={13} />
                  <span>VIEW ON START.GG</span>
                </a>
              )}
              {onManualSync && (
                <button
                  type="button"
                  onClick={onManualSync}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs hover:bg-amber-500/30 transition-all cursor-pointer font-bold shrink-0"
                >
                  <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
                  <span>{isSyncing ? "SYNCING..." : "SYNC BRACKET NOW"}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-white/10 bg-[#0A0A0F] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Swords size={32} />
              </div>
              <div>
                <h3 className="text-xl tracking-widest font-bold text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  BRACKET CONFIGURATION
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  {players.length === 0
                    ? "Add competitors to get started. You can configure seeds, setups, and formats below."
                    : `${players.length} players ready · Double check seeds & seating before starting.`}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full sm:w-[220px] shrink-0">
              {onOpenAddPlayer && players.length === 0 && (
                <button
                  type="button"
                  onClick={onOpenAddPlayer}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs tracking-wider font-bold text-black bg-[#00E5FF] hover:brightness-110 shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all font-mono cursor-pointer"
                >
                  <UserPlus size={14} />
                  <span>+ ADD PLAYER</span>
                </button>
              )}
              <div className="relative w-full">
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value as BracketType)}
                  className="w-full bg-black/70 border border-white/20 rounded-lg px-3.5 py-2.5 pr-8 text-xs text-white focus:outline-none focus:border-[#00E5FF] font-mono transition-colors cursor-pointer appearance-none uppercase"
                >
                  {Object.values(BracketType).map(format => (
                    <option key={format} value={format} className="bg-[#0F1420] text-white py-1">
                      {format.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
              <button
                disabled={players.length === 0}
                onClick={() => onGenerateBracket?.(selectedFormat)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs tracking-widest font-bold text-black hover:brightness-125 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
                style={{ background: theme.primaryColor, fontFamily: 'Rajdhani, sans-serif' }}
              >
                GENERATE BRACKET
              </button>
            </div>
          </div>
        )}

        {/* Empty State when 0 players — ONLY on non-imported events */}
        {!isImported && players.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/20 bg-[#0F0F14]/70 p-8 sm:p-10 text-center flex flex-col items-center justify-center gap-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.15)]">
              <Users size={28} />
            </div>
            <div className="max-w-md">
              <h4 className="text-lg font-bold text-white font-rajdhani uppercase tracking-wider">
                NO COMPETITORS REGISTERED YET
              </h4>
              <p className="text-xs text-gray-400 font-mono mt-1 leading-relaxed">
                Add players manually, import an existing event from Start.gg, or generate sample competitors to preview your bracket layout.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              {onOpenAddPlayer && (
                <button
                  type="button"
                  onClick={onOpenAddPlayer}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00E5FF] text-black font-bold font-mono text-xs hover:brightness-110 shadow-[0_0_15px_rgba(0,229,255,0.35)] transition-all cursor-pointer"
                >
                  <UserPlus size={14} />
                  <span>Add First Player</span>
                </button>
              )}
              {onOpenImportModal && (
                <button
                  type="button"
                  onClick={onOpenImportModal}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white font-mono text-xs hover:border-[#00E5FF] hover:text-[#00E5FF] transition-all cursor-pointer"
                >
                  <Cloud size={14} />
                  <span>Import Start.gg Bracket</span>
                </button>
              )}
              {onLoadDemoPlayers && (
                <button
                  type="button"
                  onClick={onLoadDemoPlayers}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs hover:bg-amber-500/20 transition-all cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Load Demo 8 Players</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pre-Bracket Seeding & Seating Setup Card — ONLY on non-imported events */}
        {!isImported && players.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-[#0F0F14] overflow-hidden shadow-lg">
            {/* Seeding & Seating Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#14141B] border-b border-white/10">
              <div className="flex items-center gap-2">
                <Hash size={16} className="text-[#00E5FF]" />
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  PRE-BRACKET SEEDING & SEATING SETUP
                </span>
                <span className="text-[10px] text-gray-500 font-mono">({sortedPlayers.length} ENTRIES)</span>
              </div>

              {/* View Mode Switcher: Matchup Spots vs List */}
              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setSeedingViewTab('matchups')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                    seedingViewTab === 'matchups'
                      ? 'bg-[#00E5FF] text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="View and manually drag & drop high seed vs low seed opening matchups"
                >
                  <Swords size={12} />
                  <span>Matchup Spots</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSeedingViewTab('list')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                    seedingViewTab === 'list'
                      ? 'bg-[#00E5FF] text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="View competitor list with seed inputs and station seating"
                >
                  <Users size={12} />
                  <span>Roster List</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {onOpenAddPlayer && (
                  <button
                    type="button"
                    onClick={onOpenAddPlayer}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/40 hover:bg-[#00E5FF]/25 transition-all font-bold cursor-pointer mr-1"
                  >
                    <UserPlus size={12} />
                    <span>+ Add Player</span>
                  </button>
                )}
                {onAutoSeed && (
                  <>
                    <button
                      onClick={() => onAutoSeed('checked-in')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] bg-white/5 border border-white/10 hover:border-[#00E5FF]/50 hover:text-[#00E5FF] transition-all text-gray-300 cursor-pointer"
                      title="Seed checked-in players 1 through N first"
                    >
                      <Hash size={12} />
                      <span>Auto-Seed</span>
                    </button>
                    <button
                      onClick={() => onAutoSeed('random')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] bg-white/5 border border-white/10 hover:border-amber-400/50 hover:text-amber-400 transition-all text-gray-300 cursor-pointer"
                      title="Randomize player seeds for open brackets"
                    >
                      <Shuffle size={12} />
                      <span>Shuffle Seeds</span>
                    </button>
                    <button
                      onClick={() => onAutoSeed('tag')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] bg-white/5 border border-white/10 hover:border-purple-400/50 hover:text-purple-400 transition-all text-gray-300 cursor-pointer"
                      title="Seed alphabetically by gamer tag"
                    >
                      <ArrowUpDown size={12} />
                      <span>Seed A-Z</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Rule Note / Guidance */}
            <div className="px-4 py-2 bg-black/30 border-b border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-400 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[#00E5FF] font-bold">Standard Practice:</span>
                <span>
                  {seedingViewTab === 'matchups'
                    ? 'Round 1 pairs High Seeds vs Low Seeds (e.g. #1 vs #8). Drag and drop competitors between spots to adjust matchups before initiating the tournament.'
                    : 'Seeds are strictly 1-to-1 unique. Drag and drop rows or edit seed numbers to hotswap seeds.'}
                </span>
              </div>
              <span className="text-gray-500 text-[10px]">Start.gg-style manual seeding</span>
            </div>

            {/* Content: Matchups View OR List View */}
            {seedingViewTab === 'matchups' ? (
              (() => {
                const n = sortedPlayers.length;
                let p = 1;
                while (p < n) p *= 2;
                if (p < 2) p = 2;
                const order = getSeedingOrder(p);
                const numMatches = p / 2;

                return (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[500px] overflow-y-auto">
                    {Array.from({ length: numMatches }).map((_, i) => {
                      const highSeedIdx = order[i * 2];
                      const lowSeedIdx = order[i * 2 + 1];
                      const highSeedNum = highSeedIdx + 1;
                      const lowSeedNum = lowSeedIdx + 1;

                      const playerHigh = sortedPlayers.find(pl => pl.seed === highSeedNum);
                      const playerLow = sortedPlayers.find(pl => pl.seed === lowSeedNum);

                      const isHighOver = dragOverMatchupSlot === `m${i}-high`;
                      const isLowOver = dragOverMatchupSlot === `m${i}-low`;

                      return (
                        <div
                          key={i}
                          className="rounded-xl border border-white/10 bg-black/40 overflow-hidden shadow-sm flex flex-col"
                        >
                          <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5 text-[10px] font-mono">
                            <span className="font-bold text-white tracking-widest uppercase">
                              MATCH {i + 1}
                            </span>
                            <span className="text-gray-500">
                              Seed #{highSeedNum} vs #{lowSeedNum}
                            </span>
                          </div>

                          {/* High Seed Spot */}
                          <div
                            draggable={Boolean(playerHigh)}
                            onDragStart={(e) => {
                              if (playerHigh) {
                                e.dataTransfer.setData('text/plain', playerHigh.id);
                                e.dataTransfer.effectAllowed = 'move';
                              }
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (dragOverMatchupSlot !== `m${i}-high`) {
                                setDragOverMatchupSlot(`m${i}-high`);
                              }
                            }}
                            onDragLeave={() => setDragOverMatchupSlot(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverMatchupSlot(null);
                              const sourceId = e.dataTransfer.getData('text/plain');
                              if (sourceId) {
                                if (playerHigh) {
                                  if (sourceId !== playerHigh.id && onSwapSeeds) {
                                    onSwapSeeds(sourceId, playerHigh.id);
                                  }
                                } else if (onUpdateSeed) {
                                  onUpdateSeed(sourceId, highSeedNum);
                                }
                              }
                            }}
                            className={`flex items-center justify-between p-2.5 transition-all ${
                              isHighOver ? 'bg-cyan-500/25 ring-2 ring-cyan-400' : 'hover:bg-white/[0.03]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shrink-0">
                                HIGH #{highSeedNum}
                              </span>
                              {playerHigh ? (
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <GripVertical size={13} className="text-gray-500 hover:text-white cursor-grab shrink-0" />
                                  <span className="text-sm font-bold text-white truncate font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                    {playerHigh.tag}
                                  </span>
                                  {playerHigh.character && (
                                    <span className="text-[11px] text-gray-400 font-mono truncate">
                                      ({playerHigh.character})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500 font-mono italic">Empty · Drop player here</span>
                              )}
                            </div>
                            {playerHigh?.countryFlag && <span className="text-xs shrink-0">{playerHigh.countryFlag}</span>}
                          </div>

                          <div className="h-px bg-white/5 relative flex items-center justify-center">
                            <span className="absolute bg-[#0F0F14] px-2 text-[9px] font-mono text-gray-500 font-bold uppercase">
                              VS
                            </span>
                          </div>

                          {/* Low Seed Spot */}
                          <div
                            draggable={Boolean(playerLow)}
                            onDragStart={(e) => {
                              if (playerLow) {
                                e.dataTransfer.setData('text/plain', playerLow.id);
                                e.dataTransfer.effectAllowed = 'move';
                              }
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (dragOverMatchupSlot !== `m${i}-low`) {
                                setDragOverMatchupSlot(`m${i}-low`);
                              }
                            }}
                            onDragLeave={() => setDragOverMatchupSlot(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverMatchupSlot(null);
                              const sourceId = e.dataTransfer.getData('text/plain');
                              if (sourceId) {
                                if (playerLow) {
                                  if (sourceId !== playerLow.id && onSwapSeeds) {
                                    onSwapSeeds(sourceId, playerLow.id);
                                  }
                                } else if (onUpdateSeed) {
                                  onUpdateSeed(sourceId, lowSeedNum);
                                }
                              }
                            }}
                            className={`flex items-center justify-between p-2.5 transition-all ${
                              isLowOver ? 'bg-purple-500/25 ring-2 ring-purple-400' : 'hover:bg-white/[0.03]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 shrink-0">
                                LOW #{lowSeedNum}
                              </span>
                              {playerLow ? (
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <GripVertical size={13} className="text-gray-500 hover:text-white cursor-grab shrink-0" />
                                  <span className="text-sm font-bold text-white truncate font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                    {playerLow.tag}
                                  </span>
                                  {playerLow.character && (
                                    <span className="text-[11px] text-gray-400 font-mono truncate">
                                      ({playerLow.character})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500 font-mono italic">BYE / Empty · Drop player here</span>
                              )}
                            </div>
                            {playerLow?.countryFlag && <span className="text-xs shrink-0">{playerLow.countryFlag}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : (
              <div>
                {/* Table Header */}
                <div
                  className="grid text-xs tracking-widest px-4 py-2.5 font-mono text-gray-400 bg-black/40 border-b border-white/5"
                  style={{ gridTemplateColumns: '28px 70px 1fr 120px 140px 90px' }}
                >
                  <span></span>
                  <span>SEED</span>
                  <span>PLAYER</span>
                  <span>CHARACTER</span>
                  <span>SEAT / SETUP</span>
                  <span className="text-right">CHECK-IN</span>
                </div>

                {/* Player List */}
                <div className="divide-y divide-white/5 max-h-[460px] overflow-y-auto">
                  {sortedPlayers.map((player) => {
                    const isRowOver = dragOverPlayerId === player.id;

                    return (
                      <div
                        key={player.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', player.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverPlayerId !== player.id) setDragOverPlayerId(player.id);
                        }}
                        onDragLeave={() => setDragOverPlayerId(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverPlayerId(null);
                          const sourceId = e.dataTransfer.getData('text/plain');
                          if (sourceId && sourceId !== player.id && onSwapSeeds) {
                            onSwapSeeds(sourceId, player.id);
                          }
                        }}
                        className={`grid items-center px-4 py-2.5 transition-colors ${
                          isRowOver ? 'bg-cyan-500/20 ring-2 ring-cyan-400' : 'hover:bg-white/[0.02]'
                        }`}
                        style={{ gridTemplateColumns: '28px 70px 1fr 120px 140px 90px' }}
                      >
                        {/* Drag Handle */}
                        <div className="flex items-center text-gray-500 hover:text-cyan-400 cursor-grab active:cursor-grabbing" title="Drag to reorder/swap seeds">
                          <GripVertical size={14} />
                        </div>

                        {/* Seed Input */}
                        <div className="flex items-center">
                          <BracketSeedInput player={player} onUpdateSeed={onUpdateSeed} />
                        </div>

                        {/* Player Name */}
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            <span>{player.tag}</span>
                            {player.countryFlag && <span className="text-xs">{player.countryFlag}</span>}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {player.realName || player.country}
                          </div>
                        </div>

                        {/* Character */}
                        <span className="text-xs text-gray-400 truncate pr-2 font-mono">
                          {player.character || '—'}
                        </span>

                        {/* Flexible Seating / Station Assignment */}
                        <div className="pr-2">
                          <select
                            value={player.stationId ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                              onUpdatePlayerStation?.(player.id, val);
                            }}
                            className="w-full text-xs font-mono bg-black/60 border border-white/15 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-[#00E5FF]"
                            title="Flexible station/seat assignment before bracket starts"
                          >
                            <option value="">Unassigned</option>
                            {stations?.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Status */}
                        <div className="flex justify-end">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${player.checkedIn
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                            {player.checkedIn ? <CheckCircle2 size={10} /> : <X size={10} />}
                            {player.checkedIn ? 'Ready' : 'Absent'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
    const eventSlugToUse = autoSyncSlug || (window.location.search.includes('event=') ? new URLSearchParams(window.location.search).get('event') : null);
    let shareUrl = getBracketSubdomainUrl({
      subdomain: sanitizeSubdomain(subdomain),
      tournamentId: tournamentId || undefined,
      eventSlug: eventSlugToUse || undefined,
    });
    const tournamentTitle = tournamentName || theme?.displayName || 'Tournament Bracket';

    // Forwards the clean bracket link for Discord friends without auto sending any stats
    const cleanShareText = `🏆 Follow the tournament bracket for **${tournamentTitle}**:\n<${shareUrl}>`;

    if (onShareBracket) {
      Promise.resolve(onShareBracket()).then((resolvedUrl) => {
        const finalUrl = resolvedUrl || shareUrl;
        const fullText = `🏆 Follow the tournament bracket for **${tournamentTitle}**:\n<${finalUrl}>`;
        navigator.clipboard.writeText(fullText).then(() => {
          setShareTooltip(true);
          setTimeout(() => setShareTooltip(false), 2500);
          window.open('https://discord.com/channels/@me', '_blank', 'noopener,noreferrer');
        }).catch(() => {
          window.prompt('Copy this for Discord friends:', fullText);
        });
      });
      return;
    }

    navigator.clipboard.writeText(cleanShareText).then(() => {
      setShareTooltip(true);
      setTimeout(() => setShareTooltip(false), 2500);
      window.open('https://discord.com/channels/@me', '_blank', 'noopener,noreferrer');
    }).catch(() => {
      window.prompt('Copy this for Discord friends:', cleanShareText);
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
      {/* Tournament Status & Lifecycle Control Banner */}
      {!isImported ? (
        !isTournamentStarted ? (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-black/60 to-black/80 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300">
                <Unlock size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
                    BRACKET PREVIEW · SEEDING UNLOCKED
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase">
                    Drag & Drop Enabled
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-mono mt-0.5">
                  Round 1 matchups can be manually adjusted. Drag & drop competitors across matches to swap seed spots, then start the tournament to lock seeds.
                </p>
              </div>
            </div>

            {onStartTournament && (
              <button
                type="button"
                onClick={onStartTournament}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold text-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)] cursor-pointer hover:brightness-110 shrink-0"
                style={{ background: theme.primaryColor || '#00E5FF' }}
              >
                <Play size={13} fill="currentColor" />
                <Lock size={12} />
                <span>START TOURNAMENT (LOCK SEEDS)</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-green-500/30 bg-gradient-to-r from-green-500/10 via-black/60 to-black/80 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-green-500/20 border border-green-500/40 text-green-400">
                <Lock size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
                    TOURNAMENT IN PROGRESS · SEEDS LOCKED
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-mono font-bold uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Live Tournament
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-mono mt-0.5">
                  Matches are live. Competitor seeds and Round 1 match spots are locked.
                </p>
              </div>
            </div>

            {onRestartTournament && (
              <button
                type="button"
                onClick={() => setShowRestartModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer shrink-0"
              >
                <RotateCcw size={13} />
                <span>RESTART TOURNAMENT</span>
              </button>
            )}
          </div>
        )
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-black/60 to-black/80 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              <Lock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
                  START.GG IMPORTED EVENT · SEEDS LOCKED
                </h4>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold uppercase">
                  Synced From Start.gg
                </span>
              </div>
              <p className="text-xs text-cyan-300/80 font-mono mt-0.5">
                Competitor seeds and progression match Start.gg and are locked and non-adjustable.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Restart Tournament Confirmation Modal */}
      {showRestartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#070D18] border border-amber-500/40 font-mono flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300">
                <RotateCcw size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  RESTART TOURNAMENT?
                </h3>
                <p className="text-xs text-gray-400">Reset bracket progression and unlock seeds</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 space-y-2">
              <p className="font-bold text-white">Restarting will:</p>
              <ul className="list-disc pl-4 space-y-1 text-gray-400">
                <li>Reset all match scores and results back to pending</li>
                <li>Unlock seeds and enable Round 1 drag & drop adjustment</li>
                <li className="text-green-400 font-bold">Keep all {players.length} registered players in registration</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRestartModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-mono uppercase bg-white/5 hover:bg-white/10 text-gray-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRestartModal(false);
                  onRestartTournament?.();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase bg-amber-500 text-black hover:bg-amber-400 transition-colors shadow-md cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Confirm Restart & Unlock</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                  className={`h-7 px-2.5 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all ${activePhase === 'ALL'
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
                  className={`h-7 px-2.5 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all ${activePhase === p
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
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${isSelected
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
              className={`h-10 px-3.5 flex items-center gap-1.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase border transition-all ${filterMatchesOnly
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

          {/* Share Bracket Link button */}
          {onShareBracket && (
            <button
              onClick={() => onShareBracket()}
              title="Save & copy permalink so anyone can load or run this bracket directly"
              className="flex items-center gap-1.5 h-10 px-3.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase border transition-all hover:brightness-125 bg-emerald-500/10 text-emerald-400 border-emerald-500/40"
            >
              <Share2 size={14} />
              <span>{subdomain ? `fightbracketpro.com/t/${subdomain}` : 'SHARE LINK'}</span>
            </button>
          )}

          {/* Forward to Discord Friends button */}
          <div className="relative">
            <button
              id="bracket-share-discord"
              onClick={handleShareToDiscord}
              title="Copy bracket link and open Discord to share with friends"
              className="flex items-center gap-1.5 h-10 px-3.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase border transition-all hover:brightness-125"
              style={{
                borderColor: 'rgba(88,101,242,0.45)',
                color: '#5865F2',
                background: 'rgba(88,101,242,0.12)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 127.14 96.36" fill="#5865F2" aria-hidden="true">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
              </svg>
              DISCORD
            </button>
            {shareTooltip && (
              <div
                className="absolute bottom-full mb-2 right-0 px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap pointer-events-none animate-in fade-in duration-150"
                style={{ background: '#5865F2', color: 'white' }}
              >
                Link copied! Opening Discord...
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
                onViewAnnouncement={onViewAnnouncement}
                highlightedMatchId={highlightedMatchId}
                subdomain={subdomain}
                tournamentId={tournamentId}
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
                onViewAnnouncement={onViewAnnouncement}
                highlightedMatchId={highlightedMatchId}
                subdomain={subdomain}
                tournamentId={tournamentId}
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
                onViewAnnouncement={onViewAnnouncement}
                highlightedMatchId={highlightedMatchId}
                subdomain={subdomain}
                tournamentId={tournamentId}
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
  title, matches, allMatches, playerMap, theme, hoveredMatchId, setHoveredMatchId, onCallMatch, searchMatchingPlayerIds, selectedPool, onPlayerClick,
  onViewAnnouncement, highlightedMatchId, subdomain, tournamentId
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
  onViewAnnouncement?: (match: BracketMatch) => void;
  highlightedMatchId?: string | null;
  subdomain?: string | null;
  tournamentId?: string | null;
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

                            // 1. Calculate source card outlet Y position (38.5 = P1 slot, 68.5 = P2 slot, 53.5 = center)
                            let yStart = 53.5;
                            if (match.winnerId) {
                              yStart = match.winnerId === match.player1Id ? 38.5 : 68.5;
                            } else if (nextMatch.player1Id && (nextMatch.player1Id === match.player1Id || nextMatch.player1Id === match.player2Id)) {
                              yStart = nextMatch.player1Id === match.player1Id ? 38.5 : 68.5;
                            } else if (nextMatch.player2Id && (nextMatch.player2Id === match.player1Id || nextMatch.player2Id === match.player2Id)) {
                              yStart = nextMatch.player2Id === match.player1Id ? 38.5 : 68.5;
                            }

                            // 2. Calculate target card inlet Y position (38.5 = P1 slot, 68.5 = P2 slot, 53.5 = center)
                            let targetSlotY = 53.5;
                            const isP1Prereq = nextMatch.prereqSetIds && nextMatch.prereqSetIds[0] === match.id;
                            const isP2Prereq = nextMatch.prereqSetIds && nextMatch.prereqSetIds[1] === match.id;

                            if (match.winnerId && nextMatch.player1Id === match.winnerId) {
                              targetSlotY = 38.5;
                            } else if (match.winnerId && nextMatch.player2Id === match.winnerId) {
                              targetSlotY = 68.5;
                            } else if (nextMatch.player1Id && (nextMatch.player1Id === match.player1Id || nextMatch.player1Id === match.player2Id)) {
                              targetSlotY = 38.5;
                            } else if (nextMatch.player2Id && (nextMatch.player2Id === match.player1Id || nextMatch.player2Id === match.player2Id)) {
                              targetSlotY = 68.5;
                            } else if (isP1Prereq) {
                              targetSlotY = 38.5;
                            } else if (isP2Prereq) {
                              targetSlotY = 68.5;
                            } else if (slot < nextSlot) {
                              targetSlotY = 38.5;
                            } else if (slot > nextSlot) {
                              targetSlotY = 68.5;
                            } else {
                              targetSlotY = yStart;
                            }

                            const yTarget = dy + targetSlotY;
                            const pathD = (dy === 0 && yStart === yTarget)
                              ? `M 0 ${yStart} L ${dx} ${yTarget}`
                              : `M 0 ${yStart} C ${dx * 0.5} ${yStart}, ${dx * 0.5} ${yTarget}, ${dx} ${yTarget}`;

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
                              className="absolute top-[53.5px] left-full h-0.5 w-6 shadow-[0_0_8px_rgba(41,121,255,0.4)]"
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
                            <div className="flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md whitespace-nowrap">
                              <span>→</span> {winDest} [W]
                            </div>
                          );
                          const lPill = !isLosers && loseDest !== "Eliminated" ? (
                            <div className="flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap opacity-60">
                              <span>→</span> {loseDest} [L]
                            </div>
                          ) : null;

                          return (
                            <div className="absolute top-0 left-full ml-3 flex flex-col justify-around h-[83px] pointer-events-none z-10">
                              <div className="h-[29px] flex items-center">
                                {p2Won ? lPill : wPill}
                              </div>
                              <div className="h-[29px] flex items-center">
                                {p2Won ? wPill : lPill}
                              </div>
                            </div>
                          );
                        })()
                      )}

                      <div
                        id={`match-card-${match.id}`}
                        className={`rounded-lg overflow-hidden cursor-pointer transition-all duration-200 w-full ${highlightedMatchId === match.id
                          ? 'ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(0,229,255,0.85)] scale-[1.03]'
                          : matchesSearch
                            ? 'ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.4)] scale-[1.02]'
                            : match.state === 'called'
                              ? 'ring-2 ring-amber-400/90 shadow-[0_0_18px_rgba(255,214,0,0.35)]'
                              : ''
                          }`}
                        style={{
                          background: isHovered
                            ? `${theme.primaryColor}12`
                            : match.state === 'called'
                              ? 'rgba(255, 214, 0, 0.08)'
                              : cfg.bg,
                          border: `1px solid ${matchesSearch
                            ? theme.primaryColor
                            : match.state === 'called'
                              ? '#FFD600'
                              : isLive
                                ? theme.primaryColor
                                : isHovered
                                  ? `${theme.primaryColor}40`
                                  : 'rgba(122,158,192,0.15)'
                            }`,
                          boxShadow:
                            match.state === 'called'
                              ? '0 0 16px rgba(255, 214, 0, 0.35)'
                              : isLive
                                ? `0 0 12px ${theme.glowColor}`
                                : matchesSearch
                                  ? `0 0 20px ${theme.primaryColor}`
                                  : 'none',
                        }}
                        onMouseEnter={() => setHoveredMatchId(match.id)}
                        onMouseLeave={() => setHoveredMatchId(null)}
                        onClick={() => {
                          if (canCall) {
                            onCallMatch(match);
                          } else if (match.state === 'called' && onViewAnnouncement) {
                            onViewAnnouncement(match);
                          }
                        }}
                      >
                        <div
                          className="flex items-center justify-between px-2.5 py-1"
                          style={{
                            background: match.state === 'called' ? 'rgba(255, 214, 0, 0.15)' : 'rgba(0,0,0,0.4)',
                            borderBottom: `1px solid ${match.state === 'called' ? 'rgba(255, 214, 0, 0.3)' : 'rgba(122,158,192,0.1)'}`,
                          }}
                        >
                          <span className="text-xs opacity-60 flex items-center gap-1" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                            {match.pool && (
                              <span className="px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold mr-1">
                                POOL {match.pool}
                              </span>
                            )}
                            {match.identifier ? `MATCH ${match.identifier} · ` : ''}BO{match.bestOf}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = getMatchPermalink(match.id, tournamentId || subdomain);
                                navigator.clipboard.writeText(url);
                                toast.success(`Match permalink copied! (${url})`);
                              }}
                              title="Copy match link (fightbracketpro.com/m/...)"
                              className="opacity-40 hover:opacity-100 hover:text-[#00E5FF] transition-opacity p-0.5 ml-0.5 inline-flex items-center"
                            >
                              <Copy size={9} />
                            </button>
                          </span>
                          <div className="flex items-center gap-1">
                            <Icon size={10} style={{ color: cfg.color }} className={match.state === 'called' ? 'animate-pulse' : ''} />
                            <span className="text-xs font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: cfg.color }}>
                              {cfg.label}
                            </span>
                            {match.state === 'called' && match.stationId && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 font-mono font-bold text-[9px] border border-amber-500/40 ml-0.5 animate-pulse">
                                STN {match.stationId}
                              </span>
                            )}
                          </div>
                        </div>

                        {(() => {
                          const isRound0Unlocked = !isImported && !isTournamentStarted && match.round === 0;

                          return (
                            <>
                              <PlayerSlot
                                player={p1}
                                score={match.player1Score}
                                isWinner={match.winnerId === match.player1Id}
                                isCompleted={match.state === 'completed'}
                                theme={theme}
                                isSearched={Boolean(p1 && searchMatchingPlayerIds.has(p1.id))}
                                isLocked={isImported || isTournamentStarted}
                                isDraggable={isRound0Unlocked && Boolean(p1)}
                                isDragOver={dragSlotOver === `${match.id}-p1`}
                                onDragStart={(e) => {
                                  if (p1) {
                                    e.dataTransfer.setData('text/plain', p1.id);
                                    e.dataTransfer.effectAllowed = 'move';
                                  }
                                }}
                                onDragOver={(e) => {
                                  if (isRound0Unlocked) {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                    if (dragSlotOver !== `${match.id}-p1`) setDragSlotOver(`${match.id}-p1`);
                                  }
                                }}
                                onDragLeave={() => {
                                  if (dragSlotOver === `${match.id}-p1`) setDragSlotOver(null);
                                }}
                                onDrop={(e) => {
                                  if (isRound0Unlocked) {
                                    e.preventDefault();
                                    setDragSlotOver(null);
                                    const sourceId = e.dataTransfer.getData('text/plain');
                                    if (sourceId && sourceId !== p1?.id && onSwapSeeds && p1) {
                                      onSwapSeeds(sourceId, p1.id);
                                    }
                                  }
                                }}
                                onClick={() => {
                                  if (canCall && onCallMatch) onCallMatch(match);
                                  else if (match.state === 'called' && onViewAnnouncement) onViewAnnouncement(match);
                                }}
                                onPlayerClick={onPlayerClick}
                              />
                              <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                              <PlayerSlot
                                player={p2}
                                score={match.player2Score}
                                isWinner={match.winnerId === match.player2Id}
                                isCompleted={match.state === 'completed'}
                                theme={theme}
                                isSearched={Boolean(p2 && searchMatchingPlayerIds.has(p2.id))}
                                isLocked={isImported || isTournamentStarted}
                                isDraggable={isRound0Unlocked && Boolean(p2)}
                                isDragOver={dragSlotOver === `${match.id}-p2`}
                                onDragStart={(e) => {
                                  if (p2) {
                                    e.dataTransfer.setData('text/plain', p2.id);
                                    e.dataTransfer.effectAllowed = 'move';
                                  }
                                }}
                                onDragOver={(e) => {
                                  if (isRound0Unlocked) {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                    if (dragSlotOver !== `${match.id}-p2`) setDragSlotOver(`${match.id}-p2`);
                                  }
                                }}
                                onDragLeave={() => {
                                  if (dragSlotOver === `${match.id}-p2`) setDragSlotOver(null);
                                }}
                                onDrop={(e) => {
                                  if (isRound0Unlocked) {
                                    e.preventDefault();
                                    setDragSlotOver(null);
                                    const sourceId = e.dataTransfer.getData('text/plain');
                                    if (sourceId && sourceId !== p2?.id && onSwapSeeds && p2) {
                                      onSwapSeeds(sourceId, p2.id);
                                    }
                                  }
                                }}
                                onClick={() => {
                                  if (canCall && onCallMatch) onCallMatch(match);
                                  else if (match.state === 'called' && onViewAnnouncement) onViewAnnouncement(match);
                                }}
                                onPlayerClick={onPlayerClick}
                              />
                            </>
                          );
                        })()}

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

                        {match.state === 'called' && isHovered && (
                          <div
                            className="flex items-center justify-center gap-1 py-1 text-xs tracking-widest cursor-pointer bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-t border-amber-500/30 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onViewAnnouncement) onViewAnnouncement(match);
                              else onCallMatch(match);
                            }}
                            style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              fontWeight: 700,
                              fontSize: 10,
                            }}
                          >
                            <Radio size={11} className="animate-pulse" />
                            VIEW CALLOUT SCREEN
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
  isDraggable,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver,
  isLocked,
}: {
  player: Player | null;
  score: number;
  isWinner: boolean;
  isCompleted: boolean;
  theme: GameTheme;
  isSearched?: boolean;
  onClick?: () => void;
  onPlayerClick?: (id: string) => void;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragOver?: boolean;
  isLocked?: boolean;
}) {
  if (!player) {
    return (
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex items-center gap-2 px-3 py-1.5 h-[29px] transition-colors ${
          isDragOver ? 'bg-cyan-500/20 ring-1 ring-cyan-400' : ''
        }`}
      >
        <span className="text-xs opacity-30 italic font-mono text-[11px]">TBD / BYE</span>
      </div>
    );
  }

  const countryBadge = player.countryFlag ? (
    <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-400/90 uppercase shrink-0">
      {player.countryFlag}
    </span>
  ) : null;

  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex items-center justify-between px-3 py-1.5 h-[29px] transition-colors ${
        isDragOver
          ? 'bg-cyan-500/25 ring-2 ring-cyan-400'
          : isSearched
          ? 'bg-cyan-500/15'
          : isWinner
          ? 'bg-white/[0.03]'
          : ''
      }`}
      style={{ opacity: isCompleted && !isWinner ? 0.45 : 1 }}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {isDraggable && (
          <GripVertical
            size={11}
            className="text-gray-500 hover:text-white cursor-grab active:cursor-grabbing shrink-0"
            title="Drag to swap bracket spot"
          />
        )}
        {player.seed !== undefined && player.seed !== null && (
          <span
            className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-gray-400 shrink-0 min-w-[24px] text-center tabular-nums"
          >
            <span>{player.seed}</span>
            {isLocked && <Lock size={8} className="text-amber-400/80" />}
          </span>
        )}
        {countryBadge}
        <button
          onClick={(e) => {
            if (player.fbUserId && onPlayerClick) {
              e.stopPropagation();
              onPlayerClick(player.fbUserId);
            } else if (onClick) {
              onClick();
            }
          }}
          className={`flex items-center gap-1 text-left transition-colors min-w-0 flex-1 ${player.fbUserId ? 'hover:text-cyan-300 cursor-pointer' : ''
            }`}
        >
          <span
            className="text-sm truncate leading-snug flex items-center gap-1"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: isWinner || isSearched ? 800 : isCompleted ? 500 : 600,
              color: isSearched ? '#00FF88' : isWinner ? theme.primaryColor : 'var(--foreground)',
              textDecoration: player.fbUserId ? 'underline' : 'none',
              textDecorationColor: `${theme.primaryColor}80`,
              textDecorationThickness: '1px',
              textUnderlineOffset: '2px',
            }}
          >
            {player.tag}
            {isSearched && <Sparkles size={11} className="text-cyan-400 animate-pulse shrink-0" />}
          </span>
        </button>
      </div>
      <span
        className="text-sm tabular-nums ml-2 shrink-0 font-bold"
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: isWinner ? 800 : isCompleted ? 500 : 600,
          color: isWinner ? theme.primaryColor : score > 0 ? 'var(--foreground)' : 'rgba(122,158,192,0.4)'
        }}
      >
        {score}
      </span>
    </div>
  );
}

function BracketSeedInput({ player, onUpdateSeed }: { player: Player; onUpdateSeed?: (id: string, seed: number) => void }) {
  const [seedInput, setSeedInput] = useState<string>(String(player.seed));

  useEffect(() => {
    setSeedInput(String(player.seed));
  }, [player.seed]);

  const commitSeed = () => {
    const val = parseInt(seedInput, 10);
    if (!isNaN(val) && val >= 1) {
      if (val !== player.seed && onUpdateSeed) {
        onUpdateSeed(player.id, val);
      }
    } else {
      setSeedInput(String(player.seed));
    }
  };

  if (!onUpdateSeed) {
    return <span className="text-xs font-mono font-bold text-gray-400">#{player.seed}</span>;
  }

  return (
    <input
      type="number"
      min="1"
      max="999"
      value={seedInput}
      onChange={(e) => setSeedInput(e.target.value)}
      onBlur={commitSeed}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commitSeed();
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="w-12 px-1.5 py-0.5 rounded text-xs tabular-nums text-center font-mono font-bold bg-black/50 border border-white/15 focus:border-[#00E5FF] focus:outline-none transition-all text-white"
      title="Click to edit seed number (hotswaps duplicate seeds)"
    />
  );
}
