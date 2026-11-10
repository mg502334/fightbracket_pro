import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { 
  User, Shield, Link, Bell, AlertTriangle, Globe, Calendar, Trophy, 
  Edit3, Trash2, Users, ExternalLink, RefreshCw, Plus, Tv, 
  ChevronDown, ChevronUp, UserX, Share2, Sparkles, Check, AlertCircle, Play
} from 'lucide-react';
import { SettingsCard, SettingsInput, SaveButton, Toggle, VisibilitySelect } from './SettingsUI';
import { CreateEventModal } from './CreateEventModal';
import { getEventSubdomainUrl, getBracketSubdomainUrl, sanitizeSubdomain } from '../utils/subdomain';

type SettingsTab = "profile" | "events" | "privacy" | "integrations" | "notifications" | "danger";

const settingsTabs: { id: SettingsTab; icon: React.ElementType; label: string }[] = [
  { id: "profile", icon: User, label: "Profile" },
  { id: "events", icon: Calendar, label: "Manage Events" },
  { id: "privacy", icon: Shield, label: "Privacy" },
  { id: "integrations", icon: Link, label: "Integrations" },
  { id: "notifications", icon: Bell, label: "Notifications" },
  { id: "danger", icon: AlertTriangle, label: "Danger Zone" },
];

export function AccountSettingsPanel({ 
  user, 
  userProfile, 
  fetchUserProfile, 
  getHeaders,
  initialTab,
  onLoadTournament,
  onNavigateHome
}: { 
  user: any; 
  userProfile: any; 
  fetchUserProfile: () => void; 
  getHeaders: () => Promise<Record<string, string>>;
  initialTab?: SettingsTab;
  onLoadTournament?: (tournamentData: any) => void;
  onNavigateHome?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || "profile");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Local states
  const [firstName, setFirstName] = useState(userProfile?.first_name || '');
  const [lastName, setLastName] = useState(userProfile?.last_name || '');
  const [displayName, setDisplayName] = useState(userProfile?.gamer_tag || user?.user_metadata?.displayName || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [location, setLocation] = useState(userProfile?.location || '');
  const [profileColor, setProfileColor] = useState(userProfile?.profile_color || '');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userStartggInput, setUserStartggInput] = useState(userProfile?.startgg_slug || '');
  const [startggToken, setStartggToken] = useState(userProfile?.startgg_token === 'SECURE_HIDDEN' ? '' : (userProfile?.startgg_token || ''));
  const [userTekkenId, setUserTekkenId] = useState(userProfile?.tekken_id || '');
  const [userSteamId, setUserSteamId] = useState(userProfile?.steam_id || '');
  const [userTwitchId, setUserTwitchId] = useState(userProfile?.twitch_id || '');
  const [userTwitchUrl, setUserTwitchUrl] = useState(userProfile?.twitch_url || '');
  const [userYoutubeUrl, setUserYoutubeUrl] = useState(userProfile?.youtube_url || '');
  const [userTiktokUrl, setUserTiktokUrl] = useState(userProfile?.tiktok_url || '');
  const [userSpotifyUrl, setUserSpotifyUrl] = useState(userProfile?.spotify_url || '');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(userProfile?.discord_webhook_url || '');
  const [discordServerId, setDiscordServerId] = useState(userProfile?.discord_server_id || '');
  const [testingWebhook, setTestingWebhook] = useState(false);
  
  // Toggles State
  const [toggles, setToggles] = useState({
    notify_announcements: userProfile?.notify_announcements ?? true,
    notify_messages: userProfile?.notify_messages ?? true,
    sound_notifications: userProfile?.sound_notifications ?? true,
    sound_messages: userProfile?.sound_messages ?? true,
    is_public: userProfile?.is_public ?? true,
    friends_only: userProfile?.friends_only ?? false
  });

  // Updating States
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [savingIntegration, setSavingIntegration] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.first_name || '');
      setLastName(userProfile.last_name || '');
      setDisplayName(userProfile.gamer_tag || user?.user_metadata?.displayName || '');
      setBio(userProfile.bio || '');
      setLocation(userProfile.location || '');
      setProfileColor(userProfile.profile_color || '');
      setUserStartggInput(userProfile.startgg_slug || '');
      setStartggToken(userProfile.startgg_token === 'SECURE_HIDDEN' ? '' : (userProfile.startgg_token || ''));
      setUserTekkenId(userProfile.tekken_id || '');
      setUserSteamId(userProfile.steam_id || '');
      setUserTwitchId(userProfile.twitch_id || '');
      setUserTwitchUrl(userProfile.twitch_url || '');
      setUserYoutubeUrl(userProfile.youtube_url || '');
      setUserTiktokUrl(userProfile.tiktok_url || '');
      setUserSpotifyUrl(userProfile.spotify_url || '');
      setDiscordWebhookUrl(userProfile.discord_webhook_url || '');
      setDiscordServerId(userProfile.discord_server_id || '');
      
      setToggles({
        notify_announcements: userProfile.notify_announcements ?? true,
        notify_messages: userProfile.notify_messages ?? true,
        sound_notifications: userProfile.sound_notifications ?? true,
        sound_messages: userProfile.sound_messages ?? true,
        is_public: userProfile.is_public ?? true,
        friends_only: userProfile.friends_only ?? false
      });
    }
  }, [userProfile, user]);
  
  const handleUpdateProfile = async () => {
    setUpdatingProfile(true);
    try {
      const headers = await getHeaders();
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ first_name: firstName, last_name: lastName, gamer_tag: displayName, bio, location, profile_color: profileColor })
      });
      fetchUserProfile();
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    }
    setUpdatingProfile(false);
  };

  const handleUpdateAvatar = async () => {
    if (!newAvatarUrl) return;
    setUpdatingAvatar(true);
    try {
      const headers = await getHeaders();
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ avatar_url: newAvatarUrl })
      });
      fetchUserProfile();
      setNewAvatarUrl('');
      toast.success('Avatar updated successfully');
    } catch {
      toast.error('Failed to update avatar');
    }
    setUpdatingAvatar(false);
  };

  const handleUpdateEmail = async () => {
    setUpdatingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check both your old and new emails for confirmation links');
      setNewEmail('');
    }
    setUpdatingEmail(false);
  };

  const handleUpdatePassword = async () => {
    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated securely!');
      setNewPassword('');
    }
    setUpdatingPassword(false);
  };

  const handleToggleSetting = async (field: 'is_public' | 'friends_only' | 'notify_announcements' | 'notify_messages' | 'sound_notifications' | 'sound_messages', currentValue: boolean) => {
    const newValue = !currentValue;
    setToggles(prev => ({ ...prev, [field]: newValue }));
    
    try {
      const headers = await getHeaders();
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ [field]: newValue })
      });
      fetchUserProfile();
    } catch {
      toast.error('Failed to update settings');
      setToggles(prev => ({ ...prev, [field]: currentValue }));
    }
  };

  const saveIntegrationData = async (payload: any) => {
    setSavingIntegration(true);
    try {
      const headers = await getHeaders();
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      fetchUserProfile();
      toast.success('Integration saved!');
    } catch {
      toast.error('Failed to save integration');
    }
    setSavingIntegration(false);
  };

  const handleTestWebhook = async () => {
    if (!discordWebhookUrl) {
      toast.error('Enter a webhook URL first.');
      return;
    }
    setTestingWebhook(true);
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/discord/test-webhook', {
        method: 'POST',
        headers,
        body: JSON.stringify({ webhook_url: discordWebhookUrl })
      });
      if (res.ok) {
        toast.success('✅ Test embed sent to Discord!');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || 'Failed to send test webhook.');
      }
    } catch {
      toast.error('Network error sending test webhook.');
    }
    setTestingWebhook(false);
  };

  const copyId = () => {
    if (userProfile?.unique_id) {
      navigator.clipboard.writeText(userProfile.unique_id);
      toast.success('Copied FB-ID!');
    }
  };

  const handleLinkIdentity = async (provider: 'discord' | 'twitch' | 'google') => {
    const redirectUrl = `${window.location.origin}/?auth_callback=1`;
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: redirectUrl,
        scopes: provider === 'discord' ? 'identify email' : undefined,
      },
    });
    if (error) {
      // Fallback to signInWithOAuth if manual linking is disabled in Supabase Auth settings
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          scopes: provider === 'discord' ? 'identify email' : undefined,
        },
      });
      if (oauthErr) {
        toast.error(oauthErr.message || error.message);
      }
    }
  };

  // Hosted Events & Event Management State
  const [hostedEvents, setHostedEvents] = useState<any[]>([]);
  const [loadingHostedEvents, setLoadingHostedEvents] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState<'all' | 'upcoming' | 'live' | 'completed' | 'cancelled'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any | null>(null);
  const [expandedRosterEventId, setExpandedRosterEventId] = useState<string | null>(null);
  const [rosters, setRosters] = useState<Record<string, any[]>>({});
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const fetchHostedEvents = async () => {
    setLoadingHostedEvents(true);
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/community-events?mine=true&per_page=50', { headers });
      if (res.ok) {
        const data = await res.json();
        setHostedEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching hosted events:', err);
    } finally {
      setLoadingHostedEvents(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'events') {
      fetchHostedEvents();
    }
  }, [activeTab]);

  const handleUpdateStatus = async (eventId: string, newStatus: string) => {
    setUpdatingStatusId(eventId);
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/community-events/${eventId}/status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update event status');
      toast.success(`Event status set to ${newStatus.toUpperCase()}`);
      setHostedEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, status: newStatus } : ev));
    } catch (err: any) {
      toast.error(err.message || 'Error updating status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleToggleRoster = async (eventId: string) => {
    if (expandedRosterEventId === eventId) {
      setExpandedRosterEventId(null);
      return;
    }
    setExpandedRosterEventId(eventId);
    if (!rosters[eventId]) {
      setLoadingRoster(true);
      try {
        const headers = await getHeaders();
        const res = await fetch(`/api/community-events/${eventId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setRosters(prev => ({ ...prev, [eventId]: data.event?.participants || [] }));
        }
      } catch (err) {
        console.error('Error loading roster:', err);
      } finally {
        setLoadingRoster(false);
      }
    }
  };

  const handleRemoveParticipant = async (eventId: string, targetUserId: string, gamerTag: string) => {
    if (!window.confirm(`Disqualify / remove ${gamerTag} from this tournament?`)) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/community-events/${eventId}/participants/${targetUserId}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to remove competitor' }));
        throw new Error(err.detail || 'Failed to remove competitor');
      }
      toast.success(`Removed ${gamerTag} from tournament.`);
      setRosters(prev => ({
        ...prev,
        [eventId]: (prev[eventId] || []).filter((p: any) => p.userId !== targetUserId)
      }));
      setHostedEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, fighters: Math.max(0, ev.fighters - 1) } : ev));
    } catch (err: any) {
      toast.error(err.message || 'Error removing participant');
    }
  };

  const handleDeleteHostedEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This will permanently remove its registrations and tournament bracket.')) return;
    setDeletingEventId(eventId);
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/community-events/${eventId}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed to delete event');
      toast.success('Event deleted successfully');
      setHostedEvents(prev => prev.filter(ev => ev.id !== eventId));
    } catch (err: any) {
      toast.error(err.message || 'Error deleting event');
    } finally {
      setDeletingEventId(null);
    }
  };

  const handleLaunchBracket = async (event: any) => {
    try {
      toast.info('Loading tournament bracket into FightBracket Pro...');
      const res = await fetch(`/api/community-events/${event.id || event.slug}/bracket`);
      if (!res.ok) throw new Error('Failed to load bracket data');
      const data = await res.json();
      const parsedData = JSON.parse(data.data);
      const sub = sanitizeSubdomain(event.subdomain || data.subdomain || parsedData.subdomain, 'ev');
      parsedData.subdomain = sub;
      if (parsedData.activeTournament) {
        parsedData.activeTournament.subdomain = sub;
      }
      if (onLoadTournament) {
        onLoadTournament(parsedData);
        toast.success(`Loaded "${event.name}" bracket!`);
        onNavigateHome?.();
      } else {
        window.location.href = getBracketSubdomainUrl({ subdomain: sub, tournamentId: data.tournamentId });
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not open bracket');
    }
  };

  const filteredHostedEvents = hostedEvents.filter(ev => {
    const matchesSearch = !eventSearch.trim() || 
      ev.name?.toLowerCase().includes(eventSearch.toLowerCase()) ||
      ev.game?.toLowerCase().includes(eventSearch.toLowerCase()) ||
      ev.location?.toLowerCase().includes(eventSearch.toLowerCase());
    const matchesStatus = eventStatusFilter === 'all' || ev.status === eventStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl w-full">
      {/* Settings sidebar */}
      <div className="flex lg:flex-col gap-1 lg:w-56 flex-shrink-0 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
        {settingsTabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0 lg:w-full text-left group"
            style={{
              color: activeTab === id ? "#00E5FF" : "#8a8a9a",
              background: activeTab === id ? "rgba(0, 229, 255, 0.1)" : "transparent",
              borderLeft: activeTab === id ? "3px solid #00E5FF" : "3px solid transparent",
              borderTopRightRadius: "4px",
              borderBottomRightRadius: "4px"
            }}
          >
            <Icon size={16} />
            {label}
            {id === "events" && hostedEvents.length > 0 && (
              <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold">
                {hostedEvents.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Settings panel */}
      <div className="flex-1 min-w-0">
        
        {activeTab === "events" && (
          <div className="animate-in fade-in duration-300 space-y-6">
            {/* Header Card */}
            <div className="p-6 rounded-xl bg-[#141418] border border-white/10 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent pointer-events-none rounded-full blur-3xl -mr-20 -mt-20" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Trophy size={18} />
                    </span>
                    <h2 className="text-xl font-bold font-rajdhani uppercase tracking-wider text-white">
                      MANAGE & EDIT EVENTS
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase">
                      ORGANIZER ADMIN
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono">
                    Configure tournament rules, update match streaming links, manage participant rosters, update live status, and run interactive bracket stations.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={fetchHostedEvents}
                    disabled={loadingHostedEvents}
                    className="p-2.5 rounded-lg border border-white/10 hover:border-white/30 text-gray-300 hover:text-white bg-white/5 transition-all"
                    title="Refresh Events"
                  >
                    <RefreshCw size={15} className={loadingHostedEvents ? 'animate-spin' : ''} />
                  </button>

                  <button
                    onClick={() => {
                      setEventToEdit(null);
                      setShowCreateModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-rajdhani font-bold text-sm tracking-wider shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
                  >
                    <Plus size={16} /> HOST NEW EVENT
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    placeholder="Search by tournament name, game, or location..."
                    className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-lg px-3.5 py-2 text-xs font-mono text-white placeholder-gray-500 outline-none transition-colors"
                  />
                  {eventSearch && (
                    <button
                      onClick={() => setEventSearch('')}
                      className="absolute right-3 top-2.5 text-gray-500 hover:text-white text-xs font-mono"
                    >
                      CLEAR
                    </button>
                  )}
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {(['all', 'upcoming', 'live', 'completed', 'cancelled'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setEventStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase transition-all whitespace-nowrap ${
                        eventStatusFilter === st
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold'
                          : 'bg-white/5 text-gray-400 hover:text-white border border-white/5 hover:border-white/20'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Events List */}
            {loadingHostedEvents && hostedEvents.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-[#141418] border border-white/5 space-y-3 font-mono text-xs text-gray-400">
                <RefreshCw size={24} className="animate-spin text-cyan-400 mx-auto" />
                <p>Loading your hosted tournaments & events...</p>
              </div>
            ) : filteredHostedEvents.length === 0 ? (
              <div className="p-10 rounded-xl bg-[#141418] border border-white/10 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
                  <Trophy size={28} />
                </div>
                {hostedEvents.length === 0 ? (
                  <>
                    <h3 className="text-lg font-bold font-rajdhani tracking-wider text-white uppercase">
                      NO EVENTS HOSTED YET
                    </h3>
                    <p className="text-xs text-gray-400 font-mono max-w-md mx-auto leading-relaxed">
                      You haven't created or hosted any tournaments yet. Become a tournament organizer on FightBracket Pro! Create custom brackets, manage competitor rosters, assign match stations, and stream live.
                    </p>
                    <button
                      onClick={() => {
                        setEventToEdit(null);
                        setShowCreateModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-rajdhani font-bold text-sm tracking-wider transition-all"
                    >
                      <Plus size={16} /> HOST YOUR FIRST EVENT
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-bold font-rajdhani tracking-wider text-white uppercase">
                      NO MATCHING EVENTS
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">
                      No hosted tournaments match "{eventSearch}" with status "{eventStatusFilter}".
                    </p>
                    <button
                      onClick={() => {
                        setEventSearch('');
                        setEventStatusFilter('all');
                      }}
                      className="text-xs font-mono text-cyan-400 underline hover:text-cyan-300"
                    >
                      Reset Filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHostedEvents.map((ev) => {
                  const isLive = ev.status === 'live';
                  const isCompleted = ev.status === 'completed';
                  const isCancelled = ev.status === 'cancelled';
                  const isRosterExpanded = expandedRosterEventId === ev.id;
                  const currentRoster = rosters[ev.id] || [];

                  return (
                    <div
                      key={ev.id}
                      className="rounded-xl bg-[#141418] border border-white/10 hover:border-cyan-500/30 transition-all overflow-hidden shadow-lg"
                    >
                      {/* Event Main Info Card */}
                      <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                          {/* Banner or Icon Thumbnail */}
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0 relative">
                            {ev.bannerUrl ? (
                              <img src={ev.bannerUrl} alt={ev.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-cyan-400 bg-gradient-to-br from-cyan-500/20 to-black">
                                <Trophy size={28} />
                              </div>
                            )}
                            <div className="absolute top-1 left-1">
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/80 text-white font-bold uppercase backdrop-blur-sm border border-white/10">
                                {ev.gameId || ev.game}
                              </span>
                            </div>
                          </div>

                          {/* Event Text Info */}
                          <div className="min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold font-rajdhani text-white uppercase tracking-wider truncate">
                                {ev.name}
                              </h3>

                              {/* Status Badge */}
                              {isLive && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
                                  LIVE NOW
                                </span>
                              )}
                              {ev.status === 'upcoming' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                  UPCOMING
                                </span>
                              )}
                              {isCompleted && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-gray-700/40 text-gray-400 border border-gray-600/30">
                                  COMPLETED
                                </span>
                              )}
                              {isCancelled && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40">
                                  CANCELLED
                                </span>
                              )}

                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10 uppercase">
                                {ev.format?.replace('_', ' ') || 'Double Elimination'}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                                {sanitizeSubdomain(ev.subdomain, 'ev')}.fightbracketpro.com
                              </span>
                            </div>

                            {/* Details meta */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 font-mono">
                              <span className="flex items-center gap-1 text-gray-300">
                                <Calendar size={13} className="text-cyan-400" />
                                {ev.date || 'TBD'}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Globe size={13} className="text-cyan-400" />
                                {ev.location || (ev.isOnline ? 'Online' : 'In-Person')}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-white">
                                <Users size={13} className="text-cyan-400" />
                                <strong>{ev.fighters || 0}</strong> / {ev.maxEntrants || 64} Fighters
                              </span>
                              {ev.prizePool && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-400 font-bold">
                                    {ev.prizePool}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Switcher & Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5">
                          {/* Live Status Quick Controller */}
                          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10">
                            <span className="text-[10px] font-mono text-gray-500 uppercase px-1.5 font-bold">
                              STATUS:
                            </span>
                            {(['upcoming', 'live', 'completed', 'cancelled'] as const).map((st) => (
                              <button
                                key={st}
                                onClick={() => handleUpdateStatus(ev.id, st)}
                                disabled={updatingStatusId === ev.id}
                                className={`text-[10px] font-mono px-2 py-1 rounded tracking-wider uppercase transition-all ${
                                  ev.status === st
                                    ? st === 'live'
                                      ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/50'
                                      : st === 'completed'
                                      ? 'bg-gray-600/50 text-white font-bold border border-gray-500'
                                      : st === 'cancelled'
                                      ? 'bg-rose-500/30 text-rose-300 font-bold border border-rose-500/50'
                                      : 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/50'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                                title={`Set status to ${st}`}
                              >
                                {st === 'live' ? '● LIVE' : st}
                              </button>
                            ))}
                          </div>

                          {/* Edit Event Button */}
                          <button
                            onClick={() => {
                              setEventToEdit(ev);
                              setShowCreateModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-rajdhani font-bold text-xs tracking-wider transition-all"
                            title="Edit Event Details, Rules, Stream & Venue"
                          >
                            <Edit3 size={13} /> EDIT EVENT
                          </button>

                          {/* Roster Button */}
                          <button
                            onClick={() => handleToggleRoster(ev.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-rajdhani font-bold text-xs tracking-wider border transition-all ${
                              isRosterExpanded
                                ? 'bg-white/20 text-white border-white/30'
                                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                            }`}
                            title="View and manage competitor registrations"
                          >
                            <Users size={13} /> ROSTER ({ev.fighters || 0})
                            {isRosterExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>

                          {/* Bracket Button */}
                          <button
                            onClick={() => handleLaunchBracket(ev)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-rajdhani font-bold text-xs tracking-wider transition-all"
                            title="Open interactive tournament bracket"
                          >
                            <Trophy size={13} /> BRACKET
                          </button>

                          {/* Copy Subdomain Share Link */}
                          <button
                            onClick={() => {
                              const subUrl = getEventSubdomainUrl(ev.subdomain, ev.slug || ev.id);
                              navigator.clipboard.writeText(subUrl);
                              toast.success(`Subdomain link copied: ${subUrl}`);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-rajdhani font-bold text-xs tracking-wider transition-all"
                            title="Copy Subdomain Share Link"
                          >
                            <Share2 size={13} /> SHARE SUBDOMAIN
                          </button>

                          {/* Public Page Link */}
                          <a
                            href={`/events/${ev.slug || ev.id}?sub=${encodeURIComponent(sanitizeSubdomain(ev.subdomain, 'ev'))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all"
                            title="View Public Event Page"
                          >
                            <ExternalLink size={14} />
                          </a>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteHostedEvent(ev.id)}
                            disabled={deletingEventId === ev.id}
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                            title="Delete Event"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Competitor Roster Drawer */}
                      {isRosterExpanded && (
                        <div className="border-t border-white/10 bg-black/40 p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users size={15} className="text-cyan-400" />
                              <h4 className="font-rajdhani font-bold tracking-wider text-sm text-white uppercase">
                                REGISTERED COMPETITORS ({currentRoster.length})
                              </h4>
                            </div>
                            <span className="text-[11px] font-mono text-gray-400">
                              As event host / admin, you can remove or disqualify competitors.
                            </span>
                          </div>

                          {loadingRoster && currentRoster.length === 0 ? (
                            <div className="text-center py-6 font-mono text-xs text-gray-400 flex items-center justify-center gap-2">
                              <RefreshCw size={14} className="animate-spin text-cyan-400" /> Loading tournament roster...
                            </div>
                          ) : currentRoster.length === 0 ? (
                            <div className="p-4 rounded-lg bg-white/5 border border-white/5 text-center text-xs font-mono text-gray-400">
                              No competitors have registered yet for this tournament.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {currentRoster.map((p: any) => (
                                <div
                                  key={p.userId || p.id}
                                  className="p-3 rounded-lg bg-[#0E121E] border border-white/5 flex items-center justify-between gap-3 hover:border-white/20 transition-all"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs uppercase shrink-0">
                                      {p.gamerTag?.[0] || 'F'}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-xs text-white truncate font-rajdhani tracking-wide">
                                        {p.gamerTag}
                                      </div>
                                      <div className="text-[10px] font-mono text-gray-400 truncate">
                                        ID: {p.userId?.slice(0, 8)}...
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleRemoveParticipant(ev.id, p.userId, p.gamerTag)}
                                    className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-all shrink-0"
                                    title="Disqualify / Remove Competitor"
                                  >
                                    <UserX size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Create / Edit Event Modal */}
            {showCreateModal && (
              <CreateEventModal
                isOpen={showCreateModal}
                onClose={() => {
                  setShowCreateModal(false);
                  setEventToEdit(null);
                }}
                getHeaders={getHeaders as any}
                currentUser={user}
                userProfile={userProfile}
                eventToEdit={eventToEdit}
                onEventCreated={(newEvent) => {
                  setHostedEvents((prev) => [newEvent, ...prev]);
                  setShowCreateModal(false);
                }}
                onEventUpdated={(updatedEvent) => {
                  setHostedEvents((prev) =>
                    prev.map((ev) => (ev.id === updatedEvent.id ? { ...ev, ...updatedEvent } : ev))
                  );
                  setShowCreateModal(false);
                  setEventToEdit(null);
                }}
              />
            )}
          </div>
        )}
        
        {activeTab === "profile" && (
          <div className="animate-in fade-in duration-300">
            <SettingsCard title="Public Identity" description="How you appear to other players and TOs on the platform.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <SettingsInput label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                <SettingsInput label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
              <div className="mb-4">
                <SettingsInput label="Gamer Tag / Display Name" value={displayName} onChange={e => setDisplayName(e.target.value)} helper="This is how you appear in brackets and leaderboards." />
              </div>
              <div className="mb-5">
                <SettingsInput label="Bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="Main character, stream schedule, etc..." />
                <SettingsInput
                  label="Region / City / Zip Code"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Atlanta, GA or 30301"
                  helper="Used to show nearby tournaments and events in your feed."
                />
              </div>
              <div className="mb-5">
                <label className="block text-xs font-rajdhani font-bold text-gray-400 uppercase tracking-wider mb-2">Profile Modal Color</label>
                <div className="flex flex-wrap items-center gap-3">
                  {['#00E5FF', '#FF006E', '#FF3366', '#00F0FF', '#FFB800', '#9D4EDD', '#00FF9D'].map(color => (
                    <button
                      key={color}
                      onClick={() => setProfileColor(color)}
                      className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ 
                        backgroundColor: color,
                        borderColor: profileColor === color ? 'white' : 'transparent',
                        boxShadow: profileColor === color ? `0 0 10px ${color}` : 'none'
                      }}
                    />
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <input 
                      type="color" 
                      value={profileColor || '#00E5FF'} 
                      onChange={e => setProfileColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-xs font-mono text-gray-500 uppercase">Custom</span>
                  </div>
                  {profileColor && (
                    <button onClick={() => setProfileColor('')} className="ml-auto text-xs font-mono text-red-400 hover:text-red-300 transition-colors">Clear</button>
                  )}
                </div>
              </div>
              <div className="flex justify-end"><SaveButton onClick={handleUpdateProfile} loading={updatingProfile} /></div>
            </SettingsCard>

            <SettingsCard title="Avatar" description="Used in event headers and your public profile.">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex items-center justify-center text-xl font-bold text-[#050A14] flex-shrink-0 bg-[#00E5FF] rounded-lg">
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    displayName.substring(0,2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) setNewAvatarUrl(event.target.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="flex-1 bg-[#111] border border-gray-800 rounded-lg p-2 text-white outline-none font-mono text-sm w-full"
                  />
                  <div className="flex justify-start">
                    <SaveButton label="UPLOAD AVATAR" onClick={handleUpdateAvatar} disabled={!newAvatarUrl} loading={updatingAvatar} />
                  </div>
                </div>
              </div>
            </SettingsCard>

            <SettingsCard title="Unique FB-ID" description="Your permanent platform identifier.">
              <div className="flex items-center gap-3 p-3 mb-1 bg-[#111] border border-white/10 rounded-lg">
                <code className="flex-1 text-sm font-mono text-[#00E5FF] font-bold">{userProfile?.unique_id || 'Generating...'}</code>
                <button onClick={copyId} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                  COPY
                </button>
              </div>
            </SettingsCard>

            <SettingsCard title="Account Credentials" description="Update your login email or password.">
              <div className="mb-4">
                <SettingsInput label="Email Address" value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" />
                <div className="flex justify-end mt-2"><SaveButton label="UPDATE EMAIL" onClick={handleUpdateEmail} disabled={!newEmail} loading={updatingEmail} /></div>
              </div>
              <div className="mb-2 pt-4 border-t border-white/5">
                <SettingsInput label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" helper="Minimum 8 characters." />
                <div className="flex justify-end mt-2"><SaveButton label="UPDATE PASSWORD" onClick={handleUpdatePassword} disabled={!newPassword} loading={updatingPassword} /></div>
              </div>
            </SettingsCard>
          </div>
        )}

        {activeTab === "privacy" && (
          <div className="animate-in fade-in duration-300">
            <SettingsCard title="Profile Visibility" description="Control who can find and view your player profile.">
              <Toggle label="Publicly Searchable Profile" description="Allow other users to find you by name or tag." checked={toggles.is_public} onChange={() => handleToggleSetting('is_public', toggles.is_public)} />
              <Toggle label="Friends-Only Start.gg Stats" description="Limit Start.gg placement records to friends only." checked={toggles.friends_only} onChange={() => handleToggleSetting('friends_only', toggles.friends_only)} />
            </SettingsCard>
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="animate-in fade-in duration-300">
            
            <SettingsCard title="Linked Authentication" description="Link external accounts to sign in with one click.">
              <div className="flex flex-wrap gap-3">
                <button onClick={() => handleLinkIdentity('discord')} className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/50 text-[#5865F2] font-bold text-xs transition-all font-mono">
                  {user?.identities?.some((id: any) => id.provider === 'discord') ? '✓ DISCORD LINKED (RECONNECT)' : 'LINK DISCORD'}
                </button>
                <button onClick={() => handleLinkIdentity('twitch')} className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#9146FF]/20 hover:bg-[#9146FF]/30 border border-[#9146FF]/50 text-[#9146FF] font-bold text-xs transition-all font-mono">
                  {user?.identities?.some((id: any) => id.provider === 'twitch') ? '✓ TWITCH LINKED (RECONNECT)' : 'LINK TWITCH'}
                </button>
                <button onClick={() => handleLinkIdentity('google')} className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all font-mono">
                  {user?.identities?.some((id: any) => id.provider === 'google') ? '✓ GOOGLE LINKED (RECONNECT)' : 'LINK GOOGLE'}
                </button>
              </div>
            </SettingsCard>
            
            <SettingsCard title="Start.gg Integration" description="Connect your Start.gg account to import brackets and tournament history.">
              <div className="flex flex-col gap-4 mb-5">
                <div className="mb-2">
                  <SettingsInput label="API Token" value={startggToken} onChange={e => setStartggToken(e.target.value)} type="password" placeholder={userProfile?.startgg_token === 'SECURE_HIDDEN' ? '•••••••••••••••• (Saved)' : ''} helper="Generate tokens at start.gg/admin/profile/developer" />
                </div>
                <div className="flex justify-end"><SaveButton label="SAVE TOKEN" onClick={() => saveIntegrationData({ startgg_token: startggToken })} loading={savingIntegration} /></div>
                
                <div className="mb-2 mt-4">
                  <SettingsInput label="Profile Slug" value={userStartggInput} onChange={e => setUserStartggInput(e.target.value)} placeholder="e.g. mang0" />
                </div>
                <div className="flex justify-end"><SaveButton label="SAVE SLUG" onClick={() => saveIntegrationData({ startgg_slug: userStartggInput })} loading={savingIntegration} /></div>
              </div>
            </SettingsCard>

            <SettingsCard title="Game & Social Media IDs" description="Link your game accounts and broadcast channels to feature on your public profile.">
              <div className="mb-4">
                <SettingsInput label="Tekken 8 Polaris ID" value={userTekkenId} onChange={e => setUserTekkenId(e.target.value)} placeholder="e.g. 1234-5678-9012" />
                <div className="flex justify-end mt-2"><SaveButton onClick={() => saveIntegrationData({ tekken_id: userTekkenId })} loading={savingIntegration} /></div>
              </div>
              <div className="mb-4 pt-4 border-t border-white/5">
                <SettingsInput label="Steam ID / Vanity URL" value={userSteamId} onChange={e => setUserSteamId(e.target.value)} placeholder="e.g. 76561198000000000" />
                <div className="flex justify-end mt-2"><SaveButton onClick={() => saveIntegrationData({ steam_id: userSteamId })} loading={savingIntegration} /></div>
              </div>
              <div className="mb-4 pt-4 border-t border-white/5 space-y-3">
                <SettingsInput label="Twitch Username" value={userTwitchId} onChange={e => setUserTwitchId(e.target.value)} placeholder="e.g. fightbracket" />
                <SettingsInput label="Twitch Channel URL" value={userTwitchUrl} onChange={e => setUserTwitchUrl(e.target.value)} placeholder="e.g. https://twitch.tv/..." />
                <SettingsInput label="YouTube Channel URL" value={userYoutubeUrl} onChange={e => setUserYoutubeUrl(e.target.value)} placeholder="e.g. https://youtube.com/@fightbracket" />
                <SettingsInput label="TikTok Profile URL" value={userTiktokUrl} onChange={e => setUserTiktokUrl(e.target.value)} placeholder="e.g. https://tiktok.com/@fightbracket" />
                <SettingsInput label="Spotify Playlist / Track URL" value={userSpotifyUrl} onChange={e => setUserSpotifyUrl(e.target.value)} placeholder="e.g. https://open.spotify.com/playlist/..." />
                <div className="flex justify-end mt-2">
                  <SaveButton
                    label="SAVE SOCIAL LINKS"
                    onClick={() => saveIntegrationData({
                      twitch_id: userTwitchId,
                      twitch_url: userTwitchUrl,
                      youtube_url: userYoutubeUrl,
                      tiktok_url: userTiktokUrl,
                      spotify_url: userSpotifyUrl
                    })}
                    loading={savingIntegration}
                  />
                </div>
              </div>
            </SettingsCard>

            <SettingsCard title="Discord Integration" description="Connect your Discord server for automated match callouts, results, and announcements.">
              {/* Webhook Section */}
              <div className="mb-5">
                <label className="block text-xs font-rajdhani font-bold text-gray-400 uppercase tracking-wider mb-1">Webhook URL</label>
                <p className="text-[11px] font-mono text-gray-600 mb-2">
                  Discord Server → Channel Settings → Integrations → Webhooks → New Webhook → Copy URL
                </p>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <SettingsInput
                      label=""
                      value={discordWebhookUrl}
                      onChange={e => setDiscordWebhookUrl(e.target.value)}
                      placeholder="https://discord.com/api/webhooks/..."
                      type="password"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={handleTestWebhook}
                    disabled={testingWebhook || !discordWebhookUrl}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderColor: 'rgba(88,101,242,0.5)', color: '#5865F2', background: 'rgba(88,101,242,0.1)' }}
                  >
                    {testingWebhook ? 'SENDING...' : 'TEST WEBHOOK'}
                  </button>
                  <SaveButton
                    label="SAVE WEBHOOK"
                    onClick={() => saveIntegrationData({ discord_webhook_url: discordWebhookUrl })}
                    loading={savingIntegration}
                  />
                </div>
              </div>

              {/* Server Widget Section */}
              <div className="pt-4 border-t border-white/5">
                <label className="block text-xs font-rajdhani font-bold text-gray-400 uppercase tracking-wider mb-1">Server ID (Widget)</label>
                <p className="text-[11px] font-mono text-gray-600 mb-2">
                  Enable Widget in Discord Server Settings → Widget → Enable Server Widget. The numeric Server ID appears there.
                </p>
                <SettingsInput
                  label=""
                  value={discordServerId}
                  onChange={e => setDiscordServerId(e.target.value)}
                  placeholder="e.g. 1234567890123456789"
                />
                <div className="flex justify-end mt-2">
                  <SaveButton
                    label="SAVE SERVER ID"
                    onClick={() => saveIntegrationData({ discord_server_id: discordServerId })}
                    loading={savingIntegration}
                  />
                </div>
              </div>
            </SettingsCard>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="animate-in fade-in duration-300">
            <SettingsCard title="Email Notifications">
              <Toggle label="Platform announcements" description="New features and platform updates." checked={toggles.notify_announcements} onChange={() => handleToggleSetting('notify_announcements', toggles.notify_announcements)} />
              <Toggle label="Direct Messages" description="When you receive a new message from a friend." checked={toggles.notify_messages} onChange={() => handleToggleSetting('notify_messages', toggles.notify_messages)} />
            </SettingsCard>
            <div className="mt-4">
              <SettingsCard title="In-App Sounds">
                <Toggle label="Sound on Notification" description="Play a subtle ping when you receive a new platform notification." checked={toggles.sound_notifications} onChange={() => handleToggleSetting('sound_notifications', toggles.sound_notifications)} />
                <Toggle label="Sound on Message" description="Play a subtle ping when you receive a direct message." checked={toggles.sound_messages} onChange={() => handleToggleSetting('sound_messages', toggles.sound_messages)} />
              </SettingsCard>
            </div>
          </div>
        )}

        {activeTab === "danger" && (
          <div className="animate-in fade-in duration-300">


            <SettingsCard title="Export Account Data" description="Download a full copy of your account data including events, brackets, and fighter records.">
              <button className="flex items-center gap-2 h-10 px-4 text-sm font-rajdhani font-bold tracking-wider transition-all bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10">
                <Globe size={16} /> REQUEST DATA EXPORT
              </button>
            </SettingsCard>

            <div className="p-5" style={{ background: "#141418", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px" }}>
              <div className="mb-4 pb-3" style={{ borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
                <h3 className="uppercase tracking-wide text-sm flex items-center gap-2 text-red-500 font-rajdhani font-bold">
                  <AlertTriangle size={16} /> DELETE ACCOUNT
                </h3>
              </div>
              <p className="text-xs text-gray-400 mb-4 font-mono leading-relaxed">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button className="h-10 px-6 text-sm font-rajdhani font-bold tracking-wider text-red-500 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all">
                DELETE MY ACCOUNT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
