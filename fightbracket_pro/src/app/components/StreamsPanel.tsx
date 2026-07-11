import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Tv, ExternalLink, ArrowRightLeft } from 'lucide-react';
import type { BracketMatch, GameTheme, Player } from '../data/tournamentData';

interface StreamsPanelProps {
  matches: BracketMatch[];
  players: Player[];
  theme: GameTheme;
}

export function StreamsPanel({ matches, players, theme }: StreamsPanelProps) {
  // Track which channels have their players swapped left/right
  const [swappedChannels, setSwappedChannels] = useState<Record<string, boolean>>({});

  // 1. Extract ALL unique Twitch channels ever associated with any match (to prevent iframe remounting and ads)
  // 2. Find the ACTIVE match for each channel (if any)
  const streamData = useMemo(() => {
    const channelsMap = new Map<string, BracketMatch | null>();
    
    // First, find all channels so we never unmount the iframe
    matches.forEach(match => {
      if (match.streamUrl && match.streamUrl.includes('twitch.tv/')) {
        const regexMatch = match.streamUrl.match(/twitch\.tv\/([^/?]+)/i);
        if (regexMatch && regexMatch[1]) {
          const channel = regexMatch[1].toLowerCase();
          if (!channelsMap.has(channel)) {
            channelsMap.set(channel, null);
          }
        }
      }
    });

    // Next, assign the currently active match to the channel (if any)
    // We filter out completed matches and sort by Math.abs(round) descending
    // This ensures we always pick the deepest bracket match (like Grand Finals) 
    // over any stale pool matches that were accidentally left in_progress
    const activeMatches = [...matches]
      .filter(m => m.state !== 'completed' && m.streamUrl && m.streamUrl.includes('twitch.tv/'))
      .sort((a, b) => Math.abs(b.round) - Math.abs(a.round));
      
    activeMatches.forEach(match => {
      const regexMatch = match.streamUrl?.match(/twitch\.tv\/([^/?]+)/i);
      if (regexMatch && regexMatch[1]) {
        const channel = regexMatch[1].toLowerCase();
        // Take the first active match (which is now guaranteed to be the latest round)
        if (channelsMap.get(channel) === null) {
          channelsMap.set(channel, match);
        }
      }
    });
    
    return Array.from(channelsMap.entries()).map(([channel, activeMatch]) => ({ channel, match: activeMatch }));
  }, [matches]);

  if (streamData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center opacity-50 h-[400px]">
        <Tv size={64} className="mb-6 opacity-20" />
        <h2 className="text-xl tracking-widest mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>NO STREAMS FOUND</h2>
        <p className="text-sm max-w-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          No matches in this tournament have a Twitch stream attached.
        </p>
      </div>
    );
  }

  const getPlayerName = (id?: string) => {
    if (!id) return 'TBD';
    const player = players.find(p => p.id === id);
    return player ? player.tag : 'TBD';
  };

  const toggleSwap = (channel: string) => {
    setSwappedChannels(prev => ({
      ...prev,
      [channel]: !prev[channel]
    }));
  };

  return (
    <div className="grid gap-6 p-2" style={{ gridTemplateColumns: '1fr' }}>
      {streamData.map(({ channel, match }, idx) => {
        const isSwapped = swappedChannels[channel] || false;
        
        let leftPlayer = match ? getPlayerName(match.player1Id) : '';
        let leftScore = match ? (match.player1Score ?? 0) : 0;
        let rightPlayer = match ? getPlayerName(match.player2Id) : '';
        let rightScore = match ? (match.player2Score ?? 0) : 0;

        if (isSwapped && match) {
          leftPlayer = getPlayerName(match.player2Id);
          leftScore = match.player2Score ?? 0;
          rightPlayer = getPlayerName(match.player1Id);
          rightScore = match.player1Score ?? 0;
        }

        return (
          <motion.div 
            key={channel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="rounded-lg overflow-hidden flex flex-col"
            style={{ 
              background: 'var(--card)', 
              border: `1px solid ${theme.primaryColor}30`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 15px ${theme.primaryColor}15`
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${theme.primaryColor}20`, background: 'var(--sidebar)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#FF0000' }} />
                <span className="text-sm font-bold tracking-widest text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {channel}
                </span>
              </div>
              <a 
                href={`https://twitch.tv/${channel}`} 
                target="_blank" 
                rel="noreferrer"
                className="opacity-70 hover:opacity-100 transition-opacity flex items-center gap-1"
                style={{ color: theme.primaryColor, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
              >
                OPEN IN TWITCH <ExternalLink size={12} />
              </a>
            </div>

            {/* Video & Chat Row */}
            <div className="flex flex-col lg:flex-row w-full h-[500px]">
              {/* Video Player */}
              <div className="flex-1 relative bg-black">
                <iframe
                  src={`https://player.twitch.tv/?channel=${channel}&parent=localhost&parent=fightbracketpro.com&parent=www.fightbracketpro.com&muted=true`}
                  height="100%"
                  width="100%"
                  allowFullScreen
                  className="absolute inset-0 border-0"
                  title={`Twitch Stream - ${channel}`}
                />
              </div>
              
              {/* Chat Panel */}
              <div className="w-full lg:w-[350px] border-t lg:border-t-0 lg:border-l bg-black" style={{ borderColor: `${theme.primaryColor}20` }}>
                 <iframe 
                  src={`https://www.twitch.tv/embed/${channel}/chat?parent=localhost&parent=fightbracketpro.com&parent=www.fightbracketpro.com&darkpopout`}
                  height="100%"
                  width="100%"
                  className="border-0"
                  title={`Twitch Chat - ${channel}`}
                />
              </div>
            </div>

            {/* Scoreboard Footer */}
            <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t" style={{ borderColor: `${theme.primaryColor}20`, background: 'var(--sidebar)' }}>
              {match ? (
                <>
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <span className="text-xl font-bold tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--foreground)' }}>
                      {leftPlayer}
                    </span>
                    <span className="text-3xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif', color: theme.primaryColor }}>
                      {leftScore}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center px-4">
                    <span className="text-sm opacity-50 text-white font-bold mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>VS</span>
                    <button 
                      onClick={() => toggleSwap(channel)}
                      className="p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-white/50 hover:text-white"
                      title="Swap Left/Right Players"
                    >
                      <ArrowRightLeft size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 flex-1 justify-start">
                    <span className="text-3xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif', color: theme.primaryColor }}>
                      {rightScore}
                    </span>
                    <span className="text-xl font-bold tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--foreground)' }}>
                      {rightPlayer}
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full text-center py-2 opacity-50 font-bold tracking-widest text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  WAITING FOR NEXT MATCH...
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
