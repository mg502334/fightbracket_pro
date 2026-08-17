import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Users, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Event {
  id: string;
  name: string;
  slug: string;
  date: string;
  location: string;
  fighters: number;
  image?: string;
}

interface EventsPanelProps {
  getHeaders: () => Promise<HeadersInit>;
  onNavigateHome?: () => void;
}

export function EventsPanel({ getHeaders, onNavigateHome }: EventsPanelProps) {
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [upcoming, setUpcoming] = useState(true);
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<Event[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [query, upcoming, page]);

  const fetchEvents = async () => {
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
          perPage: 12
        })
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("unauthorized");
        } else {
          setError("Failed to fetch events");
        }
        setEvents([]);
        return;
      }

      const data = await res.json();
      setEvents(data.events || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(searchInput);
  };

  if (error === "unauthorized") {
    return (
      <div className="p-6 md:p-10 min-h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
        <Calendar size={48} className="text-[#06b6d4] mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-white tracking-widest font-rajdhani mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>START.GG INTEGRATION REQUIRED</h2>
        <p className="text-gray-400 mb-6 max-w-md text-sm leading-relaxed">
          To search and view tournaments, you need to link your Start.gg account. This allows us to fetch live event data directly from their servers.
        </p>
        <button
          onClick={() => onNavigateHome?.()}
          className="px-6 py-2.5 bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/30 rounded-lg font-bold tracking-widest text-sm hover:bg-[#06b6d4]/20 transition-all"
        >
          GO TO SETTINGS
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 animate-in fade-in duration-300 min-h-full" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Calendar size={28} className="text-[#06b6d4]" />
          <h1 className="text-3xl font-bold tracking-widest text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Event Search
          </h1>
        </div>

        {/* Search & Filters */}
        <div className="bg-[#111116] border border-white/10 rounded-xl p-4 mb-8 flex flex-col md:flex-row gap-4 shadow-lg">
          <form onSubmit={handleSearch} className="flex-1 flex relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search tournaments by name..."
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#06b6d4]/50 transition-colors"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#06b6d4]/20 text-[#06b6d4] px-3 py-1 rounded text-xs font-bold tracking-wider hover:bg-[#06b6d4]/30 transition-colors">
              SEARCH
            </button>
          </form>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setUpcoming(true); setPage(1); }}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all flex-1 md:flex-none text-center border ${
                upcoming ? 'bg-[#06b6d4]/20 border-[#06b6d4]/50 text-[#06b6d4]' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              UPCOMING
            </button>
            <button
              onClick={() => { setUpcoming(false); setPage(1); }}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all flex-1 md:flex-none text-center border ${
                !upcoming ? 'bg-[#06b6d4]/20 border-[#06b6d4]/50 text-[#06b6d4]' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              PAST
            </button>
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-50">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-[#111116] rounded-xl border border-white/5 h-64 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-400 border border-red-500/20 bg-red-500/5 rounded-xl">
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 border border-white/5 bg-[#111116] rounded-xl opacity-60">
            <Calendar size={32} className="mx-auto mb-3 text-gray-500" />
            <p className="text-sm text-gray-400">No tournaments found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {events.map((event) => (
                <a
                  key={event.id}
                  href={`https://start.gg/${event.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group bg-[#0A0A0F] border border-white/10 rounded-xl overflow-hidden hover:border-[#06b6d4]/50 transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col"
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
                        <Calendar size={12} className="text-[#06b6d4]" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <MapPin size={12} className="text-[#06b6d4]" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Users size={12} className="text-[#06b6d4]" />
                        <span>{event.fighters} Entrants</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold text-gray-400 flex items-center justify-between group-hover:bg-[#06b6d4]/10 group-hover:text-[#06b6d4] transition-colors border-t border-white/5 mt-auto">
                    <span>View on Start.gg</span>
                    <ExternalLink size={12} />
                  </div>
                </a>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 bg-[#111116] border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-[#06b6d4]/50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-xs text-gray-400 font-bold tracking-widest">
                  PAGE {page} OF {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 bg-[#111116] border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-[#06b6d4]/50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
