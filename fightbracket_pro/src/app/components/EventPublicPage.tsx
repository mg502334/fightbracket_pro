import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Calendar, MapPin, Users, ChevronLeft } from 'lucide-react';
import { GAME_COVERS } from '../data/gameCovers';

export function EventPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (!slug) return;
    fetch(`/api/public/events/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error("Event not found");
        return res.json();
      })
      .then(data => {
        setEvent(data.event);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

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

  const coverUrl = GAME_COVERS[event.game] || null;

  return (
    <div className="min-h-screen bg-[#050A14] overflow-y-auto">
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
              </div>
              <h1 className="text-3xl md:text-5xl font-black font-rajdhani text-white uppercase tracking-wider mb-2">
                {event.name}
              </h1>
              <div className="flex items-center gap-4 text-sm font-mono text-gray-400">
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
          <div className="p-6 bg-gradient-to-br from-cyan-900/20 to-black/40 border border-cyan-500/20 rounded-2xl shadow-xl text-center">
            <h3 className="text-xs font-bold font-mono text-cyan-400 mb-6 tracking-widest uppercase">Current Entrants</h3>
            <div className="flex items-center justify-center gap-3 mb-6">
              <Users size={32} className="text-white/60" />
              <div className="text-4xl font-black font-rajdhani text-white">
                {event.fighters}
                <span className="text-lg text-gray-500 ml-1">/ {event.maxEntrants || '∞'}</span>
              </div>
            </div>
            
            <Link 
              to="/"
              className="block w-full py-4 bg-cyan-500 text-black font-black font-rajdhani text-lg uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(0,229,255,0.3)]"
            >
              Sign In to Register
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
