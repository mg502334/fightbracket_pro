import React, { useState } from 'react';
import { Megaphone, Wrench, Sparkles, Calendar, ExternalLink, ChevronRight, Trophy, Gamepad2, Tag } from 'lucide-react';

interface NewsItem {
  id: string;
  type: 'update' | 'fix' | 'feature' | 'event' | 'sale';
  date: string;
  title: string;
  body: string;
  badge?: string;
  link?: string;
}

const NEWS_ITEMS: NewsItem[] = [
  {
    id: 'n0',
    type: 'feature',
    date: 'Aug 3, 2026',
    title: 'Start.gg Integration Overhaul & QoL Updates',
    body: 'Huge updates today! Start.gg imports now perfectly map Pools and visually order brackets logically. Stream URLs dynamically detect Twitch, YouTube, and TikTok and clearly display LIVE vs COMPLETED status. We also added persistent Custom Station Names that save to your profile, and improved Check-in tracking for no-show (ABSENT) participants in imported events.',
    badge: 'NEW',
  },
  {
    id: 'n1',
    type: 'feature',
    date: 'Aug 1, 2026',
    title: 'Home Page, News Feed & User Search Launched',
    body: 'FightBracket Pro now features a full home page with news, updates, and a searchable user directory. Find other players by their gamer tag or FB-ID.',
    badge: 'NEW',
  },
  {
    id: 'n2',
    type: 'feature',
    date: 'Aug 1, 2026',
    title: 'Tekken 8 Polaris ID Integration',
    body: 'You can now add your Tekken 8 Polaris ID to your profile. Future updates will pull live player stats and rankings directly into the app.',
    badge: 'NEW',
  },
  {
    id: 'n3',
    type: 'fix',
    date: 'Aug 1, 2026',
    title: 'FB-ID & Profile Dashboard Fixes',
    body: 'Resolved a database column mismatch that prevented your Unique FB-ID from showing on the dashboard. Users who had the issue will now see their identifier load correctly.',
  },
  {
    id: 'n4',
    type: 'fix',
    date: 'Aug 1, 2026',
    title: 'Forgot Password & CAPTCHA Fix',
    body: 'Removed the CAPTCHA requirement from the forgot password flow. Password reset emails now send immediately after entering your email address.',
  },
  {
    id: 'n5',
    type: 'update',
    date: 'Aug 1, 2026',
    title: 'Register Screen Visual Redesign',
    body: 'The login and register screens are now visually distinct. The register form uses a pink theme with a dedicated Confirm Password field to prevent typos.',
  },
  {
    id: 'n6',
    type: 'event',
    date: 'Upcoming',
    title: 'CEO 2026 — Community Event',
    body: 'Community Effort Orlando 2026 is coming up! Stay tuned for bracket imports and live station tracking support inside FightBracket Pro.',
    badge: 'EVENT',
    link: 'https://start.gg',
  },
  {
    id: 'n7',
    type: 'sale',
    date: 'Limited Time',
    title: 'Tekken 8 — DLC Character Sale',
    body: 'Tekken 8 Season Pass 2 characters are currently on sale on all major platforms. Pick up your new mains before the tournament season heats up.',
    badge: 'SALE',
    link: 'https://www.bandainamcoent.com/games/tekken-8',
  },
];

const TYPE_CONFIG = {
  update:  { icon: Megaphone,  color: '#00E5FF', bg: 'border-[#00E5FF]/20', label: 'UPDATE' },
  fix:     { icon: Wrench,     color: '#00FF88', bg: 'border-[#00FF88]/20', label: 'FIX' },
  feature: { icon: Sparkles,   color: '#a78bfa', bg: 'border-[#a78bfa]/20', label: 'FEATURE' },
  event:   { icon: Calendar,   color: '#f59e0b', bg: 'border-[#f59e0b]/20', label: 'EVENT' },
  sale:    { icon: Tag,        color: '#FF006E', bg: 'border-[#FF006E]/20', label: 'SALE' },
};

const FILTERS = [
  { id: 'all',     label: 'ALL' },
  { id: 'feature', label: 'FEATURES' },
  { id: 'update',  label: 'UPDATES' },
  { id: 'fix',     label: 'FIXES' },
  { id: 'event',   label: 'EVENTS' },
  { id: 'sale',    label: 'SALES & DLC' },
] as const;

interface NewsPageProps {
  onNavigateHome: () => void;
}

export function NewsPage({ onNavigateHome }: NewsPageProps) {
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? NEWS_ITEMS : NEWS_ITEMS.filter(n => n.type === filter);

  return (
    <div className="min-h-full p-6 md:p-10" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={onNavigateHome}
            className="text-xs text-gray-500 hover:text-[#00E5FF] transition-colors flex items-center gap-1"
          >
            ← BACK
          </button>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <Megaphone size={28} className="text-[#00E5FF]" />
          <h1 className="text-4xl font-bold tracking-widest text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            NEWS & UPDATES
          </h1>
        </div>
        <p className="text-xs text-gray-500 mb-8">
          Latest FightBracket Pro patches, features, community events, and game news.
        </p>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest transition-all border ${
                filter === f.id
                  ? 'bg-[#00E5FF]/10 border-[#00E5FF]/60 text-[#00E5FF]'
                  : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* News Cards */}
        <div className="space-y-4">
          {filtered.map(item => {
            const cfg = TYPE_CONFIG[item.type];
            const Icon = cfg.icon;
            return (
              <div
                key={item.id}
                className={`bg-[#050A14] border ${cfg.bg} rounded-xl p-5 transition-all hover:brightness-110`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className="p-2 rounded-lg shrink-0 mt-0.5"
                      style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}30` }}
                    >
                      <Icon size={16} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded"
                          style={{ background: `${cfg.color}15`, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded bg-white/5 text-gray-400">
                            {item.badge}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-600">{item.date}</span>
                      </div>
                      <h2 className="text-base font-bold text-white mb-1" style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.1rem' }}>
                        {item.title}
                      </h2>
                      <p className="text-xs text-gray-400 leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 flex items-center gap-1 text-[10px] text-gray-500 hover:text-[#00E5FF] transition-colors mt-1"
                    >
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <Trophy size={40} className="mx-auto mb-4" />
            <p className="text-sm">No items in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
