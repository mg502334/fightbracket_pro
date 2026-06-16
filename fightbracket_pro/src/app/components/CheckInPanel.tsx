import { useState } from "react";
import { Search, CheckCircle2, XCircle, Smartphone } from "lucide-react";
import type { Player, GameTheme } from "../data/tournamentData";

interface CheckInPanelProps {
  players: Player[];
  theme: GameTheme;
  onCheckIn: (playerId: string, checked: boolean) => void;
}

type FilterMode = 'all' | 'checked' | 'unchecked';

export function CheckInPanel({ players, theme, onCheckIn }: CheckInPanelProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');

  const filtered = players.filter(p => {
    const matchSearch = p.tag.toLowerCase().includes(search.toLowerCase()) ||
      p.realName.toLowerCase().includes(search.toLowerCase()) ||
      p.character.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'checked' ? p.checkedIn : !p.checkedIn);
    return matchSearch && matchFilter;
  });

  const checkedCount = players.filter(p => p.checkedIn).length;
  const pct = Math.round((checkedCount / players.length) * 100);

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="rounded p-4" style={{ background: 'var(--card)', border: `1px solid ${theme.primaryColor}20` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm tracking-widest" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: theme.primaryColor }}>
            CHECK-IN STATUS
          </span>
          <span className="text-lg tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00FF88' }}>
            {checkedCount} / {players.length}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
              boxShadow: `0 0 8px ${theme.primaryColor}`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs opacity-50" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{pct}% complete</span>
          <span className="text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#FF006E' }}>
            {players.length - checkedCount} missing
          </span>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by tag, name, or character..."
            className="w-full pl-9 pr-4 py-2 rounded text-sm outline-none transition-all"
            style={{
              background: 'var(--card)',
              border: `1px solid ${search ? theme.primaryColor + '60' : 'rgba(122,158,192,0.15)'}`,
              color: 'var(--foreground)',
              fontFamily: 'Inter, sans-serif',
            }}
          />
        </div>
        <div className="flex rounded overflow-hidden" style={{ border: '1px solid rgba(122,158,192,0.15)' }}>
          {(['all', 'checked', 'unchecked'] as FilterMode[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-2 text-xs tracking-wider transition-all"
              style={{
                background: filter === f ? `${theme.primaryColor}20` : 'var(--card)',
                color: filter === f ? theme.primaryColor : 'var(--muted-foreground)',
                fontFamily: 'JetBrains Mono, monospace',
                borderRight: f !== 'unchecked' ? '1px solid rgba(122,158,192,0.1)' : 'none',
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Player table */}
      <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(122,158,192,0.1)' }}>
        {/* Header */}
        <div
          className="grid text-xs tracking-widest px-4 py-2"
          style={{
            gridTemplateColumns: '40px 1fr 120px 100px 100px 80px',
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--muted-foreground)',
            background: 'var(--sidebar)',
            borderBottom: '1px solid rgba(122,158,192,0.1)',
          }}
        >
          <span>#</span>
          <span>PLAYER</span>
          <span>CHARACTER</span>
          <span>COUNTRY</span>
          <span>PHONE</span>
          <span className="text-right">STATUS</span>
        </div>

        <div className="divide-y" style={{ divideColor: 'var(--border)' }}>
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              No players found
            </div>
          ) : (
            filtered.map(player => (
              <PlayerRow key={player.id} player={player} theme={theme} onToggle={onCheckIn} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerRow({ player, theme, onToggle }: { player: Player; theme: GameTheme; onToggle: (id: string, v: boolean) => void }) {
  const [hovering, setHovering] = useState(false);

  return (
    <div
      className="grid items-center px-4 py-2.5 transition-all duration-100"
      style={{
        gridTemplateColumns: '40px 1fr 120px 100px 100px 80px',
        background: hovering ? `${theme.primaryColor}06` : 'transparent',
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <span className="text-xs tabular-nums opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        {player.seed}
      </span>

      <div>
        <div className="text-sm" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--foreground)' }}>
          {player.tag}
        </div>
        <div className="text-xs opacity-40" style={{ fontFamily: 'Inter, sans-serif' }}>
          {player.realName}
        </div>
      </div>

      <span className="text-xs" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--muted-foreground)' }}>
        {player.character}
      </span>

      <span className="text-sm">
        {player.countryFlag} <span className="text-xs opacity-50" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{player.country}</span>
      </span>

      <div className="flex items-center gap-1">
        <Smartphone size={11} className="opacity-30" />
        <span className="text-xs opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
          {player.smsNotified ? 'notified' : '...'}
        </span>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => onToggle(player.id, !player.checkedIn)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs tracking-wider transition-all"
          style={{
            background: player.checkedIn ? 'rgba(0,255,136,0.1)' : 'rgba(255,23,68,0.1)',
            border: `1px solid ${player.checkedIn ? 'rgba(0,255,136,0.3)' : 'rgba(255,23,68,0.3)'}`,
            color: player.checkedIn ? '#00FF88' : '#FF1744',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {player.checkedIn
            ? <><CheckCircle2 size={11} /> IN</>
            : <><XCircle size={11} /> OUT</>
          }
        </button>
      </div>
    </div>
  );
}
