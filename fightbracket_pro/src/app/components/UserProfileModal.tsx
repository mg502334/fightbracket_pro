import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, Globe, UserPlus, MessageSquare, Check, X, Trophy, ExternalLink, Sparkles, AlertTriangle, Swords, ChevronDown, ChevronUp, Eye, EyeOff, RefreshCw, Heart, UserCheck, Video, Music, Tv, Youtube } from 'lucide-react';
import { TekkenStatsPanel } from './TekkenStatsPanel';
import { SteamStatsPanel } from './SteamStatsPanel';
import { StartggCareerPanel } from './StartggCareerPanel';
import { GAME_COVERS } from '../data/gameCovers';
import { PostCard, Post } from './FeedPanel';

interface UserProfileData {
  id: string;
  unique_id: string;
  gamer_tag: string;
  avatar_url?: string;
  profile_color?: string;
  bio?: string;
  startgg_slug?: string;
  tekken_id?: string;
  steam_id?: string;
  twitch_url?: string;
  twitch_id?: string;
  youtube_url?: string;
  tiktok_url?: string;
  spotify_url?: string;
  startgg_data?: {
    slug?: string;
    gamerTag?: string;
    prefix?: string;
    events?: Array<{
      event_name: string;
      tournament_name: string;
      placement: string | number;
      tournament_slug?: string;
    }>;
  };
  games_data?: string;
  is_public: boolean;
  friends_only: boolean;
  is_friend: boolean;
  friend_status: string;
  privacy_restricted: boolean;
  is_self: boolean;
  likes_count?: number;
  followers_count?: number;
  following_count?: number;
  is_liked?: boolean;
  is_following?: boolean;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string | null;
  supabaseToken: string | null;
  theme: any;
  onOpenDM?: (user: { id: string; unique_id: string; gamer_tag: string }) => void;
  onImportBracket?: (slug: string) => Promise<void>;
}

function cleanRankText(rankName: string | undefined): string {
  if (!rankName) return 'Unranked';
  const trimmed = String(rankName).trim();
  if (trimmed.toLowerCase() === 'unranked' || trimmed.toLowerCase() === 'syncing...') return 'Unranked';
  if (trimmed.toLowerCase().includes('god of destruction')) return trimmed;
  return trimmed.replace(/\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)+$/i, '');
}

export function UserProfileModal({ isOpen, onClose, targetUserId, supabaseToken, theme, onOpenDM, onImportBracket }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [friendActionMsg, setFriendActionMsg] = useState<string | null>(null);
  const [gamesListExpanded, setGamesListExpanded] = useState(false);
  const [importingSlug, setImportingSlug] = useState<string | null>(null);
  const [importedSlugs, setImportedSlugs] = useState<Set<string>>(new Set());

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate Behavior');
  const [reportDescription, setReportDescription] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [showFbId, setShowFbId] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'Stats' | 'Feed'>('Stats');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [fetchingPosts, setFetchingPosts] = useState(false);

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

  const fetchUserPosts = async (authorId: string) => {
    setFetchingPosts(true);
    try {
      const res = await fetch(`/api/feed?author_id=${authorId}&public_only=true`, {
        headers: { Authorization: `Bearer ${supabaseToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserPosts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingPosts(false);
    }
  };

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

  const handleLikeProfile = async () => {
    if (!profile || !supabaseToken || profile.is_self) return;
    const isCurrentlyLiked = profile.is_liked;
    const currentLikes = profile.likes_count || 0;
    
    // Optimistic UI update
    setProfile(prev => prev ? {
      ...prev,
      is_liked: !isCurrentlyLiked,
      likes_count: isCurrentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1
    } : null);

    try {
      const res = await fetch(`/api/users/like/${profile.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${supabaseToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(prev => prev ? {
          ...prev,
          is_liked: data.is_liked,
          likes_count: data.likes_count
        } : null);
      }
    } catch (e) {
      console.error('Error liking profile:', e);
    }
  };

  const handleFollowUser = async () => {
    if (!profile || !supabaseToken || profile.is_self) return;
    const isCurrentlyFollowing = profile.is_following;
    const currentFollowers = profile.followers_count || 0;

    // Optimistic UI update
    setProfile(prev => prev ? {
      ...prev,
      is_following: !isCurrentlyFollowing,
      followers_count: isCurrentlyFollowing ? Math.max(0, currentFollowers - 1) : currentFollowers + 1
    } : null);

    try {
      const res = await fetch(`/api/users/follow/${profile.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${supabaseToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(prev => prev ? {
          ...prev,
          is_following: data.is_following,
          followers_count: data.followers_count,
          following_count: data.following_count
        } : null);
      }
    } catch (e) {
      console.error('Error following user:', e);
    }
  };

  const handleReportSubmit = async () => {
    if (!profile || !supabaseToken) return;
    setIsReporting(true);
    try {
      const res = await fetch('/api/users/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseToken}`
        },
        body: JSON.stringify({
          target_id: profile.id,
          reason: reportReason,
          description: reportDescription
        })
      });
      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => setShowReportModal(false), 2000);
      } else {
        console.error('Report failed');
      }
    } catch (e) {
      console.error('Error sending report:', e);
    } finally {
      setIsReporting(false);
    }
  };

  if (!isOpen) return null;

  const primaryColor = profile?.profile_color || theme?.primaryColor || '#00E5FF';
  const bgFrom = profile?.profile_color ? `${profile.profile_color}40` : (theme?.bgFrom || '#050A14');

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
          className="relative w-full max-w-3xl overflow-hidden rounded-2xl border bg-[#050A14] shadow-2xl flex flex-col"
          style={{ borderColor: `${primaryColor}40` }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header Banner */}
          <div
            className="p-6 relative border-b"
            style={{
              background: `linear-gradient(135deg, ${bgFrom} 0%, #050A14 100%)`,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <div className="absolute right-4 top-4 flex items-center gap-3">
              {!profile?.is_self && profile && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="opacity-60 hover:opacity-100 hover:text-red-400 p-1 transition-colors flex items-center gap-1 text-xs font-mono"
                  title="Report User"
                >
                  <AlertTriangle size={14} /> REPORT
                </button>
              )}
              <button onClick={onClose} className="opacity-60 hover:opacity-100 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {loading ? (
                /* Avatar skeleton */
                <div className="w-16 h-16 rounded-2xl bg-white/10 animate-pulse shrink-0" />
              ) : profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover border-2 shadow-lg" style={{ borderColor: primaryColor }} />
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 shadow-lg"
                  style={{
                    background: `${primaryColor}20`,
                    color: primaryColor,
                    borderColor: primaryColor,
                    fontFamily: 'Rajdhani, sans-serif',
                  }}
                >
                  {profile?.gamer_tag ? profile.gamer_tag.substring(0, 2).toUpperCase() : 'FB'}
                </div>
              )}

              <div className="flex-1 min-w-0">
                {loading ? (
                  /* Name + ID skeleton */
                  <div className="space-y-2">
                    <div className="h-7 w-40 bg-white/10 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
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
                    <div className="text-xs font-mono text-cyan-400 mt-1 flex items-center gap-1.5 h-4">
                      {showFbId ? (
                        <>
                          <span>{profile?.unique_id || 'FB-USER'}</span>
                          <button onClick={() => setShowFbId(false)} className="opacity-60 hover:opacity-100 transition-opacity" title="Hide FB-ID">
                            <EyeOff size={12} />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setShowFbId(true)} className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity" title="Show FB-ID">
                          <Eye size={12} />
                          <span className="text-[10px] uppercase tracking-wider text-cyan-400/80">Show FB-ID</span>
                        </button>
                      )}
                    </div>

                    {/* Profile Likes & Follow Stats Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 font-mono text-xs">
                      <button
                        onClick={handleLikeProfile}
                        disabled={profile?.is_self}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                          profile?.is_liked
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm'
                            : 'bg-white/5 border-white/10 text-white/80 hover:border-rose-500/40 hover:text-rose-400'
                        } ${profile?.is_self ? 'cursor-default' : 'cursor-pointer'}`}
                        title={profile?.is_self ? 'Profile Likes Received' : profile?.is_liked ? 'Click to Unlike' : 'Click to Like Profile'}
                      >
                        <Heart size={13} className={profile?.is_liked ? 'fill-rose-400 text-rose-400' : ''} />
                        <span className="font-bold">{profile?.likes_count || 0}</span>
                        <span className="text-[10px] opacity-70">Likes</span>
                      </button>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80">
                        <UserCheck size={13} className="text-cyan-400" />
                        <span className="font-bold">{profile?.followers_count || 0}</span>
                        <span className="text-[10px] opacity-70">Followers</span>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80">
                        <span className="font-bold">{profile?.following_count || 0}</span>
                        <span className="text-[10px] opacity-70">Following</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {loading ? (
              /* Full body skeleton */
              <div className="space-y-5 animate-pulse">
                <div className="grid grid-cols-3 gap-4">
                  <div className="aspect-[2/3] rounded-xl bg-white/10" />
                  <div className="aspect-[2/3] rounded-xl bg-white/10" />
                  <div className="aspect-[2/3] rounded-xl bg-white/10" />
                </div>
                <div className="h-32 rounded-xl bg-white/5" />
                <div className="h-20 rounded-xl bg-white/5" />
              </div>
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
              <>
                {/* Tabs */}
                <div className="flex items-center gap-4 border-b border-white/10 pb-2 mb-4">
                  <button
                    onClick={() => setActiveTab('Stats')}
                    className={`text-sm font-rajdhani font-bold tracking-wider uppercase transition-colors px-2 py-1 ${activeTab === 'Stats' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-white/40 hover:text-white/80'}`}
                  >
                    Stats
                  </button>
                  <button
                    onClick={() => setActiveTab('Feed')}
                    className={`text-sm font-rajdhani font-bold tracking-wider uppercase transition-colors px-2 py-1 ${activeTab === 'Feed' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-white/40 hover:text-white/80'}`}
                  >
                    Activity Feed
                  </button>
                </div>

                {activeTab === 'Stats' && (
                  <div className="space-y-6">
                    {/* Top 3 Games Preview */}
                    {(() => {
                      if (!profile?.games_data) return null;
                      try {
                        const parsed = JSON.parse(profile.games_data);
                        if (!Array.isArray(parsed) || parsed.length === 0) return null;
                        return (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              {parsed.slice(0, 3).map((item: any) => {
                                const coverUrl = GAME_COVERS[item.game];
                                return (
                                  <div 
                                    key={item.game} 
                                    title={`${item.game}${item.main ? ` - ${item.main}` : ''}`}
                                    className="flex flex-col gap-2 group"
                                  >
                                    <div className="aspect-[2/3] rounded-xl overflow-hidden border border-white/10 shadow-lg bg-[#050A14]">
                                      {coverUrl ? (
                                        <img src={coverUrl} alt={item.game} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                      ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center">
                                          <Trophy size={24} className="opacity-20" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="px-1 w-full">
                                      <div className="text-[10px] font-mono text-cyan-400 truncate mb-0.5">
                                        {item.game}
                                      </div>
                                      <div className="font-rajdhani font-bold text-sm text-white truncate">
                                        {item.main || 'No Main Set'}
                                      </div>
                                      {item.rank && (
                                        <div className="text-[9px] font-mono text-amber-400 mt-0.5 uppercase tracking-wider truncate">
                                          {cleanRankText(item.rank)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {parsed.length > 3 && (
                              <button
                                onClick={() => setGamesListExpanded(!gamesListExpanded)}
                                className="w-full py-2 text-xs font-mono text-white/50 hover:text-cyan-400 flex items-center justify-center gap-1 transition-colors bg-white/5 hover:bg-white/10 rounded-lg"
                              >
                                {gamesListExpanded ? (
                                  <><ChevronUp size={14} /> SHOW LESS</>
                                ) : (
                                  <><ChevronDown size={14} /> VIEW ALL {parsed.length} GAMES</>
                                )}
                              </button>
                            )}
                            
                            <AnimatePresence>
                              {gamesListExpanded && parsed.length > 3 && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                                    {parsed.slice(3).map((item: any) => {
                                      const coverUrl = GAME_COVERS[item.game];
                                      return (
                                        <div 
                                      key={item.game} 
                                      title={`${item.game}${item.main ? ` - ${item.main}` : ''}`}
                                      className="flex flex-col gap-2 group"
                                    >
                                      <div className="aspect-[2/3] rounded-xl overflow-hidden border border-white/10 shadow-lg bg-[#050A14]">
                                        {coverUrl ? (
                                          <img src={coverUrl} alt={item.game} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                          <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center">
                                            <Trophy size={24} className="opacity-20" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="px-1 w-full">
                                        <div className="text-[10px] font-mono text-cyan-400 truncate mb-0.5">
                                          {item.game}
                                        </div>
                                        <div className="font-rajdhani font-bold text-sm text-white truncate">
                                          {item.main || 'No Main Set'}
                                        </div>
                                        {item.rank && (
                                          <div className="text-[9px] font-mono text-amber-400 mt-0.5 uppercase tracking-wider truncate">
                                            {cleanRankText(item.rank)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })()}

                    {/* 2. Steam Player Card */}
                    {profile?.steam_id && (
                      <SteamStatsPanel steamId={profile.steam_id} compact />
                    )}

                    {/* 3. Broadcast & Social Media Channels (Twitch, YouTube, TikTok, Spotify) */}
                    {((profile?.twitch_url || profile?.twitch_id) || profile?.youtube_url || profile?.tiktok_url || profile?.spotify_url) && (
                      <div className="space-y-3">
                        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                          <Globe size={12} className="text-cyan-400" /> BROADCASTS & SOCIAL MEDIA
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Twitch Card */}
                          {(profile?.twitch_url || profile?.twitch_id) && (
                            <a
                              href={profile?.twitch_url ? (profile.twitch_url.startsWith('http') ? profile.twitch_url : `https://${profile.twitch_url}`) : `https://twitch.tv/${profile.twitch_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3.5 rounded-xl bg-[#9146FF]/10 border border-[#9146FF]/30 hover:bg-[#9146FF]/20 hover:border-[#9146FF]/60 transition-all group shadow-md"
                            >
                              <div className="p-2 rounded-lg bg-[#9146FF]/20 border border-[#9146FF]/40 text-[#9146FF]">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-mono font-bold text-[#9146FF] tracking-wider uppercase">TWITCH LIVE</div>
                                <div className="text-xs font-rajdhani font-bold text-white group-hover:text-[#9146FF] transition-colors truncate">
                                  {profile?.twitch_id || 'Watch Stream'}
                                </div>
                              </div>
                              <ExternalLink size={14} className="text-white/30 group-hover:text-[#9146FF] transition-colors shrink-0" />
                            </a>
                          )}

                          {/* YouTube Card */}
                          {profile?.youtube_url && (
                            <a
                              href={profile.youtube_url.startsWith('http') ? profile.youtube_url : `https://${profile.youtube_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/60 transition-all group shadow-md"
                            >
                              <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-500">
                                <Youtube size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-mono font-bold text-red-500 tracking-wider uppercase">YOUTUBE CHANNEL</div>
                                <div className="text-xs font-rajdhani font-bold text-white group-hover:text-red-400 transition-colors truncate">
                                  Watch VODs & Highlights
                                </div>
                              </div>
                              <ExternalLink size={14} className="text-white/30 group-hover:text-red-400 transition-colors shrink-0" />
                            </a>
                          )}

                          {/* TikTok Card */}
                          {profile?.tiktok_url && (
                            <a
                              href={profile.tiktok_url.startsWith('http') ? profile.tiktok_url : `https://${profile.tiktok_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-[#00F2FE]/10 to-[#FE2C55]/10 border border-cyan-500/30 hover:border-pink-500/60 transition-all group shadow-md"
                            >
                              <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/40 text-[#00F2FE]">
                                <Video size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-mono font-bold text-[#00F2FE] tracking-wider uppercase">TIKTOK HIGHLIGHTS</div>
                                <div className="text-xs font-rajdhani font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                                  Clips & Match Reels
                                </div>
                              </div>
                              <ExternalLink size={14} className="text-white/30 group-hover:text-[#00F2FE] transition-colors shrink-0" />
                            </a>
                          )}

                          {/* Spotify Card */}
                          {profile?.spotify_url && (
                            <a
                              href={profile.spotify_url.startsWith('http') ? profile.spotify_url : `https://${profile.spotify_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all group shadow-md"
                            >
                              <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                                <Music size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase">SPOTIFY ANTHEM</div>
                                <div className="text-xs font-rajdhani font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                                  Player Track / Playlist
                                </div>
                              </div>
                              <ExternalLink size={14} className="text-white/30 group-hover:text-emerald-400 transition-colors shrink-0" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 4. Start.gg Player Career Analytics & Pro Ranking */}
                    {(profile?.startgg_slug || profile?.startgg_data?.slug) && (
                      <StartggCareerPanel
                        startggSlug={profile.startgg_slug || profile.startgg_data?.slug}
                        token={supabaseToken || undefined}
                        onImportBracket={onImportBracket}
                      />
                    )}

                    {/* 5. Tekken 8 Stats Card */}
                    {profile?.tekken_id && (
                      <TekkenStatsPanel 
                        tekkenId={profile.tekken_id} 
                        steamId={profile.steam_id}
                        gamerTag={profile.gamer_tag}
                        compact 
                      />
                    )}
                  </div>
                )}

                {activeTab === 'Feed' && (
                  <div className="space-y-4">
                    {fetchingPosts && userPosts.length === 0 ? (
                      <div className="text-center py-8 opacity-50 font-mono text-sm">Loading activity...</div>
                    ) : userPosts.length === 0 ? (
                      <div className="text-center py-8 opacity-50 font-mono text-sm">
                        No public activity found.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userPosts.map((post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            onLike={() => {}}
                            onBookmark={() => {}}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Like / Follow / Friend / DM Actions */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {!profile?.is_self && (
                    <button
                      onClick={handleFollowUser}
                      className={`py-2.5 rounded-xl font-bold text-xs font-mono tracking-wider transition-all flex items-center justify-center gap-2 border ${
                        profile?.is_following
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40'
                          : 'bg-cyan-500 text-black border-cyan-400 hover:brightness-125'
                      }`}
                    >
                      <UserCheck size={14} /> {profile?.is_following ? 'FOLLOWING' : 'FOLLOW PLAYER'}
                    </button>
                  )}

                  {profile?.is_friend ? (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenDM?.(profile);
                      }}
                      className="py-2.5 rounded-xl bg-purple-500 text-white font-bold text-xs font-mono tracking-wider hover:brightness-125 transition-all flex items-center justify-center gap-2 border border-purple-400"
                    >
                      <MessageSquare size={14} /> SEND DIRECT MESSAGE
                    </button>
                  ) : profile?.friend_status === 'none' && !profile?.is_self ? (
                    <button
                      onClick={handleAddFriend}
                      className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs font-mono tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus size={14} /> ADD FRIEND
                    </button>
                  ) : profile?.friend_status === 'pending' && !profile?.is_self ? (
                    <div className="py-2.5 text-center text-xs font-mono opacity-50 bg-white/5 rounded-xl">
                      Friend Request Pending
                    </div>
                  ) : null}
                </div>

                {friendActionMsg && (
                  <div className="text-xs font-mono text-center text-cyan-400">{friendActionMsg}</div>
                )}
              </>
            )}
          </div>
        </motion.div>
        
        {/* Report Modal */}
        <AnimatePresence>
          {showReportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowReportModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-[#050A14] border border-red-500/40 rounded-xl shadow-2xl p-6"
              >
                <div className="flex items-center gap-2 text-red-400 mb-4">
                  <AlertTriangle size={20} />
                  <h3 className="font-rajdhani font-bold text-lg tracking-widest">REPORT USER</h3>
                </div>
                
                {reportSuccess ? (
                  <div className="text-center py-6">
                    <Check size={32} className="mx-auto text-emerald-400 mb-2" />
                    <p className="font-mono text-xs text-white">Report submitted successfully.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs font-mono text-gray-400">
                      Why are you reporting <span className="text-white font-bold">{profile?.gamer_tag}</span>?
                    </p>
                    
                    <div className="space-y-2">
                      {['Inappropriate Behavior', 'Harassment/Abuse', 'Spam', 'Cheating/Smurfing', 'Other'].map(reason => (
                        <label key={reason} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="reportReason"
                            value={reason}
                            checked={reportReason === reason}
                            onChange={(e) => setReportReason(e.target.value)}
                            className="accent-red-500"
                          />
                          <span className="text-xs font-mono text-gray-300 group-hover:text-white transition-colors">
                            {reason}
                          </span>
                        </label>
                      ))}
                    </div>
                    
                    {reportReason === 'Other' && (
                      <textarea
                        placeholder="Please provide details..."
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        className="w-full bg-[#111] border border-red-500/30 rounded-lg p-3 text-white focus:border-red-500 outline-none font-mono text-xs h-24 resize-none"
                      />
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setShowReportModal(false)}
                        className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-mono text-xs transition-colors border border-white/10"
                      >
                        CANCEL
                      </button>
                      <button
                        onClick={handleReportSubmit}
                        disabled={isReporting || (reportReason === 'Other' && !reportDescription.trim())}
                        className="flex-1 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 font-mono text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {isReporting ? 'SUBMITTING...' : 'SUBMIT'}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
