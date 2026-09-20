import React, { useState, useMemo } from 'react';
import { BracketMatch, Player, GameTheme, getChronologicalRoundName } from '../data/tournamentData';
import {
  Users, LayoutGrid, CheckCircle2, Shuffle, ArrowRight,
  ChevronDown, Lock, Eye, Layers, ChevronRight
} from 'lucide-react';

interface PoolsPanelProps {
  matches: BracketMatch[];
  players: Player[];
  theme: GameTheme;
  isHost: boolean;
  onUpdateMatches?: (matches: BracketMatch[]) => void;
  onSelectPool?: (pool: string) => void;
  isImported?: boolean;
}

const POOL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

// Lock Banner
const LockBanner = () => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono">
    <Lock size={12} />
    <span>Pool configuration is locked for imported tournaments.</span>
  </div>
);

export function PoolsPanel({
  matches,
  players,
  theme,
  isHost,
  onUpdateMatches,
  onSelectPool,
  isImported = false,
}: PoolsPanelProps) {
  const [poolCount, setPoolCount] = useState(4);
  const [selectedPoolView, setSelectedPoolView] = useState<string>('SEE_ALL');
  const [expandedPoolCard, setExpandedPoolCard] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<string | null>(null);

  // ── Derive phase/pool structure from match data ──────────────────────────
  const { phases, phaseMap, poolsByPlayerId, availablePools, unassignedPlayers } = useMemo(() => {
    // Build phase → pools map from match data
    const phasePoolMap = new Map<string, Set<string>>(); // phaseName → Set of pool IDs
    const poolsByPlayerId = new Map<string, string>();    // playerId → pool displayIdentifier
    const phaseOrder = new Map<string, number>();

    matches.forEach(m => {
      const phaseName = m.phase || 'Pools';
      const poolId = m.pool;
      if (!phasePoolMap.has(phaseName)) phasePoolMap.set(phaseName, new Set());
      if (poolId) {
        phasePoolMap.get(phaseName)!.add(poolId);
        if (m.player1Id) poolsByPlayerId.set(m.player1Id, poolId);
        if (m.player2Id) poolsByPlayerId.set(m.player2Id, poolId);
      }
    });

    // Derive phase order: pools phase first, then top N phases, then finals
    const sortedPhases = Array.from(phasePoolMap.keys()).sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      // "pools" first
      if (aLower.includes('pool') && !bLower.includes('pool')) return -1;
      if (!aLower.includes('pool') && bLower.includes('pool')) return 1;
      // Then by numeric suffix if any (e.g. "Top 24" > "Top 8")
      const aNum = parseInt(a.replace(/\D/g, '')) || 0;
      const bNum = parseInt(b.replace(/\D/g, '')) || 0;
      return bNum - aNum; // larger number = earlier stage
    });
    sortedPhases.forEach((p, i) => phaseOrder.set(p, i));

    // Build a flat pool map: poolId → { phase, players }
    const phaseMap = new Map<string, string[]>(); // phase → sorted pool IDs
    sortedPhases.forEach(phase => {
      const pools = Array.from(phasePoolMap.get(phase) || []).sort();
      phaseMap.set(phase, pools);
    });

    // If no pool data (manual tournament), fallback to generated pools
    let allAvailablePools: string[] = [];
    if (phasePoolMap.size === 0) {
      // Manual mode: derive from matches.pool field or generate
      const fromMatches = Array.from(new Set(matches.map(m => m.pool).filter(Boolean))) as string[];
      allAvailablePools = fromMatches.length > 0 ? fromMatches.sort() : [];

      if (allAvailablePools.length === 0 && isImported && players.length > 0) {
        const numPools = Math.min(8, Math.max(2, Math.ceil(players.length / 16)));
        for (let i = 0; i < numPools; i++) allAvailablePools.push(POOL_LABELS[i] ?? `Pool ${i + 1}`);
        players.forEach((p, idx) => {
          const poolLabel = POOL_LABELS[idx % numPools] ?? `Pool ${idx % numPools + 1}`;
          poolsByPlayerId.set(p.id, poolLabel);
        });
      } else {
        matches.forEach(m => {
          if (m.pool) {
            if (m.player1Id) poolsByPlayerId.set(m.player1Id, m.pool);
            if (m.player2Id) poolsByPlayerId.set(m.player2Id, m.pool);
          }
        });
      }
    } else {
      phaseMap.forEach(pools => pools.forEach(p => allAvailablePools.push(p)));
    }

    const unassigned = players.filter(p => !poolsByPlayerId.has(p.id));

    return {
      phases: sortedPhases,
      phaseMap,
      poolsByPlayerId,
      availablePools: allAvailablePools,
      unassignedPlayers: unassigned,
    };
  }, [matches, players, isImported]);

  // Active phase — default to first
  const resolvedPhase = activePhase ?? (phases.length > 0 ? phases[0] : null);
  const currentPhasePoolIds = resolvedPhase ? (phaseMap.get(resolvedPhase) ?? []) : availablePools;

  const getPoolStats = (poolId: string) => {
    const poolMatches = matches.filter(m => m.pool === poolId);
    const completed = poolMatches.filter(m => m.state === 'completed').length;
    const total = poolMatches.length;
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getPoolPlayers = (poolId: string): Player[] =>
    players.filter(p => poolsByPlayerId.get(p.id) === poolId);

  const handleAutoGenerate = () => {
    if (isImported || !onUpdateMatches || players.length === 0) return;
    const sorted = [...players].sort((a, b) => a.seed - b.seed);
    const assignments = new Map<string, string>();
    sorted.forEach((p, i) => {
      const poolLabel = POOL_LABELS[i % poolCount] ?? `Pool${i % poolCount + 1}`;
      assignments.set(p.id, poolLabel);
    });
    const updated = matches.map(m => ({
      ...m,
      pool: m.player1Id && assignments.has(m.player1Id)
        ? assignments.get(m.player1Id)
        : m.player2Id && assignments.has(m.player2Id)
        ? assignments.get(m.player2Id)
        : m.pool,
    }));
    onUpdateMatches(updated);
  };

  const handleAssignToPool = (playerId: string, poolName: string) => {
    if (isImported || !onUpdateMatches) return;
    const updated = matches.map(m => {
      if (m.player1Id === playerId || m.player2Id === playerId) return { ...m, pool: poolName };
      return m;
    });
    onUpdateMatches(updated);
  };

  const handleClearPools = () => {
    if (isImported || !onUpdateMatches) return;
    onUpdateMatches(matches.map(m => ({ ...m, pool: undefined })));
  };

  // ── No pools configured ──────────────────────────────────────────────────
  if (availablePools.length === 0 && currentPhasePoolIds.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div
          className="flex justify-between items-center p-6 rounded-xl border"
          style={{ background: `linear-gradient(135deg, ${theme.bgFrom} 0%, #050A14 60%)`, borderColor: `${theme.primaryColor}30` }}
        >
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3" style={{ fontFamily: 'Rajdhani, sans-serif', color: theme.primaryColor }}>
              <LayoutGrid size={28} /> POOLS
            </h2>
            <p className="text-xs mt-1 opacity-60" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Seed players into pools before bracket play.
            </p>
          </div>
          {isImported && <LockBanner />}
        </div>

        <div className="rounded-xl border p-8 flex flex-col items-center gap-6" style={{ background: '#050A14', borderColor: 'rgba(255,255,255,0.08)' }}>
          <LayoutGrid size={52} className="opacity-20" style={{ color: theme.primaryColor }} />
          <div className="text-center">
            <div className="text-xl font-bold mb-1" style={{ fontFamily: 'Rajdhani, sans-serif', color: theme.primaryColor }}>
              No Pools Configured
            </div>
            <p className="text-sm opacity-50" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {isImported
                ? 'Imported tournaments use pre-configured pool data from Start.gg.'
                : 'Auto-generate pools by seeding players evenly across pool groups.'}
            </p>
          </div>

          {isImported ? (
            <LockBanner />
          ) : isHost ? (
            <>
              <div className="flex items-center gap-4">
                <label className="text-xs opacity-60 tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>POOL COUNT</label>
                <div className="flex gap-2">
                  {[2, 4, 8].map(n => (
                    <button
                      key={n}
                      onClick={() => setPoolCount(n)}
                      className="px-4 py-1.5 rounded text-sm font-bold transition-all"
                      style={{
                        fontFamily: 'Rajdhani, sans-serif',
                        background: poolCount === n ? theme.primaryColor : 'rgba(255,255,255,0.06)',
                        color: poolCount === n ? '#000' : 'var(--foreground)',
                        border: `1px solid ${poolCount === n ? theme.primaryColor : 'rgba(255,255,255,0.1)'}`,
                      }}
                    >{n}</button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAutoGenerate}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold tracking-widest transition-all hover:opacity-90 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`, color: '#000', fontFamily: 'Rajdhani, sans-serif' }}
              >
                <Shuffle size={16} /> AUTO-GENERATE POOLS
              </button>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  // ── Individual pool view matches & players ───────────────────────────────
  const currentPoolMatches = selectedPoolView !== 'SEE_ALL' ? matches.filter(m => m.pool === selectedPoolView) : [];
  const currentPoolPlayers = selectedPoolView !== 'SEE_ALL' ? getPoolPlayers(selectedPoolView) : [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* ── Top Header ── */}
      <div
        className="flex flex-wrap justify-between items-center p-5 rounded-xl border gap-4"
        style={{ background: `linear-gradient(135deg, ${theme.bgFrom} 0%, #050A14 60%)`, borderColor: `${theme.primaryColor}30` }}
      >
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3" style={{ fontFamily: 'Rajdhani, sans-serif', color: theme.primaryColor }}>
            <LayoutGrid size={28} /> POOLS
          </h2>
          <p className="text-xs mt-1 opacity-60 font-mono">
            {currentPhasePoolIds.length} pool{currentPhasePoolIds.length !== 1 ? 's' : ''} · {players.length} entrants
          </p>
        </div>

        {isHost && (
          <div className="flex items-center gap-2">
            {isImported ? (
              <LockBanner />
            ) : (
              <>
                <button
                  onClick={handleAutoGenerate}
                  className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold font-mono tracking-wider transition-all hover:opacity-80"
                  style={{ background: `${theme.primaryColor}20`, color: theme.primaryColor, border: `1px solid ${theme.primaryColor}40` }}
                >
                  <Shuffle size={12} /> RESEED
                </button>
                <button
                  onClick={handleClearPools}
                  className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold font-mono opacity-50 hover:opacity-80 transition-all border border-white/15"
                >
                  CLEAR
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Phase Tabs (for multi-stage imported events) ── */}
      {phases.length > 1 && (
        <div className="flex flex-wrap gap-2 items-center">
          {phases.map((phase, i) => {
            const isActive = (activePhase ?? phases[0]) === phase;
            const poolIds = phaseMap.get(phase) ?? [];
            return (
              <React.Fragment key={phase}>
                <button
                  onClick={() => { setActivePhase(phase); setSelectedPoolView('SEE_ALL'); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all border"
                  style={{
                    background: isActive ? `${theme.primaryColor}25` : 'rgba(255,255,255,0.04)',
                    color: isActive ? theme.primaryColor : 'rgba(255,255,255,0.5)',
                    borderColor: isActive ? `${theme.primaryColor}50` : 'rgba(255,255,255,0.08)',
                  }}
                >
                  {phase}
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1"
                    style={{ background: isActive ? `${theme.primaryColor}30` : 'rgba(255,255,255,0.08)' }}
                  >
                    {poolIds.length > 1 ? `${poolIds.length} pools` : poolIds[0] || '1 pool'}
                  </span>
                </button>
                {i < phases.length - 1 && (
                  <ChevronRight size={14} className="opacity-30" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* ── Pool View Navigator (SEE ALL + individual pool tabs) ── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedPoolView('SEE_ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
            selectedPoolView === 'SEE_ALL'
              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
              : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
          }`}
        >
          SEE ALL POOLS
        </button>
        {currentPhasePoolIds.map(pool => (
          <button
            key={pool}
            onClick={() => setSelectedPoolView(pool)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
              selectedPoolView === pool
                ? 'text-black border-transparent font-bold'
                : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
            }`}
            style={selectedPoolView === pool ? { background: theme.primaryColor, borderColor: theme.primaryColor } : {}}
          >
            POOL {pool}
          </button>
        ))}
      </div>

      {/* ── MODE 1: INDIVIDUAL POOL VIEW ── */}
      {selectedPoolView !== 'SEE_ALL' ? (
        <div className="space-y-6">
          <div className="p-5 rounded-xl border bg-[#050A14] space-y-4" style={{ borderColor: `${theme.primaryColor}40` }}>
            <div className="flex justify-between items-center border-b pb-3 border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base font-rajdhani"
                  style={{ background: `${theme.primaryColor}20`, color: theme.primaryColor }}
                >
                  {selectedPoolView}
                </div>
                <div>
                  <h3 className="text-xl font-bold font-rajdhani text-white">POOL {selectedPoolView}</h3>
                  {resolvedPhase && (
                    <p className="text-xs font-mono opacity-40">{resolvedPhase} · {currentPoolPlayers.length} entrants</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => onSelectPool?.(selectedPoolView)}
                className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all flex items-center gap-1.5"
              >
                OPEN IN MAIN BRACKET <ArrowRight size={14} />
              </button>
            </div>

            {/* Entrants */}
            <div>
              <div className="text-xs font-mono opacity-60 mb-2 font-bold tracking-wider">ENTRANTS IN POOL {selectedPoolView}:</div>
              <div className="flex flex-wrap gap-2">
                {currentPoolPlayers.map(p => (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono">
                    <span className="opacity-40">#{p.seed}</span>
                    <span className="font-bold font-rajdhani text-white">{p.countryFlag} {p.tag}</span>
                  </div>
                ))}
                {currentPoolPlayers.length === 0 && (
                  <p className="text-xs font-mono opacity-40">No players assigned to this pool yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Pool bracket view */}
          <div className="p-5 rounded-xl border bg-[#050A14] space-y-6" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <h4 className="text-sm font-bold font-mono tracking-widest flex items-center gap-2" style={{ color: theme.primaryColor }}>
              <Layers size={14} /> POOL {selectedPoolView} BRACKET
            </h4>
            <SinglePoolBracketView
              matches={currentPoolMatches}
              players={currentPoolPlayers}
              theme={theme}
              poolName={selectedPoolView}
            />
          </div>
        </div>

      ) : (
        /* ── MODE 2: SEE ALL POOLS MASTER VIEW ── */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {currentPhasePoolIds.map(pool => {
              const stats = getPoolStats(pool);
              const poolPlayers = getPoolPlayers(pool);
              const isExpanded = expandedPoolCard === pool;

              return (
                <div
                  key={pool}
                  className="rounded-xl border overflow-hidden transition-all"
                  style={{ background: '#050A14', borderColor: isExpanded ? `${theme.primaryColor}60` : 'rgba(255,255,255,0.08)' }}
                >
                  <button
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedPoolCard(isExpanded ? null : pool)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold font-rajdhani"
                        style={{ background: `${theme.primaryColor}20`, color: theme.primaryColor }}
                      >
                        {pool}
                      </div>
                      <div className="text-left">
                        <div className="font-bold tracking-widest text-sm font-rajdhani">POOL {pool}</div>
                        <div className="text-xs opacity-40 font-mono">{poolPlayers.length} players</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {stats.percent === 100 ? (
                        <CheckCircle2 size={14} style={{ color: '#00FF88' }} />
                      ) : (
                        <span className="text-xs font-mono opacity-50">{stats.completed}/{stats.total}</span>
                      )}
                      <ChevronDown
                        size={14}
                        className="opacity-40 transition-transform"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}
                      />
                    </div>
                  </button>

                  {/* Progress bar */}
                  <div className="h-0.5 bg-black w-full">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${stats.percent}%`, background: stats.percent === 100 ? '#00FF88' : theme.primaryColor }}
                    />
                  </div>

                  {/* Player list */}
                  <div className={`transition-all overflow-hidden ${isExpanded ? 'max-h-[600px]' : 'max-h-[190px]'}`}>
                    <div className="p-3 space-y-1.5">
                      {poolPlayers.slice(0, isExpanded ? undefined : 4).map(p => (
                        <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
                          <span className="text-xs opacity-30 w-5 text-right font-mono">{p.seed}</span>
                          <span className="flex-1 text-sm font-semibold truncate font-rajdhani">{p.tag}</span>
                          <span className="text-xs opacity-40">{p.countryFlag}</span>
                        </div>
                      ))}

                      {!isExpanded && poolPlayers.length > 4 && (
                        <button
                          className="w-full text-center text-xs opacity-40 py-1 hover:opacity-70 transition-opacity font-mono"
                          onClick={() => setExpandedPoolCard(pool)}
                        >
                          +{poolPlayers.length - 4} more
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedPoolView(pool)}
                        className="w-full mt-2 py-2 flex items-center justify-center gap-1.5 text-xs font-bold font-mono rounded transition-all hover:brightness-125"
                        style={{
                          background: `${theme.primaryColor}18`,
                          color: theme.primaryColor,
                          border: `1px solid ${theme.primaryColor}35`,
                        }}
                      >
                        <Eye size={12} /> VIEW POOL BRACKET →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unassigned players (manual only) */}
          {unassignedPlayers.length > 0 && isHost && !isImported && (
            <div className="rounded-xl border p-6 bg-[#050A14] border-amber-500/20">
              <h3 className="font-bold tracking-widest text-sm mb-4 flex items-center gap-2 font-rajdhani text-amber-400">
                <Users size={14} />
                UNASSIGNED PLAYERS
                <span className="text-xs font-mono bg-amber-500/20 px-2 py-0.5 rounded ml-1">{unassignedPlayers.length}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {unassignedPlayers.map(p => (
                  <div key={p.id} className="p-3 rounded-lg border bg-amber-500/5 border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs opacity-50 font-mono">{p.seed}</span>
                      <span className="font-bold text-sm font-rajdhani">{p.tag}</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {currentPhasePoolIds.map(poolName => (
                        <button
                          key={poolName}
                          onClick={() => handleAssignToPool(p.id, poolName)}
                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-all hover:scale-105"
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            background: `${theme.primaryColor}15`,
                            color: theme.primaryColor,
                            border: `1px solid ${theme.primaryColor}30`,
                          }}
                        >
                          <ArrowRight size={8} /> {poolName}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Single Pool Bracket Viewer ───────────────────────────────────────────────
function SinglePoolBracketView({
  matches,
  players,
  theme,
  poolName,
}: {
  matches: BracketMatch[];
  players: Player[];
  theme: GameTheme;
  poolName: string;
}) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-10 opacity-40 font-mono text-xs">
        No matches recorded yet for Pool {poolName}.
      </div>
    );
  }

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));
  const winnersMatches = matches.filter(m => m.round > 0);
  const losersMatches = matches.filter(m => m.round < 0);

  const renderSection = (sectionMatches: BracketMatch[], isLosers: boolean) => {
    if (sectionMatches.length === 0) return null;
    const rounds = Array.from(new Set(sectionMatches.map(m => m.round))).sort((a, b) => isLosers ? b - a : a - b);
    const totalRounds = rounds.length;

    return (
      <div className="flex gap-8 min-w-max pb-4 overflow-x-auto custom-scrollbar">
        {rounds.map((round, rIdx) => {
          const roundMatches = sectionMatches.filter(m => m.round === round);
          const roundName = getChronologicalRoundName(rIdx, totalRounds, isLosers, false);

          return (
            <div key={round} className="flex flex-col min-w-[220px]">
              <div className="text-center text-xs font-mono font-bold tracking-widest mb-4" style={{ color: theme.primaryColor, opacity: 0.85 }}>
                {roundName}
              </div>
              <div className="flex flex-col justify-around flex-1 gap-4">
                {roundMatches.map(m => {
                  const p1 = m.player1Id ? playerMap[m.player1Id] : null;
                  const p2 = m.player2Id ? playerMap[m.player2Id] : null;

                  return (
                    <div key={m.id} className="rounded-lg overflow-hidden border bg-black/40 border-white/10">
                      <div className="flex justify-between text-[10px] font-mono opacity-40 px-2.5 pt-2 pb-1 border-b border-white/5">
                        <span>{m.roundName || `Match ${m.matchNumber}`}</span>
                        <span>BO{m.bestOf}</span>
                      </div>
                      {[{ player: p1, score: m.player1Score, id: m.player1Id }, { player: p2, score: m.player2Score, id: m.player2Id }].map((slot, si) => (
                        <div
                          key={si}
                          className={`flex justify-between items-center px-2.5 py-2 text-xs font-rajdhani ${si === 0 ? '' : 'border-t border-white/5'}`}
                        >
                          <span className={`truncate ${m.winnerId === slot.id ? 'font-bold text-cyan-400' : 'opacity-70'}`}>
                            {slot.player ? `${slot.player.countryFlag} ${slot.player.tag}` : 'TBD'}
                          </span>
                          <span className="font-mono font-bold ml-2 text-[11px]">{slot.score ?? ''}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {winnersMatches.length > 0 && (
        <div>
          <div className="text-[10px] font-mono font-bold tracking-widest opacity-50 mb-3">WINNERS BRACKET</div>
          {renderSection(winnersMatches, false)}
        </div>
      )}
      {losersMatches.length > 0 && (
        <div>
          <div className="text-[10px] font-mono font-bold tracking-widest opacity-50 mb-3 text-red-400">LOSERS BRACKET</div>
          {renderSection(losersMatches, true)}
        </div>
      )}
    </div>
  );
}
