import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar, MapPin, Users, ExternalLink, ChevronLeft, ChevronRight, 
  Gamepad2, Map, Plus, GitBranch, Trophy, Globe, Tv, Shield, Check, Trash2, Info, Eye, Sparkles, Share2
} from 'lucide-react';
import { toast } from 'sonner';
import startggGames from '../data/startggGames.json';
import { CreateEventModal } from './CreateEventModal';

interface StartggEvent {
  id: string;
  name: string;
  slug: string;
  date: string;
  location: string;
  fighters: number;
  image?: string;
}

export interface CommunityEvent {
  id: string;
  name: string;
  slug: string;
  game: string;
  gameId: string;
  eventType: string;
  format: string;
  startDate?: string;
  date: string;
  endDate?: string;
  isOnline: boolean;
  location: string;
  venueName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  rules?: string;
  streamUrl?: string;
  discordUrl?: string;
  bannerUrl?: string;
  entryFee?: string;
  prizePool?: string;
  maxEntrants: number;
  fighters: number;
  status: string;
  tournamentId?: string;
  organizer: {
    id: string;
    gamerTag: string;
    avatarUrl?: string;
    uniqueId: string;
    isOwner: boolean;
  };
  isRegistered?: boolean;
  isOwner?: boolean;
}

interface EventsPanelProps {
  getHeaders: () => Promise<HeadersInit>;
  onNavigateHome?: () => void;
  currentUser?: any;
  userProfile?: any;
  onLoadTournament?: (tournamentData: any) => void;
}

export function EventsPanel({ 
  getHeaders, 
  onNavigateHome, 
  currentUser, 
  userProfile,
  onLoadTournament 
}: EventsPanelProps) {
  // Source Toggle: 'fightbracket' vs 'startgg'
  const [source, setSource] = useState<'fightbracket' | 'startgg'>('fightbracket');

  // Shared Filters
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [upcoming, setUpcoming] = useState(true);
  const [page, setPage] = useState(1);
  const [locationFilter, setLocationFilter] = useState("");
  const [activeLocationFilter, setActiveLocationFilter] = useState("");
  const [gameFilter, setGameFilter] = useState<string>("");
  const [mineOnly, setMineOnly] = useState(false);

  // Community Events State
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
  const [communityTotalPages, setCommunityTotalPages] = useState(1);

  // Start.gg Events State
  const [startggEvents, setStartggEvents] = useState<StartggEvent[]>([]);
  const [startggTotalPages, setStartggTotalPages] = useState(1);

  // General Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<CommunityEvent | null>(null);
  const [eventParticipants, setEventParticipants] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const formatLocalTime = (isoString?: string, fallbackStr?: string) => {
    if (!isoString && !fallbackStr) return 'TBA';
    if (!isoString) return fallbackStr;
    try {
      const safeIso = isoString.endsWith('Z') || isoString.includes('+') || isoString.includes('-') && isoString.length > 10 ? isoString : isoString + 'Z';
      const d = new Date(safeIso);
      if (isNaN(d.getTime())) return fallbackStr;
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      }).format(d);
    } catch {
      return fallbackStr;
    }
  };

  useEffect(() => {
    if (source === 'fightbracket') {
      fetchCommunityEvents();
    } else {
      fetchStartggEvents();
    }
  }, [source, query, upcoming, page, activeLocationFilter, gameFilter, mineOnly]);

  // Fetch FightBracket Community Events
  const fetchCommunityEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const params = new URLSearchParams({
        upcoming: String(upcoming),
        page: String(page),
        per_page: '12'
      });
      if (query) params.append('q', query);
      if (gameFilter) params.append('game', gameFilter);
      if (activeLocationFilter) params.append('location', activeLocationFilter);
      if (mineOnly) params.append('mine', 'true');

      const res = await fetch(`/api/community-events?${params.toString()}`, {
        method: 'GET',
        headers
      });

      if (!res.ok) {
        throw new Error('Failed to fetch FightBracket events');
      }

      const data = await res.json();
      setCommunityEvents(data.events || []);
      setCommunityTotalPages(data.totalPages || 1);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading FightBracket events');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Start.gg Tournaments
  const fetchStartggEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/events/search', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: query,
          upcoming: upcoming,
          page: page,
          perPage: 12,
          location: activeLocationFilter || undefined,
          videogameId: gameFilter ? parseInt(gameFilter) : undefined
        })
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("unauthorized");
        } else {
          setError("Failed to fetch Start.gg events");
        }
        setStartggEvents([]);
        return;
      }

      const data = await res.json();
      setStartggEvents(data.events || []);
      setStartggTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError("Network error fetching Start.gg tournaments");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(searchInput);
    setActiveLocationFilter(locationFilter);
  };

  // Register / Unregister for a FightBracket Community Event
  const handleToggleRegistration = async (event: CommunityEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error('Please log in to register for events.');
      return;
    }

    setRegisteringId(event.id);
    try {
      const headers = await getHeaders();
      const endpoint = event.isRegistered
        ? `/api/community-events/${event.id}/unregister`
        : `/api/community-events/${event.id}/register`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ gamer_tag: userProfile?.gamer_tag || '' })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(err.detail || 'Registration failed');
      }

      const resData = await res.json();
      toast.success(resData.message || (event.isRegistered ? 'Registration cancelled' : 'Registered!'));

      // Optimistic state update
      setCommunityEvents(prev => prev.map(ev => {
        if (ev.id === event.id) {
          return {
            ...ev,
            isRegistered: !event.isRegistered,
            fighters: resData.fighters !== undefined ? resData.fighters : (event.isRegistered ? Math.max(0, ev.fighters - 1) : ev.fighters + 1)
          };
        }
        return ev;
      }));

      // Update modal if open
      if (selectedDetailEvent && selectedDetailEvent.id === event.id) {
        setSelectedDetailEvent(prev => prev ? {
          ...prev,
          isRegistered: !event.isRegistered,
          fighters: resData.fighters !== undefined ? resData.fighters : (event.isRegistered ? Math.max(0, prev.fighters - 1) : prev.fighters + 1)
        } : null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration error');
    } finally {
      setRegisteringId(null);
    }
  };

  // Launch / Open Tournament Bracket
  const handleOpenBracket = async (event: CommunityEvent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!event.tournamentId) {
      toast.error('No tournament bracket initialized for this event.');
      return;
    }

    try {
      toast.info('Loading tournament bracket into FightBracket Pro...');
      const res = await fetch(`/api/community-events/${event.id}/bracket`);
      if (!res.ok) {
        throw new Error('Failed to load event bracket');
      }
      const data = await res.json();
      const parsedData = JSON.parse(data.data);

      if (onLoadTournament) {
        onLoadTournament(parsedData);
        toast.success(`Loaded "${event.name}" bracket!`);
        onNavigateHome?.();
      } else {
        // Fallback: navigate directly to public tournament permalink
        window.location.href = `/t/${data.tournamentId}`;
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not open bracket');
    }
  };

  // Open Details Modal
  const handleOpenDetails = async (event: CommunityEvent) => {
    setSelectedDetailEvent(event);
    setLoadingDetails(true);
    setEventParticipants([]);
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/community-events/${event.id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setEventParticipants(data.event?.participants || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Delete Community Event (Owner only)
  const handleDeleteEvent = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this event? This will also remove its associated bracket.')) {
      return;
    }

    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/community-events/${eventId}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) throw new Error('Failed to delete event');
      toast.success('Event deleted');
      setCommunityEvents(prev => prev.filter(ev => ev.id !== eventId));
      if (selectedDetailEvent?.id === eventId) setSelectedDetailEvent(null);
    } catch (err: any) {
      toast.error(err.message || 'Error deleting event');
    }
  };

  return (
    <div className="p-4 lg:p-8 animate-in fade-in duration-300 min-h-full" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header & Create Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF]">
              <Calendar size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-widest text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Events & Tournaments
              </h1>
              <p className="text-xs text-gray-400">
                Discover fighting game competitions or host your own FightBracket tournament
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {source === 'fightbracket' && (
              <button
                onClick={() => {
                  if (!currentUser) {
                    toast.error('Please log in to host a tournament event.');
                    return;
                  }
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] text-[#050A14] font-bold text-xs tracking-wider rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,229,255,0.25)] uppercase whitespace-nowrap"
                style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.08em' }}
              >
                <Plus size={16} /> HOST EVENT
              </button>
            )}
          </div>
        </div>

        {/* ─── Search Source Switch Toggle ─────────────────────────────────── */}
        <div className="bg-[#111116] border border-white/10 rounded-2xl p-2 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 w-full sm:w-auto p-1 bg-black/40 rounded-xl border border-white/5">
            <button
              onClick={() => { setSource('fightbracket'); setPage(1); }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold tracking-widest transition-all ${
                source === 'fightbracket'
                  ? 'bg-gradient-to-r from-[#00E5FF]/20 to-[#00E5FF]/10 border border-[#00E5FF]/50 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'text-gray-400 hover:text-white border border-transparent'
              }`}
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              <Trophy size={15} /> FIGHTBRACKET PRO EVENTS
              <span className="hidden md:inline-block text-[9px] px-1.5 py-0.2 rounded bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 font-mono">
                BUILT-IN BRACKET
              </span>
            </button>

            <button
              onClick={() => { setSource('startgg'); setPage(1); }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold tracking-widest transition-all ${
                source === 'startgg'
                  ? 'bg-[#FF006E]/20 border border-[#FF006E]/50 text-[#FF006E] shadow-[0_0_15px_rgba(255,0,110,0.2)]'
                  : 'text-gray-400 hover:text-white border border-transparent'
              }`}
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              <Globe size={15} /> START.GG DIRECTORY
            </button>
          </div>

          <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2 px-3 self-end sm:self-center">
            {source === 'fightbracket' ? (
              <span className="text-[#00E5FF]">Direct In-App Bracket Integration</span>
            ) : (
              <span className="text-gray-400">🌐 Global Start.gg Live Events</span>
            )}
          </div>
        </div>

        {/* ─── Search & Filters Bar ────────────────────────────────────────── */}
        <div className="bg-[#111116] border border-white/10 rounded-2xl p-4 shadow-lg space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 flex relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={source === 'fightbracket' ? "Search FightBracket events, venues, organizers..." : "Search Start.gg tournaments by name..."}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
              />
            </div>
            
            <div className="flex flex-wrap sm:flex-nowrap gap-3">
              {/* Location Filter */}
              <div className="relative flex-1 sm:flex-initial">
                <Map size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="City, State or 'Online'"
                  className="w-full sm:w-44 bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
                />
              </div>

              {/* Game Filter */}
              <div className="relative flex-1 sm:flex-initial">
                <Gamepad2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={gameFilter}
                  onChange={(e) => {
                    setGameFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full sm:w-44 bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00E5FF]/50 transition-colors appearance-none cursor-pointer"
                >
                  <option value="">All Games</option>
                  {source === 'fightbracket' ? (
                    <>
                      <option value="tekken8">Tekken 8</option>
                      <option value="sf6">Street Fighter 6</option>
                      <option value="ggst">Guilty Gear -Strive-</option>
                      <option value="fatalFury">Fatal Fury: City of Wolves</option>
                      <option value="mk1">Mortal Kombat 1</option>
                      <option value="smash">Super Smash Bros.</option>
                      <option value="sparkingzero">Dragon Ball: Sparking! ZERO</option>
                      <option value="gbfvr">Granblue Fantasy Versus</option>
                      <option value="kofxv">The King of Fighters XV</option>
                      <option value="avatarLegends">Avatar Legends: TFG</option>
                      <option value="custom">Custom Game</option>
                    </>
                  ) : (
                    startggGames.map(game => (
                      <option key={game.id} value={game.id}>{game.name}</option>
                    ))
                  )}
                </select>
              </div>

              <button 
                type="submit" 
                className="bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider hover:bg-[#00E5FF]/30 transition-colors whitespace-nowrap"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                SEARCH
              </button>
            </div>
          </form>

          {/* Sub-Filters: Upcoming / Past / My Events */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setUpcoming(true); setPage(1); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all border ${
                  upcoming 
                    ? 'bg-[#00E5FF]/15 border-[#00E5FF]/40 text-[#00E5FF]' 
                    : 'bg-transparent border-transparent text-gray-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                UPCOMING
              </button>
              <button
                onClick={() => { setUpcoming(false); setPage(1); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all border ${
                  !upcoming 
                    ? 'bg-[#00E5FF]/15 border-[#00E5FF]/40 text-[#00E5FF]' 
                    : 'bg-transparent border-transparent text-gray-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                PAST
              </button>
            </div>

            {source === 'fightbracket' && currentUser && (
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer font-medium select-none">
                <input
                  type="checkbox"
                  checked={mineOnly}
                  onChange={(e) => { setMineOnly(e.target.checked); setPage(1); }}
                  className="rounded border-gray-700 text-[#00E5FF] focus:ring-[#00E5FF] bg-black/40"
                />
                <span>Show Only Events I Hosted</span>
              </label>
            )}
          </div>
        </div>

        {/* ─── Results View ────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-60">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#111116] rounded-2xl border border-white/5 h-72 animate-pulse" />
            ))}
          </div>
        ) : error === "unauthorized" && source === 'startgg' ? (
          <div className="p-8 md:p-12 bg-[#12121A] border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center">
            <Calendar size={44} className="text-[#00E5FF] mb-3 opacity-60" />
            <h2 className="text-xl font-bold text-white tracking-widest uppercase mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              START.GG INTEGRATION REQUIRED
            </h2>
            <p className="text-gray-400 mb-6 max-w-md text-sm leading-relaxed">
              To browse external Start.gg tournaments, link your API token in Settings, or browse our native <strong>FightBracket Events</strong>!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setSource('fightbracket')}
                className="px-5 py-2.5 bg-[#00E5FF] text-[#050A14] font-bold text-xs tracking-wider rounded-xl hover:opacity-90 transition-all uppercase"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                SWITCH TO FIGHTBRACKET PRO EVENTS
              </button>
              <button
                onClick={() => onNavigateHome?.()}
                className="px-5 py-2.5 bg-white/5 text-gray-300 border border-white/10 font-bold text-xs tracking-wider rounded-xl hover:bg-white/10 transition-all uppercase"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                GO TO SETTINGS
              </button>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-400 border border-red-500/20 bg-red-500/5 rounded-2xl">
            {error}
          </div>
        ) : source === 'fightbracket' ? (
          /* ═════════ FIGHTBRACKET COMMUNITY EVENTS LIST ═════════ */
          communityEvents.length === 0 ? (
            <div className="text-center py-20 border border-white/5 bg-[#111116] rounded-2xl space-y-4">
              <Trophy size={40} className="mx-auto text-gray-600" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  NO FIGHTBRACKET PRO EVENTS FOUND
                </h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  No community events matched your search filters. Be the first to host an event!
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/40 rounded-xl text-xs font-bold tracking-wider hover:bg-[#00E5FF]/20 transition-all uppercase"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                + HOST A NEW EVENT
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {communityEvents.map((ev) => {
                const isFull = ev.maxEntrants > 0 && ev.fighters >= ev.maxEntrants;
                const percentFull = Math.min(100, Math.round(((ev.fighters || 0) / (ev.maxEntrants || 64)) * 100));

                return (
                  <div
                    key={ev.id}
                    onClick={() => handleOpenDetails(ev)}
                    className="group bg-[#0D0D14] border border-white/10 rounded-2xl overflow-hidden hover:border-[#00E5FF]/60 transition-all hover:shadow-[0_0_30px_rgba(0,229,255,0.12)] flex flex-col cursor-pointer"
                  >
                    {/* Event Banner */}
                    <div className="h-36 bg-[#161622] relative overflow-hidden flex-shrink-0">
                      {ev.bannerUrl ? (
                        <img 
                          src={ev.bannerUrl} 
                          alt={ev.name} 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-30">
                          <Trophy size={40} className="text-gray-500" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D14] via-black/40 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span 
                          className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-black/70 border border-white/15 text-[#00E5FF]"
                          style={{ fontFamily: 'JetBrains Mono, monospace' }}
                        >
                          {ev.game}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span 
                            className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border ${
                              ev.isOnline 
                                ? 'bg-[#00E5FF]/20 border-[#00E5FF]/40 text-[#00E5FF]' 
                                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            }`}
                            style={{ fontFamily: 'JetBrains Mono, monospace' }}
                          >
                            {ev.isOnline ? '🌐 ONLINE' : '📍 IN-PERSON'}
                          </span>

                          {ev.isOwner && (
                            <button
                              onClick={(e) => handleDeleteEvent(ev.id, e)}
                              title="Delete Event"
                              className="p-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(`${window.location.origin}/events/${ev.slug}`);
                              toast.success("Event link copied! You can share it in the Activity Feed.");
                            }}
                            title="Copy Event Link"
                            className="p-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-white transition-colors"
                          >
                            <Share2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Format Badge Bottom Left */}
                      <div className="absolute bottom-2 left-3">
                        <span className="text-[10px] text-gray-300 bg-black/60 px-2 py-0.5 rounded font-mono border border-white/5 uppercase">
                          {ev.format.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex flex-col flex-1 space-y-3">
                      <div>
                        <h3 className="text-white font-bold text-lg leading-tight line-clamp-1 group-hover:text-[#00E5FF] transition-colors" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          {ev.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {ev.description || 'Join this competitive community tournament with live bracket and match tracking.'}
                        </p>
                      </div>

                      {/* Host & Meta Details */}
                      <div className="space-y-1.5 pt-2 border-t border-white/5 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className="text-[#00E5FF] shrink-0" />
                          <span className="truncate">{formatLocalTime(ev.startDate, ev.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="text-[#00E5FF] shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-gray-500">
                            Host: <strong className="text-gray-300 font-medium">{ev.organizer.gamerTag}</strong>
                          </span>
                          {ev.prizePool && (
                            <span className="text-amber-400 font-mono font-bold">
                              🏆 {ev.prizePool}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Entrants Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] font-mono text-gray-400">
                          <span>Entrants</span>
                          <span className="text-white font-bold">{ev.fighters} / {ev.maxEntrants}</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-[#00E5FF] to-[#FF006E] transition-all" 
                            style={{ width: `${percentFull}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-3 bg-black/40 border-t border-white/5 flex items-center gap-2 mt-auto">
                      {/* Open Bracket Button */}
                      {ev.tournamentId && (
                        <button
                          onClick={(e) => handleOpenBracket(ev, e)}
                          title="Open interactive bracket"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/40 text-xs font-bold tracking-wider hover:bg-[#00E5FF]/20 transition-all uppercase"
                          style={{ fontFamily: 'Rajdhani, sans-serif' }}
                        >
                          <GitBranch size={13} /> OPEN BRACKET
                        </button>
                      )}

                      {/* Join / Register Button */}
                      <button
                        onClick={(e) => handleToggleRegistration(ev, e)}
                        disabled={registeringId === ev.id || (!ev.isRegistered && isFull)}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-bold tracking-wider transition-all uppercase ${
                          ev.isRegistered
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : isFull
                            ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                            : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                        }`}
                        style={{ fontFamily: 'Rajdhani, sans-serif' }}
                      >
                        {registeringId === ev.id ? (
                          '...'
                        ) : ev.isRegistered ? (
                          <>
                            <Check size={13} /> REGISTERED
                          </>
                        ) : isFull ? (
                          'FULL'
                        ) : (
                          'JOIN EVENT'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* ═════════ START.GG TOURNAMENTS LIST ═════════ */
          startggEvents.length === 0 ? (
            <div className="text-center py-20 border border-white/5 bg-[#111116] rounded-2xl opacity-60">
              <Calendar size={32} className="mx-auto mb-3 text-gray-500" />
              <p className="text-sm text-gray-400">No Start.gg tournaments found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {startggEvents.map((event) => (
                <a
                  key={event.id}
                  href={`https://start.gg/${event.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group bg-[#0A0A0F] border border-white/10 rounded-2xl overflow-hidden hover:border-[#00E5FF]/50 transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col"
                >
                  <div className="h-32 bg-[#1A1A24] relative overflow-hidden flex-shrink-0">
                    {event.image ? (
                      <img src={event.image} alt={event.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-30">
                        <Calendar size={40} className="text-gray-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] to-transparent opacity-80" />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2" style={{ fontFamily: 'Rajdhani, sans-serif', lineHeight: 1.2 }}>
                      {event.name}
                    </h3>
                    <div className="mt-auto space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar size={12} className="text-[#00E5FF]" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <MapPin size={12} className="text-[#00E5FF]" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Users size={12} className="text-[#00E5FF]" />
                        <span>{event.fighters} Entrants</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold text-gray-400 flex items-center justify-between group-hover:bg-[#00E5FF]/10 group-hover:text-[#00E5FF] transition-colors border-t border-white/5 mt-auto">
                    <span>View on Start.gg</span>
                    <ExternalLink size={12} />
                  </div>
                </a>
              ))}
            </div>
          )
        )}

        {/* ─── Pagination ─────────────────────────────────────────────────── */}
        {((source === 'fightbracket' && communityTotalPages > 1) || (source === 'startgg' && startggTotalPages > 1)) && (
          <div className="flex justify-center items-center gap-4 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-[#111116] border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-[#00E5FF]/50 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-xs text-gray-400 font-bold tracking-widest font-mono">
              PAGE {page} OF {source === 'fightbracket' ? communityTotalPages : startggTotalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(source === 'fightbracket' ? communityTotalPages : startggTotalPages, p + 1))}
              disabled={page === (source === 'fightbracket' ? communityTotalPages : startggTotalPages)}
              className="p-2 bg-[#111116] border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-[#00E5FF]/50 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* ─── Create Event Modal ───────────────────────────────────────────── */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        getHeaders={getHeaders}
        currentUser={currentUser}
        userProfile={userProfile}
        onEventCreated={(newEvent) => {
          setCommunityEvents(prev => [newEvent, ...prev]);
        }}
      />

      {/* ─── Event Details & Participants Modal ───────────────────────────── */}
      {selectedDetailEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0D0D12] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Banner */}
            <div className="relative h-40 bg-[#161622] shrink-0">
              {selectedDetailEvent.bannerUrl && (
                <img 
                  src={selectedDetailEvent.bannerUrl} 
                  alt={selectedDetailEvent.name} 
                  className="w-full h-full object-cover opacity-80" 
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D12] via-black/40 to-transparent" />
              <button
                onClick={() => setSelectedDetailEvent(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
              >
                <X size={18} />
              </button>

              <div className="absolute bottom-3 left-5 right-5">
                <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-black/60 text-[#00E5FF] font-mono border border-white/10 inline-block mb-1">
                  {selectedDetailEvent.game} · {selectedDetailEvent.format.replace('_', ' ').toUpperCase()}
                </span>
                <h2 className="text-2xl font-bold text-white tracking-wide truncate" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {selectedDetailEvent.name}
                </h2>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Event Quick Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-gray-500 uppercase font-mono">Date</div>
                  <div className="text-xs font-bold text-white mt-0.5 truncate">{formatLocalTime(selectedDetailEvent.startDate, selectedDetailEvent.date)}</div>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-gray-500 uppercase font-mono">Location</div>
                  <div className="text-xs font-bold text-white mt-0.5 truncate">{selectedDetailEvent.location}</div>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-gray-500 uppercase font-mono">Entry / Prize</div>
                  <div className="text-xs font-bold text-[#00E5FF] mt-0.5 truncate">{selectedDetailEvent.entryFee} {selectedDetailEvent.prizePool ? `· ${selectedDetailEvent.prizePool}` : ''}</div>
                </div>
                <div 
                  className="bg-black/30 p-3 rounded-xl border border-white/5 cursor-pointer hover:border-[#00E5FF]/40 transition-colors"
                  onClick={() => document.getElementById('competitors-list')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <div className="text-[10px] text-gray-500 uppercase font-mono">Entrants</div>
                  <div className="text-xs font-bold text-white mt-0.5">{selectedDetailEvent.fighters} / {selectedDetailEvent.maxEntrants}</div>
                </div>
              </div>

              {/* Description */}
              {selectedDetailEvent.description && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 font-mono">About Event</h4>
                  <p className="text-sm text-gray-300 leading-relaxed bg-black/20 p-3.5 rounded-xl border border-white/5 whitespace-pre-wrap">
                    {selectedDetailEvent.description}
                  </p>
                </div>
              )}

              {/* Rules */}
              {selectedDetailEvent.rules && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 font-mono">Official Match Rules</h4>
                  <p className="text-xs text-gray-300 leading-relaxed bg-black/20 p-3.5 rounded-xl border border-white/5 font-mono whitespace-pre-wrap">
                    {selectedDetailEvent.rules}
                  </p>
                </div>
              )}

              {/* Links */}
              <div className="flex flex-wrap gap-3">
                {selectedDetailEvent.streamUrl && (
                  <a
                    href={selectedDetailEvent.streamUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-bold hover:bg-purple-500/20 transition-all font-mono"
                  >
                    <Tv size={14} /> WATCH STREAM <ExternalLink size={12} />
                  </a>
                )}
                {selectedDetailEvent.discordUrl && (
                  <a
                    href={selectedDetailEvent.discordUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-bold hover:bg-indigo-500/20 transition-all font-mono"
                  >
                    <Globe size={14} /> JOIN DISCORD <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {/* Registered Participants */}
              <div id="competitors-list" className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 font-mono">
                    Registered Competitors ({eventParticipants.length})
                  </h4>
                  {selectedDetailEvent.tournamentId && (
                    <span className="text-[11px] text-[#00E5FF] font-mono">
                      Bracket Synchronized ✓
                    </span>
                  )}
                </div>

                {loadingDetails ? (
                  <div className="text-xs text-gray-500 font-mono py-4 text-center">Loading competitors...</div>
                ) : eventParticipants.length === 0 ? (
                  <div className="text-xs text-gray-500 font-mono py-4 text-center bg-black/20 rounded-xl border border-white/5">
                    No players registered yet. Be the first to enter!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {eventParticipants.map((p, idx) => (
                      <div key={p.id || idx} className="flex items-center gap-2.5 p-2 bg-black/30 rounded-xl border border-white/5">
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt={p.gamerTag} className="w-6 h-6 rounded-full object-cover border border-[#00E5FF]/40" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] flex items-center justify-center text-[10px] font-bold">
                            {(p.gamerTag || 'P').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-medium text-white truncate">{p.gamerTag}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#12121A] border-t border-white/10 flex items-center justify-between shrink-0 gap-3">
              {selectedDetailEvent.tournamentId ? (
                <button
                  onClick={() => handleOpenBracket(selectedDetailEvent)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] text-[#050A14] font-bold text-xs tracking-wider hover:opacity-90 transition-all uppercase shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  <GitBranch size={15} /> OPEN IN BRACKET MANAGER
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={(e) => handleToggleRegistration(selectedDetailEvent, e)}
                disabled={registeringId === selectedDetailEvent.id}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all uppercase ${
                  selectedDetailEvent.isRegistered
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                }`}
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                {registeringId === selectedDetailEvent.id ? (
                  '...'
                ) : selectedDetailEvent.isRegistered ? (
                  'CANCEL REGISTRATION'
                ) : (
                  'REGISTER NOW'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
