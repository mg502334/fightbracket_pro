import React, { useState, useMemo } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Match {
  result?: string;
  battle_type?: string;
  timestamp?: number | string;
  rounds_won?: number;
  rounds_lost?: number;
}

interface DayStats {
  date: string; // YYYY-MM-DD
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

type ActivityFilter = 'ALL' | 'RANKED' | 'QUICK' | 'GROUP' | 'PLAYER';

interface ActivityHeatmapWidgetProps {
  matches: Match[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toYMD(ts: number | string | undefined): string | null {
  if (ts === undefined || ts === null) return null;
  let d: Date;
  if (typeof ts === 'number') {
    // EWGF timestamps can be seconds or ms
    d = new Date(ts > 1e10 ? ts : ts * 1000);
  } else {
    d = new Date(ts);
  }
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function isWin(m: Match): boolean {
  const r = (m.result || '').toLowerCase();
  return r === 'win' || r === 'w' || r === '1';
}

function matchesBattleFilter(m: Match, filter: ActivityFilter): boolean {
  if (filter === 'ALL') return true;
  const bt = (m.battle_type || '').toLowerCase();
  if (filter === 'RANKED') return bt.includes('rank') || bt === '1';
  if (filter === 'QUICK') return bt.includes('quick') || bt === '2' || bt.includes('casual');
  if (filter === 'GROUP') return bt.includes('group') || bt === '3' || bt.includes('lobby');
  if (filter === 'PLAYER') return bt.includes('player') || bt === '4' || bt.includes('offline') || bt.includes('challenge');
  return true;
}

/** Colour for a win-rate bucket */
function winRateColor(winRate: number, total: number): string {
  if (total === 0) return 'rgba(255,255,255,0.08)';
  if (winRate < 0.30) return '#ef4444'; // red
  if (winRate < 0.40) return '#f97316'; // orange
  if (winRate < 0.50) return '#eab308'; // yellow
  if (winRate < 0.60) return '#86efac'; // light green
  return '#22c55e';                       // bright green
}

function winRateBg(winRate: number, total: number): string {
  if (total === 0) return 'rgba(255,255,255,0.04)';
  if (winRate < 0.30) return 'rgba(239,68,68,0.18)';
  if (winRate < 0.40) return 'rgba(249,115,22,0.18)';
  if (winRate < 0.50) return 'rgba(234,179,8,0.18)';
  if (winRate < 0.60) return 'rgba(134,239,172,0.18)';
  return 'rgba(34,197,94,0.18)';
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function ActivityHeatmapWidget({ matches }: ActivityHeatmapWidgetProps) {
  const [filter, setFilter] = useState<ActivityFilter>('ALL');
  const [selectedDay, setSelectedDay] = useState<DayStats | null>(null);

  // Build a 90-day window ending today
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const windowDays = useMemo<string[]>(() => {
    const days: string[] = [];
    const end = new Date(todayStr);
    for (let i = 89; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, [todayStr]);

  // Derive per-day stats from filtered matches
  const dayMap = useMemo<Map<string, DayStats>>(() => {
    const map = new Map<string, DayStats>();
    for (const m of matches) {
      if (!matchesBattleFilter(m, filter)) continue;
      const ymd = toYMD(m.timestamp);
      if (!ymd) continue;
      if (!windowDays.includes(ymd)) continue;
      const existing = map.get(ymd) || { date: ymd, wins: 0, losses: 0, total: 0, winRate: 0 };
      if (isWin(m)) existing.wins++;
      else existing.losses++;
      existing.total++;
      existing.winRate = existing.wins / existing.total;
      map.set(ymd, existing);
    }
    return map;
  }, [matches, filter, windowDays]);

  // Build week columns (Mon/Wed/Fri rows shown, like the screenshot)
  // We'll group days into weeks (columns), Sunday = start
  const weekColumns = useMemo<string[][]>(() => {
    const cols: string[][] = [];
    let col: string[] = [];
    const firstDate = new Date(windowDays[0]);
    // pad start so col starts on Sunday
    const startDow = firstDate.getDay(); // 0=Sun
    for (let i = 0; i < startDow; i++) col.push('');
    for (const day of windowDays) {
      const dow = new Date(day).getDay();
      if (dow === 0 && col.length > 0) {
        cols.push(col);
        col = [];
      }
      col.push(day);
    }
    if (col.length > 0) {
      while (col.length < 7) col.push('');
      cols.push(col);
    }
    return cols;
  }, [windowDays]);

  // Month labels positioned on the first day of each month in the window
  const monthLabels = useMemo<{ label: string; colIndex: number }[]>(() => {
    const seen = new Set<string>();
    const labels: { label: string; colIndex: number }[] = [];
    weekColumns.forEach((col, ci) => {
      for (const day of col) {
        if (!day) continue;
        const month = day.slice(0, 7); // YYYY-MM
        if (!seen.has(month)) {
          seen.add(month);
          const d = new Date(day);
          labels.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), colIndex: ci });
        }
        break;
      }
    });
    return labels;
  }, [weekColumns]);

  // Overall summary stats (filtered)
  const summary = useMemo(() => {
    let wins = 0, total = 0, activeDays = 0, busiestDay = 0;
    for (const stats of dayMap.values()) {
      wins += stats.wins;
      total += stats.total;
      if (stats.total > 0) activeDays++;
      if (stats.total > busiestDay) busiestDay = stats.total;
    }
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const perDay = activeDays > 0 ? total / activeDays : 0;
    return { wins, losses: total - wins, total, winRate, activeDays, perDay, busiestDay };
  }, [dayMap]);

  // Day-of-week labels (only show Mon, Wed, Fri like screenshot)
  const DOW_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  const FILTERS: ActivityFilter[] = ['ALL', 'RANKED', 'QUICK', 'GROUP', 'PLAYER'];

  return (
    <div
      className="flex flex-col gap-3 p-5 rounded-2xl"
      style={{ background: '#151520', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(167,139,250)" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-bold text-white tracking-widest uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}>
            Recent Activity
          </div>
          <div className="text-[10px] text-gray-500 font-mono">Last 90 days · tap a day for its stats</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setSelectedDay(null); }}
            className="px-3 py-1 text-[10px] font-bold tracking-widest uppercase transition-all duration-150"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              borderRadius: '4px',
              background: filter === f ? '#7c3aed' : 'rgba(255,255,255,0.05)',
              color: filter === f ? '#fff' : '#8a8a9a',
              border: filter === f ? '1px solid #7c3aed' : '1px solid transparent',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">WINRATE</span>
        {[
          { label: '<30%', color: '#ef4444' },
          { label: '30-40%', color: '#f97316' },
          { label: '40-50%', color: '#eab308' },
          { label: '50-60%', color: '#86efac' },
          { label: '60%+', color: '#22c55e' },
          { label: 'no games', color: 'rgba(255,255,255,0.12)' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
            <span className="text-[9px] text-gray-400 font-mono">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-0.5" style={{ minWidth: 'max-content' }}>
          {/* DOW labels column */}
          <div className="flex flex-col gap-0.5 mr-1" style={{ paddingTop: '18px' }}>
            {DOW_LABELS.map((label, i) => (
              <div key={i} className="h-3 flex items-center" style={{ width: '24px' }}>
                <span className="text-[8px] text-gray-600 font-mono">{label}</span>
              </div>
            ))}
          </div>

          {/* Week columns */}
          <div className="flex flex-col gap-0.5">
            {/* Month labels row */}
            <div className="flex gap-0.5 mb-0.5 h-4 relative" style={{ paddingLeft: 0 }}>
              {weekColumns.map((_, ci) => {
                const monthLabel = monthLabels.find(m => m.colIndex === ci);
                return (
                  <div key={ci} style={{ width: '13px', flexShrink: 0 }}>
                    {monthLabel && (
                      <span className="text-[8px] text-gray-500 font-mono whitespace-nowrap absolute">
                        {monthLabel.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Grid rows (7 days per week) */}
            <div className="flex gap-0.5">
              {weekColumns.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-0.5">
                  {col.map((day, di) => {
                    if (!day) return <div key={di} style={{ width: '13px', height: '13px' }} />;
                    const stats = dayMap.get(day);
                    const color = stats ? winRateColor(stats.winRate, stats.total) : 'rgba(255,255,255,0.06)';
                    const isSelected = selectedDay?.date === day;
                    return (
                      <button
                        key={day}
                        title={`${day}${stats ? `: ${stats.wins}W ${stats.losses}L (${Math.round(stats.winRate * 100)}% WR)` : ': No games'}`}
                        onClick={() => setSelectedDay(stats && stats.total > 0 ? (isSelected ? null : stats) : null)}
                        style={{
                          width: '13px',
                          height: '13px',
                          borderRadius: '3px',
                          background: color,
                          border: isSelected ? '1.5px solid rgba(255,255,255,0.8)' : '1.5px solid transparent',
                          cursor: stats && stats.total > 0 ? 'pointer' : 'default',
                          transition: 'transform 0.1s, border 0.1s',
                        }}
                        onMouseEnter={(e) => { if (stats && stats.total > 0) (e.target as HTMLElement).style.transform = 'scale(1.3)'; }}
                        onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected day detail or placeholder */}
      <div
        className="rounded-lg px-4 py-3 text-center transition-all duration-200"
        style={{
          background: selectedDay ? winRateBg(selectedDay.winRate, selectedDay.total) : 'rgba(255,255,255,0.03)',
          border: selectedDay ? `1px solid ${winRateColor(selectedDay.winRate, selectedDay.total)}40` : '1px solid rgba(255,255,255,0.06)',
          minHeight: '44px',
        }}
      >
        {selectedDay ? (
          <div className="flex items-center justify-around gap-4">
            <div>
              <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{selectedDay.date}</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold" style={{ color: winRateColor(selectedDay.winRate, selectedDay.total) }}>
                {Math.round(selectedDay.winRate * 100)}%
              </div>
              <div className="text-[9px] text-gray-500 font-mono uppercase">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-white">{selectedDay.total}</div>
              <div className="text-[9px] text-gray-500 font-mono uppercase">Matches</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-emerald-400">{selectedDay.wins}W</div>
              <div className="text-[9px] text-gray-500 font-mono uppercase">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-red-400">{selectedDay.losses}L</div>
              <div className="text-[9px] text-gray-500 font-mono uppercase">Losses</div>
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-gray-600 font-mono">Tap or click any day to see its stats</span>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3 pt-1">
        {[
          {
            value: matches.length > 0 ? `${summary.winRate.toFixed(1)}%` : '—',
            label: 'WINRATE',
            color: matches.length > 0 ? winRateColor(summary.winRate / 100, summary.total) : 'rgba(255,255,255,0.2)',
          },
          { value: matches.length > 0 ? summary.total.toString() : '—', label: 'MATCHES', color: matches.length > 0 ? '#f0ede8' : 'rgba(255,255,255,0.2)' },
          { value: matches.length > 0 ? summary.activeDays.toString() : '—', label: 'ACTIVE DAYS', color: matches.length > 0 ? '#f0ede8' : 'rgba(255,255,255,0.2)' },
          { value: matches.length > 0 ? summary.perDay.toFixed(1) : '—', label: 'PER DAY', color: matches.length > 0 ? '#f0ede8' : 'rgba(255,255,255,0.2)' },
        ].map(({ value, label, color }) => (
          <div key={label} className="text-center">
            <div className="text-xl font-bold" style={{ color, fontFamily: "'Barlow Condensed', sans-serif" }}>
              {value}
            </div>
            <div className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {/* W/L Footer — only shown when data exists */}
      {matches.length > 0 && summary.total > 0 && (
        <div className="text-center text-[10px] text-gray-600 font-mono pt-0.5">
          {summary.wins}W · {summary.losses}L
          {summary.busiestDay > 0 && ` · busiest day ${summary.busiestDay} matches`}
        </div>
      )}

      {/* Empty state */}
      {matches.length === 0 && (
        <div className="text-center text-[11px] text-gray-600 font-mono py-2">
          Link your Tekken ID in Settings to see activity here
        </div>
      )}
    </div>
  );
}
