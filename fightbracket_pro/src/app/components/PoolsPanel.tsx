import React, { useState } from 'react';
import { BracketMatch, Player, GameTheme, getChronologicalRoundName } from '../data/tournamentData';
import { Users, LayoutGrid, CheckCircle2, Shuffle, ArrowRight, ChevronDown, Lock, Eye, Layers } from 'lucide-react';

interface PoolsPanelProps {
  matches: BracketMatch[];
  players: Player[];
  theme: GameTheme;
  isHost: boolean;
  onUpdateMatches?: (matches: BracketMatch[]) => void;
  onSelectPool?: (pool: string) => void;
  isImported?: boolean;
  onPlayerClick?: (playerId: string) => void;
}

const POOL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function PoolsPanel({
  matches,
  players,
  theme,
  isHost,
  onUpdateMatches,
  onSelectPool,
  isImported = false,
  onPlayerClick,
}: PoolsPanelProps) {
  const [poolCount, setPoolCount] = useState(4);
  const [selectedPoolView, setSelectedPoolView] = useState<string>('SEE_ALL');
  const [expandedPoolCard, setExpandedPoolCard] = useState<string | null>(null);

  // Extract unique pools from matches
  const poolsByMatch = new Map<string, string>();
  matches.forEach(m => {
    if (m.pool) {
      if (m.player1Id) poolsByMatch.set(m.player1Id, m.pool);
      if (m.player2Id) poolsByMatch.set(m.player2Id, m.pool);
    }
  });

  // For imported events where pool is not explicitly assigned per match, derive pool groups from player seeds
  let availablePools = Array.from(new Set(matches.map(m => m.pool).filter(Boolean))) as string[];

  if (availablePools.length === 0 && isImported && players.length > 0) {
    const numPools = Math.min(8, Math.max(2, Math.ceil(players.length / 16)));
    for (let i = 0; i < numPools; i++) {
      const poolLabel = POOL_LABELS[i] ?? `Pool ${i + 1}`;
      availablePools.push(poolLabel);
    }
    players.forEach((p, idx) => {
      const poolLabel = POOL_LABELS[idx % numPools] ?? `Pool ${idx % numPools + 1}`;
      poolsByMatch.set(p.id, poolLabel);
    });
  }

  availablePools.sort();
  const unassignedPlayers = players.filter(p => !poolsByMatch.has(p.id));

  // Auto-generate pools by seeding players (Manual tournaments only)
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
      if (m.player1Id === playerId || m.player2Id === playerId) {
        return { ...m, pool: poolName };
      }
      return m;
    });
    onUpdateMatches(updated);
  };

  const handleClearPools = () => {
    if (isImported || !onUpdateMatches) return;
    onUpdateMatches(matches.map(m => ({ ...m, pool: undefined })));
  };

  const getPoolStats = (poolName: string, phaseName?: string) => {
    const poolMatches = matches.filter(m => {
      const matchPhase = m.phase || 'Pools';
      return m.pool === poolName && (!phaseName || matchPhase === phaseName);
    });
    const completed = poolMatches.filter(m => m.state === 'completed').length;
    const total = poolMatches.length;
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getPoolPlayers = (poolName: string, phaseName?: string): Player[] => {
    if (isImported) {
      const poolMatchPlayers = new Set<string>();
      matches.forEach(m => {
        const matchPhase = m.phase || 'Pools';
        if (m.pool === poolName && (!phaseName || matchPhase === phaseName)) {
          if (m.player1Id) poolMatchPlayers.add(m.player1Id);
          if (m.player2Id) poolMatchPlayers.add(m.player2Id);
        }
      });
      return players.filter(p => poolMatchPlayers.has(p.id));
    }
    return players.filter(p => poolsByMatch.get(p.id) === poolName);
  };

  // Lock Banner component for imported events
  const LockBanner = () => (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono">
      <Lock size={12} />
      <span>Pool configuration is locked for imported tournaments.</span>
    </div>
  );

  // If no pools configured yet
  if (availablePools.length === 0) {
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

        {/* Create Pools (Locked if imported) */}
        <div
          className="rounded-xl border p-8 flex flex-col items-center gap-6"
          style={{ background: '#050A14', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <LayoutGrid size={52} className="opacity-20" style={{ color: theme.primaryColor }} />
          <div className="text-center">
            <div className="text-xl font-bold mb-1" style={{ fontFamily: 'Rajdhani, sans-serif', color: theme.primaryColor }}>
              No Pools Configured
            </div>
            <p className="text-sm opacity-50" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {isImported ? "Imported tournaments use pre-configured pool data from Start.gg." : "Auto-generate pools by seeding players evenly across pool groups."}
            </p>
          </div>

          {isImported ? (
            <LockBanner />
          ) : isHost ? (
            <>
              <div className="flex items-center gap-4">
                <label className="text-xs opacity-60 tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  POOL COUNT
                </label>
                <div className="flex gap-2">
                  {[1, 2, 4, 8].map(n => (
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
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAutoGenerate}
                disabled={isImported}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold tracking-widest transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                  color: '#000',
                  fontFamily: 'Rajdhani, sans-serif',
                }}
                title={isImported ? "Pool configuration is locked for imported tournaments." : "Generate pools"}
              >
                <Shuffle size={16} />
                AUTO-GENERATE POOLS
              </button>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  // Active view: Individual Pool vs See All
  const currentPoolMatches = selectedPoolView !== 'SEE_ALL' 
    ? matches.filter(m => m.pool === selectedPoolView)
    : [];

  const currentPoolPlayers = selectedPoolView !== 'SEE_ALL'
    ? getPoolPlayers(selectedPoolView)
    : [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 overflow-y-auto pb-20">
      {/* Top Header & Pool View Navigator Bar */}
      <div
        className="flex flex-wrap justify-between items-center p-6 rounded-xl border gap-4"
        style={{ background: `linear-gradient(135deg, ${theme.bgFrom} 0%, #050A14 60%)`, borderColor: `${theme.primaryColor}30` }}
      >
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3" style={{ fontFamily: 'Rajdhani, sans-serif', color: theme.primaryColor }}>
            <LayoutGrid size={28} /> POOLS
          </h2>
          <p className="text-xs mt-1 opacity-60 font-mono">
            {availablePools.length} pools · {players.length} entrants
          </p>
        </div>

        {/* Individual Pool vs See All Navigation Tabs */}
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
          {availablePools.map(pool => (
            <button
              key={pool}
              onClick={() => setSelectedPoolView(pool)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                selectedPoolView === pool
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                  : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
              }`}
            >
              POOL {pool}
            </button>
          ))}
        </div>

        {/* Host Control Actions (Locked if imported) */}
        {isHost && (
          <div className="flex items-center gap-2">
            {isImported ? (
              <LockBanner />
            ) : (
              <>
                <button
                  onClick={handleAutoGenerate}
                  disabled={isImported}
                  className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold font-mono tracking-wider transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: `${theme.primaryColor}20`,
                    color: theme.primaryColor,
                    border: `1px solid ${theme.primaryColor}40`,
                  }}
                  title={isImported ? "Pool configuration is locked for imported tournaments." : "Reseed pools"}
                >
                  <Shuffle size={12} /> RESEED
                </button>
                <button
                  onClick={handleClearPools}
                  disabled={isImported}
                  className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold font-mono opacity-50 hover:opacity-80 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/15"
                  title={isImported ? "Pool configuration is locked for imported tournaments." : "Clear pools"}
                >
                  CLEAR
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── MODE 1: INDIVIDUAL POOL VIEW ── */}
      {selectedPoolView !== 'SEE_ALL' ? (
        <div className="space-y-6">
          {/* Individual Pool Overview Card */}
          <div className="p-5 rounded-xl border bg-[#050A14] space-y-4" style={{ borderColor: `${theme.primaryColor}40` }}>
            <div className="flex justify-between items-center border-b pb-3 border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg font-rajdhani"
                  style={{ background: `${theme.primaryColor}20`, color: theme.primaryColor }}
                >
                  {selectedPoolView}
                </div>
                <div>
                  <h3 className="text-xl font-bold font-rajdhani text-white">
                    POOL {selectedPoolView} BRACKET VIEW
                  </h3>
                  <p className="text-xs font-mono opacity-50">
                    Filtered single pool view · {currentPoolPlayers.length} entrants
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onSelectPool?.(selectedPoolView);
                }}
                className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all flex items-center gap-1.5"
              >
                OPEN IN MAIN BRACKET <ArrowRight size={14} />
              </button>
            </div>

            {/* Entrants Pills */}
            <div>
              <div className="text-xs font-mono opacity-60 mb-2 font-bold tracking-wider">ENTRANTS IN POOL {selectedPoolView}:</div>
              <div className="flex flex-wrap gap-2">
                {currentPoolPlayers.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono"
                  >
                    <span className="opacity-40">#{p.seed}</span>
                    <span className="font-bold font-rajdhani text-white">{p.countryFlag} {p.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Individual Pool Single Bracket Render with Strict Chronological Round Order */}
          <div className="p-5 rounded-xl border bg-[#050A14] space-y-6" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <h4 className="text-sm font-bold font-mono tracking-widest text-cyan-400 flex items-center gap-2">
              <Layers size={14} /> POOL {selectedPoolView} CHRONOLOGICAL BRACKET
            </h4>
            <div className="flex-1 overflow-x-auto custom-scrollbar">
              <SinglePoolBracketView
                matches={currentPoolMatches}
                players={currentPoolPlayers}
                theme={theme}
                onPlayerClick={onPlayerClick}
                poolName={selectedPoolView}
              />
            </div>
          </div>
        </div>
      ) : (
        /* ── MODE 2: SEE ALL POOLS MASTER VIEW ── */
        <div className="space-y-8">
          {(() => {
            const poolsByPhase = new Map<string, string[]>();
            if (isImported) {
              matches.forEach(m => {
                if (m.pool) {
                  const p = m.phase || 'Pools';
                  if (!poolsByPhase.has(p)) poolsByPhase.set(p, []);
                  if (!poolsByPhase.get(p)!.includes(m.pool)) {
                    poolsByPhase.get(p)!.push(m.pool);
                  }
                }
              });
              // Sort pools within each phase
              poolsByPhase.forEach(pools => pools.sort());
            } else {
              poolsByPhase.set('Pools', availablePools);
            }

            return Array.from(poolsByPhase.entries()).map(([phase, phasePools]) => (
              <div key={phase} className="space-y-4">
                <h3 className="text-xl tracking-widest font-bold flex items-center gap-2 pb-2 border-b border-white/10" style={{ fontFamily: 'Rajdhani, sans-serif', color: theme.primaryColor }}>
                  <Layers size={20} />
                  {phase.toUpperCase()}
                  <span className="text-xs font-mono opacity-50 font-normal bg-white/5 px-2 py-0.5 rounded">{phasePools.length} brackets</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {phasePools.map(pool => {
              const stats = getPoolStats(pool, phase);
              const poolPlayers = getPoolPlayers(pool, phase);
              const isExpanded = expandedPoolCard === pool;

              return (
                <div
                  key={pool}
                  className="rounded-xl border overflow-hidden transition-all"
                  style={{ background: '#050A14', borderColor: isExpanded ? `${theme.primaryColor}60` : 'rgba(255,255,255,0.08)' }}
                >
                  {/* Pool Header Button */}
                  <button
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedPoolCard(isExpanded ? null : pool)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-rajdhani"
                        style={{ background: `${theme.primaryColor}20`, color: theme.primaryColor }}
                      >
                        {pool}
                      </div>
                      <div className="text-left">
                        <div className="font-bold tracking-widest text-sm font-rajdhani">
                          POOL {pool}
                        </div>
                        <div className="text-xs opacity-40 font-mono">
                          {poolPlayers.length} players
                        </div>
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

                  {/* Player list subset */}
                  <div className={`transition-all ${isExpanded ? 'max-h-[600px] overflow-y-auto' : 'overflow-hidden max-h-[190px]'} custom-scrollbar`}>
                    <div className="p-3 space-y-1.5">
                      {poolPlayers.slice(0, isExpanded ? undefined : 4).map(p => (
                        <button
                          key={p.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5 w-full text-left transition-opacity ${p.fbUserId ? 'hover:opacity-80 cursor-pointer' : ''}`}
                          onClick={(e) => {
                            if (p.fbUserId && onPlayerClick) {
                              e.stopPropagation();
                              onPlayerClick(p.fbUserId);
                            }
                          }}
                        >
                          <span className="text-xs opacity-30 w-5 text-right font-mono">{p.seed}</span>
                          
                          {p.avatarUrl && (
                            <img src={p.avatarUrl} alt={p.tag} className="w-4 h-4 rounded-full object-cover shrink-0 ring-1" style={{ borderColor: theme.primaryColor }} />
                          )}
                          
                          <span 
                            className="flex-1 text-sm font-semibold truncate font-rajdhani"
                            style={p.fbUserId ? { textDecoration: 'underline', textDecorationColor: theme.primaryColor, textUnderlineOffset: '2px' } : undefined}
                          >
                            {p.tag}
                          </span>
                          <span className="text-xs opacity-40">{p.countryFlag}</span>
                        </button>
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
                        <Eye size={12} /> VIEW INDIVIDUAL POOL BRACKET →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
                </div>
              </div>
            ));
          })()}

          {/* Unassigned Players (Manual Tournaments Only) */}
          {unassignedPlayers.length > 0 && isHost && !isImported && (
            <div className="rounded-xl border p-6 bg-[#050A14] border-amber-500/20">
              <h3 className="font-bold tracking-widest text-sm mb-4 flex items-center gap-2 font-rajdhani text-amber-400">
                <Users size={14} />
                UNASSIGNED PLAYERS
                <span className="text-xs font-mono bg-amber-500/20 px-2 py-0.5 rounded ml-1">{unassignedPlayers.length}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {unassignedPlayers.map(p => (
                  <div
                    key={p.id}
                    className="p-3 rounded-lg border bg-amber-500/5 border-amber-500/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs opacity-50 font-mono">{p.seed}</span>
                      <span className="font-bold text-sm font-rajdhani">{p.tag}</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {availablePools.map(poolName => (
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

// Sub-component for rendering a clean Single Pool Bracket with strict Chronological Round Naming
function SinglePoolBracketView({
  matches,
  players,
  theme,
  poolName,
  onPlayerClick,
}: {
  matches: BracketMatch[];
  players: Player[];
  theme: GameTheme;
  poolName: string;
  onPlayerClick?: (id: string) => void;
}) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-10 opacity-40 font-mono text-xs">
        No matches recorded yet for Pool {poolName}.
      </div>
    );
  }

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));
  const isLosers = matches[0]?.round < 0;
  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => isLosers ? b - a : a - b);
  const totalRounds = rounds.length;

  return (
    <div className="flex gap-10 min-w-max pb-4 overflow-x-auto custom-scrollbar">
      {rounds.map((round, rIdx) => {
        const roundMatches = matches.filter(m => m.round === round);
        const roundName = getChronologicalRoundName(rIdx, totalRounds, isLosers, false);

        return (
          <div key={round} className="flex flex-col min-w-[240px]">
            <div
              className="text-center text-xs font-mono font-bold tracking-widest mb-4 truncate"
              style={{ color: theme.primaryColor, opacity: 0.85 }}
            >
              {roundName}
            </div>

            <div className="flex flex-col justify-around flex-1 gap-4">
              {roundMatches.map(m => {
                const p1 = m.player1Id ? playerMap[m.player1Id] : null;
                const p2 = m.player2Id ? playerMap[m.player2Id] : null;

                return (
                  <div
                    key={m.id}
                    className="rounded-lg overflow-hidden border bg-black/40 p-1 space-y-0.5 border-white/10"
                  >
                    <div className="flex justify-between text-[10px] font-mono opacity-50 px-2 pt-1 pb-1">
                      <span>MATCH {m.identifier || m.id.substring(0, 4)}</span>
                      <span>BO{m.bestOf}</span>
                    </div>

                    <button 
                      className={`flex-1 flex justify-between px-2 py-1.5 transition-opacity ${p1?.fbUserId ? 'hover:opacity-80 cursor-pointer' : ''}`}
                      onClick={(e) => { if (p1?.fbUserId && onPlayerClick) { e.stopPropagation(); onPlayerClick(p1.fbUserId); } }}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {p1?.avatarUrl && <img src={p1.avatarUrl} className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />}
                        <span 
                          className="font-bold text-sm font-rajdhani truncate"
                          style={{
                            color: m.winnerId === m.player1Id ? theme.primaryColor : 'var(--foreground)',
                            textDecoration: p1?.fbUserId ? 'underline' : 'none',
                            textDecorationColor: theme.primaryColor
                          }}
                        >
                          {p1?.tag || 'TBD'}
                        </span>
                      </div>
                      <span className="text-sm font-mono opacity-80 pl-2 shrink-0">{m.player1Score}</span>
                    </button>

                    <div className="h-px bg-white/5" />

                    <button 
                      className={`flex-1 flex justify-between px-2 py-1.5 transition-opacity ${p2?.fbUserId ? 'hover:opacity-80 cursor-pointer' : ''}`}
                      onClick={(e) => { if (p2?.fbUserId && onPlayerClick) { e.stopPropagation(); onPlayerClick(p2.fbUserId); } }}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {p2?.avatarUrl && <img src={p2.avatarUrl} className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />}
                        <span 
                          className="font-bold text-sm font-rajdhani truncate"
                          style={{
                            color: m.winnerId === m.player2Id ? theme.primaryColor : 'var(--foreground)',
                            textDecoration: p2?.fbUserId ? 'underline' : 'none',
                            textDecorationColor: theme.primaryColor
                          }}
                        >
                          {p2?.tag || 'TBD'}
                        </span>
                      </div>
                      <span className="text-sm font-mono opacity-80 pl-2 shrink-0">{m.player2Score}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
