import React, { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, Shield, Trophy, Radio, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';

export interface PSNTrophies {
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
}

export interface PSNPlayerCardProps {
  psnId?: string;
  avatarUrl?: string;
  trophyLevel?: number;
  onlineStatus?: 'online' | 'offline';
  playingGame?: string;
  trophies?: PSNTrophies;
  shareLink?: string;
  className?: string;
}

export function PSNPlayerCard({
  psnId = 'PlayerOne_FGC',
  avatarUrl = 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  trophyLevel = 342,
  onlineStatus = 'online',
  playingGame = 'TEKKEN 8',
  trophies = { platinum: 12, gold: 84, silver: 210, bronze: 540 },
  shareLink,
  className = ''
}: PSNPlayerCardProps) {
  const [copied, setCopied] = useState(false);
  const [liveData, setLiveData] = useState<{
    psnId: string;
    avatarUrl: string;
    trophyLevel: number;
    onlineStatus: 'online' | 'offline';
    playingGame: string;
    trophies: PSNTrophies;
  }>({
    psnId,
    avatarUrl,
    trophyLevel,
    onlineStatus,
    playingGame,
    trophies
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (psnId && psnId !== 'PlayerOne_FGC') {
      setLoading(true);
      fetch(`/api/psn/${encodeURIComponent(psnId)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.psnId) {
            setLiveData({
              psnId: data.psnId || psnId,
              avatarUrl: data.avatarUrl || avatarUrl,
              trophyLevel: data.trophyLevel || trophyLevel,
              onlineStatus: data.onlineStatus || onlineStatus,
              playingGame: data.playingGame || playingGame,
              trophies: data.trophies || trophies
            });
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [psnId]);

  const handleCopyPsnId = () => {
    navigator.clipboard.writeText(liveData.psnId);
    setCopied(true);
    toast.success(`Copied PSN ID: ${liveData.psnId}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const psnProfileUrl = shareLink || `https://my.playstation.com/profile/${encodeURIComponent(liveData.psnId)}`;

  const totalTrophies = liveData.trophies.platinum + liveData.trophies.gold + liveData.trophies.silver + liveData.trophies.bronze;

  return (
    <div 
      className={`w-full max-w-[400px] bg-gradient-to-br from-[#0B132B] via-[#050A15] to-[#02050D] border border-[#00439C]/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden font-mono ${className}`}
      style={{ boxShadow: '0 12px 32px rgba(0, 67, 156, 0.25)' }}
    >
      {/* Background PlayStation Network Watermark Glow */}
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#00439C]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-[#0070D1]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#0070D1]">
          <Gamepad2 size={16} />
          <span>PLAYSTATION NETWORK</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] bg-[#00439C]/20 border border-[#00439C]/40 text-[#0070D1] px-2.5 py-1 rounded-full font-bold">
          <Trophy size={11} className="text-amber-400" />
          <span>LVL {liveData.trophyLevel}</span>
        </div>
      </div>

      {/* Profile Bar */}
      <div className="flex items-center gap-4 relative z-10 mb-5">
        <div className="relative shrink-0">
          <img
            src={liveData.avatarUrl}
            alt={liveData.psnId}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#0070D1] shadow-lg shadow-[#0070D1]/20"
          />
          <span 
            className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#050A15] ${
              liveData.onlineStatus === 'online' ? 'bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]' : 'bg-gray-600'
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white tracking-wide truncate" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {liveData.psnId}
            </h3>
            <button
              onClick={handleCopyPsnId}
              title="Copy PSN ID"
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${liveData.onlineStatus === 'online' ? 'bg-[#00E5FF] animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-gray-300 text-[11px] truncate">
              {liveData.onlineStatus === 'online' 
                ? `Playing: ${liveData.playingGame}`
                : 'Offline'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Trophy Showcase Grid */}
      <div className="grid grid-cols-4 gap-2 mb-5 p-3 rounded-xl bg-white/[0.03] border border-white/10 relative z-10 text-center">
        {/* Platinum */}
        <div className="flex flex-col items-center">
          <div className="text-base mb-0.5" title="Platinum Trophies">🏆</div>
          <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">PLAT</span>
          <span className="text-sm font-bold text-white">{liveData.trophies.platinum}</span>
        </div>

        {/* Gold */}
        <div className="flex flex-col items-center">
          <div className="text-base mb-0.5" title="Gold Trophies">🥇</div>
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">GOLD</span>
          <span className="text-sm font-bold text-white">{liveData.trophies.gold}</span>
        </div>

        {/* Silver */}
        <div className="flex flex-col items-center">
          <div className="text-base mb-0.5" title="Silver Trophies">🥈</div>
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">SILVER</span>
          <span className="text-sm font-bold text-white">{liveData.trophies.silver}</span>
        </div>

        {/* Bronze */}
        <div className="flex flex-col items-center">
          <div className="text-base mb-0.5" title="Bronze Trophies">🥉</div>
          <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">BRONZE</span>
          <span className="text-sm font-bold text-white">{liveData.trophies.bronze}</span>
        </div>
      </div>

      {/* Total Progress Bar */}
      <div className="mb-5 relative z-10">
        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1 font-mono">
          <span>TOTAL TROPHIES EARNED</span>
          <span className="text-white font-bold">{totalTrophies}</span>
        </div>
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-[#00439C] via-[#0070D1] to-[#00E5FF] h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(10, (totalTrophies / 1000) * 100))}%` }}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="relative z-10 flex gap-2">
        <a
          href={psnProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-[#00439C] hover:bg-[#0056C7] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-[#00439C]/30 flex items-center justify-center gap-2 no-underline text-center"
        >
          <span>Add on PlayStation Network</span>
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}
