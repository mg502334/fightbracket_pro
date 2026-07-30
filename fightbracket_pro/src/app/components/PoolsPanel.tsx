import React, { useState } from 'react';
import { BracketMatch, Player, GameTheme } from '../data/tournamentData';
import { Users, LayoutGrid, CheckCircle2, Shuffle, Plus, ArrowRight, ChevronDown } from 'lucide-react';

interface PoolsPanelProps {
  matches: BracketMatch[];
  players: Player[];
  theme: GameTheme;
  isHost: boolean;
  onUpdateMatches?: (matches: BracketMatch[]) => void;
  onSelectPool?: (pool: string) => void;
  isImported?: boolean;
}

const POOL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function PoolsPanel({ matches, players, theme, isHost, onUpdateMatches, onSelectPool, isImported }: PoolsPanelProps) {
  const [poolCount, setPoolCount] = useState(4);
  const [expandedPool, setExpandedPool] = useState<string | null>(null);

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
    // Auto map players to derived pools
    players.forEach((p, idx) => {
      const poolLabel = POOL_LABELS[idx % numPools] ?? `Pool ${idx % numPools + 1}`;
      poolsByMatch.set(p.id, poolLabel);
    });
  }

  availablePools.sort();

  const unassignedPlayers = players.filter(p => !poolsByMatch.has(p.id));

  // Auto-generate pools by seeding players snake-style
  const handleAutoGenerate = () => {
    if (!onUpdateMatches || players.length === 0) return;
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
    if (!onUpdateMatches) return;
    const updated = matches.map(m => {
      if (m.player1Id === playerId || m.player2Id === playerId) {
        return { ...m, pool: poolName };
      }
      return m;
    });
    onUpdateMatches(updated);
  };

  const handleClearPools = () => {
    if (!onUpdateMatches) return;
    onUpdateMatches(matches.map(m => ({ ...m, pool: undefined })));
  };

  const getPoolStats = (poolName: string) => {
    const poolMatches = matches.filter(m => m.pool === poolName);
    const completed = poolMatches.filter(m => m.state === 'completed').length;
    const total = poolMatches.length;
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getPoolPlayers = (poolName: string): Player[] => {
    return players.filter(p => poolsByMatch.get(p.id) === poolName);
  };

  // No pools yet
  if (availablePools.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
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
          <div className="flex items-center gap-2 text-sm opacity-60" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            <Users size={14} />
            {players.length} ENTRANTS
          </div>
        </div>

        {/* Create Pools */}
        {isHost ? (
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
                Auto-generate pools by seeding players evenly across pool groups.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-xs opacity-60 tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                POOL COUNT
              </label>
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
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs opacity-40 text-center" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {players.length} players → {poolCount} pools of ~{Math.ceil(players.length / poolCount)} each
              </div>
            </div>

            <button
              onClick={handleAutoGenerate}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold tracking-widest transition-all hover:opacity-90 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                color: '#000',
                fontFamily: 'Rajdhani, sans-serif',
              }}
            >
              <Shuffle size={16} />
              AUTO-GENERATE POOLS
            </button>
          </div>
        ) : (
          <div
            className="rounded-xl border p-10 text-center"
            style={{ background: '#050A14', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <LayoutGrid size={48} className="mx-auto mb-4 opacity-20" />
            <p className="opacity-50 text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              No pools have been created for this tournament yet.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Pools exist — display them
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div
        className="flex flex-wrap justify-between items-center p-6 rounded-xl border gap-4"
        style={{ background: `linear-gradient(135deg, ${theme.bgFrom} 0%, #050A14 60%)`, borderColor: `${theme.primaryColor}30` }}
      >
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3" style={{ fontFamily: 'Rajdhani, sans-serif', color: theme.primaryColor }}>
            <LayoutGrid size={28} /> POOLS
          </h2>
          <p className="text-xs mt-1 opacity-60" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {availablePools.length} pools · {players.length} entrants
          </p>
        </div>

        {isHost && (
          <div className="flex gap-2">
            <button
              onClick={handleAutoGenerate}
              className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold tracking-widest transition-all hover:opacity-80"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                background: `${theme.primaryColor}20`,
                color: theme.primaryColor,
                border: `1px solid ${theme.primaryColor}40`,
              }}
            >
              <Shuffle size={12} /> RESEED
            </button>
            <button
              onClick={handleClearPools}
              className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold tracking-widest opacity-50 hover:opacity-80 transition-all"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              CLEAR
            </button>
          </div>
        )}
      </div>

      {/* Pool Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {availablePools.map(pool => {
          const stats = getPoolStats(pool);
          const poolPlayers = getPoolPlayers(pool);
          const isExpanded = expandedPool === pool;

          return (
            <div
              key={pool}
              className="rounded-xl border overflow-hidden transition-all"
              style={{ background: '#050A14', borderColor: isExpanded ? `${theme.primaryColor}60` : 'rgba(255,255,255,0.08)' }}
            >
              {/* Pool header */}
              <button
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                onClick={() => setExpandedPool(isExpanded ? null : pool)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ background: `${theme.primaryColor}20`, color: theme.primaryColor, fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    {pool}
                  </div>
                  <div className="text-left">
                    <div className="font-bold tracking-widest text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      POOL {pool}
                    </div>
                    <div className="text-xs opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
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

              {/* Players list */}
              <div className={`transition-all overflow-hidden ${isExpanded ? 'max-h-[600px]' : 'max-h-[180px]'}`}>
                <div className="p-3 space-y-1.5">
                  {poolPlayers.slice(0, isExpanded ? undefined : 4).map(p => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <span className="text-xs opacity-30 w-5 text-right" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {p.seed}
                      </span>
                      <span className="flex-1 text-sm font-semibold truncate" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                        {p.tag}
                      </span>
                      <span className="text-xs opacity-40">{p.countryFlag}</span>
                    </div>
                  ))}
                  {!isExpanded && poolPlayers.length > 4 && (
                    <button
                      className="w-full text-center text-xs opacity-40 py-1 hover:opacity-70 transition-opacity"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                      onClick={() => setExpandedPool(pool)}
                    >
                      +{poolPlayers.length - 4} more
                    </button>
                  )}
                  {onSelectPool && (
                    <button
                      onClick={() => onSelectPool(pool)}
                      className="w-full mt-2 py-2 flex items-center justify-center gap-1 text-xs font-bold font-mono rounded transition-all hover:brightness-125"
                      style={{
                        background: `${theme.primaryColor}18`,
                        color: theme.primaryColor,
                        border: `1px solid ${theme.primaryColor}35`,
                      }}
                    >
                      VIEW POOL BRACKET <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Unassigned Players */}
      {unassignedPlayers.length > 0 && isHost && (
        <div className="rounded-xl border p-6" style={{ background: '#050A14', borderColor: 'rgba(255,150,0,0.25)' }}>
          <h3 className="font-bold tracking-widest text-sm mb-4 flex items-center gap-2" style={{ fontFamily: 'Rajdhani, sans-serif', color: '#FFA500' }}>
            <Users size={14} />
            UNASSIGNED PLAYERS
            <span className="text-xs font-mono bg-orange-500/20 px-2 py-0.5 rounded ml-1">{unassignedPlayers.length}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unassignedPlayers.map(p => (
              <div
                key={p.id}
                className="p-3 rounded-lg border"
                style={{ background: 'rgba(255,165,0,0.06)', borderColor: 'rgba(255,165,0,0.2)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs opacity-50 font-mono">{p.seed}</span>
                  <span className="font-bold text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{p.tag}</span>
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
  );
}
