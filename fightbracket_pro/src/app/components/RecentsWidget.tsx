import React, { useState, useEffect } from 'react';
import { 
  Trophy, Flame, Play, Tv, Users, Clock, ExternalLink, 
  ChevronRight, Radio, Sparkles, CheckCircle2, ShieldAlert
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

export interface RecentExhibitionItem {
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

const DEFAULT_ACTIVE_ITEMS: RecentTournamentItem[] = [
  {
    id: 'act-1',
    name: 'Red Bull Golden Letters - Top 8',
    game: 'Tekken 8',
    participants: 128,
    status: 'live',
    isFriendEvent: true,
    friendNames: ['Speedkicks', 'Shadow20z'],
    streamingPlatform: 'Twitch',
    streamUrl: 'https://twitch.tv/redbull',
    link: 'https://start.gg'
  },
  {
    id: 'act-2',
    name: 'CEO 2026 Warmup Invitational',
    game: 'Street Fighter 6',
    participants: 64,
    status: 'active',
    isFriendEvent: true,
    friendNames: ['SonicFox'],
    streamingPlatform: 'YouTube',
    streamUrl: 'https://youtube.com',
    link: 'https://start.gg'
  },
  {
    id: 'act-3',
    name: 'City of the Wolves Showmatch',
    game: 'Fatal Fury: CotW',
    participants: 16,
    status: 'live',
    streamingPlatform: 'Twitch',
    streamUrl: 'https://twitch.tv/snkofficial',
    link: 'https://start.gg'
  },
  {
    id: 'act-4',
    name: 'Texas Showdown Qualifier #3',
    game: 'Tekken 8',
    participants: 48,
    status: 'active',
    streamingPlatform: 'Twitch',
    link: 'https://start.gg'
  },
  {
    id: 'act-5',
    name: 'Friday Night Fight Night #55',
    game: 'Guilty Gear Strive',
    participants: 32,
    status: 'active',
    link: 'https://start.gg'
  }
];

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

const DEFAULT_COMPLETED_ITEMS: RecentTournamentItem[] = [
  {
    id: 'comp-1',
    name: 'Defend the North - Grand Finals',
    game: 'Tekken 8',
    participants: 96,
    status: 'completed',
    streamingPlatform: 'Twitch (VOD / Highlights)',
    streamUrl: 'https://twitch.tv',
    completedAt: Date.now() - (45 * 60 * 1000), // 45 minutes ago
    isFriendEvent: true,
    friendNames: ['ArslanAsh']
  },
  {
    id: 'comp-2',
    name: 'East Coast Throwdown Exhibition',
    game: 'Street Fighter 6',
    participants: 32,
    status: 'completed',
    streamingPlatform: 'YouTube: @CapcomFighters',
    streamUrl: 'https://youtube.com',
    completedAt: Date.now() - (110 * 60 * 1000), // ~1.8 hours ago
  },
  {
    id: 'comp-3',
    name: 'Brussels Challenge Regional Major',
    game: 'Tekken 8',
    participants: 140,
    status: 'completed',
    streamingPlatform: 'Kick: /fgclive',
    streamUrl: 'https://kick.com',
    completedAt: Date.now() - (190 * 60 * 1000), // ~3.1 hours ago
  },
  {
    id: 'comp-4',
    name: 'FightBracket Midnight Series #12',
    game: '2XKO',
    participants: 24,
    status: 'completed',
    streamingPlatform: 'TikTok: @fightbracket',
    streamUrl: 'https://tiktok.com',
    completedAt: Date.now() - (220 * 60 * 1000), // ~3.6 hours ago
  },
  {
    id: 'comp-expired',
    name: 'Old Tournament Yesterday',
    game: 'Mortal Kombat 1',
    participants: 32,
    status: 'completed',
    streamingPlatform: 'YouTube',
    completedAt: Date.now() - (6 * 60 * 60 * 1000), // 6 hours ago -> Should be filtered out by 4hr rule
  }
];

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
  const [activeItems, setActiveItems] = useState<RecentTournamentItem[]>(customActiveItems || DEFAULT_ACTIVE_ITEMS);
  const [completedItems, setCompletedItems] = useState<RecentTournamentItem[]>(customCompletedItems || DEFAULT_COMPLETED_ITEMS);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update time every 30 seconds to recalculate relative times and auto-expire 4h items
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Sync custom items when passed from parent
  useEffect(() => {
    if (customActiveItems) setActiveItems(customActiveItems);
    if (customCompletedItems) setCompletedItems(customCompletedItems);
  }, [customActiveItems, customCompletedItems]);

  // Sort and filter active items: prioritize friends tournaments first, then show max 4
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
            <div className="text-[11px] text-gray-500 py-3 text-center font-mono">
              No live events currently active
            </div>
          ) : (
            <div className="space-y-2">
              {displayActive.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectEvent?.(item)}
                  className="p-2 rounded transition-all duration-150 group relative cursor-pointer hover:bg-white/[0.04]"
                  style={{
                    background: item.isFriendEvent ? "rgba(6,182,212,0.06)" : "#181820",
                    border: item.isFriendEvent ? "1px solid rgba(6,182,212,0.3)" : "1px solid rgba(255,255,255,0.05)"
                  }}
                >
                  {/* Friend priority badge */}
                  {item.isFriendEvent && (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-cyan-400 mb-1">
                      <Users size={10} />
                      <span className="truncate">
                        FRIEND IN EVENT {item.friendNames && item.friendNames.length > 0 ? `(${item.friendNames.join(', ')})` : ''}
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
            <div className="text-[11px] text-gray-500 py-3 text-center font-mono">
              No completed events in the last 4h
            </div>
          ) : (
            <div className="space-y-2">
              {displayCompleted.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectEvent?.(item)}
                  className="p-2 rounded transition-all duration-150 group relative cursor-pointer hover:bg-white/[0.04]"
                  style={{
                    background: item.isFriendEvent ? "rgba(168,85,247,0.06)" : "#181820",
                    border: item.isFriendEvent ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(255,255,255,0.05)"
                  }}
                >
                  {/* Friend completed indicator */}
                  {item.isFriendEvent && (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-purple-400 mb-1">
                      <Users size={10} />
                      <span className="truncate">
                        FRIEND PARTICIPATED {item.friendNames && item.friendNames.length > 0 ? `(${item.friendNames.join(', ')})` : ''}
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
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
                    <span className="text-gray-400 font-medium truncate">
                      {item.game}
                    </span>
                    <span className="text-gray-500 shrink-0 font-mono">
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
