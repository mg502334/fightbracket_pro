import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Trash2, X, ArrowRight, Clock, Users, Swords } from 'lucide-react';
import type { GameTheme, Player, BracketMatch } from '../data/tournamentData';
import type { ActiveTournament } from '../App';

export interface TournamentDraft {
  id: string;
  name: string;
  savedAt: string;
  gameId: string;
  gameDisplayName: string;
  playerCount: number;
  matchCount: number;
  players: Player[];
  matches: BracketMatch[];
  tournament: ActiveTournament | null;
  themes: Record<string, GameTheme>;
  gameOrder: string[];
}

interface DraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: TournamentDraft[];
  onLoadDraft: (draft: TournamentDraft) => void;
  onDeleteDraft: (id: string) => void;
  theme?: GameTheme | null;
}

export function DraftsModal({
  isOpen,
  onClose,
  drafts,
  onLoadDraft,
  onDeleteDraft,
  theme,
}: DraftsModalProps) {
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
          className="relative w-full max-w-xl overflow-hidden rounded-2xl flex flex-col font-mono shadow-2xl max-h-[85vh]"
          style={{ background: '#070D18', border: `1px solid ${primary}40` }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                <FileText size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-widest text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  SAVED TOURNAMENT DRAFTS
                </h2>
                <p className="text-[11px] text-gray-400">Restore or manage saved local drafts ({drafts.length})</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 opacity-60 hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drafts List */}
          <div className="p-5 overflow-y-auto flex flex-col gap-3">
            {drafts.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-center text-gray-500">
                <FileText size={32} className="opacity-30 mb-2" />
                <span className="text-sm font-bold text-gray-400">NO SAVED DRAFTS</span>
                <span className="text-xs max-w-xs">
                  When clearing a local tournament, select &quot;Save Draft&quot; to preserve it here for later retrieval.
                </span>
              </div>
            ) : (
              drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm truncate" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                        {draft.name || 'Untitled Tournament'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-400 uppercase font-mono">
                        {draft.gameDisplayName || draft.gameId}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users size={12} className="text-cyan-400" />
                        {draft.playerCount} players
                      </span>
                      <span className="flex items-center gap-1">
                        <Swords size={12} className="text-amber-400" />
                        {draft.matchCount} matches
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Clock size={11} />
                        {new Date(draft.savedAt).toLocaleDateString()} {new Date(draft.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => onLoadDraft(draft)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black uppercase transition-all shadow-md cursor-pointer hover:brightness-110"
                      style={{ background: primary }}
                    >
                      <span>LOAD</span>
                      <ArrowRight size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDraft(draft.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 transition-colors"
                      title="Delete draft"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
