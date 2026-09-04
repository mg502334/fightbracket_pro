import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow, format } from 'date-fns';
import { RefreshCw, Swords, Trophy, TrendingUp, Shield, Zap, AlertCircle, ChevronDown } from 'lucide-react';
import { ActivityHeatmapWidget } from './ActivityHeatmapWidget';
import { StatPentagonWidget } from './StatPentagonWidget';
import { GlobalStatisticsWidget } from './GlobalStatisticsWidget';

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
  characters?: { name: string; rankName: string; glicko_mu?: string | number; glicko_sigma?: string | number; games?: number }[];
  character_ratings?: Record<string, { name: string; mu: string; sigma: string; games?: number }>;
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
  profile: TekkenProfile & { pentagon_stats?: any; global_stats?: any };
  matches: TekkenMatch[];
  meta: TekkenMeta;
  derived: TekkenDerived;
  pentagon_stats?: any;
  global_stats?: any;
}

interface TekkenStatsPanelProps {
  tekkenId: string | null | undefined;
  /** If true, shows a minimal/compact layout (e.g. inside a modal) */
  compact?: boolean;
  steamId?: string | null;
  psnId?: string | null;
  xboxId?: string | null;
  gamerTag?: string | null;
  /** Called after a successful stats fetch with the raw match array */
  onMatchesLoaded?: (matches: TekkenMatch[]) => void;
  /** Called after a successful stats fetch with the full unified payload */
  onDataLoaded?: (data: any) => void;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const CHARACTER_PORTRAIT_MAP: Record<string, string> = {
  'alisa': 'alisa',
  'alisa bosconovitch': 'alisa',
  'anna': 'anna',
  'anna williams': 'anna',
  'armor-king': 'armor-king',
  'armor king': 'armor-king',
  'armorking': 'armor-king',
  'asuka': 'asuka',
  'asuka kazama': 'asuka',
  'azucena': 'azucena',
  'azucena ortiz': 'azucena',
  'bryan': 'bryan',
  'bryan fury': 'bryan',
  'claudio': 'claudio',
  'claudio serafino': 'claudio',
  'clive': 'clive',
  'devil jin': 'devil-jin',
  'devil-jin': 'devil-jin',
  'deviljin': 'devil-jin',
  'dragunov': 'dragunov',
  'sergei dragunov': 'dragunov',
  'eddy': 'eddy',
  'eddy gordo': 'eddy',
  'fahkumram': 'fahkumram',
  'feng': 'feng',
  'feng wei': 'feng',
  'heihachi': 'heihachi',
  'heihachi mishima': 'heihachi',
  'hwoarang': 'hwoarang',
  'jack-8': 'jack-8',
  'jack 8': 'jack-8',
  'jack8': 'jack-8',
  'jin': 'jin',
  'jin kazama': 'jin',
  'jun': 'jun',
  'jun kazama': 'jun',
  'kazuya': 'kazuya',
  'kazuya mishima': 'kazuya',
  'king': 'king',
  'kuma': 'kuma',
  'kunimitsu': 'kunimitsu',
  'lars': 'lars',
  'lars alexandersson': 'lars',
  'law': 'law',
  'marshall law': 'law',
  'forest law': 'law',
  'lee': 'lee',
  'lee chaolan': 'lee',
  'leo': 'leo',
  'leo kliesen': 'leo',
  'leroy': 'leroy',
  'leroy smith': 'leroy',
  'lidia': 'lidia',
  'lidia sobieska': 'lidia',
  'lili': 'lili',
  'lili de rochefort': 'lili',
  'emilie de rochefort': 'lili',
  'miary-zo': 'miary-zo',
  'miary zo': 'miary-zo',
  'mokujin': 'mokujin',
  'nina': 'nina',
  'nina williams': 'nina',
  'panda': 'panda',
  'paul': 'paul',
  'paul phoenix': 'paul',
  'raven': 'raven',
  'master raven': 'raven',
  'reina': 'reina',
  'shaheen': 'shaheen',
  'steve': 'steve',
  'steve fox': 'steve',
  'victor': 'victor',
  'victor chevalier': 'victor',
  'xiaoyu': 'xiaoyu',
  'ling xiaoyu': 'xiaoyu',
  'yoshimitsu': 'yoshimitsu',
  'zafina': 'zafina',
};

function getCharacterPortraitUrl(charName: string | undefined): string | null {
  if (!charName || !charName.trim() || charName === '?') return null;
  const key = charName.trim().toLowerCase().replace(/[_\s]+/g, ' ');
  const slug = CHARACTER_PORTRAIT_MAP[key] || charName.trim().toLowerCase().replace(/\s+/g, '-');
  return `https://raw.githubusercontent.com/pbruvoll/tekkendocs/main/app/images/t8/avatars/${slug}-brand-256.webp`;
}

const RANK_ICON_MAP: Record<string, string> = {
  // Beginner
  'beginner': 'Beginner',
  '0': 'Beginner',
  // Dans
  '1st dan': '1stDan',
  '1st_dan': '1stDan',
  '1stdan': '1stDan',
  '1 dan': '1stDan',
  '1st': '1stDan',
  '1': '1stDan',
  '2nd dan': '2ndDan',
  '2nd_dan': '2ndDan',
  '2nddan': '2ndDan',
  '2 dan': '2ndDan',
  '2nd': '2ndDan',
  '2': '2ndDan',
  // Cyan
  'fighter': 'Fighter',
  '3': 'Fighter',
  'strategist': 'Strategist',
  '4': 'Strategist',
  'combatant': 'Combatant',
  '5': 'Combatant',
  // Green
  'brawler': 'Brawler',
  '6': 'Brawler',
  'ranger': 'Ranger',
  '7': 'Ranger',
  'cavalry': 'Cavalry',
  '8': 'Cavalry',
  // Yellow
  'warrior': 'Warrior',
  '9': 'Warrior',
  'assailant': 'Assailant',
  '10': 'Assailant',
  'dominator': 'Dominator',
  '11': 'Dominator',
  // Orange
  'destroyer': 'Destroyer',
  '12': 'Destroyer',
  'eliminator': 'Eliminator',
  '13': 'Eliminator',
  'garyu': 'Garyu',
  '14': 'Garyu',
  // Red
  'shinryu': 'Shinryu',
  '15': 'Shinryu',
  'tenryu': 'Tenryu',
  '16': 'Tenryu',
  // Purple / Ruler
  'mighty ruler': 'MightyRuler',
  'mightyruler': 'MightyRuler',
  '17': 'MightyRuler',
  'flame ruler': 'FlameRuler',
  'flameruler': 'FlameRuler',
  '18': 'FlameRuler',
  'battle ruler': 'BattleRuler',
  'battleruler': 'BattleRuler',
  '19': 'BattleRuler',
  // Blue
  'fujin': 'Fujin',
  '20': 'Fujin',
  'raijin': 'Raijin',
  '21': 'Raijin',
  'kishin': 'Kishin',
  '22': 'Kishin',
  'bushin': 'Bushin',
  '23': 'Bushin',
  // Gold / King
  'tekken king': 'TekkenKing',
  'tekkenking': 'TekkenKing',
  '24': 'TekkenKing',
  'tekken emperor': 'TekkenEmperor',
  'tekkenemperor': 'TekkenEmperor',
  '25': 'TekkenEmperor',
  // Supreme Gold
  'tekken god': 'TekkenGod',
  'tekkengod': 'TekkenGod',
  '26': 'TekkenGod',
  'tekken god supreme': 'TekkenGodSupreme',
  'tekkengodsupreme': 'TekkenGodSupreme',
  '27': 'TekkenGodSupreme',
  // God of Destruction
  'god of destruction': 'GodOfDestruction',
  'godofdestruction': 'GodOfDestruction',
  'god of destruction 1': 'GodOfDestruction1',
  'god of destruction i': 'GodOfDestruction1',
  'godofdestruction1': 'GodOfDestruction1',
  'godofdestructioni': 'GodOfDestruction1',
  'god of destruction 2': 'GodOfDestruction2',
  'god of destruction ii': 'GodOfDestruction2',
  'godofdestruction2': 'GodOfDestruction2',
  'godofdestructionii': 'GodOfDestruction2',
  'god of destruction 3': 'GodOfDestruction3',
  'god of destruction iii': 'GodOfDestruction3',
  'godofdestruction3': 'GodOfDestruction3',
  'godofdestructioniii': 'GodOfDestruction3',
  'god of destruction 4': 'GodOfDestruction4',
  'god of destruction iv': 'GodOfDestruction4',
  'godofdestruction4': 'GodOfDestruction4',
  'godofdestructioniv': 'GodOfDestruction4',
  'god of destruction 5': 'GodOfDestruction5',
  'god of destruction v': 'GodOfDestruction5',
  'godofdestruction5': 'GodOfDestruction5',
  'godofdestructionv': 'GodOfDestruction5',
  'god of destruction 6': 'GodOfDestruction6',
  'god of destruction vi': 'GodOfDestruction6',
  'godofdestruction6': 'GodOfDestruction6',
  'godofdestructionvi': 'GodOfDestruction6',
  'god of destruction 7': 'GodOfDestruction7',
  'god of destruction vii': 'GodOfDestruction7',
  'godofdestruction7': 'GodOfDestruction7',
  'godofdestructionvii': 'GodOfDestruction7',
  'god of destruction 8': 'GodOfDestructionInf',
  'god of destruction viii': 'GodOfDestructionInf',
  'god of destruction inf': 'GodOfDestructionInf',
  'god of destruction infinity': 'GodOfDestructionInf',
  'god of destruction ∞': 'GodOfDestructionInf',
  'godofdestructioninf': 'GodOfDestructionInf',
  '28': 'GodOfDestruction',
  '29': 'GodOfDestruction1',
  '30': 'GodOfDestruction2',
  '31': 'GodOfDestruction3',
  '32': 'GodOfDestruction4',
  '33': 'GodOfDestruction5',
  '34': 'GodOfDestruction6',
  '35': 'GodOfDestruction7',
};

function cleanRankText(rankName: string | undefined): string {
  if (!rankName) return 'Unranked';
  const trimmed = String(rankName).trim();
  if (trimmed.toLowerCase() === 'unranked' || trimmed.toLowerCase() === 'syncing...') return 'Unranked';
  
  // If purely a number, map to Tekken 8 rank title
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && RANK_ICON_MAP[String(num)]) {
    const iconName = RANK_ICON_MAP[String(num)];
    // Insert spaces before capital letters (e.g. MightyRuler -> Mighty Ruler)
    return iconName.replace(/([a-z])([A-Z])/g, '$1 $2').replace('1stDan', '1st Dan').replace('2ndDan', '2nd Dan');
  }

  // Preserve God of Destruction prestige tiers (e.g. God of Destruction V, God of Destruction VI)
  if (trimmed.toLowerCase().includes('god of destruction')) {
    return trimmed;
  }

  // Remove trailing roman numerals (e.g. Garyu I -> Garyu)
  return trimmed.replace(/\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)+$/i, '');
}

function getRankColor(rankName: string | undefined): string {
  if (!rankName) return '#00E5FF';
  const r = rankName.toLowerCase();
  if (r.includes('god of destruction')) return '#FF3D00';
  if (r.includes('supreme') || r.includes('tekken god')) return '#FFD700';
  if (r.includes('king') || r.includes('emperor')) return '#FFAB00';
  if (r.includes('fujin') || r.includes('raijin') || r.includes('kishin') || r.includes('bushin')) return '#3B82F6';
  if (r.includes('ruler')) return '#D500F9';
  if (r.includes('garyu') || r.includes('shinryu') || r.includes('tenryu')) return '#EF4444';
  if (r.includes('destroyer') || r.includes('eliminator')) return '#F97316';
  if (r.includes('warrior') || r.includes('assailant') || r.includes('dominator')) return '#EAB308';
  if (r.includes('brawler') || r.includes('ranger') || r.includes('cavalry')) return '#22C55E';
  if (r.includes('fighter') || r.includes('strategist') || r.includes('combatant')) return '#06B6D4';
  if (r.includes('dan')) return '#94A3B8';
  if (r.includes('beginner')) return '#8D6E63';
  return '#00E5FF';
}

function getRankImageUrl(rankName: string | undefined): string | null {
  if (!rankName) return null;
  const raw = String(rankName).trim();
  const lower = raw.toLowerCase().replace(/_/g, ' ');
  if (lower === 'unranked' || lower === 'syncing...' || lower === 'unknown' || lower === 'none' || lower === '') {
    return null;
  }
  
  // Check direct mapping
  if (RANK_ICON_MAP[lower]) {
    return `https://raw.githubusercontent.com/ewgf-gg/ewgfgg-frontend/main/static/rank-icons/${RANK_ICON_MAP[lower]}T8.webp`;
  }

  // Handle God of Destruction variants
  const godMatch = lower.match(/^god\s*of\s*destruction\s*(vii|vi|iv|v|iii|ii|i|inf|infinity|8|7|6|5|4|3|2|1|∞)?$/i);
  if (godMatch) {
    const tier = (godMatch[1] || '').toLowerCase();
    const tierMap: Record<string, string> = {
      '1': 'GodOfDestruction1', 'i': 'GodOfDestruction1',
      '2': 'GodOfDestruction2', 'ii': 'GodOfDestruction2',
      '3': 'GodOfDestruction3', 'iii': 'GodOfDestruction3',
      '4': 'GodOfDestruction4', 'iv': 'GodOfDestruction4',
      '5': 'GodOfDestruction5', 'v': 'GodOfDestruction5',
      '6': 'GodOfDestruction6', 'vi': 'GodOfDestruction6',
      '7': 'GodOfDestruction7', 'vii': 'GodOfDestruction7',
      '8': 'GodOfDestructionInf', 'viii': 'GodOfDestructionInf',
      'inf': 'GodOfDestructionInf', 'infinity': 'GodOfDestructionInf', '∞': 'GodOfDestructionInf',
    };
    const mapped = tierMap[tier] || 'GodOfDestruction';
    return `https://raw.githubusercontent.com/ewgf-gg/ewgfgg-frontend/main/static/rank-icons/${mapped}T8.webp`;
  }
  
  // Clean roman numerals and retry map
  const clean = cleanRankText(raw).toLowerCase();
  if (RANK_ICON_MAP[clean]) {
    return `https://raw.githubusercontent.com/ewgf-gg/ewgfgg-frontend/main/static/rank-icons/${RANK_ICON_MAP[clean]}T8.webp`;
  }
  
  // Fallback to title-cased concatenation
  const formatted = clean
    .split(/\s+/)
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

  const playerRank = cleanRankText(match.player_rank);
  const oppRank = cleanRankText(match.opponent_rank);
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
          <img 
            src={playerImg} 
            alt={playerChar} 
            className="w-10 h-10 object-cover rounded shadow"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="w-10 h-10 rounded bg-[#1A202C] border border-[#2A3441] items-center justify-center text-xs font-bold text-gray-400"
          style={{ display: playerImg ? 'none' : 'flex' }}
        >
          {playerChar.substring(0, 3).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-gray-200">{playerName}</span>
          <span className="text-[11px] text-gray-400 mt-0.5">{playerRank}</span>
        </div>
      </div>

      {/* Opponent */}
      <div className="flex items-center gap-3">
        {oppImg ? (
          <img 
            src={oppImg} 
            alt={oppChar} 
            className="w-10 h-10 object-cover rounded shadow"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="w-10 h-10 rounded bg-[#1A202C] border border-[#2A3441] items-center justify-center text-xs font-bold text-gray-400"
          style={{ display: oppImg ? 'none' : 'flex' }}
        >
          {oppChar.substring(0, 3).toUpperCase()}
        </div>
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

export function TekkenStatsPanel({ tekkenId, compact = false, steamId, psnId, xboxId, gamerTag, onMatchesLoaded, onDataLoaded }: TekkenStatsPanelProps) {
  const [data, setData] = useState<TekkenStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);

  const fetchStats = useCallback(async (force = false) => {
    if (!tekkenId || !tekkenId.trim()) return;
    setSyncing(true);
    setError(null);
    try {
      const url = `/api/tekken/stats/${encodeURIComponent(tekkenId.trim())}${force ? '?force=true' : ''}`;
      const res = await fetch(url);
      if (res.status === 404) throw new Error('Player not found in EWGF database. Check your Tekken ID.');
      if (res.status === 429) throw new Error('API rate limit reached. Try again in a minute.');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${res.status}`);
      }
      const json: TekkenStatsData = await res.json();
      setData(json);
      setLastSynced(new Date().toLocaleTimeString());
      if (onMatchesLoaded && json.matches) {
        onMatchesLoaded(json.matches);
      }
      if (onDataLoaded) {
        onDataLoaded(json);
      }
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

const ALL_TEKKEN_8_ROSTER = [
  'Alisa', 'Anna', 'Armor King', 'Asuka', 'Azucena', 'Bryan', 'Claudio', 'Clive',
  'Devil Jin', 'Dragunov', 'Eddy', 'Fahkumram', 'Feng', 'Heihachi', 'Hwoarang',
  'Jack-8', 'Jin', 'Jun', 'Kazuya', 'King', 'Kuma', 'Kunimitsu', 'Lars', 'Law',
  'Lee', 'Leo', 'Leroy', 'Lidia', 'Lili', 'Miary Zo', 'Mokujin', 'Nina', 'Panda',
  'Paul', 'Raven', 'Reina', 'Shaheen', 'Steve', 'Victor', 'Xiaoyu', 'Yoshimitsu', 'Zafina'
];

  // 1. Get characters returned from API
  const apiChars = data?.profile?.characters || [];
  
  // 2. Persistent storage for played characters
  let storedChars: string[] = [];
  try {
    const key = `tekken_played_characters_${tekkenId || 'default'}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      storedChars = (JSON.parse(raw) as string[]).filter(
        name => typeof name === 'string' && name.toLowerCase() !== 'jun' && name.toLowerCase() !== 'jun kazama'
      );
    }
  } catch {}

  // 3. Merge API characters and valid stored selections
  const charMap = new Map<string, { name: string; rankName?: string; glicko_mu?: string | number; glicko_sigma?: string | number }>();
  
  apiChars.forEach(c => {
    if (c.name) {
      charMap.set(c.name.trim().toLowerCase(), c);
    }
  });

  // Add any user-selected characters
  storedChars.forEach(name => {
    const key = name.trim().toLowerCase();
    if (!charMap.has(key)) {
      charMap.set(key, {
        name: name,
        rankName: data?.profile?.rankName || 'Beginner'
      });
    }
  });

  const playedCharacters = Array.from(charMap.values());

  // Characters in full roster not yet in played list
  const unplayedRoster = ALL_TEKKEN_8_ROSTER.filter(
    rName => !charMap.has(rName.toLowerCase())
  );

  const mainCharName = selectedChar || data?.profile?.mainChar || playedCharacters[0]?.name || data?.derived?.top_characters?.[0]?.name;
  const selectedCharObj = charMap.get(mainCharName?.trim().toLowerCase()) || data?.profile?.characters?.find((c: any) => c.name?.trim().toLowerCase() === mainCharName?.trim().toLowerCase());
  const rankName = selectedCharObj?.rankName || (selectedChar ? (data?.profile ? getRankName(data.profile) : null) : (data?.profile ? getRankName(data.profile) : null)) || data?.profile?.rankName || data?.profile?.rank_name || null;
  
  // Resolve per-character Glicko-2 rating dynamically
  const charRatingFromMap = mainCharName
    ? (data?.profile?.character_ratings?.[mainCharName.toLowerCase()] || data?.profile?.character_ratings?.[mainCharName])
    : null;

  const currentGlickoMu = selectedCharObj?.glicko_mu 
    || charRatingFromMap?.mu 
    || (selectedChar ? null : data?.profile?.glicko_mu);

  const currentGlickoSigma = selectedCharObj?.glicko_sigma 
    || charRatingFromMap?.sigma 
    || (selectedChar ? null : data?.profile?.glicko_sigma);

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
            onClick={() => fetchStats(true)}
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
            className={`relative rounded-xl overflow-hidden p-4 border grid grid-cols-1 ${compact ? 'sm:grid-cols-3 gap-3' : 'md:grid-cols-3 gap-6'} items-center`}
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
              {/* Themed Character Dropdown with Visible Chevron Arrow */}
              <div className="relative w-full max-w-[220px] mt-1 mb-1 group">
                <select
                  className="bg-[#050A14] border border-[#00E5FF]/40 hover:border-[#00E5FF] focus:border-[#00E5FF] rounded-lg text-xs font-bold font-mono text-white pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.15)] transition-all cursor-pointer w-full appearance-none"
                  value={selectedChar || data?.profile?.mainChar || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedChar(val);
                    try {
                      const key = `tekken_played_characters_${tekkenId || 'default'}`;
                      const existing: string[] = JSON.parse(localStorage.getItem(key) || '[]');
                      if (!existing.includes(val)) {
                        existing.push(val);
                        localStorage.setItem(key, JSON.stringify(existing));
                      }
                    } catch {}
                  }}
                >
                  <optgroup label="── PLAYED CHARACTERS ──" className="bg-[#050A14] text-[#00E5FF] font-mono font-bold">
                    {playedCharacters.map((c: any) => {
                      const cRating = c.glicko_mu ? ` (μ ${c.glicko_mu})` : '';
                      const cRank = c.rankName ? ` - ${cleanRankText(c.rankName)}` : '';
                      return (
                        <option key={c.name} value={c.name} className="bg-[#050A14] text-white font-bold">
                          {c.name.toUpperCase()}{cRank}{cRating}
                        </option>
                      );
                    })}
                  </optgroup>
                  <optgroup label="── ALL TEKKEN 8 ROSTER ──" className="bg-[#050A14] text-gray-400 font-mono">
                    {unplayedRoster.map(charName => (
                      <option key={charName} value={charName} className="bg-[#050A14] text-gray-300">
                        {charName.toUpperCase()} (Preview)
                      </option>
                    ))}
                  </optgroup>
                </select>
                
                {/* Visible Themed Dropdown Chevron Arrow */}
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#00E5FF] group-hover:scale-110 transition-transform">
                  <ChevronDown size={14} className="stroke-[2.5]" />
                </div>
              </div>

              <div className="w-full max-w-[220px] aspect-[4/3] rounded-lg overflow-hidden bg-[#0A101C] border border-white/5 relative flex items-center justify-center shadow-lg">
                {charPortrait ? (
                  <img 
                    src={charPortrait} 
                    alt={mainCharName} 
                    className="w-full h-full object-cover opacity-90 drop-shadow-xl"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
                  style={{ display: charPortrait ? 'none' : 'flex' }}
                >
                  <Swords size={28} className="text-white/20 mb-1" />
                  <span className="font-mono text-gray-500 text-[10px]">No Character Portrait</span>
                </div>
                {/* Gradient overlay at the bottom of the portrait */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#050A14] to-transparent" />
                <div className="absolute bottom-2 left-0 w-full text-center">
                  <span className="text-[10px] font-bold tracking-widest text-white/80 drop-shadow-md">
                    {mainCharName?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
              </div>
              <div className="w-full max-w-[220px]">
                <WinRateBar winRate={derived.win_rate || 0} wins={derived.wins || 0} losses={derived.losses || 0} />
              </div>
            </div>

            {/* Column 2: Player Info */}
            <div className="flex flex-col items-center justify-center border-y md:border-y-0 md:border-x border-white/5 py-5 md:py-0 px-2 gap-3 text-center relative z-10 w-full h-full">
              <h2 className="text-2xl font-bold text-white tracking-widest font-rajdhani">{playerName || gamerTag || tekkenId}</h2>
              
              <div className="flex flex-col items-center gap-1.5 mt-1">
                {tekkenId && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-500 w-16 text-right shrink-0">TEKKEN ID</span>
                    <span className="text-xs font-mono text-white/80 bg-white/5 px-2 py-0.5 rounded whitespace-nowrap overflow-hidden text-ellipsis">{tekkenId}</span>
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
                {(currentGlickoMu || data?.profile?.glicko_mu) && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10 w-full justify-center">
                    <span className="text-[10px] font-mono text-[#00E5FF] w-16 text-right shrink-0">
                      {selectedChar ? 'CHAR GLICKO' : 'GLICKO-2'}
                    </span>
                    <span className="text-xs font-bold font-mono text-white bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/20 shadow-[0_0_10px_rgba(0,229,255,0.1)] whitespace-nowrap">
                      {currentGlickoMu ? (
                        <>
                          {currentGlickoMu} <span className="text-gray-500 font-normal">±{currentGlickoSigma || '0'}</span>
                        </>
                      ) : (
                        <span className="text-gray-400 font-normal">Unrated</span>
                      )}
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
                  <img 
                    src={rankImageUrl} 
                    alt={cleanRankText(rankName)} 
                    className="w-full h-full object-contain p-2 drop-shadow-[0_0_12px_rgba(0,0,0,0.6)]" 
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}
                <div 
                  className="items-center justify-center"
                  style={{ display: rankImageUrl ? 'none' : 'flex' }}
                >
                  <Trophy size={40} style={{ color: rankColor }} />
                </div>
              </div>
              
              <div className="text-center mt-2 w-full px-1">
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
                  {selectedCharObj ? `${selectedCharObj.name} Rank` : 'Account Main Rank'}
                </div>
                <div className={`font-bold font-rajdhani ${compact ? 'text-base sm:text-lg tracking-wider leading-tight' : 'text-lg sm:text-xl tracking-widest'}`} style={{ color: rankColor, wordBreak: 'break-word' }}>
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

          {/* ── EWGF Live Analytics & Performance (Heatmap, Pentagon, Global Stats) ── */}
          <div className={`grid grid-cols-1 ${compact ? 'gap-4' : 'lg:grid-cols-3 gap-4'} mt-4`}>
            <ActivityHeatmapWidget matches={matches} rankColor={rankColor} />
            <StatPentagonWidget
              matches={matches}
              stats={data?.pentagon_stats || data?.profile?.pentagon_stats}
              rankColor={rankColor}
            />
            <GlobalStatisticsWidget
              matches={matches}
              globalStats={data?.global_stats || data?.profile?.global_stats}
              rankColor={rankColor}
            />
          </div>

          {/* ── Top Characters ── */}
          {derived.top_characters && derived.top_characters.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-gray-400 tracking-widest mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Zap size={10} /> MOST PLAYED (CLICK TO PREVIEW)
                </div>
                {selectedChar && (
                  <button
                    onClick={() => setSelectedChar(null)}
                    className="text-[9px] font-mono text-cyan-400 hover:underline uppercase"
                  >
                    Reset to Main
                  </button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {(() => {
                  const displayTopCharacters = [...(derived.top_characters || [])];
                  playedCharacters.forEach(pc => {
                    if (!displayTopCharacters.some(tc => tc.name.toLowerCase() === pc.name.toLowerCase())) {
                      displayTopCharacters.push({ name: pc.name, count: 1 });
                    }
                  });

                  return displayTopCharacters.map((char, i) => {
                    const isSelected = (selectedChar || mainCharName)?.toLowerCase() === char.name.toLowerCase();
                    return (
                      <motion.button
                        key={char.name}
                        onClick={() => setSelectedChar(isSelected ? null : char.name)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06 }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                            : i === 0
                              ? 'border-[#ff003c]/40 bg-[#ff003c]/10 text-[#ff6b8a] hover:border-[#ff003c]'
                              : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30 hover:bg-white/10'
                        }`}
                        title={`Preview ${char.name} stats & Glicko-2`}
                      >
                        {i === 0 && <Shield size={10} />}
                        <span className="font-bold">{char.name}</span>
                        {char.count > 1 && <span className="opacity-50">×{char.count}</span>}
                      </motion.button>
                    );
                  });
                })()}
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
