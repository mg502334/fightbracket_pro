import { useState, useEffect, useRef } from "react";
import { Search, CheckCircle2, XCircle, Smartphone, Trash2, UserPlus, Loader2 } from "lucide-react";
import type { Player, GameTheme } from "../data/tournamentData";
import { motion, AnimatePresence } from "motion/react";

interface CheckInPanelProps {
  players: Player[];
  theme: GameTheme;
  onCheckIn: (playerId: string, checked: boolean) => void;
  onRemovePlayer?: (playerId: string) => void;
  onAddPlayer?: (playerData: { tag: string; realName: string; seed: number; character?: string; fbUserId?: string }) => void;
  isCustomTournament?: boolean;
  supabaseToken?: string | null;
}

type FilterMode = 'all' | 'checked' | 'unchecked';

export function CheckInPanel({ players, theme, onCheckIn, onRemovePlayer, onAddPlayer, isCustomTournament, supabaseToken }: CheckInPanelProps) {
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
  const pct = players.length > 0 ? Math.round((checkedCount / players.length) * 100) : 0;

  // Registration form state
  const [regTag, setRegTag] = useState('');
  const [regName, setRegName] = useState('');
  const [regChar, setRegChar] = useState('');
  const [regFbUserId, setRegFbUserId] = useState<string | null>(null);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!regTag.trim() || regFbUserId) {
      setUserSearchResults([]);
      setShowUserDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const headers: Record<string, string> = {};
        if (supabaseToken) headers['Authorization'] = `Bearer ${supabaseToken}`;
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(regTag)}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setUserSearchResults(data.users || []);
          setShowUserDropdown((data.users || []).length > 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [regTag, regFbUserId, supabaseToken]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regTag.trim() || !onAddPlayer) return;
    onAddPlayer({
      tag: regTag.trim(),
      realName: regName.trim(),
      character: regChar.trim(),
      fbUserId: regFbUserId || undefined,
      seed: players.length + 1
    });
    setRegTag('');
    setRegName('');
    setRegChar('');
    setRegFbUserId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Registration Form (Only for Custom Tournaments) */}
      {isCustomTournament && onAddPlayer && (
        <form onSubmit={handleRegister} className="rounded p-4 flex flex-col gap-3" style={{ background: 'var(--card)', border: `1px solid ${theme.primaryColor}40` }}>
          <div className="flex items-center gap-2 mb-1">
            <UserPlus size={16} style={{ color: theme.primaryColor }} />
            <span className="text-sm tracking-widest font-bold" style={{ fontFamily: 'Rajdhani, sans-serif', color: theme.primaryColor }}>
              REGISTER PLAYER
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative" ref={dropdownRef}>
              <input
                value={regTag}
                onChange={e => { setRegTag(e.target.value); setRegFbUserId(null); }}
                placeholder="Gamertag *"
                required
                className="w-full px-3 py-2 rounded text-sm outline-none transition-all"
                style={{ background: 'var(--sidebar)', border: `1px solid ${regFbUserId ? '#00FF88' : 'rgba(122,158,192,0.2)'}`, color: 'var(--foreground)' }}
              />
              {isSearchingUsers && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin opacity-50" />}
              
              <AnimatePresence>
                {showUserDropdown && userSearchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute z-10 w-full mt-1 rounded shadow-lg overflow-hidden border"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                  >
                    {userSearchResults.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors flex items-center justify-between"
                        onClick={() => {
                          setRegTag(u.gamer_tag);
                          setRegFbUserId(u.unique_id);
                          setShowUserDropdown(false);
                        }}
                      >
                        <span className="font-bold">{u.gamer_tag}</span>
                        <span className="text-xs opacity-50 font-mono">{u.unique_id}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <input
              value={regName}
              onChange={e => setRegName(e.target.value)}
              placeholder="Name (Optional)"
              className="flex-1 px-3 py-2 rounded text-sm outline-none transition-all"
              style={{ background: 'var(--sidebar)', border: '1px solid rgba(122,158,192,0.2)', color: 'var(--foreground)' }}
            />
            <input
              value={regChar}
              onChange={e => setRegChar(e.target.value)}
              placeholder="Character (Optional)"
              className="flex-1 px-3 py-2 rounded text-sm outline-none transition-all"
              style={{ background: 'var(--sidebar)', border: '1px solid rgba(122,158,192,0.2)', color: 'var(--foreground)' }}
            />
            <button
              type="submit"
              disabled={!regTag.trim()}
              className="px-6 py-2 rounded text-sm font-bold tracking-wider disabled:opacity-50 transition-colors shrink-0"
              style={{ background: theme.primaryColor, color: '#050A14', fontFamily: 'Rajdhani, sans-serif' }}
            >
              ADD
            </button>
          </div>
        </form>
      )}

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

        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              No players found
            </div>
          ) : (
            filtered.map(player => (
              <PlayerRow key={player.id} player={player} theme={theme} onToggle={onCheckIn} onRemove={isCustomTournament ? onRemovePlayer : undefined} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerRow({ player, theme, onToggle, onRemove }: { player: Player; theme: GameTheme; onToggle: (id: string, v: boolean) => void; onRemove?: (id: string) => void }) {
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

      <div className="flex justify-end gap-2 items-center">
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
            : <><XCircle size={11} /> ABSENT</>
          }
        </button>
        {onRemove && (
          <button 
            onClick={() => onRemove(player.id)}
            className="p-1 rounded text-white/30 hover:text-red-500 hover:bg-white/5 transition-all"
            title="Remove Player"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
