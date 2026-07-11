import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Tv, ExternalLink } from 'lucide-react';
import type { BracketMatch, GameTheme, Player } from '../data/tournamentData';

interface StreamsPanelProps {
  matches: BracketMatch[];
  players: Player[];
  theme: GameTheme;
}

export function StreamsPanel({ matches, players, theme }: StreamsPanelProps) {
  // Extract unique Twitch channels and their associated match
  const streamData = useMemo(() => {
    const activeStreamMatches = matches.filter(
      m => m.state !== 'completed' && m.streamUrl && m.streamUrl.includes('twitch.tv/')
    );
      
    // Group by channel
    const channelsMap = new Map<string, BracketMatch>();
    activeStreamMatches.forEach(match => {
      const regexMatch = match.streamUrl?.match(/twitch\.tv\/([^/?]+)/i);
      if (regexMatch && regexMatch[1]) {
        // Just take the first active match on this stream for now
        if (!channelsMap.has(regexMatch[1])) {
          channelsMap.set(regexMatch[1], match);
        }
      }
    });
    
    return Array.from(channelsMap.entries()).map(([channel, match]) => ({ channel, match }));
  }, [matches]);

  if (streamData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center opacity-50 h-[400px]">
        <Tv size={64} className="mb-6 opacity-20" />
        <h2 className="text-xl tracking-widest mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>NO ACTIVE STREAMS</h2>
        <p className="text-sm max-w-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          There are currently no active matches with a broadcast attached. Streams usually appear during top cuts and finals.
        </p>
      </div>
    );
  }

  const getPlayerName = (id?: string) => {
    if (!id) return 'TBD';
    const player = players.find(p => p.id === id);
    return player ? player.tag : 'TBD';
  };

  return (
    <div className="grid gap-6 p-2" style={{ gridTemplateColumns: '1fr' }}>
      {streamData.map(({ channel, match }, idx) => (
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
          <div className="px-6 py-4 flex items-center justify-center gap-8 border-t" style={{ borderColor: `${theme.primaryColor}20`, background: 'var(--sidebar)' }}>
            <div className="text-right">
              <div className="text-xl font-bold tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--foreground)' }}>
                {getPlayerName(match.player1Id)}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-3xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif', color: theme.primaryColor }}>
              <span>{match.player1Score ?? 0}</span>
              <span className="text-sm opacity-50 text-white">VS</span>
              <span>{match.player2Score ?? 0}</span>
            </div>

            <div className="text-left">
              <div className="text-xl font-bold tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--foreground)' }}>
                {getPlayerName(match.player2Id)}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
