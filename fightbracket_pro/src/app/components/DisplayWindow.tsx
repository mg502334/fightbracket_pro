import React, { useState, useEffect } from 'react';
import { BracketView } from './BracketView';
import { AnnouncementOverlay } from './AnnouncementOverlay';
import { BracketMatch, Player, GameTheme, GAME_THEMES } from '../data/tournamentData';
import { Maximize2, Minimize2, RotateCw, Tv, Wifi, Layers } from 'lucide-react';

export function DisplayWindow() {
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [theme, setTheme] = useState<GameTheme>(GAME_THEMES.tekken8);
  const [announcement, setAnnouncement] = useState<BracketMatch | null>(null);
  const [isVertical, setIsVertical] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Sync state via BroadcastChannel and localStorage
  useEffect(() => {
    // 1. Check localStorage for initial cached state
    try {
      const cached = localStorage.getItem('fightbracket_display_state');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.matches) setMatches(parsed.matches);
        if (parsed.players) setPlayers(parsed.players);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.announcement) setAnnouncement(parsed.announcement);
        if (parsed.isVertical !== undefined) setIsVertical(parsed.isVertical);
      }
    } catch (e) {
      console.error('Failed to parse cached display state', e);
    }

    // 2. Setup BroadcastChannel listener
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('fightbracket_display_channel');
      channel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        setIsConnected(true);

        if (data.type === 'STATE_UPDATE' || data.type === 'SYNC') {
          if (data.matches) setMatches(data.matches);
          if (data.players) setPlayers(data.players);
          if (data.theme) setTheme(data.theme);
          if (data.announcement !== undefined) setAnnouncement(data.announcement);
          if (data.isVertical !== undefined) setIsVertical(data.isVertical);
        } else if (data.type === 'MATCH_CALLED') {
          if (data.match) {
            setAnnouncement(data.match);
          }
        }
      };

      // Request initial state from host window
      channel.postMessage({ type: 'REQUEST_INITIAL_STATE' });
    } catch (e) {
      console.warn('BroadcastChannel not supported, falling back to localStorage listeners');
    }

    // 3. Fallback localStorage listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fightbracket_display_state' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.matches) setMatches(parsed.matches);
          if (parsed.players) setPlayers(parsed.players);
          if (parsed.theme) setTheme(parsed.theme);
          if (parsed.announcement !== undefined) setAnnouncement(parsed.announcement);
          if (parsed.isVertical !== undefined) setIsVertical(parsed.isVertical);
          setIsConnected(true);
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      channel?.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen().catch(err => console.error(err));
    }
  };

  return (
    <div
      className={`min-h-screen text-foreground select-none relative overflow-hidden ${
        isVertical ? 'flex flex-col' : ''
      }`}
      style={{
        background: `radial-gradient(ellipse at top, ${theme.bgFrom} 0%, #030712 100%)`,
        color: 'var(--foreground)',
      }}
    >
      {/* Top Display Mode Controls Bar */}
      <div
        className="flex items-center justify-between px-6 py-3 border-b bg-black/70 backdrop-blur-md z-30"
        style={{ borderColor: `${theme.primaryColor}30` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: `${theme.primaryColor}20`, color: theme.primaryColor }}
          >
            <Tv size={18} />
          </div>
          <div>
            <div className="font-bold text-sm tracking-widest uppercase font-rajdhani flex items-center gap-2">
              <span>VENUE DISPLAY WINDOW</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                LIVE STAGE
              </span>
            </div>
            <div className="text-[11px] font-mono opacity-50 flex items-center gap-2">
              <Wifi size={10} className={isConnected ? 'text-green-400' : 'text-amber-400'} />
              <span>{isConnected ? 'LIVE SYNCED WITH TO DASHBOARD' : 'WAITING FOR SYNC...'}</span>
            </div>
          </div>
        </div>

        {/* Display Controls */}
        <div className="flex items-center gap-3">
          {/* Orientation Toggle Button */}
          <button
            onClick={() => setIsVertical(!isVertical)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
              isVertical
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
            }`}
            title="Toggle Vertical/Portrait orientation for tall venue TV screens"
          >
            <RotateCw size={14} className={isVertical ? 'rotate-90 transition-transform' : ''} />
            <span>{isVertical ? 'PORTRAIT (VERTICAL)' : 'LANDSCAPE'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 transition-all"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}</span>
          </button>
        </div>
      </div>

      {/* Main Bracket Content View */}
      <div
        className={`flex-1 p-4 overflow-auto custom-scrollbar ${
          isVertical ? 'max-w-4xl mx-auto w-full' : ''
        }`}
      >
        <BracketView
          matches={matches}
          players={players}
          theme={theme}
          onCallMatch={() => {}}
          selectedPool="ALL"
          isImported={true}
        />
      </div>

      {/* Live Match Called Overlay (Displays prominently over bracket when TO calls a match) */}
      <AnnouncementOverlay
        match={announcement}
        players={players}
        theme={theme}
        onDismiss={() => setAnnouncement(null)}
      />
    </div>
  );
}

export default DisplayWindow;
