import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Loader, Trophy, Users, Calendar, ArrowRight, Zap, Download } from 'lucide-react';

export interface EventItem {
  id: string;
  name: string;
  tournamentName: string;
  eventName: string;
  slug: string;
  game: string;
  gameColor?: string;
  entrants?: number;
  date?: string;
  location?: string;
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (slug: string) => Promise<void>;
  theme: any;
}

export function ImportModal({ isOpen, onClose, onImport, theme }: ImportModalProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importingSlug, setImportingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live Event Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EventItem[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearching(true);
      fetch(`/api/search-events?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.events) {
            setSearchResults(data.events);
          }
        })
        .catch(() => {})
        .finally(() => setSearching(false));
    }
  }, [isOpen, searchQuery]);

  if (!isOpen) return null;

  const handleImportSlug = async (slugToImport: string) => {
    if (!slugToImport.trim()) return;
    setLoading(true);
    setImportingSlug(slugToImport);
    setError(null);
    
    // Strip the domain prefix but preserve the full path (including /event/xxx)
    let slug = slugToImport.trim();
    if (slug.includes('start.gg/tournament/')) {
      slug = slug.split('start.gg/tournament/')[1];
    } else if (slug.includes('tournament/')) {
      slug = slug.split('tournament/')[1];
    }
    slug = slug.split('?')[0].split('#')[0].trim();
    
    try {
      await onImport(slug);
      setInputUrl('');
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to import tournament");
    } finally {
      setLoading(false);
      setImportingSlug(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl flex flex-col max-h-[85vh] font-mono shadow-2xl"
          style={{ background: '#050A14', border: `1px solid ${theme.primaryColor}50` }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-2">
              <Zap size={20} style={{ color: theme.primaryColor }} />
              <h2 className="text-xl font-bold tracking-widest text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                IMPORT LIVE BRACKET
              </h2>
            </div>
            <button onClick={onClose} className="p-1 opacity-60 hover:opacity-100 transition-opacity text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
            {/* Search Bar for Live Events */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 tracking-wider uppercase flex items-center gap-1.5">
                <Search size={14} style={{ color: theme.primaryColor }} />
                <span>Search Tournaments & Events</span>
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search event name, game, or location (e.g. EVO 2026, CEO, Tekken 8)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-[#00E5FF] text-white text-xs rounded-xl pl-10 pr-10 py-3 transition-all outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Popular / Search Event Results List */}
            <div className="space-y-2">
              <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>{searchQuery ? 'Search Results' : 'Featured Premier Tournaments'}</span>
                <span>{searchResults.length} events</span>
              </div>

              {searching ? (
                <div className="text-center py-8 text-gray-500 text-xs flex items-center justify-center gap-2">
                  <Loader size={16} className="animate-spin text-[#00E5FF]" />
                  <span>Searching events...</span>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {searchResults.map(event => {
                    const isSelected = importingSlug === event.slug;
                    return (
                      <div
                        key={event.id}
                        className="bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-[#00E5FF]/40 rounded-xl p-3 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                        onClick={() => handleImportSlug(event.slug)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded uppercase"
                              style={{
                                background: `${event.gameColor || '#00E5FF'}15`,
                                color: event.gameColor || '#00E5FF',
                                border: `1px solid ${event.gameColor || '#00E5FF'}30`
                              }}
                            >
                              {event.game}
                            </span>
                            {event.location && (
                              <span className="text-[10px] text-gray-400 truncate">
                                · {event.location}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-white group-hover:text-[#00E5FF] transition-colors truncate" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            {event.name}
                          </h3>

                          <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1">
                            {event.entrants && (
                              <span className="flex items-center gap-1">
                                <Users size={11} className="text-cyan-400" />
                                {event.entrants} entrants
                              </span>
                            )}
                            {event.date && (
                              <span className="flex items-center gap-1">
                                <Calendar size={11} className="text-purple-400" />
                                {event.date}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImportSlug(event.slug);
                          }}
                          disabled={loading}
                          className="px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
                          style={{
                            background: `${theme.primaryColor}20`,
                            color: theme.primaryColor,
                            border: `1px solid ${theme.primaryColor}40`
                          }}
                        >
                          {isSelected && loading ? (
                            <Loader size={13} className="animate-spin" />
                          ) : (
                            <Download size={13} />
                          )}
                          <span className="hidden sm:inline">IMPORT</span>
                        </button>
                      </div>
                    );
                  })}

                  {searchResults.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-xs">
                      No matching events found. You can paste the direct URL below.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-gray-500">
                <span className="bg-[#050A14] px-3">Or Paste Direct Start.gg URL</span>
              </div>
            </div>

            {/* Manual URL / Slug Input */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="e.g. start.gg/tournament/evo-2026/event/tekken-8"
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleImportSlug(inputUrl);
                  }
                }}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-[#00E5FF] transition-all font-mono"
              />
              {error && <div className="text-red-400 text-xs mt-1">{error}</div>}
              
              <button 
                onClick={() => handleImportSlug(inputUrl)}
                disabled={loading || !inputUrl.trim()}
                className="w-full py-2.5 rounded-xl flex justify-center items-center gap-2 font-bold transition-all disabled:opacity-50 text-xs tracking-widest uppercase cursor-pointer"
                style={{ background: theme.primaryColor, color: '#000' }}
              >
                {loading && !importingSlug && <Loader size={14} className="animate-spin" />}
                {loading && !importingSlug ? "IMPORTING BRACKET..." : "IMPORT URL BRACKET"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
