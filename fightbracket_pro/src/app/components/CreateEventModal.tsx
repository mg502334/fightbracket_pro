import React, { useState } from 'react';
import { X, Calendar, MapPin, Gamepad2, Trophy, Globe, Shield, Tv, Users, DollarSign, Sparkles, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  getHeaders: () => Promise<HeadersInit>;
  onEventCreated: (newEvent: any) => void;
  currentUser?: any;
  userProfile?: any;
}

const POPULAR_GAMES = [
  { id: 'tekken8', name: 'Tekken 8', color: '#00E5FF', banner: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1778820/header.jpg' },
  { id: 'sf6', name: 'Street Fighter 6', color: '#FF006E', banner: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1364780/header.jpg' },
  { id: 'ggst', name: 'Guilty Gear -Strive-', color: '#F59E0B', banner: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1384160/header.jpg' },
  { id: 'fatalFury', name: 'Fatal Fury: City of Wolves', color: '#FFD600', banner: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2492040/header.jpg' },
  { id: 'mk1', name: 'Mortal Kombat 1', color: '#EF4444', banner: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1792670/header.jpg' },
  { id: 'smash', name: 'Super Smash Bros. Ultimate', color: '#3B82F6', banner: 'https://images.start.gg/images/videogame/1386/image-d24f740623a31f9e1eec2aabc30f4ba2.jpg' },
  { id: 'sparkingzero', name: 'Dragon Ball: Sparking! ZERO', color: '#06B6D4', banner: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1790600/header.jpg' },
  { id: 'gbfvr', name: 'Granblue Fantasy Versus: Rising', color: '#10B981', banner: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2157560/header.jpg' },
  { id: 'kofxv', name: 'The King of Fighters XV', color: '#FF3D00', banner: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1498590/header.jpg' },
  { id: 'avatarLegends', name: 'Avatar Legends: TFG', color: '#00E5FF', banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80' },
  { id: 'custom', name: 'Custom Game', color: '#888888', banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80' }
];

export function CreateEventModal({
  isOpen,
  onClose,
  getHeaders,
  onEventCreated,
  currentUser,
  userProfile
}: CreateEventModalProps) {
  // Tomorrow at 18:00 default
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 1);
  defaultDate.setHours(18, 0, 0, 0);
  const defaultDateStr = defaultDate.toISOString().slice(0, 16);

  const [name, setName] = useState('');
  const [selectedGameId, setSelectedGameId] = useState('tekken8');
  const [customGameName, setCustomGameName] = useState('');
  const [eventType, setEventType] = useState('tournament');
  const [format, setFormat] = useState('double_elimination');
  const [startDate, setStartDate] = useState(defaultDateStr);
  const [isOnline, setIsOnline] = useState(true);
  const [venueName, setVenueName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  const [entryFee, setEntryFee] = useState('Free');
  const [prizePool, setPrizePool] = useState('');
  const [maxEntrants, setMaxEntrants] = useState(64);
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('Double Elimination. Best of 3 sets until Finals. Winner character locked, loser may switch.');
  const [customBannerUrl, setCustomBannerUrl] = useState('');
  const [createBracket, setCreateBracket] = useState(true);
  const [showOnProfile, setShowOnProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedGameObj = POPULAR_GAMES.find(g => g.id === selectedGameId);
  const gameDisplayName = selectedGameId === 'custom' ? customGameName || 'Custom FGC Game' : (selectedGameObj?.name || 'Fighting Game');
  const activeBanner = customBannerUrl || selectedGameObj?.banner || 'https://cdn.cloudflare.steamstatic.com/steam/apps/1778820/header.jpg';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter an event name.');
      return;
    }

    setSubmitting(true);
    try {
      const headers = await getHeaders();
      const payload = {
        name: name.trim(),
        game: gameDisplayName,
        game_id: selectedGameId === 'custom' ? 'custom' : selectedGameId,
        event_type: eventType,
        format: format,
        start_date: new Date(startDate).toISOString(),
        is_online: isOnline,
        venue_name: !isOnline ? venueName.trim() || undefined : undefined,
        city: !isOnline ? city.trim() || undefined : undefined,
        state: !isOnline ? state.trim() || undefined : undefined,
        address: !isOnline ? address.trim() || undefined : undefined,
        stream_url: streamUrl.trim() || undefined,
        discord_url: discordUrl.trim() || undefined,
        banner_url: activeBanner,
        entry_fee: entryFee.trim() || 'Free',
        prize_pool: prizePool.trim() || undefined,
        max_entrants: Number(maxEntrants) || 64,
        description: description.trim() || undefined,
        rules: rules.trim() || undefined,
        create_bracket: createBracket,
        show_on_profile: showOnProfile
      };

      const res = await fetch('/api/community-events', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to create event' }));
        throw new Error(err.detail || 'Failed to create event');
      }

      const data = await res.json();
      toast.success('FightBracket event created successfully! Bracket ready.');
      onEventCreated(data.event);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error creating event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#0D0D12] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#12121A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E5FF]/20 to-[#FF006E]/20 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF]">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wider text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                HOST FIGHTBRACKET EVENT
              </h2>
              <p className="text-xs text-gray-400">
                Create a community tournament with seamless in-app bracket management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Banner Preview */}
          <div className="relative h-28 sm:h-36 rounded-xl overflow-hidden border border-white/10 bg-[#161622] group">
            <img 
              src={activeBanner} 
              alt="Banner Preview" 
              className="w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D12] via-black/40 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
              <div>
                <span 
                  className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[#00E5FF] mb-1 inline-block"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {gameDisplayName} · {format.replace('_', ' ').toUpperCase()}
                </span>
                <h3 className="text-lg font-bold text-white tracking-wide truncate drop-shadow" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {name || 'Untitled FightBracket Event'}
                </h3>
              </div>
              <span className="text-[11px] text-gray-300 bg-black/60 px-2 py-1 rounded border border-white/10 font-mono shrink-0 hidden sm:inline-block">
                {isOnline ? '🌐 ONLINE' : `📍 ${city || 'VENUE'}`}
              </span>
            </div>
          </div>

          {/* Section: Basic Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#00E5FF] flex items-center gap-2">
              <Sparkles size={14} /> 1. EVENT DETAILS
            </h4>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">
                Event Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Iron Fist Showdown #4, Friday Night Throwdown"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]/60 transition-colors"
              />
            </div>

            {/* Game Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                <span>Select Fighting Game</span>
                <span className="text-[11px] text-gray-500">{gameDisplayName}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {POPULAR_GAMES.map(g => {
                  const isSel = selectedGameId === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGameId(g.id)}
                      className={`px-3 py-2 rounded-xl text-left border text-xs font-semibold transition-all flex flex-col justify-between h-14 ${
                        isSel 
                          ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-white shadow-[0_0_12px_rgba(0,229,255,0.2)]' 
                          : 'bg-black/30 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <span className="truncate">{g.name}</span>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                    </button>
                  );
                })}
              </div>

              {selectedGameId === 'custom' && (
                <input
                  type="text"
                  value={customGameName}
                  onChange={(e) => setCustomGameName(e.target.value)}
                  placeholder="Enter custom game title..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]/60 transition-colors mt-2"
                />
              )}
            </div>

            {/* Event Type & Tournament Format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Event Category</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5FF]/60"
                >
                  <option value="tournament" className="bg-[#12121A]">Tournament (Official)</option>
                  <option value="weekly" className="bg-[#12121A]">Weekly Series</option>
                  <option value="exhibition" className="bg-[#12121A]">Exhibition / First to 10</option>
                  <option value="casuals" className="bg-[#12121A]">Casuals / Free Play Meetup</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Tournament Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5FF]/60"
                >
                  <option value="double_elimination" className="bg-[#12121A]">Double Elimination</option>
                  <option value="single_elimination" className="bg-[#12121A]">Single Elimination</option>
                  <option value="round_robin" className="bg-[#12121A]">Round Robin</option>
                  <option value="swiss" className="bg-[#12121A]">Swiss System</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Schedule & Location */}
          <div className="space-y-4 pt-3 border-t border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#00E5FF] flex items-center gap-2">
              <Calendar size={14} /> 2. SCHEDULE & LOCATION
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5FF]/60"
                />
              </div>

              {/* Online vs In-Person Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Location Type</label>
                <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsOnline(true)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      isOnline ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 shadow-sm' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Globe size={13} /> ONLINE
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOnline(false)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      !isOnline ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 shadow-sm' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <MapPin size={13} /> IN-PERSON
                  </button>
                </div>
              </div>
            </div>

            {/* Offline fields */}
            {!isOnline && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[11px] text-gray-400 font-medium">Venue Name</label>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="e.g. Next Level Arcade"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400 font-medium">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Brooklyn"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400 font-medium">State / Region</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. NY"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section: Competition Rules & Links */}
          <div className="space-y-4 pt-3 border-t border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#00E5FF] flex items-center gap-2">
              <Trophy size={14} /> 3. COMPETITION & STREAM
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Max Entrants</label>
                <input
                  type="number"
                  min="4"
                  max="512"
                  value={maxEntrants}
                  onChange={(e) => setMaxEntrants(parseInt(e.target.value) || 64)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Entry Fee</label>
                <input
                  type="text"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  placeholder="Free or $10"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Prize Pool (Optional)</label>
                <input
                  type="text"
                  value={prizePool}
                  onChange={(e) => setPrizePool(e.target.value)}
                  placeholder="e.g. $500 Pot Bonus"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Tv size={13} className="text-[#00E5FF]" /> Live Stream URL (Twitch/YouTube)
                </label>
                <input
                  type="text"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="https://twitch.tv/yourchannel"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Globe size={13} className="text-[#00E5FF]" /> Discord / Community Link
                </label>
                <input
                  type="text"
                  value={discordUrl}
                  onChange={(e) => setDiscordUrl(e.target.value)}
                  placeholder="https://discord.gg/invite"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Rules & Format Summary</label>
              <textarea
                rows={2}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="Match guidelines, timer, stage selection..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]/60"
              />
            </div>
          </div>

          {/* Bracket Integration Feature Highlight */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#00E5FF]/10 via-[#FF006E]/10 to-transparent border border-[#00E5FF]/30 flex items-start gap-3">
            <input
              type="checkbox"
              id="createBracketCheck"
              checked={createBracket}
              onChange={(e) => setCreateBracket(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-700 text-[#00E5FF] focus:ring-[#00E5FF]"
            />
            <label htmlFor="createBracketCheck" className="text-xs text-gray-300 cursor-pointer">
              <span className="font-bold text-white block mb-0.5">
                Initialize Built-In Bracket Manager
              </span>
              Automatically generates a ready-to-run interactive tournament bracket in FightBracket Pro with station queues, match calls, and live score reporting.
            </label>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
            <input
              type="checkbox"
              id="showOnProfileCheck"
              checked={showOnProfile}
              onChange={(e) => setShowOnProfile(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-700 text-[#00E5FF] focus:ring-[#00E5FF]"
            />
            <label htmlFor="showOnProfileCheck" className="text-xs text-gray-300 cursor-pointer">
              <span className="font-bold text-white block mb-0.5">
                Display on My Profile
              </span>
              Show this event publicly on your personal FightBracket user profile so others can discover it.
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#12121A] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] text-[#050A14] font-bold text-xs tracking-wider rounded-xl hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.3)] uppercase"
            style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.08em' }}
          >
            {submitting ? (
              <>CREATING EVENT...</>
            ) : (
              <>
                <Check size={14} /> CREATE & INITIALIZE BRACKET
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
