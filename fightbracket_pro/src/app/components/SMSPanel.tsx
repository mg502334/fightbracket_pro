import { useState } from "react";
import { Send, Smartphone, CheckCircle2, AlertCircle, Clock, MessageSquare, Zap } from "lucide-react";
import type { Player, BracketMatch, GameTheme, SMSLog } from "../data/tournamentData";

interface SMSPanelProps {
  players: Player[];
  matches: BracketMatch[];
  theme: GameTheme;
  smsLogs: SMSLog[];
  onSendSMS: (playerIds: string[], message: string, matchId?: string) => void;
}

const TEMPLATES = [
  {
    id: 'match_call',
    label: 'MATCH CALLED',
    message: (tag: string, round: string, station: number, game: string) =>
      `[${game}] ${tag}, your ${round} match has been called! Report to Station ${station} immediately. — CLASH OF KINGS VII`,
  },
  {
    id: 'checkin_reminder',
    label: 'CHECK-IN REMINDER',
    message: (tag: string) =>
      `${tag}, you have NOT checked in for CLASH OF KINGS VII. Please check in at the registration desk NOW or you will be DQ'd.`,
  },
  {
    id: 'next_match',
    label: 'NEXT MATCH SOON',
    message: (tag: string, round: string, game: string) =>
      `[${game}] ${tag}, your ${round} match is coming up soon. Please be ready near the station area.`,
  },
  {
    id: 'custom',
    label: 'CUSTOM MESSAGE',
    message: () => '',
  },
];

export function SMSPanel({ players, matches, theme, smsLogs, onSendSMS }: SMSPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('match_call');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [customMsg, setCustomMsg] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));
  const filteredPlayers = players.filter(p =>
    p.tag.toLowerCase().includes(search.toLowerCase()) ||
    p.realName.toLowerCase().includes(search.toLowerCase())
  );

  function togglePlayer(id: string) {
    setSelectedPlayers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function selectAll() {
    setSelectedPlayers(filteredPlayers.map(p => p.id));
  }

  function selectUncheckedIn() {
    setSelectedPlayers(players.filter(p => !p.checkedIn).map(p => p.id));
  }

  async function handleSend() {
    if (selectedPlayers.length === 0) return;
    setSending(true);
    const msg = selectedTemplate === 'custom'
      ? customMsg
      : `Tournament notification for ${selectedPlayers.length} player(s). [CLASH OF KINGS VII]`;
    await new Promise(r => setTimeout(r, 800));
    onSendSMS(selectedPlayers, msg);
    setSelectedPlayers([]);
    setSending(false);
  }

  const totalSent = smsLogs.length;
  const delivered = smsLogs.filter(l => l.status === 'delivered').length;
  const failed = smsLogs.filter(l => l.status === 'failed').length;

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 380px' }}>
      {/* Left: Compose */}
      <div className="flex flex-col gap-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<Send size={14} />} label="TOTAL SENT" value={totalSent} color="#00E5FF" />
          <StatCard icon={<CheckCircle2 size={14} />} label="DELIVERED" value={delivered} color="#00FF88" />
          <StatCard icon={<AlertCircle size={14} />} label="FAILED" value={failed} color="#FF1744" />
        </div>

        {/* Template selection */}
        <div className="rounded p-4" style={{ background: 'var(--card)', border: '1px solid rgba(122,158,192,0.12)' }}>
          <div className="text-xs tracking-widest mb-3" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)' }}>
            MESSAGE TEMPLATE
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className="px-3 py-2 rounded text-xs tracking-wider text-left transition-all"
                style={{
                  background: selectedTemplate === t.id ? `${theme.primaryColor}20` : 'var(--sidebar)',
                  border: `1px solid ${selectedTemplate === t.id ? `${theme.primaryColor}50` : 'var(--border)'}`,
                  color: selectedTemplate === t.id ? theme.primaryColor : 'var(--muted-foreground)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {selectedTemplate === 'custom' && (
            <div className="mt-3">
              <textarea
                value={customMsg}
                onChange={e => setCustomMsg(e.target.value)}
                placeholder="Type your custom message..."
                rows={3}
                className="w-full px-3 py-2 rounded text-sm resize-none outline-none"
                style={{
                  background: 'var(--sidebar)',
                  border: `1px solid ${theme.primaryColor}30`,
                  color: 'var(--foreground)',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
              <div className="text-right mt-1 text-xs opacity-30" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {customMsg.length} / 160 chars
              </div>
            </div>
          )}
        </div>

        {/* Recipient selection */}
        <div className="rounded overflow-hidden" style={{ background: 'var(--card)', border: '1px solid rgba(122,158,192,0.12)' }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <Smartphone size={13} style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-xs tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)' }}>
                RECIPIENTS ({selectedPlayers.length})
              </span>
            </div>
            <div className="flex gap-2">
              <QuickBtn label="ALL" onClick={selectAll} theme={theme} />
              <QuickBtn label="NOT CHECKED IN" onClick={selectUncheckedIn} theme={theme} />
              <QuickBtn label="CLEAR" onClick={() => setSelectedPlayers([])} theme={theme} dimmed />
            </div>
          </div>

          <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search players..."
              className="w-full px-3 py-1.5 rounded text-sm outline-none"
              style={{ background: 'var(--sidebar)', border: '1px solid rgba(122,158,192,0.1)', color: 'var(--foreground)', fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
            {filteredPlayers.map(player => (
              <label
                key={player.id}
                className="flex items-center gap-3 px-4 py-2 cursor-pointer transition-all hover:bg-white/5"
                style={{ borderBottom: '1px solid rgba(122,158,192,0.05)' }}
              >
                <input
                  type="checkbox"
                  checked={selectedPlayers.includes(player.id)}
                  onChange={() => togglePlayer(player.id)}
                  className="w-3.5 h-3.5 rounded"
                  style={{ accentColor: theme.primaryColor }}
                />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, color: 'var(--foreground)' }}>
                    {player.countryFlag} {player.tag}
                  </span>
                  {!player.checkedIn && (
                    <span className="text-xs px-1.5 rounded" style={{ background: 'rgba(255,23,68,0.1)', color: '#FF1744', fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>
                      NOT IN
                    </span>
                  )}
                </div>
                <span className="text-xs opacity-30" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                  {player.phone}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={selectedPlayers.length === 0 || sending}
          className="flex items-center justify-center gap-2 py-3 rounded tracking-widest transition-all disabled:opacity-40"
          style={{
            background: `linear-gradient(135deg, ${theme.primaryColor}30, ${theme.primaryColor}15)`,
            border: `1px solid ${theme.primaryColor}50`,
            color: theme.primaryColor,
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            fontSize: 15,
            boxShadow: selectedPlayers.length > 0 ? `0 0 20px ${theme.glowColor}` : 'none',
          }}
        >
          {sending ? (
            <><Zap size={16} className="animate-pulse" /> SENDING...</>
          ) : (
            <><Send size={16} /> SEND TO {selectedPlayers.length} PLAYER{selectedPlayers.length !== 1 ? 'S' : ''}</>
          )}
        </button>
      </div>

      {/* Right: SMS Log */}
      <div className="rounded overflow-hidden" style={{ background: 'var(--card)', border: '1px solid rgba(122,158,192,0.12)' }}>
        <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--sidebar)' }}>
          <MessageSquare size={13} style={{ color: 'var(--muted-foreground)' }} />
          <span className="text-xs tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)' }}>
            MESSAGE LOG
          </span>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 500 }}>
          {smsLogs.length === 0 ? (
            <div className="py-12 text-center text-xs opacity-20" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              No messages sent yet
            </div>
          ) : (
            [...smsLogs].reverse().map(log => {
              const player = playerMap[log.playerId];
              return (
                <div
                  key={log.id}
                  className="px-4 py-3 border-b transition-all"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--foreground)' }}>
                      {player?.countryFlag} {player?.tag ?? 'Unknown'}
                    </span>
                    <StatusBadge status={log.status} />
                  </div>
                  <div className="text-xs opacity-50 mb-1 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {log.message}
                  </div>
                  <div className="text-xs opacity-30" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                    {log.sentAt.toLocaleTimeString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded p-3" style={{ background: 'var(--card)', border: '1px solid rgba(122,158,192,0.1)' }}>
      <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--muted-foreground)' }}>
        {icon}
        <span className="text-xs tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{label}</span>
      </div>
      <div className="text-2xl" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function QuickBtn({ label, onClick, theme, dimmed }: { label: string; onClick: () => void; theme: GameTheme; dimmed?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-0.5 rounded text-xs tracking-wider transition-all hover:opacity-80"
      style={{
        background: dimmed ? 'rgba(255,23,68,0.08)' : `${theme.primaryColor}12`,
        border: `1px solid ${dimmed ? 'rgba(255,23,68,0.2)' : `${theme.primaryColor}25`}`,
        color: dimmed ? '#FF1744' : theme.primaryColor,
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: SMSLog['status'] }) {
  const cfg = {
    sent: { color: '#FFD600', icon: Clock },
    delivered: { color: '#00FF88', icon: CheckCircle2 },
    failed: { color: '#FF1744', icon: AlertCircle },
  }[status];
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-1" style={{ color: cfg.color }}>
      <Icon size={11} />
      <span className="text-xs tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{status.toUpperCase()}</span>
    </div>
  );
}
