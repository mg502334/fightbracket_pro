import React, { useState, useMemo } from 'react';
import { Trophy, Swords, BarChart2 } from 'lucide-react';

export interface GlobalStatCategory {
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
}

export interface GlobalStatsPayload {
  ranked?: GlobalStatCategory;
  quick?: GlobalStatCategory;
  group?: GlobalStatCategory;
}

interface Match {
  result?: string;
  battle_type?: string;
  timestamp?: number | string;
}

interface GlobalStatisticsWidgetProps {
  matches?: Match[];
  globalStats?: GlobalStatsPayload;
  rankColor?: string;
}

type SeasonFilter = 'ALL' | 'S2' | 'S3';

export function GlobalStatisticsWidget({ matches = [], globalStats, rankColor }: GlobalStatisticsWidgetProps) {
  const [season, setSeason] = useState<SeasonFilter>('ALL');

  const accentColor = rankColor || '#00E5FF';

  const stats = useMemo(() => {
    if (globalStats && (globalStats.ranked || globalStats.quick)) {
      return globalStats;
    }

    // Derive from matches if not provided directly
    let rankedWins = 0, rankedLosses = 0, rankedDraws = 0, rankedTotal = 0;
    let quickWins = 0, quickLosses = 0, quickDraws = 0, quickTotal = 0;

    for (const m of matches) {
      const bt = (m.battle_type || '').toLowerCase();
      const res = (m.result || '').toUpperCase();
      const isWin = res === 'WIN';
      const isLoss = res === 'LOSS';
      const isDraw = res === 'DRAW';

      if (bt.includes('quick') || bt.includes('casual')) {
        quickTotal++;
        if (isWin) quickWins++;
        else if (isLoss) quickLosses++;
        else if (isDraw) quickDraws++;
      } else {
        rankedTotal++;
        if (isWin) rankedWins++;
        else if (isLoss) rankedLosses++;
        else if (isDraw) rankedDraws++;
      }
    }

    return {
      ranked: {
        matches: rankedTotal,
        wins: rankedWins,
        losses: rankedLosses,
        draws: rankedDraws,
        win_rate: rankedTotal > 0 ? Math.round((rankedWins / rankedTotal) * 1000) / 10 : 0,
      },
      quick: {
        matches: quickTotal,
        wins: quickWins,
        losses: quickLosses,
        draws: quickDraws,
        win_rate: quickTotal > 0 ? Math.round((quickWins / quickTotal) * 1000) / 10 : 0,
      },
    };
  }, [matches, globalStats]);

  const hasData = matches.length > 0 || (globalStats && ((globalStats.ranked?.matches ?? 0) > 0 || (globalStats.quick?.matches ?? 0) > 0));

  const ranked = stats.ranked || { matches: 0, wins: 0, losses: 0, draws: 0, win_rate: 0 };
  const quick = stats.quick || { matches: 0, wins: 0, losses: 0, draws: 0, win_rate: 0 };

  return (
    <div
      className="rounded-xl p-4 sm:p-5 border flex flex-col justify-between transition-all"
      style={{
        background: 'linear-gradient(135deg, rgba(10,16,28,0.95) 0%, rgba(5,10,20,0.98) 100%)',
        borderColor: rankColor ? `${rankColor}30` : 'rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* ── Header ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}40`,
                color: accentColor,
              }}
            >
              <BarChart2 size={16} />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-widest uppercase font-rajdhani">
                Global Statistics
              </div>
              <div className="text-[10px] text-gray-400 font-mono">
                Overall performance for all seasons
              </div>
            </div>
          </div>
        </div>

        {/* Season Filter Tabs */}
        <div className="flex items-center gap-1.5 mt-2.5 mb-3">
          {(['ALL', 'S2', 'S3'] as SeasonFilter[]).map((tab) => {
            const active = season === tab;
            return (
              <button
                key={tab}
                onClick={() => setSeason(tab)}
                className="px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-all cursor-pointer"
                style={{
                  background: active ? `${accentColor}25` : 'rgba(255,255,255,0.04)',
                  color: active ? (accentColor === '#00E5FF' ? '#00E5FF' : accentColor) : '#9ca3af',
                  border: active ? `1px solid ${accentColor}60` : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: active ? `0 0 10px ${accentColor}20` : 'none',
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="space-y-2.5 my-auto">
        {/* Ranked Card */}
        <div
          className="p-3 rounded-lg border transition-all"
          style={{
            background: 'rgba(5,10,20,0.85)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)', color: '#00E5FF' }}
              >
                <Trophy size={16} />
              </div>
              <div>
                <div className="text-sm font-bold text-white font-rajdhani tracking-wide">Ranked</div>
                <div className="text-[10px] text-gray-400 font-mono">
                  {hasData ? `${ranked.matches} matches` : '—'}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div
                className="text-base font-bold font-rajdhani"
                style={{
                  color: hasData
                    ? ranked.win_rate >= 50
                      ? '#22c55e'
                      : ranked.win_rate >= 35
                      ? '#eab308'
                      : '#f97316'
                    : 'rgba(255,255,255,0.3)',
                }}
              >
                {hasData ? `${ranked.win_rate.toFixed(1)}%` : '—'}
              </div>
              <div className="text-[10px] text-gray-400 font-mono">
                {hasData ? `${ranked.wins}W - ${ranked.losses}L - ${ranked.draws}D` : 'No data'}
              </div>
            </div>
          </div>

          {/* Mini Win/Loss Bar */}
          {hasData && ranked.matches > 0 && (
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden flex mt-2">
              <div
                style={{ width: `${(ranked.wins / ranked.matches) * 100}%` }}
                className="bg-emerald-400 transition-all duration-500"
              />
              <div
                style={{ width: `${(ranked.losses / ranked.matches) * 100}%` }}
                className="bg-red-500 transition-all duration-500"
              />
            </div>
          )}
        </div>

        {/* Quick Card */}
        <div
          className="p-3 rounded-lg border transition-all"
          style={{
            background: 'rgba(5,10,20,0.85)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,0,60,0.1)', border: '1px solid rgba(255,0,60,0.25)', color: '#ff4d6d' }}
              >
                <Swords size={16} />
              </div>
              <div>
                <div className="text-sm font-bold text-white font-rajdhani tracking-wide">Quick</div>
                <div className="text-[10px] text-gray-400 font-mono">
                  {hasData ? `${quick.matches} matches` : '—'}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div
                className="text-base font-bold font-rajdhani"
                style={{
                  color: hasData
                    ? quick.win_rate >= 50
                      ? '#22c55e'
                      : quick.win_rate >= 35
                      ? '#eab308'
                      : '#f97316'
                    : 'rgba(255,255,255,0.3)',
                }}
              >
                {hasData ? `${quick.win_rate.toFixed(1)}%` : '—'}
              </div>
              <div className="text-[10px] text-gray-400 font-mono">
                {hasData ? `${quick.wins}W - ${quick.losses}L - ${quick.draws}D` : 'No data'}
              </div>
            </div>
          </div>

          {/* Mini Win/Loss Bar */}
          {hasData && quick.matches > 0 && (
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden flex mt-2">
              <div
                style={{ width: `${(quick.wins / quick.matches) * 100}%` }}
                className="bg-emerald-400 transition-all duration-500"
              />
              <div
                style={{ width: `${(quick.losses / quick.matches) * 100}%` }}
                className="bg-red-500 transition-all duration-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="pt-2 text-center text-[10px] font-mono text-gray-400 border-t border-white/5 mt-2">
        {hasData
          ? `${ranked.matches + quick.matches} total games tracked across all modes`
          : 'Link your Tekken 8 Polaris ID to view global statistics'}
      </div>
    </div>
  );
}
