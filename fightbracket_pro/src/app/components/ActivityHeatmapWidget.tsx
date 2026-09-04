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
  rankColor?: string;
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
  if (winRate < 0.60) return '#00E5FF'; // cyber cyan
  return '#22c55e';                     // emerald green
}

function winRateBg(winRate: number, total: number): string {
  if (total === 0) return 'rgba(255,255,255,0.04)';
  if (winRate < 0.30) return 'rgba(239,68,68,0.15)';
  if (winRate < 0.40) return 'rgba(249,115,22,0.15)';
  if (winRate < 0.50) return 'rgba(234,179,8,0.15)';
  if (winRate < 0.60) return 'rgba(0,229,255,0.15)';
  return 'rgba(34,197,94,0.15)';
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function ActivityHeatmapWidget({ matches, rankColor }: ActivityHeatmapWidgetProps) {
  const [filter, setFilter] = useState<ActivityFilter>('ALL');
  const [selectedDay, setSelectedDay] = useState<DayStats | null>(null);

  const accentColor = rankColor || '#00E5FF';

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

  // Day-of-week labels (only show Mon, Wed, Fri)
  const DOW_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  const FILTERS: ActivityFilter[] = ['ALL', 'RANKED', 'QUICK', 'GROUP', 'PLAYER'];

  return (
    <div
      className="flex flex-col justify-between gap-3 p-4 sm:p-5 rounded-xl border transition-all"
      style={{
        background: 'linear-gradient(135deg, rgba(10,16,28,0.95) 0%, rgba(5,10,20,0.98) 100%)',
        borderColor: rankColor ? `${rankColor}30` : 'rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
            style={{
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}40`,
              color: accentColor,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-widest uppercase font-rajdhani">
              Recent Activity
            </div>
            <div className="text-[10px] text-gray-400 font-mono">Last 90 days · tap a day for its stats</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {FILTERS.map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => { setFilter(f); setSelectedDay(null); }}
                className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase font-mono rounded transition-all cursor-pointer"
                style={{
                  background: isActive ? `${accentColor}25` : 'rgba(255,255,255,0.04)',
                  color: isActive ? (accentColor === '#00E5FF' ? '#00E5FF' : accentColor) : '#9ca3af',
                  border: isActive ? `1px solid ${accentColor}60` : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: isActive ? `0 0 10px ${accentColor}25` : 'none',
                }}
              >
                {f}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2.5 flex-wrap mb-3">
          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">WINRATE</span>
          {[
            { label: '<30%', color: '#ef4444' },
            { label: '30-40%', color: '#f97316' },
            { label: '40-50%', color: '#eab308' },
            { label: '50-60%', color: '#00E5FF' },
            { label: '60%+', color: '#22c55e' },
            { label: 'no games', color: 'rgba(255,255,255,0.08)' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
              <span className="text-[9px] text-gray-400 font-mono">{label}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-0.5" style={{ minWidth: 'max-content' }}>
            {/* DOW labels column */}
            <div className="flex flex-col gap-0.5 mr-1" style={{ paddingTop: '18px' }}>
              {DOW_LABELS.map((label, i) => (
                <div key={i} className="h-3 flex items-center" style={{ width: '22px' }}>
                  <span className="text-[8px] text-gray-500 font-mono">{label}</span>
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
                        <span className="text-[8px] text-gray-400 font-mono whitespace-nowrap absolute">
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
                            border: isSelected ? `1.5px solid ${accentColor}` : '1.5px solid transparent',
                            cursor: stats && stats.total > 0 ? 'pointer' : 'default',
                            transition: 'transform 0.1s, border 0.1s',
                            boxShadow: isSelected ? `0 0 8px ${accentColor}80` : 'none',
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
          className="rounded-lg px-3 py-2 text-center transition-all duration-200 mt-2"
          style={{
            background: selectedDay ? winRateBg(selectedDay.winRate, selectedDay.total) : 'rgba(255,255,255,0.02)',
            border: selectedDay ? `1px solid ${winRateColor(selectedDay.winRate, selectedDay.total)}50` : '1px solid rgba(255,255,255,0.06)',
            minHeight: '40px',
          }}
        >
          {selectedDay ? (
            <div className="flex items-center justify-around gap-2">
              <div>
                <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">{selectedDay.date}</div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold font-rajdhani" style={{ color: winRateColor(selectedDay.winRate, selectedDay.total) }}>
                  {Math.round(selectedDay.winRate * 100)}%
                </div>
                <div className="text-[9px] text-gray-400 font-mono uppercase">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold font-rajdhani text-white">{selectedDay.total}</div>
                <div className="text-[9px] text-gray-400 font-mono uppercase">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold font-mono text-emerald-400">{selectedDay.wins}W</div>
                <div className="text-[9px] text-gray-400 font-mono uppercase">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold font-mono text-red-400">{selectedDay.losses}L</div>
                <div className="text-[9px] text-gray-400 font-mono uppercase">Losses</div>
              </div>
            </div>
          ) : (
            <span className="text-[10px] text-gray-500 font-mono">Tap or click any active day for stats</span>
          )}
        </div>
      </div>

      <div>
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5">
          {[
            {
              value: matches.length > 0 ? `${summary.winRate.toFixed(1)}%` : '—',
              label: 'WINRATE',
              color: matches.length > 0 ? winRateColor(summary.winRate / 100, summary.total) : 'rgba(255,255,255,0.3)',
            },
            { value: matches.length > 0 ? summary.total.toString() : '—', label: 'MATCHES', color: matches.length > 0 ? '#ffffff' : 'rgba(255,255,255,0.3)' },
            { value: matches.length > 0 ? summary.activeDays.toString() : '—', label: 'ACTIVE DAYS', color: matches.length > 0 ? '#ffffff' : 'rgba(255,255,255,0.3)' },
            { value: matches.length > 0 ? summary.perDay.toFixed(1) : '—', label: 'PER DAY', color: matches.length > 0 ? '#ffffff' : 'rgba(255,255,255,0.3)' },
          ].map(({ value, label, color }) => (
            <div key={label} className="text-center">
              <div className="text-lg font-bold font-rajdhani tracking-wide" style={{ color }}>
                {value}
              </div>
              <div className="text-[9px] text-gray-400 font-mono uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        {/* W/L Footer */}
        {matches.length > 0 && summary.total > 0 && (
          <div className="text-center text-[10px] text-gray-400 font-mono pt-2">
            {summary.wins}W · {summary.losses}L
            {summary.busiestDay > 0 && ` · busiest day ${summary.busiestDay} matches`}
          </div>
        )}

        {/* Empty state */}
        {matches.length === 0 && (
          <div className="text-center text-[10px] text-gray-500 font-mono py-1">
            Link your Tekken ID in Settings to see activity here
          </div>
        )}
      </div>
    </div>
  );
}
