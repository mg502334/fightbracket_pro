import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, Globe, UserPlus, MessageSquare, Check, X, Trophy, ExternalLink, Sparkles, AlertTriangle, Swords, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { TekkenStatsPanel } from './TekkenStatsPanel';
import { SteamStatsPanel } from './SteamStatsPanel';
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
  return rankName.replace(/\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)+$/i, '');
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

  const primaryColor = profile?.profile_color || theme.primaryColor;
  const bgFrom = profile?.profile_color ? `${profile.profile_color}40` : theme.bgFrom;

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
              {profile?.avatar_url ? (
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
                                    className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/10 group shadow-lg flex flex-col justify-end bg-[#050A14]"
                                  >
                                    <div className="absolute inset-0 z-0">
                                      {coverUrl ? (
                                        <img src={coverUrl} alt={item.game} className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300" />
                                      ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center">
                                          <Trophy size={24} className="opacity-20" />
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                    </div>
                                    <div className="relative z-10 p-3 w-full">
                                      <div className="text-[10px] font-mono text-cyan-400 truncate mb-0.5" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                                        {item.game}
                                      </div>
                                      <div className="font-rajdhani font-bold text-sm text-white truncate drop-shadow-md">
                                        {item.main || 'No Main Set'}
                                      </div>
                                      {item.rank && (
                                        <div className="text-[9px] font-mono text-amber-400 mt-1 uppercase tracking-wider truncate">
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
                                          className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/10 group shadow-lg flex flex-col justify-end bg-[#050A14]"
                                        >
                                          <div className="absolute inset-0 z-0">
                                            {coverUrl ? (
                                              <img src={coverUrl} alt={item.game} className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                                            ) : (
                                              <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center">
                                                <Trophy size={20} className="opacity-10" />
                                              </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                                          </div>
                                          <div className="relative z-10 p-2 w-full">
                                            <div className="text-[9px] font-mono text-cyan-400/80 truncate mb-0.5">
                                              {item.game}
                                            </div>
                                            <div className="font-rajdhani font-bold text-xs text-white/80 truncate">
                                              {item.main || 'No Main Set'}
                                            </div>
                                            {item.rank && (
                                              <div className="text-[8px] font-mono text-amber-400/70 mt-0.5 uppercase tracking-wider truncate">
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

                    {/* start.gg Tournament Record */}
                    {profile?.startgg_data?.events && profile.startgg_data.events.length > 0 && (
                      <div className="bg-[#111116] border border-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Trophy size={16} className="text-amber-500" />
                          <h3 className="font-rajdhani font-bold text-sm tracking-wider uppercase">start.gg Record</h3>
                          {profile.startgg_data.slug && (
                            <a
                              href={`https://start.gg/user/${profile.startgg_data.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto opacity-50 hover:opacity-100 transition-opacity"
                              title="View start.gg profile"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {profile.startgg_data.events.map((ev, i) => {
                            const isFirst = String(ev.placement) === '1';
                            const isPodium = !isFirst && ['2', '3'].includes(String(ev.placement));
                            const medalBg = isFirst ? 'rgba(245,158,11,0.1)' : isPodium ? 'rgba(255,255,255,0.05)' : 'transparent';
                            
                            // Derive the importable tournament slug
                            let tSlug = ev.tournament_slug || '';
                            if (!tSlug && ev.tournament_name) {
                              tSlug = ev.tournament_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                            }
                            
                            return (
                              <div
                                key={i}
                                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors gap-3"
                                style={{ background: medalBg }}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                                    {isFirst && <Trophy size={12} className="text-amber-400 shrink-0" />}
                                    <span className="truncate">{ev.tournament_name}</span>
                                  </div>
                                  <div className="text-[10px] text-white/40 truncate font-mono mt-0.5">{ev.event_name}</div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className={`font-rajdhani font-bold text-lg ${isFirst ? 'text-amber-400' : isPodium ? 'text-slate-300' : 'text-white/60'}`}>
                                    {ev.placement}<span className="text-[10px] opacity-50 font-mono ml-0.5">th</span>
                                  </div>
                                  {onImportBracket && tSlug && (
                                    <button
                                      onClick={() => {
                                        if (onImportBracket && tSlug && !importedSlugs.has(tSlug)) {
                                          setImportingSlug(tSlug);
                                          onImportBracket(tSlug).then(() => {
                                            setImportedSlugs(prev => new Set([...prev, tSlug]));
                                          }).finally(() => setImportingSlug(null));
                                        }
                                      }}
                                      disabled={importingSlug === tSlug || importedSlugs.has(tSlug)}
                                      className={`p-1.5 rounded-md border transition-colors ${
                                        importedSlugs.has(tSlug) 
                                          ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                                          : 'border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 text-white/40'
                                      }`}
                                      title={importedSlugs.has(tSlug) ? "Added to Library" : "Add to Library"}
                                    >
                                      {importingSlug === tSlug ? (
                                        <RefreshCw size={12} className="animate-spin" />
                                      ) : importedSlugs.has(tSlug) ? (
                                        <Check size={12} />
                                      ) : (
                                        <Swords size={12} />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

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

                    <TekkenStatsPanel 
                      tekkenId={profile?.tekken_id} 
                      steamId={profile?.steam_id}
                      gamerTag={profile?.gamer_tag}
                      compact 
                    />
                    <SteamStatsPanel steamId={profile?.steam_id} compact />
                  </div>
                )}

                {activeTab === 'activity feed' && (
                  <div className="space-y-4">
                    {fetchingPosts ? (
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

                {/* Friend / DM Actions */}
                <div className="pt-2 flex gap-3 mt-4">
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
