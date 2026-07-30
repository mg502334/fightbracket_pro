import React, { useState } from 'react';
import { BracketMatch, Player, GameTheme, getMatchIdentifier } from '../data/tournamentData';
import { Users, Plus, LayoutGrid, CheckCircle2 } from 'lucide-react';

interface PoolsPanelProps {
  matches: BracketMatch[];
  players: Player[];
  theme: GameTheme;
  isHost: boolean;
  onUpdateMatches?: (matches: BracketMatch[]) => void;
}

export function PoolsPanel({ matches, players, theme, isHost, onUpdateMatches }: PoolsPanelProps) {
  const [newPoolName, setNewPoolName] = useState('');
  
  // Extract unique pools from matches
  const availablePools = Array.from(new Set(matches.map(m => m.pool).filter(Boolean))) as string[];
  
  // Find players not assigned to any pool yet
  // In our simplified logic, players in matches that have a pool are in that pool.
  const poolByPlayer = new Map<string, string>();
  matches.forEach(m => {
    if (m.pool) {
      if (m.player1Id) poolByPlayer.set(m.player1Id, m.pool);
      if (m.player2Id) poolByPlayer.set(m.player2Id, m.pool);
    }
  });

  const unassignedPlayers = players.filter(p => !poolByPlayer.has(p.id));

  // Handle adding a pool (by creating a dummy match for it, or just assigning a player)
  // Since we don't have a standalone 'Pools' data structure, we can just assign selected players to a new pool label.
  const handleCreatePool = () => {
    if (!newPoolName.trim() || !onUpdateMatches) return;
    // Just a UI mock action if we don't have players to assign immediately.
    // Real implementation would save the pool to a state or assign an empty match.
    // For now, we'll just require selecting players to assign to a pool.
    alert("Select players and assign them to a new pool.");
  };

  const handleAssignToPool = (playerId: string, poolName: string) => {
    if (!onUpdateMatches) return;
    
    // In a real app, pools would dictate bracket generation.
    // Since matches are already generated, we just label all matches for this player with this pool.
    // This is simplified. Normally, pools are formed *before* bracket generation.
    const updatedMatches = matches.map(m => {
      if (m.player1Id === playerId || m.player2Id === playerId) {
        return { ...m, pool: poolName };
      }
      return m;
    });
    onUpdateMatches(updatedMatches);
  };

  const getPoolStats = (poolName: string) => {
    const poolMatches = matches.filter(m => m.pool === poolName);
    const completed = poolMatches.filter(m => m.state === 'completed').length;
    const total = poolMatches.length;
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  return (
    <div className="p-6 h-full overflow-auto max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-[#050A14]/80 border p-6 rounded-xl" style={{ borderColor: `${theme.primaryColor}30` }}>
        <div>
          <h2 className="text-3xl font-bold font-rajdhani flex items-center gap-3" style={{ color: theme.primaryColor }}>
            <LayoutGrid size={28} /> POOLS
          </h2>
          <p className="text-xs font-mono mt-1 opacity-60">Manage and view tournament pools.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pools List */}
        <div className="md:col-span-2 space-y-6">
          {availablePools.length === 0 ? (
            <div className="bg-[#111] border border-gray-800 rounded-lg p-10 text-center text-gray-500 font-mono text-sm flex flex-col items-center justify-center">
              <LayoutGrid size={48} className="mb-4 opacity-20" />
              <p>No pools found for this tournament.</p>
              {isHost && <p className="mt-2 text-xs opacity-50">Assign players to pools to generate pool brackets.</p>}
            </div>
          ) : (
            availablePools.sort().map(pool => {
              const stats = getPoolStats(pool);
              const poolPlayers = players.filter(p => poolByPlayer.get(p.id) === pool);
              
              return (
                <div key={pool} className="bg-[#050A14] border rounded-xl overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="px-6 py-4 border-b flex justify-between items-center bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div className="font-rajdhani font-bold text-xl tracking-widest text-white">
                      POOL {pool}
                    </div>
                    <div className="text-xs font-mono">
                      <span className="opacity-50">MATCHES: </span>
                      <span style={{ color: stats.completed === stats.total ? '#00FF88' : 'white' }}>
                        {stats.completed}/{stats.total}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-1 bg-black w-full">
                    <div className="h-full transition-all" style={{ width: `${stats.percent}%`, background: stats.percent === 100 ? '#00FF88' : theme.primaryColor }} />
                  </div>

                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {poolPlayers.map(p => (
                      <div key={p.id} className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded border border-white/5 text-sm">
                        <span className="text-xs opacity-30 font-mono w-4">{p.seed}</span>
                        <span className="font-rajdhani truncate">{p.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Unassigned Players (Host only) */}
        {isHost && (
          <div className="space-y-4">
            <div className="bg-[#050A14] border border-gray-800 rounded-xl p-6">
              <h3 className="font-rajdhani font-bold text-lg tracking-widest text-white mb-4 border-b border-gray-800 pb-2 flex justify-between items-center">
                UNASSIGNED <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded">{unassignedPlayers.length}</span>
              </h3>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {unassignedPlayers.length === 0 ? (
                  <div className="text-xs font-mono text-center opacity-40 py-4">All players assigned.</div>
                ) : (
                  unassignedPlayers.map(p => (
                    <div key={p.id} className="flex flex-col gap-2 p-3 bg-[#111] border border-gray-800 hover:border-gray-700 rounded transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-xs opacity-50 font-mono">{p.seed}</span>
                        <span className="font-rajdhani font-bold text-white">{p.tag}</span>
                      </div>
                      <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
                        {['A', 'B', 'C', 'D'].map(poolName => (
                          <button 
                            key={poolName}
                            onClick={() => handleAssignToPool(p.id, poolName)}
                            className="text-[10px] font-mono px-2 py-1 bg-white/5 hover:bg-white/20 rounded transition-colors whitespace-nowrap"
                          >
                            To {poolName}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
