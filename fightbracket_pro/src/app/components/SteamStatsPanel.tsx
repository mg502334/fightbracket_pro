import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, ExternalLink, Gamepad2, Shield, User, Globe, AlertCircle } from 'lucide-react';

interface SteamProfileData {
  steamid?: string;
  personaname?: string;
  realname?: string;
  profileurl?: string;
  avatarfull?: string;
  avatarmedium?: string;
  personastate?: number; // 0 = Offline, 1 = Online, 2 = Busy, 3 = Away, 4 = Snooze, 5 = Looking to trade, 6 = Looking to play
  gameextrainfo?: string; // Name of game currently playing if any
  loccountrycode?: string;
  timecreated?: number;
  communityvisibilitystate?: number;
  [key: string]: any;
}

interface SteamStatsPanelProps {
  steamId: string | null | undefined;
  /** If true, shows a compact layout (e.g. inside UserProfileModal) */
  compact?: boolean;
}

function getPersonaStatus(state?: number, inGameName?: string) {
  if (inGameName) {
    return { text: `In-Game: ${inGameName}`, color: '#90BA3C', bg: 'rgba(144, 186, 60, 0.15)', border: 'rgba(144, 186, 60, 0.4)' };
  }
  switch (state) {
    case 1: return { text: 'Online', color: '#57CBDE', bg: 'rgba(87, 203, 222, 0.15)', border: 'rgba(87, 203, 222, 0.4)' };
    case 2: return { text: 'Busy', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.4)' };
    case 3: return { text: 'Away', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.4)' };
    case 4: return { text: 'Snooze', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.4)' };
    case 5: return { text: 'Looking to Trade', color: '#C084FC', bg: 'rgba(192, 132, 252, 0.15)', border: 'rgba(192, 132, 252, 0.4)' };
    case 6: return { text: 'Looking to Play', color: '#00FF88', bg: 'rgba(0, 255, 136, 0.15)', border: 'rgba(0, 255, 136, 0.4)' };
    default: return { text: 'Offline', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.15)', border: 'rgba(107, 114, 128, 0.4)' };
  }
}

export function SteamStatsPanel({ steamId, compact = false }: SteamStatsPanelProps) {
  const [profile, setProfile] = useState<SteamProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const fetchSteamData = useCallback(async () => {
    if (!steamId || !steamId.trim()) return;
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch(`/api/steam/profile/${encodeURIComponent(steamId.trim())}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.profile && Object.keys(data.profile).length > 0) {
        setProfile(data.profile);
      } else {
        // Fallback display if profile is empty or private
        setProfile({
          steamid: data.steam_id_64 || steamId,
          personaname: steamId,
        });
      }
      setLastSynced(new Date().toLocaleTimeString());
    } catch (e: any) {
      setError(e.message || 'Failed to fetch Steam profile data');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [steamId]);

  useEffect(() => {
    if (steamId) {
      setLoading(true);
      fetchSteamData();
    }
  }, [steamId, fetchSteamData]);

  if (!steamId || !steamId.trim()) {
    return (
      <div className={`rounded-xl border border-dashed border-white/10 text-center py-6 px-4 space-y-2 ${compact ? '' : 'bg-[#050A14]'}`}>
        <p className="text-xs font-mono text-gray-500">No Steam ID linked to this profile.</p>
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="rounded-xl border border-sky-500/20 bg-[#050A14] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="h-16 bg-white/5 rounded-lg animate-pulse" />
      </div>
    );
  }

  const status = getPersonaStatus(profile?.personastate, profile?.gameextrainfo);
  const avatar = profile?.avatarfull || profile?.avatarmedium || profile?.avatar;
  const name = profile?.personaname || steamId;
  const steamUrl = profile?.profileurl || `https://steamcommunity.com/profiles/${profile?.steamid || steamId}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-end -mt-2 mb-2">
        <div className="flex items-center gap-2">
          {lastSynced && (
            <span className="text-[10px] font-mono text-gray-600 hidden sm:block">
              Synced {lastSynced}
            </span>
          )}
          <button
            onClick={fetchSteamData}
            disabled={syncing}
            className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 hover:bg-white/5 text-gray-400 hover:text-white transition-all disabled:opacity-40"
            title="Refresh Steam profile"
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error notification */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs font-mono text-amber-400"
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Details */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-white/10 bg-gradient-to-r from-cyan-950/30 via-slate-900/40 to-black/60">
        <div className="flex items-center gap-4 min-w-0">
          {/* Avatar with status border */}
          <div
            className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 shadow-lg"
            style={{ borderColor: status.color }}
          >
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-cyan-950 flex items-center justify-center text-cyan-400 font-bold text-lg font-rajdhani">
                {name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold font-rajdhani text-base md:text-lg text-white truncate">{name}</span>
              {profile?.loccountrycode && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-semibold border border-white/10">
                  {profile.loccountrycode}
                </span>
              )}
            </div>

            {profile?.realname && (
              <div className="text-xs font-mono text-gray-400 truncate">{profile.realname}</div>
            )}

            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                style={{ color: status.color, background: status.bg, borderColor: status.border }}
              >
                {status.text}
              </span>
              <span className="text-[10px] font-mono text-gray-500 truncate max-w-[140px]">
                ID: {profile?.steamid || steamId}
              </span>
            </div>
          </div>
        </div>

        {/* View Steam Profile Link */}
        <a
          href={steamUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:text-sky-300 text-xs font-mono font-bold transition-all shrink-0 self-end sm:self-center"
        >
          <span>STEAM PROFILE</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
