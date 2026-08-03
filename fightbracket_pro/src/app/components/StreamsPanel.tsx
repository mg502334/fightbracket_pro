import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Tv, ExternalLink, ArrowRightLeft, PlayCircle, CheckCircle } from 'lucide-react';
import type { BracketMatch, GameTheme, Player } from '../data/tournamentData';

interface StreamsPanelProps {
  matches: BracketMatch[];
  players: Player[];
  theme: GameTheme;
}

function getStreamPlatform(url: string): 'twitch' | 'youtube' | 'tiktok' | 'facebook' | 'other' {
  if (url.includes('twitch.tv')) return 'twitch';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('facebook.com')) return 'facebook';
  return 'other';
}

const PLATFORM_META = {
  twitch:   { label: 'TWITCH',   color: '#6441a5', textColor: '#fff' },
  youtube:  { label: 'YOUTUBE',  color: '#FF0000', textColor: '#fff' },
  tiktok:   { label: 'TIKTOK',   color: '#00f2ea', textColor: '#000' },
  facebook: { label: 'FACEBOOK', color: '#1877F2', textColor: '#fff' },
  other:    { label: 'STREAM',   color: '#aaa',    textColor: '#fff' },
};

function getTwitchChannel(url: string): string | null {
  const m = url.match(/twitch\.tv\/([^/?#]+)/i);
  return m ? m[1].toLowerCase() : null;
}

export function StreamsPanel({ matches, players, theme }: StreamsPanelProps) {
  const [swappedChannels, setSwappedChannels] = useState<Record<string, boolean>>({});

  const parentDomains = [
    typeof window !== 'undefined' ? window.location.hostname : '',
    'localhost',
    '127.0.0.1',
    'fightbracketpro.com',
    'www.fightbracketpro.com',
    'fightbracket-pro.vercel.app'
  ].filter(Boolean);
  const parentParams = Array.from(new Set(parentDomains)).map(d => `parent=${d}`).join('&');

  // Build a map of unique stream URLs seen across all matches
  const streamData = useMemo(() => {
    // Key = canonical URL. Value = the MOST relevant active (non-completed) match.
    const streamMap = new Map<string, { url: string; platform: string; match: BracketMatch | null }>();

    // First pass: register all URLs (including completed) so we never lose a stream card
    matches.forEach(match => {
      if (!match.streamUrl) return;
      const url = match.streamUrl;
      if (!streamMap.has(url)) {
        streamMap.set(url, { url, platform: getStreamPlatform(url), match: null });
      }
    });

    // Second pass: assign the best active match (highest |round| wins) 
    const activeMatches = [...matches]
      .filter(m => m.state !== 'completed' && m.streamUrl)
      .sort((a, b) => Math.abs(b.round) - Math.abs(a.round));

    activeMatches.forEach(match => {
      const entry = streamMap.get(match.streamUrl!);
      if (entry && entry.match === null) {
        entry.match = match;
      }
    });

    return Array.from(streamMap.values());
  }, [matches]);

  if (streamData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center opacity-50 h-[400px]">
        <Tv size={64} className="mb-6 opacity-20" />
        <h2 className="text-xl tracking-widest mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>NO STREAMS FOUND</h2>
        <p className="text-sm max-w-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          No matches in this tournament have a stream attached. Streams are auto-detected from Start.gg imports.
        </p>
      </div>
    );
  }

  const getPlayerName = (id?: string | null) => {
    if (!id) return 'TBD';
    const player = players.find(p => p.id === id);
    return player ? player.tag : 'TBD';
  };

  const toggleSwap = (url: string) => {
    setSwappedChannels(prev => ({ ...prev, [url]: !prev[url] }));
  };

  return (
    <div className="grid gap-6 p-2" style={{ gridTemplateColumns: '1fr' }}>
      {streamData.map(({ url, platform, match }, idx) => {
        const isTwitch = platform === 'twitch';
        const meta = PLATFORM_META[platform as keyof typeof PLATFORM_META] || PLATFORM_META.other;
        const twitchChannel = isTwitch ? getTwitchChannel(url) : null;
        const isSwapped = swappedChannels[url] || false;
        const isLive = match !== null;
        const isPast = !isLive;

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
            key={url}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="rounded-lg overflow-hidden flex flex-col"
            style={{
              background: 'var(--card)',
              border: `1px solid ${isPast ? 'rgba(122,158,192,0.15)' : theme.primaryColor + '40'}`,
              boxShadow: isPast ? 'none' : `0 8px 32px rgba(0,0,0,0.4), 0 0 15px ${theme.primaryColor}15`,
              opacity: isPast ? 0.75 : 1,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${theme.primaryColor}20`, background: 'var(--sidebar)' }}>
              <div className="flex items-center gap-2">
                {/* Live / Past Pulse Indicator */}
                {isPast ? (
                  <CheckCircle size={12} style={{ color: '#5a7a9a' }} />
                ) : (
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#FF0000' }} />
                )}
                <span
                  className="text-sm font-bold tracking-widest uppercase"
                  style={{ fontFamily: 'Rajdhani, sans-serif', color: isPast ? '#5a7a9a' : 'var(--foreground)' }}
                >
                  {twitchChannel || new URL(url).hostname.replace('www.', '')}
                </span>
                {/* Platform badge */}
                <span
                  className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded"
                  style={{ background: meta.color + '22', color: meta.color, border: `1px solid ${meta.color}44`, fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {meta.label}
                </span>
                {/* Live/Past label */}
                <span
                  className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded"
                  style={{ fontFamily: 'JetBrains Mono, monospace', background: isPast ? 'rgba(90,122,154,0.15)' : 'rgba(0,255,136,0.1)', color: isPast ? '#5a7a9a' : '#00FF88', border: `1px solid ${isPast ? '#5a7a9a' : '#00FF88'}44` }}
                >
                  {isPast ? 'PAST' : 'LIVE'}
                </span>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="opacity-70 hover:opacity-100 transition-opacity flex items-center gap-1"
                style={{ color: theme.primaryColor, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
              >
                {isPast ? 'VIEW VOD' : `OPEN IN ${meta.label}`} <ExternalLink size={12} />
              </a>
            </div>

            {/* Round label if we have a match */}
            {match && (
              <div className="px-4 py-1.5 text-[10px] tracking-widest opacity-50 border-b" style={{ fontFamily: 'JetBrains Mono, monospace', borderColor: 'rgba(122,158,192,0.08)' }}>
                {match.roundName} {match.pool ? `· POOL ${match.pool}` : ''} {match.stationId ? `· STN ${match.stationId}` : ''}
              </div>
            )}

            {/* Video area - only for Twitch (can embed) */}
            {isTwitch && twitchChannel && (
              <div className="flex flex-col lg:flex-row w-full h-[500px]">
                {/* Video Player */}
                <div className="flex-1 relative bg-black">
                  <iframe
                    src={`https://player.twitch.tv/?channel=${twitchChannel}&${parentParams}&muted=true`}
                    height="100%"
                    width="100%"
                    allowFullScreen
                    className="absolute inset-0 border-0"
                    title={`Twitch Stream - ${twitchChannel}`}
                  />
                </div>
                {/* Chat Panel */}
                <div className="w-full lg:w-[350px] border-t lg:border-t-0 lg:border-l bg-black" style={{ borderColor: `${theme.primaryColor}20` }}>
                  <iframe
                    src={`https://www.twitch.tv/embed/${twitchChannel}/chat?${parentParams}&darkpopout`}
                    height="100%"
                    width="100%"
                    className="border-0"
                    title={`Twitch Chat - ${twitchChannel}`}
                  />
                </div>
              </div>
            )}

            {/* Non-Twitch: big "WATCH LIVE" button */}
            {!isTwitch && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center gap-3 py-12 transition-all hover:brightness-110 text-decoration-none"
                style={{ background: `${meta.color}12`, textDecoration: 'none' }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: meta.color, boxShadow: `0 0 32px ${meta.color}66` }}
                >
                  <PlayCircle size={32} color={meta.textColor} />
                </div>
                <span
                  className="text-lg font-bold tracking-widest"
                  style={{ fontFamily: 'Rajdhani, sans-serif', color: isPast ? '#5a7a9a' : meta.color }}
                >
                  {isPast ? `WAS LIVE ON ${meta.label}` : `WATCH LIVE ON ${meta.label}`}
                </span>
                <span className="text-xs opacity-50 font-mono">{url}</span>
              </a>
            )}

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
                      onClick={() => toggleSwap(url)}
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
                <div className="w-full text-center py-2 opacity-40 font-bold tracking-widest text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {isPast ? 'STREAM COMPLETED' : 'WAITING FOR NEXT MATCH...'}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
