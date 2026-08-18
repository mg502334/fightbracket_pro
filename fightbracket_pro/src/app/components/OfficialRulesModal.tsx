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
    { title: 'Match Settings', content: '99 Seconds, First to 2 Rounds (Best-of-3 rounds) per Battle. Played through in-game Versus menu. Sound/Voice: English.' },
    { title: 'Set Format', content: 'Player Matches 1 & 2: Best-of-3 Battles. Player Match 3: Best-of-5 Battles. Playoffs use a points-based format (First to 50 in QF/SF; First to 70 in Grand Final).' },
    { title: 'Character Selection', content: 'The player who LOST the previous Battle may change character AND control type. The player who WON must keep the same character and control type.' },
    { title: 'Control Type', content: 'Both Classic and Modern control types are completely legal and permitted.' },
    { title: 'Stage Selection', content: 'Stages are determined by the Organizer or Tournament Organizer. Players do not independently select stages.' },
    { title: 'Bugs & Glitches', content: 'Using any known bug or glitch to gain an unfair advantage is prohibited, even if not specifically listed. Organizer determines at sole discretion if a bug was used intentionally.' },
    { title: 'Disconnections', content: 'Involuntary disconnections allow the Organizer to restart the game, return to pre-issue state, or designate a winner. A player who voluntarily interrupts a round forfeits that round.' },
    { title: 'Pauses', content: 'Players may not pause a game in progress. If hardware fails mid-match, the player must forfeit the current round to stop play and request a replacement controller (must be obtained within 5 minutes).' },
    { title: 'Double KO', content: 'In the event of a Double KO, the battle is replayed with no round results carried over.' },
    { title: 'Coaching', content: 'No communication with any third party (including coaches) is allowed during a Player Match in progress. Breaks: 30 sec between battles, 1 min between Player Matches, 5 min between Team Matches.' },
    { title: 'Controllers', content: 'Macros, turbo functions, and disallowed compound inputs are prohibited. A max of 11 attacking action inputs are allowed. Organizer may inspect controllers at any time. Keyboards are only allowed on Steam (must be paired with a controller).' },
  ],
  'ggst': [
    { title: 'Match Settings', content: '99 Seconds, First to 2 Rounds per Game. Played on PlayStation 5.' },
    { title: 'Set Format', content: 'Best-of-3 Games (First to 2) for standard matches. Best-of-5 (First to 3) for Winners Finals, Losers Finals, and Grand Finals.' },
    { title: 'Character Selection', content: 'The winner of the previous Game is locked into their character and may NOT switch. The loser of the previous Game may freely switch characters.' },
    { title: 'Stage / BGM', content: 'Stage is set to "Auto" by default. Both players may mutually agree to select a specific stage or background music before a game begins.' },
    { title: 'DLC Characters', content: 'Newly released DLC characters are restricted from tournament play for the first two (2) weeks following their official release.' },
    { title: 'Banned Content', content: 'Ultimate Edition colors are banned for all characters in official Arc World Tour events.' },
    { title: 'Controllers', content: 'Legacy PS3 native controllers are prohibited. Hardware-level macros, turbo functions, programmable inputs, and illegal SOCD cleaning methods are strictly forbidden.' },
    { title: 'Disconnects', content: 'A player who causes an unintentional disconnect must forfeit the current round. If the issue cannot be resolved within 5 minutes, the player responsible must forfeit the entire set.' },
  ],
  'avatarLegends': [
    { title: 'Match Settings', content: '99 Seconds, Best-of-3 Rounds per Game. Played in 1v1 Tournament Versus Mode on PC (Steam) / PS5 / Xbox Series X|S.' },
    { title: 'Set Format', content: 'Best-of-3 Games (First to 2) for standard pool matches. Best-of-5 Games (First to 3) for Top 8 matches (Winners Semis/Finals, Losers Semis/Finals, and Grand Finals).' },
    { title: 'Character & Assist Selection', content: 'Blind pick is available upon request for Game 1. The winner of the previous game is locked into their character and support assist. The loser of the previous game may switch character and/or support assist.' },
    { title: 'Stage Selection', content: 'Game 1 must be played on Random stage selection or a mutually agreed neutral Four Nations arena. The loser of the prior game may pick any legal stage or request Random.' },
    { title: 'Flow & Energy Mechanics', content: 'All standard in-game elemental bending mechanics, Flow states, and Energy Points systems are active as per latest official balance patch.' },
    { title: 'Banned Content & Exploits', content: 'Any game-freezing bugs or unrecoverable infinite loop exploits are prohibited. Newly released post-launch seasonal characters are restricted for 14 days following release.' },
    { title: 'Controllers & Pauses', content: 'All standard tournament-legal controllers/fightsticks/hitboxes are permitted. Hardware macros and rapid-fire turbos are strictly banned. Accidental pauses forfeit the current round.' },
    { title: 'Coaching', content: 'Coaching is permitted only between games for a maximum duration of 60 seconds. Mid-match coaching is strictly forbidden.' },
  ],
};

const GAME_NAMES = {
  'tekken8': 'Tekken 8 (TWT Rules)',
  'sf6': 'Street Fighter 6 (SFL)',
  'ggst': 'Guilty Gear -Strive- (AWT)',
  'avatarLegends': 'Avatar Legends: The Fighting Game',
};

const GAME_LINKS: Record<string, string> = {
  'tekken8': 'https://www.bandainamcoent.com/legal/community-events/official-rules-twt',
  'sf6': 'https://www.streetfighterleague.com/official-rules/',
  'ggst': 'https://www.arcsystemworks.jp/awt2024/',
  'avatarLegends': 'https://www.paramountgames.com/games/avatar-legends-the-fighting-game',
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
