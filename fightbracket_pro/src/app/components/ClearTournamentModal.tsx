import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Save, Trash2, X, FileText, CheckCircle2 } from 'lucide-react';
import type { GameTheme } from '../data/tournamentData';

interface ClearTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentName: string;
  gameDisplayName: string;
  playerCount: number;
  matchCount: number;
  onConfirmClear: () => void;
  onSaveDraft: () => void;
  onSaveDraftAndClear: () => void;
  theme?: GameTheme | null;
}

export function ClearTournamentModal({
  isOpen,
  onClose,
  tournamentName,
  gameDisplayName,
  playerCount,
  matchCount,
  onConfirmClear,
  onSaveDraft,
  onSaveDraftAndClear,
  theme,
}: ClearTournamentModalProps) {
  if (!isOpen) return null;

  const primary = theme?.primaryColor || '#00E5FF';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl flex flex-col font-mono shadow-2xl"
          style={{ background: '#070D18', border: '1px solid rgba(255, 23, 68, 0.4)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-widest text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  CLEAR LOCAL TOURNAMENT
                </h2>
                <p className="text-[11px] text-gray-400">Confirm tournament reset or preserve your progress</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 opacity-60 hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Tournament Summary</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px]">EVENT</span>
                  <span className="text-white font-bold truncate block">{tournamentName || 'Local Event'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">TITLE</span>
                  <span className="text-white font-bold truncate block">{gameDisplayName || 'Default'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">REGISTERED COMPETITORS</span>
                  <span className="text-cyan-400 font-bold">{playerCount} players</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">BRACKET MATCHES</span>
                  <span className="text-amber-400 font-bold">{matchCount} matches</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Clearing this tournament will reset the active bracket and competitor roster. You can save a draft to restore this exact tournament setup later, or clear it permanently.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={onSaveDraftAndClear}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                style={{
                  background: primary,
                  color: '#050A14',
                  boxShadow: `0 0 15px ${primary}40`,
                }}
              >
                <Save size={15} />
                <span>Save Draft & Clear Tournament</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onSaveDraft}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/15 text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <FileText size={14} className="text-cyan-400" />
                  <span>Save Draft Only</span>
                </button>

                <button
                  type="button"
                  onClick={onConfirmClear}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Clear (Don't Save)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-center text-xs text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-wider font-mono mt-1"
              >
                Cancel and Keep Tournament
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
