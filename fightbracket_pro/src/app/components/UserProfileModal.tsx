import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, Globe, UserPlus, MessageSquare, Check, X, Trophy, ExternalLink, Sparkles, AlertTriangle, Swords, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { TekkenStatsPanel } from './TekkenStatsPanel';
import { SteamStatsPanel } from './SteamStatsPanel';
import { GAME_COVERS } from '../data/gameCovers';

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
              /* Full Profile View */
              <div className="space-y-6">
                {/* Main Games & Characters */}
                {(() => {
                  if (!profile?.games_data) return null;
                  try {
                    const parsed = JSON.parse(profile.games_data);
                    if (!Array.isArray(parsed) || parsed.length === 0) return null;
                    return (
                      <div className="space-y-4">
                        {/* Top 3 Games Preview */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {parsed.slice(0, 3).map((item: any) => {
                            const coverUrl = GAME_COVERS[item.game];
                            return (
                              <div 
                                key={item.game} 
                                title={`${item.game}${item.main ? ` - ${item.main}` : ''}`}
                                className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/10 group shadow-lg flex flex-col justify-end bg-[#050A14]"
                              >
                                {/* Background Cover */}
                                {coverUrl ? (
                                  <img src={coverUrl} alt={item.game} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-900 to-[#050A14] flex flex-col items-center justify-center p-4 text-center">
                                    <Swords size={24} className="text-white/20 mb-2" />
                                    <span className="font-bold font-rajdhani text-lg text-white/40 leading-tight">{item.game}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Text List of All Games with Expansion */}
                        <div className="bg-black/40 border border-[#FF006E]/30 rounded-lg p-3">
                          <div className="text-[10px] font-mono text-[#FF006E] mb-2 flex justify-between items-center font-bold tracking-wider">
                            <span>MAIN GAMES & CHARACTERS ({parsed.length})</span>
                            {parsed.length > 3 && (
                              <button 
                                onClick={() => setGamesListExpanded(!gamesListExpanded)}
                                className="text-white hover:text-gray-300 flex items-center gap-1"
                              >
                                {gamesListExpanded ? (
                                  <>COLLAPSE <ChevronUp size={12} /></>
                                ) : (
                                  <>VIEW ALL <ChevronDown size={12} /></>
                                )}
                              </button>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            {(gamesListExpanded ? parsed : parsed.slice(0, 3)).map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-xs font-mono border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                                <span className="text-white font-bold">{item.game}</span>
                                {item.main && <span className="text-white text-[10px] bg-white/10 px-2 py-0.5 rounded">{item.main}</span>}
                              </div>
                            ))}
                          </div>
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
                        {profile.startgg_data.events.slice(0, 3).map((ev, i) => {
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

                          // Derive the importable tournament slug
                          let tSlug = ev.tournament_slug || '';
                          if (!tSlug && ev.tournament_name) {
                            tSlug = ev.tournament_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                          }
                          const isImporting = importingSlug === tSlug;
                          const isImported = importedSlugs.has(tSlug);

                          const handleImport = async () => {
                            if (!tSlug || !onImportBracket || isImporting || isImported) return;
                            setImportingSlug(tSlug);
                            try {
                              await onImportBracket(tSlug);
                              setImportedSlugs(prev => new Set([...prev, tSlug]));
                            } catch (e) {
                              console.error('Import failed', e);
                            } finally {
                              setImportingSlug(null);
                            }
                          };

                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors gap-3"
                              style={{ background: medalBg }}
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="font-bold text-xs font-rajdhani text-white truncate">{ev.event_name}</div>
                                <div className="text-[10px] font-mono text-gray-500 truncate">{ev.tournament_name}</div>
                              </div>
                              {/* Import bracket button */}
                              {onImportBracket && tSlug && (
                                <button
                                  onClick={handleImport}
                                  disabled={isImporting || isImported}
                                  className="shrink-0 flex items-center gap-1 text-[10px] font-bold font-mono px-2.5 py-1 rounded transition-all"
                                  style={{
                                    background: isImported ? 'rgba(0,255,136,0.12)' : 'rgba(0,229,255,0.1)',
                                    color: isImported ? '#00FF88' : '#00E5FF',
                                    border: `1px solid ${isImported ? 'rgba(0,255,136,0.3)' : 'rgba(0,229,255,0.25)'}`,
                                    opacity: isImporting ? 0.7 : 1,
                                    cursor: (isImporting || isImported) ? 'default' : 'pointer',
                                  }}
                                  title={isImported ? 'Already imported' : `Import ${ev.tournament_name} bracket`}
                                >
                                  {isImporting ? (
                                    <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                                  ) : isImported ? (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                  ) : (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                  )}
                                  {isImporting ? 'IMPORTING…' : isImported ? 'IMPORTED' : 'IMPORT'}
                                </button>
                              )}
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
                    <div className="py-6 text-center">
                      <div className="text-xs font-mono text-gray-500 mb-1">No Start.gg event history on this profile.</div>
                      {profile?.startgg_slug && (
                        <a
                          href={`https://start.gg/user/${profile.startgg_slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-mono text-cyan-700 hover:text-cyan-400 transition-colors"
                        >
                          View on Start.gg ↗
                        </a>
                      )}
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
                <TekkenStatsPanel 
                  tekkenId={profile?.tekken_id} 
                  steamId={profile?.steam_id}
                  gamerTag={profile?.gamer_tag}
                  compact 
                />
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
