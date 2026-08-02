import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Swords, Trophy, TrendingUp, Shield, Zap, AlertCircle } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface TekkenMatch {
  id?: string;
  player_character?: string;
  character?: string;
  opponent_character?: string;
  result?: string;
  timestamp?: number | string;
  stage?: string;
  rounds_won?: number;
  rounds_lost?: number;
}

interface TekkenProfile {
  playerName?: string;
  player_name?: string;
  rankName?: string;
  rank_name?: string;
  rankPoints?: number;
  rank_points?: number;
  winRate?: number;
  totalMatches?: number;
  total_matches?: number;
}

interface TekkenDerived {
  wins: number;
  losses: number;
  win_rate: number;
  top_characters: { name: string; count: number }[];
}

interface TekkenMeta {
  rate_limit_remaining?: number;
  tier?: string;
}

interface TekkenStatsData {
  status: string;
  tekken_id: string;
  profile: TekkenProfile;
  matches: TekkenMatch[];
  meta: TekkenMeta;
  derived: TekkenDerived;
}

interface TekkenStatsPanelProps {
  tekkenId: string | null | undefined;
  /** If true, shows a minimal/compact layout (e.g. inside a modal) */
  compact?: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function getRankColor(rankName: string | undefined): string {
  if (!rankName) return '#00E5FF';
  const r = rankName.toLowerCase();
  if (r.includes('tekken')) return '#FF8C00';
  if (r.includes('divine') || r.includes('god')) return '#FFD700';
  if (r.includes('fujin') || r.includes('bushin')) return '#C084FC';
  if (r.includes('byakko') || r.includes('tenryu')) return '#60A5FA';
  if (r.includes('blue')) return '#3B82F6';
  if (r.includes('green')) return '#22C55E';
  if (r.includes('yellow')) return '#EAB308';
  if (r.includes('orange')) return '#F97316';
  if (r.includes('red')) return '#EF4444';
  return '#00E5FF';
}

function formatTimestamp(ts: number | string | undefined): string {
  if (!ts) return '';
  const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getPlayerName(profile: TekkenProfile): string {
  return profile.playerName || profile.player_name || '';
}

function getRankName(profile: TekkenProfile): string {
  return profile.rankName || profile.rank_name || 'Unranked';
}

function getRankPoints(profile: TekkenProfile): number | null {
  return profile.rankPoints ?? profile.rank_points ?? null;
}

function getPlayerChar(match: TekkenMatch): string {
  return match.player_character || match.character || '?';
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────

function WinRateBar({ winRate, wins, losses }: { winRate: number; wins: number; losses: number }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] font-mono text-gray-400 tracking-widest">WIN RATE</span>
        <span
          className="text-sm font-bold font-mono"
          style={{ color: winRate >= 50 ? '#00FF88' : '#FF006E' }}
        >
          {winRate}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${winRate}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background:
              winRate >= 50
                ? 'linear-gradient(90deg, #00FF88, #00E5FF)'
                : 'linear-gradient(90deg, #FF006E, #FF4500)',
          }}
        />
      </div>
      <div className="flex gap-4 mt-1.5">
        <span className="text-[10px] font-mono text-[#00FF88]">{wins}W</span>
        <span className="text-[10px] font-mono text-[#FF006E]">{losses}L</span>
        <span className="text-[10px] font-mono text-gray-500">{wins + losses} total</span>
      </div>
    </div>
  );
}

function MatchRow({ match, index }: { match: TekkenMatch; index: number }) {
  const isWin = (match.result || '').toUpperCase() === 'WIN';
  const playerChar = getPlayerChar(match);
  const oppChar = match.opponent_character || '?';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: isWin ? '#00FF88' : '#FF006E' }}
        />
        <span className="text-xs font-mono text-white truncate">
          <span style={{ color: '#00E5FF' }}>{playerChar}</span>
          <span className="text-gray-500 mx-1">vs</span>
          <span className="text-gray-300">{oppChar}</span>
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {match.timestamp && (
          <span className="text-[10px] font-mono text-gray-600">
            {formatTimestamp(match.timestamp)}
          </span>
        )}
        <span
          className="text-[10px] font-bold font-mono px-2 py-0.5 rounded"
          style={{
            color: isWin ? '#00FF88' : '#FF006E',
            background: isWin ? 'rgba(0,255,136,0.1)' : 'rgba(255,0,110,0.1)',
            border: `1px solid ${isWin ? 'rgba(0,255,136,0.25)' : 'rgba(255,0,110,0.25)'}`,
          }}
        >
          {isWin ? 'WIN' : 'LOSS'}
        </span>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────

export function TekkenStatsPanel({ tekkenId, compact = false }: TekkenStatsPanelProps) {
  const [data, setData] = useState<TekkenStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!tekkenId || !tekkenId.trim()) return;
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch(`/api/tekken/stats/${encodeURIComponent(tekkenId.trim())}`);
      if (res.status === 404) throw new Error('Player not found in EWGF database. Check your Tekken ID.');
      if (res.status === 429) throw new Error('API rate limit reached. Try again in a minute.');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${res.status}`);
      }
      const json: TekkenStatsData = await res.json();
      setData(json);
      setLastSynced(new Date().toLocaleTimeString());
    } catch (e: any) {
      setError(e.message || 'Failed to fetch Tekken stats');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [tekkenId]);

  useEffect(() => {
    if (tekkenId) {
      setLoading(true);
      fetchStats();
    }
  }, [tekkenId, fetchStats]);

  // ── No Tekken ID ──
  if (!tekkenId || !tekkenId.trim()) {
    return (
      <div
        className={`rounded-xl border border-dashed border-white/10 text-center py-8 px-4 space-y-2 ${compact ? '' : 'bg-[#050A14]'}`}
      >
        <p className="text-xs font-mono text-gray-500">No Tekken 8 ID linked to this profile.</p>
      </div>
    );
  }

  // ── Loading skeleton ──
  if (loading && !data) {
    return (
      <div className={`rounded-xl border border-[#ff003c]/20 bg-[#050A14] p-5 space-y-4 ${compact ? '' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const rankName = data ? getRankName(data.profile) : null;
  const rankPoints = data ? getRankPoints(data.profile) : null;
  const playerName = data ? getPlayerName(data.profile) : null;
  const rankColor = getRankColor(rankName ?? undefined);

  return (
    <div
      className={`rounded-xl border bg-[#050A14] space-y-5 overflow-hidden ${compact ? 'p-4' : 'p-5'}`}
      style={{ borderColor: 'rgba(255,0,60,0.25)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3
            className={`font-bold font-rajdhani tracking-widest ${compact ? 'text-base' : 'text-lg'}`}
            style={{ color: '#ff003c' }}
          >
            TEKKEN 8 STATS
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {lastSynced && (
            <span className="text-[10px] font-mono text-gray-600 hidden sm:block">
              Synced {lastSynced}
            </span>
          )}
          <button
            onClick={fetchStats}
            disabled={syncing}
            className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 hover:bg-white/5 text-gray-400 hover:text-white transition-all disabled:opacity-40"
            title="Refresh Tekken stats"
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Error state ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs font-mono text-red-400"
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {data && (
        <>
          {/* ── Rank Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-xl overflow-hidden p-4 border"
            style={{
              borderColor: `${rankColor}30`,
              background: `linear-gradient(135deg, ${rankColor}12 0%, rgba(5,10,20,0.9) 100%)`,
            }}
          >
            {/* Glow */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at top left, ${rankColor}40, transparent 70%)`,
              }}
            />
            <div className="relative flex items-center justify-between gap-3">
              <div>
                {playerName && (
                  <div className="text-[10px] font-mono text-gray-500 mb-0.5 tracking-wider">
                    {tekkenId}
                  </div>
                )}
                <div
                  className="text-xl font-bold font-rajdhani tracking-widest"
                  style={{ color: rankColor }}
                >
                  {rankName || 'Unranked'}
                </div>
                {rankPoints !== null && (
                  <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                    {rankPoints.toLocaleString()} RP
                  </div>
                )}
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${rankColor}15`, border: `1px solid ${rankColor}30` }}
              >
                <Trophy size={22} style={{ color: rankColor }} />
              </div>
            </div>
          </motion.div>

          {/* ── Win Rate ── */}
          <WinRateBar
            winRate={data.derived.win_rate}
            wins={data.derived.wins}
            losses={data.derived.losses}
          />

          {/* ── Top Characters ── */}
          {data.derived.top_characters.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-gray-400 tracking-widest mb-2 flex items-center gap-1">
                <Zap size={10} /> MOST PLAYED
              </div>
              <div className="flex gap-2 flex-wrap">
                {data.derived.top_characters.map((char, i) => (
                  <motion.div
                    key={char.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border"
                    style={{
                      background: i === 0 ? 'rgba(255,0,60,0.12)' : 'rgba(255,255,255,0.04)',
                      borderColor: i === 0 ? 'rgba(255,0,60,0.35)' : 'rgba(255,255,255,0.08)',
                      color: i === 0 ? '#ff6b8a' : '#9ca3af',
                    }}
                  >
                    {i === 0 && <Shield size={10} />}
                    <span className="font-bold">{char.name}</span>
                    <span className="opacity-50">×{char.count}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── Rate Limit Badge ── */}
          {data.meta.rate_limit_remaining !== undefined && (
            <div className="flex items-center gap-1.5">
              <TrendingUp size={10} className="text-gray-600" />
              <span className="text-[10px] font-mono text-gray-600">
                {data.meta.rate_limit_remaining} API calls remaining today
                {data.meta.tier && ` · ${data.meta.tier} tier`}
              </span>
            </div>
          )}

          {/* ── Recent Matches ── */}
          {data.matches.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-gray-400 tracking-widest mb-2 flex items-center gap-1">
                RECENT MATCHES
              </div>
              <div className="space-y-1.5">
                {data.matches.slice(0, compact ? 5 : 10).map((match, i) => (
                  <MatchRow key={match.id || i} match={match} index={i} />
                ))}
              </div>
            </div>
          )}

          {data.matches.length === 0 && !error && (
            <div className="text-center text-xs font-mono text-gray-600 py-4">
              No recent match history found.
            </div>
          )}
        </>
      )}
    </div>
  );
}
