import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, Globe, UserPlus, MessageSquare, Check, X, Trophy, ExternalLink, Sparkles } from 'lucide-react';
import { TekkenStatsPanel } from './TekkenStatsPanel';

interface UserProfileData {
  id: string;
  unique_id: string;
  gamer_tag: string;
  avatar_url?: string;
  bio?: string;
  startgg_slug?: string;
  tekken_id?: string;
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
  is_public: boolean;
  friends_only: boolean;
  is_friend: boolean;
  friend_status: string;
  privacy_restricted: boolean;
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

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-wider font-rajdhani text-white">
                    {profile?.gamer_tag || 'FGC Player'}
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
                {profile.friend_status === 'none' && (
                  <button
                    onClick={handleAddFriend}
                    className="px-5 py-2 rounded-lg bg-cyan-500 text-black font-bold text-xs font-mono tracking-wider hover:brightness-125 transition-all flex items-center gap-2 mx-auto mt-2"
                  >
                    <UserPlus size={14} /> ADD FRIEND TO VIEW STATS
                  </button>
                )}
                {profile.friend_status === 'pending' && (
                  <div className="text-xs font-mono opacity-50 italic">Friend request pending...</div>
                )}
              </div>
            ) : (
              /* Full Profile View */
              <div className="space-y-6">
                {/* Bio */}
                {profile?.bio && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs font-mono opacity-80">
                    "{profile.bio}"
                  </div>
                )}

                {/* Start.gg Imported History */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold tracking-widest text-cyan-400 flex items-center gap-2">
                      <Trophy size={14} /> START.GG CAREER STATS
                    </h3>
                    {profile?.startgg_slug && (
                      <a
                        href={`https://start.gg/user/${profile.startgg_slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono text-white/50 hover:text-cyan-400 flex items-center gap-1"
                      >
                        Start.gg <ExternalLink size={10} />
                      </a>
                    )}
                  </div>

                  {profile?.startgg_data?.events && profile.startgg_data.events.length > 0 ? (
                    <div className="space-y-2">
                      {profile.startgg_data.events.map((ev, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                        >
                          <div>
                            <div className="font-bold text-xs font-rajdhani text-white">{ev.event_name}</div>
                            <div className="text-[10px] font-mono opacity-40">{ev.tournament_name}</div>
                          </div>
                          <div className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                            #{ev.placement}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl border border-white/5 bg-white/5 text-center text-xs font-mono opacity-40">
                      No public Start.gg event history synced yet.
                    </div>
                  )}
                </div>

                {/* Tekken 8 Live Stats */}
                <div className="space-y-2">
                  <TekkenStatsPanel tekkenId={profile?.tekken_id} compact />
                </div>

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
