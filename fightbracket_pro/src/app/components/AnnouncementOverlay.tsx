import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  MapPin,
  Wifi,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Play,
  AlertTriangle,
  Clock,
  Shield,
  Radio
} from "lucide-react";
import type { BracketMatch, Player, GameTheme } from "../data/tournamentData";
import { FistBumpIcon } from "./FistBumpIcon";
import { playTournamentChime, speakMatchCall } from "../utils/audioAnnouncer";

interface AnnouncementOverlayProps {
  match: BracketMatch | null;
  players: Player[];
  theme: GameTheme;
  onDismiss: () => void;
  onStartMatch?: (match: BracketMatch) => void;
  onUndoCall?: (matchId: string) => void;
}

export function AnnouncementOverlay({
  match,
  players,
  theme,
  onDismiss,
  onStartMatch,
  onUndoCall,
}: AnnouncementOverlayProps) {
  const [countdown, setCountdown] = useState(25);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reportTimeLeft, setReportTimeLeft] = useState(10 * 60); // 10 minute rule
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize audio announcement and reset timers when match changes
  useEffect(() => {
    if (!match) return;

    setCountdown(25);
    setIsPaused(false);

    // Initial chime
    if (!isMuted) {
      playTournamentChime(0.35);
    }

    // Calculate initial 10-min forfeit countdown
    const calledTime = match.calledAt || Date.now();
    const elapsedSeconds = Math.floor((Date.now() - calledTime) / 1000);
    setReportTimeLeft(Math.max(0, 10 * 60 - elapsedSeconds));
  }, [match?.id]);

  // 10-minute official report grace period timer
  useEffect(() => {
    if (!match) return;
    const interval = setInterval(() => {
      const calledTime = match.calledAt || Date.now();
      const elapsedSeconds = Math.floor((Date.now() - calledTime) / 1000);
      setReportTimeLeft(Math.max(0, 10 * 60 - elapsedSeconds));
    }, 1000);
    return () => clearInterval(interval);
  }, [match?.calledAt]);

  // 25-second auto-dismiss countdown
  useEffect(() => {
    if (!match || isPaused) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [match, isPaused, onDismiss]);

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));
  const p1 = match?.player1Id ? playerMap[match.player1Id] : null;
  const p2 = match?.player2Id ? playerMap[match.player2Id] : null;

  const handleReplayVoice = () => {
    if (!match) return;
    playTournamentChime(0.4);
    speakMatchCall(
      p1?.tag || 'Player 1',
      p2?.tag || 'Player 2',
      match.stationId || 1,
      theme.displayName
    );
  };

  const handleCopyCallout = () => {
    if (!match) return;
    const text = `📢 [${theme.displayName}] ${p1?.tag || 'TBD'} vs ${p2?.tag || 'TBD'} called to STATION ${match.stationId || 'TBD'} (${match.roundName}) — 10 min to report!`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const reportMins = Math.floor(reportTimeLeft / 60);
  const reportSecs = reportTimeLeft % 60;
  const isUrgent = reportTimeLeft < 120; // Under 2 mins

  return (
    <AnimatePresence>
      {match && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none overflow-y-auto"
          style={{ backdropFilter: 'blur(16px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Dynamic Dark Arena Backdrop */}
          <div
            className="absolute inset-0 transition-opacity"
            style={{
              background: `radial-gradient(circle at 50% 30%, ${theme.bgFrom}ee 0%, rgba(2, 6, 18, 0.96) 80%)`,
            }}
            onClick={onDismiss}
          />

          {/* Cyber Scanline & Arena Grid Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, ${theme.primaryColor}25 1px, transparent 1px),
                linear-gradient(to bottom, ${theme.primaryColor}25 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
            }}
          />

          {/* Ambient Lighting Cones */}
          <div
            className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-30"
            style={{ background: theme.primaryColor }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-30"
            style={{ background: theme.secondaryColor }}
          />

          {/* Main Cinematic Broadcast Card */}
          <motion.div
            className="relative z-10 w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            initial={{ scale: 0.85, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            style={{
              background: 'linear-gradient(175deg, rgba(13, 20, 36, 0.95) 0%, rgba(5, 9, 18, 0.98) 100%)',
              border: `1.5px solid ${theme.primaryColor}70`,
              boxShadow: `0 0 70px ${theme.glowColor}, inset 0 1px 1px ${theme.primaryColor}60`,
            }}
          >
            {/* Top Multi-Color Neon Power Rail */}
            <div
              className="h-1.5 w-full relative overflow-hidden"
              style={{
                background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor}, #FFD600, ${theme.primaryColor})`,
              }}
            >
              <motion.div
                className="absolute inset-0 bg-white/40"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
              />
            </div>

            {/* Header: Tournament Context & Quick Controls */}
            <div
              className="px-6 py-4 flex items-center justify-between border-b relative"
              style={{
                borderColor: `${theme.primaryColor}30`,
                background: 'rgba(0, 0, 0, 0.4)',
              }}
            >
              {/* Left: Tournament Phase & Game Badge */}
              <div className="flex items-center gap-3">
                <span
                  className="px-2.5 py-1 rounded text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 shadow-sm"
                  style={{
                    background: `${theme.primaryColor}20`,
                    border: `1px solid ${theme.primaryColor}50`,
                    color: theme.primaryColor,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  <Radio size={12} className="animate-pulse" />
                  {theme.displayName}
                </span>

                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                  <span className="opacity-40 font-mono">/</span>
                  <span className="font-semibold tracking-wide uppercase">{match.roundName}</span>
                  {match.pool && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-slate-300">
                      POOL {match.pool}
                    </span>
                  )}
                  <span className="opacity-40 font-mono">/</span>
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">BEST OF {match.bestOf}</span>
                </div>
              </div>

              {/* Right: Sound & Presentation Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReplayVoice}
                  title="Play Voice Callout Announcement"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all hover:brightness-125"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#00E5FF',
                  }}
                >
                  <Volume2 size={13} />
                  <span className="hidden sm:inline">ANNOUNCE</span>
                </button>

                <button
                  onClick={() => setIsMuted(prev => !prev)}
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                  className="p-1.5 rounded transition-colors text-slate-400 hover:text-white hover:bg-white/10"
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>

                <button
                  onClick={handleCopyCallout}
                  title="Copy Match Callout Link/Text"
                  className="p-1.5 rounded transition-colors text-slate-400 hover:text-white hover:bg-white/10"
                >
                  {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                </button>

                <button
                  onClick={toggleFullscreen}
                  title="Toggle Fullscreen Venue Mode"
                  className="p-1.5 rounded transition-colors text-slate-400 hover:text-white hover:bg-white/10"
                >
                  {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>

                <button
                  onClick={onDismiss}
                  title="Close Overlay"
                  className="p-1.5 rounded transition-colors text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Announcement Banner Title */}
            <div className="text-center pt-5 pb-3 px-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-widest uppercase mb-2 bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <AlertTriangle size={13} className="animate-bounce" />
                OFFICIAL MATCH CALL · REPORT TO STATION IMMEDIATELY
              </div>

              <motion.h1
                className="text-4xl sm:text-5xl font-extrabold tracking-wider"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: '#FFFFFF',
                  textShadow: `0 0 35px ${theme.primaryColor}`,
                }}
                animate={{
                  textShadow: [
                    `0 0 20px ${theme.primaryColor}`,
                    `0 0 40px ${theme.primaryColor}, 0 0 60px ${theme.secondaryColor}`,
                    `0 0 20px ${theme.primaryColor}`,
                  ],
                }}
                transition={{ repeat: Infinity, duration: 2.5 }}
              >
                MATCH CALLED
              </motion.h1>
            </div>

            {/* Clashing Versus Arena Display */}
            <div className="px-6 py-4 sm:py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 relative">
                {/* Player 1 Card (Left / Primary Color) */}
                <PlayerFighterCard
                  player={p1}
                  side="left"
                  color={theme.primaryColor}
                  score={match.player1Score}
                />

                {/* Center: Neon VS Shield & FIST BUMP (Swapped in place of swords!) */}
                <div className="shrink-0 flex flex-col items-center justify-center relative my-2 md:my-0 z-10">
                  <motion.div
                    className="text-4xl sm:text-5xl font-black italic tracking-tighter"
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      color: theme.secondaryColor,
                      textShadow: `0 0 25px ${theme.secondaryColor}`,
                    }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  >
                    VS
                  </motion.div>

                  {/* Animated Fist Bump Icon with energetic collision spark */}
                  <div className="mt-1 flex flex-col items-center">
                    <FistBumpIcon
                      size={36}
                      leftColor={theme.primaryColor}
                      rightColor={theme.secondaryColor}
                      sparkColor="#FFD600"
                      animated={true}
                    />
                    <span
                      className="text-[10px] font-mono tracking-widest font-semibold mt-1 uppercase opacity-60"
                      style={{ color: '#FFD600' }}
                    >
                      READY TO BATTLE
                    </span>
                  </div>
                </div>

                {/* Player 2 Card (Right / Secondary Color) */}
                <PlayerFighterCard
                  player={p2}
                  side="right"
                  color={theme.secondaryColor}
                  score={match.player2Score}
                />
              </div>
            </div>

            {/* Giant Glowing Station Beacon Plate */}
            <div className="px-6 py-3">
              <div
                className="rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, rgba(255, 0, 110, 0.08) 100%)',
                  border: `1.5px solid ${theme.primaryColor}40`,
                  boxShadow: `0 0 30px ${theme.glowColor}, inset 0 0 20px rgba(0,0,0,0.5)`,
                }}
              >
                {/* Station Location Callout */}
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shrink-0 relative"
                    style={{
                      background: `radial-gradient(circle, ${theme.primaryColor}30 0%, ${theme.primaryColor}10 100%)`,
                      border: `2px solid ${theme.primaryColor}`,
                      boxShadow: `0 0 20px ${theme.primaryColor}60`,
                    }}
                  >
                    <MapPin size={28} style={{ color: theme.primaryColor }} />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ background: theme.primaryColor }}
                      />
                      <span
                        className="relative inline-flex rounded-full h-3 w-3"
                        style={{ background: theme.primaryColor }}
                      />
                    </span>
                  </div>

                  <div>
                    <div
                      className="text-xs font-mono font-bold tracking-[0.25em] uppercase opacity-75"
                      style={{ color: theme.primaryColor }}
                    >
                      REPORT DIRECTLY TO
                    </div>
                    <div
                      className="text-3xl sm:text-4xl font-extrabold tracking-wider leading-tight flex items-baseline gap-2"
                      style={{
                        fontFamily: 'Rajdhani, sans-serif',
                        color: '#FFFFFF',
                        textShadow: `0 0 20px ${theme.primaryColor}`,
                      }}
                    >
                      STATION {match.stationId ?? 'TBD'}
                      {match.streamUrl && (
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                          LIVE STREAM SETUP
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-sans mt-0.5">
                      Tournament Arena Setup #{match.stationId ?? 1} · Referees on standby
                    </div>
                  </div>
                </div>

                {/* 10-Minute Official Rule Countdown Meter */}
                <div className="flex items-center gap-5 sm:border-l sm:pl-6 border-white/10">
                  <div className="text-center sm:text-right">
                    <div className="text-[11px] font-mono tracking-widest uppercase opacity-60 flex items-center gap-1 justify-center sm:justify-end">
                      <Clock size={11} /> 10-MIN GRACE CLOCK
                    </div>
                    <div
                      className={`text-2xl sm:text-3xl font-mono font-bold tabular-nums tracking-wider ${
                        isUrgent ? 'text-rose-400 animate-pulse' : 'text-amber-300'
                      }`}
                      style={{ textShadow: isUrgent ? '0 0 15px rgba(244,63,94,0.7)' : '0 0 10px rgba(252,211,77,0.4)' }}
                    >
                      {reportMins.toString().padStart(2, '0')}:{reportSecs.toString().padStart(2, '0')}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {isUrgent ? '⚠️ FORFEIT WARNING' : 'TIME TO REPORT'}
                    </div>
                  </div>

                  {/* SMS Dispatch Verification Badge */}
                  <div className="hidden lg:flex flex-col items-end text-xs font-mono gap-1 text-slate-300">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                      <Wifi size={12} className="animate-pulse" />
                      <span>SMS DISPATCHED</span>
                    </div>
                    <span className="text-[10px] opacity-40">2/2 Players Alerted</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div
              className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
              style={{
                borderColor: `${theme.primaryColor}20`,
                background: 'rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Auto-Dismiss Notice with Progress Ring */}
              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                <div className="relative w-8 h-8">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke={theme.primaryColor}
                      strokeWidth="3"
                      strokeDasharray={`${(countdown / 25) * 94.2} 94.2`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 1s linear' }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                    {countdown}
                  </span>
                </div>
                <div>
                  <div className="text-slate-300 font-medium">
                    {isPaused ? 'Auto-dismiss paused' : `Auto-dismissing in ${countdown}s`}
                  </div>
                  <div className="text-[10px] opacity-50">Hover to pause · Press Esc to close</div>
                </div>
              </div>

              {/* Tournament Organizer Interactive Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={onDismiss}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-colors hover:bg-white/10"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'var(--foreground)',
                  }}
                >
                  KEEP CALLED & CLOSE
                </button>

                {onStartMatch && (
                  <button
                    onClick={() => onStartMatch(match)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-mono font-bold tracking-wider text-black shadow-lg transition-transform active:scale-95"
                    style={{
                      background: `linear-gradient(90deg, #00FF88, ${theme.primaryColor})`,
                      boxShadow: '0 0 20px rgba(0, 255, 136, 0.4)',
                    }}
                  >
                    <Play size={13} fill="currentColor" />
                    PLAYERS ARRIVED · START MATCH
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Premium Fighter Card for the versus display
 */
function PlayerFighterCard({
  player,
  side,
  color,
  score,
}: {
  player: Player | null;
  side: 'left' | 'right';
  color: string;
  score?: number;
}) {
  if (!player) {
    return (
      <div
        className="flex-1 w-full rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-[140px]"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed rgba(255, 255, 255, 0.15)',
        }}
      >
        <span className="text-sm font-mono text-slate-500 uppercase tracking-widest">Waiting for Qualifier (TBD)</span>
      </div>
    );
  }

  // Parse sponsor/team prefix if present (e.g., "DRX | KNEE" or "FAV | KNEE")
  const parts = player.tag.split('|');
  const team = parts.length > 1 ? parts[0].trim() : null;
  const cleanTag = parts.length > 1 ? parts.slice(1).join('|').trim() : player.tag;

  return (
    <motion.div
      className="flex-1 w-full rounded-xl p-5 relative overflow-hidden flex flex-col justify-between"
      style={{
        background: `linear-gradient(${side === 'left' ? '135deg' : '225deg'}, ${color}15 0%, rgba(10, 16, 28, 0.85) 100%)`,
        border: `1.5px solid ${color}50`,
        boxShadow: `0 0 25px ${color}20`,
      }}
      initial={{ x: side === 'left' ? -30 : 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.15, type: 'spring', damping: 20 }}
    >
      {/* Dynamic Background Watermark / Accent Glow */}
      <div
        className={`absolute -bottom-10 ${side === 'left' ? '-left-10' : '-right-10'} w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-20`}
        style={{ background: color }}
      />

      {/* Top Details: Flag, Country & Seed Badge */}
      <div className={`flex items-center justify-between mb-3 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl drop-shadow-md">{player.countryFlag || '🌐'}</span>
          <span className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
            {player.country || 'INT'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-mono font-bold px-2 py-0.5 rounded shadow-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: color,
            }}
          >
            SEED #{player.seed}
          </span>
        </div>
      </div>

      {/* Fighter Gamer Tag */}
      <div className={`flex flex-col mb-3 ${side === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
        {team && (
          <span
            className="text-xs font-mono font-bold tracking-widest uppercase opacity-80"
            style={{ color: color }}
          >
            {team}
          </span>
        )}
        <div
          className="text-2xl sm:text-3xl font-black tracking-wider leading-none truncate max-w-full"
          style={{
            fontFamily: 'Rajdhani, sans-serif',
            color: '#FFFFFF',
            textShadow: `0 0 15px ${color}80`,
          }}
          title={player.tag}
        >
          {cleanTag}
        </div>
        {player.realName && (
          <div className="text-xs text-slate-400 font-sans tracking-wide mt-0.5">
            {player.realName}
          </div>
        )}
      </div>

      {/* Bottom Sub-row: Character & Check-in Badge */}
      <div
        className={`pt-3 border-t flex items-center justify-between gap-2 text-xs ${
          side === 'right' ? 'flex-row-reverse' : ''
        }`}
        style={{ borderColor: `${color}25` }}
      >
        {/* Character Pick */}
        <div className="flex items-center gap-1.5 font-sans font-medium text-slate-200">
          <Shield size={13} style={{ color }} />
          <span className="font-semibold">{player.character || 'Fighter'}</span>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>CHECKED IN</span>
        </div>
      </div>
    </motion.div>
  );
}
