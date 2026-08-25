import React, { useState, useEffect } from 'react';
import { Trophy, ExternalLink, RefreshCw, Swords, Shield, Award, Sparkles, MapPin, Check, Filter } from 'lucide-react';
import { GAME_COVERS } from '../data/gameCovers';

export interface StartggCareerData {
  slug: string;
  gamer_tag: string;
  prefix: string;
  avatar_url?: string;
  location?: string;
  total_tournaments: number;
  total_sets: number;
  total_wins: number;
  total_losses: number;
  win_rate_pct: number;
  avg_seed: number;
  avg_placement: number;
  first_place_count: number;
  podium_count: number;
  top8_count: number;
  pro_tier: {
    code: string;
    title: string;
    color: string;
  };
  game_breakdown: Array<{
    game_name: string;
    tournaments_count: number;
    avg_placement: number;
    avg_seed: number;
    first_places: number;
    top8s: number;
  }>;
  tournaments_history: Array<{
    tournament_name: string;
    tournament_slug: string;
    event_name: string;
    game_name: string;
    placement: number | string;
    seed: number | string;
    num_entrants: number | string;
    date: string;
  }>;
}

interface StartggCareerPanelProps {
  startggSlug?: string;
  token?: string;
  onImportBracket?: (slug: string) => Promise<void>;
  compact?: boolean;
}

export function StartggCareerPanel({ startggSlug, token, onImportBracket, compact = false }: StartggCareerPanelProps) {
  const [careerData, setCareerData] = useState<StartggCareerData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('ALL');
  const [importingSlug, setImportingSlug] = useState<string | null>(null);
  const [importedSlugs, setImportedSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!startggSlug) return;
    setLoading(true);
    setError(null);

    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    fetch(`/api/users/startgg-career/${encodeURIComponent(startggSlug)}${tokenParam}`)
      .then(res => {
        if (!res.ok) throw new Error('Start.gg career profile not found');
        return res.json();
      })
      .then(data => {
        if (data.career) {
          setCareerData(data.career);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [startggSlug, token]);

  if (!startggSlug) return null;

  if (loading) {
    return (
      <div className="bg-[#0A1220] border border-cyan-500/30 rounded-2xl p-6 text-center space-y-3 animate-pulse">
        <RefreshCw size={24} className="mx-auto text-cyan-400 animate-spin opacity-80" />
        <div className="text-xs font-mono text-cyan-400 tracking-wider">FETCHING START.GG CAREER ANALYTICS...</div>
      </div>
    );
  }

  if (error || !careerData) {
    return (
      <div className="bg-[#0A1220]/50 border border-white/10 rounded-xl p-4 text-center text-xs font-mono opacity-60">
        Start.gg career stats unavailable for "{startggSlug}".
      </div>
    );
  }

  const { pro_tier } = careerData;
  const filteredHistory = selectedGameFilter === 'ALL'
    ? careerData.tournaments_history
    : careerData.tournaments_history.filter(t => t.game_name.toLowerCase().includes(selectedGameFilter.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Career Pro Ranking Tier Banner */}
      <div
        className="relative overflow-hidden rounded-2xl border p-6 transition-all"
        style={{
          background: `linear-gradient(135deg, ${pro_tier.color}15 0%, #050A14 100%)`,
          borderColor: `${pro_tier.color}40`,
          boxShadow: `0 0 30px ${pro_tier.color}15`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            {careerData.avatar_url ? (
              <img src={careerData.avatar_url} alt="Avatar" className="w-12 h-12 rounded-xl object-cover border-2 shadow-lg" style={{ borderColor: pro_tier.color }} />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border-2 shadow-lg"
                style={{ background: `${pro_tier.color}20`, color: pro_tier.color, borderColor: pro_tier.color }}
              >
                <Trophy size={22} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono opacity-50 uppercase tracking-widest">{careerData.prefix}</span>
                <span className="text-xl font-bold font-rajdhani text-white">{careerData.gamer_tag}</span>
              </div>
              {careerData.location && (
                <div className="text-[11px] font-mono text-cyan-400/80 flex items-center gap-1 mt-0.5">
                  <MapPin size={10} /> {careerData.location}
                </div>
              )}
            </div>
          </div>

          {/* Pro Tier Badge */}
          <div className="flex items-center gap-3">
            <div
              className="px-3 py-1.5 rounded-xl border text-xs font-mono font-bold tracking-widest shadow-lg flex items-center gap-2"
              style={{
                color: pro_tier.color,
                borderColor: `${pro_tier.color}60`,
                background: `${pro_tier.color}15`,
                filter: `drop-shadow(0 0 8px ${pro_tier.color})`,
              }}
            >
              <Sparkles size={14} />
              <span>{pro_tier.title}</span>
            </div>
            <a
              href={`https://start.gg/user/${careerData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl border border-white/10 hover:border-white/30 text-white/60 hover:text-white transition-colors bg-white/5"
              title="Open Start.gg Profile"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {/* Core Career Stat Counters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-mono opacity-50 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Swords size={12} className="text-cyan-400" /> CAREER RECORD
            </div>
            <div className="text-lg font-bold font-rajdhani text-white">
              {careerData.total_wins}W - {careerData.total_losses}L
            </div>
            <div className="text-[11px] font-mono text-emerald-400 font-bold mt-0.5">
              {careerData.win_rate_pct}% Win Rate
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-mono opacity-50 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Shield size={12} className="text-purple-400" /> AVERAGE SEED
            </div>
            <div className="text-lg font-bold font-rajdhani text-purple-300">
              #{careerData.avg_seed || 'N/A'}
            </div>
            <div className="text-[11px] font-mono opacity-50 mt-0.5">
              Across Brackets
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-mono opacity-50 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Trophy size={12} className="text-amber-400" /> AVG PLACEMENT
            </div>
            <div className="text-lg font-bold font-rajdhani text-amber-300">
              {careerData.avg_placement ? `${careerData.avg_placement}th` : 'N/A'}
            </div>
            <div className="text-[11px] font-mono opacity-50 mt-0.5">
              Tournaments
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-mono opacity-50 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Award size={12} className="text-emerald-400" /> PODIUMS & TOP 8s
            </div>
            <div className="text-lg font-bold font-rajdhani text-emerald-300">
              {careerData.first_place_count}🥇 · {careerData.podium_count}🥉
            </div>
            <div className="text-[11px] font-mono opacity-50 mt-0.5">
              {careerData.top8_count} Top 8 Finishes
            </div>
          </div>
        </div>
      </div>

      {/* Game Breakdown Stats & Filters */}
      {careerData.game_breakdown.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono font-bold tracking-wider uppercase opacity-70 flex items-center gap-1.5">
              <Filter size={12} className="text-cyan-400" /> GAME BREAKDOWN & FILTERS
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setSelectedGameFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                  selectedGameFilter === 'ALL'
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                    : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                }`}
              >
                ALL ({careerData.total_tournaments})
              </button>
              {careerData.game_breakdown.map(g => (
                <button
                  key={g.game_name}
                  onClick={() => setSelectedGameFilter(g.game_name)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                    selectedGameFilter === g.game_name
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                      : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {g.game_name.toUpperCase()} ({g.tournaments_count})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {careerData.game_breakdown.map(g => {
              const coverUrl = GAME_COVERS[g.game_name];
              return (
                <div key={g.game_name} className="flex items-center gap-3 p-3 rounded-xl bg-[#0A1220] border border-white/10">
                  <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black/40">
                    {coverUrl ? (
                      <img src={coverUrl} alt={g.game_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Trophy size={16} className="opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-rajdhani font-bold text-sm text-white truncate">{g.game_name}</div>
                    <div className="text-[11px] font-mono text-cyan-400/80 mt-0.5">
                      {g.tournaments_count} Tournaments · Avg #{g.avg_placement || 'N/A'}
                    </div>
                    <div className="text-[10px] font-mono opacity-50 mt-1">
                      Avg Seed: #{g.avg_seed || 'N/A'} · Top 8s: {g.top8s}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Start.gg Recent Tournaments Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono font-bold tracking-wider uppercase opacity-70 flex items-center gap-1.5">
            <Trophy size={14} className="text-amber-400" /> START.GG TOURNAMENT HISTORY
          </div>
          <div className="text-[11px] font-mono opacity-40">
            {filteredHistory.length} Tournaments
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {filteredHistory.length === 0 ? (
            <div className="p-4 text-center text-xs font-mono opacity-40 bg-white/5 rounded-xl">
              No tournaments match selected game filter.
            </div>
          ) : (
            filteredHistory.map((t, idx) => {
              const isFirst = String(t.placement) === '1';
              const isPodium = !isFirst && ['2', '3'].includes(String(t.placement));

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/10 transition-colors gap-3 hover:border-white/20"
                  style={{
                    background: isFirst ? 'rgba(245,158,11,0.08)' : isPodium ? 'rgba(255,255,255,0.03)' : 'rgba(5,10,20,0.6)',
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm font-rajdhani text-white truncate flex items-center gap-1.5">
                      {isFirst && <Trophy size={14} className="text-amber-400 shrink-0" />}
                      <span className="truncate">{t.tournament_name}</span>
                    </div>
                    <div className="text-[11px] font-mono text-cyan-400/80 truncate mt-0.5">
                      {t.event_name} · <span className="opacity-60">{t.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className={`font-rajdhani font-bold text-lg leading-none ${isFirst ? 'text-amber-400' : isPodium ? 'text-slate-300' : 'text-white/80'}`}>
                        {t.placement}<span className="text-[10px] font-mono opacity-50 ml-0.5">th</span>
                      </div>
                      <div className="text-[10px] font-mono opacity-40 mt-0.5">
                        Seed #{t.seed}
                      </div>
                    </div>

                    {onImportBracket && t.tournament_slug && (
                      <button
                        onClick={() => {
                          if (t.tournament_slug && !importedSlugs.has(t.tournament_slug)) {
                            setImportingSlug(t.tournament_slug);
                            onImportBracket(t.tournament_slug).then(() => {
                              setImportedSlugs(prev => new Set([...prev, t.tournament_slug]));
                            }).finally(() => setImportingSlug(null));
                          }
                        }}
                        disabled={importingSlug === t.tournament_slug || importedSlugs.has(t.tournament_slug)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                          importedSlugs.has(t.tournament_slug)
                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                            : 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20'
                        }`}
                        title={importedSlugs.has(t.tournament_slug) ? "Added to Library" : "Import Bracket to FightBracket PRO"}
                      >
                        {importingSlug === t.tournament_slug ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : importedSlugs.has(t.tournament_slug) ? (
                          <Check size={12} />
                        ) : (
                          <Swords size={12} />
                        )}
                        <span>{importedSlugs.has(t.tournament_slug) ? 'ADDED' : 'IMPORT'}</span>
                      </button>
                    )}
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

export default StartggCareerPanel;
