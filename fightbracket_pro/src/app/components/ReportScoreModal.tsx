import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { BracketMatch, Player, GameTheme } from '../data/tournamentData';

interface ReportScoreModalProps {
  match: BracketMatch;
  players: Record<string, Player>;
  theme: GameTheme;
  onConfirm: (matchId: string, p1Score: number, p2Score: number, winnerId: string | null) => void;
  onCancel: () => void;
}

export function ReportScoreModal({ match, players, theme, onConfirm, onCancel }: ReportScoreModalProps) {
  const [p1Score, setP1Score] = useState(match.player1Score || 0);
  const [p2Score, setP2Score] = useState(match.player2Score || 0);
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  
  const p1 = match.player1Id ? players[match.player1Id] : null;
  const p2 = match.player2Id ? players[match.player2Id] : null;
  
  const isP1Winner = p1Score > p2Score;
  const isP2Winner = p2Score > p1Score;
  const defaultWinnerId = isP1Winner ? p1?.id : (isP2Winner ? p2?.id : null);
  const [winnerId, setWinnerId] = useState<string | null>(defaultWinnerId);

  // Update default winner when scores change
  React.useEffect(() => {
    setWinnerId(isP1Winner ? p1?.id || null : (isP2Winner ? p2?.id || null : null));
  }, [p1Score, p2Score, p1?.id, p2?.id, isP1Winner, isP2Winner]);

  if (!p1 || !p2) return null;

  const handleNext = () => {
    if (p1Score === p2Score && !winnerId) {
      alert("Please select a winner or ensure one score is higher.");
      return;
    }
    setStep('confirm');
  };

  const handleConfirm = () => {
    onConfirm(match.id, p1Score, p2Score, winnerId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-xl shadow-2xl border flex flex-col overflow-hidden bg-[#050A14]"
        style={{ borderColor: `${theme.primaryColor}50` }}
      >
        <div 
          className="px-6 py-4 border-b flex justify-between items-center"
          style={{ borderColor: 'rgba(255,255,255,0.1)', background: `${theme.primaryColor}10` }}
        >
          <div>
            <h3 className="text-xl font-bold tracking-widest" style={{ fontFamily: 'Rajdhani, sans-serif', color: theme.primaryColor }}>
              REPORT SCORE
            </h3>
            <p className="text-xs opacity-60 font-mono mt-1">
              {match.roundName} {match.identifier ? `· Match ${match.identifier}` : ''} · BO{match.bestOf}
            </p>
          </div>
          <button onClick={onCancel} className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 'input' ? (
            <div className="space-y-6">
              {/* Player 1 Row */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-xs opacity-50 font-mono">{p1.seed}</span>
                  <span className="text-lg font-bold font-rajdhani">{p1.tag}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setP1Score(Math.max(0, p1Score - 1))} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded hover:bg-white/20 font-mono text-xl">-</button>
                  <span className="text-2xl font-bold font-mono w-6 text-center">{p1Score}</span>
                  <button onClick={() => setP1Score(p1Score + 1)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded hover:bg-white/20 font-mono text-xl">+</button>
                </div>
              </div>

              {/* Player 2 Row */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-xs opacity-50 font-mono">{p2.seed}</span>
                  <span className="text-lg font-bold font-rajdhani">{p2.tag}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setP2Score(Math.max(0, p2Score - 1))} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded hover:bg-white/20 font-mono text-xl">-</button>
                  <span className="text-2xl font-bold font-mono w-6 text-center">{p2Score}</span>
                  <button onClick={() => setP2Score(p2Score + 1)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded hover:bg-white/20 font-mono text-xl">+</button>
                </div>
              </div>

              {/* Winner Override */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <label className="text-xs font-mono opacity-60">WINNER (AUTO-DETECTED FROM SCORE)</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setWinnerId(p1.id)}
                    className={`flex-1 py-2 rounded text-sm font-bold font-rajdhani transition-colors border ${winnerId === p1.id ? 'bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]/50' : 'bg-white/5 border-white/10 text-white'}`}
                  >
                    {p1.tag}
                  </button>
                  <button 
                    onClick={() => setWinnerId(p2.id)}
                    className={`flex-1 py-2 rounded text-sm font-bold font-rajdhani transition-colors border ${winnerId === p2.id ? 'bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]/50' : 'bg-white/5 border-white/10 text-white'}`}
                  >
                    {p2.tag}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={onCancel}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded font-bold font-rajdhani tracking-widest transition-colors text-white"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleNext}
                  className="flex-1 py-3 rounded font-bold font-rajdhani tracking-widest transition-colors text-black"
                  style={{ background: theme.primaryColor }}
                >
                  NEXT
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-center py-4">
              <div className="flex justify-center mb-2">
                <CheckCircle2 size={48} className="text-[#00FF88] opacity-80" />
              </div>
              <h4 className="text-2xl font-bold font-rajdhani text-white">CONFIRM SCORE</h4>
              
              <div className="flex items-center justify-center gap-6 py-4">
                <div className="text-center">
                  <div className="text-sm opacity-60 font-mono mb-1">{p1.tag}</div>
                  <div className="text-4xl font-bold font-rajdhani" style={{ color: winnerId === p1.id ? '#00FF88' : 'white' }}>{p1Score}</div>
                </div>
                <div className="text-xl opacity-30 font-mono">-</div>
                <div className="text-center">
                  <div className="text-sm opacity-60 font-mono mb-1">{p2.tag}</div>
                  <div className="text-4xl font-bold font-rajdhani" style={{ color: winnerId === p2.id ? '#00FF88' : 'white' }}>{p2Score}</div>
                </div>
              </div>

              <p className="text-sm font-mono opacity-80 text-[#FFD600]">
                This will complete the match and advance {winnerId === p1.id ? p1.tag : p2.tag}.
              </p>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setStep('input')}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded font-bold font-rajdhani tracking-widest transition-colors text-white"
                >
                  BACK
                </button>
                <button 
                  onClick={handleConfirm}
                  className="flex-1 py-3 rounded font-bold font-rajdhani tracking-widest transition-colors text-black bg-[#00FF88] hover:brightness-110"
                >
                  CONFIRM & SUBMIT
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
