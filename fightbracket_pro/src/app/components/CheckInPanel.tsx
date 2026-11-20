import { useState, useEffect, useRef } from "react";
import { Search, CheckCircle2, XCircle, Smartphone, Trash2, UserPlus, Loader2, Shuffle, ArrowUpDown, Monitor, Hash, Lock, GripVertical } from "lucide-react";
import type { Player, GameTheme, Station } from "../data/tournamentData";
import { motion, AnimatePresence } from "motion/react";

interface CheckInPanelProps {
  players: Player[];
  theme: GameTheme;
  stations?: Station[];
  onCheckIn: (playerId: string, checked: boolean) => void;
  onRemovePlayer?: (playerId: string) => void;
  onAddPlayer?: (playerData: { tag: string; realName: string; seed: number; character?: string; fbUserId?: string }) => void;
  onOpenAddPlayer?: () => void;
  onUpdateSeed?: (playerId: string, newSeed: number) => void;
  onUpdatePlayerStation?: (playerId: string, stationId: number | null) => void;
  onAutoSeed?: (mode: 'checked-in' | 'random' | 'tag') => void;
  onSwapSeeds?: (player1Id: string, player2Id: string) => void;
  isCustomTournament?: boolean;
  isTournamentStarted?: boolean;
  supabaseToken?: string | null;
}

type FilterMode = 'all' | 'checked' | 'unchecked';

export function CheckInPanel({ 
  players, 
  theme, 
  stations,
  onCheckIn, 
  onRemovePlayer, 
  onAddPlayer, 
  onOpenAddPlayer,
  onUpdateSeed,
  onUpdatePlayerStation,
  onAutoSeed,
  onSwapSeeds,
  isCustomTournament,
  isTournamentStarted,
  supabaseToken 
}: CheckInPanelProps) {
  const isSeedsLocked = !isCustomTournament || Boolean(isTournamentStarted);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sortBy, setSortBy] = useState<'seed' | 'tag' | 'status'>('seed');

  const filtered = players.filter(p => {
    const matchSearch = p.tag.toLowerCase().includes(search.toLowerCase()) ||
      p.realName.toLowerCase().includes(search.toLowerCase()) ||
      p.character.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'checked' ? p.checkedIn : !p.checkedIn);
    return matchSearch && matchFilter;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'seed') return a.seed - b.seed;
    if (sortBy === 'tag') return a.tag.localeCompare(b.tag);
    if (sortBy === 'status') return (b.checkedIn ? 1 : 0) - (a.checkedIn ? 1 : 0) || a.seed - b.seed;
    return 0;
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

      {/* Flexible Seeding & Seating Toolbar */}
      <div className="flex flex-col gap-2.5 p-3 rounded text-xs" style={{ background: 'var(--card)', border: '1px solid rgba(122,158,192,0.15)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Hash size={14} style={{ color: theme.primaryColor }} />
            <span className="font-mono text-xs uppercase tracking-wider font-bold" style={{ color: theme.primaryColor }}>
              SEEDING & SEATING CONTROLS
            </span>
            {isSeedsLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                <Lock size={10} />
                {!isCustomTournament ? 'Start.gg Locked' : 'Tournament In Progress (Locked)'}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 mr-2">
              <span className="text-[11px] font-mono text-gray-400">Sort:</span>
              {(['seed', 'tag', 'status'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-2 py-1 rounded font-mono text-[10px] uppercase transition-all ${
                    sortBy === s ? 'bg-cyan-500/20 text-[#00E5FF] border border-cyan-500/40' : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

          {!isSeedsLocked && onAutoSeed && (
            <>
              <button
                onClick={() => onAutoSeed('checked-in')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded font-mono text-[11px] bg-white/5 border border-white/10 hover:border-[#00E5FF]/50 hover:text-[#00E5FF] transition-all cursor-pointer"
                title="Seed checked-in players 1 through N, then remaining players"
              >
                <Hash size={12} />
                <span>Auto-Seed</span>
              </button>
              <button
                onClick={() => onAutoSeed('random')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded font-mono text-[11px] bg-white/5 border border-white/10 hover:border-amber-400/50 hover:text-amber-400 transition-all cursor-pointer"
                title="Randomize player seeds for open brackets"
              >
                <Shuffle size={12} />
                <span>Shuffle Seeds</span>
              </button>
              <button
                onClick={() => onAutoSeed('tag')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded font-mono text-[11px] bg-white/5 border border-white/10 hover:border-purple-400/50 hover:text-purple-400 transition-all cursor-pointer"
                title="Seed alphabetically by gamer tag"
              >
                <ArrowUpDown size={12} />
                <span>Seed A-Z</span>
              </button>
            </>
          )}

          {isCustomTournament && !isTournamentStarted && (onOpenAddPlayer || onAddPlayer) && (
            <button
              onClick={() => onOpenAddPlayer ? onOpenAddPlayer() : undefined}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[11px] font-bold tracking-wider transition-all cursor-pointer shadow-md"
              style={{
                background: theme.primaryColor,
                color: '#050A14',
                boxShadow: `0 0 10px ${theme.primaryColor}50`
              }}
            >
              <UserPlus size={13} />
              <span>+ ADD PLAYER</span>
            </button>
          )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-400 border-t border-white/5 pt-2">
          <span className="text-[#00E5FF] font-bold">Rule Note:</span>
          <span>
            {isSeedsLocked
              ? (!isCustomTournament
                  ? 'Start.gg imported seeds are fixed and non-adjustable to match external tournament brackets.'
                  : 'Seeds are locked while the tournament is underway. Restart the tournament from Bracket View to unlock and adjust.')
              : 'Seeds are strictly 1-to-1 unique. Drag and drop rows or edit seed numbers to hotswap seeds before tournament begins.'}
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
            gridTemplateColumns: isSeedsLocked ? '70px 1fr 110px 125px 85px 80px' : '28px 65px 1fr 110px 125px 85px 80px',
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--muted-foreground)',
            background: 'var(--sidebar)',
            borderBottom: '1px solid rgba(122,158,192,0.1)',
          }}
        >
          {!isSeedsLocked && <span></span>}
          <span>SEED</span>
          <span>PLAYER</span>
          <span>CHARACTER</span>
          <span>SEAT / SETUP</span>
          <span>NOTIFY</span>
          <span className="text-right">STATUS</span>
        </div>

        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {sorted.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="p-3 rounded-full bg-white/5 border border-white/10 text-gray-400">
                <UserPlus size={24} style={{ color: theme.primaryColor }} />
              </div>
              <div>
                <div className="text-sm font-bold text-white font-mono">NO PLAYERS FOUND</div>
                <div className="text-xs text-gray-500 font-mono mt-1">
                  {search ? 'No players matched your search filter.' : 'Add your first tournament competitor to begin check-in and seeding.'}
                </div>
              </div>
              {isCustomTournament && (onOpenAddPlayer || onAddPlayer) && !search && (
                <button
                  onClick={() => onOpenAddPlayer ? onOpenAddPlayer() : undefined}
                  className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer"
                  style={{ background: theme.primaryColor, color: '#050A14', boxShadow: `0 0 12px ${theme.primaryColor}40` }}
                >
                  <UserPlus size={14} />
                  <span>+ Add First Player</span>
                </button>
              )}
            </div>
          ) : (
            sorted.map(player => (
              <PlayerRow 
                key={player.id} 
                player={player} 
                theme={theme} 
                stations={stations}
                isSeedsLocked={isSeedsLocked}
                onToggle={onCheckIn} 
                onUpdateSeed={isSeedsLocked ? undefined : onUpdateSeed}
                onUpdatePlayerStation={onUpdatePlayerStation}
                onSwapSeeds={isSeedsLocked ? undefined : onSwapSeeds}
                onRemove={isCustomTournament && !isTournamentStarted ? onRemovePlayer : undefined} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerRow({ 
  player, 
  theme, 
  stations,
  isSeedsLocked,
  onToggle, 
  onUpdateSeed,
  onUpdatePlayerStation,
  onSwapSeeds,
  onRemove 
}: { 
  player: Player; 
  theme: GameTheme; 
  stations?: Station[];
  isSeedsLocked?: boolean;
  onToggle: (id: string, v: boolean) => void; 
  onUpdateSeed?: (id: string, seed: number) => void;
  onUpdatePlayerStation?: (id: string, stationId: number | null) => void;
  onSwapSeeds?: (p1Id: string, p2Id: string) => void;
  onRemove?: (id: string) => void;
}) {
  const [hovering, setHovering] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [seedInput, setSeedInput] = useState<string>(String(player.seed));

  useEffect(() => {
    setSeedInput(String(player.seed));
  }, [player.seed]);

  const commitSeed = () => {
    const val = parseInt(seedInput, 10);
    if (!isNaN(val) && val >= 1) {
      if (val !== player.seed && onUpdateSeed) {
        onUpdateSeed(player.id, val);
      }
    } else {
      setSeedInput(String(player.seed));
    }
  };

  return (
    <div
      draggable={!isSeedsLocked}
      onDragStart={(e) => {
        if (isSeedsLocked) return;
        e.dataTransfer.setData('text/plain', player.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => {
        if (isSeedsLocked) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!isDragOver) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        if (isSeedsLocked) return;
        e.preventDefault();
        setIsDragOver(false);
        const sourceId = e.dataTransfer.getData('text/plain');
        if (sourceId && sourceId !== player.id && onSwapSeeds) {
          onSwapSeeds(sourceId, player.id);
        }
      }}
      className={`grid items-center px-4 py-2.5 transition-all duration-100 ${
        isDragOver ? 'bg-cyan-500/20 ring-2 ring-cyan-400 ring-inset' : hovering ? `${theme.primaryColor}06` : 'transparent'
      }`}
      style={{
        gridTemplateColumns: isSeedsLocked ? '70px 1fr 110px 125px 85px 80px' : '28px 65px 1fr 110px 125px 85px 80px',
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {!isSeedsLocked && (
        <div className="flex items-center text-gray-500 hover:text-cyan-400 cursor-grab active:cursor-grabbing" title="Drag to reorder/swap seeds">
          <GripVertical size={14} />
        </div>
      )}

      <div className="flex items-center">
        {!isSeedsLocked && onUpdateSeed ? (
          <input
            type="number"
            min="1"
            max="999"
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            onBlur={commitSeed}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitSeed();
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="w-12 px-1.5 py-0.5 rounded text-xs tabular-nums text-center font-mono font-bold bg-black/40 border border-white/15 focus:border-[#00E5FF] focus:outline-none transition-all text-white"
            title="Click to change seed (hotswaps duplicate seeds)"
          />
        ) : (
          <span className="flex items-center gap-1 text-xs tabular-nums opacity-80 font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            #{player.seed}
            {isSeedsLocked && <Lock size={10} className="text-amber-400" />}
          </span>
        )}
      </div>

      <div>
        <div className="text-sm flex items-center gap-1.5" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--foreground)' }}>
          <span>{player.tag}</span>
          {player.countryFlag && <span className="text-xs">{player.countryFlag}</span>}
        </div>
        <div className="text-xs opacity-40" style={{ fontFamily: 'Inter, sans-serif' }}>
          {player.realName || player.country}
        </div>
      </div>

      <span className="text-xs truncate pr-2" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--muted-foreground)' }}>
        {player.character || '—'}
      </span>

      {/* Flexible Seating / Station Selector */}
      <div className="pr-2">
        <select
          value={player.stationId ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
            onUpdatePlayerStation?.(player.id, val);
          }}
          className="w-full text-[11px] font-mono bg-black/40 border border-white/10 rounded px-1.5 py-1 text-gray-300 focus:outline-none focus:border-[#00E5FF]"
          title="Flexible station/seat assignment before bracket starts"
        >
          <option value="">Unassigned</option>
          {stations?.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

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
