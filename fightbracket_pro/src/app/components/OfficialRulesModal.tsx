import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, Gavel, Gamepad2, AlertTriangle, BookOpen, ChevronDown, ExternalLink } from 'lucide-react';

interface OfficialRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: any;
}

const GLOBAL_RULES = [
  {
    title: 'Double Elimination Format',
    content: 'Tournaments run in a standard double-elimination bracket. Players who lose a set are moved to the Losers Bracket. A second loss eliminates them from the tournament.',
  },
  {
    title: 'Hardware & Controller Desync',
    content: 'Players must bring their own controllers. Wireless controllers must be completely desynced and disconnected from the console after every match. Failing to do so, resulting in a pause during another match, may lead to disqualification.',
  },
  {
    title: 'Pauses & Disconnects',
    content: 'Any player who accidentally pauses the game or disconnects their controller will forfeit the current round (not the entire game). If a hardware malfunction happens on the setup itself, players must notify a TO immediately to restart the match.',
  },
  {
    title: 'Tardiness & DQ Timers',
    content: 'Players have 10 minutes to report to their station after their match has been called. If a player fails to appear within this time limit, they will forfeit the match.',
  },
  {
    title: 'Coaching & Electronic Devices',
    content: 'Mid-match coaching is strictly prohibited. Players may receive coaching between games within a set, but for a maximum of 1 minute. Furthermore, the use of personal electronic devices (cellular phones, computers, tablets, smart watches, etc.) during a Match is strictly prohibited.',
  },
];

const GAME_RULES: Record<string, { title: string; content: string }[]> = {
  'tekken8': [
    { title: 'Match Settings', content: '60 Seconds, First to 3 Rounds (Best-of-5 rounds) per Game. Character Customizations: Off. (Preset costumes are legal; players cannot use the same Preset).' },
    { title: 'Set Format', content: 'Best-of-3 Games (First to 2) for standard matches. Top 8 or Top 4 matches (including Grand Finals) are Best-of-5 (First to 3).' },
    { title: 'Stage Selection', content: 'Game 1 must be played on a Random stage. For subsequent games, the loser may choose a new Random stage OR change their character and get a new Random stage.' },
    { title: 'Character Selection', content: 'Blind pick is available upon request for Game 1. The winner of the previous Game must keep the same character and cannot switch.' },
    { title: 'Special Style', content: 'The use of Special Style is permitted in all official matches.' },
    { title: 'Draws (Ties)', content: 'In the event of a tied Game declared by a Double K.O. or timeout, the Game will not be scored and both players will replay the tied Game with the same characters.' },
    { title: 'Match Disruptions', content: 'Accidental pauses or controller disconnects result in forfeiting the current round (not the set), unless the pause occurs during an "Inevitable Defeat" animation. Setup malfunctions warrant a round-count restart.' },
    { title: 'Coaching', content: 'Coaching is only allowed for the player that lost the previous Game. A player may consult a coach for a maximum of 1 minute, and only one (1) time per Match.' },
  ],
  'sf6': [
    { title: 'Match Settings', content: '99 Seconds, Best of 3 Rounds per game.' },
    { title: 'Set Format', content: 'Best-of-3 (First to 2) for standard matches. Best-of-5 (First to 3) for Top 8.' },
    { title: 'Stage Selection', content: 'Game 1 must be Random stage (or Training Room if both agree). The loser of the previous game may change stage or character (but not both).' },
    { title: 'Control Type', content: 'Both Classic and Modern control types are completely legal and permitted.' },
  ],
  'ggst': [
    { title: 'Match Settings', content: '99 Seconds, Best of 3 Rounds per game.' },
    { title: 'Set Format', content: 'Best-of-5 (First to 3) for ALL matches in the tournament.' },
    { title: 'Stage Selection', content: 'Stages must be selected on Random or set to Council of Three. Stages with significant visual clutter or lag issues may be banned by the TO.' },
    { title: 'Character Selection', content: 'The winner of the previous game must keep the same character.' },
  ],
};

const GAME_NAMES = {
  'tekken8': 'Tekken 8 (TWT Rules)',
  'sf6': 'Street Fighter 6',
  'ggst': 'Guilty Gear -Strive-',
};

const GAME_LINKS: Record<string, string> = {
  'tekken8': 'https://www.bandainamcoent.com/legal/community-events/official-rules-twt',
};

export function OfficialRulesModal({ isOpen, onClose, theme }: OfficialRulesModalProps) {
  const [selectedGame, setSelectedGame] = useState<keyof typeof GAME_NAMES>('tekken8');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border"
          style={{
            background: 'var(--card)',
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between p-6 border-b border-white/10" style={{ background: 'var(--sidebar)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${theme.primaryColor}20`, color: theme.primaryColor }}>
                <BookOpen size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold font-rajdhani tracking-wider text-white">OFFICIAL RULES</h2>
                <p className="text-xs text-gray-400 font-mono">Standard rulesets for competitive play</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            {/* Global FGC Rules */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Gavel className="text-gray-400" size={18} />
                <h3 className="text-lg font-bold font-rajdhani tracking-wider text-white">GLOBAL FGC RULES</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                These rules apply across all games and tournaments on this platform unless otherwise specified by the Tournament Organizer (TO).
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GLOBAL_RULES.map((rule, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                    <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                      {rule.title}
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed font-mono">
                      {rule.content}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />

            {/* Game Specific Rules */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="text-gray-400" size={18} />
                  <h3 className="text-lg font-bold font-rajdhani tracking-wider text-white">GAME-SPECIFIC SETTINGS</h3>
                </div>

                {/* Game Selector Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center justify-between w-full sm:w-56 px-4 py-2 bg-black/40 border border-white/10 hover:border-white/20 rounded-xl text-sm font-bold font-rajdhani transition-colors"
                  >
                    <span>{GAME_NAMES[selectedGame]}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 top-full mt-2 w-full sm:w-56 bg-[#111] border border-white/10 rounded-xl shadow-xl overflow-hidden z-10"
                      >
                        {Object.entries(GAME_NAMES).map(([key, name]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setSelectedGame(key as keyof typeof GAME_NAMES);
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm font-rajdhani font-bold hover:bg-white/10 transition-colors ${selectedGame === key ? 'text-cyan-400 bg-cyan-400/10' : 'text-gray-300'}`}
                          >
                            {name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Game Rules Content */}
              <div className="space-y-3 relative">
                {GAME_RULES[selectedGame].map((rule, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:gap-6 p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-white/5 transition-colors">
                    <div className="w-40 shrink-0 font-bold text-sm" style={{ color: theme.primaryColor }}>
                      {rule.title}
                    </div>
                    <div className="flex-1 text-sm text-gray-300 font-mono leading-relaxed">
                      {rule.content}
                    </div>
                  </div>
                ))}
              </div>

              {GAME_LINKS[selectedGame] && (
                <div className="mt-4 text-right pr-2">
                  <a href={GAME_LINKS[selectedGame]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold font-rajdhani hover:brightness-125 transition-all" style={{ color: theme.primaryColor }}>
                    VIEW FULL OFFICIAL RULES <ExternalLink size={12} />
                  </a>
                </div>
              )}
              
              <div className="mt-6 flex items-start gap-3 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10">
                <ShieldAlert className="text-yellow-500 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-yellow-500/80 font-mono">
                  Tournament Organizers reserve the right to overrule any standard rules if unique circumstances arise. TO rulings are always final.
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
