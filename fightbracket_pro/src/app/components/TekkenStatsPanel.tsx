import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow, format } from 'date-fns';
import { RefreshCw, Swords, Trophy, TrendingUp, Shield, Zap, AlertCircle } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface TekkenMatch {
  id?: string;
  player_character?: string;
  character?: string;
  opponent_character?: string;
  opponent_name?: string;
  player_rank?: string;
  opponent_rank?: string;
  battle_type?: string;
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
  tekkenPower?: number;
  winRate?: number;
  totalMatches?: number;
  total_matches?: number;
  region?: string;
  mainChar?: string;
  characters?: { name: string; rankName: string }[];
  glicko_mu?: string | number;
  glicko_sigma?: string | number;
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
  steamId?: string | null;
  psnId?: string | null;
  xboxId?: string | null;
  gamerTag?: string | null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function getCharacterPortraitUrl(charName: string | undefined): string | null {
  if (!charName) return null;
  const formatted = charName.toLowerCase().replace(/\s+/g, '-');
  return `https://raw.githubusercontent.com/pbruvoll/tekkendocs/main/app/images/t8/avatars/${formatted}-brand-256.webp`;
}

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

function cleanRankText(rankName: string | undefined): string {
  if (!rankName) return 'Unranked';
  return rankName.replace(/\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)+$/i, '');
}

function getRankImageUrl(rankName: string | undefined): string | null {
  if (!rankName || rankName.toLowerCase() === 'unranked') return null;
  
  const cleanName = cleanRankText(rankName);
  
  const formatted = cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  return `https://raw.githubusercontent.com/ewgf-gg/ewgfgg-frontend/main/static/rank-icons/${formatted}T8.webp`;
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
  return cleanRankText(profile.rankName || profile.rank_name);
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

function MatchRow({ match, index, playerName }: { match: TekkenMatch; index: number; playerName: string }) {
  const isWin = (match.result || '').toUpperCase() === 'WIN';
  const playerChar = getPlayerChar(match);
  const oppChar = match.opponent_character || '?';

  const playerImg = getCharacterPortraitUrl(playerChar);
  const oppImg = getCharacterPortraitUrl(oppChar);

  const playerRank = match.player_rank || 'Unranked';
  const oppRank = match.opponent_rank || 'Unranked';
  const oppName = match.opponent_name || 'Unknown';
  
  const scoreStr = `${match.rounds_won || 0}-${match.rounds_lost || 0}`;
  const battleType = match.battle_type || 'Ranked Match';

  const ts = match.timestamp;
  const d = ts ? (typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts)) : null;
  const timeAgo = d && !isNaN(d.getTime()) ? formatDistanceToNow(d, { addSuffix: true }) : '';
  const exactTime = d && !isNaN(d.getTime()) ? format(d, 'MMM d, yyyy, h:mm a') : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="grid grid-cols-[140px_minmax(180px,2fr)_minmax(180px,2fr)_80px_80px_minmax(120px,1.5fr)] gap-4 items-center px-4 py-3 bg-[#111620] border-b border-white/5 hover:bg-[#161c28] transition-colors min-w-[900px]"
    >
      {/* Date */}
      <div className="flex flex-col">
        <span className="text-[13px] font-bold text-gray-200">{timeAgo}</span>
        <span className="text-[11px] text-gray-500 mt-0.5">{exactTime}</span>
      </div>

      {/* Player */}
      <div className="flex items-center gap-3">
        {playerImg ? (
          <img src={playerImg} alt={playerChar} className="w-10 h-10 object-cover rounded shadow" />
        ) : (
          <div className="w-10 h-10 rounded bg-[#1A202C] border border-[#2A3441] flex items-center justify-center text-xs font-bold text-gray-500">
            {playerChar.substring(0, 3)}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-gray-200">{playerName}</span>
          <span className="text-[11px] text-gray-400 mt-0.5">{playerRank}</span>
        </div>
      </div>

      {/* Opponent */}
      <div className="flex items-center gap-3">
        {oppImg ? (
          <img src={oppImg} alt={oppChar} className="w-10 h-10 object-cover rounded shadow" />
        ) : (
          <div className="w-10 h-10 rounded bg-[#1A202C] border border-[#2A3441] flex items-center justify-center text-xs font-bold text-gray-500">
            {oppChar.substring(0, 3)}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-[#60A5FA] truncate max-w-[120px]">{oppName}</span>
          <span className="text-[11px] text-gray-400 mt-0.5">{oppRank}</span>
        </div>
      </div>

      {/* Result */}
      <div className={`text-[13px] font-bold ${isWin ? 'text-[#00FF88]' : 'text-[#EF4444]'}`}>
        {isWin ? 'WIN' : 'LOSS'}
      </div>

      {/* Score */}
      <div className={`text-[13px] font-bold ${isWin ? 'text-[#00FF88]' : 'text-[#EF4444]'}`}>
        {scoreStr}
      </div>

      {/* Battle Type */}
      <div className="text-[13px] font-medium text-gray-300">
        {battleType}
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────

export function TekkenStatsPanel({ tekkenId, compact = false, steamId, psnId, xboxId, gamerTag }: TekkenStatsPanelProps) {
  const [data, setData] = useState<TekkenStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);

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

  useEffect(() => {
    if (data?.profile?.mainChar && !selectedChar) {
      setSelectedChar(data.profile.mainChar);
    }
  }, [data, selectedChar]);

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

  const mainCharName = selectedChar || data?.profile?.mainChar || data?.derived?.top_characters?.[0]?.name;
  const selectedCharObj = data?.profile?.characters?.find((c: any) => c.name === mainCharName);
  const rankName = selectedCharObj ? selectedCharObj.rankName : (data?.profile ? getRankName(data.profile) : null);
  
  const rankPoints = data?.profile ? getRankPoints(data.profile) : null;
  const playerName = data?.profile ? getPlayerName(data.profile) : null;
  const rankColor = getRankColor(rankName ?? undefined);
  const rankImageUrl = getRankImageUrl(rankName ?? undefined);
  const charPortrait = getCharacterPortraitUrl(mainCharName);
  
  const derived = data?.derived || { wins: 0, losses: 0, win_rate: 0, top_characters: [] };
  const meta = data?.meta || {};
  const matches = data?.matches || [];

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-end -mt-2 mb-2">
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
          {/* ── 3-Column Profile Layout ── */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-xl overflow-hidden p-4 border grid grid-cols-1 md:grid-cols-3 gap-6 items-center"
            style={{
              borderColor: `${rankColor}30`,
              background: `linear-gradient(135deg, ${rankColor}08 0%, rgba(5,10,20,0.95) 100%)`,
            }}
          >
            {/* Glow */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at top left, ${rankColor}40, transparent 70%)`,
              }}
            />

            {/* Column 1: Character Portrait & Stats */}
            <div className="relative flex flex-col gap-3 items-center md:items-start z-10 w-full">
              {data?.profile?.characters && data.profile.characters.length > 1 && (
                <div className="w-full max-w-[200px] mt-1 mb-1">
                  <select
                    className="bg-black/80 border border-white/20 rounded-md text-xs font-bold font-mono text-white px-3 py-1.5 focus:outline-none focus:border-cyan-400 appearance-none pr-8 cursor-pointer w-full"
                    value={selectedChar || ''}
                    onChange={e => setSelectedChar(e.target.value)}
                  >
                    {data.profile.characters.map((c: any) => (
                      <option key={c.name} value={c.name}>
                        {c.name.toUpperCase()} - {cleanRankText(c.rankName)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="w-full max-w-[200px] aspect-[4/3] rounded-lg overflow-hidden bg-[#0A101C] border border-white/5 relative flex items-center justify-center">
                {charPortrait ? (
                  <img src={charPortrait} alt={mainCharName} className="w-full h-full object-cover opacity-90 drop-shadow-xl" />
                ) : (
                  <span className="font-mono text-gray-600 text-xs">No Character Info</span>
                )}
                {/* Gradient overlay at the bottom of the portrait */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#050A14] to-transparent" />
                <div className="absolute bottom-2 left-0 w-full text-center">
                  <span className="text-[10px] font-bold tracking-widest text-white/80 drop-shadow-md">
                    {mainCharName?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
              </div>
              <div className="w-full max-w-[200px]">
                <WinRateBar winRate={derived.win_rate || 0} wins={derived.wins || 0} losses={derived.losses || 0} />
              </div>
            </div>

            {/* Column 2: Player Info */}
            <div className="flex flex-col items-center justify-center border-y md:border-y-0 md:border-x border-white/5 py-5 md:py-0 px-2 gap-3 text-center relative z-10 w-full h-full">
              <h2 className="text-2xl font-bold text-white tracking-widest font-rajdhani">{playerName || gamerTag || tekkenId}</h2>
              
              <div className="flex flex-col items-center gap-1.5 mt-1">
                {tekkenId && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-500 w-16 text-right">TEKKEN ID</span>
                    <span className="text-xs font-mono text-white/80 bg-white/5 px-2 py-0.5 rounded">{tekkenId}</span>
                  </div>
                )}
                {steamId && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-500 w-16 text-right">STEAM</span>
                    <span className="text-xs font-mono text-white/80 bg-white/5 px-2 py-0.5 rounded">{steamId}</span>
                  </div>
                )}
                {psnId && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-500 w-16 text-right">PSN</span>
                    <span className="text-xs font-mono text-white/80 bg-white/5 px-2 py-0.5 rounded">{psnId}</span>
                  </div>
                )}
                {xboxId && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-500 w-16 text-right">XBOX</span>
                    <span className="text-xs font-mono text-white/80 bg-white/5 px-2 py-0.5 rounded">{xboxId}</span>
                  </div>
                )}
                {data?.profile?.glicko_mu && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10 w-full justify-center">
                    <span className="text-[10px] font-mono text-[#00E5FF] w-16 text-right">GLICKO-2</span>
                    <span className="text-xs font-bold font-mono text-white bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/20 shadow-[0_0_10px_rgba(0,229,255,0.1)]">
                      {data.profile.glicko_mu} <span className="text-gray-500 font-normal">±{data.profile.glicko_sigma}</span>
                    </span>
                  </div>
                )}
              </div>
              
              {/* Region */}
              {data.profile?.region && (
                <div className="mt-2 flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#00E5FF', boxShadow: '0 0 8px #00E5FF' }}></span>
                  {data.profile.region}
                </div>
              )}
            </div>

            {/* Column 3: Rank & Prowess */}
            <div className="flex flex-col items-center justify-center gap-2 relative z-10 w-full py-2">
              <div
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative"
              >
                {rankImageUrl ? (
                  <img src={rankImageUrl} alt={rankName || 'Rank'} className="w-full h-full object-contain p-2 drop-shadow-[0_0_12px_rgba(0,0,0,0.6)]" />
                ) : (
                  <Trophy size={40} style={{ color: rankColor }} />
                )}
              </div>
              
              <div className="text-center mt-2">
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
                  {selectedCharObj ? 'Character Rank' : 'All Time Highest Rank'}
                </div>
                <div className="text-lg sm:text-xl font-bold font-rajdhani tracking-widest" style={{ color: rankColor }}>
                  {cleanRankText(rankName)}
                </div>
              </div>

              {rankPoints !== null && (
                <div className="mt-3 flex items-center gap-2 text-sm font-mono text-white/90 bg-[#050A14] border border-white/10 px-4 py-1.5 rounded-lg shadow-lg">
                  <span className="text-[10px] text-gray-500 tracking-widest">PROWESS</span>
                  <span className="font-bold">{rankPoints.toLocaleString()}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Top Characters ── */}
          {derived.top_characters && derived.top_characters.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-gray-400 tracking-widest mb-2 flex items-center gap-1">
                <Zap size={10} /> MOST PLAYED
              </div>
              <div className="flex gap-2 flex-wrap">
                {derived.top_characters.map((char, i) => (
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
          {meta.rate_limit_remaining !== undefined && (
            <div className="flex items-center gap-1.5">
              <TrendingUp size={10} className="text-gray-600" />
              <span className="text-[10px] font-mono text-gray-600">
                {meta.rate_limit_remaining} API calls remaining today
                {meta.tier && ` · ${meta.tier} tier`}
              </span>
            </div>
          )}

          {/* ── Recent Matches ── */}
          {matches.length > 0 && (
            <div className="mt-4 border border-white/5 rounded-lg overflow-hidden bg-[#0A0D14]">
              <div className="overflow-x-auto">
                <div className="grid grid-cols-[140px_minmax(180px,2fr)_minmax(180px,2fr)_80px_80px_minmax(120px,1.5fr)] gap-4 px-4 py-3 text-[12px] font-semibold text-gray-400 border-b border-white/5 min-w-[900px] bg-[#0A0D14]">
                  <div>Date</div>
                  <div>Player</div>
                  <div>Opponent</div>
                  <div>Result</div>
                  <div>Score</div>
                  <div>Battle Type</div>
                </div>
                <div className="flex flex-col">
                  {matches.slice(0, compact ? 5 : 10).map((match, i) => (
                    <MatchRow 
                      key={match.id || i} 
                      match={match} 
                      index={i} 
                      playerName={data?.profile?.playerName || gamerTag || 'Player'} 
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {matches.length === 0 && !error && (
            <div className="text-center text-xs font-mono text-gray-600 py-4">
              No recent match history found.
            </div>
          )}
        </>
      )}
    </div>
  );
}
