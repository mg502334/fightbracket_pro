import React, { useState, useEffect } from 'react';
import { 
   Flame, Play, Tv, Users, Clock, ExternalLink, 
   Radio, CheckCircle2, Trophy
} from 'lucide-react';

export interface RecentTournamentItem {
  id: string;
  name: string;
  game: string;
  participants: number;
  status: 'live' | 'active' | 'completed';
  streamingPlatform?: string;
  streamUrl?: string;
  isFriendEvent?: boolean;
  friendNames?: string[];
  completedAt?: number; // timestamp in ms
  link?: string;
}

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

interface RecentsWidgetProps {
  customActiveItems?: RecentTournamentItem[];
  customCompletedItems?: RecentTournamentItem[];
  onSelectEvent?: (event: RecentTournamentItem) => void;
  className?: string;
}

export function RecentsWidget({
  customActiveItems,
  customCompletedItems,
  onSelectEvent,
  className = ""
}: RecentsWidgetProps) {
  const [activeItems, setActiveItems] = useState<RecentTournamentItem[]>(customActiveItems || []);
  const [completedItems, setCompletedItems] = useState<RecentTournamentItem[]>(customCompletedItems || []);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [loading, setLoading] = useState(false);

  // Load real active and completed tournament data from backend & active user session
  const loadRealRecents = async () => {
    try {
      const res = await fetch('/api/recents');
      let apiActive: RecentTournamentItem[] = [];
      let apiCompleted: RecentTournamentItem[] = [];

      if (res.ok) {
        const data = await res.json();
        apiActive = data.active || [];
        apiCompleted = data.completed || [];
      }

      // Also read real local session tournaments from localStorage
      const localTournament = safeParse<any>('fb_tournament', null);
      const localMatches = safeParse<any[]>('fb_matches', []);
      const localExhibitions = safeParse<any[]>('fb_exhibitions', []);
      const localPlayers = safeParse<any[]>('fb_players', []);

      const combinedActive: RecentTournamentItem[] = [...apiActive];
      const combinedCompleted: RecentTournamentItem[] = [...apiCompleted];

      // If active tournament is currently loaded in the user's session
      if (localTournament && localTournament.name) {
        const hasFinished = localMatches.length > 0 && localMatches.every(m => m.state === 'completed');
        const numPlayers = localPlayers.length || localTournament.numAttendees || 0;
        const gameName = localTournament.game || localTournament.gameTitle || 'Tekken 8';

        const localItem: RecentTournamentItem = {
          id: localTournament.slug || 'local-active-tourney',
          name: localTournament.name,
          game: gameName,
          participants: numPlayers,
          status: hasFinished ? 'completed' : 'active',
          streamingPlatform: localTournament.streamUrl ? 'Live Stream' : undefined,
          streamUrl: localTournament.streamUrl,
          completedAt: hasFinished ? Date.now() : undefined
        };

        if (hasFinished) {
          if (!combinedCompleted.some(c => c.name === localItem.name)) {
            combinedCompleted.unshift(localItem);
          }
        } else {
          if (!combinedActive.some(a => a.name === localItem.name)) {
            combinedActive.unshift(localItem);
          }
        }
      }

      // If exhibitions exist in user's session
      if (Array.isArray(localExhibitions) && localExhibitions.length > 0) {
        localExhibitions.forEach(ex => {
          if (!ex || !ex.id) return;
          const exName = `${ex.p1Name || 'Player 1'} vs ${ex.p2Name || 'Player 2'} Showmatch`;
          const isCompleted = ex.status === 'completed';
          const exItem: RecentTournamentItem = {
            id: `ex-${ex.id}`,
            name: exName,
            game: ex.gameTitle || ex.gameId || 'Exhibition Match',
            participants: 2,
            status: isCompleted ? 'completed' : 'live',
            streamingPlatform: ex.videoUrl ? (ex.videoUrl.includes('youtube') ? 'YouTube' : 'Twitch') : undefined,
            streamUrl: ex.videoUrl,
            completedAt: isCompleted ? (ex.completedAt || Date.now()) : undefined
          };

          if (isCompleted) {
            if (!combinedCompleted.some(c => c.id === exItem.id)) {
              combinedCompleted.push(exItem);
            }
          } else {
            if (!combinedActive.some(a => a.id === exItem.id)) {
              combinedActive.push(exItem);
            }
          }
        });
      }

      if (!customActiveItems) setActiveItems(combinedActive);
      if (!customCompletedItems) setCompletedItems(combinedCompleted);
    } catch {
      // Graceful fallback without fake items
    }
  };

  useEffect(() => {
    loadRealRecents();
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      loadRealRecents();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync custom items when passed from parent
  useEffect(() => {
    if (customActiveItems) setActiveItems(customActiveItems);
    if (customCompletedItems) setCompletedItems(customCompletedItems);
  }, [customActiveItems, customCompletedItems]);

  // Sort and filter active items: prioritize real friends tournaments first, then max 4
  const displayActive = [...activeItems]
    .filter(item => item.status === 'active' || item.status === 'live')
    .sort((a, b) => {
      // 1. Friend events first
      if (a.isFriendEvent && !b.isFriendEvent) return -1;
      if (!a.isFriendEvent && b.isFriendEvent) return 1;
      // 2. Live before active
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (a.status !== 'live' && b.status === 'live') return 1;
      return 0;
    })
    .slice(0, 4);

  // Filter completed items with 4-hour freshness rule (expire & remove announcements older than 4h)
  const displayCompleted = [...completedItems]
    .filter(item => {
      if (item.status !== 'completed') return false;
      if (!item.completedAt) return true;
      // 4 hours expiration rule
      return currentTime - item.completedAt <= FOUR_HOURS_MS;
    })
    .sort((a, b) => {
      // 1. Friend events first
      if (a.isFriendEvent && !b.isFriendEvent) return -1;
      if (!a.isFriendEvent && b.isFriendEvent) return 1;
      // 2. Most recently completed first
      const timeA = a.completedAt || 0;
      const timeB = b.completedAt || 0;
      return timeB - timeA;
    })
    .slice(0, 4);

  const formatElapsed = (completedAt?: number) => {
    if (!completedAt) return "Recently";
    const diffMin = Math.max(1, Math.round((currentTime - completedAt) / (60 * 1000)));
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = (diffMin / 60).toFixed(1).replace('.0', '');
    return `${diffHours}h ago`;
  };

  return (
    <div 
      className={`rounded-xl overflow-hidden flex flex-col ${className}`}
      style={{
        background: "#141418",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "4px"
      }}
    >
      {/* Widget Header */}
      <div 
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ 
          borderColor: "rgba(255,255,255,0.07)",
          background: "linear-gradient(90deg, rgba(6,182,212,0.1) 0%, rgba(20,20,24,0) 100%)" 
        }}
      >
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-cyan-400 animate-pulse" />
          <h3 
            className="text-white text-xs uppercase tracking-widest font-bold"
            style={{ fontFamily: "'Barlow Condensed', 'Rajdhani', sans-serif", letterSpacing: "0.12em" }}
          >
            RECENTS
          </h3>
        </div>
        <span 
          className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider"
          style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" }}
        >
          4H WINDOW
        </span>
      </div>

      <div className="p-3 space-y-4">
        {/* Section 1: Active Tournaments and Exhibitions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span 
              className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              <Flame size={12} className="text-amber-400" />
              Active Tournaments & Exhibitions
            </span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold">
              {displayActive.length}/4
            </span>
          </div>

          {displayActive.length === 0 ? (
            <div className="p-4 text-center border border-white/5 rounded bg-black/20 my-1">
              <Trophy size={18} className="mx-auto mb-1.5 text-cyan-400/40" />
              <p className="text-[11px] text-gray-300 font-mono font-medium">No Active Tournaments</p>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">Host an event or import a bracket to track live matches</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayActive.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectEvent?.(item)}
                  className="p-2.5 rounded transition-all duration-150 group relative cursor-pointer hover:bg-white/[0.04]"
                  style={{
                    background: item.isFriendEvent ? "rgba(6,182,212,0.06)" : "#181820",
                    border: item.isFriendEvent ? "1px solid rgba(6,182,212,0.3)" : "1px solid rgba(255,255,255,0.05)"
                  }}
                >
                  {/* Friend priority badge */}
                  {item.isFriendEvent && item.friendNames && item.friendNames.length > 0 && (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-cyan-400 mb-1">
                      <Users size={10} />
                      <span className="truncate">
                        FRIEND IN EVENT ({item.friendNames.join(', ')})
                      </span>
                    </div>
                  )}

                  {/* Row 1: 'Name of Tournament' ((status)/active/completed)) */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-colors truncate">
                      {item.name}
                    </span>
                    <span 
                      className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0"
                      style={{
                        background: item.status === 'live' ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.15)",
                        color: item.status === 'live' ? "#f87171" : "#4ade80",
                        border: item.status === 'live' ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(34,197,94,0.3)"
                      }}
                    >
                      {item.status === 'live' ? 'LIVE' : 'ACTIVE'}
                    </span>
                  </div>

                  {/* Row 2: 'Name of Game' (Number of participants) */}
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                    <span className="text-gray-300 font-medium truncate">
                      {item.game}
                    </span>
                    <span className="text-gray-400 shrink-0 font-mono">
                      ({item.participants} {item.participants === 1 ? 'participant' : 'participants'})
                    </span>
                  </div>

                  {item.streamingPlatform && (
                    <div className="mt-1 flex items-center gap-1 text-[9px] text-cyan-400/80 font-mono">
                      <Tv size={10} />
                      <span>{item.streamingPlatform}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Completed Tournaments and Exhibits (4hrs recent) */}
        <div className="pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-2">
            <span 
              className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              <CheckCircle2 size={12} className="text-purple-400" />
              Completed Tournaments & Exhibits
            </span>
            <span className="text-[10px] text-purple-400 font-mono font-bold">
              {displayCompleted.length}/4
            </span>
          </div>

          {displayCompleted.length === 0 ? (
            <div className="p-4 text-center border border-white/5 rounded bg-black/20 my-1">
              <Clock size={18} className="mx-auto mb-1.5 text-purple-400/40" />
              <p className="text-[11px] text-gray-300 font-mono font-medium">No Recent Completed Events</p>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">Finished results expire after 4 hours</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayCompleted.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectEvent?.(item)}
                  className="p-2.5 rounded transition-all duration-150 group relative cursor-pointer hover:bg-white/[0.04]"
                  style={{
                    background: item.isFriendEvent ? "rgba(168,85,247,0.06)" : "#181820",
                    border: item.isFriendEvent ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(255,255,255,0.05)"
                  }}
                >
                  {/* Friend completed indicator */}
                  {item.isFriendEvent && item.friendNames && item.friendNames.length > 0 && (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-purple-400 mb-1">
                      <Users size={10} />
                      <span className="truncate">
                        FRIEND PARTICIPATED ({item.friendNames.join(', ')})
                      </span>
                    </div>
                  )}

                  {/* Row 1: 'Name of Tournament' ((status)/active/completed)) */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-semibold text-gray-200 group-hover:text-purple-300 transition-colors truncate">
                      {item.name}
                    </span>
                    <span 
                      className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0"
                      style={{
                        background: "rgba(168,85,247,0.15)",
                        color: "#c084fc",
                        border: "1px solid rgba(168,85,247,0.3)"
                      }}
                    >
                      COMPLETED
                    </span>
                  </div>

                  {/* Row 2: 'Show Case' (streaming Platform name) */}
                  <div className="flex items-center justify-between text-[10px] text-cyan-400 mt-1 font-mono">
                    <span className="flex items-center gap-1 truncate text-gray-300">
                      <Play size={10} className="text-purple-400 shrink-0" />
                      <span className="text-[10px] text-purple-300 font-medium">Show Case:</span> {item.streamingPlatform || "Twitch / VOD"}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono shrink-0 ml-1">
                      {formatElapsed(item.completedAt)}
                    </span>
                  </div>

                  {/* Row 3: 'Name of Game' (Number of participants) */}
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                    <span className="text-gray-400 truncate font-sans">
                      {item.game}
                    </span>
                    <span className="text-gray-500 shrink-0 font-mono text-[9px]">
                      ({item.participants} {item.participants === 1 ? 'participant' : 'participants'})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
