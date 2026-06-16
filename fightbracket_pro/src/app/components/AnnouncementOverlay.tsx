import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Swords, MapPin, Wifi } from "lucide-react";
import type { BracketMatch, Player, GameTheme } from "../data/tournamentData";

interface AnnouncementOverlayProps {
  match: BracketMatch | null;
  players: Player[];
  theme: GameTheme;
  onDismiss: () => void;
}

export function AnnouncementOverlay({ match, players, theme, onDismiss }: AnnouncementOverlayProps) {
  const [countdown, setCountdown] = useState(20);

  useEffect(() => {
    if (!match) return;
    setCountdown(20);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { onDismiss(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [match]);

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));
  const p1 = match?.player1Id ? playerMap[match.player1Id] : null;
  const p2 = match?.player2Id ? playerMap[match.player2Id] : null;

  return (
    <AnimatePresence>
      {match && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Dark overlay */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(2, 5, 12, 0.92)' }}
            onClick={onDismiss}
          />

          {/* Grid scan lines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(${theme.primaryColor}20 1px, transparent 1px),
                linear-gradient(90deg, ${theme.primaryColor}20 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Main announcement card */}
          <motion.div
            className="relative z-10 w-full max-w-2xl mx-6"
            initial={{ scale: 0.7, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Glow behind card */}
            <div
              className="absolute inset-0 rounded-xl blur-2xl opacity-30 scale-105"
              style={{ background: theme.primaryColor }}
            />

            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, #0A1428 0%, #050A14 100%)',
                border: `1px solid ${theme.primaryColor}60`,
                boxShadow: `0 0 60px ${theme.glowColor}, inset 0 1px 0 ${theme.primaryColor}30`,
              }}
            >
              {/* Top accent bar */}
              <div
                className="h-1 w-full"
                style={{ background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor}, ${theme.primaryColor})` }}
              />

              {/* Header */}
              <div className="px-8 pt-6 pb-4 text-center border-b" style={{ borderColor: `${theme.primaryColor}20` }}>
                <div
                  className="text-xs tracking-[0.4em] mb-2 opacity-70"
                  style={{ fontFamily: 'JetBrains Mono, monospace', color: theme.primaryColor }}
                >
                  {theme.displayName} · {match.roundName}
                </div>
                <motion.div
                  className="text-5xl tracking-widest"
                  style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: theme.primaryColor, textShadow: `0 0 30px ${theme.primaryColor}` }}
                  animate={{ textShadow: [`0 0 20px ${theme.primaryColor}`, `0 0 40px ${theme.primaryColor}`, `0 0 20px ${theme.primaryColor}`] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  MATCH CALLED
                </motion.div>
              </div>

              {/* Players VS display */}
              <div className="px-8 py-8">
                <div className="flex items-center gap-4">
                  {/* Player 1 */}
                  <PlayerCard player={p1} side="left" theme={theme} />

                  {/* VS */}
                  <div className="shrink-0 text-center">
                    <motion.div
                      className="text-4xl"
                      style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: theme.secondaryColor }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      VS
                    </motion.div>
                    <Swords size={20} className="mx-auto mt-1 opacity-50" style={{ color: theme.secondaryColor }} />
                  </div>

                  {/* Player 2 */}
                  <PlayerCard player={p2} side="right" theme={theme} />
                </div>
              </div>

              {/* Station & instructions */}
              <div
                className="px-8 py-5 border-t flex items-center justify-between"
                style={{ background: `${theme.primaryColor}08`, borderColor: `${theme.primaryColor}20` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center"
                    style={{ background: `${theme.primaryColor}20`, border: `1px solid ${theme.primaryColor}40` }}
                  >
                    <MapPin size={18} style={{ color: theme.primaryColor }} />
                  </div>
                  <div>
                    <div className="text-xs opacity-50 tracking-widest mb-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>REPORT TO</div>
                    <div
                      className="text-xl tracking-wider"
                      style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--foreground)' }}
                    >
                      STATION {match.stationId}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs opacity-50" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    <Wifi size={12} />
                    SMS SENT
                  </div>

                  {/* Countdown ring */}
                  <div className="relative w-12 h-12">
                    <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
                      <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(122,158,192,0.1)" strokeWidth="3" />
                      <circle
                        cx="20" cy="20" r="17" fill="none"
                        stroke={theme.primaryColor} strokeWidth="3"
                        strokeDasharray={`${(countdown / 20) * 107} 107`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 1s linear', filter: `drop-shadow(0 0 4px ${theme.primaryColor})` }}
                      />
                    </svg>
                    <span
                      className="absolute inset-0 flex items-center justify-center text-sm"
                      style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: theme.primaryColor }}
                    >
                      {countdown}
                    </span>
                  </div>

                  <button
                    onClick={onDismiss}
                    className="flex items-center gap-1.5 px-4 py-2 rounded text-xs tracking-widest transition-all hover:opacity-80"
                    style={{
                      background: `${theme.primaryColor}20`,
                      border: `1px solid ${theme.primaryColor}40`,
                      color: theme.primaryColor,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    <X size={12} />
                    DISMISS
                  </button>
                </div>
              </div>

              {/* Bottom accent */}
              <div
                className="h-0.5 w-full"
                style={{ background: `linear-gradient(90deg, transparent, ${theme.primaryColor}40, transparent)` }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PlayerCard({ player, side, theme }: { player: Player | null; side: 'left' | 'right'; theme: GameTheme }) {
  if (!player) {
    return (
      <div className="flex-1 rounded p-4 text-center" style={{ background: 'var(--border)', border: '1px dashed rgba(122,158,192,0.2)' }}>
        <span className="text-sm opacity-30" style={{ fontFamily: 'JetBrains Mono, monospace' }}>TBD</span>
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 rounded p-4"
      style={{ background: `${theme.primaryColor}08`, border: `1px solid ${theme.primaryColor}25` }}
      initial={{ x: side === 'left' ? -40 : 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: 'spring', damping: 20 }}
    >
      <div className={`flex flex-col ${side === 'right' ? 'items-end' : 'items-start'}`}>
        <div className="text-2xl mb-1">{player.countryFlag}</div>
        <div
          className="text-2xl leading-none mb-1"
          style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: theme.primaryColor }}
        >
          {player.tag}
        </div>
        <div className="text-xs opacity-50" style={{ fontFamily: 'Inter, sans-serif' }}>
          {player.character}
        </div>
        <div
          className="text-xs mt-2 px-2 py-0.5 rounded"
          style={{
            background: 'var(--border)',
            color: 'var(--muted-foreground)',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          SEED #{player.seed}
        </div>
      </div>
    </motion.div>
  );
}
