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
}

type SeasonFilter = 'ALL' | 'S2' | 'S3';

export function GlobalStatisticsWidget({ matches = [], globalStats }: GlobalStatisticsWidgetProps) {
  const [season, setSeason] = useState<SeasonFilter>('ALL');

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
      className="rounded-2xl p-5 border flex flex-col justify-between"
      style={{
        background: '#070b14',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        minHeight: '380px',
      }}
    >
      {/* ── Header ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
            >
              <BarChart2 size={14} className="text-purple-400" />
            </div>
            <div>
              <div
                className="text-sm font-bold text-white tracking-widest uppercase"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              >
                Global Statistics
              </div>
              <div className="text-[10px] text-gray-500 font-mono">
                Overall performance for all seasons
              </div>
            </div>
          </div>
        </div>

        {/* Season Filter Tabs */}
        <div className="flex items-center gap-1.5 mt-3 mb-4">
          {(['ALL', 'S2', 'S3'] as SeasonFilter[]).map((tab) => {
            const active = season === tab;
            return (
              <button
                key={tab}
                onClick={() => setSeason(tab)}
                className="px-3 py-1 rounded-full text-[11px] font-bold font-mono transition-all cursor-pointer"
                style={{
                  background: active ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                  color: active ? '#ffffff' : 'rgba(255,255,255,0.4)',
                  border: active ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="space-y-3 my-auto">
        {/* Ranked Card */}
        <div
          className="p-3.5 rounded-xl border flex items-center justify-between transition-all"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Trophy size={18} className="text-gray-300" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-wide">Ranked</div>
              <div className="text-[11px] text-gray-400 font-mono">
                {hasData ? `${ranked.matches} matches` : '—'}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div
              className="text-lg font-bold font-mono"
              style={{
                color: hasData
                  ? ranked.win_rate >= 50
                    ? '#22c55e'
                    : ranked.win_rate >= 35
                    ? '#eab308'
                    : '#f97316'
                  : 'rgba(255,255,255,0.2)',
              }}
            >
              {hasData ? `${ranked.win_rate.toFixed(1)}%` : '—'}
            </div>
            <div className="text-[10px] text-gray-500 font-mono">
              {hasData ? `${ranked.wins}W - ${ranked.losses}L - ${ranked.draws}D` : 'No data'}
            </div>
          </div>
        </div>

        {/* Quick Card */}
        <div
          className="p-3.5 rounded-xl border flex items-center justify-between transition-all"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Swords size={18} className="text-gray-300" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-wide">Quick</div>
              <div className="text-[11px] text-gray-400 font-mono">
                {hasData ? `${quick.matches} matches` : '—'}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div
              className="text-lg font-bold font-mono"
              style={{
                color: hasData
                  ? quick.win_rate >= 50
                    ? '#22c55e'
                    : quick.win_rate >= 35
                    ? '#eab308'
                    : '#f97316'
                  : 'rgba(255,255,255,0.2)',
              }}
            >
              {hasData ? `${quick.win_rate.toFixed(1)}%` : '—'}
            </div>
            <div className="text-[10px] text-gray-500 font-mono">
              {hasData ? `${quick.wins}W - ${quick.losses}L - ${quick.draws}D` : 'No data'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="pt-2 text-center text-[10px] font-mono text-gray-600 border-t border-white/5 mt-2">
        {hasData
          ? `${ranked.matches + quick.matches} total games tracked across all modes`
          : 'Link your Tekken 8 Polaris ID to view global statistics'}
      </div>
    </div>
  );
}
