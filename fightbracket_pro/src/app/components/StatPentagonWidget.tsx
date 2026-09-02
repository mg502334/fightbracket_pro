import React, { useState, useMemo } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Match {
  result?: string;
  rounds_won?: number;
  rounds_lost?: number;
  battle_type?: string;
  opponent_rank?: string;
  player_rank?: string;
}

interface StatPentagonWidgetProps {
  matches: Match[];
  /** Optional override values (0–100) if you want to supply stats directly */
  stats?: {
    attack: number;
    defense: number;
    technique: number;
    spirit: number;
    appeal: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pentagon geometry helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Return [x,y] for a pentagon vertex at the given axis index (0–4),
 *  value in [0,1], with centre cx/cy and max radius r.
 *  Axes start at top (–90°) and go clockwise. */
function pentagonPoint(axisIndex: number, value: number, cx: number, cy: number, r: number): [number, number] {
  const angle = (Math.PI * 2 * axisIndex) / 5 - Math.PI / 2;
  return [
    cx + r * value * Math.cos(angle),
    cy + r * value * Math.sin(angle),
  ];
}

function polygonPoints(values: number[], cx: number, cy: number, r: number): string {
  return values
    .map((v, i) => pentagonPoint(i, v, cx, cy, r).join(','))
    .join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Derive stats from match history
// ─────────────────────────────────────────────────────────────────────────────

function deriveStats(matches: Match[]): { attack: number; defense: number; technique: number; spirit: number; appeal: number } {
  if (matches.length === 0) {
    return { attack: 0, defense: 0, technique: 0, spirit: 0, appeal: 0 };
  }

  let wins = 0, losses = 0;
  let roundsWon = 0, roundsLost = 0;
  let rankedMatches = 0;
  let streakMax = 0, currentStreak = 0;

  for (const m of matches) {
    const win = (m.result || '').toLowerCase() === 'win' || (m.result || '').toLowerCase() === 'w' || m.result === '1';
    if (win) { wins++; currentStreak++; streakMax = Math.max(streakMax, currentStreak); }
    else { losses++; currentStreak = 0; }

    roundsWon += m.rounds_won ?? 0;
    roundsLost += m.rounds_lost ?? 0;

    const bt = (m.battle_type || '').toLowerCase();
    if (bt.includes('rank') || bt === '1') rankedMatches++;
  }

  const total = wins + losses;
  const winRate = total > 0 ? wins / total : 0;
  const roundTotal = roundsWon + roundsLost;
  const roundWinRate = roundTotal > 0 ? roundsWon / roundTotal : 0;
  const rankedRatio = total > 0 ? rankedMatches / total : 0;
  const streakScore = Math.min(streakMax / 10, 1);
  const consistencyScore = total > 20 ? Math.min(total / 100, 1) : total / 100;

  // Map to 0–100 scores
  const attack = Math.round(Math.min(winRate * 1.2, 1) * 100);
  const defense = Math.round(Math.max(0, 1 - winRate * 1.4) * 100);
  const technique = Math.round(roundWinRate * 100);
  const spirit = Math.round((streakScore * 0.5 + consistencyScore * 0.5) * 100);
  const appeal = Math.round(rankedRatio * 100);

  return {
    attack: Math.max(5, attack),
    defense: Math.max(5, defense),
    technique: Math.max(5, technique),
    spirit: Math.max(5, spirit),
    appeal: Math.max(5, appeal),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const AXES = [
  { key: 'attack',    label: 'ATTACK',    color: '#ef4444', textColor: '#f87171' },
  { key: 'technique', label: 'TECHNIQUE', color: '#06b6d4', textColor: '#22d3ee' },
  { key: 'appeal',    label: 'APPEAL',    color: '#f59e0b', textColor: '#fbbf24' },
  { key: 'spirit',    label: 'SPIRIT',    color: '#8b5cf6', textColor: '#a78bfa' },
  { key: 'defense',   label: 'DEFENSE',   color: '#22c55e', textColor: '#4ade80' },
] as const;

// Pentagon vertex order: Attack (top), Technique (right), Appeal (lower-right), Spirit (lower-left), Defense (left)
// Maps to axis indices 0–4 going clockwise from top
const AXIS_ORDER: (typeof AXES[number]['key'])[] = ['attack', 'technique', 'appeal', 'spirit', 'defense'];

const CX = 130, CY = 130, R = 100;

export function StatPentagonWidget({ matches, stats: statsProp }: StatPentagonWidgetProps) {
  const [showDetails, setShowDetails] = useState(false);

  const stats = useMemo(() => statsProp || deriveStats(matches), [matches, statsProp]);

  const hasData = matches.length > 0 || statsProp !== undefined;
  const values = AXIS_ORDER.map((k) => stats[k] / 100);
  const average = hasData
    ? Math.round(Object.values(stats).reduce((a, b) => a + b, 0) / Object.values(stats).length)
    : 0;

  // Background reference rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Axis label positions (outside the ring)
  const labelPositions = AXIS_ORDER.map((key, i) => {
    const [x, y] = pentagonPoint(i, 1.38, CX, CY, R);
    return { key, x, y };
  });

  return (
    <div
      className="flex flex-col gap-3 p-5 rounded-2xl"
      style={{ background: '#151520', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            {/* Pentagon icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(167,139,250)" strokeWidth="2">
              <polygon points="12,2 22,9 18,21 6,21 2,9" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-widest uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}>
              Stat Pentagon
            </div>
            <div className="text-[10px] text-gray-500 font-mono">
              {hasData ? `Average ${average}` : 'No data'}
            </div>
          </div>
        </div>

        {/* Details toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-150"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            background: showDetails ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.06)',
            border: showDetails ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
            color: showDetails ? '#c4b5fd' : '#8a8a9a',
          }}
        >
          DETAILS
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            style={{ transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* SVG Pentagon */}
      <div className="flex justify-center">
        <svg
          width="260"
          height="260"
          viewBox="0 0 260 260"
          style={{ overflow: 'visible' }}
        >
          {/* Reference rings */}
          {rings.map((ringVal) => (
            <polygon
              key={ringVal}
              points={polygonPoints(Array(5).fill(ringVal), CX, CY, R)}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="1"
            />
          ))}

          {/* Axis spokes */}
          {AXIS_ORDER.map((key, i) => {
            const [x, y] = pentagonPoint(i, 1, CX, CY, R);
            return (
              <line
                key={key}
                x1={CX} y1={CY}
                x2={x} y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
            );
          })}

          {/* Filled data polygon — only when data exists */}
          {hasData && (
            <>
              <polygon
                points={polygonPoints(values, CX, CY, R)}
                fill="rgba(109,79,200,0.45)"
                stroke="rgba(139,92,246,0.8)"
                strokeWidth="1.5"
                style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.5))' }}
              />
              {values.map((v, i) => {
                const [x, y] = pentagonPoint(i, v, CX, CY, R);
                return (
                  <circle
                    key={i}
                    cx={x} cy={y} r="3"
                    fill="rgba(167,139,250,0.9)"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="1"
                  />
                );
              })}
            </>
          )}

          {/* Empty state label in centre */}
          {!hasData && (
            <text
              x={CX} y={CY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.18)"
              fontSize="11"
              fontFamily="'Barlow Condensed', sans-serif"
              letterSpacing="2"
            >
              LINK TEKKEN ID
            </text>
          )}

          {/* Axis labels */}
          {labelPositions.map(({ key, x, y }) => {
            const axis = AXES.find(a => a.key === key)!;
            const statVal = stats[key as keyof typeof stats];
            return (
              <g key={key}>
                <text
                  x={x} y={y - 4}
                  textAnchor="middle"
                  dominantBaseline="auto"
                  fill={axis.textColor}
                  fontSize="9"
                  fontFamily="'Barlow Condensed', sans-serif"
                  fontWeight="700"
                  letterSpacing="1.5"
                >
                  {axis.label}
                </text>
                <text
                  x={x} y={y + 8}
                  textAnchor="middle"
                  dominantBaseline="auto"
                  fill="white"
                  fontSize="14"
                  fontFamily="'Barlow Condensed', sans-serif"
                  fontWeight="800"
                >
                  {statVal}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Details expansion */}
      {showDetails && (
        <div
          className="rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="px-4 py-2 text-left font-mono text-gray-500 uppercase tracking-wider text-[9px]">STAT</th>
                <th className="px-4 py-2 text-right font-mono text-gray-500 uppercase tracking-wider text-[9px]">VALUE</th>
                <th className="px-4 py-2 text-left font-mono text-gray-500 uppercase tracking-wider text-[9px]">BAR</th>
              </tr>
            </thead>
            <tbody>
              {AXES.map(({ key, label, textColor }) => {
                const val = stats[key as keyof typeof stats];
                return (
                  <tr
                    key={key}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <td className="px-4 py-2.5 font-bold uppercase tracking-wider text-[10px]" style={{ color: textColor, fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {label}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-white text-sm" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {val}
                    </td>
                    <td className="px-4 py-2.5 w-32">
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${val}%`, background: textColor, boxShadow: `0 0 6px ${textColor}80` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {matches.length === 0 && (
            <div className="px-4 py-2 text-[9px] text-gray-600 font-mono border-t border-white/5 text-center">
              Demo values — link your Tekken ID in Settings for real stats
            </div>
          )}
        </div>
      )}
    </div>
  );
}
