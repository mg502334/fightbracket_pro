import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, Globe, UserPlus, MessageSquare, Check, X, Trophy, ExternalLink, Sparkles } from 'lucide-react';
import { TekkenStatsPanel } from './TekkenStatsPanel';
import { SteamStatsPanel } from './SteamStatsPanel';

interface UserProfileData {
  id: string;
  unique_id: string;
  gamer_tag: string;
  avatar_url?: string;
  bio?: string;
  startgg_slug?: string;
  tekken_id?: string;
  steam_id?: string;
  startgg_data?: {
    slug?: string;
    gamerTag?: string;
    prefix?: string;
    events?: Array<{
      event_name: string;
      tournament_name: string;
      placement: string | number;
    }>;
  };
  games_data?: string;
  is_public: boolean;
  friends_only: boolean;
  is_friend: boolean;
  friend_status: string;
  privacy_restricted: boolean;
  is_self: boolean;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string | null;
  supabaseToken: string | null;
  theme: any;
  onOpenDM?: (user: { id: string; unique_id: string; gamer_tag: string }) => void;
}

export function UserProfileModal({ isOpen, onClose, targetUserId, supabaseToken, theme, onOpenDM }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [friendActionMsg, setFriendActionMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && targetUserId && supabaseToken) {
      setLoading(true);
      fetch(`/api/users/profile/${targetUserId}`, {
        headers: { Authorization: `Bearer ${supabaseToken}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.profile) {
            setProfile(data.profile);
          }
        })
        .catch(err => console.error('Error fetching profile:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, targetUserId, supabaseToken]);

  const handleAddFriend = async () => {
    if (!profile || !supabaseToken) return;
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseToken}`
        },
        body: JSON.stringify({ target_identifier: profile.id })
      });
      const data = await res.json();
      setFriendActionMsg(data.message || 'Friend request sent');
      setProfile(prev => prev ? { ...prev, friend_status: 'pending' } : null);
    } catch (e) {
      console.error('Error sending friend request:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border bg-[#050A14] shadow-2xl flex flex-col"
          style={{ borderColor: `${theme.primaryColor}40` }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header Banner */}
          <div
            className="p-6 relative border-b"
            style={{
              background: `linear-gradient(135deg, ${theme.bgFrom} 0%, #050A14 100%)`,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <button onClick={onClose} className="absolute right-4 top-4 opacity-60 hover:opacity-100 p-1">
              <X size={18} />
            </button>

            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover border-2 shadow-lg" style={{ borderColor: theme.primaryColor }} />
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 shadow-lg"
                  style={{
                    background: `${theme.primaryColor}20`,
                    color: theme.primaryColor,
                    borderColor: theme.primaryColor,
                    fontFamily: 'Rajdhani, sans-serif',
                  }}
                >
                  {profile?.gamer_tag ? profile.gamer_tag.substring(0, 2).toUpperCase() : 'FB'}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-wider font-rajdhani text-white">
                    {profile?.gamer_tag || (profile?.is_self ? 'Add Gamer Tag in Settings' : 'Anonymous Fighter')}
                  </h2>
                  {profile?.is_friend && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      FRIEND
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono text-cyan-400 mt-0.5">
                  {profile?.unique_id || 'FB-USER'}
                </div>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="text-center py-10 opacity-40 font-mono text-xs">Loading profile...</div>
            ) : profile?.privacy_restricted ? (
              /* Privacy Guard Banner */
              <div className="rounded-xl p-6 border text-center space-y-3 bg-amber-500/10 border-amber-500/30">
                <Lock size={36} className="mx-auto text-amber-400 opacity-80" />
                <div>
                  <h3 className="font-bold font-rajdhani text-lg text-amber-400">PRIVATE PROFILE</h3>
                  <p className="text-xs font-mono opacity-70 mt-1">
                    This user's Start.gg profile data & career stats are set to <span className="underline">Friends Only</span> or Private.
                  </p>
                </div>
                {profile.friend_status === 'none' && !profile.is_self && (
                  <button
                    onClick={handleAddFriend}
                    className="px-5 py-2 rounded-lg bg-cyan-500 text-black font-bold text-xs font-mono tracking-wider hover:brightness-125 transition-all flex items-center gap-2 mx-auto mt-2"
                  >
                    <UserPlus size={14} /> ADD FRIEND TO VIEW STATS
                  </button>
                )}
                {profile.friend_status === 'pending' && !profile.is_self && (
                  <div className="text-xs font-mono opacity-50 italic">Friend request pending...</div>
                )}
              </div>
            ) : (
              /* Full Profile View */
              <div className="space-y-6">
                {/* Main Games & Characters */}
                {(() => {
                  if (!profile?.games_data) return null;
                  try {
                    const parsed = JSON.parse(profile.games_data);
                    if (!Array.isArray(parsed) || parsed.length === 0) return null;
                    return (
                      <div className="p-4 rounded-xl bg-[#050A14] border border-[#FF006E]/30 space-y-3">
                        <div className="text-xs font-mono font-bold text-[#FF006E] tracking-widest flex items-center gap-2">
                          MAIN GAMES & CHARACTERS
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {parsed.map((item: any, idx: number) => (
                            <div key={idx} className="p-2.5 rounded bg-black/40 border border-white/10 flex items-center justify-between text-xs font-mono">
                              <span className="font-bold text-cyan-400">{item.game}</span>
                              <span className="text-white bg-white/10 px-2 py-0.5 rounded text-[11px]">{item.main}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })()}

                {/* Bio */}
                {profile?.bio && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs font-mono opacity-80">
                    "{profile.bio}"
                  </div>
                )}

                {/* ── Start.gg Career Stats Panel ── */}
                <div className="rounded-xl border bg-[#050A14] space-y-4 p-4 overflow-hidden relative" style={{ borderColor: 'rgba(0,229,255,0.25)' }}>
                  {/* Glow */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(0,229,255,0.07) 0%, transparent 65%)' }} />

                  {/* Header */}
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy size={15} style={{ color: '#00E5FF' }} />
                      <h3 className="text-base font-bold font-rajdhani tracking-widest text-[#00E5FF]">
                        START.GG CAREER
                      </h3>
                    </div>
                    {profile?.startgg_slug && (
                      <a
                        href={`https://start.gg/user/${profile.startgg_slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-mono text-white/40 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                      >
                        View Profile <ExternalLink size={9} />
                      </a>
                    )}
                  </div>

                  {profile?.startgg_data?.events && profile.startgg_data.events.length > 0 ? (
                    <>
                      {/* Summary pill */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                          {profile.startgg_data.events.length} event{profile.startgg_data.events.length !== 1 ? 's' : ''} recorded
                        </span>
                        {profile.startgg_data.gamerTag && (
                          <span className="text-[10px] font-mono text-gray-500">{profile.startgg_data.gamerTag}</span>
                        )}
                      </div>

                      {/* Event rows */}
                      <div className="space-y-1.5">
                        {profile.startgg_data.events.map((ev, i) => {
                          const place = Number(ev.placement);
                          const medalColor =
                            place === 1 ? '#FFD700' :
                            place === 2 ? '#C0C0C0' :
                            place === 3 ? '#CD7F32' :
                            place <= 8  ? '#00E5FF' : '#6B7280';
                          const medalBg =
                            place === 1 ? 'rgba(255,215,0,0.1)' :
                            place === 2 ? 'rgba(192,192,192,0.08)' :
                            place === 3 ? 'rgba(205,127,50,0.1)' :
                            place <= 8  ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.04)';

                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                              style={{ background: medalBg }}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-bold text-xs font-rajdhani text-white truncate">{ev.event_name}</div>
                                <div className="text-[10px] font-mono text-gray-500 truncate">{ev.tournament_name}</div>
                              </div>
                              <div
                                className="text-xs font-mono font-bold px-2.5 py-1 rounded shrink-0"
                                style={{ color: medalColor, background: `${medalColor}15`, border: `1px solid ${medalColor}30` }}
                              >
                                {place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : `#${ev.placement}`}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="py-6 text-center text-xs font-mono text-gray-600">
                      No Start.gg event history imported yet.
                    </div>
                  )}
                </div>

                {/* ── Twitch Integration ── */}
                {(profile?.twitch_url || profile?.twitch_id) && (
                  <a
                    href={profile?.twitch_url ? (profile.twitch_url.startsWith('http') ? profile.twitch_url : `https://${profile.twitch_url}`) : `https://twitch.tv/${profile.twitch_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#9146FF]/10 border border-[#9146FF]/30 hover:bg-[#9146FF]/20 transition-all group"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#9146FF" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                    </svg>
                    <div className="flex-1">
                      <div className="text-xs font-mono font-bold text-[#9146FF]">TWITCH CHANNEL</div>
                      <div className="text-sm font-rajdhani font-bold text-white group-hover:text-[#9146FF] transition-colors">
                        {profile?.twitch_id || 'Watch Live'}
                      </div>
                    </div>
                  </a>
                )}

                {/* ── Tekken 8 Live Stats Panel ── */}
                <TekkenStatsPanel tekkenId={profile?.tekken_id} compact />

                {/* ── Steam Live Gamer Card ── */}
                <SteamStatsPanel steamId={profile?.steam_id} compact />

                {/* Friend / DM Actions */}
                <div className="pt-2 flex gap-3">
                  {profile?.is_friend ? (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenDM?.(profile);
                      }}
                      className="w-full py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs font-mono tracking-wider hover:brightness-125 transition-all flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={14} /> SEND DIRECT MESSAGE
                    </button>
                  ) : profile?.friend_status === 'none' ? (
                    <button
                      onClick={handleAddFriend}
                      className="w-full py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs font-mono tracking-wider hover:brightness-125 transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus size={14} /> SEND FRIEND REQUEST
                    </button>
                  ) : (
                    <div className="w-full py-2.5 text-center text-xs font-mono opacity-50 bg-white/5 rounded-xl">
                      Friend Request Pending
                    </div>
                  )}
                </div>

                {friendActionMsg && (
                  <div className="text-xs font-mono text-center text-cyan-400">{friendActionMsg}</div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
