import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Trophy, Calendar, MapPin, Users, ChevronLeft, GitBranch, Share2, Globe, Check, Copy, Play } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { GAME_COVERS } from '../data/gameCovers';
import { extractActiveSubdomain, getEventSubdomainUrl, getBracketSubdomainUrl, sanitizeSubdomain } from '../utils/subdomain';

export function EventPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingBracket, setLoadingBracket] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatLocalTime = (isoString?: string, fallbackStr?: string) => {
    if (!isoString && !fallbackStr) return 'TBA';
    if (!isoString) return fallbackStr;
    try {
      const safeIso = isoString.endsWith('Z') || isoString.includes('+') || (isoString.includes('-') && isoString.length > 10) ? isoString : isoString + 'Z';
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
    const targetIdentifier = slug || extractActiveSubdomain();
    if (!targetIdentifier) {
      setError("Event not found");
      setLoading(false);
      return;
    }

    const fetchEventData = (isInitial = false) => {
      fetch(`/api/public/events/${encodeURIComponent(targetIdentifier)}`)
        .then(res => {
          if (!res.ok) throw new Error("Event not found");
          return res.json();
        })
        .then(data => {
          setEvent(data.event);
          if (isInitial) setLoading(false);
        })
        .catch(err => {
          if (isInitial) {
            setError(err.message);
            setLoading(false);
          }
        });
    };

    fetchEventData(true);
    const interval = setInterval(() => fetchEventData(false), 3500);
    return () => clearInterval(interval);
  }, [slug]);

  const handleLoadAndRunBracket = async () => {
    if (!event) return;
    setLoadingBracket(true);
    try {
      let parsedData: any = null;
      if (event.bracketData) {
        parsedData = typeof event.bracketData === 'string' ? JSON.parse(event.bracketData) : event.bracketData;
      } else {
        const res = await fetch(`/api/community-events/${encodeURIComponent(event.id || event.slug || event.subdomain)}/bracket`);
        if (res.ok) {
          const data = await res.json();
          parsedData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
        }
      }

      if (parsedData) {
        const sub = sanitizeSubdomain(event.subdomain || parsedData.subdomain, 'ev');
        const activeTourney = parsedData.activeTournament || {
          name: event.name,
          location: event.location || 'Online',
          slug: event.slug || event.id,
          subdomain: sub,
          numAttendees: (parsedData.players || []).length,
        };
        activeTourney.subdomain = sub;

        localStorage.setItem('fb_activeGame', JSON.stringify(parsedData.activeGame || event.gameId || 'tekken8'));
        localStorage.setItem('fb_players', JSON.stringify(parsedData.players || []));
        localStorage.setItem('fb_matches', JSON.stringify(parsedData.matches || []));
        if (parsedData.stations) localStorage.setItem('fb_stations', JSON.stringify(parsedData.stations));
        if (parsedData.gameThemes) localStorage.setItem('fb_themes', JSON.stringify(parsedData.gameThemes));
        if (parsedData.gameOrder) localStorage.setItem('fb_gameOrder', JSON.stringify(parsedData.gameOrder));
        localStorage.setItem('fb_tournament', JSON.stringify(activeTourney));
        // Clear owner lock so the person receiving the shared local event/bracket can run it
        localStorage.setItem('fb_tournamentOwnerId', JSON.stringify(null));
        localStorage.setItem('fb_activeTab', JSON.stringify('bracket'));

        toast.success(`Loaded "${event.name}" into FightBracket Pro!`);
        navigate(`/?sub=${encodeURIComponent(sub)}`);
      } else {
        navigate(`/t/${encodeURIComponent(event.tournamentId || event.subdomain || event.slug)}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not load event bracket');
    } finally {
      setLoadingBracket(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050A14] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Trophy size={48} className="text-cyan-500/50 mb-4" />
          <div className="text-cyan-500 font-mono tracking-widest text-sm">LOADING EVENT...</div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#050A14] flex flex-col items-center justify-center p-4 text-center">
        <Trophy size={64} className="text-gray-600 mb-6" />
        <h1 className="text-2xl font-bold font-rajdhani text-white mb-2 tracking-widest uppercase">Event Not Found</h1>
        <p className="text-gray-400 font-mono text-sm max-w-md mb-8">
          The event you are looking for may have been deleted or the URL is incorrect.
        </p>
        <Link 
          to="/"
          className="px-6 py-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-xl font-bold font-rajdhani uppercase tracking-wider hover:bg-cyan-500/20 transition-colors"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const coverUrl = event.bannerUrl || GAME_COVERS[event.game] || null;
  const eventSubdomain = sanitizeSubdomain(event.subdomain, 'ev');
  const shareEventUrl = getEventSubdomainUrl(eventSubdomain, event.slug || event.id);
  const shareBracketUrl = getBracketSubdomainUrl({
    subdomain: eventSubdomain,
    tournamentId: event.tournamentId || event.id,
    eventSlug: event.slug
  });

  const handleCopySubdomainLink = (urlToCopy: string, label: string) => {
    navigator.clipboard.writeText(urlToCopy);
    setCopiedLink(true);
    toast.success(`${label} copied: ${urlToCopy}`);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#050A14] overflow-y-auto">
      <Toaster position="bottom-right" />
      {/* Header Banner */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt={event.game} className="w-full h-full object-cover opacity-40 blur-sm scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-900/40 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/60 to-transparent" />
        
        {/* Top Nav */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
          <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
            <div className="w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/30 transition-all">
              <ChevronLeft size={16} />
            </div>
            <span className="font-mono text-xs uppercase tracking-widest font-bold">FightBracket Pro</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-cyan-500/30 text-cyan-400 font-mono text-xs">
              <Globe size={12} />
              {eventSubdomain}.fightbracketpro.com
            </span>
            <button
              onClick={() => handleCopySubdomainLink(shareEventUrl, 'Event subdomain link')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold transition-all"
            >
              {copiedLink ? <Check size={13} /> : <Share2 size={13} />}
              {copiedLink ? 'COPIED!' : 'SHARE SUBDOMAIN LINK'}
            </button>
          </div>
        </div>

        {/* Banner Content */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 items-end">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-cyan-500 shadow-[0_0_30px_rgba(0,229,255,0.3)] bg-[#0A0A0F] shrink-0">
              {coverUrl ? (
                <img src={coverUrl} alt={event.game} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cyan-500/50">
                  <Trophy size={40} />
                </div>
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2.5 py-1 text-[10px] font-bold font-mono tracking-widest uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded">
                  {event.game}
                </span>
                <span className="px-2.5 py-1 text-[10px] font-bold font-mono tracking-widest uppercase bg-white/10 text-white/80 border border-white/20 rounded">
                  {event.format?.replace('_', ' ')}
                </span>
                {event.isOnline ? (
                  <span className="px-2.5 py-1 text-[10px] font-bold font-mono tracking-widest uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                    ONLINE
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-[10px] font-bold font-mono tracking-widest uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded">
                    IN-PERSON
                  </span>
                )}
                <span className="px-2.5 py-1 text-[10px] font-bold font-mono tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                  SUBDOMAIN: {eventSubdomain}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black font-rajdhani text-white uppercase tracking-wider mb-2">
                {event.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-gray-400">
                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-cyan-500" /> {formatLocalTime(event.startDate, event.date)}</span>
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-cyan-500" /> {event.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto p-6 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Subdomain Share & Direct Bracket Loader Card */}
          <div className="p-6 bg-gradient-to-r from-cyan-950/40 via-[#0A0A0F] to-purple-950/30 border border-cyan-500/30 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold font-rajdhani text-white tracking-widest uppercase flex items-center gap-2">
                  <GitBranch size={18} className="text-cyan-400" />
                  Interactive Event & Bracket Link
                </h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  Anyone with this subdomain link can load, view, or run this event bracket in FightBracket Pro.
                </p>
              </div>
              <button
                onClick={handleLoadAndRunBracket}
                disabled={loadingBracket}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] text-[#050A14] font-black font-rajdhani text-sm uppercase tracking-widest rounded-xl hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)] shrink-0"
              >
                <Play size={15} fill="currentColor" />
                {loadingBracket ? 'LOADING BRACKET...' : 'LOAD & RUN BRACKET'}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-black/50 p-2.5 rounded-xl border border-white/10">
              <div className="flex-1 font-mono text-xs text-cyan-300 truncate px-2">
                {shareBracketUrl}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopySubdomainLink(shareBracketUrl, 'Bracket subdomain link')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Copy size={12} /> COPY BRACKET LINK
                </button>
                <button
                  onClick={() => handleCopySubdomainLink(shareEventUrl, 'Event page subdomain link')}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Share2 size={12} /> EVENT LINK
                </button>
              </div>
            </div>
          </div>

          {/* Live Active Bracket & Running Matches Feed */}
          {(() => {
            let parsedBracket: any = null;
            try {
              if (event.bracketData) {
                parsedBracket = typeof event.bracketData === 'string' ? JSON.parse(event.bracketData) : event.bracketData;
              }
            } catch {}
            const bMatches: any[] = Array.isArray(parsedBracket?.matches) ? parsedBracket.matches : [];
            const bPlayers: any[] = Array.isArray(parsedBracket?.players) ? parsedBracket.players : [];
            if (bMatches.length === 0 && bPlayers.length === 0) return null;

            const playerMap = Object.fromEntries(bPlayers.map((p: any) => [p.id, p]));
            const liveMatches = bMatches.filter(m => m.state === 'in_progress' || m.state === 'called');
            const completedMatches = bMatches.filter(m => m.state === 'completed');
            const pct = bMatches.length > 0 ? Math.round((completedMatches.length / bMatches.length) * 100) : 0;

            return (
              <div className="p-6 bg-[#0A0A0F] border border-emerald-500/30 rounded-2xl shadow-xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h2 className="text-xl font-bold font-rajdhani text-white tracking-widest uppercase">
                      LIVE ACTIVE BRACKET
                    </h2>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                      AUTO-UPDATING LIVE
                    </span>
                  </div>
                  <div className="text-xs font-mono text-gray-400">
                    {completedMatches.length}/{bMatches.length} Matches Completed ({pct}%)
                  </div>
                </div>

                {bMatches.length > 0 && (
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}

                {liveMatches.length > 0 ? (
                  <div className="space-y-2.5">
                    <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                      🎮 Active & Called Matches ({liveMatches.length})
                    </div>
                    {liveMatches.map((m: any) => {
                      const p1 = m.player1Id ? playerMap[m.player1Id] : null;
                      const p2 = m.player2Id ? playerMap[m.player2Id] : null;
                      return (
                        <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 uppercase">
                              {m.state === 'in_progress' ? 'LIVE' : 'CALLED'}
                            </span>
                            <span className="font-rajdhani font-bold text-white text-base">
                              {p1?.tag || 'TBD'} <span className="text-cyan-400 mx-1">vs</span> {p2?.tag || 'TBD'}
                            </span>
                            <span className="text-xs font-mono text-gray-400">{m.roundName}</span>
                          </div>
                          <div className="flex items-center gap-3 font-mono text-xs">
                            {m.stationId && (
                              <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                STN {m.stationId}
                              </span>
                            )}
                            <span className="font-bold text-amber-400 text-sm">
                              {m.player1Score ?? 0} – {m.player2Score ?? 0}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs font-mono text-gray-400 bg-white/5 p-3 rounded-xl border border-white/10">
                    {bMatches.length > 0
                      ? 'Bracket is active and ready — waiting for the next match to be called.'
                      : `${bPlayers.length} players registered. Open the bracket to generate or run matches.`}
                  </div>
                )}

                {completedMatches.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                      ✅ Recent Match Results
                    </div>
                    {completedMatches.slice(-4).reverse().map((m: any) => {
                      const p1 = m.player1Id ? playerMap[m.player1Id] : null;
                      const p2 = m.player2Id ? playerMap[m.player2Id] : null;
                      return (
                        <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono">
                          <div className="text-white">
                            <span className={m.winnerId === m.player1Id ? 'text-emerald-400 font-bold' : 'text-gray-400'}>
                              {p1?.tag || 'TBD'}
                            </span>
                            <span className="text-gray-500 mx-2">vs</span>
                            <span className={m.winnerId === m.player2Id ? 'text-emerald-400 font-bold' : 'text-gray-400'}>
                              {p2?.tag || 'TBD'}
                            </span>
                            <span className="text-gray-500 ml-2">({m.roundName})</span>
                          </div>
                          <span className="font-bold text-cyan-300">
                            {m.player1Score ?? 0} – {m.player2Score ?? 0}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="p-6 bg-[#0A0A0F] border border-white/10 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold font-rajdhani text-white mb-4 tracking-widest uppercase flex items-center gap-2">
              <span className="w-1 h-5 bg-cyan-500 rounded-full" />
              Event Details
            </h2>
            <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
              {event.description || 'No description provided.'}
            </p>
          </div>

          {event.rules && (
            <div className="p-6 bg-[#0A0A0F] border border-white/10 rounded-2xl shadow-xl">
              <h2 className="text-xl font-bold font-rajdhani text-white mb-4 tracking-widest uppercase flex items-center gap-2">
                <span className="w-1 h-5 bg-purple-500 rounded-full" />
                Ruleset
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                {event.rules}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-cyan-900/20 to-black/40 border border-cyan-500/20 rounded-2xl shadow-xl text-center space-y-4">
            <h3 className="text-xs font-bold font-mono text-cyan-400 tracking-widest uppercase">Current Entrants</h3>
            <div className="flex items-center justify-center gap-3">
              <Users size={32} className="text-white/60" />
              <div className="text-4xl font-black font-rajdhani text-white">
                {event.fighters}
                <span className="text-lg text-gray-500 ml-1">/ {event.maxEntrants || '∞'}</span>
              </div>
            </div>

            <button
              onClick={handleLoadAndRunBracket}
              disabled={loadingBracket}
              className="w-full py-3.5 bg-cyan-500 text-black font-black font-rajdhani text-base uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(0,229,255,0.3)] flex items-center justify-center gap-2"
            >
              <GitBranch size={16} />
              {loadingBracket ? 'Loading...' : 'Open & Run Bracket'}
            </button>
            
            <Link 
              to="/"
              className="block w-full py-3 bg-white/10 text-white border border-white/20 font-bold font-rajdhani text-sm uppercase tracking-widest rounded-xl hover:bg-white/20 transition-colors"
            >
              Sign In / Register
            </Link>
          </div>

          <div className="p-6 bg-[#0A0A0F] border border-white/10 rounded-2xl shadow-xl">
            <h3 className="text-xs font-bold font-mono text-gray-400 mb-4 tracking-widest uppercase border-b border-white/10 pb-2">Organizer</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-rajdhani text-lg">
                {event.organizer?.gamerTag ? event.organizer.gamerTag.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="text-white font-bold">{event.organizer?.gamerTag || 'Unknown Player'}</div>
                <div className="text-xs text-gray-500 font-mono">Tournament Host</div>
              </div>
            </div>
          </div>
          
          {event.prizePool && (
            <div className="p-6 bg-[#0A0A0F] border border-white/10 rounded-2xl shadow-xl">
              <h3 className="text-xs font-bold font-mono text-gray-400 mb-4 tracking-widest uppercase border-b border-white/10 pb-2">Prize Pool</h3>
              <div className="text-2xl font-black font-rajdhani text-amber-400 flex items-center gap-2">
                <Trophy size={24} />
                {event.prizePool}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
